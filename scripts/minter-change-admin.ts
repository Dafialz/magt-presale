// scripts/minter-change-admin.ts
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, beginCell, toNano } from "@ton/core";
import {
  TonClient, internal,
  WalletContractV5R1, WalletContractV4, WalletContractV3R2, OpenedContract,
} from "@ton/ton";
// офіційний парсер wallet_id для v5r1
import { loadWalletIdV5R1 } from "@ton/ton/dist/wallets/v5r1/WalletV5R1WalletId";
import { mnemonicToPrivateKey } from "@ton/crypto";

/** ============ ENV ============ **/
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath  = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const MAGT_MINTER        = Address.parse(process.env.MAGT_MINTER!);
const ADMIN_ADDRESS      = Address.parse(process.env.ADMIN_ADDRESS!);       // поточний адмін (зараз у мінтері)
const NEW_ADMIN_ADDRESS  = Address.parse(process.env.NEW_ADMIN_ADDRESS!);   // новий адмін
const MNEMONIC           = process.env.MNEMONIC || "";
const ADMIN_SECRET_HEX   = (process.env.ADMIN_SECRET_HEX || "").replace(/\s+/g, "");
const NETWORK            = (process.env.NETWORK || "mainnet").toLowerCase();
const TONCENTER_API_KEY  = process.env.TONCENTER_API_KEY || undefined;

if (!MAGT_MINTER || !ADMIN_ADDRESS || !NEW_ADMIN_ADDRESS) {
  throw new Error("MAGT_MINTER, ADMIN_ADDRESS, NEW_ADMIN_ADDRESS обовʼязкові у .env.local");
}
if (!ADMIN_SECRET_HEX && !MNEMONIC) {
  throw new Error("Додай або ADMIN_SECRET_HEX (hex приватного ключа), або MNEMONIC (24 слова) у .env.local");
}

const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });

// networkGlobalId для v5 (офіційні значення)
const NET_GID = NETWORK === "mainnet" ? -239 : -3;

function fmt(a: Address, bounceable = false) {
  return a.toString({ bounceable, urlSafe: true, testOnly: NETWORK !== "mainnet" });
}

async function getSecretKey(): Promise<Buffer> {
  if (ADMIN_SECRET_HEX) return Buffer.from(ADMIN_SECRET_HEX, "hex");
  const { secretKey } = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
  return Buffer.from(secretKey);
}

// Відкриваємо гаманець АДМІНА по типу контракту з ончейна
async function openAdminWallet(): Promise<{ kind: "v5r1" | "v4" | "v3r2"; admin: OpenedContract<any>; secretKey: Buffer }> {
  const secretKey = await getSecretKey();

  // 1) Спроба v5r1: у гаманця є метод get_wallet_id
  try {
    const r = await client.runMethod(ADMIN_ADDRESS, "get_wallet_id", []);
    // повертає int (bigint); треба розпарсити до структури WalletId
    const idBig: bigint = (r.stack as any).readBigInt?.() ?? BigInt((r.stack as any).readNumber());
    const walletId = loadWalletIdV5R1(idBig, NET_GID);

    // Створюємо інстанс із "заглушкою" публічного ключа — він нам не потрібен для підпису.
    // Через недоліки типів у @ton/ton робимо каст на створенні.
    const dummyPub = Buffer.alloc(32, 0);
    const v5 = WalletContractV5R1.create({ publicKey: dummyPub, walletId } as any);

    // Адреса, яку рахує конструктор, може не збігтись (бо dummy pubkey) — підставляємо фактичну.
    (v5 as any).address = ADMIN_ADDRESS;

    const admin = client.open(v5);
    (admin as any).__secretKey = secretKey;

    console.log("✔ Детектовано wallet_v5r1 (Tonkeeper v5)");
    return { kind: "v5r1", admin, secretKey };
  } catch {
    /* не v5 — йдемо далі */
  }

  // 2) Спроба v4/v3r2: читаємо subwallet_id
  const idRes = await client.runMethod(ADMIN_ADDRESS, "get_subwallet_id", []);
  const subId = Number((idRes.stack as any).readNumber()) >>> 0;

  // Пробуємо v4
  {
    const dummyPub = Buffer.alloc(32, 0);
    const v4 = WalletContractV4.create({ publicKey: dummyPub, workchain: 0, walletId: subId as any });
    (v4 as any).address = ADMIN_ADDRESS;

    const admin = client.open(v4);
    (admin as any).__secretKey = secretKey;

    // перевірка, що контракт реально відповідає (seqno не кине метод not found)
    await admin.getSeqno().catch(() => { throw new Error("skip v4"); });

    console.log(`✔ Детектовано wallet_v4 (walletId=${subId})`);
    return { kind: "v4", admin, secretKey };
  }

  // Якщо вище впаде — спробуємо v3r2 (рідко потрібно)
  try {
    const dummyPub = Buffer.alloc(32, 0);
    const v3 = WalletContractV3R2.create({ publicKey: dummyPub, workchain: 0, walletId: subId as any });
    (v3 as any).address = ADMIN_ADDRESS;

    const admin = client.open(v3);
    (admin as any).__secretKey = secretKey;

    await admin.getSeqno(); // перевірка
    console.log(`✔ Детектовано wallet_v3r2 (walletId=${subId})`);
    return { kind: "v3r2", admin, secretKey };
  } catch {
    throw new Error("Не вдалося відкрити гаманець поточного адміна: не схожий ні на v5р1, ні на v4/v3r2.");
  }
}

async function main() {
  const { kind, admin, secretKey } = await openAdminWallet();

  console.log("MINTER:", fmt(MAGT_MINTER));
  console.log("ADMIN :", fmt(admin.address));
  console.log("NEW   :", fmt(NEW_ADMIN_ADDRESS));
  console.log("TYPE  :", kind);

  // Jetton v1: change_admin (op=3)
  const body = beginCell()
    .storeUint(3, 32)        // op::change_admin
    .storeUint(0n, 64)       // query_id
    .storeAddress(NEW_ADMIN_ADDRESS)
    .endCell();

  const seqno = await admin.getSeqno();
  await admin.sendTransfer({
    secretKey,
    seqno,
    sendMode: 3,
    messages: [internal({ to: MAGT_MINTER, value: toNano("0.05"), body })],
  });

  console.log("✅ Запит change_admin відправлено. Через кілька блоків перевірте: npm run minter:admin");
}

main().catch((e) => { console.error(e); process.exit(1); });

// scripts/seed-sale-from-admin.ts
// Переслати MAGT з ADMIN_JW → SALE_JW (deploy SALE_JW за потреби)

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, beginCell, toNano } from "@ton/core";
import {
  TonClient,
  internal,
  WalletContractV5R1,
  WalletContractV4,
  WalletContractV3R2,
  OpenedContract,
} from "@ton/ton";
import { loadWalletIdV5R1 } from "@ton/ton/dist/wallets/v5r1/WalletV5R1WalletId";
import { mnemonicToPrivateKey } from "@ton/crypto";

/** ====== ENV ====== **/
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const MNEMONIC = (process.env.MNEMONIC || "").trim();
const ADMIN_SECRET_HEX = (process.env.ADMIN_SECRET_HEX || "").replace(/\s+/g, "");
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || "").trim();
const MAGT_MINTER = (process.env.MAGT_MINTER || "").trim();
const MAGT_DECIMALS = BigInt(process.env.MAGT_DECIMALS || "9");
const SALE_ADDRESS = (process.env.SALE_ADDRESS || "").trim();
const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || undefined;
// auto | v5r1 | v4 | v3r2
const ADMIN_WALLET_KIND = (process.env.ADMIN_WALLET_KIND || "auto").toLowerCase();

if (!ADMIN_ADDRESS || !MAGT_MINTER || !SALE_ADDRESS) {
  throw new Error("ADMIN_ADDRESS, MAGT_MINTER, SALE_ADDRESS потрібні у .env.local");
}
if (!ADMIN_SECRET_HEX && !MNEMONIC) {
  throw new Error("Вкажіть або ADMIN_SECRET_HEX, або MNEMONIC у .env.local");
}

const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });
const NET_GID = NETWORK === "mainnet" ? -239 : -3;

// ===== helpers =====
function biTo32(bi: bigint) {
  let h = bi.toString(16);
  if (h.length % 2) h = "0" + h;
  const b = Buffer.from(h, "hex");
  if (b.length > 32) return b.slice(-32);
  if (b.length < 32) return Buffer.concat([Buffer.alloc(32 - b.length, 0), b]);
  return b;
}
async function readPublicKey(addr: Address): Promise<Buffer> {
  const r: any = await client.runMethod(addr, "get_public_key", []);
  try { return biTo32(r.stack.readBigInt()); }
  catch { try { return biTo32(BigInt(r.stack.readNumber())); }
  catch { const cell = r.stack.readCell(); const s = cell.beginParse(); return biTo32(s.loadUintBig(256)); } }
}
async function getSecretKey(): Promise<Buffer> {
  if (ADMIN_SECRET_HEX) return Buffer.from(ADMIN_SECRET_HEX, "hex");
  const kp = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
  return Buffer.from(kp.secretKey);
}
async function forceOpenV5R1(addr: Address, secretKey: Buffer): Promise<OpenedContract<any>> {
  const pub = await readPublicKey(addr);
  let walletId: any | null = null;
  try {
    const r: any = await client.runMethod(addr, "get_wallet_id", []);
    const idBig: bigint = r.stack.readBigInt?.() ?? BigInt(r.stack.readNumber());
    walletId = loadWalletIdV5R1(idBig, NET_GID) as any;
    console.log("  • get_wallet_id OK");
  } catch {
    const rs: any = await client.runMethod(addr, "get_subwallet_id", []);
    const sub = Number(rs.stack.readNumber()) >>> 0;
    walletId = { workchain: 0, subwalletNumber: sub, networkGlobalId: NET_GID } as any;
    console.log(`  • get_wallet_id N/A, using subwallet_id=${sub}`);
  }
  const v5 = WalletContractV5R1.create({ publicKey: pub, walletId } as any);
  if (!v5.address.equals(addr)) (v5 as any).address = addr;
  const oc = client.open(v5);
  (oc as any).__secretKey = secretKey;
  await oc.getSeqno();
  return oc;
}
async function openAdminWallet(): Promise<{ admin: OpenedContract<any>; secretKey: Buffer; kind: "v5r1"|"v4"|"v3r2" }> {
  const secretKey = await getSecretKey();
  const target = Address.parse(ADMIN_ADDRESS);

  if (ADMIN_WALLET_KIND === "v5r1") {
    const admin = await forceOpenV5R1(target, secretKey);
    console.log("✔ ADMIN wallet = v5r1 (forced)");
    return { admin, secretKey, kind: "v5r1" };
  }
  if (ADMIN_WALLET_KIND === "auto") {
    try {
      const admin = await forceOpenV5R1(target, secretKey);
      console.log("✔ ADMIN wallet = v5r1");
      return { admin, secretKey, kind: "v5r1" };
    } catch {}
  }

  const subIdRes: any = await client.runMethod(target, "get_subwallet_id", []);
  const subId = Number(subIdRes.stack.readNumber()) >>> 0;

  try {
    const v4 = WalletContractV4.create({ publicKey: await readPublicKey(target), workchain: 0, walletId: subId as any });
    if (!v4.address.equals(target)) (v4 as any).address = target;
    const admin = client.open(v4); (admin as any).__secretKey = secretKey; await admin.getSeqno();
    console.log(`✔ ADMIN wallet = v4 (walletId=${subId})`);
    return { admin, secretKey, kind: "v4" };
  } catch {}

  const v3 = WalletContractV3R2.create({ publicKey: await readPublicKey(target), workchain: 0, walletId: subId as any });
  if (!v3.address.equals(target)) (v3 as any).address = target;
  const admin = client.open(v3); (admin as any).__secretKey = secretKey; await admin.getSeqno();
  console.log(`✔ ADMIN wallet = v3r2 (walletId=${subId})`);
  return { admin, secretKey, kind: "v3r2" };
}

async function getJW(minter: Address, owner: Address): Promise<Address> {
  const r: any = await client.runMethod(minter, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
  ]);
  return r.stack.readAddress();
}
async function readJWBalance(jw: Address): Promise<bigint> {
  try {
    const r: any = await client.runMethod(jw, "get_wallet_data", []);
    return r.stack.readBigNumber();
  } catch (e: any) {
    if (String(e?.message || "").includes("exit_code: -13")) return 0n; // ще не розгорнутий
    throw e;
  }
}

// human MAGT -> atoms
function parseAtoms(human: string): bigint {
  const s = human.trim();
  if (!s.includes(".")) return BigInt(s) * (10n ** MAGT_DECIMALS);
  const [i, fRaw] = s.split(".");
  const f = (fRaw + "0".repeat(Number(MAGT_DECIMALS))).slice(0, Number(MAGT_DECIMALS));
  return BigInt(i || "0") * (10n ** MAGT_DECIMALS) + BigInt(f || "0");
}
function humanFromAtoms(v: bigint): string {
  const base = 10n ** MAGT_DECIMALS;
  const int = v / base;
  const frac = (v % base).toString().padStart(Number(MAGT_DECIMALS), "0").replace(/0+$/, "");
  return frac ? `${int}.${frac}` : `${int}`;
}

async function main() {
  // args: amount [--fwd=0.2] [--msg=0.3]
  const argv = process.argv.slice(2);
  const HUMAN = (argv.find(a => !a.startsWith("--")) ?? "1").trim();
  const CLI_FWD = argv.find(a => a.startsWith("--fwd="))?.split("=")[1] || "0.20";
  const CLI_MSG = argv.find(a => a.startsWith("--msg="))?.split("=")[1] || "0.35";

  const amount = parseAtoms(HUMAN);
  const forwardTon = toNano(CLI_FWD);
  const messageValue = toNano(CLI_MSG);

  const minter = Address.parse(MAGT_MINTER);
  const adminOwner = Address.parse(ADMIN_ADDRESS);
  const saleOwner = Address.parse(SALE_ADDRESS);

  const { admin, secretKey, kind } = await openAdminWallet();

  const adminJW = await getJW(minter, adminOwner);
  const saleJW = await getJW(minter, saleOwner);

  console.log("ADMIN_JW:", adminJW.toString({ urlSafe: true, bounceable: false }));
  console.log("SALE_JW :", saleJW.toString({ urlSafe: true, bounceable: false }));

  const balA = await readJWBalance(adminJW);
  const balS = await readJWBalance(saleJW);
  console.log("ADMIN_JW balance:", humanFromAtoms(balA));
  console.log("SALE_JW  balance:", humanFromAtoms(balS));

  if (balA < amount) {
    throw new Error(`На ADMIN_JW замало MAGT. Потрібно >= ${humanFromAtoms(amount)} MAGT`);
  }

  // TIP-3 (Jetton v1) transfer op
  const OP_TRANSFER = 0x0f8a7ea5;

  // forward_payload: Either<Cell,^Cell> → порожній = .storeBit(0)
  const body = beginCell()
    .storeUint(OP_TRANSFER, 32)
    .storeUint(0, 64)                 // query_id
    .storeCoins(amount)               // amount in atoms
    .storeAddress(saleOwner)          // destination (OWNER адреса, не JW!)
    .storeAddress(admin.address)      // response_destination (адмін)
    .storeMaybeRef(null)              // custom_payload = null
    .storeCoins(forwardTon)           // forward_ton_amount → на приймач (для deploy SALE_JW)
    .storeBit(0)                      // forward_payload = empty
    .endCell();

  const balTON = await client.getBalance(admin.address);
  if (balTON < toNano("0.2")) throw new Error("Мало TON на адмінському гаманці для gas (>=0.2 TON)");

  const seqno = await admin.getSeqno();
  await admin.sendTransfer({
    secretKey,
    seqno,
    sendMode: 3,
    messages: [
      internal({
        to: adminJW,                 // надсилаємо САМЕ в ADMIN_JW
        value: messageValue,         // достатньо для gas + forward
        body,
      }),
    ],
  });

  console.log(`✅ transfer sent: ${HUMAN} MAGT  ADMIN_JW → SALE_JW (forwardTon=${CLI_FWD} TON, value=${CLI_MSG} TON)`);
  console.log(`   Admin wallet ${kind}: ${admin.address.toString({urlSafe:true,bounceable:false})}`);

  // просте очікування і повторне читання балансів
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 7000));
    const a2 = await readJWBalance(adminJW);
    const s2 = await readJWBalance(saleJW);
    const dA = a2 - balA;
    const dS = s2 - balS;
    if (dS > 0n || dA < 0n) {
      console.log("ADMIN_JW balance now:", humanFromAtoms(a2));
      console.log("SALE_JW  balance now:", humanFromAtoms(s2));
      console.log("🎉 Готово. SALE_JW має ліквідність.");
      return;
    }
    console.log(`  ...ще немає оновлення (${i + 1}/12)`);
  }

  console.warn("⚠️ Баланс поки без змін. Перевір джеттон-транзакцію в експлорері або підвищи --fwd/--msg і повтори.");
}

main().catch((e) => { console.error(e); process.exit(1); });

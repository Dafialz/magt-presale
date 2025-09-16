// scripts/buy-test.ts
// Тестова покупка: відправляємо X TON на SALE і показуємо баланс MAGT покупця

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, beginCell, toNano } from "@ton/core";
import { TonClient, WalletContractV5R1, internal, SendMode } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

// ====== ENV ======
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const MNEMONIC = (process.env.BUYER_MNEMONIC || process.env.MNEMONIC || "").trim();
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || "").trim();
const MAGT_MINTER = (process.env.MAGT_MINTER || "").trim();
const SALE_ADDRESS = (process.env.SALE_ADDRESS || "").trim();
const REF_ADDRESS = (process.env.REF_ADDRESS || "").trim(); // опційно
const MAGT_DECIMALS = Number(process.env.MAGT_DECIMALS || "9");
const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || undefined;

if (!MNEMONIC || !ADMIN_ADDRESS || !MAGT_MINTER || !SALE_ADDRESS) {
  throw new Error("BUYER_MNEMONIC/MNEMONIC, ADMIN_ADDRESS, MAGT_MINTER, SALE_ADDRESS required");
}

const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });

// ====== helpers ======
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const human = (v: bigint, d = MAGT_DECIMALS) => {
  const base = BigInt(10) ** BigInt(d);
  const int = v / base;
  const frac = (v % base).toString().padStart(d, "0").replace(/0+$/, "");
  return frac ? `${int}.${frac}` : `${int}`;
};

async function getJW(minter: Address, owner: Address) {
  const r = await client.runMethod(minter, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
  ]);
  return r.stack.readAddress();
}

async function readJWBalance(jw: Address): Promise<bigint> {
  try {
    const r = await client.runMethod(jw, "get_wallet_data", []);
    return r.stack.readBigNumber(); // nano-jettons (10^decimals)
  } catch (e: any) {
    if (String(e?.message || "").includes("exit_code: -13")) return 0n; // JW ще не розгорнутий
    throw e;
  }
}

async function verifyMinter(minter: Address) {
  // TIP-3/Jetton: get_jetton_data() -> total_supply(uint256), mintable(bool), admin(address), content(cell), code(cell)
  try {
    const r = await client.runMethod(minter, "get_jetton_data", []);
    const total = r.stack.readBigNumber();
    const mintable = r.stack.readBoolean();
    const admin = r.stack.readAddress();
    // з’їдаємо решту зі стеку
    r.stack.readCell();
    r.stack.readCell();

    console.log("MINTER verify:");
    console.log("  total_supply:", total.toString());
    console.log("  mintable    :", mintable);
    console.log("  admin       :", admin.toString({ urlSafe: true, bounceable: false }));

    const expected = Address.parse(ADMIN_ADDRESS).toString({ urlSafe: true, bounceable: false });
    if (admin.toString({ urlSafe: true, bounceable: false }) !== expected) {
      console.warn("⚠️  Admin у мінтері НЕ збігається з ADMIN_ADDRESS з .env.local");
    } else {
      console.log("✅ Admin у мінтері збігається з .env.local");
    }
  } catch (e) {
    console.warn("⚠️  Не вдалося прочитати get_jetton_data (не критично):", (e as any)?.message || e);
  }
}

// ====== MAIN ======
async function main() {
  const amountTON = parseFloat(process.argv[2] || "0.2"); // можна передати суму як аргумент
  const buyValue = toNano(amountTON.toString());

  // buyer wallet (V5R1!)
  const mnems = MNEMONIC.split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mnems);
  const buyer = WalletContractV5R1.create({ publicKey: keyPair.publicKey, workchain: 0 });
  const buyerC = client.open(buyer);

  console.log("Buyer wallet (EQ):", buyerC.address.toString());
  console.log("Buyer wallet (UQ):", buyerC.address.toString({ urlSafe: true, bounceable: false }));

  // баланс покупця (корисно попередити про низький баланс)
  try {
    const bal = await client.getBalance(buyerC.address);
    console.log("Buyer TON balance:", bal.toString(), "nanoTON");
    if (bal < toNano("0.25")) {
      console.warn("⚠️  Низький баланс покупця. Рекомендовано мати ≥ 0.25 TON для газу.");
    }
  } catch {}

  const admin = Address.parse(ADMIN_ADDRESS);
  const minter = Address.parse(MAGT_MINTER);
  const sale = Address.parse(SALE_ADDRESS);

  // перевіримо мінтер (справжність монети)
  await verifyMinter(minter);

  // Справжній SALE_JW напряму від мінтера
  const saleJW = await getJW(minter, sale);
  console.log("SALE (EQ):", sale.toString());
  console.log("SALE (UQ):", sale.toString({ urlSafe: true, bounceable: false }));
  console.log("SALE_JW (EQ):", saleJW.toString());
  console.log("SALE_JW (UQ):", saleJW.toString({ urlSafe: true, bounceable: false }));

  // Переконаймося, що на SALE_JW є MAGT
  const saleBal = await readJWBalance(saleJW);
  console.log("SALE_JW balance (raw):", saleBal.toString(), "| human:", human(saleBal));
  if (saleBal === 0n) {
    console.error("❌ На SALE_JW немає MAGT. Залий MAGT і повтори покупку:");
    console.error("   npm run mint:sale -- 10000");
    process.exit(2);
  }

  // Попередній баланс покупця
  const buyerJW = await getJW(minter, buyerC.address);
  console.log("Buyer JW (EQ):", buyerJW.toString());
  console.log("Buyer JW (UQ):", buyerJW.toString({ urlSafe: true, bounceable: false }));
  const before = await readJWBalance(buyerJW);
  console.log("Buyer MAGT before (raw):", before.toString(), " | human:", human(before));

  // Формуємо body з OP_BUY (+ опціональний реферал)
  const OP_BUY = 0xb0a1cafe;
  const hasRef = !!REF_ADDRESS;
  const body = beginCell()
    .storeUint(OP_BUY, 32)
    .storeBit(hasRef) // maybe_referrer
    .storeMaybeRef(null); // не використовуємо custom payload всередині
  if (hasRef) {
    body.storeAddress(Address.parse(REF_ADDRESS));
  }
  const bodyCell = body.endCell();

  // Надсилаємо TON на SALE з body
  const seqno = await buyerC.getSeqno();
  console.log(`Sending ${amountTON} TON to SALE...`);
  await buyerC.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({
        to: sale,
        value: buyValue,
        bounce: true,
        body: bodyCell,
      }),
    ],
  });

  console.log("TX sent. Чекаємо оновлення балансу ...");
  let after = before;
  for (let i = 0; i < 12; i++) {
    await sleep(6000);
    after = await readJWBalance(buyerJW);
    if (after > before) break;
    console.log(`  ...ще немає оновлення (${i + 1}/12)`);
  }

  console.log("Buyer MAGT after (raw):", after.toString(), " | human:", human(after));
  console.log(`Отримано ≈ ${human(after - before)} MAGT`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

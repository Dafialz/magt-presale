// scripts/mint-to-sale.ts
// Mint MAGT на адресу SALE, щоб розгорнути SALE_JW і дати ліквідність

/* eslint-disable */
// @ts-nocheck

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
// v5r1 | v4 | v3r2 | auto
const ADMIN_WALLET_KIND = (process.env.ADMIN_WALLET_KIND || "auto").toLowerCase();

// CLI / overrides
const argv = process.argv.slice(2);
const HUMAN_AMOUNT = (argv.find((a) => !a.startsWith("--")) ?? "100000").trim();
const CLI_FWD  = argv.find((a) => a.startsWith("--fwd="))?.split("=")[1];
const CLI_MSG  = argv.find((a) => a.startsWith("--msg="))?.split("=")[1];
const CLI_OP   = (argv.find((a) => a.startsWith("--op="))?.split("=")[1] || "auto").toLowerCase(); // auto|642b7d07|178d4519
const CLI_RESP = (argv.find((a) => a.startsWith("--resp="))?.split("=")[1] || "admin").toLowerCase(); // admin|owner

const MINT_FORWARD_TON = CLI_FWD || process.env.MINT_FORWARD_TON || "0.20";
const MINT_MESSAGE_TON = CLI_MSG || process.env.MINT_MESSAGE_TON || "0.40";

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

// networkGlobalId для v5
const NET_GID = NETWORK === "mainnet" ? -239 : -3;

function fmt(addr: Address | string, bounceable = true) {
  const a = typeof addr === "string" ? Address.parse(addr) : addr;
  return a.toString({ bounceable, urlSafe: true, testOnly: NETWORK !== "mainnet" });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

// MAGT human -> atoms
function parseJettonAmount(human: string): bigint {
  const s = human.trim();
  if (!s.includes(".")) return BigInt(s) * 10n ** MAGT_DECIMALS;
  const [i, fRaw] = s.split(".");
  const f = (fRaw + "0".repeat(Number(MAGT_DECIMALS))).slice(0, Number(MAGT_DECIMALS));
  return BigInt(i || "0") * 10n ** MAGT_DECIMALS + BigInt(f || "0");
}
function humanFromAtoms(v: bigint): string {
  const base = 10n ** MAGT_DECIMALS;
  const int = v / base;
  const frac = (v % base).toString().padStart(Number(MAGT_DECIMALS), "0").replace(/0+$/, "");
  return frac ? `${int}.${frac}` : `${int}`;
}

async function getSecretKey(): Promise<Buffer> {
  if (ADMIN_SECRET_HEX) return Buffer.from(ADMIN_SECRET_HEX, "hex");
  const kp = await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/));
  return Buffer.from(kp.secretKey);
}

// Відкриваємо v5r1 навіть якщо get_wallet_id не відповів
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

async function openAdminWallet(): Promise<{ admin: OpenedContract<any>; secretKey: Buffer; kind: "v5r1" | "v4" | "v3r2" }> {
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

// Реальний JW: get_wallet_address(minter, SALE_ADDRESS)
async function getSaleJW(minter: Address, saleOwner: Address): Promise<Address> {
  const r: any = await client.runMethod(minter, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(saleOwner).endCell() },
  ]);
  return r.stack.readAddress();
}
async function readJWBalance(jw: Address): Promise<bigint> {
  try {
    const r: any = await client.runMethod(jw, "get_wallet_data", []);
    return r.stack.readBigNumber();
  } catch (e: any) {
    if (String(e?.message || "").includes("exit_code: -13")) return 0n;
    throw e;
  }
}

// Вибір опкоду mint
function pickMintOpcode(): number {
  if (CLI_OP === "178d4519") return 0x178d4519;
  if (CLI_OP === "642b7d07") return 0x642b7d07;
  return 0x178d4519; // auto: пробуємо 0x178d4519 як більш сумісний
}

async function main() {
  const amountAtoms = parseJettonAmount(HUMAN_AMOUNT);

  const minter = Address.parse(MAGT_MINTER);
  const saleOwner = Address.parse(SALE_ADDRESS);
  const adminAddr = Address.parse(ADMIN_ADDRESS);

  const { admin, secretKey, kind } = await openAdminWallet();

  const bal = await client.getBalance(admin.address);
  if (bal < toNano("0.5")) {
    throw new Error(`Адмінський гаманець має замало TON для gas. Потрібно >= 0.5 TON. Зараз: ${bal.toString()} nanoTON`);
  }

  const saleJW = await getSaleJW(minter, saleOwner);
  console.log("SALE (EQ):", saleOwner.toString());
  console.log("SALE (UQ):", saleOwner.toString({ urlSafe: true, bounceable: false }));
  console.log("SALE_JW (EQ):", saleJW.toString());
  console.log("SALE_JW (UQ):", saleJW.toString({ urlSafe: true, bounceable: false }));

  const before = await readJWBalance(saleJW);
  console.log("SALE_JW balance before (raw):", before.toString(), "| human:", humanFromAtoms(before));

  const OP_MINT = pickMintOpcode();
  const queryId = 0n;
  const forwardTon = toNano(MINT_FORWARD_TON);
  const messageValue = toNano(MINT_MESSAGE_TON);

  // response_destination: за замовчуванням ADMIN (щоб повторити поведінку web-мінера),
  // можна змінити через --resp=owner
  const responseDest = CLI_RESP === "owner" ? saleOwner : adminAddr;

  // --- ВАЖЛИВО: forward_payload = "Either Cell ^Cell" → порожній кодуємо одним бітом `0` ---
  const body = beginCell()
    .storeUint(OP_MINT, 32)
    .storeUint(queryId, 64)
    .storeCoins(amountAtoms)
    .storeAddress(saleOwner)      // owner (одержувач MAGT)
    .storeAddress(responseDest)   // response_destination
    .storeMaybeRef(null)          // custom_payload = null
    .storeCoins(forwardTon)       // форвард на JW
    .storeBit(0)                  // ✅ empty forward_payload (Either: 0 = no cell)
    .endCell();

  console.log(`DEBUG mint opcode = 0x${OP_MINT.toString(16)}  resp=${responseDest.toString({urlSafe:true,bounceable:false})}`);

  const seqno = await admin.getSeqno();
  await admin.sendTransfer({
    secretKey,
    seqno,
    sendMode: 3,
    messages: [internal({ to: minter, value: messageValue, body })],
  });

  console.log(`✅ Mint request sent: ${HUMAN_AMOUNT} MAGT -> SALE (${fmt(saleOwner)})`);
  console.log(`   Minter:  ${fmt(minter)}`);
  console.log(`   Admin:   ${fmt(admin.address)} (wallet ${kind})`);
  console.log(`   Gas: value=${MINT_MESSAGE_TON} TON, forwardTon=${MINT_FORWARD_TON} TON`);

  // Очікуємо оновлення балансу
  let after = before;
  for (let i = 0; i < 12; i++) {
    await sleep(7000);
    after = await readJWBalance(saleJW);
    if (after > before) break;
    console.log(`  ...ще немає оновлення (${i + 1}/12)`);
  }
  console.log("SALE_JW balance after  (raw):", after.toString(), "| human:", humanFromAtoms(after));

  if (after === before) {
    console.error("❌ Баланс не змінився. Зніми трейс мінтера й кинь лог:");
    console.error("   npx ts-node -P tsconfig.scripts.json scripts/trace-mint.ts 50 --verbose");
    console.error("Також можна поекспериментувати з опкодом та resp:");
    console.error("   npm run mint:sale -- 1 -- --op=642b7d07 --resp=owner");
    process.exit(2);
  } else {
    console.log("Готово. Тепер: npm run buy:test -- 0.2");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

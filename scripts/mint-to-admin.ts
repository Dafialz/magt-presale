// scripts/mint-to-admin.ts
// Мінт невеликої суми MAGT на JettonWallet АДМІНА, щоб перевірити коректність формату mint

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

const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const MNEMONIC = (process.env.MNEMONIC || "").trim();
const ADMIN_SECRET_HEX = (process.env.ADMIN_SECRET_HEX || "").replace(/\s+/g, "");
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || "").trim();
const MAGT_MINTER = (process.env.MAGT_MINTER || "").trim();
const MAGT_DECIMALS = BigInt(process.env.MAGT_DECIMALS || "9");
const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || undefined;
const ADMIN_WALLET_KIND = (process.env.ADMIN_WALLET_KIND || "auto").toLowerCase();

if (!MNEMONIC && !ADMIN_SECRET_HEX) throw new Error("Need MNEMONIC or ADMIN_SECRET_HEX");
if (!ADMIN_ADDRESS || !MAGT_MINTER) throw new Error("ADMIN_ADDRESS and MAGT_MINTER required");

const endpoint =
  NETWORK === "mainnet" ? "https://toncenter.com/api/v2/jsonRPC" : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });
const NET_GID = NETWORK === "mainnet" ? -239 : -3;

function biTo32(bi: bigint) {
  let h = bi.toString(16);
  if (h.length % 2) h = "0" + h;
  const b = Buffer.from(h, "hex");
  if (b.length > 32) return b.slice(-32);
  if (b.length < 32) return Buffer.concat([Buffer.alloc(32 - b.length, 0), b]);
  return b;
}
async function readPublicKey(addr: Address): Promise<Buffer> {
  const r = await client.runMethod(addr, "get_public_key", []);
  try { return biTo32((r.stack as any).readBigInt()); }
  catch { try { return biTo32(BigInt((r.stack as any).readNumber())); }
  catch { const cell = (r.stack as any).readCell(); const s = cell.beginParse(); return biTo32(s.loadUintBig(256)); } }
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
    const r = await client.runMethod(addr, "get_wallet_id", []);
    const idBig: bigint = (r.stack as any).readBigInt?.() ?? BigInt((r.stack as any).readNumber());
    walletId = loadWalletIdV5R1(idBig, NET_GID) as any;
    console.log("  • get_wallet_id OK");
  } catch {
    const rs = await client.runMethod(addr, "get_subwallet_id", []);
    const sub = Number((rs.stack as any).readNumber()) >>> 0;
    walletId = { workchain: 0, subwalletNumber: sub, networkGlobalId: NET_GID } as any;
    console.log(`  • get_wallet_id N/A, using subwallet_id=${sub}`);
  }
  const v5 = WalletContractV5R1.create({ publicKey: pub, walletId } as any);
  if (!v5.address.equals(addr)) (v5 as any).address = addr;
  const oc = client.open(v5); (oc as any).__secretKey = secretKey; await oc.getSeqno(); return oc;
}
async function openAdminWallet(): Promise<{ admin: OpenedContract<any>; secretKey: Buffer; kind: string }> {
  const secretKey = await getSecretKey();
  const target = Address.parse(ADMIN_ADDRESS);
  if (ADMIN_WALLET_KIND === "v5r1" || ADMIN_WALLET_KIND === "auto") {
    try { const admin = await forceOpenV5R1(target, secretKey); console.log("✔ ADMIN wallet = v5r1"); return { admin, secretKey, kind: "v5r1" }; }
    catch { if (ADMIN_WALLET_KIND === "v5r1") throw new Error("v5r1 open failed"); }
  }
  const subIdRes = await client.runMethod(target, "get_subwallet_id", []);
  const subId = Number((subIdRes.stack as any).readNumber()) >>> 0;
  try {
    const v4 = WalletContractV4.create({ publicKey: await readPublicKey(target), workchain: 0, walletId: subId as any });
    if (!v4.address.equals(target)) (v4 as any).address = target;
    const admin = client.open(v4); (admin as any).__secretKey = secretKey; await admin.getSeqno();
    console.log(`✔ ADMIN wallet = v4 (walletId=${subId})`); return { admin, secretKey, kind: "v4" };
  } catch {}
  const v3 = WalletContractV3R2.create({ publicKey: await readPublicKey(target), workchain: 0, walletId: subId as any });
  if (!v3.address.equals(target)) (v3 as any).address = target;
  const admin = client.open(v3); (admin as any).__secretKey = secretKey; await admin.getSeqno();
  console.log(`✔ ADMIN wallet = v3r2 (walletId=${subId})`); return { admin, secretKey, kind: "v3r2" };
}

// get admin JW
async function getJW(minter: Address, owner: Address): Promise<Address> {
  const r = await client.runMethod(minter, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
  ]);
  return r.stack.readAddress();
}
async function readJWBalance(jw: Address): Promise<bigint> {
  try { const r = await client.runMethod(jw, "get_wallet_data", []); return r.stack.readBigNumber(); }
  catch (e: any) { if (String(e?.message || "").includes("exit_code: -13")) return 0n; throw e; }
}
function parseAtoms(human: string): bigint {
  const s = human.trim();
  if (!s.includes(".")) return BigInt(s) * 10n ** MAGT_DECIMALS;
  const [i, fRaw] = s.split(".");
  const f = (fRaw + "0".repeat(Number(MAGT_DECIMALS))).slice(0, Number(MAGT_DECIMALS));
  return BigInt(i || "0") * 10n ** MAGT_DECIMALS + BigInt(f || "0");
}
const humanFromAtoms = (v: bigint) => {
  const d = Number(MAGT_DECIMALS); const base = 10n ** BigInt(d); const int = v / base;
  const frac = (v % base).toString().padStart(d, "0").replace(/0+$/, ""); return frac ? `${int}.${frac}` : `${int}`;
};

async function main() {
  const amountHuman = process.argv[2] ?? "11"; // маленький тестовий мінт
  const amountAtoms = parseAtoms(amountHuman);
  const minter = Address.parse(MAGT_MINTER);
  const owner = Address.parse(ADMIN_ADDRESS); // саме АДМІН як власник

  const { admin, secretKey } = await openAdminWallet();

  const adminJW = await getJW(minter, owner);
  console.log("ADMIN_JW (UQ):", adminJW.toString({ urlSafe: true, bounceable: false }));
  const before = await readJWBalance(adminJW);
  console.log("ADMIN_JW before:", before.toString());

  // Jetton-minter::mint (правильний op-код + порожні ref payload-и)
  const OP_MINT = 0x642b7d07;
  const emptyRef = beginCell().endCell();
  const body = beginCell()
    .storeUint(OP_MINT, 32)
    .storeUint(0, 64)
    .storeCoins(amountAtoms)
    .storeAddress(owner)           // <-- owner = ADMIN
    .storeAddress(admin.address)   // response_destination
    .storeRef(emptyRef)            // custom_payload (порожній ref)
    .storeCoins(toNano("0.2"))     // forward_ton_amount (на деплой/exec JW)
    .storeRef(emptyRef)            // forward_payload (порожній ref)
    .endCell();

  // DEBUG: перевіримо op-код у тілі
  const opCheck = body.beginParse().loadUint(32);
  console.log(`DEBUG mint body OP = 0x${opCheck.toString(16)}`);

  const seqno = await admin.getSeqno();
  await admin.sendTransfer({
    secretKey,
    seqno,
    sendMode: 3,
    messages: [internal({ to: minter, value: toNano("0.4"), body })],
  });

  // Невелике очікування та перевірка
  await new Promise((r) => setTimeout(r, 10000));
  const after = await readJWBalance(adminJW);
  console.log("ADMIN_JW after :", after.toString());
  console.log(`Δ = ${humanFromAtoms(after - before)} MAGT`);
}

main().catch((e) => { console.error(e); process.exit(1); });

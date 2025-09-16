// scripts/send-ton.ts
/* eslint-disable */
// @ts-nocheck

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, toNano, SendMode, beginCell } from "@ton/core";
import {
  TonClient,
  internal,
  WalletContractV5R1,
  WalletContractV4,
  WalletContractV3R2,
  OpenedContract,
} from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { loadWalletIdV5R1 } from "@ton/ton/dist/wallets/v5r1/WalletV5R1WalletId";

// ── ENV ────────────────────────────────────────────────────────────────────────
const envLocal = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env"), override: true });

const {
  ADMIN_ADDRESS = "",
  MNEMONIC = "",
  ADMIN_SECRET_HEX = "",
  NETWORK = "mainnet",
  TONCENTER_API_KEY,
} = process.env;

if (!ADMIN_ADDRESS) throw new Error("ADMIN_ADDRESS required");

const endpoint =
  NETWORK === "mainnet" ? "https://toncenter.com/api/v2/jsonRPC" : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });
const NET_GID = NETWORK === "mainnet" ? -239 : -3;

// ── helpers ───────────────────────────────────────────────────────────────────
async function readPublicKey(addr: Address): Promise<Buffer> {
  const r: any = await client.runMethod(addr, "get_public_key", []);
  try {
    return to32(r.stack.readBigInt());
  } catch {
    try {
      return to32(BigInt(r.stack.readNumber()));
    } catch {
      const cell = r.stack.readCell();
      const s = cell.beginParse();
      return to32(s.loadUintBig(256));
    }
  }
}
function to32(bi: bigint) {
  let h = bi.toString(16);
  if (h.length % 2) h = "0" + h;
  const b = Buffer.from(h, "hex");
  if (b.length > 32) return b.slice(-32);
  if (b.length < 32) return Buffer.concat([Buffer.alloc(32 - b.length, 0), b]);
  return b;
}

async function forceOpenV5R1(addr: Address, secretKey: Buffer): Promise<OpenedContract<any>> {
  const pub = await readPublicKey(addr);

  let walletId: any;
  try {
    const r: any = await client.runMethod(addr, "get_wallet_id", []);
    const idBig: bigint = r.stack.readBigInt?.() ?? BigInt(r.stack.readNumber());
    walletId = loadWalletIdV5R1(idBig, NET_GID);
  } catch {
    const rs: any = await client.runMethod(addr, "get_subwallet_id", []);
    const sub = Number(rs.stack.readNumber()) >>> 0;
    walletId = { workchain: 0, subwalletNumber: sub, networkGlobalId: NET_GID };
  }

  const v5 = WalletContractV5R1.create({ publicKey: pub, walletId } as any);
  (v5 as any).address = addr;
  const oc = client.open(v5);
  (oc as any).__secretKey = secretKey;
  await oc.getSeqno();
  return oc;
}

async function openAdmin() {
  const target = Address.parse(ADMIN_ADDRESS);
  const secretKey = ADMIN_SECRET_HEX
    ? Buffer.from(ADMIN_SECRET_HEX, "hex")
    : Buffer.from((await mnemonicToPrivateKey(MNEMONIC.trim().split(/\s+/))).secretKey);

  // v5r1 → v4 → v3r2
  try {
    return await forceOpenV5R1(target, secretKey);
  } catch {}
  try {
    const v4 = WalletContractV4.create({ publicKey: await readPublicKey(target), workchain: 0 });
    (v4 as any).address = target;
    const admin = client.open(v4);
    (admin as any).__secretKey = secretKey;
    await admin.getSeqno();
    return admin;
  } catch {}
  const v3 = WalletContractV3R2.create({ publicKey: await readPublicKey(target), workchain: 0 });
  (v3 as any).address = target;
  const admin = client.open(v3);
  (admin as any).__secretKey = secretKey;
  await admin.getSeqno();
  return admin;
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  const to = Address.parse(process.argv[2]!);
  const amount = toNano(process.argv[3] || "0.06");

  const admin = await openAdmin();
  const seqno = await admin.getSeqno();

  await admin.sendTransfer({
    secretKey: (admin as any).__secretKey,
    seqno,
    // ⬇️ виправлення: використовуємо enum, а не "3"
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [internal({ to, value: amount })],
  });

  console.log(
    `✔ Sent ${process.argv[3] || "0.06"} TON → ${to.toString({ urlSafe: true, bounceable: false })}`
  );
})();

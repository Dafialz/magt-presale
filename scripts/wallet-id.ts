// scripts/wallet-id.ts
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address } from "@ton/core";
import { TonClient } from "@ton/ton";

const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";

const client = new TonClient({ endpoint, apiKey: process.env.TONCENTER_API_KEY || undefined });
const ADMIN = Address.parse(process.env.ADMIN_ADDRESS!);

async function tryMethod(name: string) {
  try {
    const r = await client.runMethod(ADMIN, name, []);
    return r;
  } catch {
    return null;
  }
}

(async () => {
  console.log("ADMIN:", ADMIN.toString({ bounceable: false, urlSafe: true }));
  const seq = await tryMethod("seqno");
  if (seq) {
    const seqno = seq.stack.readNumber();
    console.log("seqno:", seqno);
  }

  const v5 = await tryMethod("get_wallet_id");
  if (v5) {
    const walletId = Number(v5.stack.readNumber());
    console.log("wallet_id (v5):", walletId);
    console.log("✅ Це схоже на wallet v5. Використовуй WalletContractV5R1 і цей wallet_id.");
    return;
  }

  const v4 = await tryMethod("get_subwallet_id");
  if (v4) {
    const subId = Number(v4.stack.readNumber());
    console.log("subwallet_id (v4/v3):", subId);
    console.log("✅ Це схоже на wallet v4/v3. Використовуй відповідний клас і цей subwallet_id.");
    return;
  }

  console.log("⚠️ Не вдалося зчитати wallet_id/subwallet_id — можливо нестандартний гаманець.");
})();

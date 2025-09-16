// scripts/get-sale-jw.ts
// Дістати адресу JettonWallet для (MAGT_MINTER, SALE_ADDRESS)
// Підтримує: змінні оточення або аргументи CLI: <MAGT_MINTER> <SALE_ADDRESS>

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, beginCell } from "@ton/core";
import { TonClient } from "@ton/ton";

// load env from .env.local або .env
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const apiKey = process.env.TONCENTER_API_KEY || undefined;

async function main() {
  const magtMinter = (process.argv[2] || process.env.MAGT_MINTER || "").trim();
  const saleAddress = (process.argv[3] || process.env.SALE_ADDRESS || "").trim();

  if (!magtMinter || !saleAddress) {
    console.error(
      "Usage: ts-node scripts/get-sale-jw.ts <MAGT_MINTER> <SALE_ADDRESS>  (або задай MAGT_MINTER/SALE_ADDRESS у .env.local)"
    );
    throw new Error("MAGT_MINTER and SALE_ADDRESS required");
  }

  const client = new TonClient({ endpoint, apiKey });

  const res = await client.runMethod(Address.parse(magtMinter), "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(Address.parse(saleAddress)).endCell() },
  ]);

  const jw = res.stack.readAddress();
  console.log("SALE_JW (EQ):", jw.toString());
  console.log("SALE_JW (UQ):", jw.toString({ bounceable: false, urlSafe: true }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

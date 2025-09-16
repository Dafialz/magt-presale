// scripts/get-jetton-balance.ts
// Показує баланс JettonWallet. Підтримує: аргумент <JW_ADDRESS> або змінну оточення JW_ADDRESS.

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address } from "@ton/core";
import { TonClient } from "@ton/ton";

// load env from .env.local або .env
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

async function main() {
  const jw = (process.argv[2] || process.env.JW_ADDRESS || "").trim();
  const decimals = Number(process.env.MAGT_DECIMALS || "9");

  if (!jw) throw new Error("JW_ADDRESS required (як аргумент або у .env.local)");

  const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
  const endpoint =
    NETWORK === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC";
  const apiKey = process.env.TONCENTER_API_KEY || undefined;

  const client = new TonClient({ endpoint, apiKey });

  const jwAddr = Address.parse(jw);
  try {
    const res = await client.runMethod(jwAddr, "get_wallet_data", []);
    // stack: balance(int), owner(addr), master(addr), wallet_code(cell)
    const balance = res.stack.readBigNumber(); // in nano-jettons (10^decimals)

    const base = BigInt(10) ** BigInt(decimals);
    const int = balance / base;
    const frac = (balance % base).toString().padStart(decimals, "0").replace(/0+$/, "");
    const human = frac ? `${int}.${frac}` : `${int}`;

    console.log("Balance (raw):", balance.toString());
    console.log(`Balance (MAGT): ${human}`);
  } catch (e: any) {
    const msg = String(e?.message || e || "");
    if (msg.includes("exit_code: -13")) {
      console.log("JettonWallet ще НЕ розгорнутий. Баланс = 0 MAGT");
      return;
    }
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

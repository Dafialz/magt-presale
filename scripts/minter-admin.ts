// scripts/minter-admin.ts
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

const client = new TonClient({
  endpoint,
  apiKey: process.env.TONCENTER_API_KEY || undefined,
});

async function readOwnerFromJettonData(minter: Address): Promise<Address | null> {
  // Спроба №1: TEP-74: total_supply(int) -> mintable(bool) -> owner(address) -> content(cell) -> wallet_code(cell)
  try {
    const r1 = await client.runMethod(minter, "get_jetton_data", []);
    r1.stack.readBigNumber();        // total_supply
    r1.stack.readBoolean();          // mintable
    const owner = r1.stack.readAddress(); // owner
    return owner;
  } catch (_) {
    // ignore and try alternative layout
  }

  // Спроба №2: інший порядок (деякі кастомні мінтери): total_supply(int) -> owner(address) -> ...
  try {
    const r2 = await client.runMethod(minter, "get_jetton_data", []);
    r2.stack.readBigNumber();        // total_supply
    const owner = r2.stack.readAddress(); // owner одразу другим
    return owner;
  } catch (_) {
    return null;
  }
}

async function readOwnerViaGetAdmin(minter: Address): Promise<Address | null> {
  try {
    const r = await client.runMethod(minter, "get_admin", []);
    const owner = r.stack.readAddress();
    return owner;
  } catch {
    return null;
  }
}

async function main() {
  const minter = Address.parse(process.env.MAGT_MINTER!);

  let owner: Address | null = await readOwnerFromJettonData(minter);
  if (!owner) owner = await readOwnerViaGetAdmin(minter);

  console.log("MINTER:", minter.toString({ bounceable: true, urlSafe: true }));

  if (owner) {
    console.log("OWNER :", owner.toString({ bounceable: true, urlSafe: true }));
  } else {
    console.log("❌ Не вдалося визначити owner. Можливо, у мінтера нестандартні get-методи.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

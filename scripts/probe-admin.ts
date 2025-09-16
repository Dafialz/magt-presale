// scripts/probe-admin.ts
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address } from "@ton/core";
import { WalletContractV5R1, WalletContractV4, WalletContractV3R2 } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";

const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const ADMIN = Address.parse(process.env.ADMIN_ADDRESS!);
const MNEMONIC = process.env.MNEMONIC!;
const PASS = process.env.MNEMONIC_PASSWORD || "";

function asUQ(a: Address) {
  return a.toString({ bounceable: false, urlSafe: true });
}

async function main() {
  const { publicKey } = await mnemonicToWalletKey(MNEMONIC.trim().split(/\s+/), PASS || undefined);

  // 1) популярні варіанти
  const popularV5r1 = [0, 1, 2, 3];
  const popularV4   = [698_983_191, 0, 1, 2, 3];
  const popularV3r2 = [0, 1, 2, 3];

  for (const id of popularV5r1) {
    const a = WalletContractV5R1.create({ publicKey, workchain: 0, walletId: id as any }).address;
    if (a.equals(ADMIN)) {
      console.log(`✅ MATCH: v5r1 walletId=${id}`);
      console.log("Address:", asUQ(a));
      return;
    }
  }

  for (const id of popularV4) {
    const a = WalletContractV4.create({ publicKey, workchain: 0, walletId: id as any }).address;
    if (a.equals(ADMIN)) {
      console.log(`✅ MATCH: v4 walletId=${id}`);
      console.log("Address:", asUQ(a));
      return;
    }
  }

  for (const id of popularV3r2) {
    const a = WalletContractV3R2.create({ publicKey, workchain: 0, walletId: id as any }).address;
    if (a.equals(ADMIN)) {
      console.log(`✅ MATCH: v3r2 walletId=${id}`);
      console.log("Address:", asUQ(a));
      return;
    }
  }

  // 2) помірний перебір лише для v5r1 (щоб не зависнути)
  const LIMIT = Math.min(Number(process.env.WALLET_ID_LIMIT || "5000"), 1_000_000);
  console.log(`⌛ Шукаю v5r1 walletId у діапазоні [0..${LIMIT}] ...`);
  for (let id = 0; id <= LIMIT; id++) {
    const a = WalletContractV5R1.create({ publicKey, workchain: 0, walletId: id as any }).address;
    if (a.equals(ADMIN)) {
      console.log(`✅ MATCH: v5r1 walletId=${id}`);
      console.log("Address:", asUQ(a));
      return;
    }
  }

  console.log("❌ Не знайшов відповідності. Ймовірні причини:");
  console.log("   • встановлено BIP39-пароль (спробуй задати MNEMONIC_PASSWORD)");
  console.log("   • інша версія гаманця / нестандартний код контракту");
  console.log("ADMIN_ADDRESS:", asUQ(ADMIN));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

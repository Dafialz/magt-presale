// scripts/buy-direct.ts
// Покупка без SDK контрактів: прямий internal з OP_BUY

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { TonClient, WalletContractV4, WalletContractV5R1, internal, SendMode } from "@ton/ton";
import { Address, beginCell, toNano } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";

async function main() {
  // ---------- ENV ----------
  const envLocal = path.resolve(process.cwd(), ".env.local");
  const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
  dotenv.config({ path: envPath, override: true });

  const amountTON = process.argv[2];                         // обов'язково: сума TON
  const saleArg = process.argv[3];                           // опційно: адреса сейлу
  const SALE_STR =
    saleArg ||
    process.env.SALE_ADDRESS ||
    process.env.SALE ||
    ""; // якщо немає — валідація нижче

  const MNEMONIC = (process.env.BUYER_MNEMONIC || process.env.MNEMONIC || "").trim();
  const KIND = (process.env.BUYER_WALLET_KIND || process.env.ADMIN_WALLET_KIND || "v4").toLowerCase();
  const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
  const API_KEY = process.env.TONCENTER_API_KEY || undefined;

  if (!amountTON) {
    throw new Error("Usage: ts-node -P tsconfig.scripts.json scripts/buy-direct.ts <TON> [SALE_ADDRESS]");
  }
  if (!SALE_STR) {
    throw new Error("SALE_ADDRESS is empty. Додай SALE_ADDRESS у .env.local або передай 2-м аргументом.");
  }
  if (!MNEMONIC) {
    throw new Error("MNEMONIC (або BUYER_MNEMONIC) порожній у .env.local");
  }

  const SALE = Address.parse(SALE_STR);

  const endpoint =
    NETWORK === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC";

  const client = new TonClient({ endpoint, apiKey: API_KEY });

  // ---------- Гаманець покупця ----------
  const mn = MNEMONIC.split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mn);

  const wallet =
    KIND.startsWith("v5")
      ? WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey })
      : WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

  const wc = client.open(wallet);

  console.log("Buyer wallet (EQ):", wc.address.toString());
  console.log("Buyer wallet (UQ):", wc.address.toString({ bounceable: false }));

  // ---------- Body: OP_BUY + без реферала ----------
  const OP_BUY = 0xb0a1cafe;
  const body = beginCell().storeUint(OP_BUY, 32).storeBit(0).endCell();

  const seqno = await wc.getSeqno();
  await wc.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({
        to: SALE,
        value: toNano(amountTON),
        bounce: true,
        body,
      }),
    ],
  });

  console.log(`TX sent: ${amountTON} TON → SALE ${SALE.toString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

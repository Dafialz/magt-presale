// scripts/set-allocation.ts
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, beginCell, toNano, SendMode } from "@ton/core";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { TonClient, WalletContractV5R1, internal } from "@ton/ton";

// .env.local має пріоритет
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

async function main() {
  const mnemonic = process.env.MNEMONIC!;
  // Дозволяємо обидва варіанти назви змінної
  const claim = (process.env.CLAIM_ADDRESS || process.env.NEXT_PUBLIC_CLAIM_ADDRESS)!;
  const user = process.env.USER_ADDRESS!;
  const decimals = Number(process.env.MAGT_DECIMALS || "9");
  const amountMAGT = process.env.AMOUNT_MAGT!; // "12345"

  if (!mnemonic || !claim || !user || !amountMAGT) {
    throw new Error("MNEMONIC, CLAIM_ADDRESS (або NEXT_PUBLIC_CLAIM_ADDRESS), USER_ADDRESS, AMOUNT_MAGT required");
  }

  const endpoint =
    (process.env.NETWORK || "mainnet") === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC";
  const apiKey = process.env.TONCENTER_API_KEY || undefined;

  const client = new TonClient({ endpoint, apiKey });

  const mnems = mnemonic.trim().split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mnems);
  const wallet = WalletContractV5R1.create({ publicKey: keyPair.publicKey, workchain: 0 });
  const walletContract = client.open(wallet);
  const walletAddr = walletContract.address;
  console.log("Admin wallet (UQ):", walletAddr.toString({ bounceable: false, urlSafe: true }));

  // ↓ без BigInt-літералів (працює на будь-якому target)
  const base = BigInt(10) ** BigInt(decimals);
  const raw = BigInt(amountMAGT) * base;

  // TODO: Заміни op-код та формат на реальні для твого Claim-контракту
  const payload = beginCell()
    .storeUint(0x0a110c, 32) // <— REPLACE
    .storeAddress(Address.parse(user))
    .storeUint(raw, 256)
    .endCell();

  const claimAddr = Address.parse(claim);
  const seqno = await walletContract.getSeqno();

  await walletContract.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno,
    // В V5R1 sendMode обов'язковий:
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({
        to: claimAddr,
        value: toNano("0.05"),
        body: payload,
      }),
    ],
  });

  console.log("set-allocation sent. seqno:", seqno);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// scripts/withdraw.ts
import { beginCell, toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { loadEnv, envMaybeAddress, envMaybeStr } from "./env";
import { CFG } from "./config";

/**
 * WITHDRAW TON (owner only)
 *
 * Env:
 *   PRESALE_ADDRESS / PRESALE – presale address
 *   WITHDRAW_TON             – amount of TON to withdraw (e.g. 1.5)
 *   WITHDRAW_GAS_TON         – attached TON for gas (default: 0.3)
 *
 * Run:
 *   WITHDRAW_TON=1 WITHDRAW_GAS_TON=0.3 npx blueprint run withdraw --testnet
 */

const OP_WITHDRAW = 0x57495448; // "WITH"

function buildWithdrawPayload(amountNano: bigint) {
  // message Withdraw { amount: Int; }
  return beginCell().storeUint(OP_WITHDRAW, 32).storeInt(amountNano, 257).endCell();
}

export async function run(provider: NetworkProvider) {
  loadEnv();

  const presale =
    envMaybeAddress("PRESALE_ADDRESS") ??
    envMaybeAddress("PRESALE") ??
    CFG.PRESALE;

  const owner = envMaybeAddress("OWNER") ?? CFG.OWNER;
  if (!owner) throw new Error("OWNER is missing in .env (OWNER=EQ...)");

  const amountTonStr = (envMaybeStr("WITHDRAW_TON") ?? "").trim();
  if (!amountTonStr) throw new Error("WITHDRAW_TON is missing (example: WITHDRAW_TON=1)");

  const amountNano = toNano(amountTonStr);
  if (amountNano <= 0n) throw new Error(`WITHDRAW_TON is invalid: ${amountTonStr}`);

  const gasTonStr = (envMaybeStr("WITHDRAW_GAS_TON") ?? "0.3").trim();
  const gasNano = toNano(gasTonStr);

  const sender = provider.sender().address;
  if (!sender) throw new Error("Provider sender address is not available");

  if (sender.toRawString() !== owner.toRawString()) {
    throw new Error(
      `NOT_OWNER: connected wallet != OWNER\nconnected: ${sender.toString()}\nOWNER: ${owner.toString()}`
    );
  }

  console.log("🏷️ Presale:", presale.toString());
  console.log("👤 Sender (owner):", sender.toString());
  console.log("🧾 OWNER (expected):", owner.toString());
  console.log("💸 Withdraw TON:", amountTonStr, `(nano: ${amountNano.toString()})`);
  console.log("⛽ Attached gas TON:", gasTonStr, `(nano: ${gasNano.toString()})`);

  console.log("Sending transaction. Approve in your wallet...");
  await provider.sender().send({
    to: presale,
    value: gasNano,
    body: buildWithdrawPayload(amountNano),
  });

  console.log("✅ Withdraw TON transaction sent.");
}

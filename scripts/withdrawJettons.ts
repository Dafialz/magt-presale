// scripts/withdrawJettons.ts
import { beginCell, toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { loadEnv, envMaybeAddress, envMaybeStr, parseJettonToNano, requireAddress } from "./env";
import { CFG } from "./config";
import { assertTestnet } from "./safety";

/**
 * WITHDRAW JETTONS (owner only)
 *
 * Env:
 *   PRESALE_ADDRESS / PRESALE – presale address
 *   WITHDRAW_JETTON          – amount of jettons to withdraw (human, decimals=JETTON_DECIMALS)
 *   WITHDRAW_JETTON_TO       – destination (default: OWNER)
 *   JETTON_DECIMALS          – default 9
 *   WITHDRAW_GAS_TON         – attached TON for gas (default: 0.7)
 *
 * Run:
 *   WITHDRAW_JETTON=1000 WITHDRAW_GAS_TON=0.7 npx blueprint run withdrawJettons --testnet
 */

const OP_WITHDRAW_JETTONS = 0x574a544e; // "WJTN"

function buildWithdrawJettonsPayload(to: any, amountNanoJettons: bigint, queryId: bigint) {
  // message WithdrawJettons { to: Address; amount: Int; query_id: Int; }
  // In Tact, Int is 257-bit signed integer.
  return beginCell()
    .storeUint(OP_WITHDRAW_JETTONS, 32)
    .storeAddress(to)
    .storeInt(amountNanoJettons, 257)
    .storeInt(queryId, 257)
    .endCell();
}

export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "withdrawJettons");
  loadEnv();

  const presale = requireAddress(
    "PRESALE",
    envMaybeAddress("PRESALE_ADDRESS") ??
      envMaybeAddress("PRESALE") ??
      CFG.PRESALE
  );

  const owner = requireAddress("OWNER", envMaybeAddress("OWNER") ?? CFG.OWNER);

  const toAddr = envMaybeAddress("WITHDRAW_JETTON_TO") ?? owner;

  const decimals = Number((envMaybeStr("JETTON_DECIMALS") ?? "9").trim() || "9");
  const amountHuman = (envMaybeStr("WITHDRAW_JETTON") ?? "").trim();
  if (!amountHuman) throw new Error("WITHDRAW_JETTON is missing (example: WITHDRAW_JETTON=1000)");

  const amountNano = parseJettonToNano(amountHuman, decimals);
  if (amountNano <= 0n) throw new Error(`WITHDRAW_JETTON is invalid: ${amountHuman}`);

  const gasTonStr = (envMaybeStr("WITHDRAW_GAS_TON") ?? "0.7").trim();
  const gasNano = toNano(gasTonStr);

  const sender = provider.sender().address;
  if (!sender) throw new Error("Provider sender address is not available");

  if (sender.toRawString() !== owner.toRawString()) {
    throw new Error(
      `NOT_OWNER: connected wallet != OWNER\nconnected: ${sender.toString()}\nOWNER: ${owner.toString()}`
    );
  }

  const qid = BigInt(Date.now());

  console.log("🏷️ Presale:", presale.toString());
  console.log("👤 Sender (owner):", sender.toString());
  console.log("🧾 OWNER (expected):", owner.toString());
  console.log("📤 To:", toAddr.toString());
  console.log("🪙 Withdraw jettons:", amountHuman, `(nano: ${amountNano.toString()})`);
  console.log("⛽ Attached gas TON:", gasTonStr, `(nano: ${gasNano.toString()})`);

  console.log("Sending transaction. Approve in your wallet...");
  await provider.sender().send({
    to: presale,
    value: gasNano,
    body: buildWithdrawJettonsPayload(toAddr, amountNano, qid),
  });

  console.log("✅ Withdraw jettons transaction sent.");
}

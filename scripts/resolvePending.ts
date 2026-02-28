// scripts/resolvePending.ts (ABI-safe)
import { Address, toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { loadEnv, envMaybeAddress, envMaybeStr } from "./env";
import { CFG } from "./config";

export async function run(provider: NetworkProvider) {
  loadEnv();

  const presaleAddr =
    envMaybeAddress("PRESALE_ADDRESS") ??
    envMaybeAddress("PRESALE") ??
    CFG.PRESALE;

  const connected = provider.sender().address;
  if (!connected) throw new Error("Provider sender address is not available");

  const owner = envMaybeAddress("OWNER") ?? CFG.OWNER;
  if (!owner) throw new Error("OWNER is missing in .env (OWNER=...)");

  // owner check on client side (avoid wasting fees)
  if (connected.toRawString() !== owner.toRawString()) {
    throw new Error(
      `NOT_OWNER (client): connected != OWNER\nconnected: ${connected.toString()}\nOWNER: ${owner.toString()}`
    );
  }

  const user =
    envMaybeAddress("RESOLVE_USER") ??
    envMaybeAddress("ADDR") ??
    null;

  if (!user) throw new Error("Missing RESOLVE_USER (or ADDR)");

  const gasStr = (envMaybeStr("RESOLVE_GAS") ?? "1.0").trim();
  const gas = toNano(gasStr);
  if (gas <= 0n) throw new Error(`RESOLVE_GAS invalid: ${gasStr}`);

  const presale = provider.open(Presale.fromAddress(presaleAddr));

  console.log("🏷️ Presale:", presaleAddr.toString());
  console.log("🔐 Connected (OWNER):", connected.toString());
  console.log("👤 Restore pending for USER:", user.toString());
  console.log("🛠️ action = 2 (restore only)");
  console.log("⛽ RESOLVE_GAS:", gasStr);

  console.log("Sending ResolvePending (typed ABI). Approve in your wallet...");
  await presale.send(
    provider.sender(),
    { value: gas, bounce: true },
    {
      $$type: "ResolvePending",
      user: user,
      action: 2n,
    }
  );

  console.log("✅ ResolvePending sent.");
}

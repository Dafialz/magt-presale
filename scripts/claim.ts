import { Address, toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { loadEnv, envMaybeAddress, envMaybeStr } from "./env";
import { assertTestnet } from "./safety";

function prettyErr(e: any): string {
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.error ||
    e?.message ||
    String(e)
  );
}

export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "claim");
  loadEnv();

  const presaleStr = envMaybeStr("PRESALE") || envMaybeStr("PRESALE_ADDRESS");
  if (!presaleStr) throw new Error("Missing PRESALE or PRESALE_ADDRESS in .env");

  const presale = provider.open(Presale.fromAddress(Address.parse(presaleStr)));

  const target = envMaybeAddress("TARGET_ADDRESS") || provider.sender().address;
  if (!target) throw new Error("No TARGET_ADDRESS and sender has no address");

  const gasTon = (envMaybeStr("CLAIM_GAS") ?? "0.8").trim();
  const gas = toNano(gasTon);

  console.log("🏷️ Presale:", presale.address.toString());
  console.log("🎯 TARGET:", target.toString());
  console.log("⛽ CLAIM_GAS:", gasTon);

  try {
    console.log("Sending claim. Approve in your wallet...");
    await presale.send(provider.sender(), { value: gas }, { $$type: "Claim", query_id: 0n });
    console.log("✅ Claim message sent.");
    console.log("➡️ Next: npx blueprint run check --testnet");
  } catch (e: any) {
    console.error("❌ Claim failed:", prettyErr(e));
    throw e;
  }
}

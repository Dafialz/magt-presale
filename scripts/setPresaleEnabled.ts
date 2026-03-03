import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { loadEnv, envMaybeAddress, envMaybeStr } from "./env";
import { CFG } from "./config";
import { assertTestnet } from "./safety";
import { toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "setPresaleEnabled");
  loadEnv();

  const presaleAddr =
    envMaybeAddress("PRESALE_ADDRESS") ??
    envMaybeAddress("PRESALE") ??
    CFG.PRESALE;
  if (!presaleAddr) {
    throw new Error("PRESALE_ADDRESS/PRESALE is required");
  }

  const presale = provider.open(Presale.fromAddress(presaleAddr));
  const enabledInt = (envMaybeStr("PRESALE_ENABLED") ?? "1") === "0" ? 0n : 1n;

  console.log("Presale:", presaleAddr.toString());
  console.log("Setting presaleEnabled to:", enabledInt.toString());

  await presale.send(
    provider.sender(),
    { value: toNano("0.05") },
    { $$type: "SetPresaleEnabled", enabled: enabledInt }
  );

  console.log("SetPresaleEnabled sent.");
}

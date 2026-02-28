import { toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { mustAddr, CFG } from "./config";
import { assertTestnet } from "./safety";

/**
 * Legacy deploy script (kept for compatibility).
 *
 * IMPORTANT:
 * - Uses Presale.fromInit(owner, jettonMaster) (matches current contract init)
 * - Requires OWNER and JETTON_MASTER in .env
 * - Does NOT upsert .env (use deploy.ts if you want auto-write)
 */
export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "deployPresale");
  const owner = mustAddr("OWNER");
  const jettonMaster = mustAddr("JETTON_MASTER");

  const presale = provider.open(await Presale.fromInit(owner, jettonMaster));

  // Slightly higher value to avoid low-balance deploy edge-cases
  await presale.send(provider.sender(), { value: toNano("0.10") }, null);

  await provider.waitForDeploy(presale.address);

  // eslint-disable-next-line no-console
  console.log("✅ Presale deployed at:", presale.address.toString());
  // eslint-disable-next-line no-console
  console.log("ℹ️  Current ENV PRESALE (from config):", CFG.PRESALE?.toString() ?? "(not set)");
}

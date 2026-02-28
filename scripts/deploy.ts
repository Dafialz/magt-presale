import { Address, toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// NOTE:
// Do NOT import generated bindings with a ".ts" suffix unless you enable
// `allowImportingTsExtensions`. Blueprint runs scripts via ts-node, and the
// simplest/most compatible approach is to use extension-less imports.
import { Presale } from "../build/Presale/Presale_Presale";
import { CFG } from "./config";
import { assertTestnet } from "./safety";
import { loadEnv, upsertEnvKey } from "./env";

function normalizeFriendlyAddr(s: string): string {
  let v = (s ?? "").trim();

  // remove wrapping quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }

  // remove zero-width chars
  v = v.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Some messengers replace TON base64url chars:
  // '/' -> '_' and '+' -> '-' are correct for TON-friendly.
  // If user pasted the opposite, fix it back:
  v = v.replace(/\//g, "_").replace(/\+/g, "-");

  return v;
}

async function promptStdin(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const ans = await rl.question(question);
    return ans;
  } finally {
    rl.close();
  }
}

async function getEnvOrPrompt(provider: NetworkProvider, name: string, prompt: string): Promise<string> {
  const fromEnv = process.env[name];
  if (fromEnv && fromEnv.trim()) {
    return normalizeFriendlyAddr(fromEnv);
  }

  // Blueprint UI methods differ between versions/wallet modes.
  // We support: provider.ui.input (older), provider.ui.prompt (newer),
  // and fallback to stdin.
  const ui: any = (provider as any).ui;
  let entered = "";

  if (ui && typeof ui.input === "function") {
    entered = await ui.input(`${prompt} (env: ${name}): `);
  } else if (ui && typeof ui.prompt === "function") {
    entered = await ui.prompt(`${prompt} (env: ${name}): `);
  } else {
    entered = await promptStdin(`${prompt} (env: ${name}): `);
  }

  const v = normalizeFriendlyAddr(entered);
  if (!v) {
    throw new Error(`Missing ${name}. Provide it via prompt or env ${name}.`);
  }
  return v;
}

function parseAddressOrThrow(label: string, raw: string): Address {
  const normalized = normalizeFriendlyAddr(raw);

  console.log(`🔎 ${label} RAW        = ${raw}`);
  console.log(`🔎 ${label} NORMALIZED = ${normalized}`);

  try {
    return Address.parse(normalized);
  } catch (e: any) {
    throw new Error(
      `${label} is not a valid TON friendly address.\n` +
        `RAW:        ${raw}\n` +
        `NORMALIZED: ${normalized}\n` +
        `Original error: ${e?.message ?? String(e)}`
    );
  }
}

export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "deploy");
  const envFile = loadEnv();

  const owner = provider.sender().address;
  if (!owner) throw new Error("No sender address (wallet not connected?)");

  // Jetton master: from CFG (.env) if present, otherwise prompt
  let jettonMaster = CFG.JETTON_MASTER;
  if (!jettonMaster) {
    const envJettonMaster = await getEnvOrPrompt(provider, "JETTON_MASTER", "Paste Jetton Master address (EQ... or UQ...)");
    jettonMaster = parseAddressOrThrow("JETTON_MASTER", envJettonMaster);
  }

  // ✅ build contract from init
  const presale = provider.open(await Presale.fromInit(owner, jettonMaster));

  console.log("👤 Owner:", owner.toString());
  console.log("🪙 Jetton master:", jettonMaster.toString());
  console.log("📍 Presale address (future):", presale.address.toString());

  if (envFile) {
    try {
      upsertEnvKey(envFile, "PRESALE", presale.address.toString());
      console.log("📝 Updated PRESALE in .env");
    } catch (e: any) {
      console.log("⚠️ Could not update PRESALE in .env:", e?.message ?? String(e));
    }
  }

  console.log("🚀 Deploying Presale...");
  await presale.send(provider.sender(), { value: toNano("0.2") }, { $$type: "Deploy", queryId: 0n });

  console.log("⏳ Waiting for deploy...");
  try {
    await provider.waitForDeploy(presale.address);
    console.log("✅ Presale deployed at:", presale.address.toString());
  } catch (e: any) {
    // Toncenter often fails on testnet even when contract is already deployed.
    console.log("⚠️ waitForDeploy failed (toncenter/testnet instability).");
    console.log("⚠️ Your deploy transaction WAS SENT. Verify address:");
    console.log("📍 Presale address:", presale.address.toString());
    console.log("Error:", e?.message ?? String(e));
  }
}

// presale/scripts/setJettonWallet.ts
import { Address, toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { CFG } from "./config";
import { loadEnv, envMaybeAddress } from "./env";

function parseAddr(label: string, raw?: string): Address {
  const v = (raw ?? "").trim();
  if (!v) throw new Error(`Missing ${label}`);
  return Address.parse(v);
}

function envNum(key: string, def: string): string {
  const v = (process.env[key] ?? "").trim();
  return v ? v : def;
}

function prettyErr(e: any): string {
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.error ||
    e?.message ||
    String(e)
  );
}

export async function run(provider: NetworkProvider) {
  // load .env (safe even if it doesn't exist)
  try {
    loadEnv();
  } catch {
    // ignore
  }

  const presaleAddr =
    envMaybeAddress("PRESALE_ADDRESS") ??
    envMaybeAddress("PRESALE") ??
    CFG.PRESALE;

  if (!presaleAddr) throw new Error("Missing PRESALE address (PRESALE_ADDRESS or PRESALE)");

  // Can be set either in .env or exported in shell
  const walletFromEnv = process.env.PRESALE_JETTON_WALLET?.trim() || undefined;

  const walletAddr =
    (walletFromEnv ? parseAddr("PRESALE_JETTON_WALLET", walletFromEnv) : null) ??
    CFG.PRESALE_JETTON_WALLET;

  if (!walletAddr) {
    throw new Error(
      `Missing PRESALE_JETTON_WALLET.\n` +
        `1) Run: npx blueprint run resolvePresaleJettonWallet --testnet\n` +
        `2) Put result into .env as PRESALE_JETTON_WALLET=EQ...\n` +
        `3) Then run: npx blueprint run setJettonWallet --testnet`
    );
  }

  const presale = provider.open(Presale.fromAddress(presaleAddr));
  const sender = provider.sender();

  // configurable TX value:
  // - default 0.30 TON (much safer than 0.08 on testnet)
  // - override via: SET_JETTON_WALLET_TON=0.5 npx blueprint run setJettonWallet --testnet
  const valueTon = envNum("SET_JETTON_WALLET_TON", "0.30");

  console.log("🏷️ Presale:", presale.address.toString());
  console.log("🏦 Setting presale jettonWallet to:", walletAddr.toString());
  console.log("⛽ tx value TON:", valueTon);

  try {
    await presale.send(
      sender,
      { value: toNano(valueTon) },
      {
        $$type: "SetJettonWallet",
        wallet: walletAddr,
      }
    );

    console.log("✅ SetJettonWallet message sent.");
    console.log("ℹ️ Now run: npx blueprint run check --testnet");
  } catch (e: any) {
    // IMPORTANT: setJettonWallet can legitimately bounce if:
    // - only owner can call and wallet isn't owner
    // - already set and contract forbids re-set
    // - contract policy mismatch
    console.log("⚠️ setJettonWallet failed / bounced.");
    console.log("Reason:", prettyErr(e));
    console.log(
      "ℹ️ This might be OK if jetton wallet is already set. Verify with: npx blueprint run check --testnet"
    );
  }
}

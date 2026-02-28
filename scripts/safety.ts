import { NetworkProvider } from "@ton/blueprint";
import { loadEnv } from "./env";

export function assertTestnet(provider: NetworkProvider, scriptName: string): void {
  loadEnv();

  const providerNetwork = provider.network();
  const envNetwork = (process.env.NETWORK ?? "").trim().toLowerCase();
  const allowMainnet = (process.env.I_UNDERSTAND_MAINNET ?? "").trim() === "1";

  const isTestnet = providerNetwork === "testnet" || envNetwork === "testnet";
  if (isTestnet) {
    console.log(`🛡️ Safety check passed for ${scriptName}: testnet mode confirmed.`);
    return;
  }

  if (allowMainnet) {
    console.warn(
      `⚠️ ${scriptName}: running on '${providerNetwork}' with I_UNDERSTAND_MAINNET=1 override.`
    );
    return;
  }

  throw new Error(
    [
      `Safety stop: ${scriptName} sends transactions and is blocked outside testnet.`,
      `Detected provider network: ${providerNetwork}.`,
      `To proceed safely use: --testnet (or set NETWORK=testnet).`,
      `If you intentionally want non-testnet, set I_UNDERSTAND_MAINNET=1.`,
    ].join("\n")
  );
}

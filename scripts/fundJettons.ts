// scripts/fundJettons.ts
import { Address, beginCell, Cell } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";

import {
  loadEnv,
  envAddress,
  envInt,
  envStr,
  envMaybeStr,
  envMaybeAddress,
  parseJettonToNano,
} from "./env";
import { assertTestnet } from "./safety";

/**
 * fundJettons
 *
 * Sends Jettons from YOUR JettonWallet to Presale by JettonWallet.transfer(destination = PRESALE address).
 *
 * Required .env:
 *   PRESALE=EQ...
 *   JETTON_MASTER=EQ...
 *   TONCENTER_JSONRPC=https://testnet.toncenter.com/api/v2/jsonRPC
 *
 * Optional .env:
 *   TONCENTER_API_KEY=...
 *   OWNER=EQ...                     (if missing -> uses connected wallet)
 *   JETTON_WALLET_FROM=EQ...         (your JettonWallet for this JettonMaster)
 *   OWNER_JETTON_WALLET=EQ...        (same thing, alternative name)
 *   PRESALE_JETTON_WALLET=EQ...      (not required for transfer(), but useful for logs)
 *
 * Amount:
 *   AMOUNT_JETTON=100                (human units)
 *   JETTON_DECIMALS=9
 *   OR AMOUNT_JETTON_NANO=...
 *
 * Gas tuning (optional .env):
 *   FUND_TX_VALUE_TON=0.3
 *   FUND_FORWARD_TON=0.05
 */

async function toncenterJsonRpc(
  endpoint: string,
  apiKey: string | undefined,
  method: string,
  params: any
): Promise<any> {
  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    body: JSON.stringify({ id: "1", jsonrpc: "2.0", method, params }),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) {
    const msg = j?.error?.message ?? j?.error ?? JSON.stringify(j);
    throw new Error(`toncenter RPC error (${r.status}): ${msg}`);
  }
  return j.result;
}

function addressSliceBocBase64(addr: Address): string {
  return beginCell().storeAddress(addr).endCell().toBoc().toString("base64");
}

function parseWalletAddressFromResult(res: any): Address {
  const stack = res?.stack ?? [];
  const first = Array.isArray(stack) ? stack[0] : undefined;
  const bytes: string | undefined = Array.isArray(first)
    ? first?.[1]?.bytes
    : first?.value?.bytes;

  if (!bytes || typeof bytes !== "string") {
    throw new Error(
      `Unexpected stack format. First item: ${JSON.stringify(first)?.slice(0, 200)}`
    );
  }

  const cell = Cell.fromBoc(Buffer.from(bytes, "base64"))[0]!;
  const s = cell.beginParse();
  const addr = s.loadAddress();
  if (!addr) throw new Error("Getter returned null address");
  return addr;
}

async function resolveOwnerJettonWallet(args: {
  endpoint: string;
  apiKey?: string;
  jettonMaster: Address;
  owner: Address;
}): Promise<Address> {
  const res = await toncenterJsonRpc(args.endpoint, args.apiKey, "runGetMethod", {
    address: args.jettonMaster.toString(),
    method: "get_wallet_address",
    stack: [["slice", { bytes: addressSliceBocBase64(args.owner) }]],
  });
  return parseWalletAddressFromResult(res);
}

function nanoFromEnv(): bigint {
  const nanoDirect = envMaybeStr("AMOUNT_JETTON_NANO")?.trim();
  if (nanoDirect) {
    const nano = BigInt(nanoDirect);
    if (nano <= 0n) throw new Error(`Bad amount: ${nanoDirect} (nano must be > 0)`);
    return nano;
  }

  const human = envMaybeStr("AMOUNT_JETTON")?.trim();
  if (!human) {
    throw new Error(
      "Missing AMOUNT_JETTON (human units) or AMOUNT_JETTON_NANO (nano).\n" +
        "Example: AMOUNT_JETTON=100"
    );
  }

  const decimals = envInt("JETTON_DECIMALS", { defaultValue: "9", min: 0, max: 18 });
  const nano = parseJettonToNano(human, decimals);
  if (nano <= 0n) throw new Error(`Bad amount: ${human} (nano=${nano})`);
  return nano;
}

function parseTonToNano(s: string): bigint {
  const t = s.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error(`Bad TON amount: "${s}"`);
  const [whole, fracRaw = ""] = t.split(".");
  const frac = (fracRaw + "000000000").slice(0, 9);
  return BigInt(whole) * 1_000_000_000n + BigInt(frac);
}

export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "fundJettons");
  const loaded = loadEnv();
  if (loaded) console.log(`✅ Loaded .env from: ${loaded}`);

  // destination MUST be PRESALE address (owner), NOT PRESALE_JETTON_WALLET
  const presale = envAddress("PRESALE");
  const presaleJettonWallet = envMaybeAddress("PRESALE_JETTON_WALLET");
  const jettonMaster = envAddress("JETTON_MASTER");

  // ✅ OWNER optional: fallback to connected wallet
  const owner = envMaybeAddress("OWNER") ?? provider.sender().address!;
  if (!envMaybeAddress("OWNER")) {
    console.log(`⚠️ OWNER not set in .env. Using connected wallet as OWNER: ${owner.toString()}`);
  }

  const endpoint = envStr("TONCENTER_JSONRPC", "https://testnet.toncenter.com/api/v2/jsonRPC")!;
  const apiKey = envMaybeStr("TONCENTER_API_KEY") ?? undefined;

  console.log("🌐 TONCENTER_JSONRPC:", endpoint);
  console.log("🔑 TONCENTER_API_KEY:", apiKey ? "SET" : "NOT SET");

  // Resolve FROM jetton wallet (your wallet for this JettonMaster)
  let fromJettonWallet =
    envMaybeAddress("JETTON_WALLET_FROM") ?? envMaybeAddress("OWNER_JETTON_WALLET");

  if (!fromJettonWallet) {
    console.log("🔎 OWNER_JETTON_WALLET/JETTON_WALLET_FROM not set. Resolving via get_wallet_address...");
    fromJettonWallet = await resolveOwnerJettonWallet({
      endpoint,
      apiKey,
      jettonMaster,
      owner,
    });
    console.log("——————————————————————————————————————————————————————————————————————");
    console.log("🏦 Your (OWNER) JettonWallet:", fromJettonWallet.toString());
    console.log("✅ Put into .env (recommended):");
    console.log(`OWNER_JETTON_WALLET=${fromJettonWallet.toString()}`);
    console.log("——————————————————————————————————————————————————————————————————————");
  }

  if (fromJettonWallet.toString() === owner.toString()) {
    throw new Error(
      "JETTON_WALLET_FROM looks wrong: it's equal to OWNER.\n" +
        "You must use the JettonWallet address (resolved by get_wallet_address), not your main wallet."
    );
  }

  const amountNano = nanoFromEnv();

  const fundTxValueTon = envMaybeStr("FUND_TX_VALUE_TON")?.trim() ?? "0.3";
  const forwardTon = envMaybeStr("FUND_FORWARD_TON")?.trim() ?? "0.05";

  const txValueNano = parseTonToNano(fundTxValueTon);
  const forwardNano = parseTonToNano(forwardTon);

  console.log("🏷️ Presale (owner):", presale.toString());
  if (presaleJettonWallet) {
    console.log("🏦 Presale JettonWallet (resolved):", presaleJettonWallet.toString());
  } else {
    console.log("🏦 Presale JettonWallet (resolved): <not set> (ok, transfer() will deploy/resolve automatically)");
  }
  console.log("🏦 From (your JettonWallet):", fromJettonWallet.toString());
  console.log("🪙 Jetton master:", jettonMaster.toString());
  console.log("💸 Amount nano:", amountNano.toString());
  console.log("⛽ tx value (nanoTON):", txValueNano.toString(), `(FUND_TX_VALUE_TON=${fundTxValueTon})`);
  console.log("➡️ forward TON (nanoTON):", forwardNano.toString(), `(FUND_FORWARD_TON=${forwardTon})`);

  const transferPayload = beginCell()
    .storeUint(0x0f8a7ea5, 32) // transfer op
    .storeUint(0, 64) // query_id
    .storeCoins(amountNano)
    .storeAddress(presale) // ✅ destination owner = PRESALE
    .storeAddress(owner) // response destination
    .storeBit(0) // no custom payload
    .storeCoins(forwardNano)
    .storeBit(0) // no forward payload
    .endCell();

  console.log("Sending transaction. Approve in your wallet...");
  await provider.sender().send({
    to: fromJettonWallet,
    value: txValueNano,
    body: transferPayload,
  });

  console.log("✅ fundJettons: transfer message sent.");
}
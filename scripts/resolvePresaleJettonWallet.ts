// scripts/resolvePresaleJettonWallet.ts
import { Address, beginCell, Cell } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import * as fs from "fs";
import * as path from "path";

import { loadEnv, envAddress, envMaybeStr, envStr } from "./env";

/**
 * resolvePresaleJettonWallet
 *
 * - Resolves JettonWallet for TARGET (by default = PRESALE) via JettonMaster.get_wallet_address
 * - Shows wallet state (active/uninitialized/...)
 * - Writes PRESALE_JETTON_WALLET (or OWNER_JETTON_WALLET if TARGET_ADDRESS provided) into .env
 *
 * Required .env:
 *   JETTON_MASTER=EQ...
 *   PRESALE=EQ...
 *   TONCENTER_JSONRPC=https://testnet.toncenter.com/api/v2/jsonRPC
 *
 * Optional:
 *   TONCENTER_API_KEY=...
 *   TARGET_ADDRESS=EQ...     (if set -> writes OWNER_JETTON_WALLET, else PRESALE_JETTON_WALLET)
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

function readStackItemBytes(first: any): string | null {
  if (Array.isArray(first) && first.length >= 2) {
    const v = first[1];
    if (v && typeof v === "object" && typeof v.bytes === "string") return v.bytes;
  }
  if (first && typeof first === "object") {
    const v = (first as any).value;
    if (v && typeof v === "object" && typeof v.bytes === "string") return v.bytes;
    if (typeof (first as any).bytes === "string") return (first as any).bytes;
  }
  return null;
}

function parseWalletAddressFromRunGet(res: any): Address {
  const stack = res?.stack ?? [];
  const first = Array.isArray(stack) ? stack[0] : undefined;

  const bytes = readStackItemBytes(first);
  if (!bytes) {
    throw new Error(
      `Unexpected stack format for get_wallet_address. First item: ${JSON.stringify(first)?.slice(0, 300)}`
    );
  }

  const cell = Cell.fromBoc(Buffer.from(bytes, "base64"))[0]!;
  const s = cell.beginParse();
  const addr = s.loadAddress();
  if (!addr) throw new Error("get_wallet_address returned null address");
  return addr;
}

async function getAddressInformation(endpoint: string, apiKey: string | undefined, addr: Address): Promise<string> {
  // JSON-RPC method: getAddressInformation
  const info = await toncenterJsonRpc(endpoint, apiKey, "getAddressInformation", {
    address: addr.toString(),
  });

  // toncenter may return various shapes; normalize
  const state =
    info?.state ??
    info?.result?.state ??
    info?.account_state ??
    info?.status ??
    "unknown";

  return String(state);
}

function upsertEnvKeyLocal(envFilePath: string, key: string, value: string) {
  const k = key.trim();
  const v = value.trim();
  if (!k) throw new Error("Empty key");
  if (!v) throw new Error("Empty value");

  let content = "";
  try {
    content = fs.readFileSync(envFilePath, "utf8");
  } catch {
    fs.writeFileSync(envFilePath, `${k}=${v}\n`, "utf8");
    return;
  }

  const lines = content.split(/\r?\n/);
  let replaced = false;

  for (let i = 0; i < lines.length; i++) {
    if ((lines[i] ?? "").startsWith(k + "=")) {
      lines[i] = `${k}=${v}`;
      replaced = true;
      break;
    }
  }

  if (!replaced) {
    if (lines.length && lines[lines.length - 1] !== "") lines.push("");
    lines.push(`${k}=${v}`);
    lines.push("");
  }

  fs.writeFileSync(envFilePath, lines.join("\n"), "utf8");
}

export async function run(provider: NetworkProvider) {
  loadEnv();

  const endpoint = envStr("TONCENTER_JSONRPC", "https://testnet.toncenter.com/api/v2/jsonRPC");
  if (!endpoint) throw new Error("Missing TONCENTER_JSONRPC");
  const apiKey = envMaybeStr("TONCENTER_API_KEY");

  const jettonMaster = envAddress("JETTON_MASTER");
  const presale = envAddress("PRESALE");

  const targetStr = (process.env.TARGET_ADDRESS ?? "").trim();
  const target = targetStr ? Address.parse(targetStr) : presale;

  console.log("🪙 JettonMaster:", jettonMaster.toString());
  console.log("🎯 Target:", target.toString());
  console.log("🌐 RPC:", endpoint);
  console.log("🔑 API key:", apiKey ? "SET" : "NOT SET");

  const res = await toncenterJsonRpc(endpoint, apiKey, "runGetMethod", {
    address: jettonMaster.toString(),
    method: "get_wallet_address",
    stack: [["slice", { bytes: addressSliceBocBase64(target) }]],
  });

  const wallet = parseWalletAddressFromRunGet(res);

  const state = await getAddressInformation(endpoint, apiKey, wallet);
  console.log("🏦 Resolved JettonWallet:", wallet.toString());
  console.log(`🧠 JettonWallet state: ${state}`);

  const envPath = path.resolve(process.cwd(), ".env");
  const key = targetStr ? "OWNER_JETTON_WALLET" : "PRESALE_JETTON_WALLET";

  try {
    upsertEnvKeyLocal(envPath, key, wallet.toString());
    console.log(`📝 Updated ${key} in .env: ${envPath}`);
  } catch (e: any) {
    console.log("⚠️ Could not update .env automatically:", e?.message ?? String(e));
  }

  console.log("——————————————————————————————————————————————————————————————————————");
  console.log("✅ Put into .env:");
  console.log(`${key}=${wallet.toString()}`);
  console.log('Tip: npx blueprint run check --testnet');
  console.log("——————————————————————————————————————————————————————————————————————");

  // keep provider used (avoid lint “unused” in some setups)
  void provider;
}
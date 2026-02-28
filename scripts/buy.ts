// scripts/buy.ts
import { beginCell, toNano, Address, Cell } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { loadEnv, envMaybeAddress, envMaybeStr } from "./env";
import { CFG } from "./config";
import { assertTestnet } from "./safety";

/**
 * BUY script for Presale.tact
 *
 * Env:
 *   PRESALE_ADDRESS / PRESALE     – presale address (friendly)
 *   TON                           – amount in TON (default: 0.5)
 *   REF                           – optional referral address (friendly)
 *
 * Modes:
 *   BUY_MODE=manual (default)     – sends manual opcode payload 0x42555901
 *   BUY_MODE=abi                 – sends typed BuyAbi message (opcode 0x42555902)
 */

const OP_BUY_MANUAL = 0x42555901; // "BUY"+1

function boolOn(key: string): boolean {
  const v = (envMaybeStr(key) ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

function bocBase64(c: Cell): string {
  return c.toBoc({ idx: false }).toString("base64");
}

async function toncenterRpc(method: string, params: any): Promise<any> {
  const url = CFG.TONCENTER_JSONRPC;
  const apiKey = CFG.TONCENTER_API_KEY;

  if (!url) throw new Error("Missing TONCENTER_JSONRPC in config/.env");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    body: JSON.stringify({
      id: Date.now(),
      jsonrpc: "2.0",
      method,
      params,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Toncenter RPC HTTP ${res.status}: ${t}`);
  }

  const json = await res.json();
  if (json?.error) throw new Error(`Toncenter RPC error: ${JSON.stringify(json.error)}`);
  return json?.result;
}

async function runGetMethod(address: Address, method: string, stack: any[] = []) {
  return await toncenterRpc("runGetMethod", {
    address: address.toRawString(),
    method,
    stack,
  });
}

function tryReadOpFromBodyB64(bodyB64?: string): number | null {
  if (!bodyB64) return null;
  try {
    const cell = Cell.fromBoc(Buffer.from(bodyB64, "base64"))[0];
    const s = cell.beginParse();
    if (s.remainingBits < 32) return null;
    return Number(s.loadUint(32));
  } catch {
    return null;
  }
}

async function printLastInboundSenders(presale: Address, limit = 12) {
  try {
    const res = await toncenterRpc("getTransactions", { address: presale.toRawString(), limit });
    const txs = res ?? [];
    const presaleRaw = presale.toRawString();

    console.log("🧾 Last inbound messages to PRESALE (toncenter getTransactions):");
    let printed = 0;

    for (const tx of txs) {
      const inMsg = tx?.in_msg;
      const src = inMsg?.source;
      const dst = inMsg?.destination;
      const val = inMsg?.value;
      const body = inMsg?.msg_data?.body;

      if (!src || !dst || !val) continue;
      if (dst !== presaleRaw) continue;

      const op = tryReadOpFromBodyB64(body);
      const ton = (BigInt(val) / 1_000_000_000n).toString();
      console.log(`   - src=${src} value=${ton} TON op=${op !== null ? "0x" + op.toString(16) : "n/a"}`);
      printed++;
      if (printed >= 8) break;
    }

    if (printed === 0) console.log("   (no inbound messages found in last tx batch)");
    console.log("");
  } catch {
    // ignore
  }
}

function buildManualBuyPayload(ref?: Address | null): Cell {
  // Manual encoding expected by contract:
  // [op:32][has_ref:1][ref_addr if has_ref=1]
  const b = beginCell().storeUint(OP_BUY_MANUAL, 32);

  if (ref) {
    b.storeBit(1);
    b.storeAddress(ref);
  } else {
    b.storeBit(0);
  }

  return b.endCell();
}

export async function run(provider: NetworkProvider) {
  assertTestnet(provider, "buy");
  loadEnv();

  const presaleAddr =
    envMaybeAddress("PRESALE_ADDRESS") ??
    envMaybeAddress("PRESALE") ??
    CFG.PRESALE;

  const presale = provider.open(Presale.fromAddress(presaleAddr));

  const connected = provider.sender().address;
  if (!connected) throw new Error("Provider sender address is not available");

  const tonStr = (envMaybeStr("TON") ?? "0.5").trim();
  const ton = toNano(tonStr);
  if (ton <= 0n) throw new Error(`TON is invalid: ${tonStr}`);

  const ref = envMaybeAddress("REF");
  const mode = (envMaybeStr("BUY_MODE") ?? "manual").trim().toLowerCase();
  const printInbound = boolOn("PRINT_INBOUND");

  console.log("🏷️ Presale:", presaleAddr.toString());
  console.log("🔐 Connected wallet:", connected.toString());
  console.log("💸 TON:", tonStr, "TON", `(nano: ${ton.toString()})`);
  console.log("🔗 REF:", ref ? ref.toString() : "(none)");
  console.log("🧩 BUY_MODE:", mode);
  console.log("");

  if (printInbound) {
    console.log("🧩 PRINT_INBOUND=1 → showing last inbound senders to PRESALE:");
    await printLastInboundSenders(presaleAddr, 15);
  }

  if (mode === "abi") {
    console.log("Sending ABI BuyAbi transaction. Approve in your wallet...");
    await presale.send(
      provider.sender(),
      { value: ton },
      { $$type: "BuyAbi", ref: ref ?? null }
    );
    console.log("✅ BuyAbi sent.");
    console.log("➡️ Next: npx blueprint run check --testnet");
    return;
  }

  // default: manual
  const payload = buildManualBuyPayload(ref ?? null);

  console.log("Sending MANUAL buy transaction. Approve in your wallet...");
  await provider.sender().send({
    to: presaleAddr,
    value: ton,
    body: payload,
  });

  console.log("✅ Manual buy sent.");
  console.log("➡️ Next: npx blueprint run check --testnet");
}

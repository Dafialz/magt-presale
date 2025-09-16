// scripts/trace-mint.ts
// Показати останні транзакції MAGT_MINTER і витягти exit_code для мінтових вхідних від ADMIN_ADDRESS.

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// ====== ENV ======
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const MAGT_MINTER = (process.env.MAGT_MINTER || "").trim();
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || "").trim();
const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || "";

if (!MAGT_MINTER) throw new Error("MAGT_MINTER required in .env.local");

// derive REST base from jsonRPC endpoint
const rpc =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const restBase = rpc.replace(/\/jsonRPC$/i, "");

// ---- utils ----
function* deepPairs(obj: any, pathSegs: string[] = []): Generator<{ path: string[]; key: string; value: any }> {
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      yield { path: pathSegs, key: k, value: (obj as any)[k] };
      yield* deepPairs((obj as any)[k], pathSegs.concat(k));
    }
  }
}

function findExitCodes(tx: any): Array<{ path: string; value: any }> {
  const hits: Array<{ path: string; value: any }> = [];
  const keys = new Set(["exit_code", "vm_exit_code", "compute_exit_code"]);
  for (const { path, key, value } of deepPairs(tx)) {
    if (keys.has(key) && (typeof value === "number" || typeof value === "string")) {
      hits.push({ path: path.concat(key).join("."), value });
    }
  }
  return hits;
}

function asUtime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toISOString().replace("T", " ").replace(".000Z", " UTC");
}
const short = (s: string, n = 16) => (typeof s === "string" && s.length > n ? `${s.slice(0, n)}…` : s);
const asArray = (x: any) => (Array.isArray(x) ? x : x == null ? [] : [x]);

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url as any);
  if (!(res as any).ok) {
    const text = await (res as any).text();
    throw new Error(`HTTP ${(res as any).status}: ${text}`);
  }
  return await (res as any).json();
}

function buildUrl(limit: number, archival = true) {
  const q = new URLSearchParams({
    address: MAGT_MINTER,
    limit: String(limit),
    archival: archival ? "true" : "false",
  });
  if (TONCENTER_API_KEY) q.set("api_key", TONCENTER_API_KEY);
  return `${restBase}/getTransactions?${q.toString()}`;
}

// ---- main ----
async function main() {
  const limit = Number(process.argv.find((x) => /^\d+$/.test(x)) || 20);
  const verbose = process.argv.includes("-v") || process.argv.includes("--verbose");

  let data: any;
  try {
    data = await fetchJson(buildUrl(limit, true));
  } catch (e: any) {
    // fallback: якщо прилетів 500 "lt not in db", пробуємо ще раз
    if (String(e?.message).includes("lt not in db")) {
      console.warn("⚠️ archival=true retry...");
      data = await fetchJson(buildUrl(limit, true));
    } else {
      throw e;
    }
  }

  const txs: any[] = asArray(data?.result || data?.transactions || (data?.ok && data?.result));
  if (verbose) {
    console.log("RAW keys:", Object.keys(data || {}));
    if (!txs.length) console.dir(data, { depth: 4 });
  }
  if (!txs.length) {
    console.log("Нема транзакцій для мінтера або API нічого не повернув.");
    return;
  }

  console.log("=== Last transactions of MAGT_MINTER ===");
  console.log("MINTER:", MAGT_MINTER);
  if (ADMIN_ADDRESS) console.log("ADMIN :", ADMIN_ADDRESS);
  console.log("");

  let picked: any | null = null;
  if (ADMIN_ADDRESS) {
    picked =
      txs.find((t: any) => {
        const inMsg = t?.in_msg || {};
        const src =
          inMsg.source ||
          inMsg.source_friendly ||
          inMsg.source_address ||
          inMsg.source_addr ||
          "";
        return src && String(src).includes(ADMIN_ADDRESS);
      }) || null;
  }
  const show = picked || txs[0];

  const lt = show?.transaction_id?.lt || show?.lt || "";
  const hash = show?.transaction_id?.hash || show?.hash || "";
  const utime = show?.utime || show?.now || (show?.now_ms && Math.round(Number(show.now_ms) / 1000));
  const inMsg = show?.in_msg || {};
  const outMsgs = asArray(show?.out_msgs);

  console.log("------------------------------------------------------------");
  console.log(`lt: ${lt}   hash: ${hash}`);
  console.log(`time: ${asUtime(Number(utime))}`);
  console.log(
    `in:   from=${inMsg.source || inMsg.source_friendly || ""}  value=${inMsg.value || inMsg.value_atomic || ""}`
  );
  console.log(`     to  =${inMsg.destination || inMsg.destination_friendly || ""}`);
  if (inMsg.msg_data && typeof inMsg.msg_data === "object") {
    const tpe = inMsg.msg_data["@type"] || inMsg.msg_data.type || "";
    const body = inMsg.msg_data["body"] || inMsg.msg_data["body_hash"] || "";
    console.log(`     body_type=${tpe} body=${typeof body === "string" ? short(body, 32) : ""}`);
  }

  const aborted =
    show?.aborted ?? show?.description?.aborted ?? show?.compute_phase?.aborted ?? show?.status_name === "aborted";
  console.log("aborted:", aborted);

  const exits = findExitCodes(show);
  if (exits.length) {
    console.log("exit_codes:");
    for (const e of exits) console.log(`  ${e.path}: ${e.value}`);
  } else {
    console.log("exit_codes: (не знайдено у відповіді; запусти з --verbose для сирого JSON)");
  }

  console.log(`out_msgs (${outMsgs.length}):`);
  for (const m of outMsgs) {
    const to = m?.destination || m?.destination_friendly || "";
    const val = m?.value || m?.value_atomic || "";
    console.log(`  → ${to}  value=${val}`);
  }

  if (!picked) {
    console.log("\nℹ️ Не знайдено вхідної від ADMIN_ADDRESS серед останніх. Можливо, потрібен більший limit:");
    console.log("   npx ts-node -P tsconfig.scripts.json scripts/trace-mint.ts 50 --verbose");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

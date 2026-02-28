import { Address } from "@ton/core";
import { loadEnv, envMaybeStr, envStr } from "./env";

loadEnv();

function toFriendly(a: Address): string {
  return a.toString({ testOnly: true });
}

function envAddr(name: string): Address {
  const v = (process.env[name] ?? "").trim();
  if (!v) throw new Error(`Missing ${name} in .env`);
  return Address.parse(v);
}

function envInt(name: string, def: number): number {
  const raw = (process.env[name] ?? "").trim();
  if (!raw) return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function envBool(name: string): boolean {
  const v = (process.env[name] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

const TONCENTER_REST = envStr(
  "TONCENTER_REST",
  envStr("TONCENTER_API", "https://testnet.toncenter.com/api/v2")!
)!;

const TONCENTER_API_KEY = envMaybeStr("TONCENTER_API_KEY") ?? "";

/**
 * backoff (наростаюча пауза) + jitter (рандомний шум)
 * щоб не ловити Toncenter 429 на testnet.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  // +/- 25%
  const delta = ms * 0.25;
  return Math.max(0, Math.floor(ms + (Math.random() * 2 - 1) * delta));
}

async function toncenterGetJSON(url: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (TONCENTER_API_KEY) headers["X-API-Key"] = TONCENTER_API_KEY;

  // Tunables (can be overridden via .env if you want later)
  const maxRetries = envInt("TONCENTER_MAX_RETRIES", 7);
  const baseDelayMs = envInt("TONCENTER_RETRY_BASE_MS", 1500);
  const maxDelayMs = envInt("TONCENTER_RETRY_MAX_MS", 60000);
  const reqTimeoutMs = envInt("TONCENTER_TIMEOUT_MS", 20000);

  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), reqTimeoutMs);

    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      const txt = await res.text();

      // 429: rate limit -> retry with exponential backoff
      if (res.status === 429) {
        attempt++;
        if (attempt > maxRetries) {
          throw new Error(
            `Toncenter HTTP 429 (after ${maxRetries} retries): ${txt}`
          );
        }
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
        const delayJ = jitter(delay);
        console.log(
          `⏳ Toncenter rate limit (429). Retry ${attempt}/${maxRetries} after ${delayJ} ms...`
        );
        await sleep(delayJ);
        continue;
      }

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            `Toncenter 401 (invalid API key). Check TONCENTER_API_KEY in .env`
          );
        }
        throw new Error(`Toncenter HTTP ${res.status}: ${txt}`);
      }

      return JSON.parse(txt);
    } catch (e: any) {
      // timeout
      if (e?.name === "AbortError") {
        attempt++;
        if (attempt > maxRetries) {
          throw new Error(
            `Toncenter request timeout (${reqTimeoutMs}ms) after ${maxRetries} retries`
          );
        }
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
        const delayJ = jitter(delay);
        console.log(
          `⏳ Toncenter timeout. Retry ${attempt}/${maxRetries} after ${delayJ} ms...`
        );
        await sleep(delayJ);
        continue;
      }

      // transient network errors -> retry
      attempt++;
      if (attempt > maxRetries) throw e;

      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const delayJ = jitter(delay);
      console.log(
        `⏳ Toncenter fetch error. Retry ${attempt}/${maxRetries} after ${delayJ} ms... (${e?.message ?? e})`
      );
      await sleep(delayJ);
      continue;
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function getBalanceNano(addr: string): Promise<bigint> {
  const url = `${TONCENTER_REST.replace(/\/$/, "")}/getAddressBalance?address=${encodeURIComponent(
    addr
  )}`;
  const json = await toncenterGetJSON(url);
  if (!json?.ok) throw new Error(`Bad balance response: ${JSON.stringify(json)}`);
  return BigInt(json.result);
}

type Tx = any;

async function getTransactionsPage(args: {
  address: string;
  limit: number; // <= 1000
  lt?: string;
  hash?: string;
}): Promise<Tx[]> {
  const p: string[] = [];
  p.push(`address=${encodeURIComponent(args.address)}`);
  p.push(`limit=${encodeURIComponent(String(args.limit))}`);
  if (args.lt) p.push(`lt=${encodeURIComponent(args.lt)}`);
  if (args.hash) p.push(`hash=${encodeURIComponent(args.hash)}`);

  const url = `${TONCENTER_REST.replace(/\/$/, "")}/getTransactions?${p.join("&")}`;
  const json = await toncenterGetJSON(url);
  if (!json?.ok) throw new Error(`Bad tx response: ${JSON.stringify(json)}`);
  return json.result ?? [];
}

async function getTransactionsPaged(address: string, totalLimit: number): Promise<Tx[]> {
  const want = Math.max(0, totalLimit);
  if (want === 0) return [];

  let out: Tx[] = [];
  let lt: string | undefined;
  let hash: string | undefined;

  // polite: short delay between pages to reduce 429 probability
  const pageDelayMs = envInt("TONCENTER_PAGE_DELAY_MS", 250);

  while (out.length < want) {
    const remain = want - out.length;
    const lim = Math.min(1000, remain);

    const page = await getTransactionsPage({ address, limit: lim, lt, hash });
    if (!page.length) break;

    out = out.concat(page);

    const last = page[page.length - 1];
    lt = last?.transaction_id?.lt;
    hash = last?.transaction_id?.hash;

    // if toncenter returns same cursor => break
    if (!lt || !hash) break;

    if (pageDelayMs > 0) {
      await sleep(pageDelayMs);
    }
  }

  return out;
}

function pickAddrFromTx(tx: Tx): string[] {
  const addrs: string[] = [];
  const inMsg = tx?.in_msg;
  if (inMsg?.source) addrs.push(inMsg.source);
  if (inMsg?.destination) addrs.push(inMsg.destination);

  const out = tx?.out_msgs;
  if (Array.isArray(out)) {
    for (const m of out) {
      if (m?.source) addrs.push(m.source);
      if (m?.destination) addrs.push(m.destination);
    }
  }
  return addrs;
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export async function run() {
  const presale = envAddr("PRESALE");
  const target = envAddr("OWNER"); // default target = OWNER, you can add TARGET_ADDRESS if you want

  const txLimit = envInt("TX_LIMIT", 200);
  const scanMax = envInt("SCAN_MAX_ADDR", 200);
  const doScan = envBool("SCAN_CLAIMABLE");

  const presaleStr = toFriendly(presale);
  const targetStr = toFriendly(target);

  console.log(`🏷️ Presale: ${presaleStr}`);
  console.log(`🎯 Checked address (TARGET): ${targetStr}`);
  console.log(`🌐 TONCENTER_REST: ${TONCENTER_REST}`);
  console.log(`🔑 TONCENTER_API_KEY: ${TONCENTER_API_KEY ? "SET" : "NOT SET"}`);

  const balNano = await getBalanceNano(presaleStr);
  console.log(`\n💰 Presale TON balance (nanoTON): ${balNano.toString()}`);
  console.log(`💰 Presale TON balance (TON): ${Number(balNano) / 1e9}`);

  console.log(`\n🧾 Last messages to/from PRESALE (toncenter REST getTransactions):`);
  const txs = await getTransactionsPaged(presaleStr, txLimit);
  console.log(`   ℹ️ Loaded txs: ${txs.length}`);

  for (const tx of txs.slice(0, 10)) {
    const v = tx?.in_msg?.value ? Number(tx.in_msg.value) / 1e9 : 0;
    const src = tx?.in_msg?.source ? String(tx.in_msg.source) : "unknown";
    console.log(`   in: from ${src.slice(0, 10)}… value=${v} TON`);
  }

  if (doScan) {
    const addrPool = uniq(txs.flatMap(pickAddrFromTx))
      .filter(Boolean)
      .slice(0, scanMax);

    console.log(
      `\n🔍 Readonly scan: checking ${addrPool.length} addresses (from tx in/out)...`
    );
    console.log(`   (Note: readonly scan can only find addresses seen in tx history.)`);

    // Here we only print addresses; actual "claimable per address" requires contract get-methods
    // that may be project-specific. We keep it generic and safe.
    for (const a of addrPool.slice(0, 50)) {
      console.log(`   addr: ${a}`);
    }

    if (addrPool.length > 50) {
      console.log(`   ... and ${addrPool.length - 50} more`);
    }
  }

  console.log(`\n✅ check_readonly finished.`);
}
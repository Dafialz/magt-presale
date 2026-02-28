// scripts/check.ts
import { Address, fromNano, toNano, beginCell, Cell } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { Presale } from "../build/Presale/Presale_Presale";
import { loadEnv, envMaybeStr, envStr } from "./env";
import { Buffer } from "buffer";

function envMaybeAddress(key: string): Address | null {
  const raw = (process.env[key] ?? "").trim();
  if (!raw) return null;
  return Address.parse(raw);
}

function envAddress(key: string): Address {
  const a = envMaybeAddress(key);
  if (!a) throw new Error(`${key} is missing or empty`);
  return a;
}

function envMaybeNum(key: string, def?: number): number | undefined {
  const raw = (process.env[key] ?? "").trim();
  if (!raw) return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function envBool(key: string): boolean {
  const v = (process.env[key] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

function fmtTokens(nano: bigint, decimals = 9): string {
  const s = nano.toString();
  const neg = s.startsWith("-");
  const t = neg ? s.slice(1) : s;
  const pad = t.padStart(decimals + 1, "0");
  const int = pad.slice(0, -decimals);
  const frac = pad.slice(-decimals).replace(/0+$/, "");
  return `${neg ? "-" : ""}${int}${frac ? "." + frac : ""}`;
}

// envStr у твоєму env.ts приймає (key, defaultString)
const TONCENTER_REST = envStr("TONCENTER_REST", "https://testnet.toncenter.com/api/v2")!;
const TONCENTER_JSONRPC = envStr("TONCENTER_JSONRPC", "https://testnet.toncenter.com/api/v2/jsonRPC")!;
const TONCENTER_API_KEY = envMaybeStr("TONCENTER_API_KEY") ?? "";

// -----------------------------
// REST helpers
// -----------------------------
async function toncenterGetJSON(url: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (TONCENTER_API_KEY) headers["X-API-Key"] = TONCENTER_API_KEY;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`toncenter http ${res.status}: ${txt}`);
  }
  return await res.json();
}

async function toncenterGetBalanceNano(address: string): Promise<bigint> {
  const url = `${TONCENTER_REST}/getAddressBalance?address=${encodeURIComponent(address)}`;
  const json = await toncenterGetJSON(url);
  return BigInt(json?.result ?? "0");
}

async function toncenterGetAddressInformation(
  address: string
): Promise<{ state: string; balance: bigint } | null> {
  try {
    const url = `${TONCENTER_REST}/getAddressInformation?address=${encodeURIComponent(address)}`;
    const json = await toncenterGetJSON(url);
    const state = json?.result?.state ?? "unknown";
    const balance = BigInt(json?.result?.balance ?? "0");
    return { state, balance };
  } catch {
    return null;
  }
}

/**
 * Single page fetch.
 * toncenter REST getTransactions limit MUST be <= 1000.
 * Cursor is (lt, hash) from the last tx.
 */
async function toncenterGetTransactionsPage(args: {
  address: string;
  limit: number; // <= 1000
  lt?: string;
  hash?: string;
}): Promise<any[]> {
  const limit = Math.min(1000, Math.max(1, Math.floor(args.limit)));

  const p: string[] = [];
  p.push(`address=${encodeURIComponent(args.address)}`);
  p.push(`limit=${encodeURIComponent(String(limit))}`);
  if (args.lt) p.push(`lt=${encodeURIComponent(args.lt)}`);
  if (args.hash) p.push(`hash=${encodeURIComponent(args.hash)}`);

  const url = `${TONCENTER_REST}/getTransactions?${p.join("&")}`;
  const json = await toncenterGetJSON(url);
  return (json?.result ?? []) as any[];
}

/**
 * Paged fetch up to totalLimit (can be > 1000). Uses lt/hash pagination.
 * Hard-capped for safety.
 */
async function toncenterGetTransactionsPaged(address: string, totalLimit: number): Promise<any[]> {
  const want = Math.max(0, Math.floor(totalLimit));
  if (want <= 0) return [];

  const HARD_MAX = 5000; // safety
  const finalWant = Math.min(want, HARD_MAX);

  const out: any[] = [];
  let cursorLt: string | undefined;
  let cursorHash: string | undefined;

  while (out.length < finalWant) {
    const remaining = finalWant - out.length;
    const pageLimit = Math.min(1000, remaining);

    let page: any[] = [];
    try {
      page = await toncenterGetTransactionsPage({
        address,
        limit: pageLimit,
        lt: cursorLt,
        hash: cursorHash,
      });
    } catch (e: any) {
      // If toncenter complains, stop instead of looping forever
      throw e;
    }

    if (!page.length) break;

    out.push(...page);

    const last = page[page.length - 1];
    const tid = last?.transaction_id ?? last?.tx_id ?? null;
    const lt = tid?.lt;
    const hash = tid?.hash;

    if (!lt || !hash) break;

    cursorLt = String(lt);
    cursorHash = String(hash);

    if (page.length < pageLimit) break;
  }

  return out;
}

function shortAddr(a: string): string {
  return a.length > 18 ? `${a.slice(0, 8)}…${a.slice(-8)}` : a;
}

// -----------------------------
// JSON-RPC helpers (more reliable for JettonWallet getters)
// -----------------------------
async function toncenterJsonRpc(method: string, params: any): Promise<any> {
  const r = await fetch(TONCENTER_JSONRPC, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(TONCENTER_API_KEY ? { "X-API-Key": TONCENTER_API_KEY } : {}),
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

function parseAddressFromRunGet(res: any): Address | null {
  const stack = res?.stack ?? [];
  const first = Array.isArray(stack) ? stack[0] : undefined;
  const bytes: string | undefined = Array.isArray(first) ? first?.[1]?.bytes : first?.value?.bytes;

  if (!bytes || typeof bytes !== "string") return null;

  const cell = Cell.fromBoc(Buffer.from(bytes, "base64"))[0]!;
  const s = cell.beginParse();
  return s.loadAddress() ?? null;
}

// JettonWallet.get_wallet_data() => stack[0] balance (int)
function parseJettonBalanceFromWalletData(res: any): bigint | null {
  const stack = res?.stack ?? [];
  const first = Array.isArray(stack) ? stack[0] : undefined;
  if (!first) return null;

  // toncenter can return:
  // 1) ["num","123"] or ["int","123"]
  // 2) { type: "...", value: "123" }
  let raw: any;
  if (Array.isArray(first)) raw = first[1];
  else raw = first?.value;

  if (raw === undefined || raw === null) return null;

  if (typeof raw === "object" && raw !== null && "value" in raw) raw = (raw as any).value;

  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

async function resolveJettonWallet(jettonMaster: Address, owner: Address): Promise<Address | null> {
  const res = await toncenterJsonRpc("runGetMethod", {
    address: jettonMaster.toString(),
    method: "get_wallet_address",
    stack: [["slice", { bytes: addressSliceBocBase64(owner) }]],
  });
  return parseAddressFromRunGet(res);
}

async function readJettonWalletBalance(wallet: Address): Promise<bigint | null> {
  const res = await toncenterJsonRpc("runGetMethod", {
    address: wallet.toString(),
    method: "get_wallet_data",
    stack: [],
  });
  return parseJettonBalanceFromWalletData(res);
}

function pushAddr(set: Set<string>, v: any) {
  const s = String(v ?? "").trim();
  if (!s) return;
  try {
    set.add(Address.parse(s).toString());
  } catch {
    // ignore
  }
}

export async function run(provider: NetworkProvider) {
  loadEnv();

  const presaleAddr = envAddress("PRESALE");
  const presaleAddrStr = presaleAddr.toString();

  const jettonMaster = envMaybeAddress("JETTON_MASTER");
  const jettonMasterStr = jettonMaster ? jettonMaster.toString() : "";

  const connected = (await provider.sender().address)!.toString();
  const target = envMaybeStr("TARGET_ADDRESS") || connected;
  const targetAddr = Address.parse(target);

  console.log(`🏷️ Presale: ${presaleAddrStr}`);
  console.log(`🪙 Jetton Minter: ${jettonMasterStr || "n/a"}`);
  console.log(`🔐 Connected wallet: ${connected}`);
  console.log(`🎯 Checked address (TARGET): ${target}`);

  console.log(
    `🔎 TARGET variants: ${targetAddr.toRawString()} | ${targetAddr.toString({
      bounceable: false,
    })} | ${targetAddr.toString({ bounceable: true })} | ${targetAddr.toString()} | ${targetAddr.toString({
      testOnly: true,
    })}`
  );

  // Presale TON balance
  const presaleTonNano = await toncenterGetBalanceNano(presaleAddrStr);
  console.log(`\n💰 Presale TON balance (nanoTON): ${presaleTonNano.toString()}`);
  console.log(`💰 Presale TON balance (TON): ${fromNano(presaleTonNano)}\n`);

  // Safe withdraw hint (default 0.7 TON, override via LEAVE_TON)
  const leaveTonNum = envMaybeNum("LEAVE_TON", 0.7) ?? 0.7;
  const leaveTonNano = toNano(leaveTonNum);
  const withdrawable = presaleTonNano > leaveTonNano ? presaleTonNano - leaveTonNano : 0n;
  console.log(`💡 Safe withdraw (leave ${leaveTonNum} TON on presale):`);
  console.log(`   withdrawable (nanoTON): ${withdrawable.toString()}`);
  console.log(`   withdrawable (TON): ${fromNano(withdrawable)}`);
  console.log(
    `   cmd: AMOUNT_TON=${fromNano(withdrawable)} ./node_modules/.bin/blueprint run withdrawTon --testnet\n`
  );

  // Presale wrapper
  const presale = provider.open(Presale.fromAddress(presaleAddr));

  // Presale JettonWallet (from .env)
  const presaleJettonWalletStr = envMaybeStr("PRESALE_JETTON_WALLET") || "";
  console.log(`🏦 Presale Jetton Wallet: ${presaleJettonWalletStr || "n/a"}`);

  if (presaleJettonWalletStr) {
    const info = await toncenterGetAddressInformation(presaleJettonWalletStr);
    if (info) {
      console.log(`🧠 Presale Jetton Wallet state: ${info.state}`);
      console.log(`💰 Presale Jetton Wallet TON balance (nanoTON): ${info.balance.toString()}`);
    } else {
      console.log(`🧠 Presale Jetton Wallet state: unknown`);
    }

    // Reliable balance read via JSON-RPC get_wallet_data
    try {
      const bal = await readJettonWalletBalance(Address.parse(presaleJettonWalletStr));
      if (bal === null) {
        console.log(`🪙 Presale Jetton balance: n/a`);
      } else {
        console.log(`🪙 Presale Jetton balance (nano): ${bal.toString()}`);
        console.log(`🪙 Presale Jetton balance (tokens): ${fmtTokens(bal)}`);
      }
    } catch (e: any) {
      console.log(`🪙 Presale Jetton balance: n/a (${e?.message ?? e})`);
    }
  }

  // TARGET JettonWallet (resolve via JSON-RPC)
  let targetJettonWalletAddr: string | null = null;
  if (jettonMaster) {
    try {
      const jw = await resolveJettonWallet(jettonMaster, targetAddr);
      targetJettonWalletAddr = jw ? jw.toString() : null;
    } catch {
      targetJettonWalletAddr = null;
    }
  }

  console.log(
    `\n👤 TARGET: ${target}\n💼 TARGET Jetton Wallet: ${targetJettonWalletAddr ?? "n/a"}${
      !jettonMaster ? " (check JETTON_MASTER)" : ""
    }`
  );

  // Presale getters
  const jettonWalletSet = await presale.getJettonWalletSet();
  const totalClaimableNano = await presale.getTotalClaimableNano();
  const totalPendingNano = await presale.getTotalPendingNano();

  console.log(`\njettonWalletSet: ${jettonWalletSet}`);
  console.log(`totalClaimableNano (contract): ${totalClaimableNano} (${fmtTokens(totalClaimableNano)} tokens)`);
  console.log(`totalPendingNano (contract): ${totalPendingNano} (${fmtTokens(totalPendingNano)} tokens)\n`);

  const claimableBuyerNano = await presale.getClaimableBuyerNano(targetAddr);
  const claimableReferralNano = await presale.getClaimableReferralNano(targetAddr);
  const claimableTotal = claimableBuyerNano + claimableReferralNano;

  console.log(`claimableBuyerNano (TARGET): ${claimableBuyerNano}`);
  console.log(`claimableBuyerTokens (TARGET): ${fmtTokens(claimableBuyerNano)}`);
  console.log(`claimableReferralNano (TARGET): ${claimableReferralNano}`);
  console.log(`claimableReferralTokens (TARGET): ${fmtTokens(claimableReferralNano)}`);
  console.log(`claimableNano TOTAL (TARGET): ${claimableTotal}`);
  console.log(`claimableTokens TOTAL (TARGET): ${fmtTokens(claimableTotal)}\n`);

  const doScan = envBool("SCAN_CLAIMABLE") || (totalClaimableNano > 0n && claimableTotal === 0n);

  if (claimableTotal === 0n) {
    console.log(`✅ claimable = 0 (TARGET has nothing to claim).`);
    if (totalClaimableNano > 0n) {
      console.log(`⚠️ But contract totalClaimableNano > 0 → нараховано іншій адресі.`);
      console.log(
        doScan
          ? `➡️ SCAN_CLAIMABLE=1 → роблю розширений скан адрес із tx (in_msg + out_msgs).\n`
          : `➡️ Можу знайти адресу автоматично: увімкни SCAN_CLAIMABLE=1 і збільши TX_LIMIT.\n`
      );
    }
  }

  // Transactions
  console.log(`🧾 Last messages to/from PRESALE (toncenter REST getTransactions):`);
  try {
    const txLimitRaw = envMaybeNum("TX_LIMIT", 150) ?? 150;
    const txLimit = Math.max(0, Math.floor(txLimitRaw));

    const scanMaxAddrRaw = envMaybeNum("SCAN_MAX_ADDR", 400) ?? 400;
    const scanMaxAddr = Math.max(0, Math.floor(scanMaxAddrRaw));

    if (txLimit > 1000) {
      console.log(
        `   ℹ️ TX_LIMIT=${txLimit} > 1000. Toncenter REST limit/page <= 1000 → буду грузити з пагінацією.`
      );
    }

    const txs = await toncenterGetTransactionsPaged(presaleAddrStr, txLimit);
    console.log(`   ℹ️ Loaded txs: ${txs.length}`);

    const inbound = txs.filter((t) => t?.in_msg && t?.in_msg?.source);
    if (!inbound.length) {
      console.log(`   (no inbound messages found in last tx batch)`);
    } else {
      for (const t of inbound.slice(0, 8)) {
        const src = String(t?.in_msg?.source ?? "");
        const val = t?.in_msg?.value;
        console.log(`   in:  from ${shortAddr(src)} value=${fromNano(BigInt(val ?? "0"))} TON`);
      }
    }

    if (!doScan) return;

    // Extended scan: collect addresses from in_msg + out_msgs + known env addresses
    const addrSet = new Set<string>();

    // Known addresses
    pushAddr(addrSet, presaleAddrStr);
    pushAddr(addrSet, connected);
    pushAddr(addrSet, target);

    if (presaleJettonWalletStr) pushAddr(addrSet, presaleJettonWalletStr);
    if (targetJettonWalletAddr) pushAddr(addrSet, targetJettonWalletAddr);

    pushAddr(addrSet, process.env.OWNER);
    pushAddr(addrSet, process.env.OWNER_JETTON_WALLET);
    pushAddr(addrSet, process.env.JETTON_WALLET_FROM);

    // Collect from txs (in + out + a few common field variants)
    for (const t of txs) {
      pushAddr(addrSet, t?.in_msg?.source);
      pushAddr(addrSet, t?.in_msg?.src);
      pushAddr(addrSet, t?.in_msg?.destination);
      pushAddr(addrSet, t?.in_msg?.dest);

      const outs = Array.isArray(t?.out_msgs) ? t.out_msgs : [];
      for (const m of outs) {
        pushAddr(addrSet, m?.destination);
        pushAddr(addrSet, m?.dest);
        pushAddr(addrSet, m?.source);
        pushAddr(addrSet, m?.src);
      }
    }

    const all = Array.from(addrSet);
    console.log("");
    console.log(
      `🔍 Extended scan: checking claimable for ${Math.min(all.length, scanMaxAddr)} addresses (from tx in/out)...`
    );

    let found = 0;

    for (const s of all.slice(0, scanMaxAddr)) {
      let a: Address;
      try {
        a = Address.parse(s);
      } catch {
        continue;
      }

      const b = await presale.getClaimableBuyerNano(a);
      const r = await presale.getClaimableReferralNano(a);
      const tot = b + r;

      if (tot > 0n) {
        found++;
        console.log(`✅ ${a.toString()}: claimable=${fmtTokens(tot)} (buyer=${fmtTokens(b)}, ref=${fmtTokens(r)})`);
      }
    }

    if (!found) {
      console.log(`❌ No claimable found in extended scan.`);
      console.log(`➡️ Increase TX_LIMIT / SCAN_MAX_ADDR and re-run:`);
      console.log(
        `   $env:TX_LIMIT="1200"; $env:SCAN_MAX_ADDR="800"; $env:SCAN_CLAIMABLE="1"; npx blueprint run check --testnet`
      );
      console.log(`   (пагінація працює; toncenter page-limit 1000 буде обійдено автоматично)`);
    } else {
      console.log(`➡️ Set TARGET_ADDRESS to the ✅ address above and re-run check/claim.`);
    }
  } catch (e: any) {
    console.log(`   (failed to load txs: ${e?.message ?? e})`);
  }
}
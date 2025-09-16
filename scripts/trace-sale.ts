// scripts/trace-sale.ts
// Трейс останніх транзакцій SALE і його JettonWallet (SALE_JW)
/* eslint-disable */
// @ts-nocheck

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Address, beginCell } from "@ton/core";
import { TonClient } from "@ton/ton";

const envLocal = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env"), override: true });

const {
  SALE_ADDRESS = "",
  MAGT_MINTER = "",
  NETWORK = "mainnet",
  TONCENTER_API_KEY,
} = process.env;

if (!SALE_ADDRESS || !MAGT_MINTER) {
  throw new Error("Потрібні SALE_ADDRESS та MAGT_MINTER у .env.local");
}

const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });

const fmtUQ = (a: Address | string) =>
  (typeof a === "string" ? Address.parse(a) : a).toString({ urlSafe: true, bounceable: false });

async function getSaleJW(minter: Address, owner: Address): Promise<Address> {
  const r: any = await client.runMethod(minter, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
  ]);
  return r.stack.readAddress();
}

function printTxHeader(title: string) {
  console.log("\n============================================================");
  console.log(`=== ${title} ===`);
  console.log("============================================================\n");
}

function short(s: string, n = 20) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n - 2) + "…" : s;
}

function nanoToTon(n: string | number | bigint) {
  const v = BigInt(n);
  const t = v / 1000000000n;
  const f = (v % 1000000000n).toString().padStart(9, "0").replace(/0+$/, "");
  return f ? `${t}.${f}` : `${t}`;
}

async function dumpAddressTx(addr: Address, limit = 20) {
  // 1) спроба через high-level клієнт
  try {
    const txs = await client.getTransactions(addr, { limit });
    for (const t of txs) {
      const ts = new Date(Number(t.now) * 1000).toISOString().replace(".000Z", "Z");
      console.log("------------------------------------------------------------");
      console.log(`lt: ${t.lt}   hash: ${t.hash.toString("base64")}`);
      console.log(`time: ${ts}`);
      if (t.inMessage) {
        const from = t.inMessage.info.src?.toString({ urlSafe: true }) ?? "-";
        const val  = t.inMessage.info.value?.coins ?? 0n;
        console.log(
          `in:   from=${short(from)}  value=${val.toString()} (${nanoToTon(val)} TON)`
        );
      } else {
        console.log("in:   (none)");
      }
      console.log(`aborted: ${!!t.description?.aborted}`);
      const ec = (t.description as any)?.computePhase?.exitCode ?? (t.description as any)?.actionPhase?.resultCode;
      if (typeof ec !== "undefined") {
        console.log(`exit_code: ${ec}`);
      }

      if (t.outMessages?.length) {
        console.log(`out_msgs (${t.outMessages.length}):`);
        for (const m of t.outMessages) {
          const to = m.info.dest?.toString({ urlSafe: true }) ?? "-";
          const v  = m.info.value?.coins ?? 0n;
          const btype = (m.body && m.body.length > 0) ? "raw" : "(empty)";
          console.log(`  → ${short(to)}  value=${v.toString()} (${nanoToTon(v)} TON)  body=${btype}`);
        }
      } else {
        console.log("out_msgs (0)");
      }
    }
    return;
  } catch (e) {
    console.warn("High-level getTransactions не вдалось, спробуємо raw:", (e as any)?.message || e);
  }

  // 2) raw-виклик toncenter (іноді дає більше полів)
  const raw = await (client as any).api.call("getTransactions", {
    address: addr.toString({ urlSafe: true }),
    limit,
    archival: false,
  });

  const list = raw?.result ?? raw?.transactions ?? [];
  console.log("RAW keys:", Object.keys(raw || {}));
  for (const t of list) {
    const ts = new Date(Number(t.utime) * 1000).toISOString().replace(".000Z", "Z");
    console.log("------------------------------------------------------------");
    console.log(`lt: ${t.lt}   hash: ${t.hash}`);
    console.log(`time: ${ts}`);
    const in_from = t.in_msg?.source ?? t.in_msg?.source_friendly ?? "-";
    const in_val  = t.in_msg?.value ?? "0";
    console.log(`in:   from=${short(in_from)}  value=${in_val} (${nanoToTon(in_val)} TON)`);
    console.log(`aborted: ${!!t.aborted}`);
    const ec =
      t.description?.compute_ph?.exit_code ??
      t.compute_phase?.exit_code ??
      t.description?.aborted;
    if (typeof ec !== "undefined") {
      console.log(`exit_code: ${ec}`);
    } else {
      console.log("exit_codes: (не знайдено у відповіді; є сенс спробувати інший limit)");
    }
    if (Array.isArray(t.out_msgs) && t.out_msgs.length) {
      console.log(`out_msgs (${t.out_msgs.length}):`);
      for (const m of t.out_msgs) {
        const to = m.destination ?? m.destination_friendly ?? "-";
        const v  = m.value ?? "0";
        const tp = m.msg_data?.["@type"] ?? "(unknown)";
        console.log(`  → ${short(to)}  value=${v} (${nanoToTon(v)} TON)  body_type=${tp}`);
      }
    } else {
      console.log("out_msgs (0)");
    }
  }
}

async function main() {
  const limitArg = Number(process.argv[2] || "20");
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 20;

  const sale = Address.parse(SALE_ADDRESS);
  const minter = Address.parse(MAGT_MINTER);
  const saleJW = await getSaleJW(minter, sale);

  printTxHeader(`SALE (${fmtUQ(sale)}) — last ${limit} tx`);
  await dumpAddressTx(sale, limit);

  printTxHeader(`SALE_JW (${fmtUQ(saleJW)}) — last ${limit} tx`);
  await dumpAddressTx(saleJW, limit);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

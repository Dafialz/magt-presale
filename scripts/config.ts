// scripts/config.ts
import { Address } from "@ton/core";
import { loadEnv } from "./env";

/**
 * Central config for scripts:
 * - Loads .env deterministically via scripts/env.ts (works regardless of CWD)
 * - Normalizes & validates TON friendly addresses
 * - NEVER uses a hardcoded presale fallback (to avoid sending to a wrong contract)
 */

loadEnv();

function normalizeFriendlyAddr(s: string): string {
  let v = (s ?? "").trim();

  // remove wrapping quotes
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }

  // remove zero-width chars
  v = v.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // normalize base64url symbols (common paste issues)
  v = v.replace(/\//g, "_").replace(/\+/g, "-");

  return v;
}

function firstNonEmptyEnv(
  names: string[]
): { name: string; value: string } | null {
  for (const n of names) {
    const v = (process.env[n] ?? "").trim();
    if (v) return { name: n, value: v };
  }
  return null;
}

export function addrFromEnv(envName: string, fallback?: string): Address | null {
  const raw = process.env[envName] ?? fallback ?? "";
  const normalized = normalizeFriendlyAddr(raw);
  if (!normalized) return null;

  try {
    return Address.parse(normalized);
  } catch (e: any) {
    throw new Error(
      `Invalid address in ${envName}\n` +
        `RAW:        ${raw}\n` +
        `NORMALIZED: ${normalized}\n` +
        `Error: ${e?.message ?? String(e)}`
    );
  }
}

export function mustAddr(envName: string, fallback?: string): Address {
  const a = addrFromEnv(envName, fallback);
  if (!a) throw new Error(`Missing required address: ${envName}`);
  return a;
}

export function strFromEnv(envName: string, fallback?: string): string {
  return (process.env[envName] ?? fallback ?? "").trim();
}

export function intFromEnv(envName: string, fallback: number): number {
  const v = (process.env[envName] ?? "").trim();
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export const CFG = (() => {
  /**
   * Presale contract address MUST be set explicitly.
   * Accepted env var names:
   *   PRESALE_ADDRESS / PRESALE / PRESALE_CONTRACT
   */
  const presaleHit = firstNonEmptyEnv([
    "PRESALE_ADDRESS",
    "PRESALE",
    "PRESALE_CONTRACT",
  ]);
  if (!presaleHit) {
    throw new Error(
      [
        "Missing presale address.",
        "Set one of: PRESALE_ADDRESS / PRESALE / PRESALE_CONTRACT in your .env",
        "Example:",
        "  PRESALE_ADDRESS=EQ....",
      ].join("\n")
    );
  }

  const presaleNormalized = normalizeFriendlyAddr(presaleHit.value);
  let PRESALE: Address;
  try {
    PRESALE = Address.parse(presaleNormalized);
  } catch (e: any) {
    throw new Error(
      `Invalid presale address in ${presaleHit.name}\n` +
        `RAW:        ${presaleHit.value}\n` +
        `NORMALIZED: ${presaleNormalized}\n` +
        `Error: ${e?.message ?? String(e)}`
    );
  }

  // Toncenter: allow either TONCENTER_API (base) or TONCENTER_JSONRPC (full)
  const TONCENTER_API = strFromEnv(
    "TONCENTER_API",
    "https://testnet.toncenter.com/api/v2"
  );
  const TONCENTER_JSONRPC = strFromEnv(
    "TONCENTER_JSONRPC",
    `${TONCENTER_API.replace(/\/$/, "")}/jsonRPC`
  );

  return {
    PRESALE,

    // Your jetton master (override via JETTON_MASTER) — optional for some scripts
    JETTON_MASTER: addrFromEnv("JETTON_MASTER"),

    // Owner wallet (override via OWNER) — optional for some scripts, REQUIRED for deployPresale.ts
    OWNER: addrFromEnv("OWNER"),

    // Owner jetton wallet (common name: OWNER_JETTON_WALLET) — optional
    OWNER_JETTON_WALLET: addrFromEnv("OWNER_JETTON_WALLET"),

    // Resolved jetton wallet of the Presale contract (override via PRESALE_JETTON_WALLET) — optional
    PRESALE_JETTON_WALLET: addrFromEnv("PRESALE_JETTON_WALLET"),

    // Optional: your personal Jetton wallet (used as "from" in fundJettons)
    // Accepts either JETTON_WALLET_FROM or OWNER_JETTON_WALLET for backwards-compat.
    JETTON_WALLET_FROM:
      addrFromEnv("JETTON_WALLET_FROM") ?? addrFromEnv("OWNER_JETTON_WALLET"),

    TONCENTER_API,
    TONCENTER_JSONRPC,
    TONCENTER_API_KEY: strFromEnv("TONCENTER_API_KEY", ""),

    // Retry behavior (optional)
    RETRY_ATTEMPTS: intFromEnv("RETRY_ATTEMPTS", 6),
  } as const;
})();

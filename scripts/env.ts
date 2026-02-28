import { Address } from "@ton/core";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// -----------------------------
// Load .env with a clear log
// -----------------------------
export function loadEnv(): string | undefined {
  // Do not re-load if already loaded in this process
  if ((globalThis as any).__ENV_LOADED) return undefined;

  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    (globalThis as any).__ENV_LOADED = true;
    return envPath;
  } else {
    console.warn(`⚠️ .env not found at: ${envPath}`);
    (globalThis as any).__ENV_LOADED = true;
    return undefined;
  }
}

// -----------------------------
// Helpers
// -----------------------------
export function envStr(key: string, def?: string): string | undefined {
  const v = (process.env[key] ?? "").trim();
  if (v) return v;
  return def;
}

export function envMaybeStr(key: string): string | undefined {
  const v = envStr(key);
  return v ? v : undefined;
}

export function envNum(key: string, def?: number): number {
  const raw = envStr(key, def === undefined ? undefined : String(def));
  if (raw === undefined) throw new Error(`Missing env ${key}`);
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Env ${key} is not a valid number: "${raw}"`);
  return n;
}

export function envBool(key: string, def?: boolean): boolean {
  const raw = envStr(key, def === undefined ? undefined : String(def));
  if (raw === undefined) throw new Error(`Missing env ${key}`);
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  throw new Error(`Env ${key} is not a valid boolean: "${raw}" (use true/false or 1/0)`);
}

// ✅ Added: envInt
export function envInt(
  key: string,
  opts?: { defaultValue?: string; min?: number; max?: number; required?: boolean }
): number {
  const raw = (process.env[key] ?? "").trim();
  const v = raw || opts?.defaultValue || "";
  if (!v) {
    if (opts?.required) throw new Error(`Missing env ${key}`);
    throw new Error(`Missing env ${key} (no default provided)`);
  }
  if (!/^-?\d+$/.test(v)) throw new Error(`Env ${key} is not an integer: "${v}"`);
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Env ${key} is not a valid integer: "${v}"`);
  if (opts?.min !== undefined && n < opts.min) throw new Error(`Env ${key} must be >= ${opts.min}, got ${n}`);
  if (opts?.max !== undefined && n > opts.max) throw new Error(`Env ${key} must be <= ${opts.max}, got ${n}`);
  return n;
}

export function envAddress(key: string, def?: string): Address {
  const v = envStr(key, def);
  if (!v) throw new Error(`Missing env ${key}`);
  try {
    return Address.parse(v);
  } catch {
    throw new Error(`${key} is not a valid TON address: ${v}`);
  }
}

export function envMaybeAddress(key: string): Address | undefined {
  const v = envStr(key);
  if (!v) return undefined;
  try {
    return Address.parse(v);
  } catch {
    throw new Error(`${key} is not a valid TON address: ${v}`);
  }
}

export function envNanoFromTonStr(key: string, defTon?: string): bigint {
  const v = envStr(key, defTon);
  if (!v) throw new Error(`Missing env ${key}`);
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${key} must be a non-negative number, got: ${v}`);
  return BigInt(Math.floor(n * 1e9));
}

// ✅ Added: parseJettonToNano (human -> nano bigint)
export function parseJettonToNano(human: string, decimals: number): bigint {
  const t = (human ?? "").trim();
  if (!t) throw new Error("Empty jetton amount");
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error(`Bad jetton amount: "${human}"`);

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error(`Bad decimals: ${decimals} (expected 0..18)`);
  }

  const [whole, fracRaw = ""] = t.split(".");
  const frac = (fracRaw + "0".repeat(decimals)).slice(0, decimals);

  const a = BigInt(whole) * 10n ** BigInt(decimals);
  const b = frac ? BigInt(frac) : 0n;
  return a + b;
}

// ✅ Added: upsertEnvKey (update .env safely)
export function upsertEnvKey(filePath: string, key: string, value: string): void {
  const k = key.trim();
  if (!k) throw new Error("upsertEnvKey: empty key");

  const v = String(value ?? "").trim();
  if (!v) throw new Error(`upsertEnvKey: empty value for ${k}`);

  const line = `${k}=${v}`;
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    // file may not exist yet -> create
    fs.writeFileSync(filePath, line + "\n", "utf8");
    return;
  }

  const lines = content.split(/\r?\n/);
  let replaced = false;

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i] ?? "";
    if (cur.startsWith(k + "=")) {
      lines[i] = line;
      replaced = true;
      break;
    }
  }

  if (!replaced) {
    // keep file clean: ensure ends with newline
    if (lines.length && lines[lines.length - 1] !== "") lines.push("");
    lines.push(line);
    lines.push("");
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}
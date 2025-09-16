// utils/addresses.ts
import { Address } from "@ton/core";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://magtcoin.com";

export const SALE_ADDRESS_STR  = must("NEXT_PUBLIC_SALE_ADDRESS");
export const CLAIM_ADDRESS_STR = process.env.NEXT_PUBLIC_CLAIM_ADDRESS || ""; // опціонально

export const SALE_ADDRESS  = Address.parse(SALE_ADDRESS_STR);
export const CLAIM_ADDRESS = CLAIM_ADDRESS_STR ? Address.parse(CLAIM_ADDRESS_STR) : null;

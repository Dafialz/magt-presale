// utils/constants.ts
export const MAGT_DECIMALS = Number(process.env.NEXT_PUBLIC_MAGT_DECIMALS ?? 9);

// Технічні константи для купівлі:
export const TON_DECIMALS        = 9;
export const UI_MIN_BUY_TON      = 0.20;   // мінімалка в UI
export const RESERVE_GAS_TON     = 0.08;   // запас газу у гаманці
export const TX_VALID_SECONDS    = 60 * 5; // 5 хв

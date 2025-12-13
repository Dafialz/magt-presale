export function shortAddr(addr?: string | null) {
  if (!addr) return "";
  return addr.length <= 10 ? addr : `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
export function clampNum(value: string, maxDecimals: number) {
  const [a, b] = value.replace(",", ".").split(".");
  if (!b) return a;
  return `${a}.${b.slice(0, maxDecimals)}`;
}
export function toNumberSafe(x: string) {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}

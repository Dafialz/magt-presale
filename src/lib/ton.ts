export function toNanoTon(tonAmount: number): string {
  return String(Math.floor(tonAmount * 1e9));
}
export function nowPlus(minutes: number) {
  return Math.floor(Date.now() / 1000) + minutes * 60;
}

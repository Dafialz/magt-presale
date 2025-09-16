// utils/ton.ts
import { TonConnectUI } from "@tonconnect/ui";
import { beginCell, toNano, Cell } from "@ton/core";
import { SITE_URL } from "./addresses";
import { TX_VALID_SECONDS } from "./constants";

export const tonConnectUI = new TonConnectUI({
  manifestUrl: `${SITE_URL}/tonconnect-manifest.json`
});

// payload не обов'язковий — залишаємо як Cell|null
export async function sendTon(
  to: string,
  amountTon: number,
  payload?: Cell | null
) {
  const messages: any[] = [{
    address: to,
    amount: toNano(amountTon.toString()).toString(),
    ...(payload
      ? { payload: payload.toBoc().toString("base64") }
      : {})
  }];

  const validUntil = Math.floor(Date.now() / 1000) + TX_VALID_SECONDS;

  return tonConnectUI.sendTransaction({ validUntil, messages });
}

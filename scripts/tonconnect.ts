import { beginCell, Cell, StateInit, storeStateInit } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";

type TonConnectLike = {
  sendTransaction: (tx: unknown) => Promise<unknown>;
};

type TonConnectProviderLike = {
  connector?: TonConnectLike;
  ui?: {
    setActionPrompt?: (msg: string) => void;
    clearActionPrompt?: () => void;
    write?: (msg: string) => void;
  };
  sendTransaction?: (
    address: { toString: () => string },
    amount: bigint,
    payload?: Cell,
    stateInit?: StateInit
  ) => Promise<unknown>;
};

type SenderLike = {
  provider?: TonConnectProviderLike;
};

export function patchTonConnectValidUntil(provider: NetworkProvider): boolean {
  const sender = provider.sender() as unknown as SenderLike;
  const sendProvider = sender?.provider;

  if (!sendProvider?.connector?.sendTransaction || !sendProvider.sendTransaction) {
    return false;
  }

  const original = sendProvider.sendTransaction.bind(sendProvider);

  sendProvider.sendTransaction = async (address, amount, payload, stateInit) => {
    const ui = sendProvider.ui;
    ui?.setActionPrompt?.("Sending transaction. Approve in your wallet...");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: address.toString(),
          amount: amount.toString(),
          payload: payload?.toBoc().toString("base64"),
          stateInit: stateInit
            ? beginCell().storeWritable(storeStateInit(stateInit)).endCell().toBoc().toString("base64")
            : undefined,
        },
      ],
    };

    try {
      const result = await sendProvider.connector!.sendTransaction(tx);
      ui?.clearActionPrompt?.();
      ui?.write?.("Sent transaction");
      return result;
    } catch {
      // Fallback to original provider behavior if connector call fails unexpectedly.
      return await original(address, amount, payload, stateInit);
    }
  };

  return true;
}

import { Address, beginCell } from "@ton/core";
import { TonClient } from "@ton/ton";

async function main() {
  const network = process.env.NETWORK || "mainnet";
  const magtMinter = process.env.MAGT_MINTER;
  const owner = process.env.OWNER;

  if (!magtMinter || !owner) throw new Error("MAGT_MINTER and OWNER required");

  const endpoint = network === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";

  const client = new TonClient({ endpoint });

  const minterAddr = Address.parse(magtMinter);
  const ownerAddr = Address.parse(owner);

  const res = await client.runMethod(minterAddr, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(ownerAddr).endCell() }
  ]);

  const walletAddr = res.stack.readAddress();
  console.log("JettonWallet:", walletAddr.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

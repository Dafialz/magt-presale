import { Address, beginCell } from "@ton/core";
import { TonClient } from "@ton/ton";

async function main() {
  const claim = process.env.CLAIM_ADDRESS;
  const user = process.env.USER_ADDRESS;

  if (!claim || !user) throw new Error("CLAIM_ADDRESS and USER_ADDRESS required");

  const endpoint = (process.env.NETWORK || "mainnet") === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";

  const client = new TonClient({ endpoint });

  const claimAddr = Address.parse(claim);
  const userAddr = Address.parse(user);

  const ownerRes = await client.runMethod(claimAddr, "get_owner");
  const owner = ownerRes.stack.readAddress();
  console.log("Owner:", owner.toString());

  const allocRes = await client.runMethod(claimAddr, "get_alloc", [
    { type: "slice", cell: beginCell().storeAddress(userAddr).endCell() },
  ]);
  const alloc = allocRes.stack.readBigNumber();
  console.log("Alloc (raw):", alloc.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

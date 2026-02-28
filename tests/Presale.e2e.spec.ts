import { strict as assert } from "node:assert";
import { beginCell, toNano } from "@ton/core";
import { Presale } from "../build/Presale/Presale_Presale";

const OP_BUY_MANUAL = 0x42555901;

function manualBuyBody() {
  return beginCell().storeUint(OP_BUY_MANUAL, 32).storeBit(0).endCell();
}

async function runE2E() {
  let Blockchain: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ Blockchain } = require("@ton/sandbox"));
  } catch {
    console.warn("⚠️ Skipping Presale.e2e.spec.ts: @ton/sandbox is not installed in this environment.");
    return;
  }

  const blockchain = await Blockchain.create();
  const owner = await blockchain.treasury("owner");
  const buyer = await blockchain.treasury("buyer");
  const jettonMaster = await blockchain.treasury("jettonMaster");

  // Buy accounting in Presale is TON-based and does not require jetton funding for mint accounting checks.
  const presale = blockchain.openContract(await Presale.fromInit(owner.address, jettonMaster.address));

  await presale.send(owner.getSender(), { value: toNano("0.2") }, { $$type: "Deploy", queryId: 0n });

  // Negative: disabled by default => plain buy must not increase sold/claimable.
  const soldBeforeDisabled = await presale.getTotalSoldNano();
  const claimableBeforeDisabled = await presale.getClaimableBuyerNano(buyer.address);

  await buyer.send({ to: presale.address, value: toNano("1"), body: null });

  const soldAfterDisabled = await presale.getTotalSoldNano();
  const claimableAfterDisabled = await presale.getClaimableBuyerNano(buyer.address);

  assert.equal(soldAfterDisabled, soldBeforeDisabled, "total sold unchanged while disabled");
  assert.equal(claimableAfterDisabled, claimableBeforeDisabled, "claimable unchanged while disabled");

  // Enable presale.
  await presale.send(owner.getSender(), { value: toNano("0.05") }, { $$type: "SetPresaleEnabled", enabled: 1n });

  // ABI buy path.
  const soldBeforeAbi = await presale.getTotalSoldNano();
  const claimableBeforeAbi = await presale.getClaimableBuyerNano(buyer.address);

  await presale.send(buyer.getSender(), { value: toNano("1") }, { $$type: "BuyAbi", ref: null });

  const soldAfterAbi = await presale.getTotalSoldNano();
  const claimableAfterAbi = await presale.getClaimableBuyerNano(buyer.address);

  assert.ok(soldAfterAbi > soldBeforeAbi, "total sold should increase after ABI buy");
  assert.ok(claimableAfterAbi > claimableBeforeAbi, "claimable should increase after ABI buy");

  // Manual buy path.
  const soldBeforeManual = await presale.getTotalSoldNano();
  const claimableBeforeManual = await presale.getClaimableBuyerNano(buyer.address);

  await buyer.send({ to: presale.address, value: toNano("1"), body: manualBuyBody() });

  const soldAfterManual = await presale.getTotalSoldNano();
  const claimableAfterManual = await presale.getClaimableBuyerNano(buyer.address);

  assert.ok(soldAfterManual > soldBeforeManual, "total sold should increase after manual buy");
  assert.ok(claimableAfterManual > claimableBeforeManual, "claimable should increase after manual buy");

  console.log("Presale e2e passed: disabled + ABI buy + manual buy");
}

runE2E();

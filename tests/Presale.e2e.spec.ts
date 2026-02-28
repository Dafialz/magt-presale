import { strict as assert } from "node:assert";
import { Address, beginCell, toNano } from "@ton/core";
import { Presale } from "../build/Presale/Presale_Presale";

const OP_BUY_MANUAL = 0x42555901;

function manualBuyBody(ref?: Address) {
  const b = beginCell().storeUint(OP_BUY_MANUAL, 32);
  if (ref) {
    b.storeBit(1);
    b.storeAddress(ref);
  } else {
    b.storeBit(0);
  }
  return b.endCell();
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
  const referrer = await blockchain.treasury("referrer");
  const jettonMaster = await blockchain.treasury("jettonMaster");
  const fakeJettonWallet = await blockchain.treasury("fakeJettonWallet");

  const presale = blockchain.openContract(await Presale.fromInit(owner.address, jettonMaster.address));

  await presale.send(owner.getSender(), { value: toNano("0.2") }, { $$type: "Deploy", queryId: 0n });

  // Enable presale for buy tests.
  await presale.send(owner.getSender(), { value: toNano("0.05") }, { $$type: "SetPresaleEnabled", enabled: 1n });

  // Test: buy increases pending
  {
    const pendingBefore = await presale.getPendingBuyerNano(buyer.address);

    await buyer.send({ to: presale.address, value: toNano("1"), body: null });

    const pendingAfter = await presale.getPendingBuyerNano(buyer.address);
    assert.ok(pendingAfter > pendingBefore, "buyerPendingNano should increase after buy");
  }

  // Test: referral accounting
  {
    const refPendingBefore = await presale.getPendingReferralNano(referrer.address);

    await presale.send(
      buyer.getSender(),
      { value: toNano("1") },
      { $$type: "BuyAbi", ref: referrer.address }
    );

    const refPendingAfter = await presale.getPendingReferralNano(referrer.address);
    assert.ok(refPendingAfter > refPendingBefore, "referralPendingNano should increase after referred buy");
  }

  // Test: claimable calculation (claim should zero buyer claimable)
  {
    await presale.send(
      owner.getSender(),
      { value: toNano("0.05") },
      { $$type: "SetJettonWallet", wallet: fakeJettonWallet.address }
    );

    const claimableBefore = await presale.getClaimableBuyerNano(buyer.address);
    assert.ok(claimableBefore > 0n, "claimableBuyerNano should be > 0 before claim");

    await presale.send(buyer.getSender(), { value: toNano("1") }, { $$type: "Claim", query_id: 0n });

    const claimableAfter = await presale.getClaimableBuyerNano(buyer.address);
    assert.equal(claimableAfter, 0n, "claimableBuyerNano should become 0 after claim");
  }

  // Test: manual opcode buy
  {
    const pendingBefore = await presale.getPendingBuyerNano(buyer.address);

    await buyer.send({ to: presale.address, value: toNano("1"), body: manualBuyBody() });

    const pendingAfter = await presale.getPendingBuyerNano(buyer.address);
    assert.ok(pendingAfter > pendingBefore, "pending should increase after manual opcode buy");
  }

  console.log("Presale e2e passed: pending/referral/claim/manual invariants");
}

runE2E();

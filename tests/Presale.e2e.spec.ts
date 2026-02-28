import { strict as assert } from "node:assert";
import { toNano } from "@ton/core";
import { Presale } from "../build/Presale/Presale_Presale";

async function runE2E() {
  let sandbox: any;
  try {
    // Optional runtime dependency in restricted environments.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sandbox = require("@ton/sandbox");
  } catch {
    console.warn("⚠️ Skipping Presale.e2e.spec.ts: @ton/sandbox is not installed in this environment.");
    return;
  }

  const { Blockchain } = sandbox;

  const blockchain = await Blockchain.create();
  const owner = await blockchain.treasury("owner");
  const buyer = await blockchain.treasury("buyer");
  const jettonMaster = await blockchain.treasury("jettonMaster");

  const presale = blockchain.openContract(
    await Presale.fromInit(owner.address, jettonMaster.address)
  );

  // Deploy contract.
  const deployRes = await presale.send(
    owner.getSender(),
    { value: toNano("0.2") },
    { $$type: "Deploy", queryId: 0n }
  );
  assert.ok(deployRes.transactions.length > 0, "deploy should emit transactions");

  // Negative path: presale is disabled by default, plain TON transfer should not mint.
  const soldBeforeDisabled = await presale.getTotalSoldNano();
  const claimableBeforeDisabled = await presale.getClaimableBuyerNano(buyer.address);

  await buyer.send({
    to: presale.address,
    value: toNano("1"),
    body: null,
  });

  const soldAfterDisabled = await presale.getTotalSoldNano();
  const claimableAfterDisabled = await presale.getClaimableBuyerNano(buyer.address);

  assert.equal(soldAfterDisabled, soldBeforeDisabled, "total sold must not change while presale disabled");
  assert.equal(
    claimableAfterDisabled,
    claimableBeforeDisabled,
    "buyer claimable must not change while presale disabled"
  );

  // Enable presale as owner.
  await presale.send(
    owner.getSender(),
    { value: toNano("0.05") },
    { $$type: "SetPresaleEnabled", enabled: 1n }
  );

  // Positive path: plain TON transfer buy should increase sold + buyer claimable.
  const soldBeforeBuy = await presale.getTotalSoldNano();
  const claimableBeforeBuy = await presale.getClaimableBuyerNano(buyer.address);

  const buyRes = await buyer.send({
    to: presale.address,
    value: toNano("1"),
    body: null,
  });

  assert.ok(buyRes.transactions.length > 0, "buy should emit transactions");

  const soldAfterBuy = await presale.getTotalSoldNano();
  const claimableAfterBuy = await presale.getClaimableBuyerNano(buyer.address);

  assert.ok(soldAfterBuy > soldBeforeBuy, "total sold should increase after enabled buy");
  assert.ok(claimableAfterBuy > claimableBeforeBuy, "buyer claimable should increase after enabled buy");

  console.log("Presale e2e passed: disabled refund path + enabled buy path");
}

runE2E();

import { strict as assert } from "node:assert";
import { toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { Presale } from "../build/Presale/Presale_Presale";
import { MockJettonWallet } from "../build/MockJettonWallet/MockJettonWallet_MockJettonWallet";

type Actors = {
  owner: SandboxContract<TreasuryContract>;
  buyer: SandboxContract<TreasuryContract>;
  referrer: SandboxContract<TreasuryContract>;
  jettonMaster: SandboxContract<TreasuryContract>;
};

async function createActors(blockchain: Blockchain): Promise<Actors> {
  return {
    owner: await blockchain.treasury("owner"),
    buyer: await blockchain.treasury("buyer"),
    referrer: await blockchain.treasury("referrer"),
    jettonMaster: await blockchain.treasury("jettonMaster"),
  };
}

async function deployPresale(blockchain: Blockchain, actors: Actors) {
  const presale = blockchain.openContract(await Presale.fromInit(actors.owner.address, actors.jettonMaster.address));
  await presale.send(actors.owner.getSender(), { value: toNano("0.4") }, { $$type: "Deploy", queryId: 1n });
  return presale;
}

async function deployMockJettonWallet(blockchain: Blockchain, owner: SandboxContract<TreasuryContract>) {
  const wallet = blockchain.openContract(await MockJettonWallet.fromInit(owner.address));
  await wallet.send(owner.getSender(), { value: toNano("1.2") }, { $$type: "Deploy", queryId: 1n });
  return wallet;
}

async function assertGlobalInvariant(
  presale: SandboxContract<Presale>,
  addresses: Array<{ buyer: string; address: any }>,
  expectedPendingByAddress: Map<string, bigint>
) {
  const totalClaimable = await presale.getTotalClaimableNano();
  const totalPending = await presale.getTotalPendingNano();

  let sumClaimables = 0n;
  for (const actor of addresses) {
    sumClaimables += await presale.getClaimableBuyerNano(actor.address);
    sumClaimables += await presale.getClaimableReferralNano(actor.address);
  }

  let sumExpectedPending = 0n;
  for (const actor of addresses) {
    sumExpectedPending += expectedPendingByAddress.get(actor.buyer) ?? 0n;
  }

  assert.equal(
    totalClaimable + totalPending,
    sumClaimables + sumExpectedPending,
    "global claimable/pending invariant mismatch"
  );
}

async function scenarioABC() {
  const blockchain = await Blockchain.create();
  const actors = await createActors(blockchain);
  const presale = await deployPresale(blockchain, actors);

  const actorList = [
    { buyer: "buyer", address: actors.buyer.address },
    { buyer: "referrer", address: actors.referrer.address },
  ];
  const expectedPendingByAddress = new Map<string, bigint>();

  // A) presaleEnabled default is 0 and pure TON transfer is refunded
  assert.equal(await presale.getPresaleEnabledGetter(), 0n, "presale must start disabled");
  const buyerBefore = (await blockchain.getContract(actors.buyer.address)).balance;
  const presaleBefore = (await blockchain.getContract(presale.address)).balance;

  await actors.buyer.send({ to: presale.address, value: toNano("1"), body: null });

  const buyerAfter = (await blockchain.getContract(actors.buyer.address)).balance;
  const presaleAfter = (await blockchain.getContract(presale.address)).balance;
  const presaleKept = presaleAfter - presaleBefore;

  assert.ok(buyerAfter > 0n && buyerBefore > 0n, "buyer balance must remain positive");
  assert.ok(presaleKept < toNano("0.2"), "presale should not keep full buy value when disabled");
  assert.equal(await presale.getTotalClaimableNano(), 0n, "claimable must stay zero while disabled");
  assert.equal(await presale.getTotalRaisedNano(), 0n, "raised TON must stay zero while disabled");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);

  // B) enable presale and buy without ref
  await presale.send(
    actors.owner.getSender(),
    { value: toNano("0.05") },
    { $$type: "SetPresaleEnabled", enabled: 1n }
  );

  const buyerClaimableBefore = await presale.getClaimableBuyerNano(actors.buyer.address);
  const totalClaimableBefore = await presale.getTotalClaimableNano();
  await actors.buyer.send({ to: presale.address, value: toNano("1"), body: null });
  const buyerClaimableAfter = await presale.getClaimableBuyerNano(actors.buyer.address);
  const totalClaimableAfter = await presale.getTotalClaimableNano();

  assert.ok(buyerClaimableAfter > buyerClaimableBefore, "buyer claimable should increase after buy");
  assert.ok(totalClaimableAfter > totalClaimableBefore, "totalClaimable should increase after buy");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);

  // C) buy with ref and ensure referral claimable increases
  const refClaimableBefore = await presale.getClaimableReferralNano(actors.referrer.address);
  await presale.send(
    actors.buyer.getSender(),
    { value: toNano("1") },
    { $$type: "BuyAbi", ref: actors.referrer.address }
  );
  const refClaimableAfter = await presale.getClaimableReferralNano(actors.referrer.address);
  assert.ok(refClaimableAfter > refClaimableBefore, "referrer claimable should increase for referred buy");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);
}

async function scenarioDE() {
  const blockchain = await Blockchain.create();
  const actors = await createActors(blockchain);
  const presale = await deployPresale(blockchain, actors);
  const wallet = await deployMockJettonWallet(blockchain, actors.owner);

  const actorList = [
    { buyer: "buyer", address: actors.buyer.address },
    { buyer: "referrer", address: actors.referrer.address },
  ];
  const expectedPendingByAddress = new Map<string, bigint>();
  expectedPendingByAddress.set("buyer", 0n);
  expectedPendingByAddress.set("referrer", 0n);

  await presale.send(
    actors.owner.getSender(),
    { value: toNano("0.05") },
    { $$type: "SetJettonWallet", wallet: wallet.address }
  );

  await wallet.send(
    actors.owner.getSender(),
    { value: toNano("0.05") },
    { $$type: "FundJettons", amount: toNano("1000000") }
  );

  await presale.send(
    actors.owner.getSender(),
    { value: toNano("0.05") },
    { $$type: "SetPresaleEnabled", enabled: 1n }
  );

  await presale.send(
    actors.buyer.getSender(),
    { value: toNano("1") },
    { $$type: "BuyAbi", ref: actors.referrer.address }
  );

  // D) claim path with pending set first, then committed by notification/excess
  await wallet.send(
    actors.owner.getSender(),
    { value: toNano("0.03") },
    { $$type: "SetAutoCallbacks", notify: 0n, excess: 0n }
  );

  const claimableBeforeClaim = await presale.getClaimableBuyerNano(actors.buyer.address);
  const referralClaimableBeforeClaim = await presale.getClaimableReferralNano(actors.buyer.address);
  const expectedPending = claimableBeforeClaim + referralClaimableBeforeClaim;
  assert.ok(expectedPending > 0n, "buyer must have claimable before claim");

  await presale.send(actors.buyer.getSender(), { value: toNano("0.71") }, { $$type: "Claim", query_id: 7n });

  expectedPendingByAddress.set("buyer", expectedPending);
  assert.equal(await presale.getIsPendingGetter(actors.buyer.address), 1n, "pending should be set after claim");
  assert.equal(await presale.getTotalPendingNano(), expectedPending, "totalPending should match user pending");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);

  await wallet.send(
    actors.owner.getSender(),
    { value: toNano("0.03") },
    { $$type: "SetAutoCallbacks", notify: 1n, excess: 1n }
  );
  await wallet.send(actors.owner.getSender(), { value: toNano("0.03") }, { $$type: "FlushLastCallbacks" });

  expectedPendingByAddress.set("buyer", 0n);
  assert.equal(await presale.getIsPendingGetter(actors.buyer.address), 0n, "pending should be committed");
  assert.equal(await presale.getTotalPendingNano(), 0n, "totalPending must return to zero");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);

  // E) CancelPending before TTL fails; ResolvePending after TTL restores claimable
  await presale.send(
    actors.buyer.getSender(),
    { value: toNano("1") },
    { $$type: "BuyAbi", ref: null }
  );

  await wallet.send(
    actors.owner.getSender(),
    { value: toNano("0.03") },
    { $$type: "SetAutoCallbacks", notify: 0n, excess: 0n }
  );

  const claimableBeforeSecondClaim = await presale.getClaimableBuyerNano(actors.buyer.address);
  await presale.send(actors.buyer.getSender(), { value: toNano("0.71") }, { $$type: "Claim", query_id: 8n });
  expectedPendingByAddress.set("buyer", claimableBeforeSecondClaim);

  assert.equal(await presale.getIsPendingGetter(actors.buyer.address), 1n, "pending must exist for cancel/resolve test");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);

  await presale.send(actors.buyer.getSender(), { value: toNano("0.07") }, { $$type: "CancelPending" });
  assert.equal(await presale.getIsPendingGetter(actors.buyer.address), 1n, "cancel before TTL should fail and keep pending");
  assert.equal(await presale.getClaimableBuyerNano(actors.buyer.address), 0n, "claimable should stay zero while pending");

  blockchain.now = (blockchain.now ?? Math.floor(Date.now() / 1000)) + Number(Presale.CLAIM_TTL_SEC) + 1;
  await presale.send(
    actors.buyer.getSender(),
    { value: toNano("0.07") },
    { $$type: "ResolvePending", user: actors.buyer.address, action: 2n }
  );

  expectedPendingByAddress.set("buyer", 0n);
  assert.equal(await presale.getIsPendingGetter(actors.buyer.address), 0n, "pending should clear after TTL restore");
  assert.ok(
    (await presale.getClaimableBuyerNano(actors.buyer.address)) > 0n,
    "claimable should be restored to buyer after resolve"
  );
  assert.equal(await presale.getTotalPendingNano(), 0n, "totalPending should return to zero after restore");
  await assertGlobalInvariant(presale, actorList, expectedPendingByAddress);
}

async function runSandboxE2E() {
  await scenarioABC();
  await scenarioDE();
  console.log("Presale sandbox e2e passed: checks A-E with local mock jetton wallet");
}

runSandboxE2E();

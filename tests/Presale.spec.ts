import { strict as assert } from "node:assert";

type BuyDistribution = {
  buyerBaseNano: bigint;
  buyerBonusNano: bigint;
  buyerTotalNano: bigint;
  referralBonusNano: bigint;
};

const BUYER_BONUS_PPM = 50_000n;
const REF_POOL_BONUS_PPM = 50_000n;
const PPM_DENOM = 1_000_000n;

function distributionForBuy(totalTokensNano: bigint, hasReferral: boolean): BuyDistribution {
  const buyerBonusNano = (totalTokensNano * BUYER_BONUS_PPM) / PPM_DENOM;
  const referralBonusNano = hasReferral ? (totalTokensNano * REF_POOL_BONUS_PPM) / PPM_DENOM : 0n;

  return {
    buyerBaseNano: totalTokensNano,
    buyerBonusNano,
    buyerTotalNano: totalTokensNano + buyerBonusNano,
    referralBonusNano,
  };
}

function runRegressionTests() {
  const bought = 1_000_000_000n; // 1 token in nano-jettons

  // Regression path: no ref provided => no referral claimable is minted.
  const noRef = distributionForBuy(bought, false);
  assert.equal(noRef.buyerBaseNano, bought);
  assert.equal(noRef.buyerBonusNano, 50_000_000n);
  assert.equal(noRef.buyerTotalNano, 1_050_000_000n);
  assert.equal(noRef.referralBonusNano, 0n);

  // Regression path: valid ref provided => referral receives ref pool bonus.
  const withRef = distributionForBuy(bought, true);
  assert.equal(withRef.buyerBaseNano, bought);
  assert.equal(withRef.buyerBonusNano, 50_000_000n);
  assert.equal(withRef.buyerTotalNano, 1_050_000_000n);
  assert.equal(withRef.referralBonusNano, 50_000_000n);

  // Ensure only referral side changes between these paths.
  assert.equal(withRef.buyerTotalNano, noRef.buyerTotalNano);
  assert.equal(withRef.referralBonusNano - noRef.referralBonusNano, 50_000_000n);

  console.log("Presale regression tests passed: no-ref and with-ref paths");
}

runRegressionTests();

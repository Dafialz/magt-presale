// scripts/deploy-sale.ts
// Deploy MAGTSale через згенерований Tact binding (Tact 1.x)

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import {
  Address,
  beginCell,
  Cell,
  Dictionary,
  contractAddress,
  toNano,
  SendMode,            // ⬅️ додано
} from "@ton/core";
import { TonClient, WalletContractV5R1, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

/* ===================== ENV ===================== */
// .env.local має пріоритет над .env
const envLocal = path.resolve(process.cwd(), ".env.local");
const envPath = fs.existsSync(envLocal) ? envLocal : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath, override: true });

const MNEMONIC = process.env.MNEMONIC!;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS!;
const MAGT_MINTER = process.env.MAGT_MINTER!;
const MAGT_DECIMALS = BigInt(process.env.MAGT_DECIMALS || "9");
const NETWORK = (process.env.NETWORK || "mainnet").toLowerCase();
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || undefined;

if (!MNEMONIC || !ADMIN_ADDRESS || !MAGT_MINTER) {
  throw new Error("MNEMONIC, ADMIN_ADDRESS, MAGT_MINTER required");
}
if (NETWORK !== "mainnet" && NETWORK !== "testnet") {
  throw new Error(`NETWORK must be "mainnet" or "testnet", got: ${NETWORK}`);
}

const endpoint =
  NETWORK === "mainnet"
    ? "https://toncenter.com/api/v2/jsonRPC"
    : "https://testnet.toncenter.com/api/v2/jsonRPC";
const client = new TonClient({ endpoint, apiKey: TONCENTER_API_KEY });

/* ===================== UTILS ===================== */
function fmt(addr: Address, bounceable: boolean) {
  return addr.toString({ bounceable, urlSafe: true, testOnly: NETWORK !== "mainnet" });
}
async function safeIsDeployed(addr: Address): Promise<boolean> {
  try {
    return await client.isContractDeployed(addr);
  } catch {
    return false;
  }
}

/* ===================== LEVELS ===================== */
type LevelLocal = { tokens: bigint; price: bigint }; // human tokens, price in nanoTON per token

function priceNano(p: number): bigint {
  // TON per 1 token -> nanoTON per 1 token
  return BigInt(Math.round(p * 1e9));
}

const LEVELS: LevelLocal[] = [
  { tokens: 65225022n, price: priceNano(0.003734) },
  { tokens: 57039669n, price: priceNano(0.004369) },
  { tokens: 50370908n, price: priceNano(0.005112) },
  { tokens: 44326399n, price: priceNano(0.005981) },
  { tokens: 39007231n, price: priceNano(0.006998) },
  { tokens: 34326365n, price: priceNano(0.008187) },
  { tokens: 30207200n, price: priceNano(0.009578) },
  { tokens: 26582336n, price: priceNano(0.011207) },
  { tokens: 23392455n, price: priceNano(0.013112) },
  { tokens: 20585361n, price: priceNano(0.015342) },
  { tokens: 18115117n, price: priceNano(0.01795) },
  { tokens: 15941303n, price: priceNano(0.021001) },
  { tokens: 14028347n, price: priceNano(0.024571) },
  { tokens: 12344945n, price: priceNano(0.028748) },
  { tokens: 10863552n, price: priceNano(0.033636) },
  { tokens: 9559925n,  price: priceNano(0.039353) },
  { tokens: 8412734n,  price: priceNano(0.046043) },
  { tokens: 7423267n,  price: priceNano(0.053871) },
  { tokens: 6514821n,  price: priceNano(0.063029) },
  { tokens: 5733043n,  price: priceNano(0.073579) },
];

/**
 * ВАЖЛИВО: Tact для типу `Int` серіалізує 257 біт.
 * Тому value-codec для struct Level має писати/читати 257-бітні int.
 */
const LevelValueCodec = {
  serialize: (src: { tokens: bigint; price: bigint }, b: any) => {
    b.storeInt(src.tokens, 257);
    b.storeInt(src.price, 257);
  },
  parse: (s: any): { tokens: bigint; price: bigint } => {
    const tokens = s.loadInt(257);
    const price = s.loadInt(257);
    return { tokens, price };
  },
};

// Dictionary<BigUint(16) -> LevelStruct>
function buildLevelsDict(): Dictionary<bigint, { tokens: bigint; price: bigint }> {
  const dict = Dictionary.empty<bigint, { tokens: bigint; price: bigint }>(
    Dictionary.Keys.BigUint(16),
    LevelValueCodec
  );
  LEVELS.forEach((L, i) => dict.set(BigInt(i), { tokens: L.tokens, price: L.price }));
  return dict;
}

/* ===== Знаходимо Tact binding незалежно від шляху ===== */
function findFirst(fileName: string, root: string): string | null {
  let found: string | null = null;
  function walk(dir: string) {
    if (found) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".git") continue;
        walk(p);
        if (found) return;
      } else if (e.isFile() && e.name === fileName) {
        found = p;
        return;
      }
    }
  }
  walk(root);
  return found;
}

function loadBinding(): { MAGTSale: any } {
  const bindingTs = findFirst("MAGTSale.tact_MAGTSale.ts", path.resolve(process.cwd()));
  if (!bindingTs) {
    throw new Error(
      "Не знайдено Tact binding. Спершу виконай `npm run tact:build` і перевір, що з’явився файл MAGTSale.tact_MAGTSale.ts."
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(bindingTs);
  console.log("Using Tact binding at:", bindingTs);
  return mod;
}

/* ===================== MAIN ===================== */
async function main() {
  // 0) Підтягнемо Tact binding (де б він не лежав)
  const { MAGTSale } = loadBinding();

  // 1) Гаманець деплойера
  const mnems = MNEMONIC.trim().split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mnems);
  const wallet = WalletContractV5R1.create({ publicKey: keyPair.publicKey, workchain: 0 });
  const walletContract = client.open(wallet);

  // Дружні логи адрес
  console.log("Deployer wallet (EQ, bounceable):", fmt(walletContract.address, true));
  console.log("Deployer wallet (UQ, NON-bounceable – для першого поповнення):", fmt(walletContract.address, false));

  // 1.1 Перевірка балансу перед деплоєм (щоб не ловити 500 на sendBoc)
  const deployerBalance = await client.getBalance(walletContract.address);
  if (deployerBalance === 0n) {
    throw new Error(
      `Deployer balance = 0. Поповни UQ-адресу: ${fmt(walletContract.address, false)} на ≥ 0.5 TON і спробуй ще раз.`
    );
  }
  console.log("Deployer balance (nanoTON):", deployerBalance.toString());

  // 2) Параметри init
  const owner = Address.parse(ADMIN_ADDRESS);
  const minter = Address.parse(MAGT_MINTER);
  const startLevel = 0n;
  const startRemaining = LEVELS[0].tokens;
  const refPoolHuman = 25_000_000n; // як у ТЗ
  const levelsDict = buildLevelsDict();

  // Логи власника
  console.log("Owner from .env (EQ):", fmt(owner, true));
  console.log("Owner from .env (UQ):", fmt(owner, false));

  // 3) Тимчасовий saleJW (placeholder) -> прогноз адреси SALE
  const placeholderJW = Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
  const initTemp = await MAGTSale.init(
    owner,
    minter,
    placeholderJW,
    MAGT_DECIMALS,
    levelsDict,
    startLevel,
    startRemaining,
    refPoolHuman
  );
  const saleAddrTemp = contractAddress(0, initTemp);
  console.log("Predicted SALE address (temp, EQ):", fmt(saleAddrTemp, true));
  console.log("Predicted SALE address (temp, UQ):", fmt(saleAddrTemp, false));

  // 4) Отримуємо реальний JettonWallet SALE для MAGT
  const res = await client.runMethod(minter, "get_wallet_address", [
    { type: "slice", cell: beginCell().storeAddress(saleAddrTemp).endCell() },
  ]);
  const saleJW = res.stack.readAddress();
  console.log("Predicted SALE JettonWallet (EQ):", fmt(saleJW, true));
  console.log("Predicted SALE JettonWallet (UQ):", fmt(saleJW, false));

  // 5) Фінальний init із коректним saleJW
  const init = await MAGTSale.init(
    owner,
    minter,
    saleJW,
    MAGT_DECIMALS,
    levelsDict,
    startLevel,
    startRemaining,
    refPoolHuman
  );
  const saleAddr = contractAddress(0, init);
  console.log("SALE_ADDRESS (EQ):", fmt(saleAddr, true));
  console.log("SALE_ADDRESS (UQ – використовуй для поповнення TON):", fmt(saleAddr, false));
  console.log("SALE_JW (EQ):", fmt(saleJW, true));
  console.log("SALE_JW (UQ – для MAGT jetton):", fmt(saleJW, false));

  // 5.1 Якщо вже задеплоєно – не шлемо ще раз deploy
  const alreadyDeployed = await safeIsDeployed(saleAddr);
  if (alreadyDeployed) {
    const bal = await client.getBalance(saleAddr);
    console.log("⛳ SALE вже активний. Баланс TON (nanoTON):", bal.toString());
    console.log("✅ Нічого не відправляю. Далі: поповни SALE_JW MAGT і TON на SALE за потреби.");
    return;
  }

  // 6) Відправляємо deploy message
  const seqno = await walletContract.getSeqno();
  await walletContract.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno,
    sendMode: SendMode.PAY_GAS_SEPARATELY,   // ⬅️ ОБОВʼЯЗКОВО для V5R1
    messages: [
      internal({
        to: saleAddr,
        value: toNano("0.2"),
        init, // тут і code, і data з binding
        body: new Cell(),
      }),
    ],
  });

  console.log("Deploy sent. Далі: поповни SALE_JW MAGT і надішли трохи TON на SALE (UQ-адресою) для gas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

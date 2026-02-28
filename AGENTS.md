# AGENTS.md — TON Blueprint runbook (testnet-safe)

This repository uses **TON Blueprint + TypeScript** scripts in `scripts/`.
Use the commands below exactly to install, build, test, and run on **testnet** safely.

## 1) Install

```bash
npm ci
```

If lockfile is intentionally changed:

```bash
npm install
```

## 2) Environment setup (safe defaults for CI)

The scripts load env files in this order:
1. `.env.local`
2. `.env`
3. process env only (no file)

For local work:

```bash
cp .env.example .env.local
```

Then fill only the keys you need (wallet/mnemonic/API key for real chain actions).

## 3) Build

```bash
npm run build
```

## 4) Test (type-check)

```bash
npm test
```

## 5) CI aggregate command

```bash
npm run ci
```

`ci` runs:
- build
- tests
- lint only if a `lint` script is present (`npm run lint --if-present`)

## 6) Safe testnet script execution

Always use testnet command variants and dry/readonly checks first.

### Read-only health check

```bash
npm run check
```

### Deploy to testnet

```bash
npm run deploy:testnet
```

### Common post-deploy scripts (testnet)

```bash
npx blueprint run resolvePresaleJettonWallet --testnet
npx blueprint run setJettonWallet --testnet
npx blueprint run fundPresaleJettons --testnet
npx blueprint run buy --testnet
npx blueprint run claim --testnet
npx blueprint run withdraw --testnet
npx blueprint run withdrawJettons --testnet
```

## 7) Safety checklist before state-changing transactions

1. Confirm you are on **testnet** (`--testnet`).
2. Confirm `PRESALE`, `JETTON_MASTER`, and owner addresses in env file.
3. Run readonly check first:

```bash
npm run check
```

4. Use small TON / jetton amounts first.
5. Verify tx and resulting contract state in explorer before next step.

## 8) Mainnet protection

Do **not** run `npm run deploy:mainnet` unless explicitly intended and reviewed.

## 9) Transaction safety rails (enforced in scripts)

For any script that sends a transaction (`deploy`, `buy`, `claim`, `withdraw`, etc.), the code now enforces:
- testnet execution (`--testnet`) **or** `NETWORK=testnet`,
- otherwise it aborts with a clear safety error,
- unless you explicitly set `I_UNDERSTAND_MAINNET=1`.

Examples:

```bash
# normal safe mode
npx blueprint run buy --testnet

# explicit env-based safe mode
NETWORK=testnet npx blueprint run claim

# dangerous override (intentional non-testnet only)
I_UNDERSTAND_MAINNET=1 npx blueprint run deploy
```

## 10) Automated test commands

Use these exact commands for fully automated local/CI checks (no wallet, no external RPC):

```bash
npm ci
npm run test:all
```

For one-command testnet flow (wallet approvals required):

```powershell
$env:AMOUNT_TON="1.0"
npm run test:testnet
```

You can also use nano amount:

```powershell
$env:AMOUNT_TON_NANO="1000000000"
npm run test:testnet
```


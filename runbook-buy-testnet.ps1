param(
  [switch]$SkipSetJettonWallet,
  [switch]$SkipFundJettons
)

$ErrorActionPreference = 'Stop'

function Step($title, $cmd) {
  Write-Host "`n=== $title ===" -ForegroundColor Cyan
  Write-Host $cmd -ForegroundColor DarkGray
  Invoke-Expression $cmd
}

# Required buy amount input (deterministic, no defaults)
if (-not $env:AMOUNT_TON -and -not $env:AMOUNT_TON_NANO) {
  throw "Set AMOUNT_TON or AMOUNT_TON_NANO before running this script."
}

# Optional helper defaults
if (-not $env:BUY_MODE) { $env:BUY_MODE = 'abi' }

try {
  Step "Pre-check" "npm run check"

  Step "Resolve owner jetton wallet" "`$env:TARGET_ADDRESS=`"`$env:OWNER`"; npx blueprint run resolvePresaleJettonWallet --testnet"

  Step "Resolve presale jetton wallet" "Remove-Item Env:\TARGET_ADDRESS -ErrorAction SilentlyContinue; npx blueprint run resolvePresaleJettonWallet --testnet"

  if (-not $SkipSetJettonWallet) {
    Step "Set presale jetton wallet (optional step, can be skipped if already set)" "npx blueprint run setJettonWallet --testnet"
  } else {
    Write-Host "Skipping setJettonWallet by flag." -ForegroundColor Yellow
  }

  if (-not $SkipFundJettons) {
    Step "Fund presale jettons (optional step, can be skipped if already funded)" "npx blueprint run fundPresaleJettons --testnet"
  } else {
    Write-Host "Skipping fundPresaleJettons by flag." -ForegroundColor Yellow
  }

  Step "Buy" "npx blueprint run buy --testnet"

  Step "Final check" "npm run check"

  Write-Host "`nRunbook completed successfully." -ForegroundColor Green
}
catch {
  Write-Host "`nRunbook failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "If buy failed, scripts/buy.ts prints final TonConnect transaction JSON in the error output." -ForegroundColor Yellow
  throw
}

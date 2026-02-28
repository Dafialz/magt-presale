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

function StepCapture($title, $cmd) {
  Write-Host "`n=== $title ===" -ForegroundColor Cyan
  Write-Host $cmd -ForegroundColor DarkGray
  $script:LASTEXITCODE = 0
  $out = Invoke-Expression $cmd 2>&1 | Tee-Object -Variable captured
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $title"
  }
  return ($captured -join "`n")
}

if (-not $env:AMOUNT_TON -and -not $env:AMOUNT_TON_NANO) {
  throw "Set AMOUNT_TON or AMOUNT_TON_NANO before running this script."
}

if (-not $env:BUY_MODE) { $env:BUY_MODE = 'abi' }

try {
  $checkOut = StepCapture "Pre-check" "npm run check"

  Step "Resolve owner jetton wallet" "`$env:TARGET_ADDRESS=`"`$env:OWNER`"; npx blueprint run resolvePresaleJettonWallet --testnet"
  Step "Resolve presale jetton wallet" "Remove-Item Env:\TARGET_ADDRESS -ErrorAction SilentlyContinue; npx blueprint run resolvePresaleJettonWallet --testnet"

  $jettonWalletSet = $false
  if ($checkOut -match 'jettonWalletSet\s*[:=]\s*1') { $jettonWalletSet = $true }

  if ($SkipSetJettonWallet) {
    Write-Host "Skipping setJettonWallet by flag." -ForegroundColor Yellow
  } elseif (-not $jettonWalletSet) {
    Step "Set presale jetton wallet (auto: not set)" "npx blueprint run setJettonWallet --testnet"
  } else {
    Write-Host "Skipping setJettonWallet: already set according to check output." -ForegroundColor Yellow
  }

  $hasFundAmount = $false
  if ($env:AMOUNT_JETTON -or $env:AMOUNT_JETTON_NANO) { $hasFundAmount = $true }

  if ($SkipFundJettons) {
    Write-Host "Skipping fundPresaleJettons by flag." -ForegroundColor Yellow
  } elseif ($hasFundAmount) {
    Step "Fund presale jettons (auto: funding env present)" "npx blueprint run fundPresaleJettons --testnet"
  } else {
    Write-Host "Skipping fundPresaleJettons: AMOUNT_JETTON/AMOUNT_JETTON_NANO not set." -ForegroundColor Yellow
  }

  Step "Buy" "npx blueprint run buy --testnet"
  Step "Final check" "npm run check"

  Write-Host "`nRunbook completed successfully." -ForegroundColor Green
}
catch {
  Write-Host "`nRunbook failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "If buy failed, scripts/buy.ts prints final TonConnect transaction JSON (sanitized, no API key)." -ForegroundColor Yellow
  throw
}

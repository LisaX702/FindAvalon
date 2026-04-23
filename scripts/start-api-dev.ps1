$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$apiLockPath = Join-Path $repoRoot ".api-dev.lock"

function Get-ListeningProcessId($Port) {
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($connection) {
    return $connection.OwningProcess
  }

  return $null
}

function Assert-ApiLockAvailable($LockPath) {
  if (-not (Test-Path $LockPath)) {
    return
  }

  $lockContent = Get-Content $LockPath -ErrorAction SilentlyContinue | Select-Object -First 1
  $lockPid = 0

  if ($lockContent -and [int]::TryParse($lockContent, [ref]$lockPid)) {
    $lockProcess = Get-Process -Id $lockPid -ErrorAction SilentlyContinue

    if ($lockProcess) {
      throw "A local API dev process is already starting or running (PID $lockPid). Stop that process or run 'npm.cmd run reset:api-port' if it is stale, then retry 'npm.cmd run dev:api'."
    }
  }

  Remove-Item $LockPath -Force -ErrorAction SilentlyContinue
}

Assert-ApiLockAvailable $apiLockPath
Set-Content -Path $apiLockPath -Value $PID -NoNewline

function Assert-PortAvailable($Port) {
  $existingProcessId = Get-ListeningProcessId $Port

  if (-not $existingProcessId) {
    return
  }

  $existingProcess = Get-Process -Id $existingProcessId -ErrorAction SilentlyContinue

  if ($existingProcess) {
    throw "Port $Port is already in use by process $($existingProcess.ProcessName) (PID $existingProcessId). Run 'npm.cmd run reset:api-port' to clear a stale local API listener, then retry 'npm.cmd run dev:api'."
  }

  throw "Port $Port is already in use by PID $existingProcessId. Clear the listener, then retry 'npm.cmd run dev:api'."
}

try {
  Set-Location $repoRoot
  node --env-file=.env ./scripts/validate-env.mjs api

  Get-Content (Join-Path $repoRoot ".env") | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
      return
    }

    $parts = $_ -split '=', 2

    if ($parts.Length -eq 2) {
      $name = $parts[0].Trim()
      $value = $parts[1].Trim().Trim('"')

      if ($name) {
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
      }
    }
  }

  $configuredPort = [System.Environment]::GetEnvironmentVariable("PORT", "Process")

  if (-not $configuredPort) {
    $configuredPort = "3001"
  }

  $apiPort = [int]$configuredPort

  Assert-PortAvailable $apiPort

  Write-Host "Building Nest API with local .env loaded..."
  npm.cmd run build -w @relocateit/api

  Assert-PortAvailable $apiPort

  Set-Location (Join-Path $repoRoot "apps\\api")
  Write-Host "Starting Nest API on port $apiPort..."
  node --env-file=../../.env dist/apps/api/src/main.js
} finally {
  Remove-Item $apiLockPath -Force -ErrorAction SilentlyContinue
}

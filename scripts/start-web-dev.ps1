$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$webLockPath = Join-Path $repoRoot ".web-dev.lock"

function Get-ListeningProcessId($Port) {
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($connection) {
    return $connection.OwningProcess
  }

  return $null
}

function Assert-WebLockAvailable($LockPath) {
  if (-not (Test-Path $LockPath)) {
    return
  }

  $lockContent = Get-Content $LockPath -ErrorAction SilentlyContinue | Select-Object -First 1
  $lockPid = 0

  if ($lockContent -and [int]::TryParse($lockContent, [ref]$lockPid)) {
    $lockProcess = Get-Process -Id $lockPid -ErrorAction SilentlyContinue

    if ($lockProcess) {
      throw "A local web dev process is already starting or running (PID $lockPid). Stop that process or run 'npm.cmd run reset:web-port' if it is stale, then retry 'npm.cmd run dev:web'."
    }
  }

  Remove-Item $LockPath -Force -ErrorAction SilentlyContinue
}

function Assert-PortAvailable($Port) {
  $existingProcessId = Get-ListeningProcessId $Port

  if (-not $existingProcessId) {
    return
  }

  $existingProcess = Get-Process -Id $existingProcessId -ErrorAction SilentlyContinue

  if ($existingProcess) {
    throw "Port $Port is already in use by process $($existingProcess.ProcessName) (PID $existingProcessId). Run 'npm.cmd run reset:web-port' to clear a stale local web listener, then retry 'npm.cmd run dev:web'."
  }

  throw "Port $Port is already in use by PID $existingProcessId. Clear the listener, then retry 'npm.cmd run dev:web'."
}

Assert-WebLockAvailable $webLockPath
Set-Content -Path $webLockPath -Value $PID -NoNewline

try {
  Set-Location $repoRoot
  node --env-file=.env ./scripts/validate-env.mjs web
  & (Join-Path $PSScriptRoot "reset-web-cache.ps1")

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

  $appUrl = [System.Environment]::GetEnvironmentVariable("APP_URL", "Process")
  $appPort = if ($appUrl) { ([System.Uri]$appUrl).Port } else { 3000 }
  [System.Environment]::SetEnvironmentVariable("PORT", "$appPort", "Process")

  Assert-PortAvailable $appPort

  Write-Host "Starting programmatic Next.js dev server with a fresh cache..."
  node --env-file=.env .\scripts\start-web-dev-server.mjs
} finally {
  Remove-Item $webLockPath -Force -ErrorAction SilentlyContinue
}

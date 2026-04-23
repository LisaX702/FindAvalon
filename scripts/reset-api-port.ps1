$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $repoRoot ".env"
$lockPath = Join-Path $repoRoot ".api-dev.lock"
$port = 3001

if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*PORT\s*=\s*"?(\d+)"?\s*$') {
      $port = [int]$Matches[1]
    }
  }
}

$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1

if (-not $connection) {
  Write-Host "No listening process found on API port $port."
  exit 0
}

$process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue

if (-not $process) {
  throw "Found a listener on port $port (PID $($connection.OwningProcess)), but the process could not be inspected."
}

if ($process.ProcessName -ne "node") {
  throw "Port $port is owned by $($process.ProcessName) (PID $($process.Id)). Refusing to stop a non-node process automatically."
}

Write-Host "Stopping stale API listener on port $port (PID $($process.Id))..."
Stop-Process -Id $process.Id -Force
Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
Write-Host "API port $port is clear."

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $repoRoot ".env"
$lockPath = Join-Path $repoRoot ".web-dev.lock"
$port = 3000

if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*APP_URL\s*=\s*"?(.*?)"?\s*$') {
      try {
        $port = ([System.Uri]$Matches[1]).Port
      } catch {
      }
    }
  }
}

$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1

if (-not $connection) {
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
  Write-Host "No listening process found on web port $port."
  exit 0
}

$process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue

if (-not $process) {
  throw "Found a listener on port $port (PID $($connection.OwningProcess)), but the process could not be inspected."
}

if ($process.ProcessName -ne "node") {
  throw "Port $port is owned by $($process.ProcessName) (PID $($process.Id)). Refusing to stop a non-node process automatically."
}

Write-Host "Stopping stale web listener on port $port (PID $($process.Id))..."
Stop-Process -Id $process.Id -Force
Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
Write-Host "Web port $port is clear."

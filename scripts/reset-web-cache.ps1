$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$nextCachePath = Join-Path $repoRoot "apps\web\.next"

if (Test-Path $nextCachePath) {
  Remove-Item $nextCachePath -Recurse -Force
  Write-Host "Cleared Next dev cache at $nextCachePath"
} else {
  Write-Host "No Next dev cache found at $nextCachePath"
}

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Set-Location $repoRoot
node --env-file=.env ./scripts/validate-env.mjs all

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

Write-Host "Building all workspaces with root .env loaded..."
npm.cmd run build --workspaces --if-present

$ErrorActionPreference = "Stop"

$target = Join-Path (Get-Location) "src\features\admin\settings\settings-shell.tsx"
$source = Join-Path $PSScriptRoot "src\features\admin\settings\settings-shell.tsx"

if (-not (Test-Path $target)) {
    throw "Target file not found: $target`nRun this script from the Bon Plus project root."
}

$backup = "$target.bak"
Copy-Item $target $backup -Force
Copy-Item $source $target -Force

Write-Host "Feedback navigation updated." -ForegroundColor Green
Write-Host "Backup created at: $backup" -ForegroundColor DarkGray

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$overlayRoot = Join-Path $PSScriptRoot "overlay"

if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    throw "Project root was not detected. Extract this folder directly inside the cafe-retention-app project root."
}

if (-not (Test-Path $overlayRoot)) {
    throw "Overlay folder is missing."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $projectRoot ".feedback-center-backup-$timestamp"
$copied = @()

Get-ChildItem -Path $overlayRoot -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($overlayRoot.Length).TrimStart([char[]]"\/")
    $target = Join-Path $projectRoot $relative
    $targetDir = Split-Path $target -Parent

    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    if (Test-Path $target) {
        $backupTarget = Join-Path $backupRoot $relative
        $backupDir = Split-Path $backupTarget -Parent
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        Copy-Item $target $backupTarget -Force
    }

    Copy-Item $_.FullName $target -Force
    $copied += $relative
}

Write-Host ""
Write-Host "Feedback Center update applied successfully." -ForegroundColor Green
Write-Host "Files updated: $($copied.Count)" -ForegroundColor Cyan
Write-Host "Backup folder: $backupRoot" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "  git add ."
Write-Host '  git commit -m "unify feedback settings center"'
Write-Host "  git push origin main"

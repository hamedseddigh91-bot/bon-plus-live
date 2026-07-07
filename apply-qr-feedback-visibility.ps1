$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot

$qrPage = Join-Path $repo "src\app\admin\qr\page.tsx"
$settingsQrDir = Join-Path $repo "src\app\admin\settings\qr"
$settingsQrPage = Join-Path $settingsQrDir "page.tsx"
$qrManager = Join-Path $repo "src\features\admin\qr\public-qr-manager.tsx"
$settingsShell = Join-Path $repo "src\features\admin\settings\settings-shell.tsx"

foreach ($path in @($qrPage, $qrManager, $settingsShell)) {
    if (-not (Test-Path $path)) {
        throw "Required file not found: $path"
    }
}

Write-Host "1/4 Updating legacy QR route..."
Copy-Item (Join-Path $PSScriptRoot "files\admin-qr-page.tsx") $qrPage -Force

Write-Host "2/4 Creating Settings > QR Feedback page..."
New-Item -ItemType Directory -Path $settingsQrDir -Force | Out-Null
Copy-Item (Join-Path $PSScriptRoot "files\settings-qr-page.tsx") $settingsQrPage -Force

Write-Host "3/4 Removing nested AdminShell from QR manager..."
$manager = Get-Content $qrManager -Raw

$manager = $manager.Replace('import { AdminShell } from "@/components/layout/admin-shell";', '')

$openShell = [regex]::new('\s*<AdminShell>\s*')
$manager = $openShell.Replace($manager, "`r`n", 1)

$closeShell = [regex]::new('\s*</AdminShell>\s*')
$manager = $closeShell.Replace($manager, "`r`n", 1)

Set-Content -Path $qrManager -Value $manager -Encoding UTF8

Write-Host "4/4 Adding QR Feedback to Settings navigation..."
$shell = Get-Content $settingsShell -Raw

if ($shell -notmatch '\bQrCode\b') {
    $lucidePattern = [regex]::new('import\s*\{([^}]*)\}\s*from\s*"lucide-react";')
    $shell = $lucidePattern.Replace(
        $shell,
        {
            param($m)
            $names = $m.Groups[1].Value.Trim()
            return "import { QrCode, $names } from `"lucide-react`";"
        },
        1
    )
}

if ($shell -notmatch '/admin/settings/qr') {
    $feedbackItemPattern = [regex]::new(
        '\{\s*href:\s*"/admin/settings/feedback"\s*,\s*key:\s*"feedback"\s*,\s*moduleKey:\s*"settings_feedback"\s*,\s*icon:\s*SlidersHorizontal\s*\}\s*,'
    )

    if (-not $feedbackItemPattern.IsMatch($shell)) {
        throw "Could not find the Feedback Settings navigation item in settings-shell.tsx"
    }

    $replacement = '$0 { href: "/admin/settings/qr", key: "qr", moduleKey: "settings_feedback", icon: QrCode },'
    $shell = $feedbackItemPattern.Replace($shell, $replacement, 1)
}

if ($shell -notmatch 'qr:\s*"QR فیدبک"') {
    $shell = $shell.Replace(
        'feedback: "تنظیمات فیدبک",',
        'feedback: "تنظیمات فیدبک", qr: "QR فیدبک",'
    )
}

if ($shell -notmatch 'qr:\s*"رمز QR للتقييم"') {
    $shell = $shell.Replace(
        'feedback: "إعدادات الآراء",',
        'feedback: "إعدادات الآراء", qr: "رمز QR للتقييم",'
    )
}

if ($shell -notmatch 'qr:\s*"QR Feedback"') {
    $shell = $shell.Replace(
        'feedback: "Feedback Settings",',
        'feedback: "Feedback Settings", qr: "QR Feedback",'
    )
}

Set-Content -Path $settingsShell -Value $shell -Encoding UTF8

Write-Host ""
Write-Host "QR Feedback visibility update applied successfully." -ForegroundColor Green
Write-Host "Run: npm run build"

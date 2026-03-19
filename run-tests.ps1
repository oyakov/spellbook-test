#!/usr/bin/env pwsh
# run-tests.ps1 - Test Launcher for Spellbook

$env:LOGIN_PASSWORD = "G09L_Spellbook_2026!"
$env:RATE_LIMIT_MAX = "1000"  # Higher limit for testing
$env:LOGIN_LIMIT_MAX = "100" # Higher limit for parallel logins in workers

Write-Host " Starting Playwright Tests against Docker..." -ForegroundColor Cyan

if ($args.Count -gt 0) {
    npx playwright test $args
} else {
    npx playwright test
}

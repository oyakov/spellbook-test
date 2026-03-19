# generate-certs.ps1

Write-Host "--- Generating Self-Signed SSL Certificates for local development ---" -ForegroundColor Cyan

$certDir = Join-Path $PSScriptRoot ""
if (!(Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir }

$certPath = Join-Path $certDir "spellbook.crt"
$keyPath = Join-Path $certDir "spellbook.key"

# Clean up old certs
if (Test-Path $certPath) { Remove-Item $certPath }
if (Test-Path $keyPath) { Remove-Item $keyPath }

# Check for OpenSSL
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    Write-Host "Using OpenSSL to generate certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout $keyPath -out $certPath `
        -subj "/C=US/ST=State/L=City/O=Spellbook/CN=localhost"
    Write-Host "Certificates generated successfully: $certPath" -ForegroundColor Green
} else {
    Write-Host "OpenSSL not found. Attempting to use New-SelfSignedCertificate (Windows Native)..." -ForegroundColor Yellow
    
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)
    
    # Exporting from Certificate Store to PEM format requires more steps
    # For simplicity, we recommend installing OpenSSL or providing placeholder files.
    Write-Host "Native PowerShell export to PEM is complex. Please install OpenSSL for full functionality." -ForegroundColor Red
    Write-Host "Generating empty placeholders to prevent Nginx startup failure..."
    New-Item -ItemType File -Path $certPath -Force
    New-Item -ItemType File -Path $keyPath -Force
}

Write-Host "--- Done ---"

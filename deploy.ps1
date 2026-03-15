# deploy.ps1
# Set variables
$RemoteHost = "37.1.197.100"
$RemoteUser = "root"
$RemotePass = "GLM2ETatD6"
$LocalPath = "c:\Projects\spellbook-test"

Write-Host "--- Starting Deployment to $RemoteHost ---" -ForegroundColor Cyan

# 1. Commit and Push any local changes (Safety Check)
Write-Host "[1/4] Ensuring local changes are pushed to GitHub..."
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "chore: deployment sync"
    git push origin main
} else {
    Write-Host "No changes to commit."
}

# 2. (Optional) Check SSH connection
Write-Host "[2/4] Verifying SSH connection..."
ssh -o BatchMode=yes 37.1.197.100 "exit"
if ($LASTEXITCODE -ne 0) {
    Write-Error "SSH connection failed. Please ensure your public key is in the server's authorized_keys."
    exit
}

# 3. Remote Deployment Commands
Write-Host "[3/4] Running deployment commands on remote server..."
$RemoteCmd = @"
if [ ! -d 'spellbook-test' ]; then
    git clone https://github.com/oyakov/spellbook-test.git
    cd spellbook-test
else
    cd spellbook-test
    git pull origin main
fi
docker-compose up -d --build
"@

ssh 37.1.197.100 $RemoteCmd

# 4. Success Message
Write-Host "[4/4] Deployment sequence completed!" -ForegroundColor Green
Write-Host "You can now access the app at http://$RemoteHost (redirects to https)"

# Fabric Workspace Setup Script
# Run this in your local PowerShell or Azure Cloud Shell to verify prerequisites

Write-Host "=== Microsoft Fabric Demo Setup Checker ===" -ForegroundColor Cyan

# Check if user has required PowerShell modules
$modules = @("Az", "Az.Accounts")
foreach ($mod in $modules) {
    if (Get-Module -ListAvailable -Name $mod) {
        Write-Host "✅ Module '$mod' is installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Module '$mod' not found. Install with: Install-Module $mod" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://app.fabric.microsoft.com"
Write-Host "2. Create a workspace named 'FabricDemos'"
Write-Host "3. Create a Lakehouse named 'BankingLakehouse'"
Write-Host "4. Follow PREREQUISITES.md for full setup guide"

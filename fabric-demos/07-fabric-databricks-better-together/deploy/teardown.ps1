#!/usr/bin/env pwsh
# ============================================================
# teardown.ps1 — Delete all demo resources after the demo
#
# Usage:
#   .\teardown.ps1 -ResourceGroupName "rg-fabric-databricks-demo"
#
# WARNING: This permanently deletes ALL resources in the resource group.
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Red
Write-Host " TEARDOWN — Deleting Demo Environment" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Red
Write-Host ""
Write-Host "  Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host ""

# Confirm before deleting
$confirm = Read-Host "  Type 'yes' to confirm deletion of all resources in '$ResourceGroupName'"
if ($confirm -ne "yes") {
    Write-Host "  Teardown cancelled." -ForegroundColor Green
    exit 0
}

if ($SubscriptionId) {
    az account set --subscription $SubscriptionId | Out-Null
}

Write-Host ""
Write-Host "  Deleting resource group and all contained resources..." -ForegroundColor Yellow
Write-Host "  This takes 3–5 minutes. Do not close this window." -ForegroundColor Gray

az group delete `
    --name $ResourceGroupName `
    --yes `
    --no-wait

Write-Host ""
Write-Host "  Deletion initiated." -ForegroundColor Green
Write-Host "  Resources will be fully removed within 5 minutes." -ForegroundColor Gray
Write-Host ""
Write-Host "  Note: Fabric workspace must be deleted manually from:" -ForegroundColor Yellow
Write-Host "  https://app.fabric.microsoft.com -> Workspace Settings -> Delete workspace" -ForegroundColor Gray
Write-Host ""
Write-Host "  Teardown complete. All Azure resources scheduled for deletion." -ForegroundColor Green

# Clean up local output file if it exists
$outputFiles = Get-ChildItem -Path $PSScriptRoot -Filter "demo-env-*.txt" -ErrorAction SilentlyContinue
foreach ($f in $outputFiles) {
    Remove-Item $f.FullName -Force
    Write-Host "  Removed local file: $($f.Name)" -ForegroundColor Gray
}

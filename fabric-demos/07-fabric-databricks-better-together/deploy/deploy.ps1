#!/usr/bin/env pwsh
# ============================================================
# deploy.ps1 — One-click deploy: Fabric + Azure Databricks demo
#
# Usage:
#   .\deploy.ps1 -SubscriptionId "<your-sub-id>" -EnvName "demo" -Location "eastus2"
#
# What it does:
#   1. Creates a resource group
#   2. Deploys Bicep: Databricks + ADLS Gen2 + Key Vault + Fabric capacity
#   3. Uploads sample data to ADLS Gen2
#   4. Creates a Databricks cluster via REST API
#   5. Prints connection details for the demo
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory=$false)]
    [string]$EnvName = "demo",

    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus2",

    [Parameter(Mandatory=$false)]
    [string]$DatabricksTier = "premium",

    [Parameter(Mandatory=$false)]
    [string]$FabricSkuName = "F2",

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-fabric-databricks-$EnvName"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Microsoft Fabric + Azure Databricks — Demo Deployer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Login and set subscription ───────────────────────
Write-Host "[1/6] Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in. Running az login..." -ForegroundColor Yellow
    az login | Out-Null
}

az account set --subscription $SubscriptionId | Out-Null
Write-Host "  Subscription: $SubscriptionId" -ForegroundColor Green

# Get the current user's object ID and UPN for Fabric admin
$currentUser = az ad signed-in-user show 2>$null | ConvertFrom-Json
$fabricAdminObjectId = $currentUser.id
$fabricAdminUpn      = $currentUser.userPrincipalName
Write-Host "  Fabric admin: $fabricAdminUpn ($fabricAdminObjectId)" -ForegroundColor Green

# ── Step 2: Create resource group ───────────────────────────
Write-Host ""
Write-Host "[2/6] Creating resource group: $ResourceGroupName in $Location..." -ForegroundColor Yellow
az group create `
    --name $ResourceGroupName `
    --location $Location `
    --tags environment=demo project=fabric-databricks-better-together "auto-delete=true" `
    | Out-Null
Write-Host "  Resource group created." -ForegroundColor Green

# ── Step 3: Deploy Bicep ─────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Deploying Bicep template (this takes ~10 minutes)..." -ForegroundColor Yellow
Write-Host "  Resources: Databricks workspace, ADLS Gen2, Key Vault, Fabric capacity" -ForegroundColor Gray

$deployOutput = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "$ScriptDir\main.bicep" `
    --parameters `
        envName=$EnvName `
        location=$Location `
        databricksTier=$DatabricksTier `
        fabricSkuName=$FabricSkuName `
        fabricAdminObjectId=$fabricAdminObjectId `
        fabricAdminUpn=$fabricAdminUpn `
    --output json 2>&1 | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Bicep deployment failed. See above for details." -ForegroundColor Red
    exit 1
}

# Parse deployment outputs
$outputs                = $deployOutput.properties.outputs
$databricksUrl          = $outputs.databricksWorkspaceUrl.value
$storageAccountName     = $outputs.storageAccountName.value
$adlsEndpoint           = $outputs.adlsGen2Endpoint.value
$keyVaultUri            = $outputs.keyVaultUri.value
$fabricCapacityName     = $outputs.fabricCapacityName.value

Write-Host "  Bicep deployment complete." -ForegroundColor Green

# ── Step 4: Upload sample data to ADLS Gen2 ─────────────────
Write-Host ""
Write-Host "[4/6] Uploading sample data to ADLS Gen2 bronze container..." -ForegroundColor Yellow
$dataFile = "$ScriptDir\..\data\transactions_raw.csv"
if (Test-Path $dataFile) {
    az storage blob upload `
        --account-name $storageAccountName `
        --container-name "bronze" `
        --name "transactions_raw.csv" `
        --file $dataFile `
        --auth-mode login `
        --overwrite true `
        | Out-Null
    Write-Host "  transactions_raw.csv uploaded to bronze container." -ForegroundColor Green
} else {
    Write-Host "  Warning: $dataFile not found — upload manually." -ForegroundColor Yellow
}

# ── Step 5: Create Databricks cluster via REST API ───────────
Write-Host ""
Write-Host "[5/6] Creating Databricks all-purpose cluster..." -ForegroundColor Yellow

# Get Databricks management token
$databricksToken = az account get-access-token `
    --resource "2ff814a6-3304-4ab8-85cb-cd0e6f879c1d" `
    --query accessToken -o tsv

$azureToken = az account get-access-token `
    --resource "https://management.core.windows.net/" `
    --query accessToken -o tsv

$databricksWorkspaceId = $outputs.databricksWorkspaceId.value
$adbHost = $databricksUrl

# Create cluster payload
$clusterConfig = @{
    cluster_name            = "demo-cluster-$EnvName"
    spark_version           = "15.4.x-scala2.12"
    node_type_id            = "Standard_DS3_v2"
    autotermination_minutes = 60          # Auto-terminate after 1 hour of inactivity
    num_workers             = 2
    spark_conf              = @{
        "spark.databricks.delta.preview.enabled" = "true"
    }
    custom_tags             = @{
        environment = "demo"
        project     = "fabric-databricks-better-together"
    }
} | ConvertTo-Json -Depth 5

$clusterResponse = Invoke-RestMethod `
    -Uri "$adbHost/api/2.0/clusters/create" `
    -Method POST `
    -Headers @{
        "Authorization"                = "Bearer $databricksToken"
        "X-Databricks-Azure-SP-Management-Token" = $azureToken
        "X-Databricks-Azure-Workspace-Resource-Id" = $databricksWorkspaceId
    } `
    -Body $clusterConfig `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue

if ($clusterResponse.cluster_id) {
    Write-Host "  Cluster created: $($clusterResponse.cluster_id)" -ForegroundColor Green
    Write-Host "  Note: Cluster starts on first use — initial startup takes ~3 minutes." -ForegroundColor Gray
} else {
    Write-Host "  Warning: Cluster auto-create failed. Create manually in Databricks UI." -ForegroundColor Yellow
    Write-Host "  Recommended: Standard_DS3_v2, 2 workers, Spark 15.4, DBR 15.4 LTS" -ForegroundColor Gray
}

# ── Step 6: Print connection summary ────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT COMPLETE — Demo Environment Ready" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Resource Group    : $ResourceGroupName" -ForegroundColor White
Write-Host "  Databricks URL    : $databricksUrl" -ForegroundColor White
Write-Host "  ADLS Gen2 Account : $storageAccountName" -ForegroundColor White
Write-Host "  ADLS DFS Endpoint : $adlsEndpoint" -ForegroundColor White
Write-Host "  Key Vault URI     : $keyVaultUri" -ForegroundColor White
Write-Host "  Fabric Capacity   : $fabricCapacityName (SKU: $FabricSkuName)" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Open Databricks: $databricksUrl" -ForegroundColor Gray
Write-Host "  2. Import notebooks from: ..\notebooks\" -ForegroundColor Gray
Write-Host "  3. Set ADLS path in notebooks: abfss://bronze@${storageAccountName}.dfs.core.windows.net/" -ForegroundColor Gray
Write-Host "  4. Open Fabric: https://app.fabric.microsoft.com" -ForegroundColor Gray
Write-Host "  5. Create workspace -> assign to $fabricCapacityName capacity" -ForegroundColor Gray
Write-Host "  6. Create Lakehouse -> New shortcut -> ADLS Gen2 -> $adlsEndpoint" -ForegroundColor Gray
Write-Host ""
Write-Host "  See DEMO_SCRIPT.md for full step-by-step demo instructions." -ForegroundColor Cyan
Write-Host ""
Write-Host "  To tear down after demo: .\teardown.ps1 -ResourceGroupName $ResourceGroupName" -ForegroundColor Red
Write-Host ""

# Save outputs to a local file for reference during the demo
$outputFile = "$ScriptDir\demo-env-$EnvName.txt"
@"
Demo Environment: $EnvName
Deployed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
Resource Group    : $ResourceGroupName
Databricks URL    : $databricksUrl
ADLS Gen2 Account : $storageAccountName
ADLS DFS Endpoint : $adlsEndpoint
Key Vault URI     : $keyVaultUri
Fabric Capacity   : $fabricCapacityName
Fabric URL        : https://app.fabric.microsoft.com
"@ | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "  Connection details saved to: $outputFile" -ForegroundColor Gray

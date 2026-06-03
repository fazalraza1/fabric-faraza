# ==============================================================
# deploy.ps1 - One-click deploy: Fabric + Azure Databricks demo
#
# Usage:
#   .\deploy.ps1 -SubscriptionId "<your-sub-id>"
#   .\deploy.ps1 -SubscriptionId "<your-sub-id>" -ExistingFabricCapacityName "my-capacity"
#
# Prerequisites:
#   - Azure CLI installed  (winget install Microsoft.AzureCLI)
#   - Logged in to Azure   (az login)
#   - Contributor access on target subscription
#   See AZURE_LOGIN.md for full login instructions.
#
# What it does:
#   1. Checks Azure login
#   2. Creates a resource group
#   3. Deploys Bicep: Databricks + ADLS Gen2 + Key Vault (+ optional Fabric capacity)
#   4. Uploads sample data to ADLS Gen2
#   5. Creates a Databricks cluster via REST API
#   6. Prints connection details for the demo
# ==============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory=$false)]
    [string]$EnvName = "demo",

    [Parameter(Mandatory=$false)]
    [string]$Location = "centralus",

    [Parameter(Mandatory=$false)]
    [string]$DatabricksTier = "premium",

    [Parameter(Mandatory=$false)]
    [string]$FabricSkuName = "F2",

    # Optional: name of an existing Fabric capacity to reuse (skips deploying a new one)
    # Run: az resource list --resource-type Microsoft.Fabric/capacities --output table
    [Parameter(Mandatory=$false)]
    [string]$ExistingFabricCapacityName = "",

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-fabric-databricks-$EnvName"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Microsoft Fabric + Azure Databricks - Demo Deployer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# -- Step 1: Login and set subscription --
Write-Host "[1/6] Checking Azure login..." -ForegroundColor Yellow
Write-Host "  Tip: If not logged in, run: az login" -ForegroundColor Gray
Write-Host "  For MFA/device code login, run: az login --use-device-code" -ForegroundColor Gray

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host ""
    Write-Host "  Not logged in to Azure. Starting az login..." -ForegroundColor Yellow
    Write-Host "  A browser window will open - sign in with your Microsoft account." -ForegroundColor Gray
    Write-Host "  If no browser opens, try: az login --use-device-code" -ForegroundColor Gray
    Write-Host ""
    az login
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Host "  ERROR: Login failed. See AZURE_LOGIN.md for help." -ForegroundColor Red
        exit 1
    }
}

az account set --subscription $SubscriptionId | Out-Null
Write-Host "  Subscription: $SubscriptionId" -ForegroundColor Green

$currentUser = az ad signed-in-user show 2>$null | ConvertFrom-Json
$fabricAdminObjectId = $currentUser.id
$fabricAdminUpn      = $currentUser.userPrincipalName
Write-Host "  Fabric admin: $fabricAdminUpn" -ForegroundColor Green

# -- Resolve Fabric capacity --
$useExistingCapacity = ($ExistingFabricCapacityName -ne "")

if ($useExistingCapacity) {
    Write-Host ""
    Write-Host "  Using existing Fabric capacity: $ExistingFabricCapacityName" -ForegroundColor Cyan
    Write-Host "  (Skipping Fabric capacity deployment)" -ForegroundColor Gray
    $capCheck = az resource list --resource-type "Microsoft.Fabric/capacities" --query "[?name=='$ExistingFabricCapacityName']" -o json 2>$null | ConvertFrom-Json
    if ($capCheck.Count -eq 0) {
        Write-Host "  WARNING: Capacity '$ExistingFabricCapacityName' not found in this subscription." -ForegroundColor Yellow
        Write-Host "  List available capacities: az resource list --resource-type Microsoft.Fabric/capacities --output table" -ForegroundColor Gray
    } else {
        Write-Host "  Capacity found." -ForegroundColor Green
    }
} else {
    Write-Host "  No existing Fabric capacity provided - a new $FabricSkuName capacity will be deployed." -ForegroundColor Gray
    Write-Host "  Tip: To reuse an existing capacity, add: -ExistingFabricCapacityName 'your-capacity-name'" -ForegroundColor Gray
}

# -- Step 2: Create resource group --
Write-Host ""
Write-Host "[2/6] Creating resource group: $ResourceGroupName in $Location..." -ForegroundColor Yellow
az group create `
    --name $ResourceGroupName `
    --location $Location `
    --tags environment=demo project=fabric-databricks-better-together auto-delete=true `
    | Out-Null
Write-Host "  Resource group created." -ForegroundColor Green

# -- Step 3: Deploy Bicep --
Write-Host ""
Write-Host "[3/6] Deploying Bicep template (this takes ~10 minutes)..." -ForegroundColor Yellow
if ($useExistingCapacity) {
    Write-Host "  Resources: Databricks workspace, ADLS Gen2, Key Vault (Fabric capacity skipped)" -ForegroundColor Gray
} else {
    Write-Host "  Resources: Databricks workspace, ADLS Gen2, Key Vault, Fabric capacity ($FabricSkuName)" -ForegroundColor Gray
}

$deployFabric = (-not $useExistingCapacity).ToString().ToLower()

$deployOutput = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "$ScriptDir\main.bicep" `
    --parameters `
        envName=$EnvName `
        location=$Location `
        databricksTier=$DatabricksTier `
        fabricSkuName=$FabricSkuName `
        deployFabricCapacity=$deployFabric `
        fabricAdminObjectId=$fabricAdminObjectId `
        fabricAdminUpn=$fabricAdminUpn `
    --output json 2>&1 | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Bicep deployment failed. See above for details." -ForegroundColor Red
    exit 1
}

$outputs            = $deployOutput.properties.outputs
$databricksUrl      = $outputs.databricksWorkspaceUrl.value
$storageAccountName = $outputs.storageAccountName.value
$adlsEndpoint       = $outputs.adlsGen2Endpoint.value
$keyVaultUri        = $outputs.keyVaultUri.value

if ($useExistingCapacity) {
    $fabricCapacityName = $ExistingFabricCapacityName
} else {
    $fabricCapacityName = $outputs.fabricCapacityName.value
}

Write-Host "  Bicep deployment complete." -ForegroundColor Green

# -- Step 4: Upload sample data to ADLS Gen2 --
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
    Write-Host "  Warning: $dataFile not found - upload manually." -ForegroundColor Yellow
}

# -- Step 5: Create Databricks cluster via REST API --
Write-Host ""
Write-Host "[5/6] Creating Databricks all-purpose cluster..." -ForegroundColor Yellow

$databricksToken = az account get-access-token `
    --resource "2ff814a6-3304-4ab8-85cb-cd0e6f879c1d" `
    --query accessToken -o tsv

$azureToken = az account get-access-token `
    --resource "https://management.core.windows.net/" `
    --query accessToken -o tsv

$databricksWorkspaceId = $outputs.databricksWorkspaceId.value
$adbHost = $databricksUrl

$clusterConfig = @{
    cluster_name            = "demo-cluster-$EnvName"
    spark_version           = "15.4.x-scala2.12"
    node_type_id            = "Standard_DS3_v2"
    autotermination_minutes = 60
    num_workers             = 2
    spark_conf              = @{ "spark.databricks.delta.preview.enabled" = "true" }
    custom_tags             = @{ environment = "demo"; project = "fabric-databricks-better-together" }
} | ConvertTo-Json -Depth 5

# Databricks workspace backend takes a few minutes to initialize after Bicep deploy.
# Retry cluster creation up to 8 times with 30-second waits (~4 minutes total).
$clusterResponse = $null
$maxRetries = 8
$retryWait  = 30

for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    try {
        $clusterResponse = Invoke-RestMethod `
            -Uri "$adbHost/api/2.0/clusters/create" `
            -Method POST `
            -Headers @{
                "Authorization"                              = "Bearer $databricksToken"
                "X-Databricks-Azure-SP-Management-Token"     = $azureToken
                "X-Databricks-Azure-Workspace-Resource-Id"   = $databricksWorkspaceId
            } `
            -Body $clusterConfig `
            -ContentType "application/json" `
            -ErrorAction Stop

        # Success — break out of retry loop
        break
    } catch {
        $errMsg = $_.ToString()
        if ($errMsg -match "worker environments" -or $errMsg -match "BAD_REQUEST") {
            if ($attempt -lt $maxRetries) {
                Write-Host "  Workspace still initializing (attempt $attempt/$maxRetries) - waiting ${retryWait}s..." -ForegroundColor Yellow
                Start-Sleep -Seconds $retryWait
            }
        } else {
            # Unexpected error — log and stop retrying
            Write-Host "  Cluster create error: $errMsg" -ForegroundColor Yellow
            break
        }
    }
}

if ($clusterResponse -and $clusterResponse.cluster_id) {
    Write-Host "  Cluster created: $($clusterResponse.cluster_id)" -ForegroundColor Green
    Write-Host "  Note: Cluster starts on first use - initial startup takes ~3 minutes." -ForegroundColor Gray
} else {
    Write-Host "  Warning: Cluster auto-create failed. Create manually in the Databricks UI." -ForegroundColor Yellow
    Write-Host "  Recommended: Standard_DS3_v2, 2 workers, DBR 15.4 LTS" -ForegroundColor Gray
}

# -- Step 6: Print connection summary --
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT COMPLETE - Demo Environment Ready" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Resource Group    : $ResourceGroupName" -ForegroundColor White
Write-Host "  Databricks URL    : $databricksUrl" -ForegroundColor White
Write-Host "  ADLS Gen2 Account : $storageAccountName" -ForegroundColor White
Write-Host "  ADLS DFS Endpoint : $adlsEndpoint" -ForegroundColor White
Write-Host "  Key Vault URI     : $keyVaultUri" -ForegroundColor White
Write-Host "  Fabric Capacity   : $fabricCapacityName" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Open Databricks  : $databricksUrl" -ForegroundColor Gray
Write-Host "  2. Import notebooks : ..\notebooks\" -ForegroundColor Gray
Write-Host "  3. ADLS path        : abfss://bronze@${storageAccountName}.dfs.core.windows.net/" -ForegroundColor Gray
Write-Host "  4. Open Fabric      : https://app.fabric.microsoft.com" -ForegroundColor Gray
Write-Host "  5. Create workspace, assign to capacity: $fabricCapacityName" -ForegroundColor Gray
Write-Host "  6. Create Lakehouse shortcut to: $adlsEndpoint" -ForegroundColor Gray
Write-Host ""
Write-Host "  See DEMO_SCRIPT.md for the full demo walkthrough." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Teardown: .\teardown.ps1 -ResourceGroupName $ResourceGroupName" -ForegroundColor Red
Write-Host ""

$outputFile = "$ScriptDir\demo-env-$EnvName.txt"
$content = "Demo Environment : $EnvName`r`n"
$content += "Deployed         : $(Get-Date -Format 'yyyy-MM-dd HH:mm')`r`n"
$content += "Resource Group   : $ResourceGroupName`r`n"
$content += "Databricks URL   : $databricksUrl`r`n"
$content += "ADLS Account     : $storageAccountName`r`n"
$content += "ADLS Endpoint    : $adlsEndpoint`r`n"
$content += "Key Vault URI    : $keyVaultUri`r`n"
$content += "Fabric Capacity  : $fabricCapacityName`r`n"
$content += "Fabric URL       : https://app.fabric.microsoft.com`r`n"
$content | Out-File -FilePath $outputFile -Encoding ASCII

Write-Host "  Connection details saved to: $outputFile" -ForegroundColor Gray

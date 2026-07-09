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
#   - Permission to create Azure AD app registrations/service principals (used for
#     OAuth-based ADLS Gen2 access from the Databricks cluster - see Step 4b)
#   See ../README.md "Prerequisites — Azure CLI login" for full login instructions.
#
# What it does:
#   1. Checks Azure login
#   2. Creates a resource group
#   3. Deploys Bicep: Databricks + ADLS Gen2 + Key Vault (+ optional Fabric capacity)
#   4. Uploads sample data to ADLS Gen2; creates an Azure AD service principal and grants it
#      Storage Blob Data Contributor so the Databricks cluster can authenticate via OAuth
#      (works even when tenant policy disables storage account key auth)
#   5. Creates a Databricks cluster via REST API, pre-configured with the OAuth spark_conf
#   6. Prints connection details for the demo
# ==============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory=$false)]
    [string]$EnvName = "demo",

    [Parameter(Mandatory=$false)]
    [string]$Location = "canadacentral",

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
# PowerShell 7.3+ turns a non-zero exit code from native commands (like az) into a terminating
# error that respects $ErrorActionPreference, even when stderr is redirected. Several steps below
# deliberately check $LASTEXITCODE after an az call to retry on failure (e.g. RBAC propagation
# delays), so that behavior must be disabled or those retry loops never get a chance to run.
$PSNativeCommandUseErrorActionPreference = $false
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
        Write-Host "  ERROR: Login failed. See ../README.md 'Prerequisites - Azure CLI login' for help." -ForegroundColor Red
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
$storageAccountId   = $outputs.storageAccountId.value
$adlsEndpoint       = $outputs.adlsGen2Endpoint.value
$keyVaultUri        = $outputs.keyVaultUri.value
$keyVaultName       = $outputs.keyVaultName.value

if ($useExistingCapacity) {
    $fabricCapacityName = $ExistingFabricCapacityName
} else {
    $fabricCapacityName = $outputs.fabricCapacityName.value
}

Write-Host "  Bicep deployment complete." -ForegroundColor Green

# -- Step 3b: Grant the deploying user data-plane access to the storage account --
# "az storage blob upload --auth-mode login" authenticates as the signed-in user via Entra ID,
# which requires a data-plane RBAC role (Contributor/Owner on the account is NOT sufficient).
Write-Host ""
Write-Host "  Granting 'Storage Blob Data Contributor' to $fabricAdminUpn on $storageAccountName..." -ForegroundColor Yellow

# NOTE: $ErrorActionPreference = "Stop" turns ANY stderr line from a native command (like az) into
# a terminating error - even when stderr is redirected with 2>$null. Switch to "Continue" for the
# steps below that deliberately inspect $LASTEXITCODE / output to decide whether to retry.
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

$existingAssignment = az role assignment list `
    --assignee $fabricAdminObjectId `
    --scope $storageAccountId `
    --role "Storage Blob Data Contributor" `
    --query "[0].id" -o tsv 2>$null

if ($existingAssignment) {
    Write-Host "  Role already assigned." -ForegroundColor Green
} else {
    az role assignment create `
        --assignee-object-id $fabricAdminObjectId `
        --assignee-principal-type User `
        --role "Storage Blob Data Contributor" `
        --scope $storageAccountId `
        2>$null | Out-Null
    Write-Host "  Role assigned. Waiting for RBAC propagation..." -ForegroundColor Green
    Start-Sleep -Seconds 30
}

# Some tenants enforce a security-baseline policy that flips "Allow public network access" back
# to Disabled shortly after a storage account is created, which breaks both the upload below and
# the Databricks control plane's own access to its managed storage. Re-assert it defensively.
$publicAccess = az storage account show --name $storageAccountName --resource-group $ResourceGroupName --query publicNetworkAccess -o tsv 2>$null
if ($publicAccess -ne "Enabled") {
    Write-Host "  Public network access is '$publicAccess' - re-enabling (tenant policy may have reset it)..." -ForegroundColor Yellow
    az storage account update --name $storageAccountName --resource-group $ResourceGroupName --public-network-access Enabled 2>$null | Out-Null
}

# -- Step 4: Upload sample data to ADLS Gen2 --
Write-Host ""
Write-Host "[4/6] Uploading sample data to ADLS Gen2 bronze container..." -ForegroundColor Yellow
$dataFile = "$ScriptDir\..\data\transactions_raw.csv"
if (Test-Path $dataFile) {
    # RBAC propagation can lag a minute or two after role assignment - retry on auth failures.
    $maxUploadRetries = 5
    $uploadRetryWait  = 20
    $uploaded = $false
    for ($i = 1; $i -le $maxUploadRetries; $i++) {
        az storage blob upload `
            --account-name $storageAccountName `
            --container-name "bronze" `
            --name "transactions_raw.csv" `
            --file $dataFile `
            --auth-mode login `
            --overwrite true `
            2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $uploaded = $true
            break
        }
        Write-Host "  Upload not yet authorized (attempt $i/$maxUploadRetries) - waiting ${uploadRetryWait}s for RBAC propagation..." -ForegroundColor Yellow
        Start-Sleep -Seconds $uploadRetryWait
    }
    if ($uploaded) {
        Write-Host "  transactions_raw.csv uploaded to bronze container." -ForegroundColor Green
    } else {
        Write-Host "  Warning: Upload failed after $maxUploadRetries attempts. Upload manually:" -ForegroundColor Yellow
        Write-Host "    az storage blob upload --account-name $storageAccountName --container-name bronze --name transactions_raw.csv --file `"$dataFile`" --auth-mode login --overwrite true" -ForegroundColor Gray
    }
} else {
    Write-Host "  Warning: $dataFile not found - upload manually." -ForegroundColor Yellow
}

# Restore strict error handling for the remaining steps.
$ErrorActionPreference = $prevEAP

# -- Step 4b: Give the Databricks cluster a way to authenticate to ADLS Gen2 --
# The RBAC role above only lets the *deploying user* upload via "az storage blob upload".
# The cluster itself has no credential passthrough or Unity Catalog storage credential
# configured, so reading/writing abfss:// paths from notebooks fails with
# "SparkKeyProviderException: Invalid configuration value detected for fs.azure.account.key"
# unless it can authenticate some other way.
#
# NOTE: Storage account keys do NOT work here — many tenants enforce a security-baseline
# policy that sets allowSharedKeyAccess=false on new storage accounts, which silently rejects
# key-based auth. Use an Azure AD service principal with the OAuth2 client-credentials flow
# instead, which works regardless of that policy.
Write-Host ""
Write-Host "  Configuring an Azure AD service principal for cluster access to ADLS Gen2 (OAuth)..." -ForegroundColor Yellow

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

$spDisplayName = "sp-fabric-databricks-$EnvName-storage"
$tenantId = $account.tenantId

# Reuse the app registration if a previous deploy already created one (idempotent re-runs).
$existingAppId = az ad app list --display-name $spDisplayName --query "[0].appId" -o tsv 2>$null

if ($existingAppId) {
    $appId = $existingAppId
    Write-Host "  Reusing existing app registration: $spDisplayName ($appId)" -ForegroundColor Green
} else {
    $appId = az ad app create --display-name $spDisplayName --query appId -o tsv 2>$null
    az ad sp create --id $appId 2>$null | Out-Null
    Write-Host "  Created app registration + service principal: $spDisplayName ($appId)" -ForegroundColor Green
}

# Grant the service principal data-plane access to the storage account (idempotent - checks first).
$spRoleAssigned = az role assignment list `
    --assignee $appId `
    --scope $storageAccountId `
    --role "Storage Blob Data Contributor" `
    --query "[0].id" -o tsv 2>$null

if (-not $spRoleAssigned) {
    az role assignment create `
        --assignee $appId `
        --role "Storage Blob Data Contributor" `
        --scope $storageAccountId `
        2>$null | Out-Null
    Write-Host "  Role assigned to service principal. Waiting for RBAC propagation..." -ForegroundColor Green
    Start-Sleep -Seconds 30
} else {
    Write-Host "  Service principal already has Storage Blob Data Contributor." -ForegroundColor Green
}

# Always mint a fresh client secret (old ones aren't retrievable) and store all three
# values in Key Vault for reference/rotation.
$clientSecret = az ad app credential reset --id $appId --years 1 --query password -o tsv 2>$null

az keyvault secret set --vault-name $keyVaultName --name "adls-sp-client-id"     --value $appId        2>$null | Out-Null
az keyvault secret set --vault-name $keyVaultName --name "adls-sp-client-secret" --value $clientSecret  2>$null | Out-Null
az keyvault secret set --vault-name $keyVaultName --name "adls-sp-tenant-id"     --value $tenantId      2>$null | Out-Null
Write-Host "  Service principal credentials saved to Key Vault (adls-sp-client-id / -client-secret / -tenant-id)." -ForegroundColor Green

$ErrorActionPreference = $prevEAP

# -- Step 5: Create (or repair) the Databricks all-purpose cluster via REST API --
# NOTE: Serverless compute CANNOT be used for this notebook - Databricks blocks custom
# spark_conf (including the fs.azure.account.oauth2.* keys below) on serverless for
# multi-tenant isolation reasons, so OAuth storage auth is only possible on a dedicated
# all-purpose cluster like the one created here.
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
$clusterName = "demo-cluster-$EnvName"

$commonHeaders = @{
    "Authorization"                              = "Bearer $databricksToken"
    "X-Databricks-Azure-SP-Management-Token"     = $azureToken
    "X-Databricks-Azure-Workspace-Resource-Id"   = $databricksWorkspaceId
}

# IMPORTANT: cluster-scoped Hadoop filesystem settings (fs.azure.*) must be prefixed with
# "spark.hadoop." to be injected into the Hadoop Configuration that the ABFS driver reads.
# Without that prefix these are inert Spark conf entries and the driver falls back to (missing)
# account-key auth, producing SparkKeyProviderException.
$sparkConf = @{
    "spark.databricks.delta.preview.enabled" = "true"
    "spark.hadoop.fs.azure.account.auth.type.$storageAccountName.dfs.core.windows.net"          = "OAuth"
    "spark.hadoop.fs.azure.account.oauth.provider.type.$storageAccountName.dfs.core.windows.net" = "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider"
    "spark.hadoop.fs.azure.account.oauth2.client.id.$storageAccountName.dfs.core.windows.net"     = $appId
    "spark.hadoop.fs.azure.account.oauth2.client.secret.$storageAccountName.dfs.core.windows.net" = $clientSecret
    "spark.hadoop.fs.azure.account.oauth2.client.endpoint.$storageAccountName.dfs.core.windows.net" = "https://login.microsoftonline.com/$tenantId/oauth2/token"
}

$clusterConfig = @{
    cluster_name            = $clusterName
    spark_version           = "15.4.x-scala2.12"
    node_type_id            = "Standard_DS3_v2"
    autotermination_minutes = 60
    num_workers             = 2
    spark_conf              = $sparkConf
    custom_tags             = @{ demo_environment = "demo"; demo_project = "fabric-databricks-better-together" }
} | ConvertTo-Json -Depth 5

# Re-running deploy.ps1 (e.g. after someone deleted/rebuilt the cluster by hand) must not create
# a second cluster with the same name. Look up existing clusters by name first: if found, push the
# (possibly rotated) spark_conf to it via clusters/edit instead of creating a duplicate.
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$existingCluster = $null
try {
    $clusterList = Invoke-RestMethod -Uri "$adbHost/api/2.0/clusters/list" -Method GET -Headers $commonHeaders -ErrorAction Stop
    $existingCluster = $clusterList.clusters | Where-Object { $_.cluster_name -eq $clusterName } | Select-Object -First 1
} catch {
    Write-Host "  Could not list existing clusters (workspace may still be initializing) - will attempt create." -ForegroundColor Gray
}
$ErrorActionPreference = $prevEAP

if ($existingCluster) {
    Write-Host "  Found existing cluster '$clusterName' ($($existingCluster.cluster_id)) - updating its spark_conf instead of creating a duplicate..." -ForegroundColor Yellow
    $editConfig = @{
        cluster_id              = $existingCluster.cluster_id
        cluster_name            = $clusterName
        spark_version           = "15.4.x-scala2.12"
        node_type_id            = "Standard_DS3_v2"
        autotermination_minutes = 60
        num_workers             = 2
        spark_conf              = $sparkConf
        custom_tags             = @{ demo_environment = "demo"; demo_project = "fabric-databricks-better-together" }
    } | ConvertTo-Json -Depth 5

    try {
        Invoke-RestMethod -Uri "$adbHost/api/2.0/clusters/edit" -Method POST -Headers $commonHeaders -Body $editConfig -ContentType "application/json" -ErrorAction Stop | Out-Null
        $clusterResponse = @{ cluster_id = $existingCluster.cluster_id }
        Write-Host "  Cluster updated: $($existingCluster.cluster_id)" -ForegroundColor Green
    } catch {
        Write-Host "  Warning: Failed to update existing cluster's spark_conf: $_" -ForegroundColor Yellow
        Write-Host "  Delete the cluster '$clusterName' in the Databricks UI and re-run deploy.ps1 to recreate it." -ForegroundColor Gray
    }
}

# Databricks workspace backend takes a few minutes to initialize after Bicep deploy.
# Retry cluster creation up to 8 times with 30-second waits (~4 minutes total).
if (-not $existingCluster) {
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
} # end if (-not $existingCluster)

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

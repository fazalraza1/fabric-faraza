// ============================================================
// main.bicep — Better Together: Fabric + Azure Databricks
// One-click deploy for demo/lab environments
// Deploys: Databricks workspace, ADLS Gen2, Key Vault, Fabric capacity
// ============================================================

targetScope = 'resourceGroup'

// ── Parameters ──────────────────────────────────────────────
@description('Short environment tag — used as a suffix on all resource names.')
@maxLength(8)
param envName string = 'demo'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Databricks workspace pricing tier: standard or premium. Premium required for Unity Catalog.')
@allowed(['standard', 'premium'])
param databricksTier string = 'premium'

@description('Fabric capacity SKU. F2 is the smallest billable unit.')
@allowed(['F2', 'F4', 'F8', 'F16', 'F32', 'F64'])
param fabricSkuName string = 'F2'

@description('Object ID of the Azure AD user or group that will be Fabric capacity admin.')
param fabricAdminObjectId string

@description('UPN (email) of the Fabric capacity admin — e.g. user@contoso.com.')
param fabricAdminUpn string

@description('Tags applied to every resource for cost tracking and cleanup.')
param resourceTags object = {
  environment: 'demo'
  project: 'fabric-databricks-better-together'
  owner: 'sales-engineering'
  'auto-delete': 'true'
}

// ── Variables ─────────────────────────────────────────────────
var suffix           = toLower(envName)
var storageAcctName  = 'stbankingdemo${suffix}'   // must be globally unique
var keyVaultName     = 'kv-banking-${suffix}'
var databricksName   = 'adb-banking-${suffix}'
var fabricCapName    = 'fabric-banking-${suffix}'
var containerName    = 'silver'                    // Delta table container

// ── Modules ──────────────────────────────────────────────────

module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  params: {
    storageAccountName: storageAcctName
    location: location
    containerName: containerName
    tags: resourceTags
  }
}

module databricks 'modules/databricks.bicep' = {
  name: 'deploy-databricks'
  params: {
    workspaceName: databricksName
    location: location
    pricingTier: databricksTier
    storageAccountName: storageAcctName
    tags: resourceTags
  }
  dependsOn: [storage]
}

module keyvault 'modules/keyvault.bicep' = {
  name: 'deploy-keyvault'
  params: {
    keyVaultName: keyVaultName
    location: location
    fabricAdminObjectId: fabricAdminObjectId
    storageAccountName: storageAcctName
    tags: resourceTags
  }
  dependsOn: [storage, databricks]
}

module fabric 'modules/fabric.bicep' = {
  name: 'deploy-fabric'
  params: {
    capacityName: fabricCapName
    location: location
    skuName: fabricSkuName
    adminUpn: fabricAdminUpn
    tags: resourceTags
  }
}

// ── Outputs ───────────────────────────────────────────────────
// These are printed by deploy.ps1 after deployment completes

output databricksWorkspaceUrl string = databricks.outputs.workspaceUrl
output databricksWorkspaceId  string = databricks.outputs.workspaceId
output storageAccountName     string = storage.outputs.storageAccountName
output storageContainerName   string = containerName
output adlsGen2Endpoint       string = storage.outputs.dfsEndpoint
output keyVaultUri            string = keyvault.outputs.keyVaultUri
output fabricCapacityName     string = fabric.outputs.capacityName
output fabricCapacityId       string = fabric.outputs.capacityId
output onelakeShortcutTarget  string = storage.outputs.dfsEndpoint

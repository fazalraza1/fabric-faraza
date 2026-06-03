// ============================================================
// modules/keyvault.bicep — Azure Key Vault
// Stores Databricks PAT token, storage account key, and
// Fabric workspace secrets for the demo environment
// ============================================================

param keyVaultName         string
param location             string
param fabricAdminObjectId  string
param storageAccountName   string
param tags                 object

// Deploy Key Vault to store demo secrets securely
// The fabric admin gets full secret access so they can retrieve tokens during the demo
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enabledForDeployment: false
    enabledForTemplateDeployment: true   // Allows Bicep/ARM to write secrets
    enableSoftDelete: false              // Disabled for demo — easier cleanup
    enableRbacAuthorization: true        // Use RBAC instead of access policies
    networkAcls: {
      defaultAction: 'Allow'            // Open for demo — restrict in production
      bypass: 'AzureServices'
    }
  }
}

// Grant the demo presenter Key Vault Secrets Officer role
// This allows them to read/write secrets during the demo without needing admin
resource secretsOfficerRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, fabricAdminObjectId, 'secrets-officer')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'  // Key Vault Secrets Officer
    )
    principalId: fabricAdminObjectId
    principalType: 'User'
  }
}

// Placeholder secret — deploy.ps1 will overwrite this with the real storage key
// after deployment completes
resource storageKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'adls-storage-account-name'
  properties: {
    value: storageAccountName
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Placeholder for Databricks PAT token — populated by deploy.ps1 post-deployment
resource databricksTokenSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'databricks-pat-token'
  properties: {
    value: 'REPLACE_AFTER_DEPLOY'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

output keyVaultUri  string = keyVault.properties.vaultUri
output keyVaultName string = keyVault.name
output keyVaultId   string = keyVault.id

// ============================================================
// modules/storage.bicep — ADLS Gen2 storage account
// Provides the shared Delta Lake storage layer between
// Azure Databricks and Microsoft Fabric (OneLake shortcut target)
// ============================================================

param storageAccountName string
param location           string
param containerName      string
param tags               object

// Deploy ADLS Gen2 storage account with hierarchical namespace enabled
// Hierarchical namespace (HNS) is required for Delta Lake directory semantics
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'    // LRS is sufficient for demo environments
  }
  kind: 'StorageV2'
  properties: {
    isHnsEnabled: true       // Required for ADLS Gen2 — enables directory operations
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Allow' // Open for demo — restrict in production
      bypass: 'AzureServices'
    }
  }
}

// Create the blob service to configure containers
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

// Create the 'silver' container where Databricks writes Delta tables
// Fabric reads this container via OneLake Shortcut
resource silverContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

// Create a 'bronze' container for raw landing zone files
resource bronzeContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'bronze'
  properties: {
    publicAccess: 'None'
  }
}

// Create a 'gold' container for Fabric-enriched tables (written back from Fabric)
resource goldContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'gold'
  properties: {
    publicAccess: 'None'
  }
}

output storageAccountName string = storageAccount.name
output storageAccountId   string = storageAccount.id
output dfsEndpoint        string = storageAccount.properties.primaryEndpoints.dfs
output blobEndpoint       string = storageAccount.properties.primaryEndpoints.blob

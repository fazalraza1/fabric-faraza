targetScope = 'resourceGroup'

@description('Azure region for the Storage account and Key Vault.')
param location string = resourceGroup().location

@description('Short lowercase prefix used to name deployed resources.')
@minLength(3)
@maxLength(12)
param namePrefix string = 'usenergy'

@description('Environment label applied to resource names and tags.')
@allowed([
  'dev'
  'test'
  'demo'
  'prod'
])
param environment string = 'demo'

@secure()
@description('U.S. EIA Open Data API key. Stored as an Azure Key Vault secret.')
param eiaApiKey string

@secure()
@description('U.S. Census Data API key. Stored as an Azure Key Vault secret.')
param censusApiKey string

@description('Optional tags merged with the project tags.')
param tags object = {}

var safePrefix = take(replace(replace(toLower(namePrefix), '-', ''), '_', ''), 12)
var suffix = uniqueString(subscription().id, resourceGroup().id, safePrefix, environment)
var projectTags = union({
  application: 'fabric-app-usenergy'
  environment: environment
  dataClassification: 'public'
  managedBy: 'bicep'
}, tags)
var storageName = take('st${safePrefix}${suffix}', 24)
var keyVaultName = take('kv-${safePrefix}-${suffix}', 24)

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  tags: projectTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    isHnsEnabled: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource rawContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'raw'
  properties: {
    publicAccess: 'None'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: projectTags
  properties: {
    tenantId: subscription().tenantId
    enablePurgeProtection: true
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    publicNetworkAccess: 'Enabled'
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: 90
  }
}

resource eiaSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'eia-api-key'
  properties: {
    value: eiaApiKey
  }
}

resource censusSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'census-api-key'
  properties: {
    value: censusApiKey
  }
}

output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output rawContainerName string = rawContainer.name
output storageAccountName string = storage.name
output storageBlobEndpoint string = storage.properties.primaryEndpoints.blob

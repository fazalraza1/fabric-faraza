// ============================================================
// main.bicepparam — Parameter values for the demo environment
// Copy and edit this file for different environments
// ============================================================

using './main.bicep'

// Short suffix used in all resource names — keep to 4–6 chars
param envName = 'demo'

// Azure region — eastus2 has broadest Fabric capacity availability
param location = 'eastus2'

// Premium tier required for Unity Catalog and advanced governance features
param databricksTier = 'premium'

// F2 is the smallest Fabric capacity — sufficient for demo workloads
param fabricSkuName = 'F2'

// ⚠️ REQUIRED: Replace with the Azure AD Object ID of the demo presenter's account
// Run: az ad signed-in-user show --query id -o tsv
param fabricAdminObjectId = 'REPLACE_WITH_AAD_OBJECT_ID'

// ⚠️ REQUIRED: Replace with the UPN (email) of the demo presenter
param fabricAdminUpn = 'REPLACE_WITH_UPN@contoso.com'

param resourceTags = {
  environment: 'demo'
  project: 'fabric-databricks-better-together'
  owner: 'sales-engineering'
  'auto-delete': 'true'
}

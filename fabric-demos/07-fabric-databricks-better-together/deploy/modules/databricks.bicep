// ============================================================
// modules/databricks.bicep — Azure Databricks workspace
// Premium tier enables Unity Catalog, cluster policies, and
// fine-grained access control for the demo
// ============================================================

param workspaceName      string
param location           string
param pricingTier        string
param storageAccountName string
param tags               object

// Managed resource group name — Databricks creates this automatically for cluster VMs
var managedRgName = 'rg-${workspaceName}-managed'

// Deploy the Azure Databricks workspace
// Premium tier is recommended for the Unity Catalog and governance story
resource databricksWorkspace 'Microsoft.Databricks/workspaces@2024-05-01' = {
  name: workspaceName
  location: location
  tags: tags
  sku: {
    name: pricingTier
  }
  properties: {
    managedResourceGroupId: '${subscription().id}/resourceGroups/${managedRgName}'
    parameters: {
      // Enable ADLS Gen2 passthrough so Databricks clusters can access the storage account
      // This allows notebooks to read/write Delta tables without explicit credentials
      storageAccountName: {
        value: storageAccountName
      }
    }
  }
}

output workspaceUrl  string = 'https://${databricksWorkspace.properties.workspaceUrl}'
output workspaceId   string = databricksWorkspace.id
output workspaceName string = databricksWorkspace.name

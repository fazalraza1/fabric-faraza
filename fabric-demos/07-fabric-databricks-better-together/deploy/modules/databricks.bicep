// ============================================================
// modules/databricks.bicep — Azure Databricks workspace
// Premium tier enables Unity Catalog, cluster policies, and
// fine-grained access control for the demo
// ============================================================

param workspaceName string
param location      string
param pricingTier   string
param tags          object

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
    // No storageAccountName override — let Databricks auto-generate DBFS storage name.
    // ADLS Gen2 access is granted via Key Vault secrets at cluster/notebook level.
  }
}

output workspaceUrl  string = 'https://${databricksWorkspace.properties.workspaceUrl}'
output workspaceId   string = databricksWorkspace.id
output workspaceName string = databricksWorkspace.name

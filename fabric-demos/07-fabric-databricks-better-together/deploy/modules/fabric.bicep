// ============================================================
// modules/fabric.bicep — Microsoft Fabric Capacity
// Provisions a Fabric capacity so the demo workspace can
// run Direct Lake, Spark notebooks, and Power BI reports
// ============================================================

param capacityName string
param location     string
param skuName      string   // F2, F4, F8 etc.
param adminUpn     string   // UPN of the Fabric capacity admin
param tags         object

// Deploy Microsoft Fabric capacity
// The capacity admin (adminUpn) must be a licensed Fabric user in the tenant
resource fabricCapacity 'Microsoft.Fabric/capacities@2023-11-01' = {
  name: capacityName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: 'Fabric'
  }
  properties: {
    administration: {
      // Capacity admin — the demo presenter who will create Fabric workspaces
      members: [adminUpn]
    }
  }
}

output capacityName string = fabricCapacity.name
output capacityId   string = fabricCapacity.id
output capacityUrl  string = 'https://app.fabric.microsoft.com'

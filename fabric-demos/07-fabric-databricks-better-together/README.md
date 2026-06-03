# 🤝 Demo 07 — Microsoft Fabric + Azure Databricks: Better Together

**Complexity:** ⭐⭐⭐⭐ Expert  
**Audience:** Data Engineers, Architects, Sales Engineers, Technical Decision Makers  
**Run Time:** ~45 min  
**Prerequisite:** None — self-contained demo with its own dataset

---

## What This Demo Shows

The **"Better Together"** story: Microsoft Fabric and Azure Databricks are complementary platforms that together cover the full analytics lifecycle — from raw data engineering at scale to governed business intelligence and ML serving.

> **Core message:** You don't have to choose. Databricks brings world-class data engineering and ML. Fabric brings enterprise BI, governance, and the Microsoft 365 ecosystem. Together they eliminate the gaps that each platform has alone.

---

## The Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  AZURE DATABRICKS                                                   │
│                                                                     │
│  Auto Loader ──► Delta Live Tables ──► Unity Catalog               │
│  (Raw CSV)        (Transforms)          (Governance)               │
│                         │                                           │
│                         ▼                                           │
│                  ADLS Gen2 (Delta files)                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  Delta Sharing / OneLake Shortcut
                              │  (Zero-copy — no ETL, no duplication)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MICROSOFT FABRIC                                                   │
│                                                                     │
│  OneLake Shortcut ──► Lakehouse ──► Semantic Model ──► Power BI    │
│                           │                                         │
│                           ▼                                         │
│                    Fabric ML (MLflow scoring)                       │
│                           │                                         │
│                           ▼                                         │
│                    Gold Fraud Scores ──► Power BI Dashboard         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Microsoft Purview
              (Unified governance across both platforms)
```

---

## Demo Flow

| # | Notebook | Platform | What It Shows |
|---|----------|----------|---------------|
| 01 | `01_databricks_ingestion.ipynb` | Databricks (simulated) | Raw ingestion → Delta write → Unity Catalog registration |
| 02 | `02_delta_sharing_onelake.ipynb` | Fabric + Databricks | Zero-copy Delta Sharing via OneLake Shortcut |
| 03 | `03_fabric_semantic_model.ipynb` | Fabric | Gold KPI tables → Semantic Model → Power BI Direct Lake |
| 04 | `04_unified_ml_pipeline.ipynb` | Databricks + Fabric | MLflow training in Databricks → scoring and serving in Fabric |

---

## Key Better Together Talking Points

### 1. OneLake + Delta Sharing (Biggest Differentiator)
- Databricks writes Delta tables to ADLS Gen2
- Fabric reads them via **OneLake Shortcut — zero copy, zero ETL, zero extra cost**
- One storage layer, two platforms consuming simultaneously

### 2. No Forced Migration
- Customers already invested in Databricks keep everything they have
- Fabric adds value on top — BI, Teams integration, business user access
- Microsoft + Databricks partnership = native connectors, not workarounds

### 3. Complementary Strengths

| Capability | Databricks | Microsoft Fabric |
|------------|------------|-----------------|
| Heavy Spark ETL | ✅ Best in class | ✅ Capable |
| Delta Live Tables | ✅ Native | — |
| MLflow / AutoML | ✅ Native | ✅ Compatible |
| Power BI / Direct Lake | — | ✅ Best in class |
| Teams / Office 365 | — | ✅ Native |
| Business user self-service | Limited | ✅ Best in class |
| Semantic models | — | ✅ Native |
| OneLake unified storage | — | ✅ Native |
| Unity Catalog | ✅ Native | Via Purview integration |

### 4. Unified Governance
- Microsoft Purview spans both platforms
- Unity Catalog lineage flows into Purview data map
- Single audit trail for SOX, BCBS 239, and GDPR compliance

### 5. Cost Optimisation
- Heavy compute (Spark jobs, model training) on Databricks with optimised clusters
- Light reporting and BI on Fabric capacity — cheaper per query
- Avoid duplicating data with Delta Sharing

---

## Files

```
07-fabric-databricks-better-together/
├── README.md
├── DEMO_SCRIPT.md
├── data/
│   └── transactions_raw.csv       ← 20-row banking transaction dataset
└── notebooks/
    ├── 01_databricks_ingestion.ipynb
    ├── 02_delta_sharing_onelake.ipynb
    ├── 03_fabric_semantic_model.ipynb
    └── 04_unified_ml_pipeline.ipynb
```

---

## 🚀 One-Click Deployment (Recommended)

This demo uses a **Bicep one-click deploy** that provisions a real Azure Databricks workspace + ADLS Gen2 + Key Vault + Microsoft Fabric capacity in ~10 minutes.

### Prerequisites
- Azure CLI installed and logged in — see **[deploy/AZURE_LOGIN.md](./deploy/AZURE_LOGIN.md)** for step-by-step instructions
- Azure subscription with Contributor access
- PowerShell 7+

### Deploy
```powershell
# Navigate to the deploy folder first
cd 07-fabric-databricks-better-together\deploy

# Option A — Deploy everything including a new Fabric capacity (F2)
.\deploy.ps1 -SubscriptionId "<your-subscription-id>"

# Option B — Use an existing Fabric capacity (skips creating a new one)
.\deploy.ps1 -SubscriptionId "<your-subscription-id>" -ExistingFabricCapacityName "<capacity-name>"
```

**To find your existing Fabric capacity name:**
```powershell
az resource list --resource-type Microsoft.Fabric/capacities --output table
```

**All available parameters (optional):**
```powershell
.\deploy.ps1 `
  -SubscriptionId             "<your-subscription-id>" `
  -EnvName                    "demo" `
  -Location                   "centralus" `
  -FabricSkuName              "F2" `
  -ExistingFabricCapacityName "my-existing-capacity"
```

### What gets deployed
| Resource | SKU | Purpose |
|----------|-----|---------|
| Azure Databricks workspace | Premium | Data engineering, MLflow, Unity Catalog |
| ADLS Gen2 storage account | Standard LRS | Shared Delta Lake (bronze/silver/gold containers) |
| Azure Key Vault | Standard | Secrets and tokens |
| Microsoft Fabric capacity | F2 | Power BI Direct Lake, Fabric notebooks, Semantic Model |

### After deployment
Follow **[deploy/POST_DEPLOY.md](./deploy/POST_DEPLOY.md)** to finish configuring the OneLake Shortcut and importing notebooks.

### Teardown (after demo — deletes all resources)
```powershell
# Run from the deploy folder
.\teardown.ps1 -ResourceGroupName "rg-fabric-databricks-demo"
```
> The resource group name is printed at the end of `deploy.ps1` output. Default is `rg-fabric-databricks-<EnvName>`.

> **Estimated cost:** ~$3–8 USD for a 1-hour demo session. Always teardown after demos.

---

## Local / Simulation Mode

To run without deploying Azure Databricks (Fabric only, simulated):
1. Upload `data/transactions_raw.csv` to **Fabric Lakehouse → Files/**
2. Attach `BankingLakehouse` to each notebook
3. Run notebooks in order: 01 → 02 → 03 → 04

> Notebooks 01 and 04 simulate the Databricks side using PySpark in Fabric so the full flow runs end-to-end without a live Databricks workspace.

---

*Part of the [Microsoft Fabric Demos](../../README.md) repository*

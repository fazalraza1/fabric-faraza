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
| 01 | `01_databricks_ingestion.ipynb` | Azure Databricks | Raw ingestion → Delta write → Unity Catalog registration |
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
├── deploy/
│   ├── main.bicep
│   ├── deploy.ps1
│   └── teardown.ps1
└── notebooks/
    ├── 01_databricks_ingestion.ipynb
    ├── 02_delta_sharing_onelake.ipynb
    ├── 03_fabric_semantic_model.ipynb
    └── 04_unified_ml_pipeline.ipynb
```

---

## 🚀 One-Click Deployment (Recommended)

This demo uses a **Bicep one-click deploy** that provisions a real Azure Databricks workspace + ADLS Gen2 + Key Vault + Microsoft Fabric capacity in ~10 minutes, and automatically wires up Databricks-to-storage authentication (service principal + OAuth) so notebooks run against real data with no manual credential setup.

### Prerequisites — Azure CLI login

1. **Install Azure CLI** (if not already installed):
   ```powershell
   winget install Microsoft.AzureCLI
   ```
   Or download from https://aka.ms/installazurecliwindows. Verify with `az --version`.

2. **Log in to Azure:**
   ```powershell
   az login
   ```
   This opens a browser window. Sign in with the Microsoft account that has access to the target subscription.

   > **Corporate/Work account with MFA?** Use `az login --use-device-code`, then copy the code and enter it at https://microsoft.com/devicelogin.

3. **Find and set your subscription:**
   ```powershell
   az account list --output table
   az account set --subscription "<your-subscription-id>"
   az account show --output table
   ```

4. **Verify you have Contributor access:**
   ```powershell
   az role assignment list --assignee (az ad signed-in-user show --query id -o tsv) --output table
   ```
   You need at least **Contributor** on the subscription (or resource group) to deploy.

   | Login error | Fix |
   |-------------|-----|
   | `Please run 'az login'` | Run `az login` first |
   | `AADSTS50076: MFA required` | Use `az login --use-device-code` |
   | `Subscription not found` | Run `az account list` and use the exact subscription ID |
   | `AuthorizationFailed` | Ask your Azure admin to grant the Contributor role |
   | `az: command not found` | Install Azure CLI — see step 1 above |

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
| Azure Key Vault | Standard | Service principal secret used for Databricks OAuth to ADLS Gen2 |
| Microsoft Fabric capacity | F2 | Power BI Direct Lake, Fabric notebooks, Semantic Model |
| Azure AD app registration + service principal | — | Grants the Databricks cluster `Storage Blob Data Contributor` on the storage account via OAuth (client credentials) — no storage account keys are used |

`deploy.ps1` also uploads `data/transactions_raw.csv` to the ADLS Gen2 `bronze` container and configures the cluster's `spark_conf` so `01_databricks_ingestion.ipynb` can read/write ADLS Gen2 immediately after import — no manual IAM or storage-key configuration needed.

### Region selection
The deployment region comes from the `-Location` parameter in `deploy.ps1` and defaults to `centralus`. That same value is used when creating the resource group and is passed into the Bicep template, so every Azure resource lands in that region unless you override it.

---

## Post-Deployment Setup

### 1. Configure Databricks (5 min)

1. **Open the workspace** at the URL printed by `deploy.ps1` (e.g. `https://adb-banking-demo.azuredatabricks.net`).
2. **Import notebooks:** In Databricks, click **Workspace** → your username → **Import**, and import `01_databricks_ingestion.ipynb` from the `../notebooks/` folder. Attach it to the `demo-cluster-*` cluster created by the deploy script.
   > ⚠️ **Do not use Serverless compute for this notebook.** Databricks defaults newly imported notebooks to Serverless, which has no `spark_conf` and therefore none of the OAuth service-principal settings below — it falls back to (missing) account-key auth and fails with `AZURE_INVALID_CREDENTIALS_CONFIGURATION` / "Invalid configuration value detected for fs.azure.account.key" (`SQLSTATE: 42KDK`). Explicitly switch the compute selector (top-right of the notebook) to `demo-cluster-<EnvName>` before running.
3. **Storage account name:** `deploy.ps1` prints the storage account name and pre-populates it as the default value of the `storage_account_name` widget in Cell 1 of the notebook. If you redeploy under a different name, just update the widget value in the notebook UI — no code changes needed.
4. **Storage access is already configured:** `deploy.ps1` created a service principal, granted it `Storage Blob Data Contributor`, and set the cluster's OAuth `spark_conf`. If you ever see `SparkKeyProviderException` / `KeyProviderException` / `AZURE_INVALID_CREDENTIALS_CONFIGURATION`, first confirm the notebook is attached to `demo-cluster-*` (not Serverless — see above), then restart the cluster (spark_conf changes require a restart) or re-run `deploy.ps1`, which also re-enables `publicNetworkAccess` in case a tenant governance policy disabled it.

### 2. Configure Microsoft Fabric (5 min)

1. **Create a Fabric workspace:** go to https://app.fabric.microsoft.com → **+ New workspace** → name it `Banking Demo` → under **Advanced** → **License mode**, select the deployed Fabric capacity.
2. **Create a Lakehouse:** **+ New item** → **Lakehouse** → name it `BankingLakehouse`.
3. **Create the OneLake shortcut to ADLS Gen2** (the real zero-copy integration point):
   - In `BankingLakehouse` → **Files** → **New shortcut** → **Azure Data Lake Storage Gen2**
   - DFS endpoint: `https://<STORAGE_ACCOUNT>.dfs.core.windows.net` (from deploy.ps1 output)
   - Container: `silver`
   - Shortcut name: `silver`
   - **Connection credentials: select "Organizational account" (Azure AD)** — do **not** use "Account Key" or "SAS". This storage account has `allowSharedKeyAccess=false` (same tenant security-baseline policy noted in `deploy.ps1`), so account-key/SAS credentials fail with `AZURE_INVALID_CREDENTIALS_CONFIGURATION` / "Invalid configuration value detected for fs.azure.account.key". Your signed-in identity already has `Storage Blob Data Contributor` on the storage account from `deploy.ps1`, so Organizational account auth works immediately.

   > Fabric does not create a shortcut to the Databricks workspace itself — Databricks writes Delta files to ADLS Gen2, and Fabric reads those files through this shortcut.
4. **Import Fabric notebooks:** **+ New item** → **Notebook**, import `02_delta_sharing_onelake.ipynb` and `03_fabric_semantic_model.ipynb`, and attach `BankingLakehouse` to each (left panel → Lakehouses → Add).

### 3. Verify end-to-end (2 min)

Run this in `02_delta_sharing_onelake.ipynb` in Fabric:
```python
df = spark.read.format('delta').load('Files/silver/db_silver_transactions')
print(f'Records visible from Fabric via OneLake shortcut: {df.count()}')
```
If count > 0, the integration is working and you're ready to demo.

### 4. Demo day checklist

- [ ] Databricks cluster is running (click "Start" 5 min before demo if terminated)
- [ ] Fabric workspace `Banking Demo` is accessible
- [ ] OneLake shortcut `silver` shows data
- [ ] All 4 notebooks are open and connected (01 in Databricks; 02/03/04 in Fabric, attached to `BankingLakehouse`)
- [ ] `DEMO_SCRIPT.md` is open on your second screen
- [ ] Browser tabs open: Databricks workspace, Fabric workspace, Azure Portal (resource group)

### Execution model
Run the Databricks-side notebook in **Azure Databricks** and the Fabric-side notebooks in **Microsoft Fabric**:
1. `01_databricks_ingestion.ipynb` in Databricks
2. `02_delta_sharing_onelake.ipynb` in Fabric
3. `03_fabric_semantic_model.ipynb` in Fabric
4. `04_unified_ml_pipeline.ipynb` with training in Databricks and scoring in Fabric

### Teardown (after demo — deletes all resources)
```powershell
# Run from the deploy folder
.\teardown.ps1 -ResourceGroupName "rg-fabric-databricks-demo"
```
Then manually delete the Fabric workspace: **Fabric portal** → Workspace Settings → Delete workspace.

> The resource group name is printed at the end of `deploy.ps1` output. Default is `rg-fabric-databricks-<EnvName>`.

> **Estimated cost:** ~$3–8 USD for a 1-hour demo session (F2 capacity + Databricks cluster). Always teardown after demos.

---

*Part of the [Microsoft Fabric Demos](../../README.md) repository*

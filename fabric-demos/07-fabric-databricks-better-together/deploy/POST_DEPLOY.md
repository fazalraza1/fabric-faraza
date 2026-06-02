# Post-Deployment Steps

After `deploy.ps1` completes, follow these steps to finish setting up the demo environment.

---

## 1 — Configure Databricks (5 min)

### 1a. Open the Databricks workspace
Open the URL printed by `deploy.ps1` (e.g. `https://adb-banking-demo.azuredatabricks.net`).

### 1b. Import demo notebooks
1. In Databricks, click **Workspace** → your username → **Import**
2. Import each notebook from the `../notebooks/` folder:
   - `01_databricks_ingestion.ipynb`
   - `02_delta_sharing_onelake.ipynb` (run from Fabric side, not Databricks)
   - `04_unified_ml_pipeline.ipynb` (train step runs in Databricks)
3. Attach each notebook to the `demo-cluster-*` cluster created by the deploy script

### 1c. Set the ADLS Gen2 path
In `01_databricks_ingestion.ipynb`, update the storage path (printed by deploy.ps1):
```python
# Replace this line in Cell 2:
raw_txn = spark.read.csv(
    'abfss://bronze@<STORAGE_ACCOUNT>.dfs.core.windows.net/transactions_raw.csv',
    header=True, inferSchema=True
)
```

### 1d. Grant Databricks access to ADLS Gen2
```bash
# In Azure Portal → Storage Account → IAM → Add role assignment
Role: Storage Blob Data Contributor
Assign to: The Databricks workspace managed identity
```

---

## 2 — Configure Microsoft Fabric (5 min)

### 2a. Create a Fabric workspace
1. Go to **https://app.fabric.microsoft.com**
2. Click **+ New workspace** → name it `Banking Demo`
3. Under **Advanced** → **License mode** → select the Fabric capacity deployed (`fabric-banking-demo`)

### 2b. Create a Lakehouse
1. In the workspace, click **+ New item** → **Lakehouse**
2. Name it `BankingLakehouse`

### 2c. Create OneLake Shortcut to ADLS Gen2
1. In `BankingLakehouse` → **Files** → **New shortcut**
2. Select **Azure Data Lake Storage Gen2**
3. Enter the DFS endpoint from deploy.ps1 output: `https://<STORAGE_ACCOUNT>.dfs.core.windows.net`
4. Container: `silver`
5. Name the shortcut: `databricks_silver`

> This is the **zero-copy integration point** — the most important step in the demo.

### 2d. Import Fabric notebooks
1. In the workspace, click **+ New item** → **Notebook**
2. Import: `02_delta_sharing_onelake.ipynb`, `03_fabric_semantic_model.ipynb`
3. Attach `BankingLakehouse` to each notebook (left panel → Lakehouses → Add)

---

## 3 — Verify End-to-End (2 min)

Run this quick check in Fabric notebook:
```python
# Should show the Delta table written by the Databricks notebook
df = spark.read.format('delta').load('Files/databricks_silver/')
print(f'Records visible from Fabric via OneLake shortcut: {df.count()}')
```

If count > 0 — the integration is working and you're ready to demo.

---

## 4 — Demo Day Checklist

- [ ] Databricks cluster is running (not terminated — click "Start" 5 min before demo)
- [ ] Fabric workspace `Banking Demo` is accessible
- [ ] OneLake shortcut `databricks_silver` shows data
- [ ] All 4 notebooks are open and connected to Lakehouse
- [ ] `DEMO_SCRIPT.md` is open on your second screen
- [ ] Browser tabs open: Databricks workspace, Fabric workspace, Azure Portal (resource group)

---

## 5 — Teardown After Demo

```powershell
cd deploy
.\teardown.ps1 -ResourceGroupName "rg-fabric-databricks-demo"
```

Then manually delete the Fabric workspace:
**Fabric portal** → Workspace Settings → Delete workspace

**Estimated cost of a 1-hour demo run:** ~$3–8 USD (F2 capacity + Databricks cluster)

# 🤖 Setup Script — Automate Fabric Demo Setup

This script automates uploading CSV files and importing notebooks into Microsoft Fabric — no manual clicking required.

---

## What the Script Does

| Step | Action |
|------|--------|
| 1 | Authenticates using your Azure CLI login (`az login`) — no passwords in code |
| 2 | Uploads CSV data files to your Lakehouse `Files/` section via OneLake API |
| 3 | Imports all `.ipynb` notebooks into your Fabric workspace via Fabric REST API |

---

## Prerequisites

### 1. Install Azure CLI
Download from: [https://aka.ms/installazurecliwindows](https://aka.ms/installazurecliwindows)

Verify install:
```powershell
az --version
```

### 2. Log in to Azure
```powershell
az login
```
A browser window will open — sign in with the same account you use for Fabric.

### 3. Install Python packages
```powershell
pip install azure-identity azure-storage-file-datalake requests
```

---

## How to Find Your Workspace ID and Lakehouse ID

You need these two IDs to tell the script where to upload files.

**Workspace ID:**
1. Open [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Open your `FabricBankingDemos` workspace
3. Look at the browser URL: `.../groups/{WORKSPACE_ID}/...`
4. Copy the GUID between `/groups/` and the next `/`

**Lakehouse ID:**
1. Open `BankingLakehouse` inside your workspace
2. Look at the browser URL: `.../lakehouses/{LAKEHOUSE_ID}`
3. Copy the GUID after `/lakehouses/`

---

## Run the Script

### Option A: Enter IDs at runtime (easiest)
```powershell
cd C:\path\to\fabric-faraza\shared\setup-scripts
python setup_fabric_demo.py
```
The script will prompt you for Workspace ID and Lakehouse ID.

### Option B: Pre-fill IDs in the script (for repeated use)
Open `setup_fabric_demo.py` and fill in lines 28-29:
```python
WORKSPACE_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
LAKEHOUSE_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Then run:
```powershell
python setup_fabric_demo.py
```

---

## What to Expect

```
============================================================
  Microsoft Fabric Banking Demos — Setup Script
============================================================

This script will:
  1. Upload CSV data files to your Lakehouse
  2. Import notebooks into your Fabric workspace

Enter your Workspace ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Enter your Lakehouse ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Which demos do you want to set up?
  [1] 01 — Lakehouse Fundamentals
  [2] 02 — Medallion Architecture
  [3] 03 — AI-Powered Fraud Defense
  [4] 04 — Credit Risk Scoring
  [A] All demos

Enter choice (e.g. 1, 2, A): A

🔐 Authenticating with Azure CLI...
✅ Authenticated via Azure CLI

📁 Setting up: 01-lakehouse-fundamentals
  ✅ Uploaded CSV: sample_accounts.csv
  ✅ Imported notebook: 01_load_data

📁 Setting up: 02-medallion-architecture
  ✅ Uploaded CSV: loan_transactions.csv
  ✅ Imported notebook: 01_bronze_ingest
  ...

============================================================
  ✅ Setup complete!
     CSV files uploaded: 4
     Notebooks imported: 14
============================================================
```

---

## After Running the Script

The script does **not** auto-attach the Lakehouse to notebooks (Fabric API limitation). Do this once per notebook:

1. Open the notebook in Fabric
2. In the **left panel**, click **Add Lakehouse**
3. Select **Existing Lakehouse** → choose `BankingLakehouse`
4. Click **Add**

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `az: command not found` | Install Azure CLI from [aka.ms/installazurecliwindows](https://aka.ms/installazurecliwindows) |
| `Authentication failed` | Run `az login` and sign in with your Fabric account |
| `ModuleNotFoundError` | Run `pip install azure-identity azure-storage-file-datalake requests` |
| `403 Forbidden` on upload | Your account needs **Contributor** or **Admin** role on the Fabric workspace |
| `404 Not Found` on notebook import | Check your Workspace ID is correct |
| Notebook already exists (409) | Script skips it automatically — no action needed |

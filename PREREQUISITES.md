# ✅ Prerequisites — Setup Guide

Before running any demo, you need **3 things**:
1. An **Azure Subscription** (with the right permissions)
2. A **Microsoft Fabric Capacity**
3. A **Microsoft Fabric Workspace**

This guide walks you through checking if you already have them — and how to create them if you don't.

> 📖 **Official Microsoft Docs:** [Microsoft Fabric prerequisites & licenses](https://learn.microsoft.com/en-us/fabric/enterprise/licenses)

---

## 🔍 Quick Check — Do You Already Have These?

### Do you have an Azure Subscription?
- Go to 👉 [portal.azure.com](https://portal.azure.com)
- If you can log in and see a dashboard → ✅ **Yes, you have Azure**
- If you see "No subscriptions found" → ❌ **You need to create one** (see Section 1 below)

### Do you have Microsoft Fabric Capacity?
- Go to 👉 [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
- If you can create workspaces and see Fabric items (Lakehouse, Notebook, etc.) → ✅ **You have Fabric Capacity**
- If you see "Upgrade to Premium" or can't create Fabric items → ❌ **You need Fabric Capacity** (see Section 2 below)

### Do you have a Fabric Workspace?
- In [app.fabric.microsoft.com](https://app.fabric.microsoft.com), click **Workspaces** in the left panel
- If you see a workspace with Fabric items enabled → ✅ **You're ready**
- If not → ❌ **Create one** (see Section 3 below)

---

## SECTION 1 — Azure Subscription & Required Permissions

### What permissions do you need?

To create a Fabric Capacity in Azure, you need **one of these roles** on your Azure Subscription:

| Role | Can Create Fabric Capacity? | Notes |
|------|-----------------------------|-------|
| **Owner** | ✅ Yes | Full control — recommended |
| **Contributor** | ✅ Yes | Can create resources, but not manage access |
| **Reader** | ❌ No | View only — cannot create resources |
| **No role assigned** | ❌ No | Contact your Azure admin |

> 📖 **Docs:** [Azure built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)

#### How to check your current role:
1. Go to 👉 [portal.azure.com](https://portal.azure.com)
2. Search for **Subscriptions** in the top search bar
3. Click your subscription name
4. In the left menu, click **Access control (IAM)**
5. Click **View my access**
6. Your role(s) will be listed — you need **Owner** or **Contributor**

> 💡 **At a company?** If you only have **Reader** role, ask your Azure admin to assign you **Contributor** on the subscription or on a specific Resource Group. They can follow: [Assign Azure roles via portal](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal)

---

### Option A: Free Trial (Recommended for new users)
> 💰 **Cost: Free** — $200 Azure credits for 30 days

1. Go to 👉 [azure.microsoft.com/free](https://azure.microsoft.com/free)
2. Click **Start free**
3. Sign in with your Microsoft account (or create one)
4. Fill in your details and add a credit card (not charged during trial)
5. Click **Sign up** — you'll get $200 in free credits
6. You are automatically assigned **Owner** role on the new subscription

### Option B: Pay-As-You-Go
1. Go to 👉 [portal.azure.com](https://portal.azure.com)
2. Search for **Subscriptions** in the top search bar
3. Click **+ Add**
4. Select **Pay-As-You-Go** and follow the prompts
5. You are automatically assigned **Owner** role on the new subscription

### Option C: You work at a company
- Ask your **IT department** or **Azure admin** to:
  1. Add you to an existing subscription with **Contributor** role, **OR**
  2. Create a new Resource Group (e.g. `FabricDemos-RG`) and give you **Contributor** on that group
- Share this link with your admin: [Assign Azure RBAC roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal)

> ✅ **How to verify:** Go to [portal.azure.com](https://portal.azure.com) → search **Subscriptions** → you should see at least one subscription listed

---

## SECTION 2 — Microsoft Fabric Capacity

Fabric Capacity is what powers Microsoft Fabric. Without it, you can't create Lakehouses, run notebooks, or use Fabric features.

> 📖 **Docs:** [Buy a Microsoft Fabric subscription](https://learn.microsoft.com/en-us/fabric/enterprise/buy-subscription)
> 📖 **Docs:** [Fabric capacity SKUs explained](https://learn.microsoft.com/en-us/fabric/enterprise/licenses#capacity-license)

### Understanding Fabric SKUs

| SKU | CUs (Capacity Units) | Best For | Approx. Cost/hr |
|-----|---------------------|----------|-----------------|
| **F2** | 2 CUs | Demos, learning, dev/test | ~$0.36/hr |
| **F4** | 4 CUs | Small team projects | ~$0.72/hr |
| **F8** | 8 CUs | Small production workloads | ~$1.44/hr |
| **F64** | 64 CUs | Enterprise production | ~$11.52/hr |
| **Trial** | 64 CUs equivalent | Free 60-day trial | Free |

> 💡 **All demos in this repo run on F2.** Pause capacity when not in use to save cost.

---

### Option A: Microsoft Fabric Free Trial (Recommended)
> 💰 **Cost: Free** — 60-day trial, no credit card needed

1. Go to 👉 [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Sign in with your Microsoft/work account
3. You'll be prompted to **Start a Fabric trial** — click it
4. Trial activates immediately (60 days, F64 capacity equivalent)

> 💡 This is the easiest option — no Azure subscription needed for the trial!

> 📖 **Docs:** [Start a Fabric trial](https://learn.microsoft.com/en-us/fabric/get-started/fabric-trial)

---

### Option B: Purchase Fabric Capacity in Azure (Step-by-Step)
> 💰 **Cost:** Starts at ~$0.36/hour for F2 SKU (can pause when not in use)

**Before you start:** You need **Owner** or **Contributor** role on your Azure Subscription (see Section 1).

1. Go to 👉 [portal.azure.com](https://portal.azure.com)
2. In the top search bar, type **Microsoft Fabric** and select it
3. Click **+ Create**
4. Fill in the **Basics** tab:

   | Field | What to enter |
   |-------|--------------|
   | **Subscription** | Select your Azure subscription |
   | **Resource Group** | Click *Create new* → name it `FabricDemos-RG` |
   | **Capacity name** | `fabricdemoscapacity` *(lowercase, no spaces, globally unique)* |
   | **Region** | Choose the region closest to you (e.g., `East US`) |
   | **Size** | Select **F2** (sufficient for all demos) |
   | **Fabric capacity administrator** | Enter your Microsoft/work email |

5. Click **Review + Create**
6. Review the summary — confirm size is F2 and cost looks correct
7. Click **Create**
8. Wait ~2 minutes for deployment to complete
9. Click **Go to resource** when deployment finishes

> ⚠️ **Pause when not in use:** In Azure Portal → your Fabric resource → click **Pause** to stop billing. Resume before running demos.

> 📖 **Docs:** [Create a Fabric capacity in Azure Portal](https://learn.microsoft.com/en-us/fabric/enterprise/buy-subscription#create-a-capacity-in-the-azure-portal)
> 📖 **Docs:** [Pause and resume Fabric capacity](https://learn.microsoft.com/en-us/fabric/enterprise/pause-resume)

---

### Option C: Microsoft 365 / Power BI Premium (If your org has it)
- If your organization has **Power BI Premium Per User (PPU)** or **Microsoft 365 E5**, you may already have Fabric access
- Ask your IT admin: *"Do we have Microsoft Fabric capacity enabled in our tenant?"*
- They can check in: [Microsoft 365 Admin Center](https://admin.microsoft.com) → **Billing** → **Your products**

> 📖 **Docs:** [Fabric licenses overview](https://learn.microsoft.com/en-us/fabric/enterprise/licenses)

> ✅ **How to verify:** Go to [app.fabric.microsoft.com](https://app.fabric.microsoft.com) → try to create a Lakehouse. If it works → you have capacity!

---

## SECTION 3 — Microsoft Fabric Workspace

A Workspace is your working area inside Fabric — like a project folder. Each workspace is assigned to a Fabric Capacity.

> 📖 **Docs:** [Create a workspace in Fabric](https://learn.microsoft.com/en-us/fabric/get-started/create-workspaces)

### Workspace Roles (Permissions)

When you create a workspace, you are the **Admin**. You can invite others:

| Role | What they can do |
|------|-----------------|
| **Admin** | Full control: manage settings, add/remove members, delete workspace |
| **Member** | Create/edit/delete content, share items |
| **Contributor** | Create/edit content, cannot delete or share |
| **Viewer** | Read-only access to content |

> 📖 **Docs:** [Workspace roles in Fabric](https://learn.microsoft.com/en-us/fabric/get-started/roles-workspaces)

### Create a Fabric Workspace (Step-by-Step)

1. Go to 👉 [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Click **Workspaces** in the left navigation panel
3. Click **+ New workspace**
4. Fill in:
   - **Name:** `FabricBankingDemos`
   - **Description:** `Microsoft Fabric Banking Demo workspace`
5. Expand **Advanced** settings:
   - Under **License mode**, select **Fabric capacity** (or **Trial** if using free trial)
   - Select your capacity from the dropdown (e.g., `fabricdemoscapacity`)
6. Click **Apply**

> ✅ Your workspace is ready when you see it listed under Workspaces with a ⚡ diamond icon

### Add Team Members to Your Workspace (Optional)

1. Open your `FabricBankingDemos` workspace
2. Click the **⚙️ Workspace settings** button (top right)
3. Click **Manage access**
4. Click **+ Add people or groups**
5. Enter the person's email and select their role (Contributor for demo helpers, Viewer for audience)
6. Click **Add**

> 📖 **Docs:** [Share and manage workspace access](https://learn.microsoft.com/en-us/fabric/get-started/give-access-workspaces)

---

## SECTION 4 — Lakehouse Setup (Required for All Demos)

A Lakehouse is the data storage layer used by all demos. It combines a data lake (Files) with a SQL analytics engine (Tables).

> 📖 **Docs:** [Create a Lakehouse in Fabric](https://learn.microsoft.com/en-us/fabric/data-engineering/create-lakehouse)

1. Open your `FabricBankingDemos` workspace
2. Click **+ New item**
3. Search for and select **Lakehouse**
4. Name it: `BankingLakehouse`
5. Click **Create**

> ✅ You'll see the Lakehouse open with **Files** and **Tables** sections on the left

---

## SECTION 5 — Import Notebooks into Fabric

Each demo folder contains `.ipynb` notebook files. You need to import them into your Fabric workspace before running the demo.

> 📖 **Docs:** [Import a notebook in Fabric](https://learn.microsoft.com/en-us/fabric/data-engineering/how-to-use-notebook#import-existing-notebooks)

### Import a Single Notebook

1. Open your **FabricBankingDemos** workspace in 👉 [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Click **Import** in the top toolbar of the workspace
3. Select **Notebook**
4. Select **From this computer**
5. Browse to the `.ipynb` file (e.g. `fabric-demos/01-lakehouse-fundamentals/notebooks/01_load_data.ipynb`)
6. Click **Open** — the notebook appears in your workspace

### Import All Notebooks at Once (Recommended)

You can select **multiple `.ipynb` files** in step 5 to import them all in one go:

1. In your workspace, click **Import → Notebook → From this computer**
2. Navigate to the demo's `notebooks/` folder
3. Press `Ctrl+A` (or manually select all `.ipynb` files)
4. Click **Open** — all notebooks import simultaneously

> 💡 **Tip:** Import all notebooks for a demo before starting — you won't need to pause mid-demo.

### Attach the Lakehouse to Each Notebook

After importing, each notebook must be connected to `BankingLakehouse` or the `spark.table()` calls will fail:

1. Open the imported notebook in Fabric
2. In the **left panel**, click **Add Lakehouse**
3. Select **Existing Lakehouse**
4. Choose `BankingLakehouse` → click **Add**
5. Confirm the Lakehouse appears in the left panel with **Files** and **Tables** visible

> ⚠️ **Do this for every notebook** — the Lakehouse attachment is per-notebook, not per-workspace.

### Upload Data Files to the Lakehouse

Some notebooks read CSV files from `Files/` in the Lakehouse. Upload them once per demo:

1. In your workspace, open **BankingLakehouse**
2. In the **Files** section (left panel), click the **...** menu → **Upload** → **Upload files**
3. Browse to the demo's `data/` folder and select the `.csv` file(s)
4. Click **Upload**

> ✅ Once uploaded, the file is accessible in notebooks as `Files/filename.csv`

---

## SECTION 6 — Upload CSV Data Files to the Lakehouse

Each demo uses sample CSV data files stored in the `data/` folder of this repo. These must be uploaded to the Lakehouse **Files** section before running any notebook.

> 📖 **Docs:** [Upload files to a Fabric Lakehouse](https://learn.microsoft.com/en-us/fabric/data-engineering/lakehouse-files#upload-files-or-folders)

### Which CSV Files Are Needed?

| Demo | CSV File | Location in Repo | Rows |
|------|----------|-----------------|------|
| **01 — Lakehouse Fundamentals** | `sample_accounts.csv` | `fabric-demos/01-lakehouse-fundamentals/data/` | 500 |
| **02 — Medallion Architecture** | `loan_transactions.csv` | `fabric-demos/02-medallion-architecture/data/` | 500 |
| **03 — AI-Powered Fraud Defense** | `fraud_transactions.csv` | `fabric-demos/03-ai-powered-fraud-defense/data/` | 500 |
| **04 — Credit Risk Scoring** | `credit_risk_features.csv` | `fabric-demos/04-credit-risk-scoring/data/` | 500 |

### Step 1 — Download CSV Files from GitHub

**Option A: Download individual files**
1. Go to 👉 [github.com/fazalraza1/fabric-faraza](https://github.com/fazalraza1/fabric-faraza)
2. Navigate to the demo's `data/` folder (e.g. `fabric-demos/01-lakehouse-fundamentals/data/`)
3. Click the CSV file name
4. Click the **Download raw file** button (⬇️ icon, top right)
5. Save to your local machine

**Option B: Download the entire repo as a ZIP (Recommended — get all files at once)**
1. Go to 👉 [github.com/fazalraza1/fabric-faraza](https://github.com/fazalraza1/fabric-faraza)
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP to a folder on your machine (e.g. `C:\FabricDemos\`)
4. All CSV files are now available in their respective `data/` folders

### Step 2 — Upload CSV Files to the Lakehouse

1. Open your **FabricBankingDemos** workspace
2. Click **BankingLakehouse** to open it
3. In the **Explorer** panel on the left, find the **Files** section
4. Click the **...** (ellipsis) next to **Files** → **Upload** → **Upload files**
5. Browse to the CSV file on your machine and select it
6. Click **Upload**
7. Confirm the file appears under **Files** in the left panel

> 💡 **Tip:** You can upload multiple CSV files at once by selecting them all in step 6 (`Ctrl+click` each file).

> ✅ Once uploaded, notebooks can read the file using:
> ```python
> df = spark.read.option('header','true').csv('Files/sample_accounts.csv')
> ```

### Step 3 — Verify the Upload

After uploading, verify the file is accessible:

1. In the Lakehouse, click the **...** next to the CSV file under **Files**
2. Select **Preview** — you should see the first few rows of data
3. If Preview shows data → ✅ ready to run the notebook

> ⚠️ **Common issue:** If a notebook says `FileNotFoundError` or `Path does not exist`, the CSV was not uploaded or the filename doesn't match. Check the exact filename (case-sensitive).

---

## 📋 Final Checklist Before Running Any Demo

- [ ] ✅ Azure Subscription exists (Owner or Contributor role confirmed)
- [ ] ✅ Microsoft Fabric Capacity is active (trial or purchased)
- [ ] ✅ Fabric Workspace `FabricBankingDemos` created and linked to capacity
- [ ] ✅ Lakehouse `BankingLakehouse` created inside the workspace
- [ ] ✅ Notebooks imported: **Workspace → Import → Notebook → From this computer**
- [ ] ✅ Lakehouse attached to each notebook (left panel → Add Lakehouse → BankingLakehouse)
- [ ] ✅ CSV data files uploaded to Lakehouse **Files** section
- [ ] ✅ Using Microsoft Edge or Google Chrome (latest version)

---

## ⏱️ Estimated Setup Time

| Scenario | Time Needed |
|----------|------------|
| You have everything already | 10 min (import notebooks + upload CSVs) |
| Starting Fabric free trial | 20 min |
| Creating Azure subscription + Fabric capacity | 45-60 min |

---

## 📚 Reference Documentation

| Topic | Link |
|-------|------|
| Microsoft Fabric documentation home | [learn.microsoft.com/fabric](https://learn.microsoft.com/en-us/fabric/) |
| Fabric licenses & SKUs explained | [Fabric licenses overview](https://learn.microsoft.com/en-us/fabric/enterprise/licenses) |
| Start a Fabric free trial | [Start Fabric trial](https://learn.microsoft.com/en-us/fabric/get-started/fabric-trial) |
| Buy Fabric capacity in Azure | [Buy a Fabric subscription](https://learn.microsoft.com/en-us/fabric/enterprise/buy-subscription) |
| Pause & resume Fabric capacity | [Pause and resume capacity](https://learn.microsoft.com/en-us/fabric/enterprise/pause-resume) |
| Create a Fabric workspace | [Create workspaces](https://learn.microsoft.com/en-us/fabric/get-started/create-workspaces) |
| Workspace roles & permissions | [Roles in workspaces](https://learn.microsoft.com/en-us/fabric/get-started/roles-workspaces) |
| Azure RBAC roles reference | [Azure built-in roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles) |
| Assign Azure roles (portal) | [Assign Azure RBAC roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal) |
| Create a Lakehouse | [Create a Lakehouse](https://learn.microsoft.com/en-us/fabric/data-engineering/create-lakehouse) |
| Import notebooks into Fabric | [Import existing notebooks](https://learn.microsoft.com/en-us/fabric/data-engineering/how-to-use-notebook#import-existing-notebooks) |
| Fabric pricing calculator | [Fabric pricing](https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/) |
| Fabric community forum | [community.fabric.microsoft.com](https://community.fabric.microsoft.com) |
| Azure free account | [azure.microsoft.com/free](https://azure.microsoft.com/free) |

---

## 🆘 Need Help?

- **Fabric Trial issues:** [Fabric trial FAQ](https://learn.microsoft.com/en-us/fabric/get-started/fabric-trial#known-issues-and-limitations)
- **Azure permissions issues:** Ask your Azure admin to check your role via *portal.azure.com → Subscriptions → Access control (IAM)*
- **Workspace not showing Fabric items:** Make sure the workspace License mode is set to **Fabric capacity** (not Pro or Premium Per User)
- **Community support:** [community.fabric.microsoft.com](https://community.fabric.microsoft.com)

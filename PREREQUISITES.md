# ✅ Prerequisites — Setup Guide

Before running any demo, you need **3 things**:
1. An **Azure Subscription**
2. A **Microsoft Fabric Capacity**
3. A **Microsoft Fabric Workspace**

This guide walks you through checking if you already have them — and how to create them if you don't.

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

## SECTION 1 — Azure Subscription

### Option A: Free Trial (Recommended for new users)
> 💰 **Cost: Free** — $200 Azure credits for 30 days

1. Go to 👉 [azure.microsoft.com/free](https://azure.microsoft.com/free)
2. Click **Start free**
3. Sign in with your Microsoft account (or create one)
4. Fill in your details and add a credit card (not charged during trial)
5. Click **Sign up** — you'll get $200 in free credits

### Option B: Pay-As-You-Go
1. Go to 👉 [portal.azure.com](https://portal.azure.com)
2. Search for **Subscriptions** in the top search bar
3. Click **+ Add**
4. Select **Pay-As-You-Go** and follow the prompts

### Option C: You work at a company
- Ask your **IT department** or **Azure admin** to add you to an existing subscription
- You need at least **Contributor** role on the subscription

> ✅ **How to verify:** Go to [portal.azure.com](https://portal.azure.com) → search **Subscriptions** → you should see at least one subscription listed

---

## SECTION 2 — Microsoft Fabric Capacity

Fabric Capacity is what powers Microsoft Fabric. Without it, you can't create Lakehouses, run notebooks, or use Fabric features.

### Option A: Microsoft Fabric Free Trial (Recommended)
> 💰 **Cost: Free** — 60-day trial, no credit card needed

1. Go to 👉 [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Sign in with your Microsoft/work account
3. You'll be prompted to **Start a Fabric trial** — click it
4. Trial activates immediately (60 days, F64 capacity equivalent)

> 💡 This is the easiest option — no Azure subscription needed for the trial!

### Option B: Purchase Fabric Capacity in Azure
> 💰 **Cost:** Starts at ~$0.36/hour for F2 SKU (can pause when not in use)

1. Go to 👉 [portal.azure.com](https://portal.azure.com)
2. In the top search bar, type **Microsoft Fabric**
3. Click **Microsoft Fabric** → **+ Create**
4. Fill in:
   - **Subscription:** Select your Azure subscription
   - **Resource Group:** Create new → name it `FabricDemos-RG`
   - **Capacity name:** `fabricdemoscapacity` (lowercase, no spaces)
   - **Region:** Choose the region closest to you (e.g., East US)
   - **Size:** Select **F2** (smallest, cheapest — good for demos)
   - **Fabric capacity administrator:** Enter your email
5. Click **Review + Create** → **Create**
6. Wait ~2 minutes for deployment to complete

> ⚠️ **Important:** F2 is sufficient for all demos in this repo. Pause the capacity in Azure when not in use to avoid charges.

### Option C: Microsoft 365 / Power BI Premium (If your org has it)
- If your organization has **Power BI Premium Per User (PPU)** or **Microsoft 365 E5**, you may already have Fabric access
- Ask your IT admin: *"Do we have Microsoft Fabric capacity enabled?"*

> ✅ **How to verify:** Go to [app.fabric.microsoft.com](https://app.fabric.microsoft.com) → try to create a Lakehouse. If it works → you have capacity!

---

## SECTION 3 — Microsoft Fabric Workspace

A Workspace is your working area inside Fabric — like a project folder.

### Create a Fabric Workspace
1. Go to 👉 [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Click **Workspaces** in the left navigation panel
3. Click **+ New workspace**
4. Fill in:
   - **Name:** `FabricBankingDemos`
   - **Description:** `Microsoft Fabric Banking Demo workspace`
5. Expand **Advanced** settings:
   - Under **License mode**, select **Fabric capacity** (or **Trial** if using free trial)
   - Select your capacity from the dropdown
6. Click **Apply**

> ✅ Your workspace is ready when you see it listed under Workspaces with a ⚡ diamond icon

---

## SECTION 4 — Lakehouse Setup (Required for All Demos)

A Lakehouse is the data storage layer used by all 3 demos.

1. Open your `FabricBankingDemos` workspace
2. Click **+ New item**
3. Search for and select **Lakehouse**
4. Name it: `BankingLakehouse`
5. Click **Create**

> ✅ You'll see the Lakehouse open with **Files** and **Tables** sections on the left

---

## 📋 Final Checklist Before Running Any Demo

- [ ] ✅ Azure Subscription exists (or using Fabric free trial)
- [ ] ✅ Microsoft Fabric Capacity is active (trial or purchased)
- [ ] ✅ Fabric Workspace `FabricBankingDemos` created
- [ ] ✅ Lakehouse `BankingLakehouse` created inside the workspace
- [ ] ✅ Using Microsoft Edge or Google Chrome (latest version)

---

## ⏱️ Estimated Setup Time

| Scenario | Time Needed |
|----------|------------|
| You have everything already | 5 min (just create Lakehouse) |
| Starting Fabric free trial | 15 min |
| Creating Azure subscription + Fabric capacity | 30-45 min |

---

## 🆘 Need Help?

| Resource | Link |
|----------|------|
| Microsoft Fabric Documentation | [learn.microsoft.com/fabric](https://learn.microsoft.com/fabric) |
| Start Fabric Free Trial | [app.fabric.microsoft.com](https://app.fabric.microsoft.com) |
| Azure Free Account | [azure.microsoft.com/free](https://azure.microsoft.com/free) |
| Fabric Community Forum | [community.fabric.microsoft.com](https://community.fabric.microsoft.com) |
| Fabric Pricing | [azure.microsoft.com/pricing/details/microsoft-fabric](https://azure.microsoft.com/pricing/details/microsoft-fabric) |

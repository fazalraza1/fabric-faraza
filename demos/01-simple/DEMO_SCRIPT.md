# 🎤 Demo Script — Demo 01: Load Bank Data into Fabric Lakehouse

**Presenter Time:** ~15 minutes  
**Audience:** Business stakeholders, non-technical

---

## 🌟 FABRIC INTRODUCTION (2 min)

> *"Before we dive in, let me take 60 seconds to explain what Microsoft Fabric actually is — because it's a game changer."*

> *"Most organizations today have their data scattered everywhere. Some in Excel, some in databases, some in cloud storage, some in old mainframes. Different teams use different tools. Nothing talks to each other. Getting a simple report can take days."*

> *"Microsoft Fabric changes that. It's a single, unified platform — built on Microsoft Azure — that brings together data storage, data engineering, data science, and business intelligence all in one place. One platform. One security model. One place to manage everything."*

> *"Think of it like this: if your data was a city, Fabric is the infrastructure — the roads, power grid, and communication network — that makes everything work together seamlessly."*

**[Point to screen showing Fabric home page]**

> *"What you're looking at right now is the Microsoft Fabric portal. From here, a data engineer, a data analyst, and a business user can all do their work — without switching tools or waiting for someone else."*

> *"Today's demo is the simplest starting point: we're going to take a spreadsheet of 500 bank customer accounts and make it available to the entire organization in minutes."*

---

## 🟢 OPENING (1 min)

> *"Here's the scenario: your operations team maintains a CSV file of customer accounts. Right now it lives on someone's laptop. Only one person can use it at a time. There's no version control. No audit trail. No way to query it."*

> *"By the end of this demo, that same file will be in Fabric's Lakehouse — queryable by hundreds of users simultaneously, secured, versioned, and ready to connect to Power BI."*

---

## 📤 STEP 1 — Ingest the Data (3 min)

**Action:** Open `BankingLakehouse` in Microsoft Fabric

> *"This is our Lakehouse. A Lakehouse in Fabric is a combination of a Data Lake and a Data Warehouse — you get the flexibility of a lake with the query performance of a warehouse. Best of both worlds."*

**[Point to the Files and Tables sections in the left panel]**

> *"You'll notice two sections here: Files and Tables. Files is where raw data lands — like a landing zone. Tables is where structured, queryable data lives."*

> *"Now, here's something important for the business audience: Fabric gives you multiple ways to get data in. Let me walk you through the options:"*

> *"**Option 1 — Manual Upload** (what we're doing today): Simply drag and drop a file. Great for one-time loads or demos."*

> *"**Option 2 — Data Factory Pipelines**: Automated pipelines that pull data from hundreds of sources — Oracle databases, SAP systems, Salesforce, SharePoint, REST APIs — on a schedule. No human intervention needed."*

> *"**Option 3 — Eventstream**: For real-time data — like transactions happening right now. Data flows in continuously, millisecond by millisecond."*

> *"**Option 4 — Shortcuts**: Connect to data that already lives in Azure Data Lake, AWS S3, or Google Cloud Storage — without moving it. Fabric reads it in place."*

> *"**Option 5 — Dataflows Gen2**: A no-code, drag-and-drop interface for non-technical users to pull and transform data — like Power Query in Excel, but enterprise-grade."*

**Action:** Click **Files** → **Upload** → select `sample_accounts.csv`

> *"For today, we're using the simplest option — manual upload. In a production environment, this would be automated via a pipeline running every night, or in real time via Eventstream."*

---

## 📊 STEP 2 — Load into a Delta Table (3 min)

**Action:** Open notebook `01_load_data.ipynb` → Run Cell 1

> *"Now we open a Fabric Notebook — this is where data engineers write code to process data. But notice — we're writing just a few lines. Fabric handles all the infrastructure automatically. No servers to configure, no clusters to manage."*

> *"We're reading the CSV file from the Files area and loading it into memory as what's called a DataFrame — think of it as an in-memory table."*

**[Show the output table from Cell 1]**

> *"You can already see the 500 accounts — customer names, account types, balances, branches, open dates. All right there."*

**Action:** Run Cell 2

> *"Now we're saving this as a Delta Table. Delta is the storage format that powers Fabric's Lakehouse. Let me explain why it matters:"*

> *"**Delta Tables** give you four things that a regular CSV or database table can't:"*
> *"1. **Time Travel** — you can go back and see what the data looked like yesterday, last week, or last year."*
> *"2. **ACID Transactions** — if a load fails halfway through, the data stays consistent. No half-loaded, corrupted tables."*
> *"3. **Schema Evolution** — you can add new columns without breaking existing reports."*
> *"4. **High Performance** — queries run 10-100x faster than reading raw files."*

> *"In seconds, 500 accounts are now a permanent, versioned, queryable Delta Table."*

---

## 🔍 STEP 3 — Query the Data (3 min)

**Action:** Run Cell 3 (show all accounts)

> *"Now let's query the data. Notice we're using SQL — the same language your database team already knows. No new skills needed."*

> *"But here's what's powerful about Fabric — it's not just notebooks that can query this. There are multiple ways:"*

> *"**Notebooks** (what we're using): Great for data engineers and analysts who want to combine code with results."*

> *"**SQL Analytics Endpoint**: Every Lakehouse in Fabric automatically gets a SQL endpoint. Your team can connect SQL Server Management Studio, Azure Data Studio, or any SQL client — and query this table as if it were a regular SQL Server database. Zero setup."*

> *"**Power BI Direct Lake**: Power BI can connect directly to Delta Tables — without importing or copying data. Reports are always live."*

> *"**Excel**: Connect from Excel using Power Query — analysts can refresh data with one click."*

**Action:** Run Cell 4 (active savings accounts over $10,000)

> *"I asked: show me all active savings accounts with a balance over $10,000, sorted by balance. In under a second, I have my answer across 500 records."*

> *"Imagine your risk team running this query across 50 million accounts. Same speed. That's the power of Delta on Fabric."*

**Action:** Run Cell 5 (branch summary)

> *"Now a branch-level summary — total accounts, total balances, and average balance per branch. This is the kind of view a branch manager or regional director would want every morning. With Fabric, it's always up to date."*

---

## ✅ CLOSING (1 min)

> *"In under 10 minutes, we took a flat CSV file and turned it into a queryable, secured, versioned data asset available to the entire organization."*

> *"This is the foundation of a modern data platform. Once data is in the Lakehouse, every team — risk, marketing, finance, operations — can access it through their preferred tool, without waiting for IT."*

> *"In our next demo, I'll show you what happens when data isn't clean — and how Fabric automatically organizes messy real-world data into trusted, business-ready insights."*

---

## ❓ ANTICIPATED QUESTIONS

**Q: Is this secure? Who can see this data?**  
A: Fabric uses Microsoft Entra ID (Azure Active Directory) for authentication and supports row-level security, column-level security, and workspace roles. You control exactly who sees what — down to individual rows.

**Q: What if we already have data in Azure SQL or Synapse?**  
A: Fabric connects natively to Azure SQL, Synapse, and dozens of other sources. You can use Shortcuts to query data in place without moving it, or use pipelines to bring it into the Lakehouse.

**Q: What if we have millions of records, not just 500?**  
A: Fabric is built on Apache Spark and OneLake — it handles billions of rows. The demo uses 500 to keep it fast and visible.

**Q: Can we connect this to Excel or Power BI?**  
A: Yes — Power BI connects via Direct Lake (always live, no import needed). Excel connects via Power Query. Both update automatically when new data arrives.

**Q: Do we need a data engineer to do this?**  
A: For automated pipelines, yes. But for manual uploads and simple queries, any technically curious analyst can do this with minimal training.

**Q: What is OneLake?**  
A: OneLake is Fabric's unified storage layer — like OneDrive but for your organization's data. All Fabric workspaces share one logical lake, so data doesn't need to be copied between teams.

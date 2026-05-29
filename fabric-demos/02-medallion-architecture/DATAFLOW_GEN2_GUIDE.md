# 🔀 No-Code Alternative: Dataflow Gen2

This guide shows how to complete the **Medallion Architecture** demo using **Dataflow Gen2** — Microsoft Fabric's no-code, drag-and-drop data transformation tool.

> 💡 **Who is this for?** Business analysts, data stewards, or anyone who prefers a visual, no-code approach over writing Python/PySpark notebooks.

---

## 🆚 Notebooks vs Dataflow Gen2 — Which Should I Use?

| | Notebooks (PySpark) | Dataflow Gen2 (No-Code) |
|--|---------------------|------------------------|
| **Skill needed** | Python / Spark | No coding — drag & drop |
| **Best for** | Engineers, complex logic | Analysts, standard transforms |
| **Interface** | Code editor | Visual Power Query editor |
| **Flexibility** | Unlimited | High (covers most scenarios) |
| **Scheduling** | Via pipeline or manual | Built-in scheduling |
| **Familiar tool** | VS Code / Jupyter | Excel / Power Query |

> ✅ Both approaches produce the **same Bronze, Silver, and Gold Delta Tables** in the Lakehouse. Choose whichever fits your audience.

---

## ✅ Prerequisites

Before starting, make sure you have:
- [ ] `BankingLakehouse` created in your Fabric workspace
- [ ] `loan_transactions.csv` uploaded to the **Files** section of the Lakehouse
- [ ] Fabric workspace with Dataflow Gen2 enabled (included in all Fabric capacities)

---

## 🥉 BRONZE LAYER — Ingest Raw Data with Dataflow Gen2

**Goal:** Load the raw CSV into a Bronze Delta Table with no changes.

### Steps:

**1. Create a new Dataflow Gen2**
1. In your Fabric workspace, click **+ New item**
2. Search for and select **Dataflow Gen2**
3. Name it: `Bronze_LoanTransactions`
4. Click **Create**

**2. Connect to the CSV source**
1. In the Dataflow editor, click **Get data**
2. Search for and select **Text/CSV**
3. Click **Browse OneLake** or enter the file path:
   - Navigate to your `BankingLakehouse` → `Files` → `loan_transactions.csv`
4. Click **Next**
5. Preview appears — confirm the header row is detected correctly
6. Click **Create**

**3. Keep data as-is (Bronze = no changes)**
1. You'll see the data loaded in the visual editor — 500 rows, 9 columns
2. **Do NOT apply any transformations** — Bronze preserves raw data exactly
3. Optional: In the query name panel (left side), rename the query to `bronze_loan_transactions`

> 💡 **Talking Point:** *"Notice we're not changing anything here. Bronze is our safety net — the original data, always preserved."*

**4. Set the data destination (output to Lakehouse)**
1. At the bottom of the screen, click **Add data destination**
2. Select **Lakehouse**
3. Select your `BankingLakehouse`
4. Under **Table name**, type: `bronze_loan_transactions`
5. Select **Replace** as the update method (for demo purposes)
6. Click **Save settings**

**5. Publish and run**
1. Click **Publish** (top right)
2. Back in the workspace, find your Dataflow and click **Refresh now**
3. Wait for the green ✅ — typically 30-60 seconds

**6. Verify**
- Open `BankingLakehouse` → click **Tables**
- You should see `bronze_loan_transactions` with 500 rows

---

## 🥈 SILVER LAYER — Clean Data with Dataflow Gen2

**Goal:** Remove failed transactions, fix data types, and add a Month column.

### Steps:

**1. Create a new Dataflow Gen2**
1. In your workspace, click **+ New item** → **Dataflow Gen2**
2. Name it: `Silver_LoanTransactions`

**2. Connect to the Bronze table**
1. Click **Get data** → search for **Microsoft Fabric Lakehouse**
2. Select your `BankingLakehouse`
3. Expand **Tables** → select `bronze_loan_transactions`
4. Click **Create**

**3. Filter out failed transactions**
1. Click the dropdown arrow on the **Status** column header
2. Uncheck **Failed** → click **OK**

> 💡 **Talking Point:** *"See how easy that is? Just like filtering in Excel — but this runs on millions of rows in the cloud."*

**4. Fix the TransactionDate column type**
1. Click the **TransactionDate** column header
2. In the ribbon, click **Transform** → **Data type** → select **Date**
3. Click **Replace current conversion** if prompted

**5. Fix the Amount column type**
1. Click the **Amount** column header
2. Click **Transform** → **Data type** → select **Decimal Number**

**6. Add a Month column**
1. Click the **TransactionDate** column header to select it
2. In the ribbon, click **Add column** → **Date** → **Month** → **Month**
3. A new `Month` column appears with the month number (1-12)
4. To get a readable format (e.g., `2024-01`):
   - Click **Add column** → **Custom column**
   - Name: `MonthLabel`
   - Formula: `= Date.ToText([TransactionDate], "yyyy-MM")`
   - Click **OK**

> 💡 **Talking Point:** *"We added a Month column with one click. No code. In notebooks, we write a line of Python. Here, we click a menu. Same result."*

**7. Set the data destination**
1. Click **Add data destination** → **Lakehouse** → `BankingLakehouse`
2. Table name: `silver_loan_transactions`
3. Update method: **Replace**
4. Click **Save settings**

**8. Publish and run**
1. Click **Publish** → Refresh the Dataflow
2. Verify in Lakehouse → Tables → `silver_loan_transactions`

> ✅ You should see fewer rows than Bronze (failed transactions removed)

---

## 🥇 GOLD LAYER — Business Summary with Dataflow Gen2

**Goal:** Create a pre-aggregated summary by Branch, Month, and Transaction Type.

### Steps:

**1. Create a new Dataflow Gen2**
1. New item → **Dataflow Gen2** → Name: `Gold_LoanSummary`

**2. Connect to the Silver table**
1. **Get data** → **Microsoft Fabric Lakehouse** → `BankingLakehouse`
2. Select `silver_loan_transactions` → **Create**

**3. Group by Branch, Month, and Transaction Type**
1. In the ribbon, click **Transform** → **Group by**
2. Click **Advanced** (to add multiple group-by columns)
3. Add group-by columns:
   - `Branch`
   - `MonthLabel`
   - `TransactionType`
4. Add aggregations:
   - New column name: `TransactionCount` | Operation: **Count rows**
   - Click **Add aggregation**
   - New column name: `TotalAmount` | Operation: **Sum** | Column: `Amount`
   - Click **Add aggregation**
   - New column name: `AvgAmount` | Operation: **Average** | Column: `Amount`
5. Click **OK**

> 💡 **Talking Point:** *"In Excel, you'd use a Pivot Table for this. This is Fabric's version — but it runs on the cloud and updates automatically."*

**4. Round the TotalAmount column**
1. Right-click the `TotalAmount` column → **Transform** → **Round** → **Round...** → enter `2` decimal places
2. Repeat for `AvgAmount`

**5. Set the data destination**
1. **Add data destination** → **Lakehouse** → `BankingLakehouse`
2. Table name: `gold_loan_summary`
3. Update method: **Replace**
4. Click **Save settings**

**6. Publish and run**
1. Click **Publish** → Refresh
2. Verify: Lakehouse → Tables → `gold_loan_summary`

---

## 🔗 AUTOMATE ALL 3 DATAFLOWS WITH A PIPELINE (Optional)

Once all 3 Dataflows are created, you can chain them into a single automated pipeline:

1. In your workspace, click **+ New item** → **Data pipeline**
2. Name it: `Medallion_Pipeline`
3. Click **Add activity** → **Dataflow**
4. Select `Bronze_LoanTransactions` → connect to next activity
5. Add another **Dataflow** activity → select `Silver_LoanTransactions`
6. Add another **Dataflow** activity → select `Gold_LoanSummary`
7. Connect them in sequence: Bronze → Silver → Gold

> 💡 **Talking Point:** *"Now I can run all three steps with one click — or schedule it to run every night at midnight. The whole pipeline runs automatically, no human needed."*

**Schedule it:**
1. Click **Schedule** in the pipeline toolbar
2. Toggle **Scheduled run** to On
3. Set frequency: Daily at 6:00 AM
4. Click **Apply**

---

## 🎤 Demo Talking Points for Dataflow Gen2

Use these when presenting the no-code path:

> *"For teams that prefer not to write code, Fabric provides Dataflow Gen2 — a visual, drag-and-drop transformation tool. If you've ever used Power Query in Excel, this will feel immediately familiar."*

> *"The same Bronze → Silver → Gold pattern we saw in the notebook demo? We're building it here with clicks and menus. No Python. No SQL. No data engineering degree required."*

> *"This is the power of Microsoft Fabric — it meets every user where they are. Developers use notebooks. Analysts use Dataflow Gen2. Business users use Power BI Copilot. All on the same platform, all working on the same data."*

> *"And the output is identical — the same Delta Tables, the same Lakehouse, the same Gold table that feeds the Power BI report. The tool changes, the result doesn't."*

---

## ❓ Frequently Asked Questions

**Q: Is Dataflow Gen2 the same as Power Query in Excel?**  
A: Very similar — both use the same M language under the hood and the same visual editor. If your team knows Power Query, they can use Dataflow Gen2 immediately.

**Q: Can I mix notebooks and Dataflow Gen2?**  
A: Yes! You could use Dataflow Gen2 for Bronze ingestion and Silver cleaning, and notebooks for complex Gold aggregations. Fabric supports hybrid approaches.

**Q: What are the limits of Dataflow Gen2?**  
A: For standard transformations (filter, group, merge, pivot), it handles most scenarios. For very complex custom logic, machine learning, or custom Python libraries, notebooks are better.

**Q: Can Dataflow Gen2 connect to external databases?**  
A: Yes — it supports 150+ connectors including SQL Server, Azure SQL, Oracle, Salesforce, SharePoint, REST APIs, and many more.

**Q: How do I know if a transformation ran successfully?**  
A: Dataflow Gen2 has a refresh history panel showing success/failure, row counts loaded, and duration for each run.

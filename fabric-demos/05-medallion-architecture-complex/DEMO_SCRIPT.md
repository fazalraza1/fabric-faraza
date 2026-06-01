# 🎯 Demo Script — Medallion Architecture: Star Schema & Advanced Analytics
## Demo 05 | Audience: Data Engineers, Architects, Senior Analysts

---

## Pre-Demo Checklist
- [ ] All 6 CSVs uploaded to Lakehouse `Files/`: customers, accounts, branches, products, transactions, loans
- [ ] All 4 notebooks imported into Fabric workspace
- [ ] `BankingLakehouse` attached to each notebook
- [ ] Star schema diagram open (README.md) for audience reference
- [ ] Gold tables built (run notebooks 01–04 before starting Power BI section)

**Total Demo Time:** ~60 min (add ~15 min for Semantic Model + Power BI section)

---

## Opening Hook (3 min)

> *"Most data warehouse projects fail not because of bad technology — but because of bad design. Flat tables. No relationships. Everyone querying their own copy of the data. Today I'm going to show you how Microsoft Fabric lets you build a production-grade star schema in one afternoon — the same pattern Fortune 500 banks use in their enterprise data warehouses."*

**Ask the audience:**
- *"How many of you have data that lives in flat CSV files or spreadsheets?"*
- *"How many have ever had to explain to an auditor where a number came from?"*
- *"How many spend more time joining data than analysing it?"*

> *"What we're building today solves all three of those problems."*

---

## Architecture Overview (5 min)

Draw or display the star schema diagram from README.md.

> *"This is a star schema. One or two fact tables — the numbers — surrounded by dimension tables — the context. Every analytics platform in the world is built on this pattern: Snowflake, Redshift, Synapse, BigQuery. Today we're building it in Fabric."*

**Fact vs Dimension:**
> *"Fact tables answer: 'How much? How many? What happened?' Dimension tables answer: 'Who? Where? When? What product?' When you JOIN them together, you get the full story."*

**Why not just one big flat table?**
> *"A 50-column flat table with customer name, branch address, and transaction amount repeated on every row is a maintenance nightmare. Change a branch name? Update 10,000 rows. With a dimension table, you update one row. That's why every serious data team uses this pattern."*

---

## Step 1 — Bronze Ingest (Notebook 01) | 5 min

**Open** `01_bronze_ingest.ipynb`

> *"We have 6 source systems: a CRM for customers, a core banking system for accounts, a branch directory, a product catalog, a transaction ledger, and a loan management system. In reality these come over SFTP, API, or CDC streams. Today we simulate them as CSVs."*

**Run all cells.**

> *"Notice the two columns we add to every Bronze table: `_ingested_at` and `_source_file`. This is your audit trail. When a regulator asks 'when did this data arrive and where did it come from?' — you have the answer, in the data itself."*

**Talking point — Bronze design principle:**
> *"Bronze is append-only. We never update or delete Bronze data. If the source sends bad data, we keep it and fix it in Silver. This is called 'immutable raw data' and it's one of the most important patterns in modern data engineering."*

---

## Step 2 — Silver Dimensions (Notebook 02) | 10 min

**Open** `02_silver_dimensions.ipynb`

> *"Now we clean and enrich each source table to create our dimension tables. Five dimensions: customer, account, product, branch, and date."*

### dim_customer
> *"We add three derived columns: FullName (concatenation), Age (calculated from date of birth), AgeGroup, and CreditScoreTier. These don't exist in the source system — we derive them here, once, so every downstream query gets the same consistent value."*

**Point out CreditScoreTier derivation:**
> *"Excellent ≥750, Good ≥670, Fair ≥580, Poor below. This business rule is defined once in Silver. If the business changes the definition of 'Excellent' — we update one line of code, re-run, and every Gold table downstream automatically gets the updated values."*

### dim_date — (most important dimension)
> *"The date dimension is special. We don't load it from a CSV — we generate it programmatically. 6 years × 365 days = 2,190 rows covering 2020-2025. Every date gets: Year, Quarter, MonthName, WeekNumber, DayOfWeek, IsWeekend, and FiscalYear."*

> *"In Power BI, this dimension is what makes 'Year-to-Date', 'Same Period Last Year', and 'Rolling 12-Month' calculations work. Without a proper date dimension, time intelligence is almost impossible."*

**Fiscal year talking point:**
> *"Notice we calculate fiscal year separately from calendar year. Many banks run October-September fiscal years. We handle that here — once — so Power BI reports just use `FiscalYear` directly."*

### Quality Checks
> *"We run referential integrity checks: are there any orphan accounts — accounts with a CustomerID that doesn't exist in dim_customer? In a real system you'd alert on this and stop the pipeline."*

---

## Step 3 — Gold Star Schema (Notebook 03) | 12 min

**Open** `03_gold_star_schema.ipynb`

> *"This is where the magic happens. We JOIN the Bronze transaction data with all 5 dimension tables to create fact_transactions — a fully enriched record of every transaction event."*

### fact_transactions JOIN walkthrough

```python
fact_transactions = bronze_txn
    .join(dim_date,     on TransactionDateKey == DateKey)   # brings Year, Quarter, MonthName, IsWeekend
    .join(dim_account,  on AccountID)                       # brings AccountType, Balance, BalanceTier, AccountStatus
    .join(dim_customer, on CustomerID)                      # brings FullName, CustomerSegment, CreditScoreTier
    .join(dim_branch,   on BranchID)                        # brings BranchName, Region
```

> *"One Spark job. Four JOINs. 2,000 transactions enriched with customer demographics, account type, branch region, and full date intelligence."*

> *"Note: dim_account has its own Status column (Active/Closed), and transactions also have a Status column (Completed/Failed/Pending). We alias the account one as `AccountStatus` so both are preserved — no ambiguity for analysts."*

**AmountBand derived column:**
> *"We also add AmountBand — Micro, Small, Medium, Large, Very Large. This is a common Power BI pattern: instead of filtering on arbitrary dollar amounts, analysts filter on categories they understand."*

### Query 1 — Transactions by Region & Quarter

**Run the SQL cell.**

```sql
SELECT Region, Quarter, Year,
       COUNT(*) AS NumTransactions,
       ROUND(SUM(Amount), 0) AS TotalAmount
FROM fact_transactions
WHERE Year IS NOT NULL
GROUP BY Region, Quarter, Year
ORDER BY Year, Quarter, TotalAmount DESC
```

> *"We use `Quarter` (1/2/3/4) from dim_date — not a label, but a sortable integer. In Power BI you can format it as 'Q1', 'Q2' etc. with a simple DAX measure."*

### Query 2 — Default Rate by Segment & Product

> *"Premium customers who take out Business Loans — what's their default rate? That's one GROUP BY query on fact_loans. Without the star schema, you'd need to JOIN 4 tables every single time someone asks that question."*

### Query 3 — Customer 360

> *"This is the query every bank's Chief Risk Officer wants: a single view of every customer — how many transactions, how many loans, how many defaults. Notice we JOIN both fact tables through dim_customer. The customer is the anchor. The star schema makes this natural."*

---

## Step 4 — Gold Aggregations (Notebook 04) | 8 min

**Open** `04_gold_aggregations.ipynb`

> *"Finally, we pre-compute the KPIs that executives look at every day. Instead of running these complex queries live in Power BI — which would be slow — we compute them once and save as Gold Delta Tables."*

### Four Gold KPI Tables:

| Table | Key Columns | Answers |
|-------|-------------|---------|
| `gold_branch_performance` | BranchName, Region, TotalLoans, DefaultRate_Pct | Which branches have the best/worst default rates? |
| `gold_monthly_trends` | Year, Quarter, MonthName, NumTransactions, TotalAmount | How is transaction volume trending month-over-month? |
| `gold_customer_segments` | CustomerSegment, CreditScoreTier, AgeGroup, DefaultRate_Pct | Which customer segments are most profitable? |
| `gold_product_performance` | ProductName, ProductType, NumLoans, DefaultRate_Pct | Which products have the highest default risk? |

> *"Note: monthly trends are grouped by `Year`, `Quarter`, and `MonthName` — using the actual column names from dim_date. `MonthName` gives you 'January', 'February' etc. for readable labels in Power BI."*

> *"Power BI Direct Lake connects directly to these Gold tables. No import, no scheduled refresh, no gateway. Sub-second query performance on live Delta data."*

---

## Step 5 — Semantic Model in Fabric | 10 min

> *"Now for the part that connects everything to Power BI. A Semantic Model in Fabric is the bridge between your Delta Tables and your reports. It defines relationships, KPI measures, and display formats — all in one place."*

### Create the Semantic Model

1. In your Fabric workspace, click **New** → **Semantic model**
2. Name it: `BankingStarSchema`
3. Select your **BankingLakehouse**
4. Check these tables and click **Confirm**:

| Table | Type |
|-------|------|
| `fact_transactions` | Fact |
| `fact_loans` | Fact |
| `dim_customer` | Dimension |
| `dim_account` | Dimension |
| `dim_branch` | Dimension |
| `dim_product` | Dimension |
| `dim_date` | Dimension |

### Define Relationships (Star Schema)

In the Model view, create the following relationships (drag from fact → dimension):

| From (Fact) | Column | To (Dimension) | Column | Cardinality |
|-------------|--------|----------------|--------|-------------|
| `fact_transactions` | `AccountID` | `dim_account` | `AccountID` | Many→One |
| `fact_transactions` | `CustomerID` | `dim_customer` | `CustomerID` | Many→One |
| `fact_transactions` | `BranchID` | `dim_branch` | `BranchID` | Many→One |
| `fact_transactions` | `TransactionDateKey` | `dim_date` | `DateKey` | Many→One |
| `fact_loans` | `CustomerID` | `dim_customer` | `CustomerID` | Many→One |
| `fact_loans` | `AccountID` | `dim_account` | `AccountID` | Many→One |
| `fact_loans` | `BranchID` | `dim_branch` | `BranchID` | Many→One |
| `fact_loans` | `ProductID` | `dim_product` | `ProductID` | Many→One |
| `fact_loans` | `StartDateKey` | `dim_date` | `DateKey` | Many→One (inactive) |

> *"Mark the `fact_loans → dim_date` relationship as inactive since dim_date is already used by fact_transactions. In DAX you can activate it on-demand with `USERELATIONSHIP()`."*

### Add DAX Measures

In the Semantic Model, add these measures to the `fact_transactions` table:

```dax
-- Total transaction value
Total Transaction Amount = SUM(fact_transactions[Amount])

-- Number of transactions
Total Transactions = COUNT(fact_transactions[TransactionID])

-- Average transaction size
Avg Transaction Amount = AVERAGE(fact_transactions[Amount])

-- Large transaction flag count
Large Transactions = 
    CALCULATE(COUNT(fact_transactions[TransactionID]),
              fact_transactions[IsLargeTransaction] = TRUE())
```

Add these measures to the `fact_loans` table:

```dax
-- Total loan portfolio value
Total Loan Volume = SUM(fact_loans[LoanAmount])

-- Default rate as a percentage
Default Rate % = 
    DIVIDE(SUM(fact_loans[IsDefault]), COUNT(fact_loans[LoanID]), 0) * 100

-- Number of defaulted loans
Defaulted Loans = SUM(fact_loans[IsDefault])

-- Total outstanding balance
Total Outstanding = SUM(fact_loans[OutstandingBalance])

-- Average loan size
Avg Loan Size = AVERAGE(fact_loans[LoanAmount])
```

---

## Step 6 — Power BI Report | 10 min

> *"Now we build the executive dashboard. Because we're using Direct Lake mode, Power BI reads directly from the Delta Tables in OneLake — no data copy, no scheduled refresh."*

### Create a New Report

1. From the Semantic Model page, click **Create report**
2. Choose **Auto-create report** for a quick start, or **Start from scratch** to build manually

### Recommended Report Layout (3 pages)

---

### Page 1 — Executive Summary

**KPI Cards (top row):**
- `Total Loan Volume` → formatted as `$#,##0,,M`
- `Default Rate %` → formatted as `0.0%`, conditional formatting red if > 5%
- `Total Transactions` → formatted as `#,##0`
- `Total Outstanding` → formatted as `$#,##0,,M`

**Bar Chart — Loan Volume by Branch Region:**
- Axis: `dim_branch[Region]`
- Values: `Total Loan Volume`
- Color by: Default Rate %

**Line Chart — Monthly Transaction Trend:**
- X-axis: `dim_date[MonthName]` (sorted by month number)
- Y-axis: `Total Transaction Amount`
- Legend: `dim_date[Year]`

**Slicer:** `dim_date[Year]`

---

### Page 2 — Loan Portfolio Risk

**Clustered Bar — Default Rate by Customer Segment:**
- Axis: `dim_customer[CustomerSegment]`
- Values: `Default Rate %`
- Sort descending

**Matrix Table — Branch Performance:**
- Rows: `dim_branch[BranchName]`
- Columns: `dim_customer[CustomerSegment]`
- Values: `Default Rate %`
- Conditional formatting: green (0–3%), yellow (3–6%), red (>6%)

**Donut Chart — Loans by Product Type:**
- Legend: `dim_product[ProductType]`
- Values: `Total Loan Volume`

**Slicer:** `dim_branch[Region]`

---

### Page 3 — Transaction Activity

**Stacked Bar — Transactions by Amount Band:**
- Axis: `dim_date[Quarter]`
- Legend: `fact_transactions[AmountBand]`
- Values: `Total Transactions`

**Table — Top 10 Customers by Transaction Volume:**
- Columns: `dim_customer[FullName]`, `dim_customer[CustomerSegment]`, `Total Transaction Amount`, `Total Transactions`
- Filter: Top N = 10 by `Total Transaction Amount`

**Card + Gauge — Large Transaction Volume:**
- Card: `Large Transactions`
- Gauge: `Total Transaction Amount` vs target (set a static target for demo)

**Slicer:** `dim_customer[CreditScoreTier]`

---

### Publish the Report

1. Click **File → Save** — name it `Banking Star Schema Dashboard`
2. Click **File → Publish** to publish to your Fabric workspace
3. The report is now accessible to anyone with Viewer role on the workspace

> *"And that's it. From raw CSV to an executive dashboard — in one Fabric workspace. The Semantic Model enforces consistent KPI definitions: everyone in the bank uses the same 'Default Rate %' formula."*

---

## Closing — Full Architecture Recap (2 min)

> *"Let's step back and see what we built:"*

| Layer | Tables | Rows | Purpose |
|-------|--------|------|---------|
| 🥉 Bronze | 6 | 3,510 | Raw audit trail |
| 🥈 Silver | 5 dims | 3,712 | Context & governance |
| 🥇 Gold | 6 | ~3,200 | Analytics & reporting |
| 📊 Semantic Model | 7 tables, 9 measures | — | Single source of truth for Power BI |

> *"17 Delta Tables. 6 JOINs. 9 DAX measures. Executive dashboard. Production-grade data model. Built in one afternoon on a single Fabric workspace."*

> *"The old way: extract data to S3, run dbt, load to Redshift, build a cube in SSAS, connect Power BI. 5 systems, 5 teams, 5 things to monitor and maintain. The Fabric way: one Lakehouse, one workspace, one bill."*

---

## Q&A — Anticipated Questions

**Q: How does this scale to billions of rows?**
> *"Delta Tables support Z-ordering — physical data layout optimized for your most common JOIN keys. `OPTIMIZE fact_transactions ZORDER BY (CustomerID, TransactionDate)` — one command, and your most common queries get 10-100x faster because Spark skips irrelevant files entirely."*

**Q: How do we handle slowly changing dimensions (SCDs)?**
> *"Delta's MERGE command handles Type 2 SCDs natively. `MERGE INTO dim_customer WHEN MATCHED AND ... THEN UPDATE`. No external SCD framework needed. We show exactly this pattern in Demo 06."*

**Q: Why is fact_loans → dim_date marked inactive?**
> *"dim_date can only have one active relationship to each fact table to avoid ambiguity. fact_transactions is the primary user of dim_date. For loan date analysis, use `USERELATIONSHIP(fact_loans[StartDateKey], dim_date[DateKey])` inside a CALCULATE measure."*

**Q: Can we do time intelligence (YTD, SPLY) with this model?**
> *"Yes — because we have a proper dim_date table, Power BI time intelligence functions like `TOTALYTD`, `SAMEPERIODLASTYEAR`, and `DATESINPERIOD` all work correctly. Without dim_date, those functions break."*

**Q: What about streaming data — real-time transactions?**
> *"Fabric Eventstream can write to the Bronze Delta Table in real-time. The Silver and Gold transformations run on a schedule or trigger. Direct Lake in Power BI picks up new data automatically — you'd have near-real-time KPIs within minutes of a transaction occurring."*

**Q: How is the Semantic Model different from a Power BI dataset?**
> *"It's the same concept — Fabric Semantic Models are the next generation of Power BI datasets. The key difference is that in Fabric, the Semantic Model lives in the workspace alongside the Lakehouse and notebooks — no need to publish from Power BI Desktop."*

**Q: How is this different from Azure Synapse Analytics?**
> *"Synapse requires dedicated SQL pools, separate storage accounts, and complex networking. Fabric is all-in-one: compute, storage, notebooks, Power BI, and pipelines in one workspace. For most banking analytics teams, Fabric eliminates 60-70% of the infrastructure complexity."*

---

## Key Takeaways

1. **Star schema = simplicity at scale** — complex analytics with simple SQL
2. **Medallion = traceability** — every number can be traced back to a source file
3. **Dimension tables = single source of truth** — business rules defined once
4. **Gold aggregations = Power BI speed** — pre-computed KPIs, Direct Lake performance
5. **Semantic Model = governed KPIs** — one definition of Default Rate % for the whole bank
6. **Fabric = all-in-one** — Lakehouse → Notebooks → Semantic Model → Power BI in one workspace


---

## Opening Hook (3 min)

> *"Most data warehouse projects fail not because of bad technology — but because of bad design. Flat tables. No relationships. Everyone querying their own copy of the data. Today I'm going to show you how Microsoft Fabric lets you build a production-grade star schema in one afternoon — the same pattern Fortune 500 banks use in their enterprise data warehouses."*

**Ask the audience:**
- *"How many of you have data that lives in flat CSV files or spreadsheets?"*
- *"How many have ever had to explain to an auditor where a number came from?"*
- *"How many spend more time joining data than analysing it?"*

> *"What we're building today solves all three of those problems."*

---

## Architecture Overview (5 min)

Draw or display the star schema diagram from README.md.

> *"This is a star schema. One or two fact tables — the numbers — surrounded by dimension tables — the context. Every analytics platform in the world is built on this pattern: Snowflake, Redshift, Synapse, BigQuery. Today we're building it in Fabric."*

**Fact vs Dimension:**
> *"Fact tables answer: 'How much? How many? What happened?' Dimension tables answer: 'Who? Where? When? What product?' When you JOIN them together, you get the full story."*

**Why not just one big flat table?**
> *"A 50-column flat table with customer name, branch address, and transaction amount repeated on every row is a maintenance nightmare. Change a branch name? Update 10,000 rows. With a dimension table, you update one row. That's why every serious data team uses this pattern."*

---

## Step 1 — Bronze Ingest (Notebook 01) | 5 min

**Open** `01_bronze_ingest.ipynb`

> *"We have 6 source systems: a CRM for customers, a core banking system for accounts, a branch directory, a product catalog, a transaction ledger, and a loan management system. In reality these come over SFTP, API, or CDC streams. Today we simulate them as CSVs."*

**Run all cells.**

> *"Notice the two columns we add to every Bronze table: `_ingested_at` and `_source_file`. This is your audit trail. When a regulator asks 'when did this data arrive and where did it come from?' — you have the answer, in the data itself."*

**Talking point — Bronze design principle:**
> *"Bronze is append-only. We never update or delete Bronze data. If the source sends bad data, we keep it and fix it in Silver. This is called 'immutable raw data' and it's one of the most important patterns in modern data engineering."*

---

## Step 2 — Silver Dimensions (Notebook 02) | 10 min

**Open** `02_silver_dimensions.ipynb`

> *"Now we clean and enrich each source table to create our dimension tables. Five dimensions: customer, account, product, branch, and date."*

### dim_customer
> *"We add three derived columns: FullName (concatenation), Age (calculated from date of birth), AgeGroup, and CreditScoreTier. These don't exist in the source system — we derive them here, once, so every downstream query gets the same consistent value."*

**Point out CreditScoreTier derivation:**
> *"Excellent ≥750, Good ≥670, Fair ≥580, Poor below. This business rule is defined once in Silver. If the business changes the definition of 'Excellent' — we update one line of code, re-run, and every Gold table downstream automatically gets the updated values."*

### dim_date — (most important dimension)
> *"The date dimension is special. We don't load it from a CSV — we generate it programmatically. 6 years × 365 days = 2,190 rows covering 2020-2025. Every date gets: year, quarter, month name, week, day of week, weekend flag, and fiscal year."*

> *"In Power BI, this dimension is what makes 'Year-to-Date', 'Same Period Last Year', and 'Rolling 12-Month' calculations work. Without a proper date dimension, time intelligence is almost impossible."*

**Fiscal year talking point:**
> *"Notice we calculate fiscal year separately from calendar year. Many banks run October-September fiscal years. We handle that here — once — so Power BI reports just use `FiscalYear` directly."*

### Quality Checks
> *"We run referential integrity checks: are there any orphan accounts — accounts with a CustomerID that doesn't exist in dim_customer? In a real system you'd alert on this and stop the pipeline."*

---

## Step 3 — Gold Star Schema (Notebook 03) | 12 min

**Open** `03_gold_star_schema.ipynb`

> *"This is where the magic happens. We JOIN the Bronze transaction data with all 5 dimension tables to create fact_transactions — a fully enriched record of every transaction event."*

### fact_transactions JOIN walkthrough

```python
fact_transactions = bronze_txn
    .join(dim_date,     on TransactionDateKey == DateKey)
    .join(dim_account,  on AccountID)
    .join(dim_customer, on CustomerID)
    .join(dim_branch,   on BranchID)
```

> *"One Spark job. Four JOINs. 2,000 transactions enriched with customer demographics, account type, branch region, and full date intelligence. On a 100-million-row table, this runs in minutes on Fabric's distributed compute."*

**AmountBand derived column:**
> *"We also add AmountBand — Micro, Small, Medium, Large, Very Large. This is a common Power BI pattern: instead of filtering on arbitrary dollar amounts, analysts filter on categories they understand."*

### Query 1 — Transactions by Region & Quarter

**Run the SQL cell.**

> *"Look at this. We can now answer: 'Which region had the highest transaction volume in Q3 2023?' — with a four-line SQL query. Without the star schema, this would require 3 separate joins, 2 subqueries, and a DBA to write it."*

### Query 2 — Default Rate by Segment & Product

> *"Premium customers who take out Business Loans — what's their default rate? That's one GROUP BY query on fact_loans. Without the star schema, you'd need to JOIN 4 tables every single time someone asks that question."*

### Query 3 — Customer 360

> *"This is the query every bank's Chief Risk Officer wants: a single view of every customer — how many transactions, how many loans, how many defaults. Notice we JOIN both fact tables through dim_customer. The customer is the anchor. The star schema makes this natural."*

---

## Step 4 — Gold Aggregations (Notebook 04) | 8 min

**Open** `04_gold_aggregations.ipynb`

> *"Finally, we pre-compute the KPIs that executives look at every day. Instead of running these complex queries live in Power BI — which would be slow — we compute them once and save as Gold Delta Tables."*

### Four Gold KPI Tables:

| Table | Answers |
|-------|---------|
| `gold_branch_performance` | Which branches have the best/worst default rates? |
| `gold_monthly_trends` | How is transaction volume trending month-over-month? |
| `gold_customer_segments` | Which customer segments are most profitable? |
| `gold_product_performance` | Which products have the highest default risk? |

> *"Power BI Direct Lake connects directly to these Gold tables. No import, no scheduled refresh, no gateway. Sub-second query performance on live Delta data."*

**Show the branch performance table:**
> *"In one glance: total loan volume, average loan size, default rate, outstanding balance — per branch. Your regional managers can now see exactly how their branch compares to the network. This is a report that used to take a week to produce."*

---

## Closing — Full Architecture Recap (2 min)

> *"Let's step back and see what we built:"*

| Layer | Tables | Rows | Purpose |
|-------|--------|------|---------|
| 🥉 Bronze | 6 | 3,510 | Raw audit trail |
| 🥈 Silver | 5 dims | 3,712 | Context & governance |
| 🥇 Gold | 6 | ~3,200 | Analytics & reporting |

> *"17 Delta Tables. 6 JOINs. Production-grade data model. Built in 45 minutes on a single Fabric workspace."*

> *"The old way: extract data to S3, run dbt, load to Redshift, connect Power BI. 4 systems, 4 teams, 4 things to monitor. The Fabric way: one Lakehouse, one workspace, one bill."*

---

## Q&A — Anticipated Questions

**Q: How does this scale to billions of rows?**
> *"Delta Tables support Z-ordering — physical data layout optimized for your most common JOIN keys. `OPTIMIZE fact_transactions ZORDER BY (CustomerID, TransactionDate)` — one command, and your most common queries get 10-100x faster because Spark skips irrelevant files entirely."*

**Q: How do we handle slowly changing dimensions (SCDs)?**
> *"Delta's MERGE command handles Type 2 SCDs natively. `MERGE INTO dim_customer WHEN MATCHED AND ... THEN UPDATE`. No external SCD framework needed. We can add that as a next step."*

**Q: Can we connect this directly to Power BI?**
> *"Yes — Power BI Direct Lake mode. Connect Power BI directly to the Gold Delta Tables. No import, no scheduled refresh. You get near-real-time data with import-speed performance. It reads the Parquet files directly from OneLake."*

**Q: What about streaming data — real-time transactions?**
> *"Fabric Eventstream can write to the Bronze Delta Table in real-time. The Silver and Gold transformations run on a schedule or trigger. You'd have near-real-time KPIs within minutes of a transaction occurring."*

**Q: How is this different from Azure Synapse Analytics?**
> *"Synapse requires dedicated SQL pools, separate storage accounts, and complex networking. Fabric is all-in-one: compute, storage, notebooks, Power BI, and pipelines in one workspace. For most banking analytics teams, Fabric eliminates 60-70% of the infrastructure complexity."*

---

## Key Takeaways

1. **Star schema = simplicity at scale** — complex analytics with simple SQL
2. **Medallion = traceability** — every number can be traced back to a source file
3. **Dimension tables = single source of truth** — business rules defined once
4. **Gold aggregations = Power BI speed** — pre-computed KPIs, Direct Lake performance
5. **Fabric = all-in-one** — no data movement between systems

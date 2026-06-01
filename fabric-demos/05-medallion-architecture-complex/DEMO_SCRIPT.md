# 🎯 Demo Script — Medallion Architecture: Star Schema & Advanced Analytics
## Demo 05 | Audience: Data Engineers, Architects, Senior Analysts

---

## Pre-Demo Checklist
- [ ] All 6 CSVs uploaded to Lakehouse `Files/`: customers, accounts, branches, products, transactions, loans
- [ ] All 4 notebooks imported into Fabric workspace
- [ ] `BankingLakehouse` attached to each notebook
- [ ] Star schema diagram open (README.md) for audience reference

**Total Demo Time:** ~45 min

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

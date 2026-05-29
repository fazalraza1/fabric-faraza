# 🎤 Demo Script — Demo 02: Medallion Architecture with Loan Transactions

**Presenter Time:** ~25 minutes  
**Audience:** Business stakeholders, managers

---

## 🌟 FABRIC INTRODUCTION (2 min)

> *"In our previous demo, we saw how Fabric stores and queries data. But in the real world, data that comes into a bank is rarely clean. Transactions fail. Dates are in the wrong format. Fields are missing. If you build reports on messy data, you get wrong answers — and wrong answers in banking can mean millions in losses or regulatory fines."*

> *"Microsoft Fabric solves this with a proven pattern called the Medallion Architecture — a three-layer system that takes raw, messy data and progressively refines it into trusted, business-ready insights."*

> *"This pattern is used by the world's largest banks, insurance companies, and financial institutions. And with Fabric, you can implement it in hours — not months."*

---

## 🟢 OPENING (2 min)

> *"Today I'll show you how Microsoft Fabric automatically organizes messy bank loan transaction data into clean, trustworthy insights."*

> *"Think of it like a car wash for your data. Your raw data goes in dirty — and comes out clean, polished, and ready to use."*

**[Draw or gesture to 3 layers]**

| Layer | Nickname | Purpose |
|-------|----------|---------|
| 🥉 Bronze | Raw Zone | Data exactly as received — never modified |
| 🥈 Silver | Trusted Zone | Cleaned, validated, standardized |
| 🥇 Gold | Business Zone | Aggregated, ready for reports & decisions |

> *"Each layer serves a different purpose and audience. Let's walk through all three."*

---

## 🥉 STEP 1 — Bronze Layer: Raw Data (5 min)

**Action:** Upload `loan_transactions.csv` to Lakehouse Files section

> *"First, let's talk about how this data would arrive in a real bank. You have multiple options in Fabric:"*

> *"**Real-world ingestion options:**"*
> *"- **Automated Pipelines via Data Factory**: Your core banking system writes transactions to an Azure SQL database every minute. A Fabric pipeline picks them up automatically and lands them in Bronze — no human intervention."*
> *"- **Eventstream**: For real-time systems — every transaction that clears goes directly into Fabric within milliseconds. Think of card swipes at a POS terminal."*
> *"- **REST API Connector**: Your loan origination system exposes an API. Fabric polls it every hour and pulls new applications into Bronze."*
> *"- **SFTP / File Drop**: Some legacy banking systems still drop flat files to an SFTP server nightly. Fabric watches that folder and automatically picks them up."*
> *"- **Manual Upload** (what we're doing): For demos, testing, or one-off data loads."*

> *"The key principle of Bronze: **you never change the data**. Whatever comes in, you store it exactly as-is. Bronze is your audit trail — your insurance policy."*

**Action:** Open `01_bronze_ingest.ipynb` → Run all cells

> *"We're loading 500 loan transactions — payments, disbursements, some completed, some failed. Look at the Status column — you'll see 'Failed' records. We're keeping those. We're not throwing anything away at this stage."*

**[Point to failed transactions in output]**

> *"Why keep failed transactions? Because they tell a story. A customer with 5 failed payments in a row is a credit risk signal. A failed disbursement might mean a compliance issue. The Bronze layer preserves that history forever."*

> *"Also notice — Fabric automatically tracks when this data was loaded, who loaded it, and where it came from. That's your audit trail for regulators."*

---

## 🥈 STEP 2 — Silver Layer: Clean & Trusted Data (7 min)

**Action:** Open `02_silver_clean.ipynb` → Run all cells

> *"Now we move to Silver — the Trusted Zone. This is where data quality rules are applied. Think of this as your bank's data quality team, automated."*

> *"Here's what Fabric is doing in this step:"*

> *"**1. Filtering**: We remove failed transactions from the Silver layer — not from Bronze, never from Bronze — but from Silver. Analysts working in Silver can trust that every record they see is a valid, completed transaction."*

> *"**2. Standardization**: Dates are converted to a consistent format. Amount fields are cast to proper decimal types. This sounds boring, but inconsistent data formats are one of the top causes of reporting errors in banks."*

> *"**3. Enrichment**: We're adding a Month column — derived from the transaction date. This makes monthly reporting 10x faster because the grouping is pre-calculated."*

> *"**4. Data Quality Metrics**: In a production system, you'd add rules here — like 'reject any transaction over $1 million that doesn't have an approval code' — and Fabric would quarantine those records for review."*

**[Point to record count difference]**

> *"We went from 500 Bronze records to approximately 425 Silver records. That difference? About 75 failed transactions — now properly handled, not silently ignored."*

> *"The Silver layer is what your data analysts, risk managers, and compliance teams use for day-to-day work. They know: if it's in Silver, it's clean."*

> *"And critically — multiple teams can have their own Silver tables from the same Bronze data. The risk team's Silver might keep failed transactions for analysis. The finance team's Silver might only have completed payments. Fabric supports all of this from one Bronze source."*

---

## 🥇 STEP 3 — Gold Layer: Business-Ready Insights (5 min)

**Action:** Open `03_gold_report.ipynb` → Run all cells

> *"Now the Gold layer — this is where business value lives. Gold tables are optimized for one thing: answering business questions fast."*

> *"Gold tables are pre-aggregated, pre-summarized, and purpose-built for specific audiences. We might have:"*
> *"- A Gold table for **branch managers**: transaction volumes and amounts per branch per month"*
> *"- A Gold table for **finance**: total disbursements vs payments for P&L reporting"*
> *"- A Gold table for **risk**: accounts with high payment failure rates"*

**[Run executive branch summary query]**

> *"In one query, I can see every branch's total transaction volume and dollar value for the entire year. This is what a Regional Director wants on their Monday morning dashboard."*

**[Run monthly trend query]**

> *"And here's the monthly trend — payments vs disbursements over time. Is the loan book growing? Are payments keeping pace with disbursements? This is a key metric for the CFO."*

> *"Here's the business impact of Gold: instead of a data analyst spending 3 hours every Monday pulling this report manually from 5 different systems, Fabric generates it automatically, every night, always fresh."*

> *"And because it's in Fabric's Lakehouse, Power BI connects to it via Direct Lake — meaning Power BI dashboards always show live data, not yesterday's snapshot."*

---

## ✅ CLOSING (2 min)

> *"What you saw today is how world-class banks and financial institutions manage their data. Bronze protects your raw data forever. Silver makes it trustworthy. Gold makes it instantly actionable."*

> *"Microsoft Fabric makes this pattern — which used to take 6-12 months and a team of 5 engineers to build — available in days."*

> *"The Medallion Architecture isn't just a technical pattern. It's a **data governance framework**. It gives you auditability at Bronze, data quality at Silver, and business agility at Gold."*

> *"In our next demo, I'll show you how we add AI on top of this architecture to automatically detect fraudulent transactions in real time."*

---

## ❓ ANTICIPATED QUESTIONS

**Q: Who maintains this pipeline once it's built?**  
A: Once set up, it runs automatically on a schedule or in real time. Your data team sets it up once. Fabric monitors it and sends alerts if something fails.

**Q: How often does the data update?**  
A: You decide — every minute, every hour, every day. Fabric is fully configurable. Many banks run Bronze ingestion in real time and Silver/Gold refresh every hour.

**Q: What if our source data format changes?**  
A: Delta Tables support schema evolution — you can add new columns without breaking existing reports. Fabric also has schema drift detection in pipelines.

**Q: Can Power BI connect to the Gold layer?**  
A: Yes — and with Fabric's Direct Lake mode, Power BI reads directly from Delta Tables without importing data. Reports are always live and there's no data duplication.

**Q: What about data lineage — can we track where data came from?**  
A: Fabric has built-in data lineage views that show exactly how data flows from source through Bronze, Silver, Gold to reports. This is critical for regulatory compliance.

**Q: How does this help with regulatory reporting like Basel III or stress testing?**  
A: Bronze gives you a complete, immutable audit trail. Silver gives you validated, consistent data. Gold gives you pre-built regulatory report tables. All auditable, all traceable.

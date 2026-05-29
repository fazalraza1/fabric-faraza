# 🎤 Demo Script — Medallion Architecture

**Presenter Time:** ~35 minutes  
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

## 📐 STEP 4 — Create a Semantic Model (5 min)

> *"Now here's where things get really interesting. We have clean, summarized data in our Gold table. But raw tables aren't quite ready for business users to explore in Power BI — they need business-friendly names, relationships, and measures. That's what a Semantic Model provides."*

> *"A **Semantic Model** is a business-friendly layer on top of your data. Think of it as a translation layer — it takes technical table and column names and turns them into language that business users understand. It also pre-defines calculations like 'Total Revenue' or 'Average Loan Amount' so every report in the organization uses the exact same numbers."*

> *"In the past, building a Semantic Model could take a data engineer days. In Fabric, it's built into the Lakehouse — you're minutes away."*

**Action:** In the Lakehouse, click **"New semantic model"** (top toolbar)

> *"Notice this button right here — 'New semantic model'. Fabric knows about our Gold table and can automatically create a Semantic Model from it."*

**Action:** In the dialog:
1. Name it: `LoanAnalyticsModel`
2. Select table: ✅ `gold_loan_summary`
3. Click **Confirm**

> *"Fabric is now creating the Semantic Model. It's automatically detecting column types, suggesting relationships, and making the data Power BI-ready."*

**Action:** Once opened in the Semantic Model editor:
- Click on the `TotalAmount` column → rename it to `Total Loan Volume ($)`
- Click on the `TransactionCount` column → rename it to `Number of Transactions`
- Click **New measure** → enter: `Avg Transaction = AVERAGE(gold_loan_summary[AvgAmount])`

> *"See how easy that was? We just gave our columns business-friendly names and added a custom calculation. Every Power BI report connected to this model will now use these consistent definitions — no more 'which number is right?' conversations between teams."*

> *"And this Semantic Model is live. The moment new data arrives in the Gold table, the Semantic Model reflects it — automatically. No refresh schedule to configure, no manual updates."*

---

## 📊 STEP 5 — Generate Power BI Report with Copilot (5 min)

> *"Now the moment that will surprise most people in this room. We're going to ask an AI — Copilot in Power BI — to build a complete, professional report for us. Using plain English. No Power BI skills required."*

> *"Microsoft Copilot is built into Power BI and understands your Semantic Model. You describe what you want in natural language, and Copilot builds the visuals."*

**Action:** From the Semantic Model, click **"Create report"** → **"Auto-create report"**

> *"Option 1: Auto-create. Fabric's AI looks at your data and automatically decides the best visuals. Let's see what it suggests..."*

**[Show the auto-generated report]**

> *"Look at that — a complete report in under 10 seconds. Branch performance bar chart, monthly trend line, transaction type breakdown. This would have taken a BI developer half a day."*

**Action:** Click the **Copilot** button (sparkle icon ✨) in the report toolbar

> *"Now let's try Copilot directly. I'm going to ask it to add something specific."*

**Action:** In the Copilot panel, type:
> `"Add a page showing monthly loan payment trends by branch with a line chart"`

**[Show Copilot generating the visual]**

> *"Watch — Copilot reads the request, understands the data model, picks the right fields, chooses the right visual type, and places it on the report. No clicking through menus. No dragging fields. Just plain English."*

**Action:** In the Copilot panel, type:
> `"Add a KPI card showing total loan volume this year"`

> *"I can keep refining the report conversationally. Add a filter here. Change the color theme. Add a summary text box that explains the key insights."*

**Action:** In the Copilot panel, type:
> `"Summarize the key insights from this report"`

> *"Copilot can even write the narrative — the executive summary paragraph that explains what the data shows. That's the paragraph your CFO would normally ask an analyst to write."*

**[Point to the finished report]**

> *"In under 5 minutes, we went from a Gold Delta Table to a fully interactive, AI-generated Power BI report. With Copilot, your business users don't need to wait for IT or BI developers. They can explore their data themselves — in their own words."*

---

## ✅ CLOSING (2 min)

> *"What you saw today is how world-class banks and financial institutions manage their data. Bronze protects your raw data forever. Silver makes it trustworthy. Gold makes it instantly actionable. The Semantic Model makes it business-friendly. And Copilot makes it accessible to everyone."*

> *"Microsoft Fabric makes this entire pattern — which used to take 6-12 months and a team of 5 engineers — available in days. And with Copilot in Power BI, business users no longer need to wait for BI developers to build reports."*

> *"The Medallion Architecture isn't just a technical pattern. It's a **data democratization strategy**. It gives you auditability at Bronze, data quality at Silver, business agility at Gold, governance at the Semantic Model layer, and self-service at the Power BI Copilot layer."*

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
A: Fabric has built-in data lineage views that show exactly how data flows from source through Bronze, Silver, Gold, Semantic Model to reports. This is critical for regulatory compliance.

**Q: How does this help with regulatory reporting like Basel III or stress testing?**  
A: Bronze gives you a complete, immutable audit trail. Silver gives you validated, consistent data. Gold gives you pre-built regulatory report tables. All auditable, all traceable.

**Q: What is a Semantic Model exactly — is it the same as a dataset?**  
A: Yes — in older Power BI terminology it was called a "dataset". Microsoft renamed it to Semantic Model to better reflect what it does: it models the business semantics (meaning) of your data. It defines measures, relationships, hierarchies, and friendly names that all reports share consistently.

**Q: Does everyone need Power BI skills to use Copilot?**  
A: No — that's the point. Copilot lets business users describe what they want in plain English. "Show me loan payments by branch for the last 3 months" — Copilot builds it. No dragging, no dropping, no DAX knowledge required.

**Q: Can Copilot connect to our existing Power BI reports?**  
A: Yes — Copilot works inside existing Power BI reports and can also create new ones from any Semantic Model. It can also add visuals to existing report pages.

**Q: What if Copilot builds the wrong chart?**  
A: You simply tell it to change it — "change this to a bar chart" or "add a date filter". It's a conversation, not a one-shot command. And you can always manually edit any visual Copilot creates.

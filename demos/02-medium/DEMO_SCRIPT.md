# 🎤 Demo Script — Demo 02: Medallion Architecture with Loan Transactions

**Presenter Time:** ~20 minutes  
**Audience:** Business stakeholders, managers

---

## 🟢 OPENING (2 min)

> *"In our last demo, we loaded a simple spreadsheet into Fabric. But in the real world, data is messy — transactions fail, records are incomplete, formats are wrong."*

> *"Today I'll show you how Microsoft Fabric automatically organizes messy bank data into clean, trustworthy insights using something called Medallion Architecture."*

> *"Think of it like a car wash. Your raw data goes in dirty — and comes out clean, polished, and ready to use."*

**[Show diagram or gesture to 3-layer concept]**

> *"Three layers: Bronze is raw data, Silver is cleaned data, Gold is business-ready summaries. Let's see this in action."*

---

## 🥉 STEP 1 — Bronze Layer: Raw Data (4 min)

**Action:** Upload `loan_transactions.csv` to Lakehouse → Open `01_bronze_ingest.ipynb` → Run all cells

> *"Here we're loading 30 loan transactions exactly as they came in — no changes, no filtering. You can see some transactions failed, some have issues. That's fine at this stage — we want to preserve the original data."*

> *"Bronze is like your original document. You never throw away the original."*

**[Show the raw table with failed transactions visible]**

> *"Notice we have 'Failed' transactions here. We'll deal with those in the next layer."*

---

## 🥈 STEP 2 — Silver Layer: Clean Data (5 min)

**Action:** Open `02_silver_clean.ipynb` → Run all cells

> *"Now we're cleaning the data. Watch what happens."*

**[Run cells, show results]**

> *"We removed failed transactions, standardized the date formats, added a month column for easy reporting. The Silver table is what your analysts and data teams work with every day."*

> *"And importantly — the Bronze data is still there, untouched. If we ever need to audit or reprocess, we go back to Bronze."*

**[Point out the record count difference]**

> *"We went from 30 records to [X] clean records. That [Y] difference? Those were failed transactions or data issues that we've now properly handled."*

---

## 🥇 STEP 3 — Gold Layer: Business Insights (5 min)

**Action:** Open `03_gold_report.ipynb` → Run all cells

> *"Now for the exciting part — the Gold layer. This is what business leaders and dashboards consume."*

**[Run summary cells]**

> *"I can now instantly see: which branches processed the most loans this month, total disbursements vs payments, which accounts had the most failed payments — a red flag for risk teams."*

> *"This Gold table updates automatically every time new transactions come in. Your dashboards always show the latest picture."*

---

## ✅ CLOSING (2 min)

> *"What you saw today is how world-class banks and financial institutions manage their data. Microsoft Fabric makes this pattern — which used to take months to build — available in hours."*

> *"Bronze keeps your raw data safe. Silver makes it trustworthy. Gold makes it actionable."*

> *"In our next demo, I'll show you how we can take this further — using AI to automatically detect fraudulent loan transactions in real time."*

---

## ❓ ANTICIPATED QUESTIONS

**Q: Who maintains this pipeline?**  
A: Once set up, it runs automatically. Your data team sets it up once, and it keeps running.

**Q: How often does the data update?**  
A: You decide — every minute, every hour, every day. Fabric is flexible.

**Q: What if we want to add a new column to track?**  
A: Just update the Silver notebook. Fabric handles the rest without breaking existing reports.

**Q: Can Power BI connect to the Gold layer?**  
A: Yes — and with Fabric's Direct Lake, Power BI reports update instantly when new data arrives.

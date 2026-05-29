# ⭐⭐ Demo 02 — Medallion Architecture

**Time to run:** ~20 minutes  
**Audience:** Business stakeholders, managers  
**What you'll learn:** How Fabric organizes messy raw data into clean, trusted insights — then visualizes it with Power BI Copilot

> 🔧 **First time?** Make sure you have the prerequisites set up before starting.  
> 👉 [View Prerequisites & Setup Guide](../../PREREQUISITES.md)

---

## 🎯 What This Demo Shows

Real bank data is messy — transactions fail, records have errors, formats differ.  
This demo shows **Medallion Architecture**: a 3-layer system to clean and organize data automatically.

Think of it like a **car wash** for your data:

| Layer | Color | What it does |
|-------|-------|-------------|
| **Bronze** | 🥉 Raw | Data exactly as it arrived — no changes |
| **Silver** | 🥈 Cleaned | Errors fixed, bad records removed |
| **Gold** | 🥇 Business-ready | Summarized, ready for reports & decisions |

---

## 📋 Steps Overview

1. **Bronze** — Ingest raw loan transactions CSV as-is
2. **Silver** — Clean the data (remove failed transactions, fix types)
3. **Gold** — Summarize into business metrics by branch and month
4. **Semantic Model** — Create a Power BI Semantic Model from the Gold table
5. **Power BI Report** — Use Copilot in Power BI to auto-generate a report

---

## 📁 Files in This Demo

| File | Purpose |
|------|---------|
| `data/loan_transactions.csv` | 500 loan transaction records |
| `notebooks/01_bronze_ingest.ipynb` | Load raw data (Bronze layer) |
| `notebooks/02_silver_clean.ipynb` | Clean and validate data (Silver layer) |
| `notebooks/03_gold_report.ipynb` | Create business summary (Gold layer) |
| `DEMO_SCRIPT.md` | Step-by-step presenter guide (includes Semantic Model + Power BI Copilot instructions) |

---

## ▶️ How to Run

Run in order: Bronze → Silver → Gold → Semantic Model → Power BI Copilot

1. Upload `data/loan_transactions.csv` to your Lakehouse Files section
2. Open and run `01_bronze_ingest.ipynb`
3. Open and run `02_silver_clean.ipynb`
4. Open and run `03_gold_report.ipynb`
5. Create Semantic Model from `gold_loan_summary` table (instructions in DEMO_SCRIPT.md)
6. Open Power BI and use Copilot to generate the report (instructions in DEMO_SCRIPT.md)

---

## 💬 Key Talking Points

- **Why 3 layers?** So you always have the original data (Bronze) as a backup
- **Silver** is what analysts use for most day-to-day work
- **Gold** is what executives and dashboards consume
- **Semantic Model** is the bridge between raw data and business-friendly Power BI reports
- **Power BI Copilot** lets anyone build a professional report using plain English — no BI skills needed
- This pattern scales to **billions of transactions** without any extra work

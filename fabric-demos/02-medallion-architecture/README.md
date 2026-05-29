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
| `notebooks/01_bronze_ingest.ipynb` | 🐍 **Code option** — Load raw data (Bronze layer) |
| `notebooks/02_silver_clean.ipynb` | 🐍 **Code option** — Clean and validate data (Silver layer) |
| `notebooks/03_gold_report.ipynb` | 🐍 **Code option** — Create business summary (Gold layer) |
| `DATAFLOW_GEN2_GUIDE.md` | 🖱️ **No-code option** — Full Dataflow Gen2 step-by-step guide |
| `DEMO_SCRIPT.md` | Step-by-step presenter guide (includes Semantic Model + Power BI Copilot instructions) |

---

## ▶️ How to Run

> **Two options — same result!** Choose based on your audience and skill level.

### 🐍 Option A — Code (PySpark Notebooks)
*Best for: data engineers, technical audiences*

Run notebooks in order: Bronze → Silver → Gold

1. Upload `data/loan_transactions.csv` to your Lakehouse Files section
2. Open and run `notebooks/01_bronze_ingest.ipynb`
3. Open and run `notebooks/02_silver_clean.ipynb`
4. Open and run `notebooks/03_gold_report.ipynb`
5. Create Semantic Model from `gold_loan_summary` table (instructions in DEMO_SCRIPT.md)
6. Open Power BI and use Copilot to generate the report (instructions in DEMO_SCRIPT.md)

### 🖱️ Option B — No-Code (Dataflow Gen2)
*Best for: business analysts, non-technical audiences*

1. Upload `data/loan_transactions.csv` to your Lakehouse Files section
2. Follow the full step-by-step guide in 👉 [`DATAFLOW_GEN2_GUIDE.md`](./DATAFLOW_GEN2_GUIDE.md)
3. Create Semantic Model from `gold_loan_summary` table (instructions in DEMO_SCRIPT.md)
4. Open Power BI and use Copilot to generate the report (instructions in DEMO_SCRIPT.md)

---

## 💬 Key Talking Points

- **Why 3 layers?** So you always have the original data (Bronze) as a backup
- **Silver** is what analysts use for most day-to-day work
- **Gold** is what executives and dashboards consume
- **Two paths, same result** — notebooks for engineers, Dataflow Gen2 for analysts — both produce identical Delta Tables
- **Dataflow Gen2** feels just like Excel Power Query — if your team knows Excel, they can do this
- **Semantic Model** is the bridge between raw data and business-friendly Power BI reports
- **Power BI Copilot** lets anyone build a professional report using plain English — no BI skills needed
- This pattern scales to **billions of transactions** without any extra work

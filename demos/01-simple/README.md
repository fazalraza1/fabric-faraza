# ⭐ Demo 01 — Simple: Load Bank Data into Fabric Lakehouse

**Time to run:** ~10 minutes  
**Audience:** Anyone — no technical background needed  
**What you'll learn:** How Microsoft Fabric stores and queries data like a database

> 🔧 **First time?** Make sure you have the prerequisites set up before starting.  
> 👉 [View Prerequisites & Setup Guide](../../PREREQUISITES.md)

---

## 🎯 What This Demo Shows

Imagine a bank has a list of customer accounts in a spreadsheet (CSV file).  
In this demo, we take that spreadsheet and load it into **Microsoft Fabric Lakehouse** —  
then we ask questions about the data using simple SQL, just like a search engine for your data.

---

## 📋 Steps Overview

1. Upload `sample_accounts.csv` to the Lakehouse
2. Load it into a Delta Table
3. Run SQL queries to explore the data
4. View results as a table

---

## 📁 Files in This Demo

| File | Purpose |
|------|---------|
| `data/sample_accounts.csv` | 500 fictional bank customer accounts |
| `notebooks/01_load_data.ipynb` | Notebook to load and query the data |
| `DEMO_SCRIPT.md` | Step-by-step guide for presenters |

---

## ▶️ How to Run

1. Open your `BankingLakehouse` in Microsoft Fabric
2. Upload `data/sample_accounts.csv` to the **Files** section
3. Open `notebooks/01_load_data.ipynb` in your workspace
4. Run each cell one by one (click ▶ or press Shift+Enter)

---

## 💬 Key Talking Points

- **Lakehouse** = a smart storage system that can hold any type of data
- **Delta Table** = a spreadsheet that Fabric can query super fast
- **No database admin needed** — Fabric handles everything automatically

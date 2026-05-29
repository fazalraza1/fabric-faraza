# ⭐⭐⭐ Demo 03 — Complex: Real-Time Bank Loan Fraud Detection

**Time to run:** ~30 minutes  
**Audience:** Business stakeholders + technical observers  
**What you'll learn:** How AI detects fraud automatically in real time using Microsoft Fabric

> 🔧 **First time?** Make sure you have the prerequisites set up before starting.  
> 👉 [View Prerequisites & Setup Guide](../../PREREQUISITES.md)

---

## 🎯 What This Demo Shows

Every second, banks process thousands of transactions. Hidden among them are fraudulent ones.  
This demo shows how Microsoft Fabric uses **Machine Learning (AI)** to automatically flag  
suspicious transactions — before the money leaves the account.

### The Story
> *"A customer's card is used at an overseas ATM — just 1 minute after a normal purchase downtown.  
> The AI catches this instantly and raises an alert. No human needed to spot it."*

---

## 🏗️ Architecture

```
Raw Transactions (CSV/Stream)
        ↓
  🥉 Bronze Layer (raw data)
        ↓
  🥈 Silver Layer (cleaned + features)
        ↓
  🤖 ML Model (fraud scoring)
        ↓
  🥇 Gold Layer (scored transactions + alerts)
        ↓
  📊 Power BI Dashboard (real-time fraud alerts)
```

---

## 📋 Steps Overview

1. **Ingest** — Load transaction data (Bronze)
2. **Feature Engineering** — Create fraud signals (Silver)
3. **Model Training** — Train AI to recognize fraud patterns
4. **Scoring** — Apply model to flag suspicious transactions (Gold)

---

## 📁 Files in This Demo

| File | Purpose |
|------|---------|
| `data/fraud_transactions.csv` | 30 transactions (some fraudulent) |
| `notebooks/01_ingest.ipynb` | Load raw transactions |
| `notebooks/02_feature_engineering.ipynb` | Build fraud signals |
| `notebooks/03_model_training.ipynb` | Train fraud detection model |
| `notebooks/04_scoring.ipynb` | Score and flag transactions |
| `DEMO_SCRIPT.md` | Full presenter guide |

---

## 💬 Key Fraud Signals Used

| Signal | Why It Matters |
|--------|---------------|
| Location jump | Card used in 2 cities within minutes |
| Transaction velocity | Too many transactions in a short time |
| Amount anomaly | Unusually large amount vs customer history |
| Merchant category | Wire transfers + unknown locations = high risk |

---

## ▶️ How to Run

Run notebooks in order: 01 → 02 → 03 → 04

> 💡 **Tip for presenters:** The model achieves ~95% accuracy on this dataset — great talking point!

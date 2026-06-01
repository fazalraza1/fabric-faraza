# 🏦 Microsoft Fabric Demos — Finance & Banking

Welcome! This repository contains hands-on Microsoft Fabric demos using **Finance & Banking** data.
Demos are designed to be easy to follow — even for non-technical audiences.

---

## 🗺️ How to Navigate

| Demo | Complexity | What It Shows |
|------|-----------|---------------|
| [01 - Lakehouse Fundamentals](./fabric-demos/01-lakehouse-fundamentals/README.md) | ⭐ Beginner | Load bank account data into Fabric Lakehouse & query it |
| [02 - Medallion Architecture](./fabric-demos/02-medallion-architecture/README.md) | ⭐⭐ Intermediate | Bronze → Silver → Gold pipeline, Semantic Model & Power BI Copilot report |
| [03 - AI-Powered Fraud Defense](./fabric-demos/03-ai-powered-fraud-defense/README.md) | ⭐⭐⭐ Advanced | Real-time fraud detection with ML end-to-end |
| [04 - Credit Risk Scoring](./fabric-demos/04-credit-risk-scoring/README.md) | ⭐⭐⭐⭐ Expert | Feature Store, LightGBM, MLflow, SHAP explainability, PSI drift monitoring |
| [05 - Medallion Architecture: Star Schema](./fabric-demos/05-medallion-architecture-complex/README.md) | ⭐⭐⭐⭐ Expert | 6-table star schema, fact/dim tables, complex JOINs, Gold KPI aggregations |
| [06 - Advanced Data Engineering](./fabric-demos/06-advanced-data-engineering/README.md) | ⭐⭐⭐⭐⭐ Expert | Incremental load, MERGE/upsert, data quality framework, Delta optimization, time travel, pipeline orchestration |

---

## 🚀 Before You Start

Read [PREREQUISITES.md](./PREREQUISITES.md) to set up your Fabric environment.

---

## 💡 Tips for Demos

- Each demo folder has a **`DEMO_SCRIPT.md`** — use it as your speaking guide
- Start with Demo 01 if your audience is new to Fabric
- All data is **fictional** — safe for any audience

---

## 📂 Repo Structure

```
fabric-faraza/
├── fabric-demos/
│   ├── 01-lakehouse-fundamentals/   ⭐      Load data → Lakehouse → Query
│   ├── 02-medallion-architecture/   ⭐⭐     Bronze/Silver/Gold → Semantic Model → Power BI
│   ├── 03-ai-powered-fraud-defense/ ⭐⭐⭐   Fraud detection with ML
│   ├── 04-credit-risk-scoring/      ⭐⭐⭐⭐  Feature Store + LightGBM + MLflow + SHAP
│   ├── 05-medallion-architecture-complex/ ⭐⭐⭐⭐  Star schema + fact/dim tables + KPI Gold layer
│   └── 06-advanced-data-engineering/      ⭐⭐⭐⭐⭐ Incremental load + MERGE + quality + time travel + orchestration
└── shared/
    ├── sample-data/     Reusable finance datasets
    └── setup-scripts/   Fabric workspace helpers
```

---

## 🔮 Coming Soon (Phase 3)

- Eventstream real-time ingestion demos
- Power BI Direct Lake demos
- Champion/Challenger model A/B testing
- Fairness & bias testing with Fairlearn

---

*Maintained by [@fazalraza1](https://github.com/fazalraza1)*

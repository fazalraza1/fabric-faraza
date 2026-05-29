# 🏦 Microsoft Fabric Demos — Finance & Banking

Welcome! This repository contains hands-on Microsoft Fabric demos using **Finance & Banking** data.
Demos are designed to be easy to follow — even for non-technical audiences.

---

## 🗺️ How to Navigate

| Demo | Complexity | What It Shows |
|------|-----------|---------------|
| [01 - Lakehouse Fundamentals](./demos/01-lakehouse-fundamentals/README.md) | ⭐ Beginner | Load bank account data into Fabric Lakehouse & query it |
| [02 - Medallion Architecture](./demos/02-medallion-architecture/README.md) | ⭐⭐ Intermediate | Bronze → Silver → Gold pipeline, Semantic Model & Power BI Copilot report |
| [03 - AI-Powered Fraud Defense](./demos/03-ai-powered-fraud-defense/README.md) | ⭐⭐⭐ Advanced | Real-time fraud detection with ML end-to-end |

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
├── demos/
│   ├── 01-lakehouse-fundamentals/   ⭐  Load data → Lakehouse → Query
│   ├── 02-medallion-architecture/   ⭐⭐  Bronze/Silver/Gold → Semantic Model → Power BI
│   └── 03-ai-powered-fraud-defense/ ⭐⭐⭐ Fraud detection with ML
└── shared/
    ├── sample-data/     Reusable finance datasets
    └── setup-scripts/   Fabric workspace helpers
```

---

## 🔮 Coming Soon (Phase 2)

- Advanced Data Science demos for experienced practitioners
- Eventstream real-time ingestion demos
- Power BI Direct Lake demos

---

*Maintained by [@fazalraza1](https://github.com/fazalraza1)*

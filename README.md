# 🏦 Microsoft Fabric Demos — Finance & Banking

Welcome! This repository contains hands-on Microsoft Fabric demos using **Finance & Banking** data.
Demos are designed to be easy to follow — even for non-technical audiences.

---

## 🗺️ How to Navigate

| Demo | Complexity | What It Shows |
|------|-----------|---------------|
| [01 - Simple](./demos/01-simple/README.md) | ⭐ Beginner | Load bank account data into Fabric Lakehouse & query it |
| [02 - Medium](./demos/02-medium/README.md) | ⭐⭐ Intermediate | Bronze → Silver → Gold data pipeline with loan transactions |
| [03 - Complex](./demos/03-complex/README.md) | ⭐⭐⭐ Advanced | Real-time fraud detection end-to-end |

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
│   ├── 01-simple/       ⭐  Load data → Lakehouse → Query
│   ├── 02-medium/       ⭐⭐  Medallion architecture (Bronze/Silver/Gold)
│   └── 03-complex/      ⭐⭐⭐ Fraud detection with ML
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

# 🧠 Demo 04 — Credit Risk Scoring

**Phase:** 2 — Advanced Data Science  
**Time to run:** ~45 minutes  
**Audience:** Experienced Data Scientists, ML Engineers, Data Platform Architects  
**What you'll learn:** End-to-end MLOps on Microsoft Fabric — feature engineering, model training, comparison, deployment, and monitoring

> 🔧 **Prerequisites:** Complete [Demo 02 — Medallion Architecture](../02-medallion-architecture/README.md) first, or ensure `bank_accounts` and `loan_transactions` Delta Tables exist in your `BankingLakehouse`.

---

## 🎯 What This Demo Shows

Using **Phase 1 data** (bank accounts + loan transactions) enriched with credit risk features, we build a production-grade **Credit Risk Scoring** model that predicts the probability of loan default.

This demo covers the **full MLOps lifecycle** on Microsoft Fabric:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREDIT RISK SCORING ARCHITECTURE                  │
│                                                                       │
│  Phase 1 Data             Feature Store          Model Training      │
│  ┌──────────────┐         ┌─────────────┐        ┌──────────────┐   │
│  │ bank_accounts│────────▶│             │        │  scikit-learn│   │
│  │ (Lakehouse)  │         │  credit_    │───────▶│  + MLflow    │──┐│
│  └──────────────┘         │  risk_      │        └──────────────┘  ││
│  ┌──────────────┐         │  features   │        ┌──────────────┐  ││
│  │loan_transact.│────────▶│  (Silver)   │───────▶│  LightGBM    │──┤│
│  │ (Lakehouse)  │         └─────────────┘        │  + MLflow    │  ││
│  └──────────────┘                                └──────────────┘  ││
│  ┌──────────────┐                                                   ││
│  │credit_risk_  │─────────────────────────────────────────────────▶││
│  │features.csv  │                                                   ││
│  └──────────────┘                                                   ││
│                                                                      ││
│  Model Registry           Batch Scoring           Monitoring         ││
│  ┌──────────────┐         ┌─────────────┐        ┌──────────────┐  ││
│  │  MLflow      │◀────────│  Best Model │        │ Data Drift   │  ││
│  │  Model       │         │  Selection  │───────▶│ Detection    │  ││
│  │  Registry    │         │  (AUC-ROC)  │        │ + Alerts     │  ││
│  └──────────────┘         └─────────────┘        └──────────────┘  ││
│          ▲                       │                                   ││
│          └───────────────────────┴───────────────────────────────────┘│
│                                                                        │
│  Gold Layer Output                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  gold_credit_risk_scores  (AccountID, DefaultProbability,       │ │
│  │                            RiskTier, ModelVersion, ScoredAt)    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Steps Overview

| Step | Notebook | What It Does |
|------|----------|-------------|
| 1 | `01_feature_engineering.ipynb` | Join Phase 1 data + enrich with credit features → Feature Store |
| 2 | `02_model_training_sklearn.ipynb` | Train Logistic Regression + Random Forest with scikit-learn + MLflow |
| 3 | `03_model_training_lightgbm.ipynb` | Train LightGBM with SynapseML + MLflow |
| 4 | `04_model_comparison.ipynb` | Compare models: AUC-ROC, confusion matrix, SHAP feature importance |
| 5 | `05_model_deployment.ipynb` | Register best model, batch score all accounts → Gold table |
| 6 | `06_model_monitoring.ipynb` | Data drift detection, performance monitoring |

---

## 📁 Files in This Demo

| File | Purpose |
|------|---------|
| `data/credit_risk_features.csv` | 500 accounts with credit risk attributes + default labels |
| `notebooks/01_feature_engineering.ipynb` | Feature Store creation |
| `notebooks/02_model_training_sklearn.ipynb` | scikit-learn models + MLflow |
| `notebooks/03_model_training_lightgbm.ipynb` | LightGBM + SynapseML |
| `notebooks/04_model_comparison.ipynb` | Model comparison + SHAP |
| `notebooks/05_model_deployment.ipynb` | Model registry + batch scoring |
| `notebooks/06_model_monitoring.ipynb` | Drift detection + monitoring |
| `DEMO_SCRIPT.md` | Presenter guide for experienced audiences |

---

## 🔑 Key Concepts Covered

| Concept | Where |
|---------|-------|
| Feature Store | Notebook 01 |
| MLflow Experiment Tracking | Notebooks 02, 03 |
| Hyperparameter logging | Notebooks 02, 03 |
| AUC-ROC, Precision/Recall | Notebook 04 |
| SHAP Explainability | Notebook 04 |
| MLflow Model Registry | Notebook 05 |
| Batch Scoring pattern | Notebook 05 |
| Data Drift (PSI) | Notebook 06 |
| Model Performance Monitoring | Notebook 06 |

---

## 💬 Key Talking Points

- **Fabric as an MLOps platform** — train, track, register, deploy, monitor all in one place
- **MLflow is native** — no external MLflow server needed, it's built into Fabric
- **Feature reuse** — the Feature Store table can be shared across multiple models and teams
- **Model comparison** — LightGBM typically outperforms sklearn on tabular data; demo shows why
- **SHAP explainability** — critical for model governance and regulatory requirements (SR 11-7)
- **Drift monitoring** — models degrade over time; Fabric can alert when retraining is needed
- **Phase 1 data reuse** — this demo builds on top of the Medallion Architecture from Phase 1

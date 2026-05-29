# 🎯 Demo Script — Credit Risk Scoring with Advanced ML
## Phase 2 | Audience: Experienced Practitioners (Data Scientists, ML Engineers, Risk Quants)

---

## Pre-Demo Checklist
- [ ] Fabric workspace open with Lakehouse attached
- [ ] Phase 1 data loaded: `bank_accounts`, `silver_loan_transactions` tables exist
- [ ] CSV uploaded: `Files/credit_risk_features.csv` in Lakehouse
- [ ] All 6 notebooks imported into workspace
- [ ] MLflow sidebar accessible (left nav in Fabric)

**Total Demo Time:** ~40 minutes

---

## Opening Hook (2 min)

> *"Every bank has a credit model. Most were built years ago, run in batch overnight, and can't explain their decisions to a regulator. Today I'll show you how Microsoft Fabric gives you a modern MLOps platform — experiment tracking, model registry, explainability, and drift monitoring — all in one place, with zero infrastructure to manage."*

**Key audience pain points to address:**
- "We use SAS/R models that are black boxes"
- "Our model validation takes 3 months of manual work"
- "We can't explain why the model rejected a customer"
- "We don't know when our model starts degrading"

---

## Architecture Overview (3 min)

> *"Here's what we're building today."*

Walk through the architecture:
```
Phase 1 Lakehouse              Phase 2 Data Science
─────────────────────          ──────────────────────────────────────
bank_accounts (Delta)    ──┐
silver_loan_transactions ──┼──► Feature Store ──► Train ──► MLflow
credit_risk_features.csv ──┘   (Silver)          Models    Tracking
                                                    │
                                             Model Registry
                                             (Production)
                                                    │
                                     Batch Scoring ──► gold_credit_risk_scores
                                                    │
                                             PSI Drift Monitor
```

> *"Notice we're reusing Phase 1 data. The Lakehouse is the single source of truth — we don't copy data into a separate ML system."*

**Talking point:** *"Traditional ML platforms require you to extract data to a separate store. Fabric's data science runs in-place on the same Delta Tables your analysts query. No data movement = no latency, no sync issues, no extra cost."*

---

## Step 1 — Feature Engineering (Notebook 01) | 7 min

**Open** `01_feature_engineering.ipynb`

### What to say:

> *"The first step in any ML project is building a Feature Store. This is where we join all our data sources into a single, clean, model-ready table."*

**Cell 1 — Load Phase 1 tables:**
> *"We're reading directly from Delta Tables we created in Phase 1. Notice — no JDBC connection strings, no passwords, no file paths. Just `spark.table('bank_accounts')`. This is the power of the Lakehouse."*

**Cell 2 — Aggregate transaction features:**
> *"For each account, we compute behavioural signals: total loan volume, average transaction size, number of distinct loans. These transaction patterns are often more predictive than static credit bureau data."*

**Cell 3 — Load credit risk CSV:**
> *"Now we bring in our new credit risk features: debt-to-income ratio, delinquency history, employment stability. These 14 features came from a bank's credit application system."*

**Cell 4 — Join into Feature Store:**
> *"We're joining 3 data sources into one 500-row Feature Store with 22 features. In production, this would be a streaming join updated in near-real-time as new applications arrive."*

**Cell 5 — Save to Silver layer:**
> *"The Feature Store is now a Delta Table. It's versioned, time-travel enabled, and shared across all 3 models we're about to train."*

**Cell 5 SQL — Credit score bands:**
> *"Look at this. Accounts with poor credit scores (<580) have a 55%+ default rate. Fair scores hover around 35%. This validates our data before we train a single model."*

**Audience question:** *"Should your Feature Store be a separate system like Feast?"*
> *"For most banks, a well-governed Delta Table with data quality rules is sufficient. Fabric's OneLake gives you unified access, versioning, and governance. Purpose-built feature stores add complexity that few teams actually need."*

---

## Step 2 — Model Training: scikit-learn (Notebook 02) | 8 min

**Open** `02_model_training_sklearn.ipynb`

### What to say:

> *"Now we train two classical models — Logistic Regression and Random Forest. Both are common in regulated industries because they're interpretable and well-understood by model validators."*

**Cell 1 — Feature prep:**
> *"We encode categoricals with LabelEncoder and split 80/20 with stratification — same class balance in train and test. This is critical when you have class imbalance (we have ~42% defaults)."*

**Cell 2 — Logistic Regression:**
> *"Logistic Regression with MLflow. One line: `mlflow.start_run()`. Everything inside that context manager is automatically tracked — parameters, metrics, the serialized model artifact. No boilerplate, no custom logging code."*

> *"The L2 regularization (C=0.1) helps prevent overfitting on small datasets. We'd tune this with cross-validation on a real dataset."*

**Cell 3 — Random Forest:**
> *"Random Forest with 200 trees. Notice we log the same metrics — AUC-ROC and Average Precision. Average Precision is often more informative than AUC-ROC when classes are imbalanced."*

**Cell 4 — View experiments:**
> *"This is where MLflow shines. Every model run is tracked — you can compare them, reproduce any run, and audit every model decision. Show the MLflow experiment sidebar in Fabric."*

**Navigate to MLflow UI (in Fabric left nav):**
> *"Here's your Experiment registry. Every run shows the parameters, metrics, and the model artifact. Your model validator can review this — no more spreadsheets tracking model versions."*

**Talking point — SR 11-7:**
> *"SR 11-7 from the Federal Reserve requires banks to document model development, validation, and ongoing monitoring. MLflow gives you a tamper-resistant audit trail out of the box. That's months of manual documentation work automated."*

---

## Step 3 — LightGBM Training (Notebook 03) | 5 min

**Open** `03_model_training_lightgbm.ipynb`

### What to say:

> *"LightGBM is a gradient boosting framework from Microsoft Research. It typically outperforms scikit-learn Random Forests on tabular data — and it's 10-100x faster on large datasets."*

**Cell 1 — Categoricals:**
> *"Notice we pass categoricals directly as Pandas category dtype. LightGBM handles them natively with optimal splitting — no label encoding needed."*

**Cell 2 — MLflow autolog:**
> *"One line: `mlflow.lightgbm.autolog()`. This automatically logs: all hyperparameters, training/validation loss curves, the model file, feature importances, and the conda environment. Zero manual logging."*

> *"Early stopping after 50 rounds prevents overfitting. The model stops when validation AUC plateaus — not when it hits the max iterations."*

**Cell 3 — Feature importance:**
> *"Look at the top features: CreditScore, DebtToIncomeRatio, NumDelinquencies. These match what a credit risk expert would expect — which is a good sanity check before presenting to a model validator."*

**Cell 4 — Cross-validation:**
> *"5-fold stratified CV. We're looking for low variance across folds — if fold 3 has much lower AUC than the others, we have a data quality issue or leakage."*

---

## Step 4 — Model Comparison + SHAP (Notebook 04) | 8 min

**Open** `04_model_comparison.ipynb`

### What to say:

> *"Now we pick the winner. Three models, one chart."*

**Cell 2 — ROC Curve:**
> *"LightGBM should show the highest AUC. But AUC alone isn't the decision. For credit risk, we care about the operating point — the threshold where we balance false positives (good customers rejected) against false negatives (defaults approved)."*

> *"The steeper the curve in the top-left, the better the model at any given threshold."*

**Cell 3 — Confusion Matrix:**
> *"Here's where the business conversation gets real. Each false negative represents a loan that will default. Each false positive is a good customer we turned away. What's your bank's tolerance for each?"*

**Business framing example:**
> *"If your average loan is $25,000 and your recovery rate on defaults is 40%, then each false negative costs you ~$15,000. A 5% improvement in recall on 10,000 loans is $7.5 million in avoided losses."*

**Cell 4 — SHAP:**
> *"SHAP — SHapley Additive exPlanations. This is the gold standard for model explainability, rooted in game theory."*

> *"For each prediction, SHAP tells us exactly which features pushed the score up or down. For the highest-risk account: 'CreditScore 485 pushed default probability +32%, DebtToIncomeRatio 0.67 pushed it +18%.'"*

**Regulatory talking point:**
> *"Under ECOA (Equal Credit Opportunity Act) and FCRA (Fair Credit Reporting Act), if you deny credit, you must provide the top reasons. SHAP gives you those reasons automatically — per customer, per prediction, defensible in court."*

---

## Step 5 — Model Deployment (Notebook 05) | 5 min

**Open** `05_model_deployment.ipynb`

### What to say:

> *"The model is good. Now we need to operationalize it."*

**Cell 1 — Find best run:**
> *"We query the MLflow tracking server for the run with the highest AUC-ROC. No manual checking — the code picks the winner."*

**Cell 2 — Model Registry:**
> *"Registering the model creates an immutable versioned artifact. Version 1 is always preserved — even if we train Version 2, you can always roll back. This is your model governance audit trail."*

> *"Promoting to Production means: this is the model that runs in batch scoring tonight."*

**Cell 3-4 — Batch scoring:**
> *"We load the Production model and score all 500 accounts. In production, this job would run on a schedule — nightly, hourly, or triggered when new applications arrive."*

**Cell 5 — Gold table:**
> *"The output is a Gold Delta Table: AccountID, DefaultProbability, RiskCategory, who scored it, when, and which model version. Full lineage — from raw data to risk decision."*

---

## Step 6 — Model Monitoring (Notebook 06) | 5 min

**Open** `06_model_monitoring.ipynb`

### What to say:

> *"The model is deployed. Now — how do you know when to retrain?"*

**Cell 2 — PSI:**
> *"Population Stability Index measures distribution shift. If your customers' credit scores start looking different from your training population, your model's predictions become unreliable."*

> *"PSI < 0.1: All good. 0.1-0.25: Watch it. > 0.25: Retrain now. This is a regulatory standard — used in DFAST stress testing frameworks."*

**Cell 3 — Feature drift:**
> *"We run PSI on every feature. In a real system, this runs weekly and alerts the model owner when any feature crosses the 0.1 threshold. No more finding out your model degraded when losses spike."*

**Cell 4 — SR 11-7 Checklist:**
> *"Here's what regulators want to see. We've automated 8 of 10 controls. The two remaining — fairness testing and champion/challenger — are the next sprint."*

**Closing:**
> *"What used to take a team of quants 3-6 months to build and validate — feature store, 3 model variants, MLflow tracking, SHAP explainability, PSI monitoring, audit trail — we just built in 40 minutes on a single Fabric workspace. No infrastructure, no data pipelines, no MLOps platform to maintain."*

---

## Q&A — Anticipated Questions

**Q: Can this run in real-time instead of batch?**
> *"Yes. Fabric Real-Time Intelligence + Eventstream can trigger scoring on each new loan application. Today's demo is batch for simplicity, but the model is the same."*

**Q: How do we handle model bias / fairness?**
> *"Great question — it's in the checklist as a next step. Fabric integrates with Fairlearn (Microsoft's open source fairness toolkit). You can measure demographic parity, equalized odds, and calibration across protected groups."*

**Q: What's the cost?**
> *"Fabric Data Science is included with F2 capacity and above. For 500 accounts, this entire pipeline runs in under 5 minutes. For 5 million accounts — maybe 20 minutes on F64."*

**Q: Can we use our own models (Hugging Face, custom PyTorch)?**
> *"Yes. MLflow's pyfunc wrapper accepts any Python model. We have customers running custom transformers for alternative credit data (social signals, transaction categorization) alongside LightGBM."*

**Q: How does this compare to Azure ML?**
> *"Azure ML is a standalone MLOps platform. Fabric Data Science is MLOps embedded directly in your data platform. If your data already lives in Fabric (Lakehouse), using Data Science here eliminates the data movement, the access management overhead, and the separate billing. For pure ML teams doing experimentation-heavy research, Azure ML has more advanced features. For bank data teams doing production scoring, Fabric is simpler."*

---

## Key Takeaways (Recap Slide)

| What we built | Time | Tool |
|---|---|---|
| Unified Feature Store (22 features, 3 sources) | 5 min | PySpark + Delta |
| 3 models trained & tracked | 10 min | scikit-learn + LightGBM + MLflow |
| SHAP explainability | 2 min | SHAP |
| Model Registry + Production promotion | 2 min | MLflow Model Registry |
| Batch scoring → Gold Delta Table | 3 min | Spark |
| PSI drift monitoring | 5 min | Python + Matplotlib |

**Total: ~40 min. Zero infrastructure. Fully auditable.**

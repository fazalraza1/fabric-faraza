# ⚙️ Demo 06 — Advanced Data Engineering

**Complexity:** ⭐⭐⭐⭐⭐ Expert  
**Audience:** Data Engineers, Platform Engineers, DataOps teams  
**Run Time:** ~45 min  
**Prerequisite:** Complete Demo 05 (star schema tables must exist)

---

## What This Demo Shows

Production-grade data engineering patterns that every serious banking data platform needs — but most demos skip entirely.

| Pattern | What it Solves | Notebook |
|---------|---------------|----------|
| Watermark-based incremental load | Process only new records — scalable to billions of rows | 01 |
| Delta MERGE (upsert) | Handle corrections and late-arriving data without duplicates | 02 |
| Data quality framework | Never let dirty data reach Gold — quarantine with reasons | 03 |
| OPTIMIZE + Z-ORDER | 10-100x query speedup on large tables | 04 |
| Time travel & restore | Regulatory audit trail, accidental change recovery | 05 |
| Pipeline orchestration | Production-grade run logging, error handling, alerting | 06 |

---

## Architecture

```
New Data Arriving Daily
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  PIPELINE RUN (logged to pipeline_run_log)            │
│                                                       │
│  01 Watermark Check ──► only load rows > last_wm      │
│        │                                              │
│        ▼                                              │
│  02 Quality Check ──► PASS ──► Silver                 │
│                   └──► FAIL ──► dead_letter table     │
│        │                                              │
│        ▼                                              │
│  03 MERGE ──► UPDATE changed | INSERT new             │
│        │                                              │
│        ▼                                              │
│  04 OPTIMIZE + Z-ORDER ──► faster downstream queries  │
│        │                                              │
│        ▼                                              │
│  05 Time Travel ──► immutable audit trail             │
│        │                                              │
│        ▼                                              │
│  06 Update Watermark + Log Success/Failure            │
└───────────────────────────────────────────────────────┘
```

---

## Source Data

| File | Description | Rows |
|------|-------------|------|
| `incremental_transactions.csv` | 3 daily batches of new transactions (Jan 2025) | 600 |
| `dirty_transactions.csv` | Mix of valid and intentionally bad records | 16 |

> **Note:** This demo also uses `fact_transactions`, `fact_loans`, `dim_customer`, `dim_branch` created in Demo 05.

---

## Tables Created

| Table | Description |
|-------|-------------|
| `pipeline_watermarks` | Watermark tracking per pipeline |
| `fact_transactions_incremental` | Incrementally loaded transaction records |
| `silver_transactions_validated` | Clean records passing all quality rules |
| `dead_letter_transactions` | Quarantined bad records with failure reasons |
| `pipeline_run_log` | Per-stage run history for all pipeline executions |

---

## Notebooks

| # | Notebook | Key Commands |
|---|----------|-------------|
| 01 | `01_incremental_load.ipynb` | Watermark `MERGE`, append-only Delta |
| 02 | `02_upsert_merge.ipynb` | `DeltaTable.merge()`, `whenMatchedUpdate`, `whenNotMatchedInsert` |
| 03 | `03_data_quality.ipynb` | Column validation, dead-letter table, quality score |
| 04 | `04_delta_optimization.ipynb` | `OPTIMIZE`, `ZORDER BY`, `VACUUM`, `ANALYZE TABLE` |
| 05 | `05_time_travel.ipynb` | `VERSION AS OF`, `TIMESTAMP AS OF`, `RESTORE TABLE` |
| 06 | `06_pipeline_orchestration.ipynb` | Stage runner, error handler, `pipeline_run_log` |

---

## Prerequisites
- ✅ [PREREQUISITES.md](../../PREREQUISITES.md) complete
- ✅ Demo 05 notebooks run (star schema tables exist)
- ✅ Upload `incremental_transactions.csv` and `dirty_transactions.csv` to Lakehouse `Files/`

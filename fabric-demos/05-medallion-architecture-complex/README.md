# 🏗️ Demo 05 — Medallion Architecture: Star Schema & Advanced Analytics

**Complexity:** ⭐⭐⭐⭐ Expert  
**Audience:** Data Engineers, Data Architects, Senior Analysts  
**Run Time:** ~45 min  
**Prerequisite:** Complete Demo 02 first (or have basic Fabric/Lakehouse familiarity)

---

## What This Demo Shows

A **production-grade Medallion Architecture** using 6 interconnected source tables, a full star schema, and Gold aggregation tables ready for Power BI Direct Lake.

| Concept | Demonstrated |
|---------|-------------|
| Multi-source Bronze ingestion | 6 CSVs → 6 Bronze Delta Tables |
| Star schema design | 5 Dimension + 2 Fact tables |
| Complex JOINs on Delta Tables | Transactions ↔ Customers ↔ Branches ↔ Dates |
| Referential integrity checks | Orphan detection, null key validation |
| Date dimension with time intelligence | Fiscal year, weekend flags, quarters |
| Pre-aggregated Gold tables | 4 KPI tables for Power BI |
| Customer 360 view | Combine transactions + loans per customer |

---

## Star Schema

```
                         ┌─────────────┐
                         │  dim_date   │
                         │  DateKey    │
                         └──────┬──────┘
                                │
┌──────────────┐   ┌────────────▼──────────────┐   ┌──────────────┐
│ dim_customer │──▶│      fact_transactions     │◀──│  dim_branch  │
│ CustomerID   │   │  TransactionID  (PK)       │   │  BranchID    │
│ FullName     │   │  AccountID      (FK)       │   │  BranchName  │
│ Segment      │   │  CustomerID     (FK)       │   │  Region      │
│ CreditTier   │   │  BranchID       (FK)       │   └──────────────┘
└──────────────┘   │  TransactionDateKey (FK)   │
       │           │  Amount                    │   ┌──────────────┐
       │           │  TransactionType           │   │  dim_account │
       │           │  Channel / Status          │──▶│  AccountID   │
       │           └────────────────────────────┘   │  AccountType │
       │                                            │  Balance     │
       │           ┌────────────────────────────┐   └──────────────┘
       └──────────▶│        fact_loans          │
                   │  LoanID         (PK)       │   ┌──────────────┐
                   │  AccountID      (FK)       │──▶│  dim_product │
                   │  CustomerID     (FK)       │   │  ProductID   │
                   │  ProductID      (FK)       │   │  ProductType │
                   │  BranchID       (FK)       │   │  RateRange   │
                   │  StartDateKey   (FK)       │   └──────────────┘
                   │  LoanAmount                │
                   │  InterestRate              │
                   │  IsDefault                 │
                   └────────────────────────────┘
```

---

## Source Data

| CSV File | Description | Rows |
|----------|-------------|------|
| `customers.csv` | 500 banking customers with demographics | 500 |
| `accounts.csv` | Bank accounts linked to customers | 500 |
| `branches.csv` | 10 bank branches across the US | 10 |
| `products.csv` | 10 loan products with rate ranges | 10 |
| `transactions.csv` | Transaction events (deposits, payments, transfers) | 2,000 |
| `loans.csv` | Active and historical loans | 500 |

---

## Demo Flow — 4 Notebooks

| # | Notebook | Layer | What It Creates |
|---|----------|-------|-----------------|
| 01 | `01_bronze_ingest.ipynb` | 🥉 Bronze | 6 raw Delta tables |
| 02 | `02_silver_dimensions.ipynb` | 🥈 Silver | 5 dimension tables |
| 03 | `03_gold_star_schema.ipynb` | 🥇 Gold | fact_transactions, fact_loans |
| 04 | `04_gold_aggregations.ipynb` | 🥇 Gold | 4 KPI aggregation tables |

---

## Tables Created

### Bronze (Raw)
- `bronze_customers`, `bronze_accounts`, `bronze_branches`
- `bronze_products`, `bronze_transactions`, `bronze_loans`

### Silver (Dimension Tables)
- `dim_customer` — 500 rows, enriched with AgeGroup, CreditScoreTier
- `dim_account` — 500 rows, enriched with BalanceTier
- `dim_product` — 10 rows, with RateSpread
- `dim_branch` — 10 rows, regional grouping
- `dim_date` — 2,192 rows (2020-2025), full time intelligence

### Gold (Fact + Aggregation Tables)
- `fact_transactions` — 2,000 rows, JOINed with all dims
- `fact_loans` — 500 rows, JOINed with all dims + IsDefault flag
- `gold_branch_performance` — KPIs per branch
- `gold_monthly_trends` — Monthly transaction trends
- `gold_customer_segments` — Segment profitability
- `gold_product_performance` — Product default rates

---

## Key SQL Queries You Can Demo

```sql
-- Customer 360: transactions + loans per customer
SELECT c.FullName, c.CustomerSegment, c.CreditScoreTier,
       COUNT(DISTINCT t.TransactionID) AS NumTransactions,
       COUNT(DISTINCT l.LoanID)        AS NumLoans,
       SUM(l.IsDefault)                AS Defaults
FROM dim_customer c
LEFT JOIN fact_transactions t ON c.CustomerID = t.CustomerID
LEFT JOIN fact_loans l        ON c.CustomerID = l.CustomerID
GROUP BY c.CustomerID, c.FullName, c.CustomerSegment, c.CreditScoreTier
ORDER BY NumLoans DESC;

-- Default rate by branch and product
SELECT b.BranchName, p.ProductType,
       COUNT(*) AS Loans,
       ROUND(SUM(l.IsDefault)*100.0/COUNT(*),1) AS DefaultRate_Pct
FROM fact_loans l
JOIN dim_branch  b ON l.BranchID  = b.BranchID
JOIN dim_product p ON l.ProductID = p.ProductID
GROUP BY b.BranchName, p.ProductType
ORDER BY DefaultRate_Pct DESC;
```

---

## Prerequisites
- ✅ Complete [PREREQUISITES.md](../../PREREQUISITES.md)
- ✅ Upload all 6 CSVs to Lakehouse `Files/` section
- ✅ Familiarity with Demo 02 (Medallion Architecture basics) recommended

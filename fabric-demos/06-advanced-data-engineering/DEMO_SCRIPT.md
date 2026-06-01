# 🎤 Demo Script — Advanced Data Engineering (Demo 06)

**Audience:** Data Engineers, Architects, DataOps leads  
**Duration:** 45–60 min (full) | 20 min (highlights: notebooks 01, 04, 05)  
**Prerequisites:** Demo 05 star schema tables must exist in the Lakehouse  

---

## Opening (2 min)

> *"Every bank I've worked with has the same three production problems: their pipelines re-process data they've already processed, their bad data silently corrupts Gold tables, and when an auditor asks 'show me the data as it was on March 31st' — no one knows how to answer that. Today we're going to solve all three."*

**Key questions to ask the room:**
- "How do you handle late-arriving transactions today?"
- "If a teller accidentally deletes 500 records, what's your recovery plan?"
- "How do you prove to an OCC examiner that your Q3 report numbers are accurate?"

---

## Notebook 01 — Incremental Load (8 min)

### Talking Points

**The problem with full reloads:**
> *"A full reload on a 500M-row transaction table takes hours and wastes compute. Incremental loading — only processing new rows — is the difference between a 2-hour pipeline and a 2-minute one."*

**What a watermark is:**
> *"A watermark is just a bookmark. We record the last date we processed, and next time we only look at rows after that date. It's simple, but it's the foundation of every scalable data pipeline."*

**Idempotency:**
> *"Notice we can re-run Batch 1 five times and the row count stays the same. That's idempotency — safe retries. This matters enormously in banking, where a failed pipeline at 2am might be retried automatically."*

### Key Demo Moments
- Show `pipeline_watermarks` table updating after each batch
- Run Batch 1 twice — demonstrate no duplicate rows
- Show the 3-batch row counts: 200 + 200 + 200 = 600

### Common Questions

**Q: How does this compare to CDC (Change Data Capture)?**  
A: Watermarks handle INSERT-heavy patterns well. CDC (using tools like Debezium or Azure SQL CDC) also captures UPDATEs and DELETEs at the source. For a full banking pattern you'd combine both — CDC from the source system, watermark for the Fabric processing layer.

**Q: What if the transaction date and arrival date differ?**  
A: Great question — this is the "late-arriving data" problem. You'd typically use an `ingestion_timestamp` as your watermark column rather than the business date, so a transaction from last Tuesday that arrives today still gets processed.

---

## Notebook 02 — Delta MERGE / Upsert (7 min)

### Talking Points

**Why not just overwrite?**
> *"Overwriting a Gold table every night means your BI reports flicker, your downstream models retrain on stale data during the write window, and you can't do time travel on 'versions'. MERGE gives you surgical precision."*

**The three MERGE operations:**
> *"MERGE handles three cases: UPDATE when the record already exists, INSERT when it's new, and optionally DELETE when it disappears from the source. It's the equivalent of an UPSERT in SQL Server."*

**SCD Type 2:**
> *"For compliance — FDIC exams, AML lookbacks — you often need to know not just the current state but every historical state. SCD Type 2 does this with `effective_from` / `effective_to` columns. I'm showing the pattern here so your team can extend it."*

### Key Demo Moments
- Show before/after MERGE on LOAN0001 balance and status
- Show the 2 new loans (LOAN0501, LOAN0502) inserted cleanly
- Show MERGE metrics: rowsUpdated vs rowsInserted

---

## Notebook 03 — Data Quality Framework (10 min)

### Talking Points

**"Good enough" data quality kills banks:**
> *"The CCAR 2014 failures at the big banks were partly attributable to poor data quality in stress testing inputs. Regulators now require banks to demonstrate 'data quality management as a first-class concern.'"*

**The dead-letter pattern:**
> *"Instead of failing the entire pipeline when we hit bad data, we quarantine it. Bad records go to `dead_letter_transactions` with a human-readable failure reason. The pipeline continues with clean data."*

**Rules as code:**
> *"Every quality rule is a PySpark column expression. This means they're testable, version-controlled, and reviewable by risk teams — not buried in some ETL tool's UI."*

### Key Demo Moments
- Show `dirty_transactions.csv` with 11 types of bad data
- Show the dead-letter table with `_failure_reasons` column
- Run a quick count: how many records passed vs failed
- Show the quality score dashboard cell

### Regulatory Angle
> *"SR 11-7 — the Fed's model risk management guidance — requires that all model inputs go through documented data validation. This framework gives you an auditable, version-controlled validation layer."*

### Common Questions

**Q: Can business users see the dead-letter table?**  
A: Absolutely — you can point a Power BI report at `dead_letter_transactions` and give the data steward team a self-service view of everything that needs correction.

**Q: What triggers an alert when quality degrades?**  
A: In notebook 06 we log quality check results to `pipeline_run_log`. You'd connect a Power BI alert or Teams webhook to that table to get notified when the failure rate exceeds a threshold.

---

## Notebook 04 — Delta Optimization (8 min)

### Talking Points

**Small files are a silent killer:**
> *"Every Spark write creates files. After 90 days of daily loads, you might have 500 small files where 5 large ones would be faster. OPTIMIZE compacts them — typically 10-50x query speedup."*

**Z-Ordering = a custom index:**
> *"Z-ORDER on `CustomerID` and `TransactionDate` means that when you query `WHERE CustomerID = 'CUST0123'`, Delta reads only the files likely to contain that customer instead of scanning everything. It's the closest thing to a clustered index in a data lakehouse."*

**VACUUM safety:**
> *"VACUUM deletes old file versions. The default is 7-day retention. For regulatory compliance, we typically set it to 90 days — matching the Fed's exam cycle."*

### Key Demo Moments
- Run `DESCRIBE HISTORY fact_transactions` before and after OPTIMIZE
- Show file count reduction in `DESCRIBE DETAIL`
- Show `VACUUM DRY RUN` — "what would be deleted" — before running

---

## Notebook 05 — Time Travel & Audit Trail (8 min)

### This Is the One Regulators Care About Most

> *"Delta time travel is the answer to the question regulators always ask: 'Show me the exact data you used for your Q3 DFAST submission.' With Delta, you just specify the timestamp and query. No data warehouses, no backup restores, no calling IT."*

**The RESTORE demo is the crowd-pleaser:**
> *"Watch this — I'm going to corrupt 400 loan records. [Run the corruption cell.] See? 400 records now say 'CORRUPTED'. In a traditional database you'd open a ticket, restore from backup, pray the backup is good. With Delta: RESTORE TO VERSION AS OF 3. Done. 5 seconds."*

### Regulatory Mapping

| Demo Feature | Regulation |
|-------------|-----------|
| `VERSION AS OF` snapshot | OCC model risk exam reproducibility |
| `DESCRIBE HISTORY` | SR 11-7 model change audit |
| `RESTORE TABLE` | Business continuity / incident response |
| 90-day retention policy | Fed examination cycle |

### Common Questions

**Q: How long does time travel history last by default?**  
A: 7 days by default. We set it to 90 days here. You can set it longer (years) but you pay storage costs for the retained files.

**Q: Is the transaction log tamper-proof?**  
A: It's append-only — you can't edit or delete entries from the transaction log without breaking Delta. Combined with storage-level RBAC, it provides strong audit integrity. For SOX-level controls, you'd also replicate logs to immutable storage.

---

## Notebook 06 — Pipeline Orchestration (7 min)

### Talking Points

**Why orchestration matters:**
> *"A notebook that someone runs manually at 8am is a demo. A notebook that runs every night at midnight, handles errors, retries failed stages, and sends a Teams alert if something breaks — that's production engineering."*

**The run log pattern:**
> *"Every stage writes a row to `pipeline_run_log`: what ran, how long it took, how many rows, and any error. This gives you a Power BI dashboard of pipeline health over time — no third-party monitoring tool required."*

### Key Demo Moments
- Show the pipeline running all 4 stages with ✅ indicators and timing
- Query `pipeline_run_log` — show stage names, durations, row counts
- Intentionally break a stage (rename a table) to show ❌ handling and error logging

### Extension Ideas
> *"In Fabric Data Factory, you can call a notebook as a pipeline activity and connect it to alert connectors. But the logging pattern we've built here works independently of the orchestrator — so even if you're running this from Airflow, dbt, or a custom scheduler, the audit trail stays in the lakehouse."*

---

## Closing (3 min)

> *"What we've built today is the engineering backbone that all those beautiful Power BI dashboards and ML models actually depend on. Incremental loads mean your pipeline scales without a rewrite. Quality checks mean your CFO's numbers are trustworthy. Time travel means your regulators can trust your audit trail. And orchestration means your engineers sleep at night."*

**Leave-behinds:**
- All notebooks are parameterized and can be used as templates
- The `pipeline_run_log` pattern connects directly to Power BI for monitoring dashboards
- The quality rules in notebook 03 are the foundation of a BCBS 239 data quality framework

---

## Appendix — Technical Deep Dives

### Watermark vs CDC vs Full Reload

| Approach | Best For | Handles Deletes? | Latency |
|----------|----------|------------------|---------|
| Full reload | Small tables (<1M rows), simple pipelines | ✅ Yes | Hours |
| Watermark | Insert-heavy, append-only tables | ❌ No | Minutes |
| CDC | Full fidelity change capture (INSERT/UPDATE/DELETE) | ✅ Yes | Seconds–minutes |
| Micro-batch (Structured Streaming) | Near-real-time (Kafka, Event Hub) | Partial | Seconds |

### Delta File Formats

| Format | Typical Size | When Used |
|--------|-------------|-----------|
| Unoptimized (after many small writes) | 1-16 MB each | After 30+ daily loads |
| After OPTIMIZE | 256 MB–1 GB each | Post-compaction |
| After ZORDER | Same size, different sort | Better predicate pushdown |

### Banking Regulatory Mapping

| Demo Feature | Primary Regulation | Requirement |
|-------------|-------------------|------------|
| Data quality framework | BCBS 239 | Principle 3: Data Accuracy |
| Pipeline run log | SR 11-7 | Change management audit |
| Time travel snapshots | OCC Examination Handbook | Model reproducibility |
| 90-day retention | Federal Reserve exam cycle | Evidence preservation |
| Dead-letter table | CCAR data quality | Input validation documentation |

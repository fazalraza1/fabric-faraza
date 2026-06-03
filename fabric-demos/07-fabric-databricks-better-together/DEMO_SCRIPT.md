# 🎤 Demo Script — Microsoft Fabric + Azure Databricks: Better Together

**Duration:** ~45 minutes  
**Audience:** Technical and non-technical — adjust depth per audience  
**Tone:** Consultative, not competitive. "Both platforms win together."

---

## Pre-Demo Setup (5 min before)

- [ ] Upload `data/transactions_raw.csv` to Fabric Lakehouse → Files/
- [ ] Open all 4 notebooks, attach `BankingLakehouse`
- [ ] Have the architecture diagram in the README open in a browser tab
- [ ] Clear all notebook outputs so you run live

---

## Opening — Set the Stage (3 min)

> *"I want to talk about a question I hear constantly from customers: 'We've already invested heavily in Databricks — should we look at Microsoft Fabric, or would that be a rip-and-replace?'"*

> *"The answer is: neither. Fabric and Databricks are not competing for the same job. They're complementary. Today I'm going to show you what that actually looks like in practice — with a real running pipeline that spans both platforms."*

**Draw the mental model:**
```
Databricks = the engine room     (data engineers, Spark, ML training)
Fabric     = the cockpit         (business users, Power BI, governance)
Delta Sharing = the connection   (zero-copy, no duplication, real-time)
```

---

## Step 1 — Databricks Side: Ingest & Transform (8 min)

**Open:** `01_databricks_ingestion.ipynb`

> *"This notebook simulates what your Databricks data engineering team does today. They ingest raw banking transactions from a landing zone, apply transformations, and write a Delta table. Nothing about this changes."*

**Run Cell 1 (imports):**
> *"Same PySpark API, same Spark version. If your team wrote this in Databricks, it runs here unchanged."*

**Run Cell 2 (raw ingest):**
> *"Raw transactions coming in from the landing zone — in Databricks this would be ADLS Gen2 or S3 with Auto Loader picking up new files automatically."*

**Run Cell 3 (transformations):**
> *"Databricks Delta Live Tables would automate these quality rules declaratively. Here we're doing it manually so you can see what DLT abstracts away. The output is a clean Delta table."*

> 🗣️ **Talking Point:** *"Notice the `_source` column — `databricks_ingestion_pipeline`. This is lineage metadata. Microsoft Purview picks this up and shows the full data journey from raw file to Gold table."*

**Run Cell 4 (Unity Catalog simulation):**
> *"Unity Catalog is Databricks' governance layer. Column-level masking, access policies, lineage. The key thing to know is that Purview integrates with Unity Catalog — so your governance is unified, not duplicated."*

---

## Step 2 — The Integration Point: Delta Sharing (8 min)

**Open:** `02_delta_sharing_onelake.ipynb`

> *"This is the most important notebook in the demo. This is where the two platforms meet."*

**Run Cell 1:**
> *"We're now on the Fabric side. We're reading the exact same Delta table that Databricks wrote. No copy. No ETL pipeline. No scheduled job. Just a pointer."*

**Run Cell 2 (read shared table):**
> *"All 20 records, all columns, immediately available. In production this is a OneLake Shortcut — a URL that points to the ADLS Gen2 container. Fabric reads the Delta files directly."*

> 🗣️ **Key Talking Point:** *"Your customer's #1 objection is usually: 'We already pay for Databricks storage, I don't want to pay for Fabric storage too.' Delta Sharing solves this completely. One copy of data, two platforms reading it. Storage billed once."*

**Run Cell 3 (time travel):**
> *"Because it's the same Delta format, Fabric inherits ALL Delta capabilities — time travel, ACID transactions, schema evolution. You're not losing any Delta feature by reading from Fabric."*

**Run Cell 4 (architecture print):**
> *"Walk through the architecture output. Zero data copies. Real-time. Storage billed in ADLS Gen2 once."*

**Run Cell 5 (Fabric enrichment):**
> *"And it's bidirectional. Fabric can enrich the data with its own business rules and write a Gold layer back. Databricks can then read that too. The integration is a two-way street."*

---

## Step 3 — Fabric Side: Semantic Model & Power BI (10 min)

**Open:** `03_fabric_semantic_model.ipynb`

> *"Now we're fully on the Fabric side. This is the part that business users and BI teams care about. The data engineering is done — now we surface it."*

**Run Cell 2 (KPI aggregations):**
> *"We're building Gold KPI tables — transaction volumes by region, channel, and risk tier. These feed directly into a Power BI semantic model."*

> 🗣️ **Talking Point:** *"Fabric's Direct Lake mode means Power BI reads these Delta tables in near-real-time — no import mode, no scheduled refresh, no stale dashboards. This is only possible because the underlying format is Delta."*

**Run Cell 3 (risk summary):**
> *"Risk teams, compliance officers, business analysts — they all get to query this table from Power BI, Excel, or the Fabric SQL endpoint. They never need to open a Databricks notebook."*

> 🗣️ **Non-technical talking point:** *"Think of it this way: your data engineers stay in their tool — Databricks. Your business users stay in their tool — Power BI and Excel. Fabric is the bridge that connects them without anyone having to learn a new platform."*

**Run Cell 4 (table summary):**
> *"Four tables ready — two from Databricks, two from Fabric enrichment. Open the Lakehouse, create a Semantic Model, select these Gold tables, and you're publishing Power BI reports in minutes."*

**Semantic Model walkthrough (manual in Fabric UI):**
1. Open **BankingLakehouse** → **New Semantic Model**
2. Select: `fabric_gold_transactions`, `gold_kpi_by_region`, `gold_risk_summary`
3. Click **Confirm**
4. Show relationships panel — drag `Region` to link tables
5. Add a measure: `Total Amount = SUM(fabric_gold_transactions[Amount])`
6. Open **New Report** — drag Region to axis, TotalAmount to values
7. Switch to Map visual — instant geographic distribution

> *"A business analyst just published a live Power BI report from data that a Databricks pipeline wrote 5 minutes ago. No IT ticket. No ETL job. No data warehouse refresh."*

---

## Step 4 — Unified ML: Train in Databricks, Serve in Fabric (10 min)

**Open:** `04_unified_ml_pipeline.ipynb`

> *"The last piece of the story — machine learning. Data scientists love Databricks. MLflow, AutoML, open-source ecosystem. We're not asking them to change any of that."*

**Run Cell 2 (feature prep):**
> *"Features come directly from the Databricks Gold table. The data scientist doesn't re-ingest or re-transform — they pick up where engineering left off."*

**Run Cell 3 (MLflow training):**
> *"This is standard MLflow. `start_run`, `log_param`, `log_metric`, `log_model`. This exact code runs in Databricks unchanged. The experiment is portable between platforms."*

> 🗣️ **Talking Point:** *"MLflow is the lingua franca of ML. Databricks invented it, Microsoft contributed to it, and Fabric supports it natively. Your data scientists don't rewrite anything."*

**Run Cell 4 (scoring in Fabric):**
> *"The model was registered in MLflow — trained in Databricks. We load it here in Fabric and score all transactions. Inference runs on Fabric compute — no Databricks cluster spinning up for every scoring job."*

> 🗣️ **Cost talking point:** *"Inference is cheap. Training is expensive. Run training on Databricks where your ML engineers live. Run inference on Fabric capacity where it's cheaper per operation. This is intelligent cost architecture."*

**Run Cell 5 (platform summary):**
> *"This is the complete picture. Read it out to the audience — Databricks owns engineering and training, Fabric owns serving and business consumption, and the seam between them is invisible to the end user."*

---

## Closing — The Better Together Summary (5 min)

> *"Let me leave you with the core message:*

> *Microsoft and Databricks have a formal partnership. This isn't a workaround or a customer-built integration — it's a supported, first-class architecture pattern. The OneLake shortcut, the MLflow API compatibility, the Purview-Unity Catalog integration — these are all product investments from both companies.*

> *For customers who have Databricks: Fabric doesn't replace it. It fills the gaps — enterprise BI, Teams integration, business user self-service, Power BI Direct Lake.*

> *For customers who have Fabric: Databricks doesn't replace it. It fills the gaps — the most powerful Spark engine, Delta Live Tables, the deepest MLflow ecosystem.*

> *Together they give you a full modern data platform with best-of-breed at every layer."*

---

## Q&A Preparation

**Q: Do we need to buy both products?**
> A: Only if you need both capabilities. Customers with heavy Spark workloads and large data engineering teams tend to keep Databricks. Customers whose primary consumer is Power BI and business analysts get more value from Fabric. Many enterprises use both.

**Q: What about data governance — do we need two systems?**
> A: No. Microsoft Purview is the single governance plane. It integrates with Databricks Unity Catalog via a connector — lineage, access policies, and audit logs flow into Purview automatically.

**Q: Is this production-ready or just a demo architecture?**
> A: Production-ready. The OneLake shortcut to ADLS Gen2, Delta Sharing protocol, and MLflow compatibility are all GA features. Multiple large financial institutions run this architecture today.

**Q: What about latency? How fresh is the Power BI data?**
> A: Direct Lake reads the Delta files directly — as soon as Databricks writes a new version of the Delta table, Power BI sees it on the next query. No scheduled refresh lag.

**Q: Can Databricks read back tables that Fabric writes?**
> A: Yes. It's bidirectional. Fabric writes Delta tables to OneLake (which is ADLS Gen2 under the hood). Databricks can mount the same ADLS path and read them. The integration works both directions.

**Q: What's the pricing model?**
> A: Fabric uses capacity units (CUs) on a reserved or pay-as-you-go model. Databricks uses DBUs. Storage is shared — billed once in ADLS Gen2. The cost optimisation story is: use Databricks compute for heavy Spark, use Fabric capacity for light BI workloads.

---

## Key Product Links to Share After Demo

- [Microsoft Fabric + Databricks integration docs](https://learn.microsoft.com/en-us/fabric/onelake/onelake-azure-databricks)
- [OneLake shortcuts overview](https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts)
- [Delta Sharing protocol](https://delta.io/sharing/)
- [Microsoft Purview + Unity Catalog](https://learn.microsoft.com/en-us/azure/databricks/data-governance/unity-catalog/azure-managed-identities)

---

*Part of the [Microsoft Fabric Demos](../../README.md) repository*

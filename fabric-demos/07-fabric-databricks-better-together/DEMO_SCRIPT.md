# 🎤 Demo Script — Microsoft Fabric + Azure Databricks: Better Together

**Duration:** ~45 minutes (20-min and 60-min variants below)  
**Audience:** Technical and non-technical — adjust depth per audience  
**Tone:** Consultative, not competitive. "Both platforms win together."

---

## Presenter Context

**Who's usually in the room:**
- **Data engineers / platform architects** — care about the OneLake shortcut mechanics, Delta format compatibility, and how authentication actually works (see the technical deep-dive below).
- **BI / business analysts** — care about Step 3 (Power BI Direct Lake) and want to see a report published live.
- **Data scientists / ML leads** — care about Step 4 (MLflow portability) and whether they have to rewrite anything.
- **Economic buyer / IT decision maker** — cares about the closing summary: cost, governance, and "do we have to rip out what we already own."

**The single objection to defuse in the first 60 seconds:** *"If we already have Databricks, why would we need Fabric — or vice versa?"* Everything in this script is built to answer that one question from a different angle at each step.

**What makes this demo credible:** every notebook actually runs — `01_databricks_ingestion.ipynb` executes on a live Databricks cluster against real ADLS Gen2 data (OAuth service-principal auth, not a shared storage key), and `02`–`04` execute in a real Fabric workspace reading that same data through a live OneLake shortcut. There is no mocked or pre-baked output — if a cell fails, it's a real signal (cluster asleep, shortcut misconfigured), not a script bug.

---

## Pre-Demo Setup (5 min before)

- [ ] Run `deploy/deploy.ps1` (or confirm it has already run) — it provisions the storage account, uploads `data/transactions_raw.csv` to the ADLS Gen2 `bronze` container, and configures the Databricks cluster's OAuth access to storage
- [ ] Open the Databricks workspace, import `01_databricks_ingestion.ipynb`, and attach it to `demo-cluster-*`
- [ ] Open the Fabric workspace, import `02_delta_sharing_onelake.ipynb`, `03_fabric_semantic_model.ipynb`, `04_unified_ml_pipeline.ipynb`, and attach them to `BankingLakehouse`
- [ ] Confirm the `silver` OneLake shortcut exists in `BankingLakehouse` → Files (see README.md "Post-Deployment Setup" step 2)
- [ ] Confirm the Databricks cluster is **Running**, not terminated (cold start takes 3–5 min and will kill your pacing if you don't check first)
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

> 🗣️ **Proof point to open with:** *"Everything you're about to see is running live against two separate, real cloud environments — a Databricks workspace and a Fabric capacity, in two different Azure regions if you want. Nothing here is pre-recorded or mocked."*

---

## Step 1 — Databricks Side: Ingest & Transform (8 min)

**Open:** `01_databricks_ingestion.ipynb` (in the Databricks workspace)

> *"This notebook runs directly on our Databricks cluster — nothing simulated. Your data engineering team ingests raw banking transactions from the ADLS Gen2 landing zone, applies transformations, and writes a Delta table to the shared storage account. Nothing about that workflow changes when Fabric is in the picture."*

**Run Cell 1 (storage config):**
> *"This just points the notebook at our demo storage account — in your environment this would already be wired up by your platform team."*
> 🗣️ **Talking Point:** *"This widget is the only thing that changes if you redeploy the demo under a different name — no code edits needed, which is exactly the kind of parameterization you'd want in a real job."*

**Run Cell 2 (imports):**
> *"Same PySpark API, same Spark version. If your team wrote this in Databricks, it runs here unchanged."*

**Run Cell 3 (raw ingest):**
> *"Raw transactions coming in from the ADLS Gen2 landing zone — in production, Auto Loader would pick up new files here automatically."*
> 🗣️ **Talking Point:** *"The `printSchema()` call is deliberate — always validate incoming schema before transforming. This is the same discipline Auto Loader's schema inference automates for you at scale."*

**Run Cell 4 (transformations & Delta write):**
> *"Databricks Delta Live Tables would automate these quality rules declaratively. Here we're doing it manually so you can see what DLT abstracts away. The output is a clean Delta table, written straight to the `silver` container in ADLS Gen2 — the exact same location Fabric will read from a moment from now."*

> 🗣️ **Talking Point:** *"Notice the `_source` column — `databricks_ingestion_pipeline`. This is lineage metadata. Microsoft Purview picks this up and shows the full data journey from raw file to Gold table."*
> 🗣️ **Talking Point:** *"The `CREATE TABLE ... USING DELTA LOCATION` line registers this as an external table inside Databricks too — so this data is queryable with `spark.table()` from either platform without anyone having to remember the raw ADLS path."*

**Run Cell 5 (Unity Catalog registration — illustrative):**
> *"Unity Catalog is Databricks' governance layer. Column-level masking, access policies, lineage. The key thing to know is that Purview integrates with Unity Catalog — so your governance is unified, not duplicated."*

> 🗣️ **Security talking point (if asked "how does Databricks authenticate to storage"):** *"Notice we never touch a storage account key anywhere in this notebook. The cluster authenticates to ADLS Gen2 with an Azure AD service principal using OAuth client-credentials — the same pattern you'd use in production. Storage account keys are disabled entirely in this environment by the tenant's security policy, and this architecture doesn't need them."* See the **Technical Deep-Dive** section below for the full mechanics if a data engineer wants specifics.

---

## Step 2 — The Integration Point: Delta Sharing (8 min)

**Open:** `02_delta_sharing_onelake.ipynb` (in the Fabric workspace)

**Before running anything: attach the lakehouse.** In the notebook's left panel, click **Lakehouses** → **Add lakehouse** → select `BankingLakehouse` (skip this if it's already attached from a prior session). Without an attached lakehouse, `Files/silver/...` won't resolve and Cell 2 will fail with a path-not-found error — that's a setup gap, not a platform limitation, so don't let it derail the pacing.

> *"This is the most important notebook in the demo. This is where the two platforms meet."*

**Run Cell 1 (imports & intro print):**
> *"We're now on the Fabric side, in a completely separate workspace and cluster from Databricks. We're reading the exact same Delta table that Databricks just wrote — through the `silver` OneLake shortcut. No copy. No ETL pipeline. No scheduled job. Just a pointer."*
> 🗣️ **Talking Point:** *"Notice there's no connection string, no credential, no `dbutils` call here. The lakehouse attachment you just did is the only 'plumbing' Fabric needs — the shortcut itself carries the storage credential."*

**Run Cell 2 (read shared table):**
> *"All records, all columns, immediately available. This is a real OneLake Shortcut — a pointer to the ADLS Gen2 `silver` container. Fabric reads the Delta files directly, with zero data movement."*

> 🗣️ **Key Talking Point:** *"Your customer's #1 objection is usually: 'We already pay for Databricks storage, I don't want to pay for Fabric storage too.' Delta Sharing solves this completely. One copy of data, two platforms reading it. Storage billed once."*
> 🗣️ **If asked "what if the shortcut breaks":** *"The shortcut is just metadata pointing at the ADLS path — if Databricks changes the underlying files, the shortcut doesn't need to be touched. If the storage account itself is renamed or moved, that's the one time you'd re-create the shortcut."*

**Run Cell 3 (time travel):**
> *"Because it's the same Delta format, Fabric inherits ALL Delta capabilities — time travel, ACID transactions, schema evolution. You're not losing any Delta feature by reading from Fabric."*
> 🗣️ **Talking Point:** *"This `DESCRIBE HISTORY` output is the Delta transaction log — the same log file Databricks wrote to. Fabric isn't re-deriving history, it's reading the exact same log. That's why time travel just works with zero extra configuration."*

**Run Cell 4 (architecture print + data quality check):**
> *"Walk through the architecture output. Zero data copies. Real-time. Storage billed in ADLS Gen2 once."*
> 🗣️ **Talking Point:** *"The null-count check at the bottom isn't just a demo flourish — it's exactly the kind of data-quality gate a Fabric data engineer would run before trusting a shared table enough to build a semantic model on it. Zero nulls here means the Databricks-to-Fabric hand-off didn't lose or corrupt anything."*

**Run Cell 5 (Fabric enrichment — write back):**
> *"And it's bidirectional. Fabric can enrich the data with its own business rules and write a Gold layer back. Databricks can then read that too. The integration is a two-way street."*
> 🗣️ **Talking Point:** *"Look at the `RiskTier` logic — that's pure Fabric-side business rule, added without touching a single line of the original Databricks pipeline. This is the 'separation of concerns' story: engineering owns ingestion, Fabric owns the last-mile business logic."*

> 🗣️ **Talking Point:** *"This is Delta Sharing, not a proprietary Fabric-only format. If a customer later wants a third engine — Synapse, open-source Spark, even Snowflake with Delta support — reading the same files, that works too. You're not locked into a two-vendor world; you're standardizing on an open storage format."*

---

## Step 3 — Fabric Side: Semantic Model & Power BI (10 min)

**Open:** `03_fabric_semantic_model.ipynb`

**Before running anything: attach the lakehouse.** Left panel → **Lakehouses** → **Add lakehouse** → `BankingLakehouse` (needed so `spark.table('fabric_gold_transactions')` in Cell 2 resolves against the tables Notebook 02 wrote). If it's already attached from Notebook 02 in the same session, you can skip this.

> *"Now we're fully on the Fabric side. This is the part that business users and BI teams care about. The data engineering is done — now we surface it."*

**Run Cell 1 (imports & intro print):**
> *"Same idea as before — plain PySpark, nothing Databricks-specific and nothing Fabric-specific either. This is standard Spark code your BI/analytics engineering team already knows."*
> 🗣️ **Talking Point:** *"We're building this semantic layer directly on top of the table Databricks wrote and Fabric enriched in the last notebook — there's no separate ETL job feeding a data mart. The Gold layer *is* the semantic layer's source."*

**Run Cell 2 (KPI aggregations):**
> *"We're building Gold KPI tables — transaction volumes by region, channel, and risk tier. These feed directly into a Power BI semantic model."*

> 🗣️ **Talking Point:** *"Fabric's Direct Lake mode means Power BI reads these Delta tables in near-real-time — no import mode, no scheduled refresh, no stale dashboards. This is only possible because the underlying format is Delta."*
> 🗣️ **Talking Point:** *"Notice this aggregation reads from `fabric_gold_transactions` — the table Notebook 02 wrote with the `RiskTier` business rule. Every downstream KPI table inherits that enrichment automatically."*

**Run Cell 3 (risk summary):**
> *"Risk teams, compliance officers, business analysts — they all get to query this table from Power BI, Excel, or the Fabric SQL endpoint. They never need to open a Databricks notebook."*

> 🗣️ **Non-technical talking point:** *"Think of it this way: your data engineers stay in their tool — Databricks. Your business users stay in their tool — Power BI and Excel. Fabric is the bridge that connects them without anyone having to learn a new platform."*
> 🗣️ **Talking Point:** *"The `UniqueAccounts`/`UniqueCustomers` distinct counts here are exactly the kind of exposure metric a compliance team would want refreshed continuously, not overnight — that's the Direct Lake pitch in one column."*

**Run Cell 4 (table summary):**
> *"Four tables ready — two from Databricks, two from Fabric enrichment. Open the Lakehouse, create a Semantic Model, select these Gold tables, and you're publishing Power BI reports in minutes."*
> 🗣️ **Talking Point:** *"This cell is a deliberate 'trust but verify' step — it counts rows in each table and surfaces any errors before you go build a semantic model on top of them. Same discipline you'd want in a real handoff between engineering and BI."*

**Semantic Model walkthrough (manual in Fabric UI):**
1. Open **BankingLakehouse** → **New Semantic Model**
2. Select: `fabric_gold_transactions`, `gold_kpi_by_region`, `gold_risk_summary`
3. Click **Confirm**
4. Show relationships panel — drag `Region` to link tables
5. Add a measure: `Total Amount = SUM(fabric_gold_transactions[Amount])`
6. Open **New Report** — drag Region to axis, TotalAmount to values
7. Switch to Map visual — instant geographic distribution

> *"A business analyst just published a live Power BI report from data that a Databricks pipeline wrote 5 minutes ago. No IT ticket. No ETL job. No data warehouse refresh."*

> 🗣️ **Governance talking point:** *"Row-level security, sensitivity labels, and Purview data classification all apply on top of this semantic model exactly as they would on any other Fabric dataset. Compliance doesn't have to choose between 'fast' and 'governed' — Direct Lake gives you both."*

---

## Step 4 — Unified ML: Train in Databricks, Serve in Fabric (10 min)

**Open:** `04_unified_ml_pipeline.ipynb`

**Before running anything: attach the lakehouse.** Left panel → **Lakehouses** → **Add lakehouse** → `BankingLakehouse` (Cell 2 calls `spark.table('fabric_gold_transactions')`, which needs the lakehouse attached to resolve).

> *"The last piece of the story — machine learning. Data scientists love Databricks. MLflow, AutoML, open-source ecosystem. We're not asking them to change any of that."*

**Run Cell 1 (imports & MLflow version check):**
> *"scikit-learn, MLflow, PySpark — the exact same libraries a Databricks data scientist would import. Nothing here is a Fabric-only API."*
> 🗣️ **Talking Point:** *"Printing the MLflow version is a small thing, but it's the point of the whole notebook: this is the same open-source MLflow client running inside Fabric that runs inside Databricks. There's no 'Fabric flavor' of MLflow to learn."*

**Run Cell 2 (feature prep):**
> *"Features come directly from the Databricks Gold table. The data scientist doesn't re-ingest or re-transform — they pick up where engineering left off."*
> 🗣️ **Talking Point:** *"The `IsFraud` label here is a simplified proxy for demo purposes — in production you'd have historical fraud labels from case management. The point isn't the model quality, it's that the data scientist starts from a trusted Gold table instead of re-building the pipeline."*

**Run Cell 3 (MLflow training):**
> *"This is standard MLflow. `start_run`, `log_param`, `log_metric`, `log_model`. This exact code runs in Databricks unchanged. The experiment is portable between platforms."*

> 🗣️ **Talking Point:** *"MLflow is the lingua franca of ML. Databricks invented it, Microsoft contributed to it, and Fabric supports it natively. Your data scientists don't rewrite anything."*
> 🗣️ **Talking Point:** *"Notice `data_source='databricks_pipeline_gold'` logged as a parameter — that's lineage baked directly into the ML experiment, not bolted on afterward. Auditors love this when they ask 'what data trained this model.'"*

**Run Cell 4 (scoring in Fabric):**
> *"The model was registered in MLflow — trained in Databricks. We load it here in Fabric and score all transactions. Inference runs on Fabric compute — no Databricks cluster spinning up for every scoring job."*

> 🗣️ **Cost talking point:** *"Inference is cheap. Training is expensive. Run training on Databricks where your ML engineers live. Run inference on Fabric capacity where it's cheaper per operation. This is intelligent cost architecture."*
> 🗣️ **Talking Point:** *"The `gold_fraud_scores` table this writes is immediately consumable by Power BI — same Direct Lake story as Step 3. A fraud analyst can be looking at scored transactions within seconds of this cell finishing."*

**Run Cell 5 (platform summary):**
> *"This is the complete picture. Read it out to the audience — Databricks owns engineering and training, Fabric owns serving and business consumption, and the seam between them is invisible to the end user."*
> 🗣️ **Talking Point:** *"If someone asks 'so what did Fabric actually do in this whole demo' — point back to this table. Two Databricks rows, three Fabric rows. Fabric did more of the last-mile work than people expect."*

---

## Closing — The Better Together Summary (5 min)

> *"Let me leave you with the core message:*

> *Microsoft and Databricks have a formal partnership. This isn't a workaround or a customer-built integration — it's a supported, first-class architecture pattern. The OneLake shortcut, the MLflow API compatibility, the Purview-Unity Catalog integration — these are all product investments from both companies.*

> *For customers who have Databricks: Fabric doesn't replace it. It fills the gaps — enterprise BI, Teams integration, business user self-service, Power BI Direct Lake.*

> *For customers who have Fabric: Databricks doesn't replace it. It fills the gaps — the most powerful Spark engine, Delta Live Tables, the deepest MLflow ecosystem.*

> *Together they give you a full modern data platform with best-of-breed at every layer."*

---

## Technical Deep-Dive — How Databricks Authenticates to ADLS Gen2 (if asked)

Keep this in your back pocket for data engineer / security-focused audiences — don't lead with it unless asked.

- **No storage account keys are used anywhere.** Many enterprise tenants now enforce a governance policy (e.g. Azure Security Baseline) that disables shared-key auth (`allowSharedKeyAccess = false`) on new storage accounts automatically. This architecture works regardless — it never depends on keys being enabled.
- **The cluster authenticates via an Azure AD app registration (service principal)** using the OAuth 2.0 client-credentials flow. `deploy.ps1` creates the app registration, grants it `Storage Blob Data Contributor` on the storage account, and stores the client secret in Key Vault.
- **The cluster's `spark_conf` carries five settings per storage-account hostname** (all under the `spark.hadoop.` prefix, which is what makes Databricks inject them into the Hadoop `Configuration` the ABFS driver reads): `fs.azure.account.auth.type=OAuth`, `fs.azure.account.oauth.provider.type=...ClientCredsTokenProvider`, `fs.azure.account.oauth2.client.id`, `fs.azure.account.oauth2.client.secret`, `fs.azure.account.oauth2.client.endpoint` (the tenant's OAuth token endpoint).
- **This is the same pattern Databricks recommends for production** — it's portable across regions/tenants and works whether or not shared-key access is enabled, so it's strictly more robust than key-based auth, not just a workaround.

---

## Timing Variants

**20-minute lightning version:** Opening (2 min) → Step 1 Cell 4 only + talking point (4 min) → Step 2 Cell 2 + Key Talking Point (5 min) → Step 3 Semantic Model walkthrough (6 min) → Closing (3 min). Skip Unity Catalog, time travel, and the ML pipeline entirely.

**60-minute deep-dive version:** Run the full 45-minute script as written, then add: the Technical Deep-Dive section live (open the Databricks cluster's Spark UI → Environment tab and show the `spark.hadoop.fs.azure.*` config values), a walkthrough of `deploy.ps1` to show the RBAC/service-principal automation, and open the full Q&A section below as a facilitated discussion rather than a one-way FAQ.

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

**Q: How does authentication work between Databricks and the storage account — do we need to share secrets?**
> A: No shared storage-account keys. Databricks authenticates via an Azure AD app registration (service principal) using OAuth client-credentials, scoped to `Storage Blob Data Contributor` on just that storage account. The secret lives in Key Vault, not in notebook code. See the Technical Deep-Dive section above for the full mechanics.

**Q: What if our tenant has strict security policies that lock down storage accounts?**
> A: This architecture is designed for that. It doesn't rely on `allowSharedKeyAccess` being enabled and doesn't require public network access exceptions beyond what your platform team already manages for the workspace's private endpoints. In a locked-down tenant you'd add private endpoints for the storage account and Databricks workspace — the OAuth auth pattern itself doesn't change.

**Q: How does this scale beyond a 20-row demo dataset?**
> A: Identically — Delta and Parquet are designed for petabyte-scale, partitioned datasets. The only things that change at scale are cluster sizing (Databricks) and capacity SKU (Fabric F64+), not the architecture pattern itself.

**Q: How does this compare to Snowflake or a competing lakehouse?**
> A: The differentiator here is OneLake being the *default* unifying storage layer for every Fabric workload (BI, ML, real-time, data warehouse) plus zero-copy access to data Databricks already owns. Competing stacks typically require an explicit data-sharing product or a second copy of the data to get the same effect.

**Q: What happens if the Databricks cluster is stopped when someone opens the Power BI report?**
> A: Nothing breaks. Direct Lake reads the Delta files directly from OneLake/ADLS Gen2 — it doesn't need the Databricks cluster to be running at query time. The cluster is only needed when new data is being written.

---

## Key Product Links to Share After Demo

- [Microsoft Fabric + Databricks integration docs](https://learn.microsoft.com/en-us/fabric/onelake/onelake-azure-databricks)
- [OneLake shortcuts overview](https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts)
- [Delta Sharing protocol](https://delta.io/sharing/)
- [Microsoft Purview + Unity Catalog](https://learn.microsoft.com/en-us/azure/databricks/data-governance/unity-catalog/azure-managed-identities)
- [Azure Databricks OAuth service principal access to ADLS Gen2](https://learn.microsoft.com/en-us/azure/databricks/connect/storage/azure-storage#connect-to-azure-data-lake-storage-gen2-and-blob-storage)
- [Fabric Direct Lake mode overview](https://learn.microsoft.com/en-us/fabric/get-started/direct-lake-overview)

---

*Part of the [Microsoft Fabric Demos](../../README.md) repository*

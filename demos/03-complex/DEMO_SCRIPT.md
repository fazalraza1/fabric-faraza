# 🎤 Demo Script — Demo 03: Real-Time Fraud Detection

**Presenter Time:** ~35 minutes  
**Audience:** Business stakeholders + technical observers

---

## 🌟 FABRIC INTRODUCTION (3 min)

> *"In the first two demos, we saw how Fabric stores, cleans, and organizes data. Today we're going to go further — we're going to add Artificial Intelligence to that data pipeline."*

> *"Microsoft Fabric includes a full Data Science workload — meaning you can train, evaluate, and deploy machine learning models right inside the same platform where your data lives. No need to export data to a separate AI tool. No data movement. No security gaps."*

> *"Fabric's Data Science workload is built on top of Apache Spark ML and integrates with MLflow — the industry standard for tracking machine learning experiments. Every model you train is versioned, logged, and reproducible."*

> *"And critically for banking — all of this runs inside your Microsoft tenant, behind your firewall, under your security policies. Your customer data never leaves your control."*

> *"Today's scenario is one of the most important use cases in banking: fraud detection."*

---

## 🟢 OPENING (2 min)

> *"Let me paint a picture. It's 10am on a Tuesday. One of your customers is buying coffee in downtown Chicago. At 10:01am — one minute later — their card is used at an ATM in London."*

> *"That's physically impossible. That's fraud."*

> *"In the old world, a human analyst might catch this hours later — or the next morning — after the money is already gone. A fraud analyst can review maybe 200 cases a day. But a large bank processes 10 million transactions daily."*

> *"Today I'm going to show you how Microsoft Fabric's AI catches fraud automatically, in real time, at any scale."*

---

## 📊 STEP 1 — Ingest Transaction Data (4 min)

**Action:** Upload `fraud_transactions.csv` → Open `01_ingest.ipynb` → Run all cells

> *"We're starting with 500 transactions. In production, this data would arrive via Fabric's Eventstream — a real-time data streaming capability that ingests transactions as they happen, millisecond by millisecond."*

> *"Let me explain the real-time ingestion options Fabric provides:"*

> *"**Eventstream** is Fabric's real-time data pipeline. It connects to event sources like Azure Event Hubs, Kafka, IoT Hub, or direct custom applications. Every time a card is swiped, a loan payment clears, or a wire transfer initiates — that event flows into Fabric instantly."*

> *"**Eventstream can also do real-time transformations** — like filtering, aggregating, or enriching events as they arrive, before they even land in the Lakehouse."*

> *"**For batch ingestion** — like end-of-day transaction files from a core banking system — Data Factory pipelines pick up files and load them into the Bronze Lakehouse table automatically."*

**[Show the loaded data]**

> *"Here are our 500 transactions. Look at the columns — Amount, Location, PreviousLocation, TimeSinceLastTxnMins, NumTxnLast24h. These are the raw signals."*

> *"Now I'll ask you — can you visually identify which ones are fraudulent just by looking at this table?"*

**[Pause — let audience attempt]**

> *"It's nearly impossible for a human to spot patterns across 500 rows. Now imagine 10 million rows arriving every hour. That's why we need AI."*

---

## 🔬 STEP 2 — Feature Engineering: Teaching AI What to Look For (6 min)

**Action:** Open `02_feature_engineering.ipynb` → Run all cells

> *"Before we train the AI, we need to do something called Feature Engineering. This is the process of taking raw data and turning it into signals that the AI can learn from."*

> *"Think of it like briefing a new fraud analyst. You wouldn't just hand them a spreadsheet and say 'find fraud'. You'd train them: look for these specific red flags."*

> *"Here are the four fraud signals — or 'features' — we're creating:"*

> *"**1. Location Jump** — Did the card appear in a different city within minutes of the last transaction? We calculate this by comparing the current Location to the PreviousLocation. If they differ, that's a red flag."*

> *"**2. High Velocity** — Is this customer making an unusually high number of transactions in 24 hours? More than 5 transactions in a day for a typical retail banking customer is suspicious. 15 transactions? That's almost certainly fraud."*

> *"**3. Amount Spike** — Is this transaction more than 5 times the customer's 30-day average spend? A customer who normally spends $65 making a $9,999 wire transfer is a major anomaly."*

> *"**4. Fast Repeat** — Did this transaction happen less than 5 minutes after the previous one? Combined with a location change, this is a near-certain fraud signal."*

**[Show the feature columns appearing in the output]**

> *"Each of these is now a 0 or 1 column — 0 means normal, 1 means red flag. The AI will learn which combinations of red flags predict fraud."*

> *"In production, you'd have dozens of these features — customer behavioral history, device fingerprints, merchant risk scores, network patterns. Fabric handles all of it."*

---

## 🤖 STEP 3 — Train the Fraud Detection Model (7 min)

**Action:** Open `03_model_training.ipynb` → Run all cells

> *"Now we train the machine learning model. We're using a Gradient Boosting classifier — one of the most accurate algorithms for fraud detection, used by major banks worldwide."*

> *"Here's what's happening under the hood in plain English:"*

> *"We're showing the model thousands of examples — 'here's a transaction that was fraud, here's one that wasn't'. The model learns the patterns. It figures out: when you see a location jump + high velocity + amount spike all together, that's almost always fraud."*

**[Run training cell]**

> *"Notice we're using MLflow — Microsoft Fabric's built-in experiment tracking system. Every time we train a model, MLflow automatically logs:"*
> *"- The accuracy score"*
> *"- The parameters we used"*
> *"- The training data version"*
> *"- The model file itself"*

> *"This means if your fraud patterns change — say fraudsters start using a new technique — you retrain the model with new data, and MLflow keeps the old version as a backup. You can always roll back."*

**[Show accuracy output]**

> *"The model achieves approximately 95% accuracy on this dataset. In the fraud detection world, that's excellent. Let me put that in business terms:"*

> *"If your bank processes 100,000 fraudulent transactions per year — which costs on average $500 each — that's $50 million in fraud losses."*

> *"At 95% detection rate, Fabric catches $47.5 million of that automatically. That's the ROI of this system."*

---

## 🚨 STEP 4 — Score Transactions & Generate Fraud Alerts (7 min)

**Action:** Open `04_scoring.ipynb` → Run all cells

> *"Now the moment of truth. We apply the trained model to all 500 transactions. Each transaction gets a Fraud Probability Score — a number between 0 and 100%."*

**[Run scoring cell, let results appear]**

> *"Look at this output. Every transaction now has a FraudScore_Pct. Let me highlight a few:"*

> *"Any transaction scoring above 50% gets flagged with a 🚨 ALERT. Let's look at the top ones..."*

> *"See those wire transfers to unknown locations with scores of 95-99%? The AI is extremely confident those are fraud. Those would trigger an automatic hold."*

> *"See the grocery store purchases scoring 2-5%? The AI is extremely confident those are legitimate. No action needed."*

> *"The cases in the 40-60% range? Those go to a human fraud analyst for review — the AI knows it's uncertain, so it escalates rather than guessing."*

**[Point to the Gold table save step]**

> *"These scored results are saved to the Gold layer — `gold_fraud_alerts`. This table is now available to:"*
> *"- Your **fraud operations team** via Power BI — real-time dashboard showing all active alerts"*
> *"- Your **core banking system** via API — to automatically place a hold on flagged cards"*
> *"- Your **customer service team** — so they can proactively call customers whose cards were flagged"*
> *"- Your **model monitoring system** — tracking accuracy over time and triggering retraining when needed"*

---

## ✅ CLOSING (3 min)

> *"What you just saw would have taken a team of 5 data scientists and 12 months to build from scratch five years ago. With Microsoft Fabric, we built it today."*

> *"Let me summarize the Fabric capabilities we used:"*
> *"- **Lakehouse**: Unified storage for all transaction data"*
> *"- **Delta Tables**: Fast, versioned, auditable data storage"*
> *"- **Notebooks**: Code environment for data engineering and ML"*
> *"- **MLflow**: Model tracking, versioning, and deployment"*
> *"- **Eventstream** (in production): Real-time transaction ingestion"*

> *"The business impact is clear: faster fraud detection means less money lost. Automated scoring means fewer fraud analysts doing manual review. Consistent AI-driven decisions mean fewer customer complaints from false declines."*

> *"And because this all lives in Fabric, under your security and governance policies, you can deploy this with confidence — knowing your customer data never leaves your control."*

---

## ❓ ANTICIPATED QUESTIONS

**Q: What happens when the AI gets it wrong — a false positive?**  
A: The system flags for review, not automatic block. For high-confidence scores (above 90%), an automatic hold might be placed with an immediate customer SMS notification. For medium scores, it goes to a human analyst. Thresholds are configurable.

**Q: How quickly does this work in production?**  
A: With Fabric Eventstream, transactions can be scored in under a second — fast enough to block a card before a fraudulent transaction completes.

**Q: How does the model improve over time?**  
A: Every confirmed fraud case becomes new training data. You schedule a monthly retraining job in Fabric that picks up new labeled data and produces an updated model. MLflow tracks all versions.

**Q: Is our customer data safe?**  
A: All data stays within your Microsoft tenant, processed in your Azure region. Fabric uses the same enterprise security as Azure, Microsoft 365, and Teams — trusted by banks and governments worldwide. It's also compliant with GDPR, SOC 2, ISO 27001, and PCI-DSS.

**Q: Can this work with our existing core banking system?**  
A: Yes — Fabric connects to Oracle, SAP, Temenos, FIS, Fiserv, SQL Server, mainframes, and hundreds of other systems via Data Factory connectors, APIs, or file-based pipelines.

**Q: What about explainability — can we explain to a customer why their card was blocked?**  
A: Yes — the model can output feature importance scores showing which signals drove the decision. "Your card was blocked because it was used in a different country 2 minutes after your last transaction." This is critical for regulatory compliance and customer trust.

**Q: How much does running this cost?**  
A: Fabric pricing is consumption-based — you pay for compute time used. For a bank processing 1M transactions/day, the scoring workload typically runs in under 5 minutes on a small Spark cluster. Contact your Microsoft account team for a tailored estimate.

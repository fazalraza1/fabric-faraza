# 🎤 Demo Script — Demo 03: Real-Time Fraud Detection

**Presenter Time:** ~30 minutes  
**Audience:** Business stakeholders + technical observers

---

## 🟢 OPENING (3 min)

> *"Let me paint a picture. It's 10am on a Tuesday. One of your customers is buying coffee in downtown Chicago. At 10:01am — one minute later — their card is used at an ATM in London."*

> *"That's physically impossible. That's fraud."*

> *"In the old world, a human analyst might catch this hours later — after the money is gone. Today I'm going to show you how Microsoft Fabric catches this in real time, automatically, using AI."*

---

## 📊 STEP 1 — Show the Raw Data (3 min)

**Action:** Upload `fraud_transactions.csv` → Open `01_ingest.ipynb` → Run all cells

> *"Here are 500 transactions from our bank. Some are normal — groceries, restaurants, gas stations. But some are fraudulent. Can you spot them?"*

**[Pause and let audience look]**

> *"It's hard, right? Now imagine doing this for 10 million transactions a day. That's where AI comes in."*

---

## 🔬 STEP 2 — Building Fraud Signals (5 min)

**Action:** Open `02_feature_engineering.ipynb` → Run all cells

> *"Before we train the AI, we need to teach it what to look for. These are called 'features' — think of them as red flags."*

**[Run cell and point to results]**

> *"Look at these signals we're calculating:"*

> *"- **Location jump**: Did the card move impossibly fast between locations?"*  
> *"- **Transaction velocity**: Is this customer doing 15 transactions in one hour? That's unusual."*  
> *"- **Amount anomaly**: A customer who normally spends $50 suddenly does a $9,999 wire transfer?"*

> *"The AI learns these patterns from historical data. It builds a mental model of what 'normal' looks like for each customer."*

---

## 🤖 STEP 3 — Training the AI Model (7 min)

**Action:** Open `03_model_training.ipynb` → Run all cells

> *"Now we train the model. We're showing it examples of both normal and fraudulent transactions — and asking it to learn the difference."*

**[Run training cell, show accuracy output]**

> *"The model achieves about 95% accuracy. That means out of every 100 fraud attempts, it catches 95 of them automatically."*

> *"And this model is stored in Fabric — it can be reused, updated, and improved over time."*

---

## 🚨 STEP 4 — Real-Time Scoring & Alerts (7 min)

**Action:** Open `04_scoring.ipynb` → Run all cells

> *"Now the magic. Every new transaction gets scored by the AI instantly."*

**[Run scoring cell, show flagged transactions highlighted]**

> *"Look at these flagged transactions. FRD002 — $1,200 at an overseas electronics store, 8 transactions in the last 24 hours, from a customer whose average spend is $65. The AI gave this a 94% fraud probability."*

> *"FRD009 — $9,999 wire transfer to an unknown location, just 1 minute after their last transaction. 99% fraud probability."*

> *"These alerts are now in the Gold layer — instantly available to your fraud team, your Power BI dashboard, and your automated block system."*

---

## ✅ CLOSING (3 min)

> *"What you just saw would have taken a team of data scientists 6-12 months to build from scratch two years ago. With Microsoft Fabric, we built it today."*

> *"The business impact: faster fraud detection means less money lost. Less manual review means lower operating costs. Happier customers means more trust."*

> *"And because this lives in Fabric, the model improves over time — every new fraud case makes it smarter."*

---

## ❓ ANTICIPATED QUESTIONS

**Q: What happens when the AI gets it wrong (false positive)?**  
A: The system flags for review — not automatic block. Human oversight is always in the loop for edge cases.

**Q: How quickly does this work in production?**  
A: With Fabric Eventstream, transactions can be scored in under a second.

**Q: Is our customer data safe?**  
A: All data stays within your Microsoft tenant. Fabric uses Azure's enterprise security — the same used by banks and governments worldwide.

**Q: Can this work with our existing banking systems?**  
A: Yes — Fabric connects to Oracle, SAP, SQL Server, Mainframes, and hundreds of other systems.

**Q: How much does this cost?**  
A: Fabric pricing is consumption-based — you pay for what you use. Contact your Microsoft account team for a tailored estimate.

# 🎤 Demo Script — Demo 01: Load Bank Data into Fabric Lakehouse

**Presenter Time:** ~10 minutes  
**Audience:** Business stakeholders, non-technical

---

## 🟢 OPENING (1 min)

> *"Today I'm going to show you something really exciting — how Microsoft Fabric can take a simple spreadsheet of bank data and turn it into something powerful that the whole organization can use and analyze."*

> *"Think of it like this: your team has a spreadsheet of customer accounts. Instead of it sitting on someone's desktop, Fabric puts it in a central, secure place where anyone can ask questions about it instantly."*

---

## 📤 STEP 1 — Upload the Data (2 min)

**Action:** Open `BankingLakehouse` in Microsoft Fabric

> *"Here's our Lakehouse — think of it as a smart data warehouse. Let me upload our bank account data."*

**Action:** Click **Files** → **Upload** → select `sample_accounts.csv`

> *"Just like uploading a file to OneDrive — but this is now queryable by thousands of people at once."*

---

## 📊 STEP 2 — Load into a Table (2 min)

**Action:** Open notebook `01_load_data.ipynb` → Run Cell 1

> *"Now we're converting that CSV file into a Delta Table. Delta is Microsoft's super-powered spreadsheet format — it's fast, reliable, and handles millions of rows easily."*

**Action:** Run Cell 2

> *"In just a few seconds, our 20 accounts are loaded. In real life, this could be millions of accounts."*

---

## 🔍 STEP 3 — Query the Data (3 min)

**Action:** Run Cell 3 (show all accounts)

> *"Now I can ask questions about the data. Watch how fast this is."*

**Action:** Run Cell 4 (show active savings accounts over $10,000)

> *"I just asked: show me all active savings accounts with a balance over $10,000. Instantly I can see those customers."*

> *"Imagine your risk team, your marketing team, your branch managers — all asking their own questions, all at the same time, no waiting."*

---

## ✅ CLOSING (1 min)

> *"What you just saw is the foundation of Microsoft Fabric. Data comes in — from spreadsheets, systems, databases — and instantly becomes available for the whole organization."*

> *"In our next demo, I'll show you how we can clean and organize this data automatically using what's called a Medallion Architecture."*

---

## ❓ ANTICIPATED QUESTIONS

**Q: Is this secure? Who can see this data?**  
A: Fabric has role-based access control — you control exactly who sees what, down to individual rows and columns.

**Q: What if we have millions of records, not just 20?**  
A: Fabric is built to handle billions of rows. The demo uses 20 to keep it fast and clear.

**Q: Can we connect this to Excel or Power BI?**  
A: Yes! Fabric connects directly to Power BI, Excel, and hundreds of other tools.

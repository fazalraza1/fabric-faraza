# Fabric App Demo: Narrative, Talking Points, and Demo Script

## What is a Fabric App?

A Microsoft Fabric App is a secure, data-driven web application hosted and governed inside Microsoft Fabric. Unlike a dashboard that primarily presents analytical results, a Fabric App can combine analysis with application behavior such as forms, write-back, approvals, saved scenarios, and operational workflows.

Rayfin provides the development framework used by this demo. Developers define data entities in TypeScript, and Rayfin provides:

- A managed SQL database in Fabric.
- Generated GraphQL APIs.
- Microsoft Entra single sign-on.
- Protected static hosting for the React frontend.
- Typed access to supported Fabric data sources.

This lets teams build an application around governed Fabric data without independently assembling database hosting, API infrastructure, authentication, and frontend hosting.

## How Fabric Apps are used

Fabric Apps are useful when people must do more than view a report:

1. **Analyze** governed information from Lakehouse, Warehouse, SQL database, or semantic-model sources.
2. **Decide** by changing assumptions, comparing scenarios, or reviewing recommendations.
3. **Act** by submitting forms, creating records, assigning work, or updating status.
4. **Govern** access through Entra identity, Fabric permissions, and server-side data policies.

Power BI can remain the best tool for rich business intelligence. A Fabric App complements it when the experience needs a custom workflow or write-back.

## Practical examples

### Supply-chain disruption management

Combine inventory, shipment, weather, and supplier data. Let planners simulate a port closure, select an alternate supplier, assign an action, and retain the decision history.

### Grant or program case management

Show program KPIs while allowing authorized staff to create cases, review supporting information, record decisions, and track follow-up work.

### Manufacturing quality operations

Display defect trends from a Lakehouse, let supervisors open corrective actions, assign owners, upload evidence, and mark actions complete.

### Sustainability and energy planning

Combine facility consumption, tariffs, emissions, and renewable-generation data. Let users compare investment scenarios and submit a selected plan.

### Customer or citizen service

Create a role-aware portal that presents trusted information, captures requests, tracks status, and gives internal teams an operational queue.

### This demo

The Fabric App Demo combines synthetic energy and trade indicators, identifies regional resilience risk, lets a user model a disruption, and persists a mitigation action.

## Presenter narrative

Energy resilience and economic resilience are often discussed in separate rooms. Grid operators watch demand, prices, and generation flexibility. Trade teams watch imports, ports, lead times, and critical materials. A disruption does not respect that organizational boundary.

Imagine a major port slowing just as a region reaches peak electricity demand. Replacement transformers, battery cells, solar modules, or semiconductors might already have long lead times. Leaders need one operating picture that shows where energy stress and trade dependency overlap, then turns that insight into an assigned response.

Fabric App Demo demonstrates that operating picture using synthetic indicators inspired by public Department of Energy and Department of Commerce sources. Fabric provides authentication, managed application data, generated APIs, and hosting.

### Core story

1. Begin nationally and identify elevated regional exposure.
2. Drill into one region and explain the transparent score drivers.
3. Trace risk to energy conditions and critical imported materials.
4. Simulate a grid, port, trade, or weather disruption.
5. Save the case and assign a mitigation action.
6. Close on one governed application experience secured by Entra identity.

> All values are fictitious and deterministic. They illustrate an application pattern and do not represent official government analysis.

## Key value messages

- **Cross-domain insight:** energy and trade exposure appear in one workflow.
- **Transparent analytics:** the score formula and source lineage are visible.
- **Actionable operations:** users create scenarios and assign mitigation work.
- **Governed by default:** Entra SSO, protected assets, item permissions, and row-level authorization.
- **Reliable demonstration:** deterministic synthetic data removes API-key and network risk.
- **Extensible architecture:** bundled indicators can later move to Fabric Lakehouse and Warehouse connectors.

## 15-minute demo script

### 0:00–1:30 — Frame the problem

**Show:** Sign in and open Executive overview.

**Say:** “Energy and trade risk are connected, but teams often analyze them separately. This Fabric App brings them into one protected operational experience.”

**Soundbite:** “One operating picture—from exposure to action.”

Call out the **Synthetic demo data** banner.

### 1:30–4:00 — Establish the national picture

**Show:** KPI cards, Regional resilience risk chart, and Priority watchlist.

**Say:** “The composite score is intentionally transparent. It weights grid stress, import dependency, price pressure, weather exposure, and port congestion.”

Select the highest-risk region.

### 4:00–6:00 — Explain the exposure

**Show:** Regional risk.

**Say:** “The score is not a black box. Here are the five contributing drivers, the regional electricity profile, trade exposure, and critical-material dependency.”

Select another region to demonstrate cross-filtering.

### 6:00–8:00 — Connect DOE and Commerce perspectives

**Show:** Energy conditions, then Trade dependencies.

**Say:** “The energy view follows the shape of EIA demand, price, and generation data. The trade view follows Census international trade concepts such as import share, value, and lead time. The values are synthetic so the demo is repeatable and needs no API keys.”

### 8:00–12:30 — Turn insight into action

**Show:** Disruption cases.

Create:

- Name: `Northeast transformer delay`
- Region: `Northeast`
- Event type: `Trade restriction`
- Severity: `4`
- Duration: `21`

**Say:** “The simulator starts with the regional baseline and adds a bounded severity and duration impact.”

Save the case, then add:

`Pre-position mobile transformers and alternate suppliers`

Mark the action complete. Refresh and show that the records persist.

### 12:30–14:00 — Explain governance

**Show:** Data dictionary.

**Say:** “Synthetic indicators are bundled and clearly labeled. User-created scenarios and actions are stored in a Rayfin-managed SQL database. A server-side owner policy ensures each signed-in user sees only their own records.”

### 14:00–15:00 — Close

**Say:** “Fabric Apps gives us the application frontend, Entra SSO, generated GraphQL API, managed SQL, and protected hosting in one governed Fabric item. A future release can replace bundled history with Lakehouse and Warehouse data without rebuilding the user journey.”

**Soundbite:** “Fabric turns governed data into a governed decision experience.”

## Optional technical appendix

Show:

1. `packages/data` entity decorators and owner policy.
2. `rayfin/rayfin.yml` protected hosting.
3. `npm run typecheck` and `npm test`.
4. `npx rayfin up --dry-run`.
5. Fabric App child items and deployment status.

## Q&A

### Why use a Fabric App instead of only a report?

A report is excellent for analysis. This scenario also needs write-back: users create disruption cases, change assumptions, persist decisions, and manage actions. The Fabric App adds that workflow around governed data.

### Why Rayfin?

Rayfin defines the backend from TypeScript entities. It provisions managed SQL, generates GraphQL APIs, integrates Fabric authentication, and deploys the frontend.

### Is this production ready?

Fabric Apps is a preview feature. This solution is a demonstration, not production policy software. Production adoption requires regional availability, capacity planning, security review, accessibility validation, monitoring, and source-data agreements.

### Are these government numbers?

No. Every displayed value is synthetic and labeled. DOE/EIA, Commerce/Census, and NOAA sources inspired the field design.

### How is risk calculated?

Thirty percent grid stress, 25% import dependency, and 15% each for energy price pressure, weather exposure, and port congestion. The method is illustrative and easy to audit.

### Can users see each other's scenarios?

Not by default. Rayfin compares the signed-in user's subject claim with each record's `owner_id` through a server-side policy.

### What changes in the advanced release?

The advanced release adds a Lakehouse medallion pipeline, curated Warehouse data, a Rayfin Fabric connector, server-side scenario functions, roles, audit history, and optional live public-data ingestion.

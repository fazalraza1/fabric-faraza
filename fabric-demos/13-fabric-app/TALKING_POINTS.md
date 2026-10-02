# U.S. State Energy Explorer — Demo Narrative

## One-sentence story

The U.S. State Energy Explorer turns real EIA electric-power and Census population designs into a
governed, protected Fabric App where users can compare generation, electricity consumption, fuel
mix, and data quality across every state and DC.

## What changed in Phase 2

- Synthetic energy, trade, risk, and disruption-scenario concepts were removed.
- Three Fabric notebooks now implement Bronze, Silver, and Gold Delta layers.
- The reporting window is the latest eight complete months common to both EIA datasets.
- Electricity consumption is EIA monthly retail sales MWh, not an invented demand series.
- Per-capita measures use Census Population Estimates Vintage 2025 design.
- The frontend has six energy-focused pages and renders no sample numbers when the connector is
  not configured.
- Fabric/Entra authentication and protected hosting remain intact.

## Architecture talking points

1. **Bronze preserves evidence.** It paginates EIA, records the source URL, batch ID, source
   metadata, retrieval time, raw strings, and a batch manifest.
2. **Silver enforces trust.** It maps canonical states and fuels, distinguishes suppression from
   missing values, rejects duplicate keys and negative reported values, and requires the 50 states
   plus DC for every selected month.
3. **Gold serves the app.** Five Delta tables expose documented grains, units, per-capita metrics,
   mix and intensity, rankings, trends, and freshness.
4. **The app fails honestly.** Connector IDs are environment-specific and unavailable before
   deployment, so the checked-in provider is intentionally unconfigured. No metadata or business
   values are fabricated.
5. **Identity stays protected.** Users still enter through Entra/Fabric auth, and hosted assets
   remain protected.

## Refreshed 12-minute demo script

### 0:00–1:30 — Frame the question

**Say:** “How do generation resources and electricity consumption differ across the United States,
and how fresh and complete is the underlying evidence?”

Open the app. Before connector wiring, use the setup-required screen to show that the product
refuses to display invented values.

### 1:30–3:30 — Show the data pipeline

Open the three notebooks in order:

1. Bronze reads EIA route metadata and selects the latest common eight months.
2. Silver shows suppression handling, state/fuel mapping, duplicate checks, and 51-jurisdiction
   gates.
3. Gold shows metric calculations and the five serving tables.

Call out secure EIA and Census key retrieval from Key Vault and the absence of secrets in source control.

### 3:30–5:00 — National overview

After a real connector is wired, open **National overview**. Select a month and explain:

- Total generation and retail sales use MWh.
- Consumption per person uses kWh/person.
- Carbon-free share and fossil dependency come from fuel-level generation.
- The generation-to-retail-sales ratio is labeled **supply balance proxy**, not a physical
  interchange balance.

Point to the EIA/Census source badge and the freshness/coverage badges.

### 5:00–6:30 — Eight-month trends

Open **8-month trends**.

**Say:** “The dates are not hardcoded. The pipeline intersects the two EIA sources, chooses the
latest common eight monthly periods, and calculates month-over-month change.”

At implementation time the expected window is December 2025 through July 2026; a future run moves
the window automatically.

### 6:30–8:30 — State comparison and detail

Open **State comparison**, select a month, and compare kWh/person and carbon-free share. Then open
**State detail** and select a state.

Explain generation per 1,000 residents, consumption per person, eight-month high/low, state rank,
and national median. “Not reported” is a deliberate null display—not zero.

### 8:30–10:00 — Fuel detail

Open **Fuel detail**. Filter by state and fuel.

Explain generation mix and fuel intensity:

```text
fuel intensity = consumption-for-electricity-generation MMBtu / generation MWh
```

Non-combustible fuels can legitimately have no thermal-input intensity.

### 10:00–11:00 — Methodology and data quality

Open **Methodology & quality**. Show:

- exact formulas and units;
- suppression and missing-value handling;
- 50 states plus DC coverage;
- duplicate/nonnegative checks;
- annual population caveat;
- source freshness.

### 11:00–12:00 — Close on governed delivery

**Say:** “Fabric provides the Lakehouse, Spark transformations, SQL endpoint, Entra identity, and
protected application hosting. Rayfin supplies typed application access once the real endpoint is
verified. The result is not merely a dashboard; it is an honest, governed data product.”

## Key definitions

- **Electricity consumption:** EIA state retail sales MWh.
- **Generation per 1,000 residents:** generation MWh ÷ population × 1,000.
- **Carbon-free:** mapped nuclear and renewable generation.
- **Fossil dependency:** mapped coal, natural-gas, petroleum, and other fossil generation.
- **Supply balance proxy:** generation ÷ retail sales; it ignores interstate interchange and
  therefore must not be presented as a physical balance.
- **Completeness:** observed jurisdiction/field coverage against the expected contract.

## Honest caveats

- EIA values can be revised after publication.
- EIA may suppress values; suppression remains null and labeled.
- Census Vintage 2025 is an annual population estimate applied to monthly energy periods.
- Retail sales measure electricity sold to end users; they are not identical to system load.
- Fuel-category mapping is documented code and should be reviewed when EIA adds source codes.
- The app cannot show data until a verified Lakehouse SQL analytics connector and generated typed
  entities exist.

## Q&A

### Are these official values?

The design reads real EIA and Census APIs when the Fabric notebooks run. This repository does not
contain a snapshot or sample fallback, so no values are shown before ingestion and connection.
The app itself is a demonstration, not an official government product.

### Why not call EIA directly from the browser?

That would expose the API keys and bypass the governed Lakehouse model. Both keys stay in Key Vault;
Fabric performs ingestion, validation, and curation before the app reads Gold tables.

### Why use retail sales as consumption?

It is the approved EIA monthly state measure for electricity sold to end users and provides a
consistent MWh denominator for the explorer. The UI names it clearly.

### Why is the connector missing?

Workspace and Lakehouse IDs are deployment-specific. Fabric source metadata must be generated by
the Rayfin CLI from a verified endpoint; hand-authored connector metadata would be dishonest.

### Is there app-owned SQL?

No. Phase 2 is read-only and removed obsolete scenario/action records. If saved comparisons,
bookmarks, or notes are added later, they should use owner-scoped Rayfin SQL and remain separate
from the curated Gold data.

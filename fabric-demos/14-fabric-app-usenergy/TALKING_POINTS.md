# U.S. Energy Explorer: Narrative, Talking Points, and Demo Script

## What this solution demonstrates

The U.S. Energy Explorer is a protected Microsoft Fabric App that turns public U.S. Energy
Information Administration (EIA) and Census data into a governed, application-ready analytical
experience.

The solution demonstrates the complete path from source ingestion to user experience:

```text
EIA Open Data + Census Population Estimates
                    |
          +---------+---------+
          |                   |
          v                   v
 One-time local REST     Fabric Bronze notebook
 loader -> ADLS raw      calls APIs directly
          |                   |
          v                   |
 Fabric Lakehouse shortcut    |
          +---------+---------+
                    |
                    v
       Bronze -> Silver -> Gold Delta tables
                    |
                    v
       Lakehouse SQL analytics endpoint
                    |
                    v
  Protected React + Rayfin Microsoft Fabric App
```

This is not only a dashboard demonstration. It shows how Azure and Fabric can acquire public
data, validate it, preserve source limitations, create reusable Gold data products, and deliver
those products through a custom authenticated application.

## Presenter narrative

Public energy data is valuable, but using it responsibly requires more than placing a chart over
an API response. Different datasets publish on different schedules, use different units, contain
suppressed values, and may be revised after publication. Population-normalized comparisons add
another source with its own release cadence.

The U.S. Energy Explorer demonstrates how to turn those independent sources into one governed
analytical product. Teams can either run a one-time local loader into ADLS or call the APIs
directly from a Fabric notebook. Fabric applies a medallion architecture, validates coverage,
calculates comparable metrics, and publishes curated Gold tables. A protected Fabric App then
gives users an accessible way to explore national trends, compare states, inspect fuel mix, and
understand the methodology behind every metric.

The key message is that the application does not hide uncertainty. Missing and suppressed values
remain null, incomplete periods are not presented as complete, and the reporting window is
selected from periods common to the required sources.

### Core story

1. Acquire EIA and Census data without embedding credentials in code.
2. Choose an immutable ADLS landing batch or direct Fabric Bronze ingestion.
3. Use a Fabric shortcut to make the landing zone available without copying it manually.
4. Standardize and validate the data through Bronze, Silver, and Gold layers.
5. Publish a stable five-table Gold contract through the Lakehouse SQL analytics endpoint.
6. Explore national, state, trend, and fuel insights in a protected Fabric App.
7. Close with lineage, freshness, completeness, and honest null handling.

## Key value messages

- **Flexible ingestion:** the demo supports a lightweight one-time ADLS landing or direct
  Fabric ingestion while preserving one Bronze contract.
- **Governed public data:** public APIs become validated and reusable organizational data
  products rather than direct browser dependencies.
- **Comparable state insights:** population normalization supports more meaningful comparisons
  than raw totals alone.
- **Transparent metrics:** definitions, units, lineage, caveats, freshness, and completeness are
  visible in the experience.
- **Honest data quality:** suppressed or missing values remain null and incomplete coverage
  blocks a healthy status.
- **Secure by default:** API keys are stored in Key Vault, ingestion uses Entra identities, and
  the application requires Microsoft Entra authentication.
- **Reusable pattern:** the same architecture can support other public, partner, or internal
  datasets that need controlled ingestion and custom application experiences.

## Important data statements

Use these statements consistently during the demonstration:

- The application uses public EIA Open Data and Census Population Estimates data.
- The application is not an official U.S. government product or recommendation.
- EIA may revise previously published values.
- Missing and suppressed values are not changed to zero.
- The pipeline selects the latest eight complete monthly periods common to the required EIA
  datasets.
- The expected geographic coverage is the 50 states plus the District of Columbia.
- Census population is an annual estimate applied to the selected monthly reporting window.
- The supply-balance metric is a simple generation-to-retail-sales proxy, not an
  interchange-adjusted physical power-flow balance.

## Key architecture talking points

### Ingestion choices

- **Option A:** a dependency-free local script calls both REST APIs and uploads Bronze-ready
  NDJSON plus immutable/latest manifests to ADLS using the signed-in Azure CLI identity.
- **Option B:** a Fabric notebook retrieves secrets through the workspace identity, calls both
  APIs, and writes Bronze directly.
- Both options select the same eight-period common window and produce the same Bronze schema.
- Run only one Bronze option for a refresh.
- Use a Fabric Data Pipeline with Option B when scheduling is required.

### Fabric data layer

- A Fabric workspace identity reads the Azure Storage landing zone.
- An ADLS Gen2 shortcut exposes the raw files in the Lakehouse.
- Bronze preserves source records and ingestion metadata.
- Silver standardizes jurisdictions, fuel mappings, units, value status, and natural keys.
- Gold calculates application-ready metrics and records freshness and completeness.
- The pipeline fails closed when required coverage or quality rules are not met.

### Gold data contract

| Table | Presenter description |
|---|---|
| `gold.gold_state_month_energy` | State, month, and fuel-level generation and intensity metrics |
| `gold.gold_state_month_electricity` | State/month totals, per-capita metrics, ranks, and shares |
| `gold.gold_state_population` | State and District of Columbia population reference |
| `gold.gold_national_month_summary` | National KPIs and the common eight-month trend window |
| `gold.gold_data_freshness` | Source periods, coverage, completeness, and health status |

### Fabric App layer

- The React application is hosted as a protected Fabric App.
- Microsoft Entra authentication gates the experience.
- A verified Lakehouse SQL analytics connector supplies typed Gold-table data.
- The app presents configuration and permission failures explicitly.
- It does not silently substitute sample values when the real connector or source is unavailable.
- Vega-Lite visuals use a shared Fabric visual component and adapt to the application theme.

## 15-minute demo script

### 0:00-1:30 - Frame the problem

**Show:** The solution architecture in the README or an architecture slide.

**Say:** "Public energy data is easy to find, but building a trustworthy analytical product
requires secure ingestion, aligned reporting periods, consistent units, quality checks, and a
clear explanation of missing values."

**Soundbite:** "The value is not just the chart; it is the governed path from source to decision."

### 1:30-3:00 - Explain secure ingestion

**Show:** The two ingestion choices, Key Vault, and the optional ADLS landing account.

**Say:** "For a one-time demo, the local loader retrieves secrets with the signed-in Azure
identity and writes an immutable ADLS batch. For an all-Fabric workflow, the Bronze notebook
retrieves the same secrets through the workspace identity and calls the APIs directly."

If appropriate, show the local loader result and latest manifest, or the Fabric notebook output.
Do not display API keys.

### 3:00-5:00 - Walk through the medallion architecture

**Show:** The Fabric Lakehouse shortcut and the three notebook stages.

**Say:** "The shortcut exposes the Azure landing zone to Fabric. Bronze preserves what arrived,
Silver standardizes the records and value-status semantics, and Gold publishes the metrics the
application is allowed to consume."

Call out the quality gate requiring 51 jurisdictions for each selected month.

**Soundbite:** "Gold is a contract, not just another transformation."

### 5:00-7:00 - Establish the national picture

**Show:** **National overview**.

**Say:** "The national page summarizes generation, retail sales, consumption per person,
reporting coverage, carbon-free share, fossil dependency, and a clearly labeled supply-balance
proxy."

Use the month selector and point to the freshness badges. Explain that retail sales are used as
the electricity-consumption measure.

### 7:00-8:30 - Show the common reporting window

**Show:** **8-month trends**.

**Say:** "The window is not a hard-coded set of dates. The pipeline intersects source
availability and selects the latest eight complete monthly periods common to the required EIA
routes."

Hover over a point to show retail sales and month-over-month change.

### 8:30-10:30 - Compare states fairly

**Show:** **State comparison**.

**Say:** "Raw totals answer one question, but per-capita measures make states with very different
populations easier to compare. Color adds the carbon-free generation share without replacing the
underlying values."

Select a month, compare several jurisdictions, and call out that null values are shown as not
reported rather than zero.

### 10:30-12:00 - Drill into one state

**Show:** **State detail**.

**Say:** "The state profile combines per-capita generation and consumption with state rank,
national median, carbon-free share, fossil dependency, month-over-month movement, and the
eight-month range."

Choose a state relevant to the audience and explain that ranks and medians are recalculated for
the selected monthly period.

### 12:00-13:30 - Explore the fuel lens

**Show:** **Fuel detail**.

**Say:** "This view separates generation mix from thermal input intensity. Fuel intensity is
meaningful for combustible fuels, while non-combustible sources may correctly remain null."

Change both the state and fuel filters. Compare the selected state's generation mix with the
leading states for one fuel.

### 13:30-14:30 - Prove transparency and quality

**Show:** **Methodology & quality**.

**Say:** "Every metric has a definition and limitation. The quality contract checks geographic
coverage, duplicate keys, negative values, common periods, and source completeness before the
data is considered healthy."

**Soundbite:** "Trust comes from showing the caveats, not hiding them."

### 14:30-15:00 - Close

**Say:** "Azure securely lands the public data, Fabric turns it into governed Gold products, and
the Fabric App delivers those products through a protected custom experience. This pattern can
be reused whenever a team needs more than a report over an unmanaged API call."

**Closing soundbite:** "From public source to governed insight, with quality visible at every
layer."

## Optional 30-minute technical extension

1. Review the Bicep resources, security settings, and post-deployment RBAC assignments.
2. Compare the one-time ADLS loader with the Fabric-direct Bronze notebook.
3. Open the Lakehouse shortcut and explain why the raw data remains in Azure Storage.
4. Run the Bronze, Silver, and Gold notebooks in sequence.
5. Query the five Gold tables through the SQL analytics endpoint.
6. Compare one SQL result with the corresponding application metric.
7. Show the connector configuration and typed provider boundary.
8. Demonstrate the setup-required or actionable error state in a non-production environment.
9. Review protected hosting and Microsoft Entra authentication.
10. Discuss monitoring, refresh scheduling, cost, and production hardening.

## Audience-specific emphasis

### For business and executive audiences

- Focus on comparable state insights, carbon-free share, fossil dependency, and transparent
  quality.
- Explain the architecture in terms of trust, reuse, and time-to-insight.
- Avoid spending time on notebook implementation details unless asked.

### For data and analytics teams

- Emphasize common-period selection, null preservation, natural-key validation, and the Gold
  contract.
- Show how the Lakehouse and SQL analytics endpoint decouple transformation from presentation.
- Discuss how additional energy, emissions, pricing, or weather data could extend the model.

### For application developers

- Emphasize protected hosting, Entra authentication, typed connectors, explicit loading and error
  states, and reusable visual components.
- Explain that the app consumes curated data rather than calling public APIs from the browser.

### For security and platform teams

- Emphasize Key Vault, Entra identities, RBAC, disabled anonymous access, disabled Storage shared
  keys, protected assets, and password authentication being disabled.
- Be clear that the learning template keeps authenticated public-network endpoints enabled for
  portability and that production network isolation must be evaluated separately.

## Q&A

### Why use a Fabric App instead of only a Power BI report?

Power BI remains an excellent choice for rich business intelligence. A Fabric App is useful when
the team wants a custom navigation model, application-specific interaction patterns, specialized
visual composition, or a path toward operational workflows around governed Fabric data. This
demo concentrates on the analytical application pattern rather than write-back.

### Is the application calling EIA and Census directly?

No. In Option A, a one-time local loader lands the source data in Azure Storage. In Option B, a
Fabric notebook calls the APIs and writes Bronze directly. In both cases, the browser consumes
only the curated Gold contract through the Lakehouse SQL analytics connector.

### Why use both Azure and Fabric?

Azure provides optional Key Vault and ADLS landing services. Fabric provides direct notebook
ingestion, shortcuts, Lakehouse processing, Delta tables, SQL access, governance, and the hosted
application experience. Teams choose the local ADLS path or the Fabric-direct path based on the
demo and operational requirements.

### Why is the reporting window limited to eight months?

Eight months keeps the learning experience focused while still demonstrating trend and
month-over-month analysis. More importantly, the dates are selected dynamically from complete
periods common to the required source datasets rather than assumed in advance.

### Why are some values blank or shown as not reported?

EIA may suppress or omit values. The solution preserves that source meaning as null rather than
changing it to zero, because zero would be a different business statement.

### Does carbon-free mean renewable?

No. In this solution, carbon-free generation includes nuclear plus mapped renewable generation.
The methodology page exposes the exact definition.

### Is the supply-balance proxy a measure of interstate electricity flows?

No. It is state generation divided by state retail sales. It can be useful as an orientation
metric, but it is not adjusted for imports, exports, losses, or physical power flows.

### Are the population-normalized values monthly population estimates?

No. Census population is an annual estimate applied across the selected monthly periods. That
limitation is documented in the methodology.

### What happens when a source is late or incomplete?

The pipeline records freshness and completeness. Required coverage failures prevent the month
from being represented as complete, and the app exposes the available status rather than
silently fabricating values.

### Is this production ready?

It is a deployable learning and demonstration project, not an official operational energy
system. Production adoption requires source agreements, capacity planning, accessibility and
security review, private-network evaluation, monitoring thresholds, support ownership, disaster
recovery, and organization-specific compliance controls.

### What does the deployment button create?

It creates Key Vault, an ADLS Gen2 Storage account, the private `raw` container, and the two API
secrets. It does not run ingestion, assign environment-specific user or workspace identities, or
create Fabric items.

### Why does the app show a configuration-required page?

The repository intentionally does not contain fabricated workspace IDs, Lakehouse IDs, generated
connector metadata, or query results. The app remains honest until a deployer verifies the target
Lakehouse, adds the connector, generates the required entities, and registers the provider.

### Can this pattern support other datasets?

Yes. The ingestion routes, Silver rules, Gold model, and application metrics would change, but
the core pattern—secure landing, medallion validation, a stable data contract, and a protected
Fabric App—is broadly reusable.

## Demo preparation checklist

- Confirm the selected ingestion option completed successfully without exposing keys.
- Confirm the latest manifest identifies three datasets and eight selected periods.
- Confirm every selected month contains 51 jurisdictions.
- Confirm all five Gold tables exist and the freshness status is healthy.
- Confirm the Fabric connector points to the intended workspace and Lakehouse.
- Confirm all six application pages load real Gold data.
- Spot-check at least one application value against the SQL analytics endpoint.
- Confirm null values render as not reported rather than zero.
- Confirm dark mode and the presentation display are readable.
- Confirm no environment-specific identifiers or credentials are visible.
- Keep the README architecture and troubleshooting sections available for technical questions.

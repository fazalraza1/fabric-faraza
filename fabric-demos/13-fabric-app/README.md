# U.S. State Energy Explorer

A protected Microsoft Fabric App for comparing electric-power generation and electricity
consumption across the 50 states and District of Columbia. The React experience is backed by
five curated Lakehouse Gold Delta tables built from real EIA and Census API designs.

> **No synthetic fallback:** until a real Lakehouse SQL analytics endpoint is configured, the app
> renders a setup-required state and no business values. This repository contains no EIA key,
> workspace ID, Lakehouse ID, or generated connector metadata.

## What Phase 2 includes

- EIA v2 monthly state/fuel generation and fuel consumption from
  `electricity/electric-power-operational-data`.
- EIA v2 monthly state retail sales MWh from `electricity/retail-sales`; retail sales are the
  explorer's electricity-consumption measure.
- Census Population Estimates API, Vintage 2025 design, for per-capita metrics.
- Bronze, Silver, and Gold Fabric PySpark notebooks tracked as valid `.ipynb` files.
- National overview, eight-month trends, state comparison, state detail, fuel detail, and
  methodology/data-quality pages.
- Protected Fabric hosting and Microsoft Entra authentication.
- A typed data-provider boundary for later Rayfin Lakehouse SQL endpoint wiring.
- Metric, period-selection, normalization, and configuration-state tests.

## Architecture

```text
EIA Open Data v2 ─┐
                  ├─ 01 Bronze ── 02 Silver ── 03 Gold Delta tables
Census PEP 2025 ──┘                                │
                                                   │ SQL analytics endpoint
                                                   ▼
Protected React app ◀─ Rayfin fabric-sqlanalytics connector
        │
        └─ Entra/Fabric authentication (assets remain protected)
```

The preferred target is one **schema-enabled Lakehouse** with `bronze`, `silver`, and `gold`
schemas. Use separate Lakehouses only when the target does not support schemas. All environment
values are external parameters (`dev`, `test`, or `prod`); IDs and secrets are never hardcoded.

## Gold contract

All tables are Delta tables under the `gold` schema. Numeric source values may be null when EIA
suppresses a value or when a value is genuinely missing. Nulls are never silently changed to zero.

### `gold_state_month_energy`

Grain: one row per `period`, `state_code`, `fuel_code`.

| Column | Type | Definition |
|---|---|---|
| `period` | string (`YYYY-MM`) | EIA reporting month |
| `state_code`, `state_name` | string | Postal code and canonical name |
| `fuel_code`, `fuel_name`, `fuel_category` | string | EIA source and `carbon_free`, `fossil`, or `other` |
| `generation_mwh` | double, nullable | Fuel generation |
| `consumption_for_eg_btu` | double, nullable | EIA source field retained for lineage |
| `consumption_for_eg_mmbtu` | double, nullable | Normalized thermal input |
| `generation_mix_pct` | double, nullable | Fuel generation ÷ state generation × 100 |
| `fuel_intensity_mmbtu_per_mwh` | double, nullable | Thermal input MMBtu ÷ generation MWh |
| `population` | long | Vintage 2025 population |
| `generation_mwh_per_1000_residents` | double, nullable | Generation ÷ population × 1,000 |
| `value_status` | string | `reported`, `suppressed`, or `missing` |
| `source`, `generation_unit`, `consumption_unit` | string | Lineage and explicit units |

### `gold_state_month_electricity`

Grain: one row per `period`, `state_code`.

| Column | Type |
|---|---|
| `period`, `state_code`, `state_name`, `source` | string |
| `population` | long |
| `generation_mwh`, `retail_sales_mwh` | double, nullable |
| `generation_mwh_per_1000_residents` | double, nullable |
| `electricity_consumption_kwh_per_person` | double, nullable |
| `carbon_free_share_pct`, `fossil_dependency_pct` | double, nullable |
| `supply_balance_proxy` | double, nullable |
| `retail_sales_mom_pct` | double, nullable |
| `retail_sales_eight_month_high_mwh`, `retail_sales_eight_month_low_mwh` | double, nullable |
| `retail_sales_state_rank` | integer |
| `retail_sales_national_median_mwh` | double, nullable |
| `completeness_pct` | double |

### `gold_state_population`

Grain: one row per state/DC.

`state_code string`, `state_name string`, `census_state_fips string`, `population long`,
`estimate_year integer`, `vintage string`, `source string`, `retrieved_at_utc timestamp`.

### `gold_national_month_summary`

Grain: one row per period.

`period string`, `population long`, `generation_mwh double`, `retail_sales_mwh double`,
`electricity_consumption_kwh_per_person double`, `carbon_free_share_pct double`,
`fossil_dependency_pct double`, `supply_balance_proxy double`,
`retail_sales_mom_pct double`, `reporting_jurisdictions long`,
`expected_jurisdictions integer`, `completeness_pct double`, `source string`.

### `gold_data_freshness`

Grain: one row per source dataset.

`dataset_name string`, `source string`, `latest_available_period string`,
`latest_selected_period string`, `earliest_selected_period string`,
`retrieved_at_utc timestamp`, `expected_jurisdictions integer`,
`actual_jurisdictions integer`, `completeness_pct double`, `status string`, `notes string`.

## Metric definitions and caveats

| Metric | Calculation / caveat |
|---|---|
| Generation per 1,000 residents | generation MWh ÷ population × 1,000 |
| Electricity consumption | retail sales MWh × 1,000 ÷ population = kWh/person |
| Generation mix | fuel generation ÷ state total generation × 100 |
| Fuel intensity | consumption-for-electricity-generation MMBtu ÷ generation MWh |
| Carbon-free share | nuclear + mapped renewable generation ÷ total generation × 100 |
| Fossil dependency | coal + natural gas + petroleum + mapped fossil generation ÷ total × 100 |
| Supply balance proxy | generation MWh ÷ retail sales MWh; **not** an interchange-adjusted power balance |
| Month-over-month | current retail sales minus prior month, divided by prior month |
| Eight-month high/low | state maximum/minimum retail sales within the selected window |
| State rank / national median | computed independently for each period |

EIA may revise values. Suppressed and missing values remain null. Census population is an annual
estimate applied to the eight monthly periods. Per-capita values therefore describe the selected
estimate basis, not a monthly population survey.

## Beginner setup: data to app

### 1. Install local prerequisites

Use these versions for the most predictable setup:

| Tool | Recommended | Minimum or note |
|---|---|---|
| Node.js | **24 LTS** | Node.js 20 or later |
| npm | **11.x** | Use the version bundled with Node.js 24 LTS |
| Git | **Latest stable** | Any currently supported Git release |
| Python | **3.11 or later** | Used only to regenerate the tracked notebook files |
| PowerShell | **7.4 or later** | Windows PowerShell 5.1 also supports the documented commands |

This app was validated with Node.js `24.11.0` and npm `11.16.0`. A Fabric workspace on active
capacity is also required.

```powershell
Set-Location .\13-fabric-app
npm install
```

Run all npm commands from this directory; do not create nested lockfiles.

### 2. Create the Lakehouse

In the target Fabric workspace:

1. Create a schema-enabled Lakehouse.
2. Note its display name only for now; do not paste IDs into source control.
3. Import the three notebooks from `notebooks/`.
4. Bind each notebook to this Lakehouse. The checked-in notebooks intentionally have no fabricated
   `metadata.dependencies.lakehouse` IDs.

### 3. Store the EIA key securely

Obtain keys from [EIA Open Data](https://www.eia.gov/opendata/register.php) and the
[Census Data API](https://api.census.gov/data/key_signup.html). Store both in Azure Key Vault
(for example as `eia-api-key` and `census-api-key`) and grant the Fabric notebook identity
permission to read them. Never put either key in a notebook parameter, `.env` file, source file,
or commit.

Pass these notebook parameters through a Fabric Variable Library or pipeline:

| Parameter | Example / purpose |
|---|---|
| `environment` | `dev`, `test`, or `prod` |
| `key_vault_url` | `https://<vault-name>.vault.azure.net/` |
| `eia_secret_name` | `eia-api-key` |
| `census_secret_name` | `census-api-key` |
| `eia_base_url` | `https://api.eia.gov/v2` |
| `census_population_url` | `https://api.census.gov/data/2025/pep/population` |
| `census_population_variable` | `POP_2025` |

Missing Key Vault configuration, secret access, endpoint variables, or API fields raises an
actionable error. There is no fallback key or older Census vintage.

### 4. Execute notebooks in order

1. **`01_bronze_ingest.ipynb`** — reads EIA route metadata, finds each route's monthly
   `endPeriod`, selects the eight months ending at the earlier date, validates both sources
   returned every selected period, paginates all rows, lands a batch manifest under `Files/`, and
   appends raw Delta rows with batch/source metadata.
2. **`02_silver_normalize.ipynb`** — takes the newest batch, maps the 50 states plus DC and EIA
   fuels, retains suppression status, checks duplicate keys/nonnegative values, validates 51
   jurisdictions for every month, and writes conformed Silver tables.
3. **`03_gold_energy_explorer.ipynb`** — calculates serving metrics, validates keys/ranges and
   51-jurisdiction coverage, writes the five Gold tables, and optimizes common filters.

Do not run Silver after a failed Bronze validation, or Gold after a failed Silver validation.
For scheduled operation, use a Fabric pipeline with sequential notebook activities, retry only
transient source failures, and alert rather than publishing a partial month.

The expected selected window on 2026-10-02 is December 2025 through July 2026, but the notebook
derives this dynamically and does not hardcode those dates.

### 5. Verify the Gold tables

In the Lakehouse SQL analytics endpoint, verify the tables and row coverage:

```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'gold';

SELECT period, COUNT(DISTINCT state_code) AS jurisdictions
FROM gold.gold_state_month_electricity
GROUP BY period
ORDER BY period;
```

Every selected month must report 51 jurisdictions. Investigate `gold.gold_data_freshness` before
connecting the app if any source is incomplete.

### 6. Add the Rayfin connector only after IDs are verified

The connector was deliberately **not** added in this implementation because workspace and
Lakehouse item IDs were unavailable. After the Lakehouse exists, sign in and discover it:

```powershell
npx rayfin login
npx rayfin connector types --json
npx rayfin connector search "<LAKEHOUSE_DISPLAY_NAME>" --type fabric-sqlanalytics --all-workspaces --json
```

Confirm one unambiguous result and use its exact `workspaceId` and `itemId`:

```powershell
npx rayfin connector add --type fabric-sqlanalytics `
  --workspace-id <WORKSPACE_ID> `
  --item-id <LAKEHOUSE_ITEM_ID> `
  --name stateEnergyLakehouse
```

Then:

1. Install the exact version-pinned frontend packages printed by `connector add`.
2. Run `npx rayfin connector inspect --name stateEnergyLakehouse`.
3. Inspect one row from each of the five `gold_*` entities. Do not guess column names.
4. Read the installed connector package's `package.json`, follow `rayfinDocs.dir`, and use its
   entity-generation command to generate only the five verified Gold entities.
5. Wire the generated aggregate schema in `packages/frontend/src/lib/connectors.ts` exactly as
   the CLI/package documentation instructs.
6. Implement an `EnergyDataProvider` adapter that maps generated entity results to the camel-case
   contracts in `packages/frontend/src/lib/energy-model.ts`.
7. Replace the two `null` values in
   `packages/frontend/src/lib/energy-provider.registration.ts` with alias
   `stateEnergyLakehouse` and the typed adapter instance.
8. Run the checks below. The configuration-required state should disappear only when both alias
   and provider are registered.

Do not create `rayfin/connectors/stateEnergyLakehouse/metadata.json` by hand and do not run
`connector add` with placeholder IDs.

### 7. Run locally

```powershell
npm run dev
```

Local development uses Rayfin/Fabric sign-in. The React content remains behind `AuthGate`, and
`assetAccess: protected` remains enabled.

### 8. Validate

```powershell
npm run typecheck
npm run build
npm run lint
npm test
npm run validate:visual
```

### 9. Preview and deploy later

No deployment is performed by this phase. Once the connector is complete and the user has
confirmed the target workspace:

```powershell
npx rayfin up --dry-run
npx rayfin up
npx rayfin up status
```

Verify protected sign-in, all six pages, source/freshness badges, filters, null display behavior,
and the five Gold tables. Never use `--force` without reviewing the plan and potential data loss.

## Regenerating notebook JSON

The checked-in `.ipynb` files are generated from:

```powershell
python .\scripts\build_energy_notebooks.py
```

Every code cell includes Fabric-required `outputs: []`, `execution_count: null`, and cell metadata.
Regenerate only when changing notebook source, and review the resulting notebook diff.

## Troubleshooting

- **EIA key error:** verify `key_vault_url`, secret name, and Key Vault access for the notebook
  identity. Do not paste the key into a cell.
- **Fewer than eight common months:** inspect both EIA route metadata and stop; do not invent or
  forward-fill periods.
- **Coverage is not 51:** inspect excluded/duplicate state rows and source revisions. Puerto Rico
  and territories are intentionally excluded; DC is included.
- **Connector search returns multiple items:** select by workspace name and ask the owner to
  confirm. Never choose by guess.
- **App remains in setup state:** both the connector alias and typed provider must be registered.
- **401/403:** confirm Fabric item permissions and rerun `npx rayfin login`.

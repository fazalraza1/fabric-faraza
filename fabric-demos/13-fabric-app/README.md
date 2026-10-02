# Fabric App Demo

A medium-complexity Microsoft Fabric App built with React, TypeScript, and Rayfin. It shows how a federal-style operations team could combine synthetic energy indicators inspired by the U.S. Department of Energy with trade indicators inspired by the U.S. Department of Commerce.

> **Demo notice:** All energy, trade, risk, and scenario values are synthetic. This is not an official U.S. government product, analysis, or recommendation.

## What the app demonstrates

- Protected Fabric hosting and Microsoft Entra single sign-on.
- A Rayfin-managed SQL database and generated GraphQL API.
- Owner-scoped disruption scenarios and mitigation actions.
- Interactive charts, regional drill-downs, tables, filters, and dark mode.
- A transparent composite resilience score.

## Architecture

```text
Protected React + Vite frontend
          |
          +-- Bundled deterministic demo indicators
          |
          +-- Rayfin typed client --> Generated GraphQL API
                                      |
                                      +-- SQL database in Fabric
                                          +-- DisruptionScenario
                                          +-- ActionItem
```

Synthetic read-only indicators are bundled for a reliable presentation. User-created scenarios and actions are persisted in Fabric and secured with a server-side owner policy.

## App pages

1. **Executive overview** — national KPIs, regional risk, and priority watchlist.
2. **Regional risk** — score drivers and regional energy/trade profile.
3. **Energy conditions** — demand trend and generation mix.
4. **Trade dependencies** — critical-material exposure.
5. **Disruption cases** — scenario simulator and action tracking.
6. **Data dictionary** — lineage, storage, and score formula.

## Beginner setup and deployment

### 1. Confirm Fabric prerequisites

Ask your Fabric administrator to confirm:

1. The tenant allows **Fabric Apps (preview)**.
2. Fabric Apps is supported in the tenant region.
3. The target workspace is assigned to Fabric capacity.
4. You have Contributor, Member, or Admin workspace access.

Tenant changes can take several minutes to propagate.

### 2. Install local tools

Use the following versions for the most predictable setup:

| Tool | Recommended version | Minimum or note |
|---|---|---|
| Node.js | **24 LTS** | Node.js 20 or later |
| npm | **11.x** | Use the npm version bundled with the recommended Node.js release |
| Git | **Latest stable release** | Any currently supported Git release |
| Visual Studio Code | **Latest stable release** | Recommended editor; not required to run the app |
| PowerShell | **7.4 or later** | The documented commands also work in Windows PowerShell 5.1 |

This demo was validated with Node.js `24.11.0` and npm `11.16.0`. Avoid odd-numbered, non-LTS Node.js releases for a beginner setup.

Verify the installed versions in PowerShell:

```powershell
git --version
node --version
npm --version
$PSVersionTable.PSVersion
```

### 3. Clone and install

```powershell
git clone https://github.com/fazalraza1/fabric-faraza-development.git
Set-Location .\fabric-faraza-development\13-fabric-app
npm install
```

Run commands from `13-fabric-app`, not the repository root. Do not install packages separately inside workspace subfolders.

### 4. Understand the project

| Path | Purpose |
|---|---|
| `packages/frontend` | React pages, charts, forms, and styling |
| `packages/data` | Rayfin entities and server-side permissions |
| `packages/shared` | Browser-safe TypeScript contracts |
| `rayfin/rayfin.yml` | Services, protected hosting, and deployment configuration |

Rayfin-generated `.env` files can contain deployment settings and are excluded by `.gitignore`. Never commit secrets.

### 5. Validate locally

```powershell
npm run typecheck
npm run build
npm run lint
npm test
npm run validate:visual
```

All commands must succeed. A warning about a large production JavaScript chunk is not a failed build.

### 6. Start the app

```powershell
npm run dev
```

The Rayfin CLI guides you through Fabric sign-in and workspace selection. Open the local URL and verify:

1. The synthetic-data banner is visible.
2. All six pages open.
3. The regional chart responds to selection.
4. Dark mode works.
5. A disruption case can be created.
6. Refreshing preserves the case.
7. The case can be updated and deleted.
8. An action can be created and marked complete.

Stop the process with `Ctrl+C`.

### 7. Preview deployment

```powershell
npx rayfin up --dry-run
```

Confirm the correct workspace and these services:

- Fabric authentication.
- SQL data service.
- Protected static hosting.

Do not deploy if the workspace is wrong.

### 8. Deploy and verify

```powershell
npx rayfin up
npx rayfin up status
```

After deployment:

1. Open the Fabric App item.
2. Confirm the SQL database child item exists.
3. Open the hosted app URL.
4. Confirm Microsoft Entra sign-in is required.
5. Create, reload, update, and delete a test scenario.
6. Grant consumers **Run and interact** permission.

Contributors who deploy need **Edit** permission.

### 9. Deploy later changes

```powershell
# Frontend only
npx rayfin up staticapp deploy

# Database schema only
npx rayfin up db apply

# Complete application
npx rayfin up
```

Never use `--force` for schema changes without reviewing the potential data loss.

## Risk formula

```text
Risk =
  30% grid stress
  + 25% import dependency
  + 15% energy price pressure
  + 15% weather exposure
  + 15% port congestion
```

Scenario projections add a bounded severity and duration impact. This is an illustrative demo method, not a validated policy model.

## Public-data inspiration and future adapters

| Domain | Candidate source | Future use |
|---|---|---|
| Electricity | [EIA Open Data](https://www.eia.gov/opendata/) | Demand, generation, prices, and balancing-region data |
| Trade | [Census International Trade APIs](https://www.census.gov/data/developers/data-sets/international-trade.html) | Commodity flows and partner concentration |
| Weather | [National Weather Service API](https://www.weather.gov/documentation/services-web-api) | Alerts and regional exposure |

Release 1 requires no public API keys. A future implementation should call credentialed APIs from a Rayfin Function, land raw responses in a Lakehouse Bronze layer, normalize them in Silver, publish curated Gold metrics, and read them through a Fabric connector. Never bundle API keys into the frontend.

## Troubleshooting

### Fabric Apps is unavailable

- Confirm a tenant administrator enabled Fabric Apps preview.
- Confirm regional availability and Fabric capacity assignment.
- Wait several minutes after tenant-setting changes.

### No workspace appears

- Confirm workspace capacity and Contributor-or-higher access.
- Ask a workspace administrator to grant access.

### Installation or startup fails

- Verify Node.js 20 or later.
- Confirm the terminal is in `13-fabric-app`.
- Run `npm install` only from that folder.

### Sign-in returns 401 or 403

```powershell
npx rayfin login
```

Retry after confirming workspace and item permissions.

### The app reports missing configuration

Start with `npm run dev`, not Vite directly. For a deployed app, redeploy and reload.

### Another user cannot open the app

Grant **Run and interact** permission on the Fabric App item.

### Scenario save fails

- Confirm the user is signed in.
- Confirm the SQL child item is healthy.
- Do not remove or rename `owner_id`; the row policy requires it.

### Static deployment is too large

Fabric Apps accepts a compressed static archive up to 100 MB. Remove source maps and large media.

## High-complexity roadmap

The next release can add a Lakehouse medallion pipeline, curated Warehouse or SQL analytics data, a Rayfin Fabric connector, server-side scenario functions, roles, audit history, and optional live public-data ingestion.

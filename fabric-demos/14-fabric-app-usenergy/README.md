# U.S. Energy Explorer for Microsoft Fabric

A deployable learning project that combines live U.S. Energy Information Administration (EIA)
energy data with U.S. Census population estimates, processes the data through a Microsoft Fabric
Lakehouse medallion architecture, and presents the curated results in a protected React and
Rayfin Fabric App.

The project is designed for workshops, demonstrations, and self-guided learning. It does not
deploy anything automatically from this repository. You decide when and where to deploy.

> **Data notice:** The application uses public EIA and Census APIs, but it is not an official
> U.S. government product or recommendation. EIA may revise historical values. Suppressed and
> missing values remain null rather than being changed to zero.

## What you will build

```text
EIA Open Data + Census Population Estimates
                    |
                    v
      Azure Function scheduled ingestion
                    |
                    v
    Azure Data Lake Storage raw landing zone
                    |
                    v
       Fabric Lakehouse shortcut to Azure
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

The Azure deployment creates:

- Azure Key Vault for the EIA and Census API keys.
- A hierarchical-namespace Storage account and private `raw` container.
- A Python Azure Function on Flex Consumption for scheduled and manual ingestion.
- Application Insights and Log Analytics for monitoring.
- Managed identity and least-privilege Key Vault and Storage role assignments.

The Microsoft Fabric portion is intentionally portal-guided so learners can see how the
Lakehouse, shortcut, notebooks, SQL analytics endpoint, connector, and Fabric App fit together.

## Solution features

- Live EIA electricity generation, electric-power fuel consumption, and retail-sales data.
- Live Census Population Estimates data for population-normalized metrics.
- The latest eight complete monthly periods common to the EIA source routes.
- State and District of Columbia comparisons.
- Electricity consumption per person.
- Generation per 1,000 residents.
- Carbon-free generation share and fossil dependency.
- Fuel mix and fuel-intensity analysis.
- Supply-balance proxy, month-over-month change, state ranking, and data completeness.
- Protected Fabric hosting with Microsoft Entra authentication.
- Honest configuration, loading, empty, and error states with no synthetic-value fallback.

## Repository layout

```text
fabric-app-usenergy/
├── .azure/
│   └── deployment-plan.md
├── azure-function/
│   ├── function_app.py
│   ├── host.json
│   ├── local.settings.json.example
│   └── requirements.txt
├── infra/
│   ├── main.bicep
│   ├── main.parameters.json
│   └── azuredeploy.json
├── notebooks/
│   ├── 01_bronze_ingest.ipynb
│   ├── 01a_bronze_from_azure_landing.ipynb
│   ├── 02_silver_normalize.ipynb
│   └── 03_gold_energy_explorer.ipynb
├── packages/
│   ├── data/
│   ├── frontend/
│   └── shared/
├── rayfin/
│   └── rayfin.yml
├── scripts/
│   ├── build_energy_notebooks.py
│   └── deploy-function.ps1
├── README.md
└── TALKING_POINTS.md
```

## Prerequisites

### Accounts and access

- An Azure subscription in the commercial Azure cloud.
- Permission to create resources in a resource group.
- Permission to create role assignments. Use **User Access Administrator** plus
  **Contributor**, or use **Owner**, at the target resource-group scope.
- A Microsoft Fabric workspace on active Fabric capacity.
- Workspace Contributor, Member, or Admin access.
- Permission to create a workspace identity or assistance from a Fabric administrator.
- An [EIA Open Data API key](https://www.eia.gov/opendata/register.php).
- A [Census Data API key](https://api.census.gov/data/key_signup.html).

### Recommended local tools

| Tool | Recommended | Purpose |
|---|---|---|
| Git | Latest stable | Clone and inspect the project |
| Node.js | 24 LTS | Build the Fabric App |
| npm | 11.x | Restore JavaScript workspaces |
| Python | 3.11 | Regenerate notebooks and develop the ingestion Function |
| Azure CLI | Latest stable | Validate or manually deploy Bicep |
| Azure Functions Core Tools | Version 4 | Publish the Function source |
| PowerShell | 7.4+ | Run the documented helper commands |

Check local versions:

```powershell
git --version
node --version
npm --version
python --version
az version
func --version
$PSVersionTable.PSVersion
```

## Step 1: Deploy the Azure services

The button opens the Azure Portal. After authentication, the portal lets you select:

- Subscription.
- An existing resource group or a new resource group.
- Azure region.
- Resource-name prefix and environment.
- EIA and Census API keys as secure parameters.
- The ingestion schedule.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Ffazalraza1%2Ffabric-faraza%2Fmain%2Ffabric-demos%2F14-fabric-app-usenergy%2Finfra%2Fazuredeploy.json)

The deployment button uses the public ARM template committed with this demo. The
authenticated/manual Bicep deployment commands below remain available for validation and
controlled deployments.

The API-key fields are ARM `secureString` parameters. Their values are not displayed in the
deployment history or template outputs. The deployment writes them directly to Key Vault.

### Region selection

The template defaults to the selected resource group's region, but you can choose another region
in the deployment form. Pick a region that supports Azure Functions Flex Consumption. All
regional services are deployed together in the selected region.

### Resource naming

You provide a short lowercase prefix such as `usenergy`. The template combines the prefix,
environment, and a deterministic unique suffix. This avoids common Storage, Key Vault, and
Function App naming collisions.

### What the button does not deploy

The button creates the Azure services and configuration. It does not:

- Publish the Python Function source.
- Create a Fabric workspace or capacity.
- Create Fabric Lakehouse, notebook, shortcut, or application items.
- Add a Rayfin connector, because your Fabric workspace and Lakehouse IDs do not exist yet.
- Deploy the Fabric App.

Those steps are intentionally completed after the infrastructure deployment.

### Review or deploy the Bicep manually

The readable source is `infra/main.bicep`. The portal button uses the compiled
`infra/azuredeploy.json`.

```powershell
git clone https://github.com/fazalraza1/fabric-faraza.git
Set-Location .\fabric-faraza\fabric-demos\14-fabric-app-usenergy

# Compile and inspect without deploying
az bicep build `
  --file .\infra\main.bicep `
  --outfile .\infra\azuredeploy.json

# Sign in only when you are ready to validate or deploy
az login
az account show --output table

# Validate against an existing resource group
az deployment group validate `
  --resource-group <RESOURCE_GROUP> `
  --template-file .\infra\main.bicep `
  --parameters location=<REGION> `
               namePrefix=usenergy `
               environment=demo `
               eiaApiKey='<EIA_KEY>' `
               censusApiKey='<CENSUS_KEY>'

# Deploy manually instead of using the button
az deployment group create `
  --resource-group <RESOURCE_GROUP> `
  --template-file .\infra\main.bicep `
  --parameters location=<REGION> `
               namePrefix=usenergy `
               environment=demo `
               eiaApiKey='<EIA_KEY>' `
               censusApiKey='<CENSUS_KEY>'
```

Avoid placing real API keys in shell history. For an interactive deployment, omit the secure
parameters and allow Azure CLI to prompt, or use a protected local parameter file excluded by
`.gitignore`.

## Step 2: Record the Azure deployment outputs

Open the completed Azure deployment and record these outputs:

- `functionAppName`
- `keyVaultName`
- `keyVaultUri`
- `storageAccountName`
- `storageBlobEndpoint`
- `rawContainerName`
- `applicationInsightsName`

You can also retrieve them with:

```powershell
az deployment group show `
  --resource-group <RESOURCE_GROUP> `
  --name <DEPLOYMENT_NAME> `
  --query properties.outputs `
  --output table
```

Do not commit output files containing resource IDs or environment-specific names.

## Step 3: Publish the Azure Function source

The deployment button creates an empty Function App so that infrastructure deployment remains
reviewable and independent from source publishing.

```powershell
Set-Location .\fabric-faraza\fabric-demos\14-fabric-app-usenergy
.\scripts\deploy-function.ps1 -FunctionAppName <FUNCTION_APP_NAME>
```

The script runs:

```powershell
func azure functionapp publish <FUNCTION_APP_NAME> --python
```

The Function contains:

- A timer trigger controlled by the `INGEST_SCHEDULE` app setting.
- A function-key-protected `POST /api/ingest` endpoint for manual refresh.
- Managed-identity access to Key Vault and Storage.
- Retry handling for EIA/Census throttling and transient server errors.
- A Bronze-ready NDJSON file plus immutable and latest manifests in the `raw` container.

The default schedule is `0 0 6 * * *`, which runs daily at 06:00 UTC. This does not imply that
source data changes daily; it allows a newly published monthly period to be discovered without
manual intervention.

### Run the first ingestion

In the Azure Portal:

1. Open the Function App.
2. Select **Functions**.
3. Open `manual_energy_ingestion`.
4. Select **Get Function URL** and copy the default function-key URL.
5. Send an HTTP `POST` request.

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri '<FUNCTION_URL_WITH_KEY>'
```

The successful response includes `batch_id`, `selected_periods`, row counts, and the
`bronze_records_path`. Treat the URL as a secret because it contains a function key.

### Confirm ingestion

Verify:

1. The Storage account `raw` container contains `energy/latest.json`.
2. A dated batch folder contains `manifest.json` and `bronze_records.jsonl`.
3. Application Insights shows a successful Function execution.
4. No API key appears in logs, files, or responses.

## Step 4: Create the Fabric workspace identity

In the target Fabric workspace:

1. Open **Workspace settings**.
2. Create or enable the workspace identity.
3. Record its object/principal ID.
4. In Azure, open the deployed Storage account.
5. Open **Access control (IAM)**.
6. Assign **Storage Blob Data Reader** to the Fabric workspace identity.

The Azure deployment cannot assign this permission because the Fabric workspace identity is
created later and differs for every learner.

If your organization does not allow workspace identity, create the shortcut using an
administrator-approved organizational account or service principal. Do not store credentials in
the repository.

## Step 5: Create the Fabric Lakehouse and Azure shortcut

1. In the Fabric workspace, create a **schema-enabled Lakehouse**.
2. In the Lakehouse, create a new shortcut under **Files**.
3. Select **Azure Data Lake Storage Gen2**.
4. Use the deployed Storage account endpoint.
5. Select the `raw` container.
6. Authenticate with the workspace identity when available.
7. Name the shortcut exactly:

   ```text
   us-energy-raw
   ```

8. Confirm this file can be browsed:

   ```text
   Files/us-energy-raw/energy/latest.json
   ```

The Storage account permits authenticated public-network access because Fabric must reach it.
Anonymous blob access and shared-key authentication are disabled. For production workloads,
consider private networking after validating Fabric and Function connectivity requirements.

## Step 6: Import the Fabric notebooks

Import these files into the same Fabric workspace:

| Notebook | Purpose |
|---|---|
| `01a_bronze_from_azure_landing.ipynb` | Recommended Azure path: reads the latest Function landing batch |
| `01_bronze_ingest.ipynb` | Alternative path: calls EIA/Census directly from Fabric using Key Vault |
| `02_silver_normalize.ipynb` | Normalizes states, fuels, units, missing values, and duplicate keys |
| `03_gold_energy_explorer.ipynb` | Produces the application-ready Gold tables and metrics |

Bind every imported notebook to the schema-enabled Lakehouse.

### Choose one Bronze path

**Recommended Azure learning path**

```text
01a_bronze_from_azure_landing -> 02_silver_normalize -> 03_gold_energy_explorer
```

This path demonstrates Azure ingestion, managed identity, Storage, a Fabric shortcut, and the
Lakehouse medallion architecture.

**Fabric-only alternative**

```text
01_bronze_ingest -> 02_silver_normalize -> 03_gold_energy_explorer
```

This path is useful when Azure Functions or Storage cannot be used. Configure Key Vault access
for the Fabric notebook identity and provide the notebook parameters documented inside the
notebook.

Never run both Bronze notebooks for the same refresh batch.

### Execute the recommended notebooks

1. Run `01a_bronze_from_azure_landing.ipynb`.
2. Confirm it loaded exactly three datasets and eight periods.
3. Run `02_silver_normalize.ipynb`.
4. Confirm every selected month contains 50 states plus the District of Columbia.
5. Run `03_gold_energy_explorer.ipynb`.
6. Confirm all Gold data-quality checks pass.

For scheduled operation, create a Fabric Data Pipeline with sequential notebook activities.
Retry documented transient failures only. Do not publish a partial month after a validation
failure.

## Step 7: Verify the Gold data contract

The Gold layer contains:

| Table | Grain and use |
|---|---|
| `gold.gold_state_month_energy` | State, month, and fuel metrics |
| `gold.gold_state_month_electricity` | State/month electricity and per-capita metrics |
| `gold.gold_state_population` | State/DC population reference |
| `gold.gold_national_month_summary` | National eight-month KPIs and trends |
| `gold.gold_data_freshness` | Source period, coverage, completeness, and status |

Run these queries in the Lakehouse SQL analytics endpoint:

```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'gold'
ORDER BY TABLE_NAME;

SELECT
    period,
    COUNT(DISTINCT state_code) AS jurisdictions
FROM gold.gold_state_month_electricity
GROUP BY period
ORDER BY period;

SELECT *
FROM gold.gold_data_freshness
ORDER BY dataset_name;
```

Each selected month must contain 51 jurisdictions. Resolve freshness or completeness failures
before connecting the application.

## Step 8: Restore and validate the application locally

```powershell
Set-Location .\fabric-faraza\fabric-demos\14-fabric-app-usenergy
npm install
npm run typecheck
npm run build
npm run lint
npm test
npm run validate:visual
```

Run commands from the project root. Do not install packages separately inside workspace folders
and do not create nested lockfiles.

## Step 9: Connect the app to the Lakehouse SQL analytics endpoint

The repository does not contain fabricated workspace IDs, Lakehouse IDs, connector metadata, or
query results. Add the connector only after your Lakehouse exists.

```powershell
npx rayfin login
npx rayfin login status
npx rayfin connector types --json

npx rayfin connector search "<LAKEHOUSE_DISPLAY_NAME>" `
  --type fabric-sqlanalytics `
  --all-workspaces `
  --json
```

Confirm exactly one result and verify its `workspaceName`, `displayName`, `workspaceId`,
`itemId`, and `connectorType`.

Use the exact IDs from the verified result:

```powershell
npx rayfin connector add `
  --type fabric-sqlanalytics `
  --workspace-id <WORKSPACE_ID> `
  --item-id <LAKEHOUSE_ITEM_ID> `
  --name stateEnergyLakehouse
```

Then:

1. Install the exact version-pinned frontend packages printed by the command.
2. Inspect the connector:

   ```powershell
   npx rayfin connector inspect --name stateEnergyLakehouse
   ```

3. Inspect one row from each required Gold entity before consuming its fields.
4. Follow the installed connector package documentation to generate typed entities for only the
   five Gold tables.
5. Wire the generated schema into `packages/frontend/src/lib/connectors.ts`.
6. Implement the `EnergyDataProvider` adapter using the verified generated entity fields.
7. Update `packages/frontend/src/lib/energy-provider.registration.ts` with the alias and adapter.
8. Repeat the application validation commands.

Until this real connector is configured, the app displays an actionable setup-required state and
does not invent business values.

## Step 10: Run the protected app locally

```powershell
npm run dev
```

Complete the CLI-backed Microsoft sign-in and open the local URL.

Verify:

1. Unauthenticated users cannot see app content.
2. The app reports the real latest and earliest selected periods.
3. National and state totals match SQL endpoint spot checks.
4. State and fuel filters work.
5. Null/suppressed source values are not presented as zero.
6. Dark mode is readable.
7. Narrow/mobile layouts remain usable.
8. Connector, permission, or source failures produce an actionable error.

## Step 11: Deploy the Fabric App

Do not deploy until local checks pass and you have confirmed the intended Fabric workspace.

### Preview

```powershell
npx rayfin up --dry-run
```

Review:

- Workspace name and ID.
- Protected static hosting.
- Fabric authentication enabled.
- Password authentication disabled.
- The `stateEnergyLakehouse` connector.
- No unexpected database or service creation.

### Deploy

```powershell
npx rayfin up
npx rayfin up status
```

After deployment:

1. Open the Fabric App item.
2. Confirm Microsoft Entra sign-in is required.
3. Confirm all six application pages load real Gold data.
4. Compare at least one state/month metric to the SQL analytics endpoint.
5. Confirm the latest period and data-quality status.
6. Grant consumers **Run and interact** permission.

The repository intentionally contains instructions only. No Azure or Fabric deployment is
performed as part of project generation or validation.

## Application pages

1. **National overview** — national KPIs and latest source period.
2. **Eight-month trends** — generation, retail sales, mix, and month-over-month change.
3. **State comparison** — per-capita electricity consumption and generation mix.
4. **State detail** — period-by-period metrics for a selected state.
5. **Fuel detail** — generation, mix, and fuel-intensity metrics.
6. **Methodology and quality** — formulas, lineage, freshness, and completeness.

## Metric definitions

| Metric | Definition |
|---|---|
| Electricity consumption | EIA retail sales MWh × 1,000 ÷ population = kWh/person |
| Generation per 1,000 residents | Generation MWh ÷ population × 1,000 |
| Generation mix | Fuel generation ÷ state total generation × 100 |
| Fuel intensity | Fuel consumption for electric generation MMBtu ÷ generation MWh |
| Carbon-free share | Nuclear plus mapped renewable generation ÷ total generation |
| Fossil dependency | Coal, natural gas, petroleum, and mapped fossil generation ÷ total |
| Supply-balance proxy | Generation MWh ÷ retail sales MWh |
| Month-over-month change | Current retail sales minus prior month ÷ prior month |
| State rank | State retail-sales rank calculated independently for each month |
| Completeness | Actual required records and jurisdictions ÷ expected coverage |

The supply-balance metric is a simple proxy. It is not an interchange-adjusted power balance.
Census population is an annual estimate applied to the selected monthly periods.

## Security design

- Fabric App assets remain protected and require Microsoft authentication.
- Password authentication is disabled.
- API keys are secure deployment parameters stored in Key Vault.
- The Function uses managed identity rather than embedded Azure credentials.
- Storage shared-key authorization and anonymous blob access are disabled.
- Storage and Function endpoints require HTTPS and TLS 1.2 or later.
- The manual ingestion endpoint requires a Function key.
- Key Vault uses RBAC, soft delete, and purge protection.
- Environment-specific Fabric IDs and generated connector metadata are added only by the
  deployer.

This learning template keeps authenticated public-network endpoints enabled for portability.
Production environments should evaluate private endpoints, network isolation, Defender for
Cloud, secret rotation, centralized alerting, and organization-specific compliance controls.

## Monitoring

Use Application Insights to review:

- Timer and manual-trigger execution success.
- Request duration and dependency latency.
- EIA or Census throttling and source errors.
- Key Vault or Storage authorization failures.
- Exception trends.

Recommended alert conditions:

- Any failed scheduled ingestion.
- No successful ingestion within the expected refresh interval.
- Repeated HTTP 429 or 5xx source responses.
- Function execution duration approaching its platform limit.
- Fabric `gold_data_freshness` status not equal to the expected healthy value.

## Cost guidance

The template uses consumption-oriented services:

- Azure Functions Flex Consumption.
- Standard locally redundant Storage.
- Standard Key Vault.
- Consumption-based Log Analytics and Application Insights.

Actual cost depends on region, execution frequency, log volume, data retention, Fabric capacity,
and source volume. Review the Azure pricing calculator and your Fabric capacity model before
production use. Application Insights ingestion can become the largest Azure cost for verbose
logging.

## Troubleshooting

### Azure deployment fails while creating role assignments

The deploying identity needs `Microsoft.Authorization/roleAssignments/write`. Assign
**User Access Administrator** plus **Contributor**, or use **Owner**, at the resource-group
scope.

### The Function cannot read Key Vault

1. Confirm the Function has a system-assigned identity.
2. Confirm it has **Key Vault Secrets User** on the deployed vault.
3. Confirm `KEY_VAULT_URL`, `EIA_SECRET_NAME`, and `CENSUS_SECRET_NAME`.
4. Allow several minutes for new RBAC assignments to propagate.

### The Function cannot write Storage

Confirm the Function identity has:

- Storage Blob Data Owner.
- Storage Queue Data Contributor.
- Storage Table Data Contributor.

Also verify that shared-key authorization remains disabled and the app settings use service URIs.

### The Fabric shortcut cannot read the raw container

1. Confirm the shortcut points to the deployed account and `raw` container.
2. Confirm the Fabric workspace identity has **Storage Blob Data Reader**.
3. Confirm `Files/us-energy-raw/energy/latest.json` exists.
4. Reauthenticate or recreate the shortcut after RBAC propagation.

### Notebook 01A reports that the latest manifest is missing

Publish the Function code and run `manual_energy_ingestion` once. The infrastructure button
creates the service but does not execute or publish application code.

### Silver reports fewer than 51 jurisdictions

Do not continue to Gold. Inspect the Bronze dataset counts, state codes, source period coverage,
and EIA suppression behavior. Publish only after every selected month passes the required
coverage checks.

### The app remains on the setup-required page

The real connector and provider adapter have not been registered. Follow **Step 9** and do not
replace the state with sample values.

### Rayfin connector search returns several Lakehouses

Compare workspace name and IDs, then select the intended Lakehouse. Do not guess or connect to a
similarly named item.

## Regenerate the notebook artifacts

The `.ipynb` files are generated deterministically from a reviewed Python source:

```powershell
python .\scripts\build_energy_notebooks.py
```

Review and commit both the generator and regenerated notebooks together.

## Cleanup

### Fabric

Delete only the items created for this demo:

1. Fabric App.
2. Imported notebooks.
3. Data Pipeline, if created.
4. Lakehouse and SQL analytics endpoint.
5. Workspace identity only if it is dedicated to this demo.
6. Demo workspace only if it contains no unrelated items.

### Azure

If the resource group is dedicated to the demo, deleting that resource group removes the
Function, Storage, Key Vault, monitoring resources, and role assignments:

```powershell
az group delete --name <RESOURCE_GROUP>
```

Review the resource group before deletion. Key Vault purge protection intentionally prevents
immediate permanent purge during its retention period.

## Suggested demonstration flow

1. Show the GitHub deployment button and explain the selectable subscription, resource group,
   and region.
2. Open the deployed resources and show managed identity, Key Vault, Storage, and monitoring.
3. Trigger ingestion and inspect the batch manifest without exposing API keys.
4. Show the Fabric shortcut and Bronze/Silver/Gold notebook flow.
5. Query the Gold tables from the SQL analytics endpoint.
6. Open the protected Fabric App.
7. Compare national trends, state per-capita consumption, and fuel mix.
8. Finish on methodology and data quality to explain lineage and honest null handling.

**Demo soundbite:** “The deployment button creates the reusable Azure landing layer, Fabric
turns public source data into governed analytical products, and the Fabric App delivers those
products as a secured operational experience.”

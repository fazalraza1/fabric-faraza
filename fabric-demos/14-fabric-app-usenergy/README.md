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

The Azure deployment creates:

- Azure Key Vault for the EIA and Census API keys.
- A hierarchical-namespace Storage account and private `raw` container.

The Microsoft Fabric portion is intentionally portal-guided so learners can see how the
Lakehouse, shortcut, notebooks, SQL analytics endpoint, connector, and Fabric App fit together.

There are two supported ingestion options:

1. **One-time local REST loader to ADLS** — preserves the Azure landing zone and Fabric shortcut.
2. **Fabric-direct notebook** — calls EIA and Census from Fabric and writes Bronze directly.

Choose one Bronze path for a refresh. Do not run both against the same batch.

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
│   └── ingest_energy_once.py
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
| Python | 3.11+ | Run the one-time loader and regenerate notebooks |
| Azure CLI | Latest stable | Deploy Bicep and authenticate the one-time loader |
| PowerShell | 7.4+ | Run the documented helper commands |

Check local versions:

```powershell
git --version
node --version
npm --version
python --version
az version
$PSVersionTable.PSVersion
```

## Step 1: Deploy the Azure services

The button opens the Azure Portal. After authentication, the portal lets you select:

- Subscription.
- An existing resource group or a new resource group.
- Azure region.
- Resource-name prefix and environment.
- EIA and Census API keys as secure parameters.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Ffazalraza1%2Ffabric-faraza-development%2Fmain%2F14-fabric-app-usenergy%2Finfra%2Fazuredeploy.json)

> **Private repository note:** The project is stored in a private GitHub repository. Azure
> Portal cannot download a private raw GitHub template anonymously. The button is retained as
> requested, but it may fail unless the template is copied to a publicly accessible URL. The
> authenticated/manual Bicep deployment commands below are the reliable deployment path.

The API-key fields are ARM `secureString` parameters. Their values are not displayed in the
deployment history or template outputs. The deployment writes them directly to Key Vault.

> **Existing deployment note:** Azure Resource Manager incremental deployments do not delete
> resources removed from a template. If you previously deployed the Function-based version,
> redeploying this template leaves the old Function App, Flex plan, Application Insights, Log
> Analytics workspace, and `deploymentpackage` container in place. Delete those retired
> resources manually after confirming nothing else uses them, or recreate a dedicated demo
> resource group.

### Region selection

The template defaults to the selected resource group's region, but you can choose another region
in the deployment form. Storage and Key Vault are deployed together in the selected region.

### Resource naming

You provide a short lowercase prefix such as `usenergy`. The template combines the prefix,
environment, and a deterministic unique suffix. This avoids common Storage and Key Vault naming
collisions.

### What the button does not deploy

The button creates the Azure services and configuration. It does not:

- Run either ingestion option.
- Create a Fabric workspace or capacity.
- Create Fabric Lakehouse, notebook, shortcut, or application items.
- Add a Rayfin connector, because your Fabric workspace and Lakehouse IDs do not exist yet.
- Deploy the Fabric App.

Those steps are intentionally completed after the infrastructure deployment.

### Review or deploy the Bicep manually

The readable source is `infra/main.bicep`. The portal button uses the compiled
`infra/azuredeploy.json`.

```powershell
git clone https://github.com/fazalraza1/fabric-faraza-development.git
Set-Location .\fabric-faraza-development\14-fabric-app-usenergy

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

- `keyVaultName`
- `keyVaultUri`
- `storageAccountName`
- `storageBlobEndpoint`
- `rawContainerName`

You can also retrieve them with:

```powershell
az deployment group show `
  --resource-group <RESOURCE_GROUP> `
  --name <DEPLOYMENT_NAME> `
  --query properties.outputs `
  --output table
```

Do not commit output files containing resource IDs or environment-specific names.

## Step 3: Choose one ingestion option

Both options produce the same Bronze contract. Use the local loader when you want an inspectable
ADLS landing zone and shortcut. Use the Fabric-direct notebook when you want the fewest Azure
moving parts.

### Option A: Run the one-time local REST loader to ADLS

The dependency-free script calls EIA and Census REST APIs, selects the latest eight common
monthly periods, and uploads Bronze-ready NDJSON plus immutable/latest manifests through the
Azure Blob REST API. It uses your current `az login` identity and never writes API keys to disk.

Grant your signed-in user **Key Vault Secrets User** on the vault and **Storage Blob Data
Contributor** on the Storage account:

```powershell
az login
$principalId = az ad signed-in-user show --query id --output tsv
$vaultId = az keyvault show `
  --resource-group <RESOURCE_GROUP> `
  --name <KEY_VAULT_NAME> `
  --query id `
  --output tsv
$storageId = az storage account show `
  --resource-group <RESOURCE_GROUP> `
  --name <STORAGE_ACCOUNT_NAME> `
  --query id `
  --output tsv

az role assignment create `
  --assignee-object-id $principalId `
  --assignee-principal-type User `
  --role "Key Vault Secrets User" `
  --scope $vaultId

az role assignment create `
  --assignee-object-id $principalId `
  --assignee-principal-type User `
  --role "Storage Blob Data Contributor" `
  --scope $storageId
```

Run the loader:

```powershell
python .\scripts\ingest_energy_once.py `
  --storage-account <STORAGE_ACCOUNT_NAME> `
  --key-vault-name <KEY_VAULT_NAME>
```

Confirm the `raw` container contains:

```text
energy/latest.json
energy/YYYY/MM/DD/<BATCH_ID>/manifest.json
energy/YYYY/MM/DD/<BATCH_ID>/bronze_records.jsonl
```

### Option B: Call the APIs directly from Fabric

Skip the local loader and Storage shortcut. Import `01_bronze_ingest.ipynb`, configure its
`key_vault_url` parameter, and grant the Fabric workspace identity **Key Vault Secrets User** on
the deployed vault. The notebook retrieves both secrets at runtime, calls the public APIs, and
writes `bronze.energy_source_raw` directly.

## Step 4: Configure the Fabric workspace identity

In the target Fabric workspace:

1. Open **Workspace settings**.
2. Create or enable the workspace identity.
3. Record its object/principal ID.
4. For Option A, assign **Storage Blob Data Reader** on the deployed Storage account.
5. For Option B, assign **Key Vault Secrets User** on the deployed Key Vault.

The Azure deployment cannot assign this permission because the Fabric workspace identity is
created later and differs for every learner.

If your organization does not allow workspace identity, create the shortcut using an
administrator-approved organizational account or service principal. Do not store credentials in
the repository.

## Step 5: Create the Fabric Lakehouse and optional Azure shortcut

1. In the Fabric workspace, create a **schema-enabled Lakehouse**.
2. If you chose Option A, create a new shortcut under **Files**.
3. Select **Azure Data Lake Storage Gen2**.
4. Use the deployed Storage account endpoint and select the `raw` container.
5. Authenticate with the workspace identity when available.
6. Name the shortcut exactly:

   ```text
   us-energy-raw
   ```

7. Confirm this file can be browsed:

   ```text
   Files/us-energy-raw/energy/latest.json
   ```

If you chose Option B, do not create the shortcut; the Fabric notebook writes Bronze directly.

The Storage account permits authenticated public-network access because Fabric must reach it.
Anonymous blob access and shared-key authentication are disabled. For production workloads,
consider private networking after validating Fabric connectivity requirements.

## Step 6: Import the Fabric notebooks

Import these files into the same Fabric workspace:

| Notebook | Purpose |
|---|---|
| `01a_bronze_from_azure_landing.ipynb` | Option A: reads the latest one-time ADLS landing batch |
| `01_bronze_ingest.ipynb` | Option B: calls EIA/Census directly from Fabric using Key Vault |
| `02_silver_normalize.ipynb` | Normalizes states, fuels, units, missing values, and duplicate keys |
| `03_gold_energy_explorer.ipynb` | Produces the application-ready Gold tables and metrics |

Bind every imported notebook to the schema-enabled Lakehouse.

### Choose one Bronze path

**Option A: one-time local loader and Azure landing**

```text
01a_bronze_from_azure_landing -> 02_silver_normalize -> 03_gold_energy_explorer
```

This path demonstrates REST ingestion, Entra-authenticated Storage upload, a Fabric shortcut,
and the Lakehouse medallion architecture.

**Option B: Fabric-direct ingestion**

```text
01_bronze_ingest -> 02_silver_normalize -> 03_gold_energy_explorer
```

This path removes the landing-zone step. Configure Key Vault access for the Fabric workspace
identity and provide the notebook parameters documented inside the notebook.

Never run both Bronze notebooks for the same refresh batch.

### Execute the selected notebooks

1. Run either `01a_bronze_from_azure_landing.ipynb` or `01_bronze_ingest.ipynb`.
2. Confirm it loaded exactly three datasets and eight periods.
3. Run `02_silver_normalize.ipynb`.
4. Confirm every selected month contains 50 states plus the District of Columbia.
5. Run `03_gold_energy_explorer.ipynb`.
6. Confirm all Gold data-quality checks pass.

For scheduled operation, use Option B in a Fabric Data Pipeline with sequential notebook
activities. The local loader is intentionally a one-time/manual option. Retry documented
transient failures only and do not publish a partial month after a validation failure.

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
Set-Location .\fabric-faraza-development\14-fabric-app-usenergy
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
- The local loader uses the signed-in Azure CLI identity and does not write API keys to disk.
- The Fabric-direct notebook retrieves API keys through the Fabric workspace identity.
- Storage shared-key authorization and anonymous blob access are disabled.
- Storage requires HTTPS and TLS 1.2 or later.
- Key Vault uses RBAC, soft delete, and purge protection.
- Environment-specific Fabric IDs and generated connector metadata are added only by the
  deployer.

This learning template keeps authenticated public-network endpoints enabled for portability.
Production environments should evaluate private endpoints, network isolation, Defender for
Cloud, secret rotation, centralized alerting, and organization-specific compliance controls.

## Monitoring

- The local loader prints the batch ID, selected periods, row counts, and uploaded path.
- Fabric notebook runs retain execution output and can be monitored through a Fabric Data
  Pipeline when scheduling Option B.
- `gold.gold_data_freshness` records source coverage and the resulting health status.
- Treat repeated HTTP 429/5xx responses, missing landing manifests, or unhealthy Gold freshness
  as actionable failures.

## Cost guidance

The template uses consumption-oriented services:

- Standard locally redundant Storage.
- Standard Key Vault.

Actual cost depends on region, stored data, Fabric capacity, and source volume. Review the Azure
pricing calculator and your Fabric capacity model before production use.

## Troubleshooting

### Azure deployment fails while creating role assignments

The deploying identity needs `Microsoft.Authorization/roleAssignments/write`. Assign
**User Access Administrator** plus **Contributor**, or use **Owner**, at the resource-group
scope.

### The local loader cannot read Key Vault

1. Confirm `az account show` returns the intended user and subscription.
2. Confirm that user has **Key Vault Secrets User** on the deployed vault.
3. Confirm the vault and secret names passed to the script.
4. Allow several minutes for new RBAC assignments to propagate.

### The local loader cannot write Storage

Confirm the signed-in user has **Storage Blob Data Contributor** on the Storage account. Shared
keys remain disabled; the loader requests a Storage bearer token from Azure CLI and uploads
through the Blob REST API.

### The Fabric shortcut cannot read the raw container

1. Confirm the shortcut points to the deployed account and `raw` container.
2. Confirm the Fabric workspace identity has **Storage Blob Data Reader**.
3. Confirm `Files/us-energy-raw/energy/latest.json` exists.
4. Reauthenticate or recreate the shortcut after RBAC propagation.

### Notebook 01A reports that the latest manifest is missing

Run `scripts/ingest_energy_once.py` once and confirm `energy/latest.json` exists in the `raw`
container. The infrastructure deployment creates Storage but does not ingest source data.

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
Storage account and Key Vault:

```powershell
az group delete --name <RESOURCE_GROUP>
```

Review the resource group before deletion. Key Vault purge protection intentionally prevents
immediate permanent purge during its retention period.

## Suggested demonstration flow

1. Show the GitHub deployment button and explain the selectable subscription, resource group,
   and region.
2. Explain the two ingestion choices and select the path appropriate for the audience.
3. For Option A, run the one-time loader and inspect the batch manifest without exposing keys.
   For Option B, show the Fabric notebook retrieving secrets through the workspace identity.
4. Show the Fabric shortcut and Bronze/Silver/Gold notebook flow.
5. Query the Gold tables from the SQL analytics endpoint.
6. Open the protected Fabric App.
7. Compare national trends, state per-capita consumption, and fuel mix.
8. Finish on methodology and data quality to explain lineage and honest null handling.

**Demo soundbite:** “Choose a lightweight one-time Azure landing or ingest directly in Fabric;
either way, Fabric turns public source data into governed analytical products for a secured
application experience.”

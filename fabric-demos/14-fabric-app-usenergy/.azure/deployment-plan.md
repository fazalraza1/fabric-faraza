# U.S. Energy Fabric App Deployment Plan

**Status:** Ready for Validation

## Scope

Create an independently deployable learning project under
`fazalraza1/fabric-faraza-development/14-fabric-app-usenergy`. Keep the
development repository private and leave `13-fabric-app` unchanged. Do not
deploy Azure or Microsoft Fabric resources while preparing this project.

## Confirmed requirements

- Target the Azure commercial cloud.
- Provide a README **Deploy to Azure** button.
- Let deployers select their subscription, resource group, and Azure region.
- Provision Azure Key Vault and an ADLS Gen2 Storage account.
- Support two explicit ingestion paths:
  - A one-time local REST loader that writes an ADLS landing batch.
  - A Fabric notebook that calls the APIs and writes Bronze directly.
- Use live U.S. EIA energy data and U.S. Census population data.
- Provide portal-guided Microsoft Fabric deployment instructions.
- Consolidate setup, deployment, validation, demo, troubleshooting, and cleanup guidance in
  `README.md`.
- Keep secrets, generated environment files, deployment outputs, workspace IDs, and Fabric item
  IDs out of source control.

## Planned architecture

```text
EIA Open Data + Census API
          |
    +-----+------+
    |            |
    v            v
Local REST    Fabric Bronze
loader        notebook
    |            |
    v            |
ADLS raw         |
landing          |
    |            |
    +-----+------+
          |
          v
Fabric Lakehouse Bronze -> Silver -> Gold
          |
          v
Lakehouse SQL analytics endpoint
          |
          v
Protected Rayfin/Fabric React application

Key Vault supplies API secrets to either ingestion identity.
```

## Planned Azure resources

| Component | Azure service | Notes |
|---|---|---|
| Secret storage | Azure Key Vault | RBAC authorization; no secrets committed |
| Optional raw landing | Storage account / Blob Storage | ADLS Gen2, private `raw` container |

## Infrastructure approach

- Author Bicep under `infra/`.
- Compile and commit `infra/azuredeploy.json` for the Azure Portal deployment button.
- Use resource-group-scoped deployment so the portal supplies the subscription and resource
  group.
- Expose `location` as a template parameter with a resource-group-location default.
- Generate globally unique resource names from a user-selectable prefix and deployment suffix.
- Treat EIA and Census API keys as secure deployment parameters.
- Assign data-plane roles after deployment because local users and Fabric workspace identities
  differ for every learner.

## Fabric approach

- Include importable PySpark notebooks for both Bronze paths plus Silver and Gold processing.
- Use a schema-enabled Lakehouse and its SQL analytics endpoint.
- Require users to supply real workspace and Lakehouse IDs only during connector setup.
- Preserve protected hosting, Fabric authentication, and password-authentication disablement.
- Show configuration, loading, empty, and actionable error states rather than sample fallback
  data.

## Security

- API keys are stored in Key Vault.
- The local loader uses the signed-in Azure CLI identity.
- The Fabric-direct notebook uses the Fabric workspace identity.
- Storage shared keys and anonymous blob access remain disabled.
- Key Vault uses RBAC, soft delete, and purge protection.
- Fabric application assets remain protected by Microsoft Entra/Fabric authentication.

## Validation plan

1. Validate the one-time loader syntax and deterministic landing contract.
2. Regenerate and validate Fabric notebooks.
3. Run application typecheck, build, lint, tests, and visual validation.
4. Compile Bicep to ARM JSON and validate template structure.
5. Confirm the Deploy to Azure URL points to the committed ARM template.
6. Review Git changes to ensure unrelated worktree changes remain untouched.

## Delivery

- Publish the complete project under `14-fabric-app-usenergy`.
- Do not deploy Azure infrastructure, Fabric items, connectors, or the application.

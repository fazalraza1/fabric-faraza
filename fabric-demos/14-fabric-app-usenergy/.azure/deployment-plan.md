# U.S. Energy Fabric App Deployment Plan

**Status:** Ready for Validation

## Scope

Create an independently deployable learning project under
`fazalraza1/fabric-faraza/fabric-demos/14-fabric-app-usenergy`. Leave
`13-fabric-app` unchanged. Do not deploy Azure or Microsoft Fabric resources
while preparing this project.

## Confirmed requirements

- Target the Azure commercial cloud.
- Provide a README **Deploy to Azure** button.
- Let deployers select their subscription, resource group, and Azure region in the portal.
- Provision Azure Key Vault, Storage, Azure Functions, and Application Insights.
- Use live U.S. EIA energy data and U.S. Census population data.
- Provide portal-guided Microsoft Fabric deployment instructions.
- Consolidate all setup, deployment, validation, demo, troubleshooting, and cleanup
  guidance into the root `README.md`.
- Keep secrets, generated environment files, deployment outputs, workspace IDs, and
  Fabric item IDs out of source control.

## Planned architecture

```text
EIA Open Data + Census API
          |
          v
Azure Function (timer + manual HTTP trigger)
          |
          v
Azure Storage raw landing zone
          |
          v
Fabric Lakehouse Bronze -> Silver -> Gold
          |
          v
Lakehouse SQL analytics endpoint
          |
          v
Protected Rayfin/Fabric React application

Key Vault supplies API secrets.
Application Insights monitors Azure Function execution.
```

## Planned Azure resources

| Component | Azure service | Notes |
|---|---|---|
| Secret storage | Azure Key Vault | RBAC authorization; no secrets committed |
| Raw landing | Storage account / Blob Storage | Private containers; secure transfer required |
| Scheduled ingestion | Azure Functions | Python timer trigger and authenticated manual trigger |
| Monitoring | Application Insights + Log Analytics | Function telemetry and operational troubleshooting |
| Authorization | Managed identity + RBAC | Least-privilege access to Key Vault and Storage |

## Infrastructure approach

- Author modular Bicep under `infra/`.
- Compile and commit `infra/azuredeploy.json` for the Azure Portal deployment button.
- Use resource-group-scoped deployment so the portal supplies the subscription and
  existing/new resource group.
- Expose `location` as a template parameter with a resource-group-location default.
- Generate globally unique resource names from a user-selectable prefix and deployment suffix.
- Treat EIA and Census API keys as secure deployment parameters.
- Include command-line validation and manual deployment alternatives, but do not run a deployment.

## Fabric approach

- Include importable PySpark notebooks for Bronze, Silver, and Gold processing.
- Use a schema-enabled Lakehouse and its SQL analytics endpoint.
- Require users to supply their real workspace and Lakehouse IDs only during local
  connector setup.
- Preserve protected hosting, Fabric authentication, and password-authentication disablement.
- Show configuration, loading, empty, and actionable error states rather than sample fallback data.

## Application capabilities

- Rayfin connector support for a Fabric Lakehouse SQL analytics endpoint.
- Fabric visual components for trends and state/fuel comparisons.
- No app-owned database and no synthetic business-value fallback.

## Security

- Managed identity for Azure Function access to Key Vault and Storage.
- Key Vault RBAC and soft delete.
- HTTPS-only Function App and Storage.
- Minimum TLS 1.2.
- No public blob access.
- Function manual endpoint protected by function-level authorization.
- Secrets represented only as secure parameters and Key Vault secret values.
- Fabric application assets remain protected by Microsoft Entra/Fabric authentication.

## Validation plan

### All validation checks pass

- [x] Application typecheck, build, lint, 64 tests, and complete visual-schema validation.
- [x] Fabric notebook regeneration.
- [x] Python Function syntax validation.
- [x] Bicep compilation to `infra/azuredeploy.json`.
- [ ] Core Azure validation: CLI authentication, resource-group validation, and what-if.
- [x] Bicep linting.
- [ ] Azure Policy validation against a selected subscription.

1. Regenerate and validate Fabric notebooks.
2. Run application typecheck, build, lint, tests, and visual validation.
3. Compile Bicep to ARM JSON.
4. Validate template structure without deploying resources.
5. Validate Python Function source statically and run its unit tests where available.
6. Confirm the Deploy to Azure URL points to the committed raw ARM template.
7. Review Git changes to ensure Phase 1 and unrelated worktree changes remain untouched.

## Delivery

- Publish the complete project under `fabric-demos/14-fabric-app-usenergy` in the public
  `fazalraza1/fabric-faraza` repository.
- Do not deploy Azure infrastructure, Fabric items, connectors, or the application.

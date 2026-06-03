# Azure Login — Prerequisites

Before running `deploy.ps1`, make sure you are logged into Azure via PowerShell.

---

## Step 1 — Install Azure CLI (if not already installed)

Open PowerShell as Administrator and run:

```powershell
winget install Microsoft.AzureCLI
```

Or download manually from: https://aka.ms/installazurecliwindows

Verify installation:
```powershell
az --version
```

---

## Step 2 — Log in to Azure

```powershell
az login
```

This opens a browser window. Sign in with your Microsoft account that has access to the Azure subscription.

> **Corporate/Work account?** If your tenant requires MFA or device code login:
> ```powershell
> az login --use-device-code
> ```
> Copy the code shown, go to https://microsoft.com/devicelogin, and enter the code.

---

## Step 3 — Find your Subscription ID

After login, all your subscriptions are listed. Copy the `id` value for the subscription you want to deploy to.

Or run this command to list subscriptions:
```powershell
az account list --output table
```

To set the correct subscription:
```powershell
az account set --subscription "<your-subscription-id>"
```

Confirm which subscription is active:
```powershell
az account show --output table
```

---

## Step 4 — Verify you have Contributor access

```powershell
az role assignment list --assignee (az ad signed-in-user show --query id -o tsv) --output table
```

You need at least **Contributor** on the subscription (or on a resource group) to deploy.

---

## Step 5 — Run the deploy script

Once logged in and subscription is confirmed, navigate to the `deploy` folder and run:

```powershell
# Navigate to the deploy folder first
cd 07-fabric-databricks-better-together\deploy

# Option A — Deploy everything including a new Fabric capacity (F2)
.\deploy.ps1 -SubscriptionId "<your-subscription-id>"

# Option B — Use an existing Fabric capacity (skips creating a new one)
.\deploy.ps1 -SubscriptionId "<your-subscription-id>" -ExistingFabricCapacityName "<capacity-name>"
```

**To find your existing Fabric capacity name:**
```powershell
az resource list --resource-type Microsoft.Fabric/capacities --output table
```

**All available parameters (optional):**
```powershell
.\deploy.ps1 `
  -SubscriptionId             "<your-subscription-id>" `
  -EnvName                    "demo" `
  -Location                   "centralus" `
  -FabricSkuName              "F2" `
  -ExistingFabricCapacityName "my-existing-capacity"
```

> The resource group name is printed at the end of deploy output. Default is `rg-fabric-databricks-<EnvName>`.

---

## Troubleshooting Login

| Error | Fix |
|-------|-----|
| `Please run 'az login'` | Run `az login` first |
| `AADSTS50076: MFA required` | Use `az login --use-device-code` |
| `Subscription not found` | Run `az account list` and use exact subscription ID |
| `AuthorizationFailed` | Ask your Azure admin to grant Contributor role |
| `az: command not found` | Install Azure CLI — see Step 1 above |

---

## After the Demo — Logout (optional)

```powershell
az logout
```

"""
setup_fabric_demo.py
────────────────────
Automates uploading CSV data files and importing notebooks into Microsoft Fabric.

What it does:
  1. Authenticates via Azure CLI (az login) — no secrets needed
  2. Uploads all CSV files to the Lakehouse Files/ section via OneLake ADLS Gen2 API
  3. Imports all notebooks (.ipynb) into the Fabric workspace via Fabric REST API

Requirements:
  pip install azure-identity azure-storage-file-datalake requests

Usage:
  python setup_fabric_demo.py

You will be prompted for your Workspace ID and Lakehouse ID if not set below.
Find these in the Fabric URL when you open your workspace/lakehouse.
"""

import os
import sys
import base64
import json
import time
import requests
from pathlib import Path

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
# Fill these in OR leave blank to be prompted at runtime.
# Find Workspace ID: open workspace in Fabric → copy ID from the URL
# Find Lakehouse ID: open Lakehouse → copy ID from the URL
WORKSPACE_ID = ""   # e.g. "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
LAKEHOUSE_ID = ""   # e.g. "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Path to the root of this repo on your local machine
REPO_ROOT = Path(__file__).parent.parent.parent  # shared/setup-scripts/ → repo root
# ──────────────────────────────────────────────────────────────────────────────

FABRIC_API   = "https://api.fabric.microsoft.com/v1"
ONELAKE_HOST = "onelake.dfs.fabric.microsoft.com"

# Demos and their CSV + notebook files
DEMOS = [
    {
        "name":      "01-lakehouse-fundamentals",
        "csv_files": ["sample_accounts.csv"],
        "notebooks": ["01_load_data.ipynb"],
    },
    {
        "name":      "02-medallion-architecture",
        "csv_files": ["loan_transactions.csv"],
        "notebooks": ["01_bronze_ingest.ipynb", "02_silver_clean.ipynb", "03_gold_report.ipynb"],
    },
    {
        "name":      "03-ai-powered-fraud-defense",
        "csv_files": ["fraud_transactions.csv"],
        "notebooks": ["01_ingest.ipynb", "02_feature_engineering.ipynb",
                      "03_model_training.ipynb", "04_scoring.ipynb"],
    },
    {
        "name":      "04-credit-risk-scoring",
        "csv_files": ["credit_risk_features.csv"],
        "notebooks": ["01_feature_engineering.ipynb", "02_model_training_sklearn.ipynb",
                      "03_model_training_lightgbm.ipynb", "04_model_comparison.ipynb",
                      "05_model_deployment.ipynb", "06_model_monitoring.ipynb"],
    },
]


def get_access_token():
    """Get Azure access token using Azure CLI (az login)."""
    try:
        from azure.identity import AzureCliCredential
        credential = AzureCliCredential()
        token = credential.get_token("https://storage.azure.com/.default")
        fabric_token = credential.get_token("https://api.fabric.microsoft.com/.default")
        print("✅ Authenticated via Azure CLI")
        return token.token, fabric_token.token
    except ImportError:
        print("❌ azure-identity not installed. Run: pip install azure-identity azure-storage-file-datalake requests")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print("   Make sure you are logged in: az login")
        sys.exit(1)


def upload_csv_to_lakehouse(storage_token, workspace_id, lakehouse_id, csv_path):
    """Upload a CSV file to the Lakehouse Files/ section via OneLake ADLS Gen2."""
    from azure.storage.filedatalake import DataLakeServiceClient

    filename = csv_path.name
    account_url = f"https://{ONELAKE_HOST}"

    service_client = DataLakeServiceClient(
        account_url=account_url,
        credential=storage_token
    )

    # OneLake path: workspaceId/lakehouseId.Lakehouse/Files/filename
    fs_name = workspace_id
    file_path = f"{lakehouse_id}.Lakehouse/Files/{filename}"

    fs_client   = service_client.get_file_system_client(fs_name)
    file_client = fs_client.get_file_client(file_path)

    with open(csv_path, "rb") as f:
        data = f.read()

    file_client.upload_data(data, overwrite=True)
    print(f"  ✅ Uploaded CSV: {filename}")


def import_notebook_to_fabric(fabric_token, workspace_id, notebook_path):
    """Import a .ipynb notebook into a Fabric workspace via REST API."""
    notebook_name = notebook_path.stem  # filename without .ipynb

    with open(notebook_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "displayName": notebook_name,
        "definition": {
            "format": "ipynb",
            "parts": [
                {
                    "path": "notebook-content.ipynb",
                    "payload": content_b64,
                    "payloadType": "InlineBase64"
                }
            ]
        }
    }

    headers = {
        "Authorization": f"Bearer {fabric_token}",
        "Content-Type":  "application/json"
    }

    url      = f"{FABRIC_API}/workspaces/{workspace_id}/notebooks"
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code in (200, 201):
        print(f"  ✅ Imported notebook: {notebook_name}")
    elif response.status_code == 202:
        # Long-running operation — poll for completion
        op_url = response.headers.get("Location") or response.headers.get("x-ms-operation-id")
        print(f"  ⏳ Notebook import in progress: {notebook_name}", end="", flush=True)
        for _ in range(20):
            time.sleep(3)
            print(".", end="", flush=True)
            poll = requests.get(op_url, headers=headers)
            if poll.status_code == 200:
                status = poll.json().get("status", "")
                if status == "Succeeded":
                    print(f" ✅")
                    return
                elif status == "Failed":
                    print(f" ❌ Failed: {poll.json()}")
                    return
        print(" ⚠️  Timed out waiting — check Fabric workspace manually")
    elif response.status_code == 409:
        print(f"  ⚠️  Notebook already exists (skipped): {notebook_name}")
    else:
        print(f"  ❌ Failed to import {notebook_name}: {response.status_code} — {response.text[:200]}")


def prompt_for_ids():
    """Prompt user for Workspace and Lakehouse IDs."""
    global WORKSPACE_ID, LAKEHOUSE_ID

    if not WORKSPACE_ID:
        print("\n📋 How to find your Workspace ID:")
        print("   1. Open app.fabric.microsoft.com")
        print("   2. Open your FabricBankingDemos workspace")
        print("   3. Look at the browser URL: .../groups/{WORKSPACE_ID}/...")
        WORKSPACE_ID = input("\nEnter your Workspace ID: ").strip()

    if not LAKEHOUSE_ID:
        print("\n📋 How to find your Lakehouse ID:")
        print("   1. Open BankingLakehouse inside your workspace")
        print("   2. Look at the browser URL: .../lakehouses/{LAKEHOUSE_ID}")
        LAKEHOUSE_ID = input("\nEnter your Lakehouse ID: ").strip()


def select_demos():
    """Ask user which demos to set up."""
    print("\nWhich demos do you want to set up?")
    print("  [1] 01 — Lakehouse Fundamentals")
    print("  [2] 02 — Medallion Architecture")
    print("  [3] 03 — AI-Powered Fraud Defense")
    print("  [4] 04 — Credit Risk Scoring")
    print("  [A] All demos")
    choice = input("\nEnter choice (e.g. 1, 2, A): ").strip().upper()

    if choice == "A":
        return DEMOS
    selected = []
    for c in choice.split(","):
        c = c.strip()
        if c.isdigit() and 1 <= int(c) <= len(DEMOS):
            selected.append(DEMOS[int(c) - 1])
    return selected if selected else DEMOS


def main():
    print("=" * 60)
    print("  Microsoft Fabric Banking Demos — Setup Script")
    print("=" * 60)
    print("\nThis script will:")
    print("  1. Upload CSV data files to your Lakehouse")
    print("  2. Import notebooks into your Fabric workspace\n")

    prompt_for_ids()
    selected_demos = select_demos()

    print("\n🔐 Authenticating with Azure CLI...")
    storage_token, fabric_token = get_access_token()

    total_csv = 0
    total_nb  = 0

    for demo in selected_demos:
        demo_path = REPO_ROOT / "fabric-demos" / demo["name"]
        print(f"\n📁 Setting up: {demo['name']}")

        # Upload CSVs
        data_dir = demo_path / "data"
        if data_dir.exists():
            for csv_file in demo["csv_files"]:
                csv_path = data_dir / csv_file
                if csv_path.exists():
                    upload_csv_to_lakehouse(storage_token, WORKSPACE_ID, LAKEHOUSE_ID, csv_path)
                    total_csv += 1
                else:
                    print(f"  ⚠️  CSV not found: {csv_path}")

        # Import notebooks
        nb_dir = demo_path / "notebooks"
        if nb_dir.exists():
            for nb_file in demo["notebooks"]:
                nb_path = nb_dir / nb_file
                if nb_path.exists():
                    import_notebook_to_fabric(fabric_token, WORKSPACE_ID, nb_path)
                    total_nb += 1
                else:
                    print(f"  ⚠️  Notebook not found: {nb_path}")

    print("\n" + "=" * 60)
    print(f"  ✅ Setup complete!")
    print(f"     CSV files uploaded: {total_csv}")
    print(f"     Notebooks imported: {total_nb}")
    print("=" * 60)
    print("\n⚠️  IMPORTANT — Next step:")
    print("   Open each notebook in Fabric and attach BankingLakehouse:")
    print("   Left panel → Add Lakehouse → BankingLakehouse → Add")
    print("   (The API does not auto-attach the Lakehouse)\n")


if __name__ == "__main__":
    main()

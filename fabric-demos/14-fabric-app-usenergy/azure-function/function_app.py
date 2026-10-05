from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import azure.functions as func
import requests
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient, ContentSettings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


app = func.FunctionApp()

EIA_BASE_URL = "https://api.eia.gov/v2"
EIA_OPERATIONAL_ROUTE = "electricity/electric-power-operational-data"
EIA_RETAIL_ROUTE = "electricity/retail-sales"
CENSUS_URL = "https://api.census.gov/data/2025/pep/population"
CENSUS_VARIABLE = "POP_2025"
PAGE_SIZE = 5000


def _credential():
    if os.getenv("WEBSITE_HOSTNAME"):
        return ManagedIdentityCredential()
    return DefaultAzureCredential()


def _required_setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required application setting '{name}' is missing.")
    return value


def _session() -> requests.Session:
    session = requests.Session()
    session.mount(
        "https://",
        HTTPAdapter(
            max_retries=Retry(
                total=5,
                backoff_factor=1.0,
                status_forcelist=[429, 500, 502, 503, 504],
                allowed_methods=["GET"],
            )
        ),
    )
    return session


def _eia_get(session: requests.Session, route: str, params: list[tuple[str, str]]) -> dict[str, Any]:
    response = session.get(
        f"{EIA_BASE_URL}/{route.strip('/')}/data/",
        params=params,
        timeout=90,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("error"):
        raise RuntimeError(f"EIA returned an error for {route}: {payload['error']}")
    return payload


def _metadata_end_period(session: requests.Session, route: str, api_key: str) -> str:
    response = session.get(
        f"{EIA_BASE_URL}/{route.strip('/')}/",
        params={"api_key": api_key},
        timeout=90,
    )
    response.raise_for_status()
    periods: list[str] = []

    def visit(value: Any) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if (
                    key == "endPeriod"
                    and isinstance(child, str)
                    and len(child) == 7
                    and child[4] == "-"
                ):
                    periods.append(child)
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(response.json())
    if not periods:
        raise RuntimeError(f"EIA metadata for {route} did not include a monthly endPeriod.")
    return max(periods)


def _month_sequence(end_period: str, count: int) -> list[str]:
    year, month = (int(part) for part in end_period.split("-"))
    periods: list[str] = []
    for _ in range(count):
        periods.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return sorted(periods)


def _eia_pages(
    session: requests.Session,
    route: str,
    api_key: str,
    fields: list[str],
    extra_params: list[tuple[str, str]],
) -> tuple[str, dict[str, Any], list[dict[str, Any]]]:
    offset = 0
    rows: list[dict[str, Any]] = []
    metadata: dict[str, Any] = {}
    source_url = f"{EIA_BASE_URL}/{route.strip('/')}/data/"
    while True:
        params = [
            ("api_key", api_key),
            ("frequency", "monthly"),
            ("offset", str(offset)),
            ("length", str(PAGE_SIZE)),
            ("sort[0][column]", "period"),
            ("sort[0][direction]", "asc"),
        ]
        params.extend((f"data[{index}]", field) for index, field in enumerate(fields))
        params.extend(extra_params)
        response = _eia_get(session, route, params).get("response") or {}
        page = response.get("data") or []
        rows.extend(page)
        metadata = {key: value for key, value in response.items() if key != "data"}
        total = int(response.get("total") or 0)
        offset += len(page)
        if not page or offset >= total:
            break
    if len(rows) != int(metadata.get("total") or len(rows)):
        raise RuntimeError(f"Incomplete EIA pagination for {route}: {len(rows)} rows retrieved.")
    return source_url, metadata, rows


def _text(value: Any) -> str | None:
    return None if value is None else str(value)


def _record_base(
    dataset_name: str,
    source_url: str,
    source_units: dict[str, Any],
    source_metadata: dict[str, Any],
    batch_id: str,
    retrieved_at: datetime,
) -> dict[str, Any]:
    return {
        "dataset_name": dataset_name,
        "period": None,
        "state_code_raw": None,
        "state_name_raw": None,
        "state_fips_raw": None,
        "sector_code_raw": None,
        "fuel_code_raw": None,
        "fuel_name_raw": None,
        "generation_raw": None,
        "total_consumption_raw": None,
        "consumption_for_eg_raw": None,
        "total_consumption_btu_raw": None,
        "consumption_for_eg_btu_raw": None,
        "retail_sales_raw": None,
        "population_raw": None,
        "generation_units_raw": None,
        "consumption_for_eg_btu_units_raw": None,
        "retail_sales_units_raw": None,
        "source_url": source_url,
        "source_units_json": json.dumps(source_units, sort_keys=True),
        "source_metadata_json": json.dumps(source_metadata, sort_keys=True),
        "batch_id": batch_id,
        "ingested_at_utc": retrieved_at.isoformat(),
        "ingestion_date": retrieved_at.date().isoformat(),
    }


def _collect_records() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    key_vault_url = _required_setting("KEY_VAULT_URL")
    eia_secret_name = _required_setting("EIA_SECRET_NAME")
    census_secret_name = _required_setting("CENSUS_SECRET_NAME")
    credential = _credential()
    secret_client = SecretClient(vault_url=key_vault_url, credential=credential)
    eia_key = secret_client.get_secret(eia_secret_name).value
    census_key = secret_client.get_secret(census_secret_name).value
    if not eia_key or not census_key:
        raise RuntimeError("The configured EIA or Census secret is empty.")

    session = _session()
    common_end = min(
        _metadata_end_period(session, EIA_OPERATIONAL_ROUTE, eia_key),
        _metadata_end_period(session, EIA_RETAIL_ROUTE, eia_key),
    )
    selected_periods = _month_sequence(common_end, 8)
    window = [("start", selected_periods[0]), ("end", selected_periods[-1])]

    operational_url, operational_metadata, operational_rows = _eia_pages(
        session,
        EIA_OPERATIONAL_ROUTE,
        eia_key,
        [
            "generation",
            "total-consumption",
            "consumption-for-eg",
            "total-consumption-btu",
            "consumption-for-eg-btu",
        ],
        window + [("facets[sectorid][]", "99")],
    )
    retail_url, retail_metadata, retail_rows = _eia_pages(
        session,
        EIA_RETAIL_ROUTE,
        eia_key,
        ["sales"],
        window + [("facets[sectorid][]", "ALL")],
    )

    census_response = session.get(
        CENSUS_URL,
        params={"get": f"NAME,{CENSUS_VARIABLE}", "for": "state:*", "key": census_key},
        timeout=90,
    )
    census_response.raise_for_status()
    census_payload = census_response.json()
    if not isinstance(census_payload, list) or len(census_payload) < 2:
        raise RuntimeError("Census Population Estimates API returned no state rows.")
    headers = census_payload[0]
    if CENSUS_VARIABLE not in headers:
        raise RuntimeError(f"Census response does not contain {CENSUS_VARIABLE}.")
    census_rows = [dict(zip(headers, row)) for row in census_payload[1:]]

    for name, rows in {"operational": operational_rows, "retail_sales": retail_rows}.items():
        missing = sorted(set(selected_periods) - {str(row.get("period")) for row in rows})
        if missing:
            raise RuntimeError(f"{name} did not return rows for selected periods: {missing}")

    batch_id = str(uuid.uuid4())
    retrieved_at = datetime.now(timezone.utc)
    records: list[dict[str, Any]] = []

    for row in operational_rows:
        record = _record_base(
            "eia_electric_power_operational",
            operational_url,
            operational_metadata.get("units", {}),
            operational_metadata,
            batch_id,
            retrieved_at,
        )
        record.update(
            {
                "period": _text(row.get("period")),
                "state_code_raw": _text(row.get("location") or row.get("stateid")),
                "state_name_raw": _text(row.get("stateDescription")),
                "sector_code_raw": _text(row.get("sectorid")),
                "fuel_code_raw": _text(row.get("fueltypeid")),
                "fuel_name_raw": _text(row.get("fuelTypeDescription")),
                "generation_raw": _text(row.get("generation")),
                "total_consumption_raw": _text(row.get("total-consumption")),
                "consumption_for_eg_raw": _text(row.get("consumption-for-eg")),
                "total_consumption_btu_raw": _text(row.get("total-consumption-btu")),
                "consumption_for_eg_btu_raw": _text(row.get("consumption-for-eg-btu")),
                "generation_units_raw": _text(row.get("generation-units")),
                "consumption_for_eg_btu_units_raw": _text(
                    row.get("consumption-for-eg-btu-units")
                ),
            }
        )
        records.append(record)

    for row in retail_rows:
        record = _record_base(
            "eia_retail_sales",
            retail_url,
            retail_metadata.get("units", {}),
            retail_metadata,
            batch_id,
            retrieved_at,
        )
        record.update(
            {
                "period": _text(row.get("period")),
                "state_code_raw": _text(row.get("stateid") or row.get("location")),
                "state_name_raw": _text(row.get("stateDescription")),
                "sector_code_raw": _text(row.get("sectorid")),
                "retail_sales_raw": _text(row.get("sales")),
                "retail_sales_units_raw": _text(row.get("sales-units")),
            }
        )
        records.append(record)

    for row in census_rows:
        record = _record_base(
            "census_population_vintage_2025",
            census_response.url,
            {CENSUS_VARIABLE: "persons"},
            {"vintage": "2025", "variable": CENSUS_VARIABLE},
            batch_id,
            retrieved_at,
        )
        record.update(
            {
                "state_name_raw": _text(row.get("NAME")),
                "state_fips_raw": _text(row.get("state")),
                "population_raw": _text(row.get(CENSUS_VARIABLE)),
            }
        )
        records.append(record)

    manifest = {
        "batch_id": batch_id,
        "retrieved_at_utc": retrieved_at.isoformat(),
        "selected_periods": selected_periods,
        "row_counts": {
            "operational": len(operational_rows),
            "retail_sales": len(retail_rows),
            "census_population": len(census_rows),
        },
    }
    return records, manifest


def _run_ingestion() -> dict[str, Any]:
    records, manifest = _collect_records()
    credential = _credential()
    account_url = _required_setting("STORAGE_ACCOUNT_URL")
    container_name = _required_setting("RAW_CONTAINER_NAME")
    container = BlobServiceClient(account_url=account_url, credential=credential).get_container_client(
        container_name
    )
    batch_path = (
        f"energy/{manifest['retrieved_at_utc'][:10].replace('-', '/')}/{manifest['batch_id']}"
    )
    ndjson = "\n".join(json.dumps(record, separators=(",", ":")) for record in records)
    container.upload_blob(
        f"{batch_path}/bronze_records.jsonl",
        ndjson,
        overwrite=True,
        content_settings=ContentSettings(content_type="application/x-ndjson"),
    )
    manifest["bronze_records_path"] = f"{batch_path}/bronze_records.jsonl"
    manifest_json = json.dumps(manifest, indent=2)
    container.upload_blob(
        f"{batch_path}/manifest.json",
        manifest_json,
        overwrite=True,
        content_settings=ContentSettings(content_type="application/json"),
    )
    container.upload_blob(
        "energy/latest.json",
        manifest_json,
        overwrite=True,
        content_settings=ContentSettings(content_type="application/json"),
    )
    logging.info("Completed U.S. energy ingestion batch %s.", manifest["batch_id"])
    return manifest


@app.timer_trigger(
    schedule="%INGEST_SCHEDULE%",
    arg_name="timer",
    run_on_startup=False,
    use_monitor=True,
)
def scheduled_energy_ingestion(timer: func.TimerRequest) -> None:
    if timer.past_due:
        logging.warning("The U.S. energy ingestion timer is past due.")
    _run_ingestion()


@app.route(route="ingest", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def manual_energy_ingestion(request: func.HttpRequest) -> func.HttpResponse:
    try:
        manifest = _run_ingestion()
        return func.HttpResponse(
            json.dumps(manifest),
            status_code=200,
            mimetype="application/json",
        )
    except Exception:
        logging.exception("U.S. energy ingestion failed.")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "failed",
                    "message": "Ingestion failed. Review Application Insights for details.",
                }
            ),
            status_code=500,
            mimetype="application/json",
        )

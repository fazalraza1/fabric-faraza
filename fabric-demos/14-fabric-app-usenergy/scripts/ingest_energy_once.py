"""Fetch one U.S. energy batch and upload it to the ADLS raw container."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from email.utils import format_datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


EIA_BASE_URL = "https://api.eia.gov/v2"
EIA_OPERATIONAL_ROUTE = "electricity/electric-power-operational-data"
EIA_RETAIL_ROUTE = "electricity/retail-sales"
CENSUS_URL = "https://api.census.gov/data/2025/pep/population"
CENSUS_VARIABLE = "POP_2025"
PAGE_SIZE = 5000
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def _az(*arguments: str) -> str:
    executable = shutil.which("az") or shutil.which("az.cmd") or shutil.which("az.exe")
    if not executable:
        raise RuntimeError("Azure CLI is required and must be available on PATH.")
    try:
        result = subprocess.run(
            [executable, *arguments],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or "Azure CLI command failed."
        raise RuntimeError(detail) from exc
    return result.stdout.strip()


def _json_get(
    url: str,
    params: list[tuple[str, str]],
    *,
    timeout: int = 90,
    attempts: int = 6,
) -> Any:
    request_url = f"{url}?{urlencode(params)}" if params else url
    for attempt in range(attempts):
        request = Request(
            request_url,
            headers={
                "Accept": "application/json",
                "User-Agent": "fabric-usenergy-one-time-loader/1.0",
            },
        )
        try:
            with urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            if exc.code not in RETRYABLE_STATUS_CODES or attempt == attempts - 1:
                body = exc.read().decode("utf-8", errors="replace")
                raise RuntimeError(
                    f"GET {url} failed with HTTP {exc.code}: {body[:500]}"
                ) from exc
            retry_after = exc.headers.get("Retry-After")
            delay = float(retry_after) if retry_after else 2**attempt
        except URLError as exc:
            if attempt == attempts - 1:
                raise RuntimeError(f"GET {url} failed: {exc.reason}") from exc
            delay = 2**attempt
        time.sleep(delay)
    raise RuntimeError(f"GET {url} exhausted all retry attempts.")


def _eia_get(route: str, params: list[tuple[str, str]]) -> dict[str, Any]:
    payload = _json_get(f"{EIA_BASE_URL}/{route.strip('/')}/data/", params)
    if not isinstance(payload, dict):
        raise RuntimeError(f"EIA returned an invalid payload for {route}.")
    if payload.get("error"):
        raise RuntimeError(f"EIA returned an error for {route}: {payload['error']}")
    return payload


def _metadata_end_period(route: str, api_key: str) -> str:
    payload = _json_get(
        f"{EIA_BASE_URL}/{route.strip('/')}/",
        [("api_key", api_key)],
    )
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

    visit(payload)
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
        response = _eia_get(route, params).get("response") or {}
        page = response.get("data") or []
        if not isinstance(page, list):
            raise RuntimeError(f"EIA returned invalid row data for {route}.")
        rows.extend(page)
        metadata = {key: value for key, value in response.items() if key != "data"}
        total = int(response.get("total") or 0)
        offset += len(page)
        if not page or offset >= total:
            break
        time.sleep(0.15)
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


def _collect_records(
    eia_key: str,
    census_key: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    common_end = min(
        _metadata_end_period(EIA_OPERATIONAL_ROUTE, eia_key),
        _metadata_end_period(EIA_RETAIL_ROUTE, eia_key),
    )
    selected_periods = _month_sequence(common_end, 8)
    window = [("start", selected_periods[0]), ("end", selected_periods[-1])]

    operational_url, operational_metadata, operational_rows = _eia_pages(
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
        EIA_RETAIL_ROUTE,
        eia_key,
        ["sales"],
        window + [("facets[sectorid][]", "ALL")],
    )

    census_payload = _json_get(
        CENSUS_URL,
        [
            ("get", f"NAME,{CENSUS_VARIABLE}"),
            ("for", "state:*"),
            ("key", census_key),
        ],
    )
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
            CENSUS_URL,
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


def _resolve_secret(
    *,
    environment_name: str,
    key_vault_name: str | None,
    secret_name: str,
) -> str:
    value = os.getenv(environment_name, "").strip()
    if value:
        return value
    if key_vault_name:
        value = _az(
            "keyvault",
            "secret",
            "show",
            "--vault-name",
            key_vault_name,
            "--name",
            secret_name,
            "--query",
            "value",
            "--output",
            "tsv",
        ).strip()
        if value:
            return value
    raise RuntimeError(
        f"Set {environment_name} or provide --key-vault-name with access to '{secret_name}'."
    )


def _upload_blob(
    *,
    account_name: str,
    container_name: str,
    blob_path: str,
    payload: bytes,
    content_type: str,
    access_token: str,
) -> None:
    encoded_path = quote(blob_path, safe="/")
    url = f"https://{account_name}.blob.core.windows.net/{container_name}/{encoded_path}"
    request = Request(
        url,
        data=payload,
        method="PUT",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Length": str(len(payload)),
            "Content-Type": content_type,
            "x-ms-blob-type": "BlockBlob",
            "x-ms-date": format_datetime(datetime.now(timezone.utc), usegmt=True),
            "x-ms-version": "2023-11-03",
        },
    )
    try:
        with urlopen(request, timeout=120) as response:
            if response.status not in {200, 201}:
                raise RuntimeError(
                    f"Storage upload for {blob_path} returned HTTP {response.status}."
                )
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Storage upload for {blob_path} failed with HTTP {exc.code}: {body[:1000]}"
        ) from exc
    except URLError as exc:
        raise RuntimeError(f"Storage upload for {blob_path} failed: {exc.reason}") from exc


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Fetch the latest common EIA/Census reporting window and upload one Bronze-ready "
            "batch to Azure Storage."
        )
    )
    parser.add_argument(
        "--storage-account",
        default=os.getenv("USENERGY_STORAGE_ACCOUNT"),
        required=not bool(os.getenv("USENERGY_STORAGE_ACCOUNT")),
        help="Storage account name. Defaults to USENERGY_STORAGE_ACCOUNT.",
    )
    parser.add_argument("--container", default="raw", help="Existing blob container name.")
    parser.add_argument(
        "--key-vault-name",
        default=os.getenv("USENERGY_KEY_VAULT"),
        help="Optional Key Vault name. Defaults to USENERGY_KEY_VAULT.",
    )
    parser.add_argument("--eia-secret-name", default="eia-api-key")
    parser.add_argument("--census-secret-name", default="census-api-key")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    _az("account", "show", "--output", "none")
    eia_key = _resolve_secret(
        environment_name="EIA_API_KEY",
        key_vault_name=args.key_vault_name,
        secret_name=args.eia_secret_name,
    )
    census_key = _resolve_secret(
        environment_name="CENSUS_API_KEY",
        key_vault_name=args.key_vault_name,
        secret_name=args.census_secret_name,
    )

    print("Fetching the latest common EIA and Census reporting window...")
    records, manifest = _collect_records(eia_key, census_key)
    batch_path = (
        f"energy/{manifest['retrieved_at_utc'][:10].replace('-', '/')}/{manifest['batch_id']}"
    )
    manifest["bronze_records_path"] = f"{batch_path}/bronze_records.jsonl"
    ndjson = "\n".join(
        json.dumps(record, separators=(",", ":"), ensure_ascii=True) for record in records
    ).encode("utf-8")
    manifest_json = json.dumps(manifest, indent=2, ensure_ascii=True).encode("utf-8")
    access_token = _az(
        "account",
        "get-access-token",
        "--resource",
        "https://storage.azure.com/",
        "--query",
        "accessToken",
        "--output",
        "tsv",
    )

    print(f"Uploading batch {manifest['batch_id']} to {args.storage_account}/{args.container}...")
    _upload_blob(
        account_name=args.storage_account,
        container_name=args.container,
        blob_path=manifest["bronze_records_path"],
        payload=ndjson,
        content_type="application/x-ndjson",
        access_token=access_token,
    )
    _upload_blob(
        account_name=args.storage_account,
        container_name=args.container,
        blob_path=f"{batch_path}/manifest.json",
        payload=manifest_json,
        content_type="application/json",
        access_token=access_token,
    )
    _upload_blob(
        account_name=args.storage_account,
        container_name=args.container,
        blob_path="energy/latest.json",
        payload=manifest_json,
        content_type="application/json",
        access_token=access_token,
    )
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

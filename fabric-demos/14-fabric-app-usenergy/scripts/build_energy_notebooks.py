"""Generate valid Fabric .ipynb artifacts for the U.S. energy medallion flow."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOKS = ROOT / "notebooks"


def lines(text: str) -> list[str]:
    source = text.strip("\n").splitlines()
    return [line + "\n" for line in source[:-1]] + source[-1:]


def markdown(text: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": lines(text)}


def code(text: str, *, parameters: bool = False) -> dict:
    metadata = {"tags": ["parameters"]} if parameters else {}
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": metadata,
        "outputs": [],
        "source": lines(text),
    }


def notebook(cells: list[dict]) -> dict:
    return {
        "cells": cells,
        "metadata": {
            "dependencies": {},
            "kernel_info": {"name": "synapse_pyspark"},
            "kernelspec": {
                "display_name": "Synapse PySpark",
                "language": "Python",
                "name": "synapse_pyspark",
            },
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


BRONZE = notebook(
    [
        markdown(
            """
# 01 — Bronze: EIA and Census ingestion

Lands real API responses for the latest **eight complete monthly periods common to both EIA
datasets**. The notebook fails honestly when its EIA key or Key Vault settings are absent.
It never creates sample rows.

**Sources**

* EIA v2 `electricity/electric-power-operational-data` — monthly state/fuel generation,
  consumption-for-electricity-generation, and Btu fields.
* EIA v2 `electricity/retail-sales` — monthly state retail sales MWh.
* Census Population Estimates API — Vintage 2025 state population estimate.

Bind this notebook to a schema-enabled Lakehouse before running. In production, pass the
parameters from a Fabric Variable Library or pipeline; do not place keys in notebook source.
"""
        ),
        code(
            """
environment = "dev"  # dev | test | prod
key_vault_url = ""  # e.g. https://<vault>.vault.azure.net/
eia_secret_name = "eia-api-key"
census_secret_name = "census-api-key"
eia_base_url = "https://api.eia.gov/v2"
census_population_url = "https://api.census.gov/data/2025/pep/population"
census_population_variable = "POP_2025"
expected_jurisdictions = 51
page_size = 5000
""",
            parameters=True,
        ),
        code(
            """
from datetime import datetime, timezone
import json
import time
import uuid
from urllib.parse import urlencode

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import notebookutils
from pyspark.sql import functions as F, types as T

if environment not in {"dev", "test", "prod"}:
    raise ValueError("environment must be dev, test, or prod")
if not key_vault_url:
    raise RuntimeError(
        "key_vault_url is required. Configure it through a Fabric Variable Library or pipeline parameter."
    )
try:
    eia_api_key = notebookutils.credentials.getSecret(key_vault_url, eia_secret_name)
except Exception as exc:
    raise RuntimeError(
        f"Unable to retrieve EIA key '{eia_secret_name}' from Key Vault. "
        "Grant the notebook identity secret access and verify runtime configuration."
    ) from exc
if not eia_api_key:
    raise RuntimeError("The configured EIA secret is empty.")
try:
    census_api_key = notebookutils.credentials.getSecret(key_vault_url, census_secret_name)
except Exception as exc:
    raise RuntimeError(
        f"Unable to retrieve Census key '{census_secret_name}' from Key Vault. "
        "Grant the notebook identity secret access and verify runtime configuration."
    ) from exc
if not census_api_key:
    raise RuntimeError("The configured Census API secret is empty.")

batch_id = str(uuid.uuid4())
retrieved_at = datetime.now(timezone.utc)
session = requests.Session()
session.mount(
    "https://",
    HTTPAdapter(max_retries=Retry(total=5, backoff_factor=1.0, status_forcelist=[429, 500, 502, 503, 504])),
)
spark.sql("CREATE SCHEMA IF NOT EXISTS bronze")
"""
        ),
        markdown(
            """
## Robust EIA paging and metadata-driven period selection

Every page is checked against EIA's reported `total`. The period probe requests real rows from
each route, then intersects valid `YYYY-MM` periods. A period cannot enter the processing window
unless it exists in **both** EIA sources.
"""
        ),
        code(
            """
def eia_get(route, params):
    url = f"{eia_base_url}/{route.strip('/')}/data/"
    response = session.get(url, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    if "error" in payload:
        raise RuntimeError(f"EIA returned an error for {route}: {payload['error']}")
    return url, payload


def eia_pages(route, data_fields, extra_params=None):
    offset = 0
    rows = []
    source_url = None
    response_metadata = None
    while True:
        params = [
            ("api_key", eia_api_key),
            ("frequency", "monthly"),
            ("offset", str(offset)),
            ("length", str(page_size)),
            ("sort[0][column]", "period"),
            ("sort[0][direction]", "asc"),
        ]
        params.extend((f"data[{index}]", field) for index, field in enumerate(data_fields))
        params.extend(extra_params or [])
        source_url, payload = eia_get(route, params)
        response = payload.get("response") or {}
        page = response.get("data") or []
        rows.extend(page)
        response_metadata = {key: value for key, value in response.items() if key != "data"}
        total = int(response.get("total") or 0)
        offset += len(page)
        if not page or offset >= total:
            break
        time.sleep(0.15)
    if response_metadata is None:
        raise RuntimeError(f"EIA route {route} returned no response metadata.")
    if len(rows) != int(response_metadata.get("total") or len(rows)):
        raise RuntimeError(f"Incomplete EIA pagination for {route}: {len(rows)} rows retrieved.")
    return source_url, response_metadata, rows


def metadata_end_period(route):
    url = f"{eia_base_url}/{route.strip('/')}/"
    response = session.get(url, params={"api_key": eia_api_key}, timeout=90)
    response.raise_for_status()
    payload = response.json()
    monthly_periods = []

    def visit(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if (
                    key == "endPeriod"
                    and isinstance(value, str)
                    and len(value) == 7
                    and value[4] == "-"
                ):
                    monthly_periods.append(value)
                visit(value)
        elif isinstance(node, list):
            for value in node:
                visit(value)

    visit(payload)
    if not monthly_periods:
        raise RuntimeError(f"EIA metadata for {route} has no monthly endPeriod.")
    return max(monthly_periods)


def month_sequence(end_period, count):
    year, month = (int(part) for part in end_period.split("-"))
    values = []
    for _ in range(count):
        values.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return sorted(values)


operational_end = metadata_end_period("electricity/electric-power-operational-data")
retail_end = metadata_end_period("electricity/retail-sales")
common_end = min(operational_end, retail_end)
selected_periods = month_sequence(common_end, 8)
window_params = [("start", selected_periods[0]), ("end", selected_periods[-1])]
print(
    {
        "operational_end_period": operational_end,
        "retail_end_period": retail_end,
        "selected_common_periods": selected_periods,
    }
)
"""
        ),
        markdown(
            """
## Fetch and stage source rows

The operational query uses EIA's all-electric-power-sector facet (`99`) and keeps state and fuel
dimensions. Retail sales uses the all-sector record. Raw strings are retained so suppression
markers remain distinguishable from missing values in Silver.
"""
        ),
        code(
            """
operational_fields = [
    "generation",
    "total-consumption",
    "consumption-for-eg",
    "total-consumption-btu",
    "consumption-for-eg-btu",
]
op_url, op_metadata, operational_rows = eia_pages(
    "electricity/electric-power-operational-data",
    operational_fields,
    window_params + [("facets[sectorid][]", "99")],
)
retail_url, retail_metadata, retail_rows = eia_pages(
    "electricity/retail-sales",
    ["sales"],
    window_params + [("facets[sectorid][]", "ALL")],
)
for name, rows in {
    "operational": operational_rows,
    "retail_sales": retail_rows,
}.items():
    returned_periods = {str(row.get("period")) for row in rows}
    missing_periods = sorted(set(selected_periods) - returned_periods)
    if missing_periods:
        raise RuntimeError(
            f"{name} metadata advertised the selected window but returned no rows for {missing_periods}."
        )

census_params = {
    "get": f"NAME,{census_population_variable}",
    "for": "state:*",
    "key": census_api_key,
}
census_response = session.get(census_population_url, params=census_params, timeout=90)
census_response.raise_for_status()
census_payload = census_response.json()
if not isinstance(census_payload, list) or len(census_payload) < 2:
    raise RuntimeError("Census Vintage 2025 endpoint returned no state population rows.")
headers = census_payload[0]
if census_population_variable not in headers:
    raise RuntimeError(
        f"Census response does not contain {census_population_variable}; "
        "do not substitute an older vintage silently."
    )
census_rows = [dict(zip(headers, row)) for row in census_payload[1:]]
"""
        ),
        code(
            """
raw_schema = T.StructType(
    [
        T.StructField("dataset_name", T.StringType(), False),
        T.StructField("period", T.StringType(), True),
        T.StructField("state_code_raw", T.StringType(), True),
        T.StructField("state_name_raw", T.StringType(), True),
        T.StructField("state_fips_raw", T.StringType(), True),
        T.StructField("sector_code_raw", T.StringType(), True),
        T.StructField("fuel_code_raw", T.StringType(), True),
        T.StructField("fuel_name_raw", T.StringType(), True),
        T.StructField("generation_raw", T.StringType(), True),
        T.StructField("total_consumption_raw", T.StringType(), True),
        T.StructField("consumption_for_eg_raw", T.StringType(), True),
        T.StructField("total_consumption_btu_raw", T.StringType(), True),
        T.StructField("consumption_for_eg_btu_raw", T.StringType(), True),
        T.StructField("retail_sales_raw", T.StringType(), True),
        T.StructField("population_raw", T.StringType(), True),
        T.StructField("generation_units_raw", T.StringType(), True),
        T.StructField("consumption_for_eg_btu_units_raw", T.StringType(), True),
        T.StructField("retail_sales_units_raw", T.StringType(), True),
        T.StructField("source_url", T.StringType(), False),
        T.StructField("source_units_json", T.StringType(), True),
        T.StructField("source_metadata_json", T.StringType(), True),
        T.StructField("batch_id", T.StringType(), False),
        T.StructField("ingested_at_utc", T.TimestampType(), False),
        T.StructField("ingestion_date", T.DateType(), False),
    ]
)

def as_text(value):
    return None if value is None else str(value)

def op_record(row):
    return (
        "eia_electric_power_operational",
        as_text(row.get("period")),
        as_text(row.get("location") or row.get("stateid")),
        as_text(row.get("stateDescription")),
        None,
        as_text(row.get("sectorid")),
        as_text(row.get("fueltypeid")),
        as_text(row.get("fuelTypeDescription")),
        as_text(row.get("generation")),
        as_text(row.get("total-consumption")),
        as_text(row.get("consumption-for-eg")),
        as_text(row.get("total-consumption-btu")),
        as_text(row.get("consumption-for-eg-btu")),
        None,
        None,
        as_text(row.get("generation-units")),
        as_text(row.get("consumption-for-eg-btu-units")),
        None,
        op_url,
        json.dumps(op_metadata.get("units", {}), sort_keys=True),
        json.dumps(op_metadata, sort_keys=True),
        batch_id,
        retrieved_at,
        retrieved_at.date(),
    )

def retail_record(row):
    return (
        "eia_retail_sales", as_text(row.get("period")),
        as_text(row.get("stateid") or row.get("location")),
        as_text(row.get("stateDescription")), None, as_text(row.get("sectorid")),
        None, None, None, None, None, None, None, as_text(row.get("sales")), None,
        None, None, as_text(row.get("sales-units")),
        retail_url, json.dumps(retail_metadata.get("units", {}), sort_keys=True),
        json.dumps(retail_metadata, sort_keys=True), batch_id, retrieved_at, retrieved_at.date(),
    )

def census_record(row):
    return (
        "census_population_vintage_2025", None, None, as_text(row.get("NAME")),
        as_text(row.get("state")), None, None, None, None, None, None, None, None,
        None, as_text(row.get(census_population_variable)),
        None, None, None,
        census_response.url, json.dumps({census_population_variable: "persons"}),
        json.dumps({"vintage": "2025", "variable": census_population_variable}),
        batch_id, retrieved_at, retrieved_at.date(),
    )

raw_records = (
    [op_record(row) for row in operational_rows]
    + [retail_record(row) for row in retail_rows]
    + [census_record(row) for row in census_rows]
)
bronze_df = spark.createDataFrame(raw_records, raw_schema)

landing_path = f"Files/energy/bronze/{environment}/{retrieved_at:%Y/%m/%d}/{batch_id}"
notebookutils.fs.mkdirs(landing_path)
notebookutils.fs.put(
    f"{landing_path}/manifest.json",
    json.dumps(
        {
            "batch_id": batch_id,
            "retrieved_at_utc": retrieved_at.isoformat(),
            "selected_periods": selected_periods,
            "row_counts": {
                "operational": len(operational_rows),
                "retail_sales": len(retail_rows),
                "census_population": len(census_rows),
            },
        },
        indent=2,
    ),
    True,
)

(bronze_df.write.format("delta").mode("append").partitionBy("ingestion_date", "dataset_name")
 .saveAsTable("bronze.energy_source_raw"))
"""
        ),
        code(
            """
counts = {row["dataset_name"]: row["count"] for row in bronze_df.groupBy("dataset_name").count().collect()}
required = {
    "eia_electric_power_operational",
    "eia_retail_sales",
    "census_population_vintage_2025",
}
if set(counts) != required or any(counts[name] == 0 for name in required):
    raise RuntimeError(f"Bronze validation failed; source counts: {counts}")
if set(bronze_df.where(F.col("period").isNotNull()).select("period").distinct().toPandas()["period"]) != set(selected_periods):
    raise RuntimeError("Bronze periods do not exactly match the selected common window.")
print({"batch_id": batch_id, "counts": counts, "selected_periods": selected_periods})
"""
        ),
    ]
)

AZURE_BRONZE = notebook(
    [
        markdown(
            """
# 01A — Bronze from the Azure landing zone

Use this notebook after deploying the optional Azure ingestion layer and creating a Lakehouse
shortcut named `us-energy-raw` that points to the deployed Storage account's `raw` container.

The Azure Function writes a validated, Bronze-ready NDJSON batch and updates
`energy/latest.json`. This notebook reads that manifest, validates the expected datasets and
eight-month window, then appends the batch to `bronze.energy_source_raw`.

Do not run both `01_bronze_ingest.ipynb` and this notebook for the same refresh. Choose one
Bronze ingestion path, then continue with notebooks 02 and 03.
"""
        ),
        code(
            """
environment = "dev"  # dev | test | prod
raw_shortcut_name = "us-energy-raw"
""",
            parameters=True,
        ),
        code(
            """
from datetime import datetime
import json

import notebookutils
from pyspark.sql import functions as F, types as T

if environment not in {"dev", "test", "prod"}:
    raise ValueError("environment must be dev, test, or prod")
if not raw_shortcut_name or "/" in raw_shortcut_name:
    raise ValueError("raw_shortcut_name must be the Lakehouse shortcut name only.")

spark.sql("CREATE SCHEMA IF NOT EXISTS bronze")
manifest_path = f"Files/{raw_shortcut_name}/energy/latest.json"
try:
    manifest = json.loads(notebookutils.fs.head(manifest_path, 1024 * 1024))
except Exception as exc:
    raise RuntimeError(
        f"Unable to read {manifest_path}. Verify the shortcut, Storage RBAC, and that the "
        "Azure Function completed at least one ingestion."
    ) from exc

required_manifest_fields = {
    "batch_id",
    "retrieved_at_utc",
    "selected_periods",
    "row_counts",
    "bronze_records_path",
}
missing_manifest_fields = required_manifest_fields - set(manifest)
if missing_manifest_fields:
    raise RuntimeError(f"Azure landing manifest is missing fields: {sorted(missing_manifest_fields)}")
if len(manifest["selected_periods"]) != 8:
    raise RuntimeError("Azure landing manifest must contain exactly eight selected periods.")

records_path = f"Files/{raw_shortcut_name}/{manifest['bronze_records_path']}"
bronze_df = spark.read.json(records_path)
required_columns = {
    "dataset_name",
    "period",
    "state_code_raw",
    "state_name_raw",
    "state_fips_raw",
    "sector_code_raw",
    "fuel_code_raw",
    "fuel_name_raw",
    "generation_raw",
    "total_consumption_raw",
    "consumption_for_eg_raw",
    "total_consumption_btu_raw",
    "consumption_for_eg_btu_raw",
    "retail_sales_raw",
    "population_raw",
    "generation_units_raw",
    "consumption_for_eg_btu_units_raw",
    "retail_sales_units_raw",
    "source_url",
    "source_units_json",
    "source_metadata_json",
    "batch_id",
    "ingested_at_utc",
    "ingestion_date",
}
missing_columns = required_columns - set(bronze_df.columns)
if missing_columns:
    raise RuntimeError(f"Azure Bronze records are missing columns: {sorted(missing_columns)}")

bronze_df = (
    bronze_df.select(*sorted(required_columns))
    .withColumn("ingested_at_utc", F.to_timestamp("ingested_at_utc"))
    .withColumn("ingestion_date", F.to_date("ingestion_date"))
)
if bronze_df.where(F.col("batch_id") != F.lit(manifest["batch_id"])).limit(1).count():
    raise RuntimeError("Azure Bronze records contain a batch ID different from the latest manifest.")
"""
        ),
        code(
            """
counts = {
    row["dataset_name"]: row["count"]
    for row in bronze_df.groupBy("dataset_name").count().collect()
}
required_datasets = {
    "eia_electric_power_operational",
    "eia_retail_sales",
    "census_population_vintage_2025",
}
if set(counts) != required_datasets or any(counts[name] == 0 for name in required_datasets):
    raise RuntimeError(f"Azure Bronze validation failed; source counts: {counts}")

selected_periods = {
    row["period"]
    for row in bronze_df.where(F.col("period").isNotNull()).select("period").distinct().collect()
}
if selected_periods != set(manifest["selected_periods"]):
    raise RuntimeError(
        "Azure Bronze periods do not exactly match the selected periods in the latest manifest."
    )

existing_batch = (
    spark.table("bronze.energy_source_raw")
    .where(F.col("batch_id") == F.lit(manifest["batch_id"]))
    .limit(1)
    .count()
    if spark.catalog.tableExists("bronze.energy_source_raw")
    else 0
)
if existing_batch:
    raise RuntimeError(
        f"Batch {manifest['batch_id']} is already present in bronze.energy_source_raw."
    )

(
    bronze_df.write.format("delta")
    .mode("append")
    .partitionBy("ingestion_date", "dataset_name")
    .saveAsTable("bronze.energy_source_raw")
)
print(
    {
        "batch_id": manifest["batch_id"],
        "counts": counts,
        "selected_periods": manifest["selected_periods"],
        "source": records_path,
    }
)
"""
        ),
    ]
)


SILVER = notebook(
    [
        markdown(
            """
# 02 — Silver: normalize and validate

Reads the latest successful Bronze batch, applies explicit schemas and canonical state/fuel
mappings, preserves suppressed and missing values as null plus a status, and materializes
validated Delta tables.

Natural keys:

* Operational: `(period, state_code, fuel_code)`
* Retail sales: `(period, state_code)`
* Population: `(state_code)`
"""
        ),
        code(
            """
environment = "dev"
expected_jurisdictions = 51
""",
            parameters=True,
        ),
        code(
            """
from pyspark.sql import functions as F, types as T, Window

if environment not in {"dev", "test", "prod"}:
    raise ValueError("environment must be dev, test, or prod")
spark.sql("CREATE SCHEMA IF NOT EXISTS silver")

raw = spark.table("bronze.energy_source_raw")
latest_batch = (
    raw.groupBy("batch_id")
    .agg(F.max("ingested_at_utc").alias("ingested_at_utc"))
    .orderBy(F.desc("ingested_at_utc"))
    .first()
)
if latest_batch is None:
    raise RuntimeError("Bronze is empty; run 01_bronze_ingest first.")
batch_id = latest_batch["batch_id"]
raw = raw.where(F.col("batch_id") == batch_id)
"""
        ),
        code(
            """
STATE_ROWS = [
    ("01","AL","Alabama"),("02","AK","Alaska"),("04","AZ","Arizona"),("05","AR","Arkansas"),
    ("06","CA","California"),("08","CO","Colorado"),("09","CT","Connecticut"),("10","DE","Delaware"),
    ("11","DC","District of Columbia"),("12","FL","Florida"),("13","GA","Georgia"),("15","HI","Hawaii"),
    ("16","ID","Idaho"),("17","IL","Illinois"),("18","IN","Indiana"),("19","IA","Iowa"),
    ("20","KS","Kansas"),("21","KY","Kentucky"),("22","LA","Louisiana"),("23","ME","Maine"),
    ("24","MD","Maryland"),("25","MA","Massachusetts"),("26","MI","Michigan"),("27","MN","Minnesota"),
    ("28","MS","Mississippi"),("29","MO","Missouri"),("30","MT","Montana"),("31","NE","Nebraska"),
    ("32","NV","Nevada"),("33","NH","New Hampshire"),("34","NJ","New Jersey"),("35","NM","New Mexico"),
    ("36","NY","New York"),("37","NC","North Carolina"),("38","ND","North Dakota"),("39","OH","Ohio"),
    ("40","OK","Oklahoma"),("41","OR","Oregon"),("42","PA","Pennsylvania"),("44","RI","Rhode Island"),
    ("45","SC","South Carolina"),("46","SD","South Dakota"),("47","TN","Tennessee"),("48","TX","Texas"),
    ("49","UT","Utah"),("50","VT","Vermont"),("51","VA","Virginia"),("53","WA","Washington"),
    ("54","WV","West Virginia"),("55","WI","Wisconsin"),("56","WY","Wyoming"),
]
state_schema = "census_state_fips string, state_code string, state_name string"
states = spark.createDataFrame(STATE_ROWS, state_schema)

FUEL_CATEGORY = {
    "SUN": "carbon_free", "WND": "carbon_free", "HYC": "carbon_free",
    "HPS": "carbon_free", "NUC": "carbon_free", "GEO": "carbon_free",
    "WWW": "carbon_free", "WAS": "carbon_free",
    "COL": "fossil", "NG": "fossil", "PEL": "fossil", "PC": "fossil",
    "OOG": "fossil", "SGC": "fossil",
}
fuel_category_expr = F.create_map(
    *[item for pair in FUEL_CATEGORY.items() for item in (F.lit(pair[0]), F.lit(pair[1]))]
)

suppressed = ["--", "NA", "N/A", "NM", "W", "S", "*"]

def numeric_status(column_name):
    raw_value = F.trim(F.col(column_name))
    return (
        F.when(F.col(column_name).isNull() | (raw_value == ""), F.lit("missing"))
        .when(F.upper(raw_value).isin(suppressed), F.lit("suppressed"))
        .otherwise(F.lit("reported"))
    )

def numeric_value(column_name):
    return (
        F.when(numeric_status(column_name) == "reported", F.regexp_replace(F.col(column_name), ",", "").cast("double"))
        .otherwise(F.lit(None).cast("double"))
    )
"""
        ),
        code(
            """
operational = (
    raw.where(F.col("dataset_name") == "eia_electric_power_operational")
    .withColumn("state_code", F.upper(F.trim("state_code_raw")))
    .withColumn("fuel_code", F.upper(F.trim("fuel_code_raw")))
    .withColumn("generation_mwh", numeric_value("generation_raw"))
    .withColumn("generation_status", numeric_status("generation_raw"))
    .withColumn("total_consumption", numeric_value("total_consumption_raw"))
    .withColumn("consumption_for_eg", numeric_value("consumption_for_eg_raw"))
    .withColumn("total_consumption_btu", numeric_value("total_consumption_btu_raw"))
    .withColumn("consumption_for_eg_btu", numeric_value("consumption_for_eg_btu_raw"))
    .join(F.broadcast(states), "state_code", "inner")
    .withColumn("fuel_category", F.coalesce(fuel_category_expr[F.col("fuel_code")], F.lit("other")))
    .select(
        "period", "state_code", "state_name", "fuel_code",
        F.coalesce(F.col("fuel_name_raw"), F.col("fuel_code")).alias("fuel_name"),
        "fuel_category", "generation_mwh", "generation_status", "total_consumption",
        "consumption_for_eg", "total_consumption_btu", "consumption_for_eg_btu",
        "generation_units_raw", "consumption_for_eg_btu_units_raw",
        "source_url", "source_units_json", "batch_id", "ingested_at_utc",
    )
)

retail = (
    raw.where(F.col("dataset_name") == "eia_retail_sales")
    .withColumn("state_code", F.upper(F.trim("state_code_raw")))
    .withColumn("retail_sales_mwh", numeric_value("retail_sales_raw"))
    .withColumn("retail_sales_status", numeric_status("retail_sales_raw"))
    .join(F.broadcast(states), "state_code", "inner")
    .select(
        "period", "state_code", "state_name", "retail_sales_mwh", "retail_sales_status",
        "retail_sales_units_raw",
        "source_url", "source_units_json", "batch_id", "ingested_at_utc",
    )
)

population = (
    raw.where(F.col("dataset_name") == "census_population_vintage_2025")
    .withColumnRenamed("state_fips_raw", "census_state_fips")
    .withColumn("population", numeric_value("population_raw").cast("long"))
    .join(F.broadcast(states), "census_state_fips", "inner")
    .select(
        "state_code", "state_name", "census_state_fips", "population",
        F.lit(2025).alias("estimate_year"), F.lit("Vintage 2025").alias("vintage"),
        "source_url", "batch_id", "ingested_at_utc",
    )
)
"""
        ),
        code(
            """
def assert_unique(df, keys, name):
    duplicates = df.groupBy(*keys).count().where(F.col("count") > 1)
    if duplicates.limit(1).count():
        duplicates.show(20, truncate=False)
        raise RuntimeError(f"{name} contains duplicate keys: {keys}")

def assert_nonnegative(df, columns, name):
    condition = None
    for column in columns:
        check = F.col(column).isNotNull() & (F.col(column) < 0)
        condition = check if condition is None else condition | check
    if df.where(condition).limit(1).count():
        raise RuntimeError(f"{name} contains negative reported values.")

assert_unique(operational, ["period", "state_code", "fuel_code"], "operational")
assert_unique(retail, ["period", "state_code"], "retail")
assert_unique(population, ["state_code"], "population")
assert_nonnegative(
    operational,
    ["generation_mwh", "total_consumption", "consumption_for_eg", "total_consumption_btu", "consumption_for_eg_btu"],
    "operational",
)
assert_nonnegative(retail, ["retail_sales_mwh"], "retail")
assert_nonnegative(population, ["population"], "population")

for name, df in {"operational": operational, "retail": retail}.items():
    coverage = df.groupBy("period").agg(F.countDistinct("state_code").alias("jurisdictions"))
    bad = coverage.where(F.col("jurisdictions") != expected_jurisdictions)
    if bad.limit(1).count():
        bad.show(truncate=False)
        raise RuntimeError(f"{name} does not cover all 50 states plus DC for every period.")
if population.select("state_code").distinct().count() != expected_jurisdictions:
    raise RuntimeError("Census population does not cover all 50 states plus DC.")
"""
        ),
        code(
            """
selected_periods = sorted(row["period"] for row in retail.select("period").distinct().collect())
replace_where = f"period >= '{selected_periods[0]}' AND period <= '{selected_periods[-1]}'"
for table_name in ["silver.state_month_fuel", "silver.state_month_retail_sales"]:
    if spark.catalog.tableExists(table_name):
        keep = ",".join(f"'{period}'" for period in selected_periods)
        spark.sql(f"DELETE FROM {table_name} WHERE period NOT IN ({keep})")
(
    operational.write.format("delta").mode("overwrite")
    .option("replaceWhere", replace_where)
    .partitionBy("period").saveAsTable("silver.state_month_fuel")
)
(
    retail.write.format("delta").mode("overwrite")
    .option("replaceWhere", replace_where)
    .partitionBy("period").saveAsTable("silver.state_month_retail_sales")
)
population.write.format("delta").mode("overwrite").saveAsTable("silver.state_population")

spark.sql("OPTIMIZE silver.state_month_fuel ZORDER BY (state_code, fuel_code)")
spark.sql("OPTIMIZE silver.state_month_retail_sales ZORDER BY (state_code)")
print(
    {
        "batch_id": batch_id,
        "operational_rows": operational.count(),
        "retail_rows": retail.count(),
        "population_rows": population.count(),
    }
)
"""
        ),
    ]
)


GOLD = notebook(
    [
        markdown(
            """
# 03 — Gold: State Energy Explorer serving tables

Builds SQL-endpoint-visible Delta tables. All ratios use null-safe division; no missing or
suppressed value becomes zero.

## Exact table grains

* `gold.gold_state_month_energy` — one row per period, state, and fuel.
* `gold.gold_state_month_electricity` — one row per period and state.
* `gold.gold_state_population` — one row per state/DC.
* `gold.gold_national_month_summary` — one row per period.
* `gold.gold_data_freshness` — one row per source dataset.

`supply_balance_proxy` is explicitly labeled a proxy because state generation divided by retail
sales is not a physical interchange-adjusted power balance.
"""
        ),
        code(
            """
environment = "dev"
expected_jurisdictions = 51
""",
            parameters=True,
        ),
        code(
            """
from pyspark.sql import functions as F, Window

if environment not in {"dev", "test", "prod"}:
    raise ValueError("environment must be dev, test, or prod")
spark.sql("CREATE SCHEMA IF NOT EXISTS gold")
spark.conf.set("spark.sql.parquet.vorder.default", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.databricks.delta.optimizeWrite.binSize", "1g")

fuel = spark.table("silver.state_month_fuel")
retail = spark.table("silver.state_month_retail_sales")
population = spark.table("silver.state_population")

def ratio(numerator, denominator):
    return F.when(
        numerator.isNotNull() & denominator.isNotNull() & (denominator > 0),
        numerator / denominator,
    )

periods = sorted(
    set(row["period"] for row in fuel.select("period").distinct().collect())
    .intersection(row["period"] for row in retail.select("period").distinct().collect())
)
selected_periods = periods[-8:]
if len(selected_periods) != 8:
    raise RuntimeError(f"Gold requires 8 common periods; found {selected_periods}")
fuel = fuel.where(F.col("period").isin(selected_periods))
retail = retail.where(F.col("period").isin(selected_periods))
"""
        ),
        markdown(
            """
## Fuel-grain table schema and calculations

`consumption_for_eg_btu` is retained with its EIA source-unit metadata. The normalized
`consumption_for_eg_mmbtu` column is published only after the row-level EIA unit fields are
validated as MWh and MMBtu.
"""
        ),
        code(
            """
def normalized_units(df, column_name):
    return {
        row["unit"]
        for row in (
            df.where(F.col(column_name).isNotNull())
            .select(
                F.lower(
                    F.regexp_replace(F.trim(F.col(column_name)), "[^A-Za-z]", "")
                ).alias("unit")
            )
            .distinct()
            .collect()
        )
    }

def assert_units(df, column_name, accepted, dataset_name):
    actual = normalized_units(df, column_name)
    if not actual:
        raise RuntimeError(f"{dataset_name} returned no row-level unit for {column_name}.")
    unexpected = actual.difference(accepted)
    if unexpected:
        raise RuntimeError(
            f"{dataset_name} returned unsupported {column_name} values: {sorted(unexpected)}"
        )

assert_units(
    fuel,
    "generation_units_raw",
    {"megawatthours", "mwh"},
    "EIA electric power operations",
)
assert_units(
    fuel,
    "consumption_for_eg_btu_units_raw",
    {"mmbtu", "millionbtu", "millionbritishthermalunits"},
    "EIA electric power operations",
)
assert_units(
    retail,
    "retail_sales_units_raw",
    {"megawatthours", "mwh"},
    "EIA retail sales",
)

state_totals = fuel.groupBy("period", "state_code").agg(
    F.sum("generation_mwh").alias("state_generation_mwh")
)
gold_energy = (
    fuel.join(state_totals, ["period", "state_code"])
    .join(population.select("state_code", "population"), "state_code")
    .withColumn("consumption_for_eg_mmbtu", F.col("consumption_for_eg_btu"))
    .withColumn("generation_mix_pct", ratio(F.col("generation_mwh"), F.col("state_generation_mwh")) * 100)
    .withColumn(
        "fuel_intensity_mmbtu_per_mwh",
        ratio(F.col("consumption_for_eg_mmbtu"), F.col("generation_mwh")),
    )
    .withColumn(
        "generation_mwh_per_1000_residents",
        ratio(F.col("generation_mwh"), F.col("population")) * 1000,
    )
    .withColumnRenamed("generation_status", "value_status")
    .withColumn("source", F.lit("EIA v2 electric-power-operational-data; Census PEP Vintage 2025"))
    .withColumn("generation_unit", F.lit("MWh"))
    .withColumn("consumption_unit", F.lit("MMBtu"))
    .select(
        "period", "state_code", "state_name", "fuel_code", "fuel_name", "fuel_category",
        "generation_mwh", "consumption_for_eg_btu", "consumption_for_eg_mmbtu",
        "generation_mix_pct", "fuel_intensity_mmbtu_per_mwh", "population",
        "generation_mwh_per_1000_residents", "value_status", "source",
        "generation_unit", "consumption_unit",
    )
)
"""
        ),
        code(
            """
generation_rollup = fuel.groupBy("period", "state_code", "state_name").agg(
    F.sum("generation_mwh").alias("generation_mwh"),
    F.sum(F.when(F.col("fuel_category") == "carbon_free", F.col("generation_mwh"))).alias("carbon_free_mwh"),
    F.sum(F.when(F.col("fuel_category") == "fossil", F.col("generation_mwh"))).alias("fossil_mwh"),
    F.count("*").alias("fuel_rows"),
    F.sum(F.when(F.col("generation_status") == "reported", 1).otherwise(0)).alias("reported_fuel_rows"),
)

state_month = (
    generation_rollup.join(retail, ["period", "state_code", "state_name"], "full")
    .join(population.select("state_code", "population"), "state_code")
    .withColumn("generation_mwh_per_1000_residents", ratio(F.col("generation_mwh"), F.col("population")) * 1000)
    .withColumn("electricity_consumption_kwh_per_person", ratio(F.col("retail_sales_mwh") * 1000, F.col("population")))
    .withColumn("carbon_free_share_pct", ratio(F.col("carbon_free_mwh"), F.col("generation_mwh")) * 100)
    .withColumn("fossil_dependency_pct", ratio(F.col("fossil_mwh"), F.col("generation_mwh")) * 100)
    .withColumn("supply_balance_proxy", ratio(F.col("generation_mwh"), F.col("retail_sales_mwh")))
)

state_window = Window.partitionBy("state_code").orderBy("period")
period_window = Window.partitionBy("period")
state_month = (
    state_month
    .withColumn("previous_retail_sales_mwh", F.lag("retail_sales_mwh").over(state_window))
    .withColumn(
        "retail_sales_mom_pct",
        ratio(F.col("retail_sales_mwh") - F.col("previous_retail_sales_mwh"), F.col("previous_retail_sales_mwh")) * 100,
    )
    .withColumn("retail_sales_eight_month_high_mwh", F.max("retail_sales_mwh").over(Window.partitionBy("state_code")))
    .withColumn("retail_sales_eight_month_low_mwh", F.min("retail_sales_mwh").over(Window.partitionBy("state_code")))
    .withColumn("retail_sales_state_rank", F.dense_rank().over(period_window.orderBy(F.desc_nulls_last("retail_sales_mwh"))))
    .withColumn("retail_sales_national_median_mwh", F.percentile_approx("retail_sales_mwh", F.lit(0.5)).over(period_window))
    .withColumn(
        "completeness_pct",
        (
            F.col("reported_fuel_rows")
            + F.when(F.col("retail_sales_status") == "reported", 1).otherwise(0)
        ) / (F.col("fuel_rows") + 1) * 100,
    )
    .withColumn("source", F.lit("EIA v2 operational + retail-sales; Census PEP Vintage 2025"))
    .select(
        "period", "state_code", "state_name", "population", "generation_mwh",
        "retail_sales_mwh", "generation_mwh_per_1000_residents",
        "electricity_consumption_kwh_per_person", "carbon_free_share_pct",
        "fossil_dependency_pct", "supply_balance_proxy", "retail_sales_mom_pct",
        "retail_sales_eight_month_high_mwh", "retail_sales_eight_month_low_mwh",
        "retail_sales_state_rank", "retail_sales_national_median_mwh",
        "completeness_pct", "source",
    )
)
"""
        ),
        code(
            """
national = (
    state_month.groupBy("period")
    .agg(
        F.sum("population").alias("population"),
        F.sum("generation_mwh").alias("generation_mwh"),
        F.sum("retail_sales_mwh").alias("retail_sales_mwh"),
        F.sum(F.col("generation_mwh") * F.col("carbon_free_share_pct") / 100).alias("carbon_free_mwh"),
        F.sum(F.col("generation_mwh") * F.col("fossil_dependency_pct") / 100).alias("fossil_mwh"),
        F.countDistinct("state_code").alias("reporting_jurisdictions"),
    )
    .withColumn("expected_jurisdictions", F.lit(expected_jurisdictions))
    .withColumn("electricity_consumption_kwh_per_person", ratio(F.col("retail_sales_mwh") * 1000, F.col("population")))
    .withColumn("carbon_free_share_pct", ratio(F.col("carbon_free_mwh"), F.col("generation_mwh")) * 100)
    .withColumn("fossil_dependency_pct", ratio(F.col("fossil_mwh"), F.col("generation_mwh")) * 100)
    .withColumn("supply_balance_proxy", ratio(F.col("generation_mwh"), F.col("retail_sales_mwh")))
    .withColumn("previous_retail_sales_mwh", F.lag("retail_sales_mwh").over(Window.orderBy("period")))
    .withColumn(
        "retail_sales_mom_pct",
        ratio(F.col("retail_sales_mwh") - F.col("previous_retail_sales_mwh"), F.col("previous_retail_sales_mwh")) * 100,
    )
    .withColumn("completeness_pct", F.col("reporting_jurisdictions") / F.col("expected_jurisdictions") * 100)
    .withColumn("source", F.lit("EIA v2 operational + retail-sales; Census PEP Vintage 2025"))
    .select(
        "period", "population", "generation_mwh", "retail_sales_mwh",
        "electricity_consumption_kwh_per_person", "carbon_free_share_pct",
        "fossil_dependency_pct", "supply_balance_proxy", "retail_sales_mom_pct",
        "reporting_jurisdictions", "expected_jurisdictions", "completeness_pct", "source",
    )
)

gold_population = (
    population.select(
        "state_code", "state_name", "census_state_fips", "population", "estimate_year",
        "vintage", F.col("source_url").alias("source"),
        F.col("ingested_at_utc").alias("retrieved_at_utc"),
    )
)
"""
        ),
        code(
            """
retrieval = fuel.agg(F.max("ingested_at_utc").alias("retrieved")).first()["retrieved"]
freshness_rows = []
for dataset_name, frame, source in [
    ("EIA operational", fuel, "EIA v2 electric-power-operational-data"),
    ("EIA retail sales", retail, "EIA v2 retail-sales"),
]:
    latest = frame.agg(F.max("period").alias("latest")).first()["latest"]
    actual = (
        frame.where(F.col("period") == selected_periods[-1])
        .select("state_code").distinct().count()
    )
    completeness = actual / expected_jurisdictions * 100
    freshness_rows.append(
        (
            dataset_name, source, latest, selected_periods[-1], selected_periods[0],
            retrieval, expected_jurisdictions, actual, completeness,
            "complete" if actual == expected_jurisdictions else "incomplete",
            None if actual == expected_jurisdictions else "Latest selected period has incomplete jurisdiction coverage.",
        )
    )
freshness_rows.append(
    (
        "Census population", "Census PEP Vintage 2025", None, selected_periods[-1],
        selected_periods[0], population.agg(F.max("ingested_at_utc")).first()[0],
        expected_jurisdictions, population.select("state_code").distinct().count(),
        population.select("state_code").distinct().count() / expected_jurisdictions * 100,
        "complete" if population.select("state_code").distinct().count() == expected_jurisdictions else "incomplete",
        "Annual population estimate applied to every monthly period.",
    )
)
freshness_schema = (
    "dataset_name string, source string, latest_available_period string, "
    "latest_selected_period string, earliest_selected_period string, retrieved_at_utc timestamp, "
    "expected_jurisdictions int, actual_jurisdictions int, completeness_pct double, "
    "status string, notes string"
)
freshness = spark.createDataFrame(freshness_rows, freshness_schema)
"""
        ),
        code(
            """
def assert_unique(df, keys, name):
    if df.groupBy(*keys).count().where(F.col("count") > 1).limit(1).count():
        raise RuntimeError(f"{name} has duplicate keys: {keys}")

assert_unique(gold_energy, ["period", "state_code", "fuel_code"], "gold_state_month_energy")
assert_unique(state_month, ["period", "state_code"], "gold_state_month_electricity")
assert_unique(gold_population, ["state_code"], "gold_state_population")
assert_unique(national, ["period"], "gold_national_month_summary")

for name, frame in {
    "gold_state_month_electricity": state_month,
    "gold_national_month_summary": national,
}.items():
    bad = frame.where(
        (F.col("generation_mwh") < 0)
        | (F.col("retail_sales_mwh") < 0)
        | (F.col("completeness_pct") < 0)
        | (F.col("completeness_pct") > 100)
    )
    if bad.limit(1).count():
        raise RuntimeError(f"{name} failed nonnegative/range validation.")
if state_month.groupBy("period").agg(F.countDistinct("state_code").alias("n")).where(F.col("n") != expected_jurisdictions).limit(1).count():
    raise RuntimeError("Gold state-month output does not contain all 51 jurisdictions.")
"""
        ),
        code(
            """
outputs = {
    "gold.gold_state_month_energy": (gold_energy, ["period"]),
    "gold.gold_state_month_electricity": (state_month, ["period"]),
    "gold.gold_state_population": (gold_population, []),
    "gold.gold_national_month_summary": (national, ["period"]),
    "gold.gold_data_freshness": (freshness, []),
}
for table_name, (frame, partitions) in outputs.items():
    writer = frame.write.format("delta").mode("overwrite").option("overwriteSchema", "true")
    if partitions:
        writer = writer.partitionBy(*partitions)
    writer.saveAsTable(table_name)

spark.sql("OPTIMIZE gold.gold_state_month_energy ZORDER BY (state_code, fuel_code)")
spark.sql("OPTIMIZE gold.gold_state_month_electricity ZORDER BY (state_code)")
spark.sql("OPTIMIZE gold.gold_national_month_summary")

for table_name in outputs:
    print(table_name, spark.table(table_name).count())
"""
        ),
    ]
)


def main() -> None:
    NOTEBOOKS.mkdir(parents=True, exist_ok=True)
    artifacts = {
        "01_bronze_ingest.ipynb": BRONZE,
        "01a_bronze_from_azure_landing.ipynb": AZURE_BRONZE,
        "02_silver_normalize.ipynb": SILVER,
        "03_gold_energy_explorer.ipynb": GOLD,
    }
    for name, payload in artifacts.items():
        path = NOTEBOOKS / name
        path.write_text(json.dumps(payload, indent=1) + "\n", encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()

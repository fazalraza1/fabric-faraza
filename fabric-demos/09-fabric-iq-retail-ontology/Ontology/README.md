# Ontology artifacts

The two binary artifacts required to run this demo are included in this folder:

| File | Purpose |
|---|---|
| `fabriciq_ontology_accelerator-0.1.0-py3-none-any.whl` | Python package with `create_ontology_item`, `generate_definition_from_package`, `generate_instance_data`, and `generate_events_data` helpers. |
| `retail_ontology_package.iq` | Portable retail + supply‑chain ontology package — definitions, bindings, and seed CSVs for 15 entity types and 24 relationships. |

## Location in this repo

Use these exact files from this folder:

```
09-fabric-iq-retail-ontology/Ontology/fabriciq_ontology_accelerator-0.1.0-py3-none-any.whl
09-fabric-iq-retail-ontology/Ontology/retail_ontology_package.iq
```

## Where to put them

Once you have the two files, upload them into the **default Lakehouse** of your Fabric workspace under the `Files/` root. The notebooks expect them at:

```
/lakehouse/default/Files/fabriciq_ontology_accelerator-0.1.0-py3-none-any.whl
/lakehouse/default/Files/retail_ontology_package.iq
```

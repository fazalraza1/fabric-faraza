import type {
  DataFreshness,
  EnergySnapshot,
  StateMonthEnergy,
} from './energy-model';
import type { EnergyDataProvider } from './energy-provider';
import { getRayfinClient } from './rayfin-client';

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Gold data is missing required field ${field}.`);
  }
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function requiredNumber(value: unknown, field: string): number {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Gold data is missing required numeric field ${field}.`);
  }
  return numberValue;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function requiredDate(value: unknown, field: string): string {
  const date = value instanceof Date ? value : new Date(requiredString(value, field));
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Gold data contains an invalid date in ${field}.`);
  }
  return date.toISOString();
}

function fuelCategory(value: unknown): StateMonthEnergy['fuelCategory'] {
  return value === 'carbon_free' || value === 'fossil' ? value : 'other';
}

function valueStatus(value: unknown): StateMonthEnergy['valueStatus'] {
  if (value === 'reported' || value === 'suppressed' || value === 'missing') {
    return value;
  }
  throw new Error(`Gold data contains unsupported value status ${String(value)}.`);
}

function freshnessStatus(value: unknown): DataFreshness['status'] {
  if (value === 'complete' || value === 'incomplete') return value;
  throw new Error(`Gold data contains unsupported freshness status ${String(value)}.`);
}

export const lakehouseEnergyProvider: EnergyDataProvider = {
  kind: 'lakehouse-sql-analytics',
  sourceLabel: 'Fabric Lakehouse Gold tables',

  async loadSnapshot(): Promise<EnergySnapshot> {
    const client = await getRayfinClient();
    const connector = client.connectors.stateenergylakehouse;
    const [
      stateMonthEnergyRows,
      stateMonthElectricityRows,
      statePopulationRows,
      nationalMonthSummaryRows,
      dataFreshnessRows,
    ] = await Promise.all([
      connector.GoldStateMonthEnergy
        .select([
          'period',
          'stateCode',
          'stateName',
          'fuelCode',
          'fuelName',
          'fuelCategory',
          'generationMwh',
          'consumptionForEgBtu',
          'consumptionForEgMmbtu',
          'generationMixPct',
          'fuelIntensityMmbtuPerMwh',
          'population',
          'generationMwhPer1000Residents',
          'valueStatus',
          'source',
          'generationUnit',
          'consumptionUnit',
        ])
        .first(-1)
        .execute(),
      connector.GoldStateMonthElectricity
        .select([
          'period',
          'stateCode',
          'stateName',
          'population',
          'generationMwh',
          'retailSalesMwh',
          'generationMwhPer1000Residents',
          'electricityConsumptionKwhPerPerson',
          'carbonFreeSharePct',
          'fossilDependencyPct',
          'supplyBalanceProxy',
          'retailSalesMomPct',
          'retailSalesEightMonthHighMwh',
          'retailSalesEightMonthLowMwh',
          'retailSalesStateRank',
          'retailSalesNationalMedianMwh',
          'completenessPct',
          'source',
        ])
        .first(-1)
        .execute(),
      connector.GoldStatePopulation
        .select([
          'stateCode',
          'stateName',
          'censusStateFips',
          'population',
          'estimateYear',
          'vintage',
          'retrievedAtUtc',
        ])
        .first(-1)
        .execute(),
      connector.GoldNationalMonthSummary
        .select([
          'period',
          'population',
          'generationMwh',
          'retailSalesMwh',
          'electricityConsumptionKwhPerPerson',
          'carbonFreeSharePct',
          'fossilDependencyPct',
          'supplyBalanceProxy',
          'retailSalesMomPct',
          'reportingJurisdictions',
          'expectedJurisdictions',
          'completenessPct',
          'source',
        ])
        .first(-1)
        .execute(),
      connector.GoldDataFreshness
        .select([
          'datasetName',
          'source',
          'latestAvailablePeriod',
          'latestSelectedPeriod',
          'earliestSelectedPeriod',
          'retrievedAtUtc',
          'expectedJurisdictions',
          'actualJurisdictions',
          'completenessPct',
          'status',
          'notes',
        ])
        .first(-1)
        .execute(),
    ]);

    return {
      stateMonthEnergy: stateMonthEnergyRows.map((row) => ({
        period: requiredString(row.period, 'gold_state_month_energy.period'),
        stateCode: requiredString(row.stateCode, 'gold_state_month_energy.state_code'),
        stateName: requiredString(row.stateName, 'gold_state_month_energy.state_name'),
        fuelCode: requiredString(row.fuelCode, 'gold_state_month_energy.fuel_code'),
        fuelName: requiredString(row.fuelName, 'gold_state_month_energy.fuel_name'),
        fuelCategory: fuelCategory(row.fuelCategory),
        generationMwh: optionalNumber(row.generationMwh),
        consumptionForEgBtu: optionalNumber(row.consumptionForEgBtu),
        consumptionForEgMmbtu: optionalNumber(row.consumptionForEgMmbtu),
        generationMixPct: optionalNumber(row.generationMixPct),
        fuelIntensityMmbtuPerMwh: optionalNumber(row.fuelIntensityMmbtuPerMwh),
        population: requiredNumber(row.population, 'gold_state_month_energy.population'),
        generationMwhPer1000Residents: optionalNumber(row.generationMwhPer1000Residents),
        valueStatus: valueStatus(row.valueStatus),
        source: requiredString(row.source, 'gold_state_month_energy.source'),
        generationUnit: requiredString(
          row.generationUnit,
          'gold_state_month_energy.generation_unit',
        ),
        consumptionUnit: requiredString(
          row.consumptionUnit,
          'gold_state_month_energy.consumption_unit',
        ),
      })),
      stateMonthElectricity: stateMonthElectricityRows.map((row) => ({
        period: requiredString(row.period, 'gold_state_month_electricity.period'),
        stateCode: requiredString(row.stateCode, 'gold_state_month_electricity.state_code'),
        stateName: requiredString(row.stateName, 'gold_state_month_electricity.state_name'),
        population: requiredNumber(
          row.population,
          'gold_state_month_electricity.population',
        ),
        generationMwh: optionalNumber(row.generationMwh),
        retailSalesMwh: optionalNumber(row.retailSalesMwh),
        generationMwhPer1000Residents: optionalNumber(row.generationMwhPer1000Residents),
        electricityConsumptionKwhPerPerson: optionalNumber(
          row.electricityConsumptionKwhPerPerson,
        ),
        carbonFreeSharePct: optionalNumber(row.carbonFreeSharePct),
        fossilDependencyPct: optionalNumber(row.fossilDependencyPct),
        supplyBalanceProxy: optionalNumber(row.supplyBalanceProxy),
        retailSalesMomPct: optionalNumber(row.retailSalesMomPct),
        retailSalesEightMonthHighMwh: optionalNumber(row.retailSalesEightMonthHighMwh),
        retailSalesEightMonthLowMwh: optionalNumber(row.retailSalesEightMonthLowMwh),
        retailSalesStateRank: optionalNumber(row.retailSalesStateRank),
        retailSalesNationalMedianMwh: optionalNumber(row.retailSalesNationalMedianMwh),
        completenessPct: requiredNumber(
          row.completenessPct,
          'gold_state_month_electricity.completeness_pct',
        ),
        source: requiredString(row.source, 'gold_state_month_electricity.source'),
      })),
      statePopulation: statePopulationRows.map((row) => ({
        stateCode: requiredString(row.stateCode, 'gold_state_population.state_code'),
        stateName: requiredString(row.stateName, 'gold_state_population.state_name'),
        censusStateFips: requiredString(
          row.censusStateFips,
          'gold_state_population.census_state_fips',
        ),
        population: requiredNumber(row.population, 'gold_state_population.population'),
        estimateYear: requiredNumber(row.estimateYear, 'gold_state_population.estimate_year'),
        vintage: requiredString(row.vintage, 'gold_state_population.vintage'),
        source: 'Census PEP Vintage 2021 population API',
        retrievedAtUtc: requiredDate(
          row.retrievedAtUtc,
          'gold_state_population.retrieved_at_utc',
        ),
      })),
      nationalMonthSummary: nationalMonthSummaryRows.map((row) => ({
        period: requiredString(row.period, 'gold_national_month_summary.period'),
        population: requiredNumber(row.population, 'gold_national_month_summary.population'),
        generationMwh: optionalNumber(row.generationMwh),
        retailSalesMwh: optionalNumber(row.retailSalesMwh),
        electricityConsumptionKwhPerPerson: optionalNumber(
          row.electricityConsumptionKwhPerPerson,
        ),
        carbonFreeSharePct: optionalNumber(row.carbonFreeSharePct),
        fossilDependencyPct: optionalNumber(row.fossilDependencyPct),
        supplyBalanceProxy: optionalNumber(row.supplyBalanceProxy),
        retailSalesMomPct: optionalNumber(row.retailSalesMomPct),
        reportingJurisdictions: requiredNumber(
          row.reportingJurisdictions,
          'gold_national_month_summary.reporting_jurisdictions',
        ),
        expectedJurisdictions: requiredNumber(
          row.expectedJurisdictions,
          'gold_national_month_summary.expected_jurisdictions',
        ),
        completenessPct: requiredNumber(
          row.completenessPct,
          'gold_national_month_summary.completeness_pct',
        ),
        source: requiredString(row.source, 'gold_national_month_summary.source'),
      })),
      dataFreshness: dataFreshnessRows.map((row) => ({
        datasetName: requiredString(row.datasetName, 'gold_data_freshness.dataset_name'),
        source: requiredString(row.source, 'gold_data_freshness.source'),
        latestAvailablePeriod: optionalString(row.latestAvailablePeriod),
        latestSelectedPeriod: optionalString(row.latestSelectedPeriod),
        earliestSelectedPeriod: optionalString(row.earliestSelectedPeriod),
        retrievedAtUtc: requiredDate(
          row.retrievedAtUtc,
          'gold_data_freshness.retrieved_at_utc',
        ),
        expectedJurisdictions: requiredNumber(
          row.expectedJurisdictions,
          'gold_data_freshness.expected_jurisdictions',
        ),
        actualJurisdictions: requiredNumber(
          row.actualJurisdictions,
          'gold_data_freshness.actual_jurisdictions',
        ),
        completenessPct: requiredNumber(
          row.completenessPct,
          'gold_data_freshness.completeness_pct',
        ),
        status: freshnessStatus(row.status),
        notes: optionalString(row.notes),
      })),
    };
  },
};

export interface StateMonthEnergy {
  period: string;
  stateCode: string;
  stateName: string;
  fuelCode: string;
  fuelName: string;
  fuelCategory: 'carbon_free' | 'fossil' | 'other';
  generationMwh: number | null;
  consumptionForEgBtu: number | null;
  consumptionForEgMmbtu: number | null;
  generationMixPct: number | null;
  fuelIntensityMmbtuPerMwh: number | null;
  population: number;
  generationMwhPer1000Residents: number | null;
  valueStatus: 'reported' | 'suppressed' | 'missing';
  source: string;
  generationUnit: string;
  consumptionUnit: string;
}

export interface StateMonthElectricity {
  period: string;
  stateCode: string;
  stateName: string;
  population: number;
  generationMwh: number | null;
  retailSalesMwh: number | null;
  generationMwhPer1000Residents: number | null;
  electricityConsumptionKwhPerPerson: number | null;
  carbonFreeSharePct: number | null;
  fossilDependencyPct: number | null;
  supplyBalanceProxy: number | null;
  retailSalesMomPct: number | null;
  retailSalesEightMonthHighMwh: number | null;
  retailSalesEightMonthLowMwh: number | null;
  retailSalesStateRank: number | null;
  retailSalesNationalMedianMwh: number | null;
  completenessPct: number;
  source: string;
}

export interface StatePopulation {
  stateCode: string;
  stateName: string;
  censusStateFips: string;
  population: number;
  estimateYear: number;
  vintage: string;
  source: string;
  retrievedAtUtc: string;
}

export interface NationalMonthSummary {
  period: string;
  population: number;
  generationMwh: number | null;
  retailSalesMwh: number | null;
  electricityConsumptionKwhPerPerson: number | null;
  carbonFreeSharePct: number | null;
  fossilDependencyPct: number | null;
  supplyBalanceProxy: number | null;
  retailSalesMomPct: number | null;
  reportingJurisdictions: number;
  expectedJurisdictions: number;
  completenessPct: number;
  source: string;
}

export interface DataFreshness {
  datasetName: string;
  source: string;
  latestAvailablePeriod: string | null;
  latestSelectedPeriod: string | null;
  earliestSelectedPeriod: string | null;
  retrievedAtUtc: string;
  expectedJurisdictions: number;
  actualJurisdictions: number;
  completenessPct: number;
  status: 'complete' | 'incomplete' | 'configuration_error';
  notes: string | null;
}

export interface EnergySnapshot {
  stateMonthEnergy: StateMonthEnergy[];
  stateMonthElectricity: StateMonthElectricity[];
  statePopulation: StatePopulation[];
  nationalMonthSummary: NationalMonthSummary[];
  dataFreshness: DataFreshness[];
}

export type ExplorerPage =
  | 'national'
  | 'trends'
  | 'comparison'
  | 'state'
  | 'fuel'
  | 'methodology';

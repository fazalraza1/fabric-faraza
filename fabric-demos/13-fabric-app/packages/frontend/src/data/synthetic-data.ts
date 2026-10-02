import { calculateRiskScore, type RiskInputs } from '@/lib/risk-score';

export interface RegionProfile extends RiskInputs {
  region: string;
  code: string;
  states: string;
  demandGw: number;
  renewablePct: number;
  priceMwh: number;
  importValueBn: number;
  topMaterial: string;
  port: string;
}

const baseRegions: Omit<RegionProfile, keyof RiskInputs>[] = [
  { region: 'Pacific', code: 'PAC', states: 'CA, OR, WA', demandGw: 71.4, renewablePct: 44, priceMwh: 68, importValueBn: 188, topMaterial: 'Battery cells', port: 'Los Angeles / Long Beach' },
  { region: 'Mountain', code: 'MTN', states: 'AZ, CO, ID, MT, NV, NM, UT, WY', demandGw: 36.8, renewablePct: 35, priceMwh: 51, importValueBn: 42, topMaterial: 'Copper', port: 'Inland corridors' },
  { region: 'Texas', code: 'TEX', states: 'TX', demandGw: 78.6, renewablePct: 39, priceMwh: 63, importValueBn: 122, topMaterial: 'Transformers', port: 'Houston' },
  { region: 'Midwest', code: 'MW', states: 'IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI', demandGw: 91.2, renewablePct: 29, priceMwh: 47, importValueBn: 136, topMaterial: 'Electrical steel', port: 'Great Lakes' },
  { region: 'Southeast', code: 'SE', states: 'AL, AR, FL, GA, KY, LA, MS, NC, SC, TN, VA, WV', demandGw: 112.5, renewablePct: 18, priceMwh: 55, importValueBn: 154, topMaterial: 'Solar modules', port: 'Savannah' },
  { region: 'Northeast', code: 'NE', states: 'CT, DC, DE, MA, MD, ME, NH, NJ, NY, PA, RI, VT', demandGw: 83.7, renewablePct: 31, priceMwh: 74, importValueBn: 211, topMaterial: 'Semiconductors', port: 'New York / New Jersey' },
];

const factors: RiskInputs[] = [
  { gridStress: 61, pricePressure: 68, importDependency: 78, weatherExposure: 52, portCongestion: 81 },
  { gridStress: 47, pricePressure: 43, importDependency: 58, weatherExposure: 55, portCongestion: 29 },
  { gridStress: 73, pricePressure: 61, importDependency: 64, weatherExposure: 77, portCongestion: 66 },
  { gridStress: 52, pricePressure: 38, importDependency: 69, weatherExposure: 48, portCongestion: 42 },
  { gridStress: 67, pricePressure: 51, importDependency: 72, weatherExposure: 82, portCongestion: 74 },
  { gridStress: 76, pricePressure: 79, importDependency: 83, weatherExposure: 63, portCongestion: 71 },
];

export const regions: RegionProfile[] = baseRegions.map((region, index) => ({
  ...region,
  ...factors[index],
}));

export const rankedRegions = regions
  .map((region) => ({ ...region, riskScore: calculateRiskScore(region) }))
  .sort((a, b) => b.riskScore - a.riskScore);

export const monthlyEnergy = Array.from({ length: 12 }, (_, index) => {
  const month = new Date(Date.UTC(2025, index, 1)).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
  return {
    month,
    demandGw: Math.round((372 + Math.sin(index / 1.7) * 34 + index * 1.8) * 10) / 10,
    renewablePct: Math.round(29 + Math.sin((index + 2) / 2) * 6),
    priceMwh: Math.round(49 + Math.cos(index / 1.8) * 9 + index * 0.8),
  };
});

export const tradeDependencies = [
  { material: 'Battery cells', importShare: 82, annualValueBn: 34.2, leadDays: 47, industry: 'Energy storage' },
  { material: 'Power transformers', importShare: 76, annualValueBn: 12.8, leadDays: 68, industry: 'Electric utilities' },
  { material: 'Solar modules', importShare: 71, annualValueBn: 18.6, leadDays: 39, industry: 'Renewable generation' },
  { material: 'Semiconductors', importShare: 69, annualValueBn: 58.4, leadDays: 44, industry: 'Grid controls' },
  { material: 'Electrical steel', importShare: 54, annualValueBn: 7.9, leadDays: 52, industry: 'Grid equipment' },
  { material: 'Copper products', importShare: 48, annualValueBn: 21.3, leadDays: 35, industry: 'Transmission' },
];

export const generationMix = [
  { source: 'Natural gas', share: 39 },
  { source: 'Renewables', share: 27 },
  { source: 'Nuclear', share: 19 },
  { source: 'Coal', share: 13 },
  { source: 'Other', share: 2 },
];

export const sourceNotes = [
  { agency: 'U.S. Department of Energy / EIA', inspiration: 'Electricity demand, generation mix, retail and wholesale prices', url: 'https://www.eia.gov/opendata/' },
  { agency: 'U.S. Department of Commerce / Census', inspiration: 'International trade in goods, commodity values, and regional economic context', url: 'https://www.census.gov/data/developers/data-sets/international-trade.html' },
  { agency: 'U.S. Department of Commerce / NOAA', inspiration: 'Weather and climate exposure dimensions', url: 'https://www.weather.gov/documentation/services-web-api' },
];

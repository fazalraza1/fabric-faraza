import type { GraphQLBackedConnector } from '@microsoft/rayfin-connector-fabric-graphql';
import type { ConnectorConfig } from '@microsoft/rayfin-connectors';

import { GoldDataFreshness } from './GoldDataFreshness.js';
import { GoldNationalMonthSummary } from './GoldNationalMonthSummary.js';
import { GoldStateMonthElectricity } from './GoldStateMonthElectricity.js';
import { GoldStateMonthEnergy } from './GoldStateMonthEnergy.js';
import { GoldStatePopulation } from './GoldStatePopulation.js';

export { GoldDataFreshness } from './GoldDataFreshness.js';
export { GoldNationalMonthSummary } from './GoldNationalMonthSummary.js';
export { GoldStateMonthElectricity } from './GoldStateMonthElectricity.js';
export { GoldStateMonthEnergy } from './GoldStateMonthEnergy.js';
export { GoldStatePopulation } from './GoldStatePopulation.js';

export const connectorConfig = {
  connector: 'fabric-sqlanalytics',
  operations: ['read'],
  entities: {
    GoldDataFreshness,
    GoldNationalMonthSummary,
    GoldStateMonthElectricity,
    GoldStateMonthEnergy,
    GoldStatePopulation,
  },
} as const satisfies ConnectorConfig;

export type StateenergylakehouseSchema = GraphQLBackedConnector<
  {
    GoldDataFreshness: typeof GoldDataFreshness;
    GoldNationalMonthSummary: typeof GoldNationalMonthSummary;
    GoldStateMonthElectricity: typeof GoldStateMonthElectricity;
    GoldStateMonthEnergy: typeof GoldStateMonthEnergy;
    GoldStatePopulation: typeof GoldStatePopulation;
  },
  typeof connectorConfig
>;

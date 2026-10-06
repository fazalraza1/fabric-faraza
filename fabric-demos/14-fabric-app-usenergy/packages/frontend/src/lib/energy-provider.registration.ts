import type { EnergyProviderRegistration } from './energy-provider';
import { lakehouseEnergyProvider } from './energy-lakehouse-provider';

export const energyProviderRegistration: EnergyProviderRegistration = {
  connectorAlias: 'stateenergylakehouse',
  provider: lakehouseEnergyProvider,
};

import type { EnergySnapshot } from './energy-model';

export interface EnergyDataProvider {
  readonly kind: 'lakehouse-sql-analytics';
  readonly sourceLabel: string;
  loadSnapshot(): Promise<EnergySnapshot>;
}

export interface EnergyProviderRegistration {
  provider: EnergyDataProvider | null;
  connectorAlias: string | null;
}

export interface ProviderSetupState {
  configured: boolean;
  title: string;
  detail: string;
  missing: string[];
}

export function getProviderSetupState(
  registration: EnergyProviderRegistration,
): ProviderSetupState {
  const missing: string[] = [];
  if (!registration.connectorAlias) missing.push('Lakehouse SQL connector alias');
  if (!registration.provider) missing.push('generated typed connector adapter');
  return missing.length === 0
    ? {
        configured: true,
        title: 'Gold data connected',
        detail: 'The explorer is reading curated Lakehouse Gold tables.',
        missing,
      }
    : {
        configured: false,
        title: 'Lakehouse connection required',
        detail:
          'No sample values are shown. Run the notebooks, add the verified SQL analytics connector, generate its entities, and register the typed adapter.',
        missing,
      };
}

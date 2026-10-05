import type { EnergyProviderRegistration } from './energy-provider';

/**
 * Intentionally unconfigured until a real Lakehouse SQL analytics endpoint has
 * been created and `rayfin connector add` has generated verified metadata.
 * README.md documents the post-Lakehouse wiring steps. Do not put IDs here.
 */
export const energyProviderRegistration: EnergyProviderRegistration = {
  connectorAlias: null,
  provider: null,
};

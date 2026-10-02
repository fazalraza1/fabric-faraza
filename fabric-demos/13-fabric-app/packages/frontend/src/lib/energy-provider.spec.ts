import { describe, expect, it } from 'vitest';
import { getProviderSetupState } from './energy-provider';

describe('energy provider setup state', () => {
  it('surfaces missing connector configuration without inventing data', () => {
    const state = getProviderSetupState({ connectorAlias: null, provider: null });
    expect(state.configured).toBe(false);
    expect(state.title).toMatch(/connection required/i);
    expect(state.missing).toHaveLength(2);
  });
});

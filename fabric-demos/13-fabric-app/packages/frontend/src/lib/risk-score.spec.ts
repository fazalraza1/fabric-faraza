import { describe, expect, it } from 'vitest';

import { calculateRiskScore, projectScenarioRisk, riskBand } from './risk-score';

describe('risk scoring', () => {
  it('uses the documented weighted formula', () => {
    expect(
      calculateRiskScore({
        gridStress: 80,
        pricePressure: 60,
        importDependency: 40,
        weatherExposure: 20,
        portCongestion: 50,
      })
    ).toBe(54);
  });

  it('caps scenario projections at 100', () => {
    expect(projectScenarioRisk(90, 5, 30)).toBe(100);
  });

  it('assigns boundary bands consistently', () => {
    expect(riskBand(75)).toBe('Critical');
    expect(riskBand(55)).toBe('Elevated');
    expect(riskBand(35)).toBe('Guarded');
    expect(riskBand(34)).toBe('Low');
  });
});

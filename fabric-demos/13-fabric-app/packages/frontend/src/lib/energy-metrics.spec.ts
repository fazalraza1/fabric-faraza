import { describe, expect, it } from 'vitest';
import {
  consumptionKwhPerPerson,
  fuelIntensityMmbtuPerMwh,
  generationPer1000Residents,
  monthOverMonthPct,
  percentage,
} from './energy-metrics';

describe('energy metric calculations', () => {
  it('calculates per-capita and share metrics with explicit units', () => {
    expect(generationPer1000Residents(500_000, 2_000_000)).toBe(250);
    expect(consumptionKwhPerPerson(600_000, 2_000_000)).toBe(300);
    expect(percentage(250, 1000)).toBe(25);
    expect(fuelIntensityMmbtuPerMwh(700, 100)).toBe(7);
  });

  it('returns null when a denominator is absent or nonpositive', () => {
    expect(generationPer1000Residents(10, 0)).toBeNull();
    expect(percentage(null, 10)).toBeNull();
  });

  it('calculates month-over-month percent change', () => {
    expect(monthOverMonthPct(110, 100)).toBeCloseTo(10);
    expect(monthOverMonthPct(100, 0)).toBeNull();
  });
});

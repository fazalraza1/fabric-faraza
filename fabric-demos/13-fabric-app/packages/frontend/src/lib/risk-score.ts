export interface RiskInputs {
  gridStress: number;
  pricePressure: number;
  importDependency: number;
  weatherExposure: number;
  portCongestion: number;
}

const weights: Record<keyof RiskInputs, number> = {
  gridStress: 0.3,
  pricePressure: 0.15,
  importDependency: 0.25,
  weatherExposure: 0.15,
  portCongestion: 0.15,
};

export function calculateRiskScore(inputs: RiskInputs): number {
  const score = Object.entries(weights).reduce(
    (total, [key, weight]) => total + clamp(inputs[key as keyof RiskInputs]) * weight,
    0
  );
  return Math.round(score);
}

export function projectScenarioRisk(
  baseline: number,
  severity: number,
  durationDays: number
): number {
  const impact = severity * 3 + Math.min(durationDays, 30) * 0.6;
  return Math.min(100, Math.round(baseline + impact));
}

export function riskBand(score: number): 'Low' | 'Guarded' | 'Elevated' | 'Critical' {
  if (score >= 75) return 'Critical';
  if (score >= 55) return 'Elevated';
  if (score >= 35) return 'Guarded';
  return 'Low';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

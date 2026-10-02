export function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | null {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return numerator / denominator;
}

export function generationPer1000Residents(
  generationMwh: number | null,
  population: number | null,
): number | null {
  const value = safeDivide(generationMwh, population);
  return value == null ? null : value * 1000;
}

export function consumptionKwhPerPerson(
  retailSalesMwh: number | null,
  population: number | null,
): number | null {
  const value = safeDivide(retailSalesMwh, population);
  return value == null ? null : value * 1000;
}

export function percentage(
  numerator: number | null,
  denominator: number | null,
): number | null {
  const value = safeDivide(numerator, denominator);
  return value == null ? null : value * 100;
}

export function fuelIntensityMmbtuPerMwh(
  consumptionMmbtu: number | null,
  generationMwh: number | null,
): number | null {
  return safeDivide(consumptionMmbtu, generationMwh);
}

export function monthOverMonthPct(
  current: number | null,
  previous: number | null,
): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

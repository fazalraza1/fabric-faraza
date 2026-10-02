const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthlyPeriod(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

export function latestCommonMonthlyPeriods(
  periodSets: readonly (readonly string[])[],
  count = 8,
): string[] {
  if (count <= 0 || periodSets.length === 0) return [];
  const normalized = periodSets.map(
    (periods) => new Set(periods.filter(isMonthlyPeriod)),
  );
  return [...normalized[0]]
    .filter((period) => normalized.every((set) => set.has(period)))
    .sort()
    .slice(-count);
}

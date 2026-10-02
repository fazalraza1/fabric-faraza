import { describe, expect, it } from 'vitest';
import { latestCommonMonthlyPeriods } from './periods';

describe('latest common period selection', () => {
  it('intersects sources, sorts, and keeps the latest eight complete months', () => {
    const operational = [
      '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
      '2026-04', '2026-05', '2026-06', '2026-07',
    ];
    const retail = [
      '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
      '2026-06', '2026-07',
    ];
    expect(latestCommonMonthlyPeriods([operational, retail])).toEqual(retail);
  });

  it('rejects malformed periods instead of treating them as complete months', () => {
    expect(latestCommonMonthlyPeriods([['2026-07', '2026-Q2'], ['2026-07']])).toEqual([
      '2026-07',
    ]);
  });
});

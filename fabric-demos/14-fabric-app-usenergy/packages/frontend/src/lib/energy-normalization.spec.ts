import { describe, expect, it } from 'vitest';
import { normalizeEiaNumber, normalizeStateCode } from './energy-normalization';

describe('EIA normalization', () => {
  it('distinguishes reported, suppressed, and missing values', () => {
    expect(normalizeEiaNumber('1,250.5')).toEqual({ value: 1250.5, status: 'reported' });
    expect(normalizeEiaNumber('W')).toEqual({ value: null, status: 'suppressed' });
    expect(normalizeEiaNumber(null)).toEqual({ value: null, status: 'missing' });
  });

  it('does not silently accept negative energy values', () => {
    expect(() => normalizeEiaNumber('-1')).toThrow(/nonnegative/);
  });

  it('normalizes valid postal abbreviations', () => {
    expect(normalizeStateCode(' dc ')).toBe('DC');
    expect(() => normalizeStateCode('USA')).toThrow(/Invalid state code/);
  });
});

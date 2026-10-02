export type EiaValueStatus = 'reported' | 'suppressed' | 'missing';

export interface NormalizedEiaNumber {
  value: number | null;
  status: EiaValueStatus;
}

const SUPPRESSED_MARKERS = new Set(['--', 'NA', 'N/A', 'NM', 'W', 'S', '*']);

export function normalizeEiaNumber(raw: unknown): NormalizedEiaNumber {
  if (raw == null || raw === '') return { value: null, status: 'missing' };
  const text = String(raw).trim();
  if (SUPPRESSED_MARKERS.has(text.toUpperCase())) {
    return { value: null, status: 'suppressed' };
  }
  const parsed = Number(text.replaceAll(',', ''));
  if (!Number.isFinite(parsed)) return { value: null, status: 'missing' };
  if (parsed < 0) throw new Error(`Energy values must be nonnegative; received ${text}.`);
  return { value: parsed, status: 'reported' };
}

export function normalizeStateCode(raw: unknown): string {
  const value = String(raw ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) throw new Error(`Invalid state code: ${value || '(empty)'}`);
  return value;
}

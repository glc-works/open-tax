// Copyright GLC Works and Open-Tax contributors. Licensed under Apache-2.0.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a calendar date as UTC midnight. Returns undefined when the date is not real. */
export function parseIsoDate(value: string): number | undefined {
  const match = DATE_PATTERN.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return undefined;
  }
  return utc;
}

export function assertIsoDate(value: string, label: string): number {
  const parsed = parseIsoDate(value);
  if (parsed === undefined) {
    throw new TypeError(`${label} must be a real YYYY-MM-DD date. Received ${value}.`);
  }
  return parsed;
}

export function dateInRange(date: string, from: string, to?: string): boolean {
  const day = parseIsoDate(date);
  const start = parseIsoDate(from);
  if (day === undefined || start === undefined || day < start) return false;
  if (to === undefined) return true;
  const end = parseIsoDate(to);
  if (end === undefined) return false;
  return day <= end;
}

/** True when [leftFrom, leftTo] overlaps [rightFrom, rightTo]. Missing ends are open. */
export function rangesOverlap(
  leftFrom: string,
  leftTo: string | undefined,
  rightFrom: string,
  rightTo: string | undefined,
): boolean {
  const start = parseIsoDate(leftFrom);
  const otherStart = parseIsoDate(rightFrom);
  if (start === undefined || otherStart === undefined) return false;
  const end = leftTo === undefined ? Number.POSITIVE_INFINITY : parseIsoDate(leftTo);
  const otherEnd = rightTo === undefined ? Number.POSITIVE_INFINITY : parseIsoDate(rightTo);
  if (end === undefined || otherEnd === undefined) return false;
  return start <= otherEnd && otherStart <= end;
}

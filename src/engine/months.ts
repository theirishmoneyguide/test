export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const MONTH_COUNT = 12;

/** Twelve copies of `value`, one per month. */
export function everyMonth<T>(value: T): T[] {
  return Array.from({ length: MONTH_COUNT }, () => value);
}

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/** Element-wise sum of several month arrays. */
export function addMonthly(...series: readonly (readonly number[])[]): number[] {
  return everyMonth(0).map((_, m) => {
    let total = 0;
    for (const s of series) total += s[m] ?? 0;
    return total;
  });
}

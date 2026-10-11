import { describe, expect, it } from '@jest/globals';

import {
  formatCompactEuro,
  formatEuro,
  formatNumber,
  formatPercent,
  formatSignedEuro,
  parseAmount,
} from '@/utils/format';

describe('formatting', () => {
  it('formats euro amounts like the workbook', () => {
    expect(formatEuro(6599.9466)).toBe('€6,600');
    expect(formatEuro(79199.36)).toBe('€79,199');
    expect(formatEuro(60.06, 2)).toBe('€60.06');
    expect(formatEuro(-1350.05)).toBe('−€1,350');
    expect(formatEuro(-0.4)).toBe('€0');
    expect(formatEuro(Number.NaN)).toBe('–');
  });

  it('signs changes', () => {
    expect(formatSignedEuro(4296)).toBe('+€4,296');
    expect(formatSignedEuro(-380)).toBe('−€380');
    expect(formatSignedEuro(0.2)).toBe('€0');
  });

  it('compacts axis ticks', () => {
    expect(formatCompactEuro(0)).toBe('€0');
    expect(formatCompactEuro(800)).toBe('€800');
    expect(formatCompactEuro(2500)).toBe('€2.5K');
    expect(formatCompactEuro(8000)).toBe('€8K');
    expect(formatCompactEuro(383987)).toBe('€384K');
    expect(formatCompactEuro(1_250_000)).toBe('€1.3M');
  });

  it('formats percentages and plain numbers', () => {
    expect(formatPercent(0.20046)).toBe('20.0%');
    expect(formatPercent(0.4735)).toBe('47.4%');
    expect(formatPercent(0.05, 0)).toBe('5%');
    expect(formatNumber(12.424, 1)).toBe('12.4');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('parsing what people type', () => {
  it.each([
    ['65000', 65000],
    ['65,000', 65000],
    ['€65,000', 65000],
    [' 1,234,567 ', 1234567],
    ['12.50', 12.5],
    ['12,5', 12.5],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['.5', 0.5],
    ['7.', 7],
    ['−20', -20],
  ])('reads %p as %p', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });

  it.each(['', '€', '-', 'abc', '12a', '1.2.3'])('rejects %p', (text) => {
    expect(parseAmount(text)).toBeNull();
  });
});

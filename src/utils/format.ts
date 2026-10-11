/** Typographic minus, so negative figures line up with positive ones. */
export const MINUS = '−';

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function absolute(value: number, decimals: number): { text: string; negative: boolean } {
  const factor = 10 ** decimals;
  // Round half away from zero on the decimal value, as a spreadsheet does —
  // 0.4735 × 100 is 47.349999… in binary but should still show as 47.4.
  const scaled = Math.round(Number((Math.abs(value) * factor).toPrecision(15)));
  const [whole, fraction] = (scaled / factor).toFixed(decimals).split('.');
  return {
    text: groupThousands(whole) + (fraction ? `.${fraction}` : ''),
    // Never show "−0" for something that rounds to zero.
    negative: value < 0 && scaled !== 0,
  };
}

/** 6599.95 → "6,600" */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '–';
  const { text, negative } = absolute(value, decimals);
  return `${negative ? MINUS : ''}${text}`;
}

/** 6599.95 → "€6,600"; −1350 → "−€1,350" */
export function formatEuro(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '–';
  const { text, negative } = absolute(value, decimals);
  return `${negative ? MINUS : ''}€${text}`;
}

/** Changes: "+€4,296", "−€380", "€0". */
export function formatSignedEuro(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '–';
  const { text, negative } = absolute(value, decimals);
  if (Number(text.replace(/,/g, '')) === 0) return `€${text}`;
  return `${negative ? MINUS : '+'}€${text}`;
}

/** Axis ticks: "€0", "€800", "€8K", "€1.2M". */
export function formatCompactEuro(value: number): string {
  if (!Number.isFinite(value)) return '–';
  const sign = value < 0 ? MINUS : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}€${trimZero((abs / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${sign}€${trimZero((abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1))}K`;
  return `${sign}€${Math.round(abs)}`;
}

function trimZero(text: string): string {
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}

/** 0.2005 → "20.0%" */
export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '–';
  return `${formatNumber(value * 100, decimals)}%`;
}

/**
 * Reads what someone typed into an amount field. Accepts "65000", "65,000",
 * "€65,000", "12.50" and a decimal comma like "12,5". Empty → `null`.
 */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[€\s]/g, '').replace(/[−–]/g, '-');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalised: string;
  if (lastComma > -1 && lastDot === -1) {
    const commas = cleaned.split(',').length - 1;
    const digitsAfter = cleaned.length - lastComma - 1;
    normalised =
      commas === 1 && digitsAfter > 0 && digitsAfter <= 2
        ? cleaned.replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (lastComma > lastDot) {
    normalised = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalised = cleaned.replace(/,/g, '');
  }

  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalised)) return null;
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

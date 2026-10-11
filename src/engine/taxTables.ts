/**
 * Ireland 2026 tax year — rates, bands and limits.
 *
 * Mirrors the "Tax Tables 2026" sheet of the Irish Household Budget & Tax
 * Planner workbook. Every calculation reads from a `TaxTables` object, so if
 * Revenue changes a rule only this data needs to change (and the user can
 * edit it in the app, just like the sheet).
 */

export type TaxStatus = 'single' | 'married' | 'singleCarer';

export const TAX_STATUSES: readonly TaxStatus[] = ['single', 'married', 'singleCarer'];

export interface StatusRule {
  /** Standard rate cut-off point (the 20% band). */
  srcop: number;
  personalCredit: number;
  payeCredit: number;
}

export interface UscBand {
  /** Upper limit of the band. `null` means no ceiling (the balance). */
  upTo: number | null;
  rate: number;
}

export interface PensionAgeBand {
  ageFrom: number;
  pct: number;
}

export interface TaxTables {
  year: number;
  standardRate: number;
  higherRate: number;
  statuses: Record<TaxStatus, StatusRule>;
  /** Most of the lower earner's income that can widen a married couple's band. */
  maxBandTransfer: number;
  usc: {
    bands: UscBand[];
    /** Per person. At or below this, no USC at all. */
    exemptionThreshold: number;
    /** Medical card / aged 70+: below this income, USC caps at band 2's rate. */
    reducedRateCeiling: number;
  };
  prsi: {
    /** Reference only — the rate before 1 October 2026. Not used in calculations. */
    rateEarlierInYear: number;
    /** The Class A employee rate applied to the whole year. */
    rate: number;
    weeklyExemption: number;
    maxWeeklyCredit: number;
    /** Reference only — the credit has tapered to nil by this weekly figure. */
    creditTaperEnds: number;
  };
  pension: {
    /** Sorted by `ageFrom`, lowest first. */
    ageBands: PensionAgeBand[];
    earningsCap: number;
  };
}

export const STATUS_LABELS: Record<TaxStatus, string> = {
  single: 'Single',
  married: 'Married / civil partner (jointly assessed)',
  singleCarer: 'Single person child carer',
};

export const STATUS_SHORT_LABELS: Record<TaxStatus, string> = {
  single: 'Single',
  married: 'Married / civil partners',
  singleCarer: 'Single parent',
};

export const STATUS_NOTES: Record<TaxStatus, string> = {
  single: 'Single or widowed with no dependent children',
  married:
    "Band rises by the lower of €35,000 or the lower earner's income, so €88,000 max. Each PAYE earner claims their own €2,000 PAYE credit.",
  singleCarer: "Add the Single Person Child Carer Credit itself under 'Other tax credits'",
};

export const TAX_TABLES_2026: TaxTables = {
  year: 2026,
  standardRate: 0.2,
  higherRate: 0.4,
  statuses: {
    single: { srcop: 44000, personalCredit: 2000, payeCredit: 2000 },
    married: { srcop: 53000, personalCredit: 4000, payeCredit: 2000 },
    singleCarer: { srcop: 48000, personalCredit: 2000, payeCredit: 2000 },
  },
  maxBandTransfer: 35000,
  usc: {
    bands: [
      { upTo: 12012, rate: 0.005 },
      { upTo: 28700, rate: 0.02 },
      { upTo: 70044, rate: 0.03 },
      { upTo: null, rate: 0.08 },
    ],
    exemptionThreshold: 13000,
    reducedRateCeiling: 60000,
  },
  prsi: {
    rateEarlierInYear: 0.042,
    rate: 0.0435,
    weeklyExemption: 352,
    maxWeeklyCredit: 12,
    creditTaperEnds: 424,
  },
  pension: {
    ageBands: [
      { ageFrom: 0, pct: 0.15 },
      { ageFrom: 30, pct: 0.2 },
      { ageFrom: 40, pct: 0.25 },
      { ageFrom: 50, pct: 0.3 },
      { ageFrom: 55, pct: 0.35 },
      { ageFrom: 60, pct: 0.4 },
    ],
    earningsCap: 115000,
  },
};

export const TAX_TABLE_SOURCES: readonly string[] = [
  'Income tax bands & credits 2026 (unchanged in Budget 2026): Revenue / KPMG Budget 2026 tax tables',
  'USC 2% band ceiling raised to €28,700 from 1 Jan 2026: Citizens Information',
  'PRSI 4.20% rising to 4.35% from 1 Oct 2026: KPMG Budget 2026 tax tables',
  'Pension age-related limits and €115,000 cap: Revenue, s.790A TCA 1997',
  "Joint assessment, band transfer and credits: Revenue — 'Taxation of married people and civil partners'",
  'Check your own figures on your Revenue Tax Credit Certificate in myAccount before relying on this.',
];

/** "Under 30", "30–39", … "60 and over" — the label for each age band. */
export function pensionAgeBandLabel(bands: readonly PensionAgeBand[], index: number): string {
  const band = bands[index];
  const next = bands[index + 1];
  if (!band) return '';
  if (index === 0 && next) return `Under ${next.ageFrom}`;
  if (!next) return `${band.ageFrom} and over`;
  return `${band.ageFrom}–${next.ageFrom - 1}`;
}

/** Deep copy, so edits never touch the built-in defaults. */
export function cloneTaxTables(tables: TaxTables): TaxTables {
  return JSON.parse(JSON.stringify(tables)) as TaxTables;
}

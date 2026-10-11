import { describe, expect, it } from '@jest/globals';

import { SAMPLE_PAY } from '@/data/sample';
import {
  TAX_TABLES_2026,
  ZERO_PERSON,
  computePrsi,
  computeTakeHome,
  computeUsc,
  type PayInput,
  type PersonInput,
} from '@/engine';

const tables = TAX_TABLES_2026;

function person(overrides: Partial<PersonInput>): PersonInput {
  return { ...ZERO_PERSON, age: 35, ...overrides };
}

function pay(overrides: Partial<PayInput>): PayInput {
  return {
    status: 'single',
    you: person({}),
    partner: person({}),
    bandOverride: null,
    otherCredits: 0,
    creditsOverride: null,
    ...overrides,
  };
}

describe('sample household (Irish_Household_Budget_Planner_2026.xlsx)', () => {
  const r = computeTakeHome(SAMPLE_PAY, tables);
  const h = r.household;

  it('works out both pension contributions', () => {
    expect(r.you.gross).toBe(65000);
    expect(r.partner.gross).toBe(45000);
    expect(h.gross).toBe(110000);
    expect(r.you.contribution).toBeCloseTo(6500, 6);
    expect(r.partner.contribution).toBeCloseTo(2250, 6);
    expect(h.contribution).toBeCloseTo(8750, 6);
    expect(r.you.employerContribution).toBeCloseTo(3250, 6);
    expect(r.partner.employerContribution).toBeCloseTo(1350, 6);
    expect(h.totalIntoPension).toBeCloseTo(13350, 6);
  });

  it('checks pension relief per person', () => {
    expect(r.you.ageLimitPct).toBe(0.25);
    expect(r.partner.ageLimitPct).toBe(0.25);
    expect(r.you.maxRelievable).toBe(16250);
    expect(r.partner.maxRelievable).toBe(11250);
    expect(h.relievedContribution).toBeCloseTo(8750, 6);
    expect(h.unrelievedContribution).toBe(0);
    expect(r.you.roomLeft).toBeCloseTo(9750, 6);
    expect(r.partner.roomLeft).toBeCloseTo(9000, 6);
    expect(h.roomLeft).toBeCloseTo(18750, 6);
  });

  it('applies the joint rate band and credits', () => {
    expect(h.suggestedBand).toBe(88000);
    expect(h.bandApplied).toBe(88000);
    expect(h.suggestedCredits).toBe(8000);
    expect(h.creditsApplied).toBe(8000);
    expect(h.prsiRate).toBe(0.0435);
  });

  it('assesses income tax on the couple together', () => {
    expect(h.taxableIncome).toBeCloseTo(101250, 6);
    expect(h.taxAtStandardRate).toBeCloseTo(17600, 6);
    expect(h.taxAtHigherRate).toBeCloseTo(5300, 6);
    expect(h.grossIncomeTax).toBeCloseTo(22900, 6);
    expect(h.incomeTax).toBeCloseTo(14900, 6);
  });

  it('works out USC on each person separately', () => {
    expect(r.you.uscByBand.map((v) => +v.toFixed(2))).toEqual([60.06, 333.76, 1089, 0]);
    expect(r.partner.uscByBand.map((v) => +v.toFixed(2))).toEqual([60.06, 333.76, 489, 0]);
    expect(r.you.usc).toBeCloseTo(1482.82, 6);
    expect(r.partner.usc).toBeCloseTo(882.82, 6);
    expect(h.usc).toBeCloseTo(2365.64, 6);
  });

  it('works out PRSI on each person separately', () => {
    expect(r.you.weeklyGross).toBe(1250);
    expect(r.partner.weeklyGross).toBeCloseTo(865.3846, 4);
    expect(r.you.prsiCredit).toBe(0);
    expect(r.you.prsi).toBeCloseTo(2827.5, 6);
    expect(r.partner.prsi).toBeCloseTo(1957.5, 6);
    expect(h.prsi).toBeCloseTo(4785, 6);
  });

  it('lands €79,199 a year — €6,600 a month — in the household accounts', () => {
    expect(h.totalDeductions).toBeCloseTo(30800.64, 6);
    expect(h.netAnnual).toBeCloseTo(79199.36, 6);
    expect(h.netMonthly).toBeCloseTo(6599.9467, 4);
  });

  it('shows how it stacks up', () => {
    expect(h.effectiveTaxRate).toBeCloseTo(0.20046, 5);
    expect(r.you.marginalRate).toBeCloseTo(0.4735, 10);
    expect(r.partner.marginalRate).toBeCloseTo(0.4735, 10);
    expect(h.incomeTaxWithoutPension).toBeCloseTo(18400, 6);
    expect(h.pensionTaxRelief).toBeCloseTo(3500, 6);
    expect(h.pensionRealCost).toBeCloseTo(5250, 6);
    expect(h.pensionCostPer100).toBeCloseTo(60, 6);
  });
});

describe('the Google Sheets copy (two earners on €55,000)', () => {
  it('lands €79,499 a year, €6,625 a month', () => {
    const r = computeTakeHome(
      {
        ...SAMPLE_PAY,
        you: { ...SAMPLE_PAY.you, salary: 55000 },
        partner: { ...SAMPLE_PAY.partner, salary: 55000 },
      },
      tables,
    );
    expect(r.household.incomeTax).toBeCloseTo(15100, 6);
    expect(Math.round(r.household.netAnnual)).toBe(79499);
    expect(Math.round(r.household.netMonthly)).toBe(6625);
  });
});

describe('single earner', () => {
  const input = pay({
    status: 'single',
    you: person({ salary: 40000, age: 28, pensionPct: 0.05 }),
    // Ignored unless married: a single calculator behaves like a zero partner column.
    partner: person({ salary: 30000, pensionPct: 0.1, medicalCardOr70: true }),
  });
  const r = computeTakeHome(input, tables);
  const h = r.household;

  it('ignores the partner column', () => {
    expect(r.hasPartner).toBe(false);
    expect(r.partner.gross).toBe(0);
    expect(r.partner.contribution).toBe(0);
    expect(h.gross).toBe(40000);
  });

  it('uses the single band and credits', () => {
    expect(h.bandApplied).toBe(44000);
    expect(h.creditsApplied).toBe(4000);
    expect(h.taxableIncome).toBe(38000);
    expect(h.incomeTax).toBeCloseTo(3600, 6);
  });

  it('works out take-home pay', () => {
    expect(r.you.maxRelievable).toBe(6000);
    expect(r.you.roomLeft).toBe(4000);
    expect(h.usc).toBeCloseTo(732.82, 6);
    expect(h.prsi).toBeCloseTo(1740, 6);
    expect(h.netAnnual).toBeCloseTo(31927.18, 6);
    expect(r.you.marginalRate).toBeCloseTo(0.2735, 10);
    expect(h.pensionTaxRelief).toBeCloseTo(400, 6);
    expect(h.pensionCostPer100).toBeCloseTo(80, 6);
  });
});

describe('rate band and credits', () => {
  it('gives a one-income married couple the €53,000 band and one PAYE credit', () => {
    const r = computeTakeHome(
      pay({ status: 'married', you: person({ salary: 70000 }), partner: person({ salary: 0 }) }),
      tables,
    );
    expect(r.household.suggestedBand).toBe(53000);
    expect(r.household.suggestedCredits).toBe(6000);
  });

  it("widens the married band by the lower earner's income, up to €35,000", () => {
    const r = computeTakeHome(
      pay({
        status: 'married',
        you: person({ salary: 70000 }),
        partner: person({ salary: 20000 }),
      }),
      tables,
    );
    expect(r.household.suggestedBand).toBe(73000);
    expect(r.household.suggestedCredits).toBe(8000);
  });

  it('uses the single person child carer band', () => {
    const r = computeTakeHome(pay({ status: 'singleCarer', you: person({ salary: 50000 }) }), tables);
    expect(r.household.bandApplied).toBe(48000);
    expect(r.household.creditsApplied).toBe(4000);
  });

  it('adds other credits and respects both overrides', () => {
    const base = pay({ you: person({ salary: 50000 }) });
    expect(computeTakeHome({ ...base, otherCredits: 1000 }, tables).household.creditsApplied).toBe(
      5000,
    );
    const overridden = computeTakeHome(
      { ...base, otherCredits: 1000, bandOverride: 60000, creditsOverride: 4500 },
      tables,
    ).household;
    expect(overridden.bandApplied).toBe(60000);
    expect(overridden.creditsApplied).toBe(4500);
    expect(overridden.incomeTax).toBeCloseTo(50000 * 0.2 - 4500, 6);
  });

  it('treats a zero override as a real figure, not as blank', () => {
    const r = computeTakeHome(pay({ you: person({ salary: 30000 }), creditsOverride: 0 }), tables);
    expect(r.household.creditsApplied).toBe(0);
    expect(r.household.incomeTax).toBeCloseTo(6000, 6);
  });
});

describe('pensions', () => {
  it('lets a fixed euro amount override the percentage', () => {
    const r = computeTakeHome(
      pay({ you: person({ salary: 65000, pensionPct: 0.1, pensionFixed: 5000 }) }),
      tables,
    );
    expect(r.you.contribution).toBe(5000);
  });

  it('flags the part of a contribution above the age-related limit', () => {
    const r = computeTakeHome(
      pay({ you: person({ salary: 50000, age: 25, pensionPct: 0.2 }) }),
      tables,
    );
    expect(r.you.ageLimitPct).toBe(0.15);
    expect(r.you.contribution).toBe(10000);
    expect(r.you.relievedContribution).toBe(7500);
    expect(r.you.unrelievedContribution).toBe(2500);
    expect(r.you.roomLeft).toBe(0);
    expect(r.you.taxableIncome).toBe(42500);
  });

  it('caps relievable earnings at €115,000', () => {
    const r = computeTakeHome(pay({ you: person({ salary: 150000, age: 45 }) }), tables);
    expect(r.you.maxRelievable).toBe(28750);
  });

  it('steps through every age band', () => {
    const limit = (age: number) =>
      computeTakeHome(pay({ you: person({ salary: 50000, age }) }), tables).you.ageLimitPct;
    expect([29, 30, 39, 40, 49, 50, 54, 55, 59, 60, 75].map(limit)).toEqual([
      0.15, 0.2, 0.2, 0.25, 0.25, 0.3, 0.3, 0.35, 0.35, 0.4, 0.4,
    ]);
  });
});

describe('USC', () => {
  it('exempts income at or below €13,000', () => {
    expect(computeUsc(13000, false, tables.usc)).toMatchObject({ total: 0, treatment: 'exempt' });
    const justOver = computeUsc(13001, false, tables.usc);
    expect(justOver.treatment).toBe('standard');
    expect(justOver.total).toBeCloseTo(60.06 + 989 * 0.02, 6);
  });

  it('caps USC at 2% for a medical card holder under €60,000', () => {
    const reduced = computeUsc(50000, true, tables.usc);
    expect(reduced.treatment).toBe('reduced');
    expect(reduced.total).toBeCloseTo(60.06 + (50000 - 12012) * 0.02, 6);
    expect(computeUsc(65000, true, tables.usc).treatment).toBe('standard');
  });

  it('reaches the 8% band above €70,044', () => {
    const r = computeUsc(100000, false, tables.usc);
    expect(r.byBand[3]).toBeCloseTo((100000 - 70044) * 0.08, 6);
  });

  it('feeds the right USC rate into the marginal rate', () => {
    const marginalUsc = (salary: number, medicalCardOr70 = false) =>
      computeTakeHome(pay({ you: person({ salary, medicalCardOr70 }) }), tables).you.marginalUsc;
    expect(marginalUsc(12000)).toBe(0.005);
    expect(marginalUsc(20000)).toBe(0.02);
    expect(marginalUsc(50000)).toBe(0.03);
    expect(marginalUsc(80000)).toBe(0.08);
    expect(marginalUsc(50000, true)).toBe(0.02);
    expect(marginalUsc(10000, true)).toBe(0.005);
  });
});

describe('PRSI', () => {
  it('charges nothing at or below €352 a week', () => {
    expect(computePrsi(352 * 52, tables.prsi).prsi).toBe(0);
  });

  it('tapers the PRSI credit just above the threshold', () => {
    const r = computePrsi(380 * 52, tables.prsi);
    const weeklyCredit = 12 - (380 - 352.01) / 6;
    expect(r.credit).toBeCloseTo(weeklyCredit * 52, 6);
    expect(r.prsi).toBeCloseTo(380 * 52 * 0.0435 - weeklyCredit * 52, 6);
  });

  it('has no credit once weekly pay passes the taper', () => {
    expect(computePrsi(424 * 52 + 52, tables.prsi).credit).toBe(0);
  });
});

describe('no income at all', () => {
  it('returns zeros, never NaN', () => {
    const r = computeTakeHome(pay({}), tables);
    const values = Object.values(r.household);
    expect(values.every((v) => Number.isFinite(v))).toBe(true);
    expect(r.household.netAnnual).toBe(0);
    expect(r.household.effectiveTaxRate).toBe(0);
    expect(r.household.pensionCostPer100).toBe(0);
  });
});

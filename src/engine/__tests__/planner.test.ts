import { describe, expect, it } from '@jest/globals';

import { blankPlannerData, samplePlannerData } from '@/data/sample';
import {
  computeBudget,
  computeNetWorth,
  computePlanner,
  emergencyRating,
  everyMonth,
  type NetWorthData,
} from '@/engine';

describe('monthly budget — sample household', () => {
  const { budget } = computePlanner(samplePlannerData());

  it('takes net pay from the take-home pay sheet', () => {
    expect(budget.netPay[0]).toBeCloseTo(79199.36 / 12, 6);
    expect(budget.moneyInYear).toBeCloseTo(79199.36, 6);
  });

  it('totals each category for the year', () => {
    const totals = Object.fromEntries(budget.groups.map((g) => [g.id, g.yearTotal]));
    expect(totals).toEqual({
      home: 23250,
      utilities: 4575,
      transport: 10920,
      living: 11600,
      health: 5220,
      lifestyle: 11600,
      debt: 0,
      savings: 10200,
    });
  });

  it('puts annual bills in the month they land', () => {
    expect(budget.moneyOut).toEqual([
      6250, 5820, 7950, 5820, 6470, 6345, 7925, 5725, 5820, 6620, 5820, 6800,
    ]);
    expect(budget.moneyOutYear).toBe(77365);
    expect(budget.moneyOutAvg).toBeCloseTo(6447.0833, 4);
  });

  it('shows what is left over and the running balance', () => {
    const rounded = (xs: number[]) => xs.map((x) => Math.round(x));
    expect(rounded(budget.leftOver)).toEqual([350, 780, -1350, 780, 130, 255, -1325, 875, 780, -20, 780, -200]);
    expect(rounded(budget.runningBalance)).toEqual([
      350, 1130, -220, 560, 690, 945, -380, 495, 1275, 1254, 2034, 1834,
    ]);
    expect(budget.leftOverYear).toBeCloseTo(1834.36, 6);
  });

  it('works out each category as a share of money in', () => {
    const home = budget.groups.find((g) => g.id === 'home')!;
    expect(home.shareOfMoneyIn).toBeCloseTo(0.29356, 5);
    expect(budget.moneyOutShare).toBeCloseTo(0.97684, 5);
  });

  it('adds other net income to money in', () => {
    const data = samplePlannerData();
    data.budget.otherIncome[0].amounts = everyMonth(100);
    const r = computeBudget(data.budget, 79199.36);
    expect(r.moneyInYear).toBeCloseTo(79199.36 + 1200, 6);
    expect(r.leftOverYear).toBeCloseTo(1834.36 + 1200, 6);
  });
});

describe('net worth — sample household', () => {
  const { netWorth: nw } = computePlanner(samplePlannerData());

  it('builds the balance sheet', () => {
    expect(nw.totalAssets[0]).toBe(662000);
    expect(nw.totalAssets[11]).toBe(698217);
    expect(nw.totalLiabilities[0]).toBe(326000);
    expect(nw.totalLiabilities[11]).toBe(314230);
    expect(nw.netWorth[0]).toBe(336000);
    expect(nw.netWorth[11]).toBe(383987);
  });

  it('tracks the change month to month and over the year', () => {
    expect(nw.changeVsPrevious[0]).toBeNull();
    expect(nw.changeVsPrevious[1]).toBe(4296);
    expect(nw.changeVsPrevious[11]).toBe(4431);
    expect(nw.changeSinceStart[11]).toBe(47987);
    expect(nw.change.netWorth).toBe(47987);
    expect(nw.sections.find((s) => s.id === 'pensions')!.change).toBe(18589);
  });

  it('explains what the numbers tell you', () => {
    expect(nw.liquidAssets[0]).toBe(68000);
    expect(nw.monthsCovered[0]).toBeCloseTo(10.547, 3);
    expect(nw.monthsCovered[11]).toBeCloseTo(12.424, 3);
    expect(nw.netWorthExHome[0]).toBe(183000);
    expect(nw.homeEquity[0]).toBe(153000);
    expect(nw.homeEquity[11]).toBe(168320);
    expect(nw.pensionShare[0]).toBeCloseTo(0.31845, 5);
  });
});

describe('net worth — a year started part way through', () => {
  const data: NetWorthData = {
    sections: {
      cash: [{ id: 'c', name: 'Current account', values: everyMonth<number | null>(null) }],
      investments: [],
      pensions: [],
      property: [],
      liabilities: [{ id: 'l', name: 'Card', values: everyMonth<number | null>(null) }],
    },
  };
  data.sections.cash[0].values[8] = 5000;
  data.sections.cash[0].values[9] = 6500;
  data.sections.liabilities[0].values[9] = 500;
  const nw = computeNetWorth(data, 2000);

  it('only counts months with something recorded', () => {
    expect(nw.recorded.filter(Boolean)).toHaveLength(2);
    expect(nw.firstRecorded).toBe(8);
    expect(nw.latestRecorded).toBe(9);
    expect(nw.netWorth[0]).toBeNull();
    expect(nw.netWorth[8]).toBe(5000);
    expect(nw.netWorth[9]).toBe(6000);
  });

  it('compares against recorded months only', () => {
    expect(nw.changeVsPrevious[8]).toBeNull();
    expect(nw.changeVsPrevious[9]).toBe(1000);
    expect(nw.changeSinceStart[8]).toBeNull();
    expect(nw.changeSinceStart[9]).toBe(1000);
    expect(nw.monthsCovered[9]).toBe(3.25);
  });

  it('reports nothing before anything is recorded', () => {
    const empty = computeNetWorth(blankPlannerData().netWorth, 1000);
    expect(empty.firstRecorded).toBeNull();
    expect(empty.netWorth.every((v) => v === null)).toBe(true);
    expect(empty.change.netWorth).toBeNull();
  });
});

describe('dashboard and summary — sample household', () => {
  const { insights } = computePlanner(samplePlannerData());

  it('works out the savings rate, counting employer pensions', () => {
    expect(insights.savedThisYear).toBeCloseTo(25384.36, 6);
    expect(insights.savingsRate).toBeCloseTo(0.23077, 5);
  });

  it('runs the health check', () => {
    expect(insights.emergencyFund.months).toBeCloseTo(12.424, 3);
    expect(insights.emergencyFund.rating).toBe('strong');
    expect(insights.tightestMonth.month).toBe(2);
    expect(Math.round(insights.tightestMonth.leftOver)).toBe(-1350);
    expect(insights.biggestCost?.id).toBe('home');
    expect(insights.biggestCost?.share).toBeCloseTo(0.29356, 5);
  });

  it('splits every €100 of combined gross pay', () => {
    const p = insights.per100;
    expect(+p.incomeTax.toFixed(2)).toBe(13.55);
    expect(+p.usc.toFixed(2)).toBe(2.15);
    expect(+p.prsi.toFixed(2)).toBe(4.35);
    expect(+p.pensions.toFixed(2)).toBe(7.95);
    expect(+p.spent.toFixed(2)).toBe(70.33);
    expect(+p.leftOver.toFixed(2)).toBe(1.67);
  });

  it('separates what you saved from what markets and the mortgage did', () => {
    expect(insights.netWorth.latest).toBe(383987);
    expect(insights.netWorth.change).toBe(47987);
    expect(insights.netWorth.monthsSpanned).toBe(12);
    expect(insights.netWorth.saved).toBeCloseTo(25384.36, 6);
    expect(Math.round(insights.netWorth.marketsAndMortgage!)).toBe(22603);
  });

  it('rates the emergency fund', () => {
    expect([0, 0.9, 1, 2.9, 3, 5.9, 6, 12].map(emergencyRating)).toEqual([
      'veryThin',
      'veryThin',
      'thin',
      'thin',
      'solid',
      'solid',
      'strong',
      'strong',
    ]);
  });
});

describe('a blank planner', () => {
  it('calculates without errors', () => {
    const r = computePlanner(blankPlannerData());
    expect(r.pay.household.netAnnual).toBe(0);
    expect(r.budget.moneyOutYear).toBe(0);
    expect(r.insights.biggestCost).toBeNull();
    expect(r.insights.emergencyFund.months).toBeNull();
    expect(r.insights.netWorth.saved).toBeNull();
  });
});

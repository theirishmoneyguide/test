/**
 * Everything the "Dashboard" and "Summary" sheets pull together from the
 * other calculations.
 */
import type { BudgetResult, GroupId } from './budget';
import type { NetWorthResult } from './netWorth';
import type { TakeHomeResult } from './takeHome';

export type EmergencyRating = 'strong' | 'solid' | 'thin' | 'veryThin';

export interface CategoryShare {
  id: GroupId;
  shortName: string;
  yearTotal: number;
  /** Share of the year's money in. */
  share: number;
}

export interface Insights {
  /** Pensions (yours and your employers') + savings from net pay + the budget's surplus. */
  savedThisYear: number;
  savingsRate: number;
  emergencyFund: { month: number | null; months: number | null; rating: EmergencyRating | null };
  tightestMonth: { month: number; leftOver: number };
  biggestCost: CategoryShare | null;
  categories: CategoryShare[];
  categoriesTotal: { yearTotal: number; share: number };
  /** Where every €100 of combined gross pay goes. */
  per100: {
    incomeTax: number;
    usc: number;
    prsi: number;
    pensions: number;
    spent: number;
    leftOver: number;
  };
  netWorth: {
    latestMonth: number | null;
    latest: number | null;
    firstMonth: number | null;
    /** Latest recorded minus first recorded. */
    change: number | null;
    /** Months from the first to the latest recorded, inclusive. */
    monthsSpanned: number;
    /** The budgeted saving for those months. */
    saved: number | null;
    /** Growth in investments and property, mortgage principal cleared, less depreciation. */
    marketsAndMortgage: number | null;
  };
}

export function emergencyRating(months: number): EmergencyRating {
  if (months >= 6) return 'strong';
  if (months >= 3) return 'solid';
  if (months >= 1) return 'thin';
  return 'veryThin';
}

function per100(part: number, gross: number): number {
  return gross === 0 ? 0 : (100 * part) / gross;
}

export function computeInsights(
  pay: TakeHomeResult,
  budget: BudgetResult,
  netWorth: NetWorthResult,
): Insights {
  const h = pay.household;
  const savingsGroup = budget.groups.find((g) => g.id === 'savings');
  const savedThisYear = h.totalIntoPension + budget.leftOverYear + (savingsGroup?.yearTotal ?? 0);

  const latest = netWorth.latestRecorded;
  const first = netWorth.firstRecorded;
  const monthsCovered = latest === null ? null : (netWorth.monthsCovered[latest] ?? null);

  let tightest = 0;
  budget.leftOver.forEach((v, m) => {
    if (v < budget.leftOver[tightest]) tightest = m;
  });

  const categories: CategoryShare[] = budget.groups.map((g) => ({
    id: g.id,
    shortName: g.shortName,
    yearTotal: g.yearTotal,
    share: g.shareOfMoneyIn,
  }));
  let biggest: CategoryShare | null = null;
  for (const c of categories) {
    if (c.yearTotal > 0 && (biggest === null || c.yearTotal > biggest.yearTotal)) biggest = c;
  }

  const monthsSpanned = latest === null || first === null ? 0 : latest - first + 1;
  const change = netWorth.change.netWorth;
  const saved = monthsSpanned >= 2 ? (savedThisYear * monthsSpanned) / 12 : null;

  return {
    savedThisYear,
    savingsRate: h.gross === 0 ? 0 : savedThisYear / h.gross,
    emergencyFund: {
      month: latest,
      months: monthsCovered,
      rating: monthsCovered === null ? null : emergencyRating(monthsCovered),
    },
    tightestMonth: { month: tightest, leftOver: budget.leftOver[tightest] },
    biggestCost: biggest,
    categories,
    categoriesTotal: { yearTotal: budget.moneyOutYear, share: budget.moneyOutShare },
    per100: {
      incomeTax: per100(h.incomeTax, h.gross),
      usc: per100(h.usc, h.gross),
      prsi: per100(h.prsi, h.gross),
      pensions: per100(h.contribution, h.gross),
      spent: per100(budget.moneyOutYear, h.gross),
      leftOver: per100(budget.leftOverYear, h.gross),
    },
    netWorth: {
      latestMonth: latest,
      latest: latest === null ? null : netWorth.netWorth[latest],
      firstMonth: first,
      change,
      monthsSpanned,
      saved,
      marketsAndMortgage: saved === null || change === null ? null : change - saved,
    },
  };
}

/**
 * Household monthly budget — a port of the "Monthly Budget" sheet.
 *
 * Net take-home pay flows in from the take-home pay calculation, one twelfth
 * per month. Every other figure is the household's own, entered per month so
 * annual bills can sit in the month they actually land.
 */
import { MONTH_COUNT, addMonthly, everyMonth, sum } from './months';

export type GroupId =
  | 'home'
  | 'utilities'
  | 'transport'
  | 'living'
  | 'health'
  | 'lifestyle'
  | 'debt'
  | 'savings';

export interface GroupMeta {
  id: GroupId;
  name: string;
  /** The short label the dashboard uses. */
  shortName: string;
}

export const BUDGET_GROUPS: readonly GroupMeta[] = [
  { id: 'home', name: 'Home', shortName: 'Home' },
  { id: 'utilities', name: 'Utilities & comms', shortName: 'Utilities' },
  { id: 'transport', name: 'Transport', shortName: 'Transport' },
  { id: 'living', name: 'Living', shortName: 'Living' },
  { id: 'health', name: 'Health & protection', shortName: 'Health' },
  { id: 'lifestyle', name: 'Lifestyle', shortName: 'Lifestyle' },
  { id: 'debt', name: 'Debt (beyond mortgage)', shortName: 'Debt' },
  { id: 'savings', name: 'Savings & investing (from net pay)', shortName: 'Savings' },
];

export function groupMeta(id: GroupId): GroupMeta {
  return BUDGET_GROUPS.find((g) => g.id === id) ?? BUDGET_GROUPS[0];
}

export interface BudgetLine {
  id: string;
  name: string;
  /** One amount per month, January first. */
  amounts: number[];
}

export interface BudgetData {
  /** Other net income: rent, side income, etc. */
  otherIncome: BudgetLine[];
  groups: Record<GroupId, BudgetLine[]>;
}

export interface LineTotals {
  id: string;
  name: string;
  amounts: number[];
  yearTotal: number;
  monthlyAvg: number;
}

export interface GroupTotals extends GroupMeta {
  lines: LineTotals[];
  monthly: number[];
  yearTotal: number;
  monthlyAvg: number;
  /** Share of the year's money in. */
  shareOfMoneyIn: number;
}

export interface BudgetResult {
  netPay: number[];
  netPayYear: number;
  otherIncome: LineTotals[];
  otherIncomeMonthly: number[];
  moneyIn: number[];
  moneyInYear: number;
  moneyInAvg: number;
  groups: GroupTotals[];
  moneyOut: number[];
  moneyOutYear: number;
  moneyOutAvg: number;
  moneyOutShare: number;
  leftOver: number[];
  leftOverYear: number;
  leftOverAvg: number;
  runningBalance: number[];
}

/** Always twelve finite numbers, whatever was stored. */
export function normaliseAmounts(amounts: readonly number[] | undefined): number[] {
  return everyMonth(0).map((_, m) => {
    const v = amounts?.[m];
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  });
}

function lineTotals(line: BudgetLine): LineTotals {
  const amounts = normaliseAmounts(line.amounts);
  const yearTotal = sum(amounts);
  return { id: line.id, name: line.name, amounts, yearTotal, monthlyAvg: yearTotal / MONTH_COUNT };
}

function share(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

export function computeBudget(data: BudgetData, netAnnualPay: number): BudgetResult {
  const netPay = everyMonth(netAnnualPay / MONTH_COUNT);
  const otherIncome = data.otherIncome.map(lineTotals);
  const otherIncomeMonthly = addMonthly(...otherIncome.map((l) => l.amounts));
  const moneyIn = addMonthly(netPay, otherIncomeMonthly);
  const moneyInYear = sum(moneyIn);

  const groups: GroupTotals[] = BUDGET_GROUPS.map((meta) => {
    const lines = (data.groups[meta.id] ?? []).map(lineTotals);
    const monthly = addMonthly(...lines.map((l) => l.amounts));
    const yearTotal = sum(monthly);
    return {
      ...meta,
      lines,
      monthly,
      yearTotal,
      monthlyAvg: yearTotal / MONTH_COUNT,
      shareOfMoneyIn: share(yearTotal, moneyInYear),
    };
  });

  const moneyOut = addMonthly(...groups.map((g) => g.monthly));
  const moneyOutYear = sum(moneyOut);
  const leftOver = moneyIn.map((m, i) => m - moneyOut[i]);
  const leftOverYear = sum(leftOver);

  const runningBalance: number[] = [];
  leftOver.reduce((balance, month) => {
    const next = balance + month;
    runningBalance.push(next);
    return next;
  }, 0);

  return {
    netPay,
    netPayYear: sum(netPay),
    otherIncome,
    otherIncomeMonthly,
    moneyIn,
    moneyInYear,
    moneyInAvg: moneyInYear / MONTH_COUNT,
    groups,
    moneyOut,
    moneyOutYear,
    moneyOutAvg: moneyOutYear / MONTH_COUNT,
    moneyOutShare: share(moneyOutYear, moneyInYear),
    leftOver,
    leftOverYear,
    leftOverAvg: leftOverYear / MONTH_COUNT,
    runningBalance,
  };
}

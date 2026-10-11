import { computeBudget, type BudgetData, type BudgetResult } from './budget';
import { computeInsights, type Insights } from './insights';
import { computeNetWorth, type NetWorthData, type NetWorthResult } from './netWorth';
import { computeTakeHome, type PayInput, type TakeHomeResult } from './takeHome';
import type { TaxTables } from './taxTables';

export * from './budget';
export * from './insights';
export * from './months';
export * from './netWorth';
export * from './takeHome';
export * from './taxTables';

/** Everything the user enters — the equivalent of the workbook's blue cells. */
export interface PlannerData {
  pay: PayInput;
  budget: BudgetData;
  netWorth: NetWorthData;
  taxTables: TaxTables;
}

export interface PlannerResult {
  pay: TakeHomeResult;
  budget: BudgetResult;
  netWorth: NetWorthResult;
  insights: Insights;
}

/** Recalculates the whole planner, the way the workbook does on every edit. */
export function computePlanner(data: PlannerData): PlannerResult {
  const pay = computeTakeHome(data.pay, data.taxTables);
  const budget = computeBudget(data.budget, pay.household.netAnnual);
  const netWorth = computeNetWorth(data.netWorth, budget.moneyOutAvg);
  const insights = computeInsights(pay, budget, netWorth);
  return { pay, budget, netWorth, insights };
}

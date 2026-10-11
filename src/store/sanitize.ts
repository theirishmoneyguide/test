/**
 * Turns anything read back from storage — or pasted in as a backup — into a
 * complete, valid `PlannerData`, filling gaps from the blank planner and the
 * 2026 tax tables. A bad backup can never crash the calculations.
 */
import { blankPlannerData } from '@/data/sample';
import {
  BUDGET_GROUPS,
  NET_WORTH_SECTIONS,
  TAX_STATUSES,
  TAX_TABLES_2026,
  cloneTaxTables,
  everyMonth,
  type BudgetLine,
  type NetWorthItem,
  type PersonInput,
  type PlannerData,
  type TaxStatus,
  type TaxTables,
} from '@/engine';

type Raw = Record<string, unknown>;

function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function person(raw: unknown, fallback: PersonInput): PersonInput {
  const p = isObject(raw) ? raw : {};
  return {
    salary: num(p.salary, fallback.salary),
    bonus: num(p.bonus, fallback.bonus),
    age: num(p.age, fallback.age),
    medicalCardOr70: typeof p.medicalCardOr70 === 'boolean' ? p.medicalCardOr70 : fallback.medicalCardOr70,
    pensionPct: num(p.pensionPct, fallback.pensionPct),
    pensionFixed: num(p.pensionFixed, fallback.pensionFixed),
    employerPct: num(p.employerPct, fallback.employerPct),
  };
}

function budgetLines(raw: unknown, fallback: BudgetLine[]): BudgetLine[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.filter(isObject).map((l, index) => ({
    id: str(l.id, `line-${index}`),
    name: str(l.name, 'Untitled'),
    amounts: everyMonth(0).map((_, m) => num(Array.isArray(l.amounts) ? l.amounts[m] : 0, 0)),
  }));
}

function netWorthItems(raw: unknown, fallback: NetWorthItem[]): NetWorthItem[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.filter(isObject).map((i, index) => {
    const item: NetWorthItem = {
      id: str(i.id, `item-${index}`),
      name: str(i.name, 'Untitled'),
      values: everyMonth<number | null>(null).map((_, m) =>
        numOrNull(Array.isArray(i.values) ? i.values[m] : null),
      ),
    };
    if (i.role === 'home' || i.role === 'mortgage') item.role = i.role;
    return item;
  });
}

function taxTables(raw: unknown): TaxTables {
  const d = cloneTaxTables(TAX_TABLES_2026);
  if (!isObject(raw)) return d;
  const statuses = isObject(raw.statuses) ? raw.statuses : {};
  const usc = isObject(raw.usc) ? raw.usc : {};
  const prsi = isObject(raw.prsi) ? raw.prsi : {};
  const pension = isObject(raw.pension) ? raw.pension : {};
  const uscBands = Array.isArray(usc.bands) && usc.bands.length > 0 ? usc.bands : d.usc.bands;
  const ageBands =
    Array.isArray(pension.ageBands) && pension.ageBands.length > 0
      ? pension.ageBands
      : d.pension.ageBands;
  return {
    year: num(raw.year, d.year),
    standardRate: num(raw.standardRate, d.standardRate),
    higherRate: num(raw.higherRate, d.higherRate),
    statuses: Object.fromEntries(
      TAX_STATUSES.map((s) => {
        const r = isObject(statuses[s]) ? (statuses[s] as Raw) : {};
        return [
          s,
          {
            srcop: num(r.srcop, d.statuses[s].srcop),
            personalCredit: num(r.personalCredit, d.statuses[s].personalCredit),
            payeCredit: num(r.payeCredit, d.statuses[s].payeCredit),
          },
        ];
      }),
    ) as TaxTables['statuses'],
    maxBandTransfer: num(raw.maxBandTransfer, d.maxBandTransfer),
    usc: {
      bands: uscBands.map((b: unknown, i: number) => {
        const band = isObject(b) ? b : {};
        const last = i === uscBands.length - 1;
        return { upTo: last ? null : num(band.upTo, 0), rate: num(band.rate, 0) };
      }),
      exemptionThreshold: num(usc.exemptionThreshold, d.usc.exemptionThreshold),
      reducedRateCeiling: num(usc.reducedRateCeiling, d.usc.reducedRateCeiling),
    },
    prsi: {
      rateEarlierInYear: num(prsi.rateEarlierInYear, d.prsi.rateEarlierInYear),
      rate: num(prsi.rate, d.prsi.rate),
      weeklyExemption: num(prsi.weeklyExemption, d.prsi.weeklyExemption),
      maxWeeklyCredit: num(prsi.maxWeeklyCredit, d.prsi.maxWeeklyCredit),
      creditTaperEnds: num(prsi.creditTaperEnds, d.prsi.creditTaperEnds),
    },
    pension: {
      ageBands: ageBands
        .map((b: unknown) => {
          const band = isObject(b) ? b : {};
          return { ageFrom: num(band.ageFrom, 0), pct: num(band.pct, 0) };
        })
        .sort((a: { ageFrom: number }, b: { ageFrom: number }) => a.ageFrom - b.ageFrom),
      earningsCap: num(pension.earningsCap, d.pension.earningsCap),
    },
  };
}

export function sanitizePlannerData(raw: unknown): PlannerData {
  const blank = blankPlannerData();
  const r = isObject(raw) ? raw : {};
  const pay = isObject(r.pay) ? r.pay : {};
  const budget = isObject(r.budget) ? r.budget : {};
  const groups = isObject(budget.groups) ? budget.groups : {};
  const netWorth = isObject(r.netWorth) ? r.netWorth : {};
  const sections = isObject(netWorth.sections) ? netWorth.sections : {};
  const status = TAX_STATUSES.includes(pay.status as TaxStatus)
    ? (pay.status as TaxStatus)
    : blank.pay.status;

  return {
    pay: {
      status,
      you: person(pay.you, blank.pay.you),
      partner: person(pay.partner, blank.pay.partner),
      bandOverride: numOrNull(pay.bandOverride),
      otherCredits: num(pay.otherCredits, 0),
      creditsOverride: numOrNull(pay.creditsOverride),
    },
    budget: {
      otherIncome: budgetLines(budget.otherIncome, blank.budget.otherIncome),
      groups: Object.fromEntries(
        BUDGET_GROUPS.map((g) => [g.id, budgetLines(groups[g.id], blank.budget.groups[g.id])]),
      ) as PlannerData['budget']['groups'],
    },
    netWorth: {
      sections: Object.fromEntries(
        NET_WORTH_SECTIONS.map((s) => [
          s.id,
          netWorthItems(sections[s.id], blank.netWorth.sections[s.id]),
        ]),
      ) as PlannerData['netWorth']['sections'],
    },
    taxTables: taxTables(r.taxTables),
  };
}

/** Accepts either a bare `PlannerData` object or an exported backup file. */
export function parseBackup(text: string): PlannerData {
  const parsed: unknown = JSON.parse(text);
  if (!isObject(parsed)) throw new Error('That backup is not a planner export.');
  const data = isObject(parsed.data) ? parsed.data : parsed;
  if (!isObject(data.pay) && !isObject(data.budget) && !isObject(data.netWorth)) {
    throw new Error('That backup is not a planner export.');
  }
  return sanitizePlannerData(data);
}

export const BACKUP_FORMAT = 'irish-household-budget-planner';

export function createBackup(data: PlannerData): string {
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, data });
}

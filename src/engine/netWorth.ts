/**
 * Household net worth — a port of the "Net Worth" sheet.
 *
 * A balance sheet with one column per month. The workbook treats a blank
 * month as zero; here a month counts only once something has been recorded
 * in it, so a year started in October doesn't report January–September as a
 * net worth of €0.
 */
import { everyMonth } from './months';

export type NetWorthSectionId = 'cash' | 'investments' | 'pensions' | 'property' | 'liabilities';

export type NetWorthRole = 'home' | 'mortgage';

export interface NetWorthSectionMeta {
  id: NetWorthSectionId;
  name: string;
  kind: 'asset' | 'liability';
}

export const NET_WORTH_SECTIONS: readonly NetWorthSectionMeta[] = [
  { id: 'cash', name: 'Cash & savings', kind: 'asset' },
  { id: 'investments', name: 'Investments', kind: 'asset' },
  { id: 'pensions', name: 'Pensions', kind: 'asset' },
  { id: 'property', name: 'Property & other', kind: 'asset' },
  { id: 'liabilities', name: 'Liabilities', kind: 'liability' },
];

export interface NetWorthItem {
  id: string;
  name: string;
  /** Balance at the end of each month. `null` = not recorded. */
  values: (number | null)[];
  /** The family home and its mortgage drive "equity in your home". */
  role?: NetWorthRole;
}

export interface NetWorthData {
  sections: Record<NetWorthSectionId, NetWorthItem[]>;
}

export type MonthSeries = (number | null)[];

export interface SectionTotals extends NetWorthSectionMeta {
  items: { id: string; name: string; role?: NetWorthRole; values: MonthSeries; change: number | null }[];
  total: MonthSeries;
  change: number | null;
}

export interface NetWorthResult {
  /** True for each month with at least one balance recorded. */
  recorded: boolean[];
  firstRecorded: number | null;
  latestRecorded: number | null;
  sections: SectionTotals[];
  totalAssets: MonthSeries;
  totalLiabilities: MonthSeries;
  netWorth: MonthSeries;
  /** Against the previous recorded month. */
  changeVsPrevious: MonthSeries;
  /** Against the first recorded month. */
  changeSinceStart: MonthSeries;
  liquidAssets: MonthSeries;
  /** Months of budgeted spending the liquid assets would cover. */
  monthsCovered: MonthSeries;
  netWorthExHome: MonthSeries;
  homeEquity: MonthSeries;
  /** Share of net worth locked in pensions. */
  pensionShare: MonthSeries;
  /** Latest recorded minus first recorded. */
  change: {
    totalAssets: number | null;
    totalLiabilities: number | null;
    netWorth: number | null;
    liquidAssets: number | null;
    netWorthExHome: number | null;
    homeEquity: number | null;
  };
}

export function normaliseValues(values: readonly (number | null)[] | undefined): MonthSeries {
  return everyMonth<number | null>(null).map((_, m) => {
    const v = values?.[m];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });
}

export function recordedMonths(data: NetWorthData): boolean[] {
  return everyMonth(false).map((_, m) =>
    NET_WORTH_SECTIONS.some((s) =>
      (data.sections[s.id] ?? []).some((item) => normaliseValues(item.values)[m] !== null),
    ),
  );
}

export function computeNetWorth(data: NetWorthData, avgMonthlySpending: number): NetWorthResult {
  const recorded = recordedMonths(data);
  const firstIdx = recorded.indexOf(true);
  const latestIdx = recorded.lastIndexOf(true);
  const firstRecorded = firstIdx === -1 ? null : firstIdx;
  const latestRecorded = latestIdx === -1 ? null : latestIdx;

  const onRecorded = (fn: (m: number) => number): MonthSeries =>
    everyMonth<number | null>(null).map((_, m) => (recorded[m] ? fn(m) : null));

  const changeOver = (series: MonthSeries): number | null =>
    firstRecorded === null || latestRecorded === null
      ? null
      : (series[latestRecorded] ?? 0) - (series[firstRecorded] ?? 0);

  const sections: SectionTotals[] = NET_WORTH_SECTIONS.map((meta) => {
    const items = (data.sections[meta.id] ?? []).map((item) => {
      const values = normaliseValues(item.values);
      return { id: item.id, name: item.name, role: item.role, values, change: changeOver(values) };
    });
    const total = onRecorded((m) => items.reduce((acc, item) => acc + (item.values[m] ?? 0), 0));
    return { ...meta, items, total, change: changeOver(total) };
  });

  const sectionTotal = (id: NetWorthSectionId, m: number) =>
    sections.find((s) => s.id === id)?.total[m] ?? 0;
  const roleTotal = (role: NetWorthRole, m: number) =>
    sections.reduce(
      (acc, s) =>
        acc + s.items.reduce((a, item) => a + (item.role === role ? (item.values[m] ?? 0) : 0), 0),
      0,
    );

  const totalAssets = onRecorded((m) =>
    sections.reduce((acc, s) => acc + (s.kind === 'asset' ? (s.total[m] ?? 0) : 0), 0),
  );
  const totalLiabilities = onRecorded((m) =>
    sections.reduce((acc, s) => acc + (s.kind === 'liability' ? (s.total[m] ?? 0) : 0), 0),
  );
  const netWorth = onRecorded((m) => (totalAssets[m] ?? 0) - (totalLiabilities[m] ?? 0));

  const changeVsPrevious = everyMonth<number | null>(null).map((_, m) => {
    if (!recorded[m] || m === 0) return null;
    const prev = recorded.lastIndexOf(true, m - 1);
    return prev === -1 ? null : (netWorth[m] ?? 0) - (netWorth[prev] ?? 0);
  });
  const changeSinceStart = everyMonth<number | null>(null).map((_, m) =>
    !recorded[m] || firstRecorded === null || m === firstRecorded
      ? null
      : (netWorth[m] ?? 0) - (netWorth[firstRecorded] ?? 0),
  );

  const liquidAssets = onRecorded((m) => sectionTotal('cash', m) + sectionTotal('investments', m));
  const monthsCovered = onRecorded((m) =>
    avgMonthlySpending === 0 ? 0 : (liquidAssets[m] ?? 0) / avgMonthlySpending,
  );
  const netWorthExHome = onRecorded(
    (m) => (netWorth[m] ?? 0) - roleTotal('home', m) + roleTotal('mortgage', m),
  );
  const homeEquity = onRecorded((m) => roleTotal('home', m) - roleTotal('mortgage', m));
  const pensionShare = onRecorded((m) => {
    const nw = netWorth[m] ?? 0;
    return nw === 0 ? 0 : sectionTotal('pensions', m) / nw;
  });

  return {
    recorded,
    firstRecorded,
    latestRecorded,
    sections,
    totalAssets,
    totalLiabilities,
    netWorth,
    changeVsPrevious,
    changeSinceStart,
    liquidAssets,
    monthsCovered,
    netWorthExHome,
    homeEquity,
    pensionShare,
    change: {
      totalAssets: changeOver(totalAssets),
      totalLiabilities: changeOver(totalLiabilities),
      netWorth: changeOver(netWorth),
      liquidAssets: changeOver(liquidAssets),
      netWorthExHome: changeOver(netWorthExHome),
      homeEquity: changeOver(homeEquity),
    },
  };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { blankPlannerData, samplePlannerData } from '@/data/sample';
import {
  TAX_TABLES_2026,
  cloneTaxTables,
  computePlanner,
  everyMonth,
  type BudgetLine,
  type GroupId,
  type NetWorthItem,
  type NetWorthSectionId,
  type PayInput,
  type PersonInput,
  type PlannerData,
  type PlannerResult,
  type TaxStatus,
  type TaxTables,
} from '@/engine';

import { sanitizePlannerData } from './sanitize';

/** Which budget list a line lives in: a spending category, or other income. */
export type BudgetListId = GroupId | 'income';

export interface BudgetLineRef {
  list: BudgetListId;
  lineId: string;
}

export interface NetWorthItemRef {
  section: NetWorthSectionId;
  itemId: string;
}

interface PlannerState {
  data: PlannerData;
  /** False until the person has picked a starting point on the welcome screen. */
  onboarded: boolean;

  setStatus: (status: TaxStatus) => void;
  updatePerson: (who: 'you' | 'partner', patch: Partial<PersonInput>) => void;
  updatePay: (patch: Partial<Pick<PayInput, 'bandOverride' | 'otherCredits' | 'creditsOverride'>>) => void;

  setBudgetAmount: (ref: BudgetLineRef, month: number, amount: number) => void;
  setBudgetAmounts: (ref: BudgetLineRef, amounts: number[]) => void;
  renameBudgetLine: (ref: BudgetLineRef, name: string) => void;
  addBudgetLine: (list: BudgetListId, name: string) => string;
  deleteBudgetLine: (ref: BudgetLineRef) => void;

  setNetWorthValue: (ref: NetWorthItemRef, month: number, value: number | null) => void;
  copyNetWorthMonth: (from: number, to: number) => void;
  clearNetWorthMonth: (month: number) => void;
  renameNetWorthItem: (ref: NetWorthItemRef, name: string) => void;
  addNetWorthItem: (section: NetWorthSectionId, name: string) => string;
  deleteNetWorthItem: (ref: NetWorthItemRef) => void;

  setTaxTables: (tables: TaxTables) => void;
  resetTaxTables: () => void;

  loadSample: () => void;
  startBlank: () => void;
  replaceData: (data: PlannerData) => void;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getLines(data: PlannerData, list: BudgetListId): BudgetLine[] {
  return list === 'income' ? data.budget.otherIncome : data.budget.groups[list];
}

function withLines(data: PlannerData, list: BudgetListId, lines: BudgetLine[]): PlannerData {
  if (list === 'income') {
    return { ...data, budget: { ...data.budget, otherIncome: lines } };
  }
  return { ...data, budget: { ...data.budget, groups: { ...data.budget.groups, [list]: lines } } };
}

function mapLine(
  data: PlannerData,
  ref: BudgetLineRef,
  fn: (line: BudgetLine) => BudgetLine,
): PlannerData {
  return withLines(
    data,
    ref.list,
    getLines(data, ref.list).map((l) => (l.id === ref.lineId ? fn(l) : l)),
  );
}

function withItems(
  data: PlannerData,
  section: NetWorthSectionId,
  items: NetWorthItem[],
): PlannerData {
  return {
    ...data,
    netWorth: { ...data.netWorth, sections: { ...data.netWorth.sections, [section]: items } },
  };
}

function mapItem(
  data: PlannerData,
  ref: NetWorthItemRef,
  fn: (item: NetWorthItem) => NetWorthItem,
): PlannerData {
  return withItems(
    data,
    ref.section,
    data.netWorth.sections[ref.section].map((i) => (i.id === ref.itemId ? fn(i) : i)),
  );
}

function mapAllItems(data: PlannerData, fn: (item: NetWorthItem) => NetWorthItem): PlannerData {
  const sections = Object.fromEntries(
    Object.entries(data.netWorth.sections).map(([id, items]) => [id, items.map(fn)]),
  ) as PlannerData['netWorth']['sections'];
  return { ...data, netWorth: { ...data.netWorth, sections } };
}

function setAt<T>(values: readonly T[], index: number, value: T): T[] {
  const next = [...values];
  next[index] = value;
  return next;
}

// Hydration is tracked here rather than with persist.hasHydrated(), which never
// turns true if reading storage fails — that would leave the splash screen up.
let hydrationSettled = false;
const hydrationListeners = new Set<() => void>();

function settleHydration() {
  hydrationSettled = true;
  hydrationListeners.forEach((listener) => listener());
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => {
      const update = (fn: (data: PlannerData) => PlannerData) => set((s) => ({ data: fn(s.data) }));
      return {
        data: samplePlannerData(),
        onboarded: false,

        setStatus: (status) => update((d) => ({ ...d, pay: { ...d.pay, status } })),
        updatePerson: (who, patch) =>
          update((d) => ({ ...d, pay: { ...d.pay, [who]: { ...d.pay[who], ...patch } } })),
        updatePay: (patch) => update((d) => ({ ...d, pay: { ...d.pay, ...patch } })),

        setBudgetAmount: (ref, month, amount) =>
          update((d) => mapLine(d, ref, (l) => ({ ...l, amounts: setAt(l.amounts, month, amount) }))),
        setBudgetAmounts: (ref, amounts) =>
          update((d) => mapLine(d, ref, (l) => ({ ...l, amounts: [...amounts] }))),
        renameBudgetLine: (ref, name) => update((d) => mapLine(d, ref, (l) => ({ ...l, name }))),
        addBudgetLine: (list, name) => {
          const id = newId(list);
          update((d) => withLines(d, list, [...getLines(d, list), { id, name, amounts: everyMonth(0) }]));
          return id;
        },
        deleteBudgetLine: (ref) =>
          update((d) =>
            withLines(d, ref.list, getLines(d, ref.list).filter((l) => l.id !== ref.lineId)),
          ),

        setNetWorthValue: (ref, month, value) =>
          update((d) => mapItem(d, ref, (i) => ({ ...i, values: setAt(i.values, month, value) }))),
        copyNetWorthMonth: (from, to) =>
          update((d) =>
            mapAllItems(d, (i) => ({ ...i, values: setAt(i.values, to, i.values[from] ?? null) })),
          ),
        clearNetWorthMonth: (month) =>
          update((d) => mapAllItems(d, (i) => ({ ...i, values: setAt(i.values, month, null) }))),
        renameNetWorthItem: (ref, name) => update((d) => mapItem(d, ref, (i) => ({ ...i, name }))),
        addNetWorthItem: (section, name) => {
          const id = newId(section);
          update((d) =>
            withItems(d, section, [
              ...d.netWorth.sections[section],
              { id, name, values: everyMonth<number | null>(null) },
            ]),
          );
          return id;
        },
        deleteNetWorthItem: (ref) =>
          update((d) =>
            withItems(
              d,
              ref.section,
              d.netWorth.sections[ref.section].filter((i) => i.id !== ref.itemId),
            ),
          ),

        setTaxTables: (tables) => update((d) => ({ ...d, taxTables: tables })),
        resetTaxTables: () => update((d) => ({ ...d, taxTables: cloneTaxTables(TAX_TABLES_2026) })),

        loadSample: () => set({ data: samplePlannerData(), onboarded: true }),
        startBlank: () => set({ data: blankPlannerData(), onboarded: true }),
        replaceData: (data) => set({ data, onboarded: true }),
      };
    },
    {
      name: 'irish-budget-planner',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ data: state.data, onboarded: state.onboarded }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('Could not read saved planner data', error);
        settleHydration();
      },
      // Whatever comes back from storage is checked before the calculations see it.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Pick<PlannerState, 'data' | 'onboarded'>>;
        return {
          ...current,
          data: saved.data ? sanitizePlannerData(saved.data) : current.data,
          onboarded: typeof saved.onboarded === 'boolean' ? saved.onboarded : current.onboarded,
        };
      },
    },
  ),
);

export function isPlannerHydrated(): boolean {
  return hydrationSettled;
}

/** True once saved data has been read back from the device (or reading it failed). */
export function usePlannerHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      hydrationListeners.add(onChange);
      return () => {
        hydrationListeners.delete(onChange);
      };
    },
    isPlannerHydrated,
    () => false,
  );
}

export function usePlannerData(): PlannerData {
  return usePlannerStore((s) => s.data);
}

let cached: { data: PlannerData; result: PlannerResult } | null = null;

function computeCached(data: PlannerData): PlannerResult {
  if (cached?.data !== data) cached = { data, result: computePlanner(data) };
  return cached.result;
}

/** The whole workbook, recalculated once per edit and shared by every screen. */
export function usePlanner(): { data: PlannerData; result: PlannerResult } {
  const data = usePlannerData();
  return { data, result: computeCached(data) };
}

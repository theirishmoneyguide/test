import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { samplePlannerData } from '@/data/sample';
import { computePlanner } from '@/engine';
import { isPlannerHydrated, usePlannerStore } from '@/store/plannerStore';
import { createBackup, parseBackup, sanitizePlannerData } from '@/store/sanitize';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('sanitizing saved data', () => {
  it('keeps a valid planner exactly as it was', () => {
    const sample = samplePlannerData();
    expect(sanitizePlannerData(sample)).toEqual(sample);
  });

  it('round-trips through a backup', () => {
    const sample = samplePlannerData();
    expect(parseBackup(createBackup(sample))).toEqual(sample);
  });

  it('repairs damaged data instead of crashing', () => {
    const repaired = sanitizePlannerData({
      pay: { status: 'nonsense', you: { salary: 'lots' } },
      budget: { groups: { home: [{ id: 'x', name: 'Rent', amounts: [100, null, 'a'] }] } },
      netWorth: { sections: { cash: [{ id: 'c', values: [5, Infinity] }] } },
      taxTables: { standardRate: 'twenty' },
    });
    expect(repaired.pay.status).toBe('single');
    expect(repaired.pay.you.salary).toBe(0);
    expect(repaired.budget.groups.home[0].amounts).toEqual([100, ...Array(11).fill(0)]);
    expect(repaired.netWorth.sections.cash[0].values.slice(0, 2)).toEqual([5, null]);
    expect(repaired.taxTables.standardRate).toBe(0.2);
    expect(() => computePlanner(repaired)).not.toThrow();
  });

  it('rejects text that is not a backup', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup('{"hello": 1}')).toThrow('not a planner export');
  });
});

describe('planner store', () => {
  beforeEach(() => usePlannerStore.getState().loadSample());

  it('edits one month of a budget line without touching the rest', () => {
    const before = usePlannerStore.getState().data;
    usePlannerStore.getState().setBudgetAmount({ list: 'home', lineId: 'home-lpt' }, 6, 215);
    const after = usePlannerStore.getState().data;
    const lpt = after.budget.groups.home.find((l) => l.id === 'home-lpt')!;
    expect(lpt.amounts[0]).toBe(430);
    expect(lpt.amounts[6]).toBe(215);
    expect(after.budget.groups.transport).toBe(before.budget.groups.transport);
    expect(before.budget.groups.home.find((l) => l.id === 'home-lpt')!.amounts[6]).toBe(0);
  });

  it('adds, renames and deletes budget lines', () => {
    const store = usePlannerStore.getState();
    const id = store.addBudgetLine('lifestyle', 'Concerts');
    usePlannerStore.getState().renameBudgetLine({ list: 'lifestyle', lineId: id }, 'Gigs');
    let lines = usePlannerStore.getState().data.budget.groups.lifestyle;
    expect(lines[lines.length - 1]).toMatchObject({ id, name: 'Gigs' });
    usePlannerStore.getState().deleteBudgetLine({ list: 'lifestyle', lineId: id });
    lines = usePlannerStore.getState().data.budget.groups.lifestyle;
    expect(lines.some((l) => l.id === id)).toBe(false);
  });

  it("copies last month's balances into a new month", () => {
    const store = usePlannerStore.getState();
    store.clearNetWorthMonth(11);
    expect(computePlanner(usePlannerStore.getState().data).netWorth.latestRecorded).toBe(10);
    usePlannerStore.getState().copyNetWorthMonth(10, 11);
    const nw = computePlanner(usePlannerStore.getState().data).netWorth;
    expect(nw.netWorth[11]).toBe(nw.netWorth[10]);
  });

  it('only counts the partner when married', () => {
    usePlannerStore.getState().setStatus('single');
    const single = computePlanner(usePlannerStore.getState().data).pay;
    expect(single.household.gross).toBe(65000);
    usePlannerStore.getState().setStatus('married');
    const married = computePlanner(usePlannerStore.getState().data).pay;
    expect(married.household.gross).toBe(110000);
  });

  it('starts blank and resets tax tables', () => {
    usePlannerStore.getState().startBlank();
    const blank = usePlannerStore.getState().data;
    expect(blank.pay.you.salary).toBe(0);
    expect(blank.budget.groups.home.every((l) => l.amounts.every((a) => a === 0))).toBe(true);
    usePlannerStore.getState().setTaxTables({ ...blank.taxTables, standardRate: 0.21 });
    usePlannerStore.getState().resetTaxTables();
    expect(usePlannerStore.getState().data.taxTables.standardRate).toBe(0.2);
  });
});

describe('reading saved data', () => {
  it('still finishes loading when storage holds something unreadable', async () => {
    await AsyncStorage.setItem('irish-budget-planner', '{not json');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await usePlannerStore.persist.rehydrate();
    // zustand never reports this as hydrated, which is why the app tracks it itself…
    expect(usePlannerStore.persist.hasHydrated()).toBe(false);
    // …and our handler ran, so the splash screen still comes down.
    expect(warn).toHaveBeenCalledWith('Could not read saved planner data', expect.anything());
    expect(isPlannerHydrated()).toBe(true);
    warn.mockRestore();
  });
});

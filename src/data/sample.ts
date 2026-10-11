/**
 * The example household that ships with the workbook: two earners on €65,000
 * and €45,000, a mortgage, a car and a typical year of bills. A realistic
 * starting point to overwrite, not a recommendation.
 */
import {
  TAX_TABLES_2026,
  cloneTaxTables,
  everyMonth,
  type BudgetData,
  type BudgetLine,
  type NetWorthData,
  type NetWorthItem,
  type PayInput,
  type PlannerData,
} from '@/engine';

/** The same amount every month. */
function monthly(amount: number): number[] {
  return everyMonth(amount);
}

/** Amounts in named months only, e.g. `inMonths({ 2: 1150 })` for a March bill. */
function inMonths(amounts: Record<number, number>): number[] {
  return everyMonth(0).map((_, m) => amounts[m] ?? 0);
}

function line(id: string, name: string, amounts: number[]): BudgetLine {
  return { id, name, amounts };
}

function item(
  id: string,
  name: string,
  values: (number | null)[],
  role?: NetWorthItem['role'],
): NetWorthItem {
  return role ? { id, name, values, role } : { id, name, values };
}

/** A series that starts at `start` and moves by `step` each month. */
function steady(start: number, step: number): number[] {
  return everyMonth(0).map((_, m) => start + step * m);
}

export const SAMPLE_PAY: PayInput = {
  status: 'married',
  you: {
    salary: 65000,
    bonus: 0,
    age: 42,
    medicalCardOr70: false,
    pensionPct: 0.1,
    pensionFixed: 0,
    employerPct: 0.05,
  },
  partner: {
    salary: 45000,
    bonus: 0,
    age: 40,
    medicalCardOr70: false,
    pensionPct: 0.05,
    pensionFixed: 0,
    employerPct: 0.03,
  },
  bandOverride: null,
  otherCredits: 0,
  creditsOverride: null,
};

export const SAMPLE_BUDGET: BudgetData = {
  otherIncome: [line('other-income', 'Other net income (rent, side income, etc.)', monthly(0))],
  groups: {
    home: [
      line('home-mortgage', 'Mortgage or rent', monthly(1850)),
      line('home-lpt', 'Local Property Tax', inMonths({ 0: 430 })),
      line('home-insurance', 'Home insurance', inMonths({ 5: 620 })),
      line('home-maintenance', 'Management fee / maintenance', monthly(0)),
    ],
    utilities: [
      line('util-electricity', 'Electricity', monthly(140)),
      line(
        'util-gas',
        'Gas / heating oil',
        inMonths({ 0: 95, 1: 95, 2: 95, 3: 95, 4: 95, 8: 95, 9: 95, 10: 95, 11: 95 }),
      ),
      line('util-broadband', 'Broadband', monthly(45)),
      line('util-mobile', 'Mobile phones', monthly(60)),
      line('util-tv', 'TV & streaming', monthly(35)),
      line('util-bins', 'Bins / waste', monthly(30)),
    ],
    transport: [
      line('transport-car-loan', 'Car loan / PCP / lease', monthly(380)),
      line('transport-insurance', 'Motor insurance', inMonths({ 2: 1150 })),
      line('transport-tax', 'Motor tax', inMonths({ 2: 480 })),
      line('transport-fuel', 'Fuel / EV charging', monthly(220)),
      line('transport-servicing', 'Servicing, tyres & NCT', inMonths({ 4: 650 })),
      line('transport-tolls', 'Tolls, parking & public transport', monthly(120)),
    ],
    living: [
      line('living-groceries', 'Groceries', [...monthly(800).slice(0, 11), 1000]),
      line('living-household', 'Household & cleaning', monthly(90)),
      line('living-childcare', 'Childcare / school costs', monthly(0)),
      line('living-pets', 'Pets', monthly(60)),
    ],
    health: [
      line('health-insurance', 'Health insurance', monthly(280)),
      line('health-gp', 'GP, dentist & prescriptions', monthly(90)),
      line('health-life', 'Life / mortgage protection', monthly(65)),
      line('health-income-protection', 'Income protection', monthly(0)),
    ],
    lifestyle: [
      line('lifestyle-eating-out', 'Eating out & takeaway', [...monthly(260).slice(0, 11), 400]),
      line('lifestyle-gym', 'Gym, sport & hobbies', monthly(130)),
      line('lifestyle-subscriptions', 'Subscriptions (audit these yearly)', monthly(40)),
      line('lifestyle-clothing', 'Clothing', monthly(120)),
      line('lifestyle-holidays', 'Holidays & trips', inMonths({ 2: 500, 6: 2200, 9: 800 })),
      line('lifestyle-gifts', 'Gifts & occasions', [...monthly(60).slice(0, 11), 700]),
    ],
    debt: [
      line('debt-credit-card', 'Credit card repayments', monthly(0)),
      line('debt-personal-loan', 'Personal / credit union loan', monthly(0)),
    ],
    savings: [
      line('savings-emergency', 'Emergency fund', monthly(300)),
      line('savings-etfs', 'ETFs / investments', monthly(550)),
      line('savings-sinking', 'Sinking fund for annual bills', monthly(0)),
      line('savings-other', 'Other savings goals', monthly(0)),
    ],
  },
};

export const SAMPLE_NET_WORTH: NetWorthData = {
  sections: {
    cash: [
      item('nw-current', 'Current accounts', monthly(4000)),
      item('nw-emergency', 'Emergency fund (instant access)', steady(18000, 300)),
      item('nw-regular-saver', 'Regular saver / State Savings', monthly(0)),
    ],
    investments: [
      item('nw-etfs', 'ETFs / shares', [
        46000, 46780, 47564, 48352, 49143, 49939, 50739, 51543, 52350, 53162, 53978, 54798,
      ]),
      item('nw-crypto', 'Crypto / other', monthly(0)),
    ],
    pensions: [
      item('nw-pension-you', 'Your pension', [
        62000, 63123, 64252, 65386, 66526, 67671, 68823, 69980, 71143, 72312, 73486, 74667,
      ]),
      item('nw-pension-partner', "Partner's pension", [
        31000, 31455, 31912, 32372, 32834, 33298, 33764, 34233, 34704, 35178, 35654, 36132,
      ]),
      item('nw-pension-old', 'Old / frozen pensions', [
        14000, 14070, 14140, 14211, 14282, 14354, 14425, 14497, 14570, 14643, 14716, 14790,
      ]),
    ],
    property: [
      item(
        'nw-home',
        'Family home (market value)',
        [
          465000, 465698, 466396, 467096, 467796, 468498, 469201, 469905, 470609, 471315, 472022,
          472730,
        ],
        'home',
      ),
      item('nw-other-property', 'Other property', monthly(0)),
      item('nw-cars', 'Cars', steady(22000, -200)),
      item('nw-other-assets', 'Other assets', monthly(0)),
    ],
    liabilities: [
      item('nw-mortgage', 'Mortgage outstanding', steady(312000, -690), 'mortgage'),
      item('nw-car-loan', 'Car loan / PCP', steady(14000, -380)),
      item('nw-personal-loan', 'Credit union / personal loan', monthly(0)),
      item('nw-credit-card', 'Credit card balance', monthly(0)),
      item('nw-other-debt', 'Other debt', monthly(0)),
    ],
  },
};

export function samplePlannerData(): PlannerData {
  // Deep copies, so editing the store never mutates these constants.
  return JSON.parse(
    JSON.stringify({
      pay: SAMPLE_PAY,
      budget: SAMPLE_BUDGET,
      netWorth: SAMPLE_NET_WORTH,
      taxTables: cloneTaxTables(TAX_TABLES_2026),
    }),
  ) as PlannerData;
}

/** Same categories and accounts as the sample, every figure cleared. */
export function blankPlannerData(): PlannerData {
  const sample = samplePlannerData();
  const clearLines = (lines: BudgetLine[]) =>
    lines.map((l) => ({ ...l, amounts: everyMonth(0) }));
  const groups = Object.fromEntries(
    Object.entries(sample.budget.groups).map(([id, lines]) => [id, clearLines(lines)]),
  ) as BudgetData['groups'];
  const sections = Object.fromEntries(
    Object.entries(sample.netWorth.sections).map(([id, items]) => [
      id,
      items.map((i) => ({ ...i, values: everyMonth<number | null>(null) })),
    ]),
  ) as NetWorthData['sections'];
  const emptyPerson = {
    salary: 0,
    bonus: 0,
    age: 30,
    medicalCardOr70: false,
    pensionPct: 0,
    pensionFixed: 0,
    employerPct: 0,
  };
  return {
    pay: {
      status: 'single',
      you: { ...emptyPerson },
      partner: { ...emptyPerson },
      bandOverride: null,
      otherCredits: 0,
      creditsOverride: null,
    },
    budget: { otherIncome: clearLines(sample.budget.otherIncome), groups },
    netWorth: { sections },
    taxTables: sample.taxTables,
  };
}

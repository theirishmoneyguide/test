/**
 * Household take-home pay — a line-by-line port of the "Take-Home Pay" sheet.
 *
 * Income tax is assessed on the couple together (joint assessment). USC and
 * PRSI are always worked out on each person separately. Pension relief is
 * checked per person against their own age-related limit.
 */
import type { PensionAgeBand, TaxStatus, TaxTables, UscBand } from './taxTables';

export interface PersonInput {
  /** Annual gross salary. */
  salary: number;
  /** Bonus / commission / other taxable pay. */
  bonus: number;
  /** Age at 31 December of the tax year. */
  age: number;
  /** Medical card holder, or aged 70 or over. */
  medicalCardOr70: boolean;
  /** Own pension contribution as a share of gross pay (0.1 = 10%). */
  pensionPct: number;
  /** Own pension contribution as a fixed € per year. Overrides the % when above zero. */
  pensionFixed: number;
  /** Employer pension contribution as a share of gross pay. */
  employerPct: number;
}

export interface PayInput {
  status: TaxStatus;
  you: PersonInput;
  /** Only counted when the status is married / civil partners. */
  partner: PersonInput;
  /** Leave `null` to use the suggested standard rate band. */
  bandOverride: number | null;
  /** Rent credit, medical expenses relief, home carer, etc. */
  otherCredits: number;
  /** Leave `null` to use suggested + other credits. */
  creditsOverride: number | null;
}

export const ZERO_PERSON: PersonInput = {
  salary: 0,
  bonus: 0,
  age: 0,
  medicalCardOr70: false,
  pensionPct: 0,
  pensionFixed: 0,
  employerPct: 0,
};

export type UscTreatment = 'standard' | 'exempt' | 'reduced';

export interface PersonResult {
  gross: number;
  contribution: number;
  employerContribution: number;
  totalIntoPension: number;
  ageLimitPct: number;
  maxRelievable: number;
  relievedContribution: number;
  unrelievedContribution: number;
  roomLeft: number;
  taxableIncome: number;
  /** USC charged in each band, as actually applied to this person. */
  uscByBand: number[];
  uscTreatment: UscTreatment;
  usc: number;
  weeklyGross: number;
  prsiCredit: number;
  prsi: number;
  marginalRate: number;
  marginalIncomeTax: number;
  marginalUsc: number;
  marginalPrsi: number;
}

export interface HouseholdResult {
  gross: number;
  contribution: number;
  employerContribution: number;
  totalIntoPension: number;
  maxRelievable: number;
  relievedContribution: number;
  unrelievedContribution: number;
  roomLeft: number;
  suggestedBand: number;
  bandApplied: number;
  suggestedCredits: number;
  otherCredits: number;
  creditsApplied: number;
  prsiRate: number;
  taxableIncome: number;
  taxAtStandardRate: number;
  taxAtHigherRate: number;
  grossIncomeTax: number;
  incomeTax: number;
  usc: number;
  prsi: number;
  totalDeductions: number;
  netAnnual: number;
  netMonthly: number;
  effectiveTaxRate: number;
  incomeTaxWithoutPension: number;
  pensionTaxRelief: number;
  pensionRealCost: number;
  /** What each €100 put into a pension really costs after income tax relief. */
  pensionCostPer100: number;
}

export interface TakeHomeResult {
  hasPartner: boolean;
  you: PersonResult;
  partner: PersonResult;
  household: HouseholdResult;
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function ageRelatedLimit(age: number, bands: readonly PensionAgeBand[]): number {
  let pct = bands[0]?.pct ?? 0;
  for (const band of bands) {
    if (age >= band.ageFrom) pct = band.pct;
  }
  return pct;
}

function bandCeiling(band: UscBand | undefined): number {
  return band?.upTo ?? Number.POSITIVE_INFINITY;
}

/** USC in each band on the standard scale. */
export function uscStandardBands(gross: number, bands: readonly UscBand[]): number[] {
  let lower = 0;
  return bands.map((band) => {
    const upper = bandCeiling(band);
    const charged = Math.max(0, Math.min(gross, upper) - lower) * band.rate;
    lower = upper;
    return charged;
  });
}

export function computeUsc(
  gross: number,
  medicalCardOr70: boolean,
  usc: TaxTables['usc'],
): { byBand: number[]; total: number; treatment: UscTreatment } {
  const bands = usc.bands;
  if (gross <= usc.exemptionThreshold) {
    return { byBand: bands.map(() => 0), total: 0, treatment: 'exempt' };
  }
  if (medicalCardOr70 && gross <= usc.reducedRateCeiling) {
    const firstCeiling = bandCeiling(bands[0]);
    const byBand = bands.map(() => 0);
    byBand[0] = Math.min(gross, firstCeiling) * (bands[0]?.rate ?? 0);
    if (byBand.length > 1) byBand[1] = Math.max(0, gross - firstCeiling) * (bands[1]?.rate ?? 0);
    return { byBand, total: byBand.reduce((a, b) => a + b, 0), treatment: 'reduced' };
  }
  const byBand = uscStandardBands(gross, bands);
  return { byBand, total: byBand.reduce((a, b) => a + b, 0), treatment: 'standard' };
}

/** The USC rate on the next euro, as the workbook's marginal-rate line works it out. */
export function uscMarginalRate(
  gross: number,
  medicalCardOr70: boolean,
  usc: TaxTables['usc'],
): number {
  const bands = usc.bands;
  if (medicalCardOr70 && gross <= usc.reducedRateCeiling) {
    return gross > bandCeiling(bands[0]) ? (bands[1]?.rate ?? 0) : (bands[0]?.rate ?? 0);
  }
  for (const band of bands) {
    if (gross <= bandCeiling(band)) return band.rate;
  }
  return bands[bands.length - 1]?.rate ?? 0;
}

export function computePrsi(
  gross: number,
  prsi: TaxTables['prsi'],
): { weeklyGross: number; credit: number; prsi: number } {
  const weeklyGross = gross / 52;
  if (weeklyGross <= prsi.weeklyExemption) {
    return { weeklyGross, credit: 0, prsi: 0 };
  }
  const weeklyCredit = Math.max(
    0,
    prsi.maxWeeklyCredit - Math.max(0, weeklyGross - (prsi.weeklyExemption + 0.01)) / 6,
  );
  const credit = weeklyCredit * 52;
  return { weeklyGross, credit, prsi: Math.max(0, gross * prsi.rate - credit) };
}

interface PensionPart {
  gross: number;
  contribution: number;
  employerContribution: number;
  ageLimitPct: number;
  maxRelievable: number;
  relievedContribution: number;
}

function pensionPart(person: PersonInput, tables: TaxTables): PensionPart {
  const gross = finite(person.salary) + finite(person.bonus);
  const contribution =
    finite(person.pensionFixed) > 0 ? finite(person.pensionFixed) : gross * finite(person.pensionPct);
  const employerContribution = gross * finite(person.employerPct);
  const ageLimitPct = ageRelatedLimit(finite(person.age), tables.pension.ageBands);
  const maxRelievable = Math.min(gross, tables.pension.earningsCap) * ageLimitPct;
  const relievedContribution = Math.min(contribution, maxRelievable);
  return { gross, contribution, employerContribution, ageLimitPct, maxRelievable, relievedContribution };
}

function incomeTaxOn(taxable: number, band: number, credits: number, tables: TaxTables): number {
  const charged =
    Math.min(taxable, band) * tables.standardRate +
    Math.max(0, taxable - band) * tables.higherRate;
  return Math.max(0, charged - credits);
}

export function computeTakeHome(input: PayInput, tables: TaxTables): TakeHomeResult {
  const hasPartner = input.status === 'married';
  const status = tables.statuses[input.status];
  // Leaving the partner out behaves exactly like a partner column of zeros.
  const partnerInput = hasPartner ? input.partner : ZERO_PERSON;
  const youPart = pensionPart(input.you, tables);
  const partnerPart = pensionPart(partnerInput, tables);

  // 4. Rate band and tax credits — household
  const suggestedBand =
    status.srcop +
    (hasPartner ? Math.min(tables.maxBandTransfer, Math.min(youPart.gross, partnerPart.gross)) : 0);
  const bandApplied = input.bandOverride ?? suggestedBand;
  const suggestedCredits =
    status.personalCredit +
    status.payeCredit +
    (hasPartner && partnerPart.gross > 0 ? status.payeCredit : 0);
  const otherCredits = finite(input.otherCredits);
  const creditsApplied = input.creditsOverride ?? suggestedCredits + otherCredits;
  const prsiRate = tables.prsi.rate;

  // 5. Income tax — assessed on the couple together
  const youTaxable = youPart.gross - youPart.relievedContribution;
  const partnerTaxable = partnerPart.gross - partnerPart.relievedContribution;
  const taxableIncome = youTaxable + partnerTaxable;
  const taxAtStandardRate = Math.min(taxableIncome, bandApplied) * tables.standardRate;
  const taxAtHigherRate = Math.max(0, taxableIncome - bandApplied) * tables.higherRate;
  const grossIncomeTax = taxAtStandardRate + taxAtHigherRate;
  const incomeTax = Math.max(0, grossIncomeTax - creditsApplied);
  const marginalIncomeTax =
    taxableIncome > bandApplied ? tables.higherRate : tables.standardRate;

  const personResult = (
    part: PensionPart,
    person: PersonInput,
    taxable: number,
  ): PersonResult => {
    const usc = computeUsc(part.gross, person.medicalCardOr70, tables.usc);
    const prsi = computePrsi(part.gross, tables.prsi);
    const marginalUsc = uscMarginalRate(part.gross, person.medicalCardOr70, tables.usc);
    return {
      gross: part.gross,
      contribution: part.contribution,
      employerContribution: part.employerContribution,
      totalIntoPension: part.contribution + part.employerContribution,
      ageLimitPct: part.ageLimitPct,
      maxRelievable: part.maxRelievable,
      relievedContribution: part.relievedContribution,
      unrelievedContribution: Math.max(0, part.contribution - part.maxRelievable),
      roomLeft: Math.max(0, part.maxRelievable - part.contribution),
      taxableIncome: taxable,
      uscByBand: usc.byBand,
      uscTreatment: usc.treatment,
      usc: usc.total,
      weeklyGross: prsi.weeklyGross,
      prsiCredit: prsi.credit,
      prsi: prsi.prsi,
      marginalRate: marginalIncomeTax + marginalUsc + prsiRate,
      marginalIncomeTax,
      marginalUsc,
      marginalPrsi: prsiRate,
    };
  };

  const you = personResult(youPart, input.you, youTaxable);
  const partner = personResult(partnerPart, partnerInput, partnerTaxable);

  // 8. What lands in your accounts
  const gross = you.gross + partner.gross;
  const contribution = you.contribution + partner.contribution;
  const usc = you.usc + partner.usc;
  const prsi = you.prsi + partner.prsi;
  const totalDeductions = incomeTax + usc + prsi + contribution;
  const netAnnual = gross - totalDeductions;

  // 9. How it stacks up
  const incomeTaxWithoutPension = incomeTaxOn(gross, bandApplied, creditsApplied, tables);
  const pensionTaxRelief = incomeTaxWithoutPension - incomeTax;
  const pensionRealCost = contribution - pensionTaxRelief;

  return {
    hasPartner,
    you,
    partner,
    household: {
      gross,
      contribution,
      employerContribution: you.employerContribution + partner.employerContribution,
      totalIntoPension: you.totalIntoPension + partner.totalIntoPension,
      maxRelievable: you.maxRelievable + partner.maxRelievable,
      relievedContribution: you.relievedContribution + partner.relievedContribution,
      unrelievedContribution: you.unrelievedContribution + partner.unrelievedContribution,
      roomLeft: you.roomLeft + partner.roomLeft,
      suggestedBand,
      bandApplied,
      suggestedCredits,
      otherCredits,
      creditsApplied,
      prsiRate,
      taxableIncome,
      taxAtStandardRate,
      taxAtHigherRate,
      grossIncomeTax,
      incomeTax,
      usc,
      prsi,
      totalDeductions,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveTaxRate: gross === 0 ? 0 : (incomeTax + usc + prsi) / gross,
      incomeTaxWithoutPension,
      pensionTaxRelief,
      pensionRealCost,
      pensionCostPer100: contribution === 0 ? 0 : (100 * pensionRealCost) / contribution,
    },
  };
}

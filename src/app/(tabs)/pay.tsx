import { type ReactNode } from 'react';
import { Switch, Text, View } from 'react-native';

import { AmountField, InputRow, Segmented, type FieldSize } from '@/components/inputs';
import {
  Card,
  CollapsibleCard,
  ColumnsHeader,
  ColumnsRow,
  Disclaimer,
  Note,
  Row,
  ScreenScroll,
} from '@/components/ui';
import {
  STATUS_SHORT_LABELS,
  TAX_STATUSES,
  type PersonInput,
  type PersonResult,
  type TaxStatus,
} from '@/engine';
import { usePlanner, usePlannerStore } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { space, themedStyles } from '@/theme/styles';
import { formatEuro, formatPercent } from '@/utils/format';

type Who = 'you' | 'partner';

const useStyles = themedStyles((c) => ({
  headline: { backgroundColor: c.headlineBg, borderRadius: 16, padding: space.lg, gap: 4 },
  headlineLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.headlineText,
  },
  headlineValue: { fontSize: 34, fontWeight: '800', color: c.headlineText },
  headlineSub: { fontSize: 15, color: c.headlineText },
  dualRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border },
  dualFirst: { borderTopWidth: 0 },
  dualLabel: { fontSize: 15, color: c.text },
  dualNote: { fontSize: 12.5, color: c.textMuted, marginTop: 2, lineHeight: 17 },
  dualFields: { flexDirection: 'row', gap: space.sm, marginTop: 8 },
  dualCell: { flex: 1 },
  dualCaption: { fontSize: 11.5, fontWeight: '700', color: c.textMuted, marginBottom: 4 },
  switchCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  switchText: { fontSize: 14, color: c.textMuted },
}));

/** One input per person: side by side for a couple, a single field otherwise. */
function PersonField({
  label,
  note,
  couple,
  first,
  render,
}: {
  label: string;
  note?: string;
  couple: boolean;
  first?: boolean;
  render: (who: Who, size: FieldSize) => ReactNode;
}) {
  const styles = useStyles();
  if (!couple) {
    return (
      <InputRow label={label} note={note} first={first}>
        {render('you', 'regular')}
      </InputRow>
    );
  }
  return (
    <View style={[styles.dualRow, first && styles.dualFirst]}>
      <Text style={styles.dualLabel}>{label}</Text>
      {note ? <Text style={styles.dualNote}>{note}</Text> : null}
      <View style={styles.dualFields}>
        {(['you', 'partner'] as const).map((who) => (
          <View key={who} style={styles.dualCell}>
            <Text style={styles.dualCaption}>{who === 'you' ? 'YOU' : 'PARTNER'}</Text>
            {render(who, 'fill')}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Per-person figures with a household total, or one figure for a single earner. */
function Figures({
  title,
  you,
  partner,
  couple,
  note,
  format = (v: number) => formatEuro(v),
  total = true,
  variant,
}: {
  title: string;
  you: number;
  partner: number;
  couple: boolean;
  note?: string;
  format?: (v: number) => string;
  total?: boolean;
  variant?: 'subtotal' | 'headline';
}) {
  return couple ? (
    <ColumnsRow
      label={title}
      note={note}
      variant={variant}
      values={[format(you), format(partner), total ? format(you + partner) : null]}
    />
  ) : (
    <Row label={title} note={note} value={format(you)} variant={variant} />
  );
}

export default function PayScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { data, result } = usePlanner();
  const setStatus = usePlannerStore((s) => s.setStatus);
  const updatePerson = usePlannerStore((s) => s.updatePerson);
  const updatePay = usePlannerStore((s) => s.updatePay);

  const input = data.pay;
  const tables = data.taxTables;
  const r = result.pay;
  const h = r.household;
  const couple = r.hasPartner;
  const year = tables.year;

  const person = (who: Who): PersonInput => input[who];
  const set = (who: Who, patch: Partial<PersonInput>) => updatePerson(who, patch);
  const label = (who: Who, text: string) => `${who === 'you' ? 'Your' : "Partner's"} ${text}`;

  const columns = couple ? <ColumnsHeader columns={['You', 'Partner', 'Household']} /> : null;
  const uscBandLabel = (i: number) =>
    `Band ${i + 1} — ${formatPercent(tables.usc.bands[i].rate, tables.usc.bands[i].rate < 0.01 ? 1 : 0)}`;
  const uscNote = (p: PersonResult, who: string) =>
    p.uscTreatment === 'exempt'
      ? `${who}: no USC — income at or below ${formatEuro(tables.usc.exemptionThreshold)}.`
      : p.uscTreatment === 'reduced'
        ? `${who}: medical card or 70+, under ${formatEuro(tables.usc.reducedRateCeiling)} — USC capped at ${formatPercent(tables.usc.bands[1]?.rate ?? 0, 0)}.`
        : null;
  const uscNotes = [uscNote(r.you, 'You'), couple ? uscNote(r.partner, 'Partner') : null]
    .filter(Boolean)
    .join(' ');

  return (
    <ScreenScroll>
      <View style={styles.headline} accessible accessibilityRole="summary">
        <Text style={styles.headlineLabel}>Household net take-home pay</Text>
        <Text style={styles.headlineValue}>{formatEuro(h.netMonthly)}</Text>
        <Text style={styles.headlineSub}>
          a month · {formatEuro(h.netAnnual)} a year · {formatPercent(h.effectiveTaxRate)} effective tax
        </Text>
      </View>

      <Card title="1. Who is in the household">
        <Segmented<TaxStatus>
          accessibilityLabel="Tax status"
          value={input.status}
          onChange={setStatus}
          options={TAX_STATUSES.map((s) => ({ value: s, label: STATUS_SHORT_LABELS[s] }))}
        />
        <Note style={{ marginTop: space.sm, marginBottom: space.xs }}>
          {couple
            ? 'Married or civil partners, jointly assessed: income tax on the two of you together, USC and PRSI on each of you separately.'
            : input.status === 'singleCarer'
              ? "Single person child carer: a wider band. Add the Single Person Child Carer Credit under 'Other tax credits' below."
              : 'A single earner. Choose married / civil partners to add a second income.'}
        </Note>
        <PersonField
          first
          couple={couple}
          label="Annual gross salary"
          render={(who, size) => (
            <AmountField
              size={size}
              value={person(who).salary}
              onChange={(v) => set(who, { salary: v ?? 0 })}
              accessibilityLabel={label(who, 'annual gross salary')}
            />
          )}
        />
        <PersonField
          couple={couple}
          label="Bonus, commission or other taxable pay"
          render={(who, size) => (
            <AmountField
              size={size}
              value={person(who).bonus}
              onChange={(v) => set(who, { bonus: v ?? 0 })}
              accessibilityLabel={label(who, 'bonus or other taxable pay')}
            />
          )}
        />
        <PersonField
          couple={couple}
          label={`Age at 31 December ${year}`}
          note="Sets each person's pension relief ceiling"
          render={(who, size) => (
            <AmountField
              size={size}
              kind="integer"
              max={120}
              value={person(who).age}
              onChange={(v) => set(who, { age: v ?? 0 })}
              accessibilityLabel={label(who, `age at 31 December ${year}`)}
            />
          )}
        />
        <PersonField
          couple={couple}
          label="Medical card, or aged 70 or over?"
          note={`If yes and income is under ${formatEuro(tables.usc.reducedRateCeiling)}, USC caps at ${formatPercent(tables.usc.bands[1]?.rate ?? 0, 0)}`}
          render={(who) => (
            <View style={styles.switchCell}>
              <Switch
                value={person(who).medicalCardOr70}
                onValueChange={(v) => set(who, { medicalCardOr70: v })}
                accessibilityLabel={label(who, 'medical card or aged 70 or over')}
                trackColor={{ true: colors.brand, false: colors.border }}
                thumbColor={colors.surface}
                ios_backgroundColor={colors.border}
              />
              <Text style={styles.switchText}>{person(who).medicalCardOr70 ? 'Yes' : 'No'}</Text>
            </View>
          )}
        />
      </Card>

      <Card title="2. Pension contributions">
        <PersonField
          first
          couple={couple}
          label="Your contribution — % of gross pay"
          render={(who, size) => (
            <AmountField
              size={size}
              kind="percent"
              value={person(who).pensionPct}
              onChange={(v) => set(who, { pensionPct: v ?? 0 })}
              accessibilityLabel={label(who, 'pension contribution percentage')}
            />
          )}
        />
        <PersonField
          couple={couple}
          label="…or a fixed € per year"
          note="Fill in one or the other. A euro amount here overrides the %."
          render={(who, size) => (
            <AmountField
              size={size}
              value={person(who).pensionFixed}
              onChange={(v) => set(who, { pensionFixed: v ?? 0 })}
              accessibilityLabel={label(who, 'fixed pension contribution per year')}
            />
          )}
        />
        <PersonField
          couple={couple}
          label="Employer contribution — % of gross pay"
          note="Does not use up anyone's own relief limit"
          render={(who, size) => (
            <AmountField
              size={size}
              kind="percent"
              value={person(who).employerPct}
              onChange={(v) => set(who, { employerPct: v ?? 0 })}
              accessibilityLabel={label(who, 'employer pension contribution percentage')}
            />
          )}
        />
        <View style={{ height: space.sm }} />
        {columns}
        <Figures title="Contribution" couple={couple} you={r.you.contribution} partner={r.partner.contribution} />
        <Figures title="Employer contribution" couple={couple} you={r.you.employerContribution} partner={r.partner.employerContribution} />
        <Figures title="Total going into pensions" couple={couple} you={r.you.totalIntoPension} partner={r.partner.totalIntoPension} variant="subtotal" />
      </Card>

      <CollapsibleCard
        title="3. Pension relief check"
        summary={`${formatEuro(h.roomLeft)} room left`}
      >
        {columns}
        <Figures
          title="Age-related relief limit"
          couple={couple} you={r.you.ageLimitPct} partner={r.partner.ageLimitPct}
          format={(v) => formatPercent(v, 0)}
          total={false}
        />
        <Figures
          title="Maximum contribution qualifying for relief"
          couple={couple} you={r.you.maxRelievable} partner={r.partner.maxRelievable}
          note={`Age % × the lower of gross pay or the ${formatEuro(tables.pension.earningsCap)} cap`}
        />
        <Figures title="Contribution getting tax relief" couple={couple} you={r.you.relievedContribution} partner={r.partner.relievedContribution} />
        <Figures
          title="Contribution getting NO relief this year"
          couple={couple} you={r.you.unrelievedContribution} partner={r.partner.unrelievedContribution}
          note="Above the age limit. Can be carried forward."
        />
        <Figures
          title="Room left with full relief"
          couple={couple} you={r.you.roomLeft} partner={r.partner.roomLeft}
          variant="subtotal"
          note={couple ? "One partner's unused room cannot be used by the other" : undefined}
        />
      </CollapsibleCard>

      <CollapsibleCard
        title="4. Rate band and tax credits"
        summary={`${formatEuro(h.bandApplied)} · ${formatEuro(h.creditsApplied)}`}
      >
        <Row
          first
          label="Suggested standard rate band"
          value={formatEuro(h.suggestedBand)}
          note={
            couple
              ? `${formatEuro(tables.statuses.married.srcop)} plus the lower earner's income, capped at ${formatEuro(tables.maxBandTransfer)} of transfer`
              : undefined
          }
        />
        <InputRow label="Override — standard rate band" note="Leave blank to use the suggested figure">
          <AmountField
            allowEmpty
            value={input.bandOverride}
            onChange={(v) => updatePay({ bandOverride: v })}
            accessibilityLabel="Override the standard rate band"
          />
        </InputRow>
        <Row label="Standard rate band applied" value={formatEuro(h.bandApplied)} variant="subtotal" />
        <Row
          label="Suggested personal + PAYE credits"
          value={formatEuro(h.suggestedCredits)}
          note={couple ? 'Each PAYE earner gets their own PAYE credit' : undefined}
        />
        <InputRow label="Other tax credits" note="Rent credit, medical expenses relief, home carer, etc.">
          <AmountField
            value={input.otherCredits}
            onChange={(v) => updatePay({ otherCredits: v ?? 0 })}
            accessibilityLabel="Other tax credits"
          />
        </InputRow>
        <InputRow label="Override — total tax credits" note="Leave blank to use suggested + other">
          <AmountField
            allowEmpty
            value={input.creditsOverride}
            onChange={(v) => updatePay({ creditsOverride: v })}
            accessibilityLabel="Override the total tax credits"
          />
        </InputRow>
        <Row label="Total tax credits applied" value={formatEuro(h.creditsApplied)} variant="subtotal" />
        <Row
          label="PRSI rate applied"
          value={formatPercent(h.prsiRate, 2)}
          note="The rate in force from 1 October, applied to the whole year"
        />
      </CollapsibleCard>

      <CollapsibleCard
        title={couple ? '5. Income tax — on the couple together' : '5. Income tax'}
        summary={formatEuro(h.incomeTax)}
      >
        {columns}
        <Figures title="Taxable income after pension relief" couple={couple} you={r.you.taxableIncome} partner={r.partner.taxableIncome} />
        <Row label={`Taxed at ${formatPercent(tables.standardRate, 0)}`} value={formatEuro(h.taxAtStandardRate)} variant="indent" />
        <Row label={`Taxed at ${formatPercent(tables.higherRate, 0)}`} value={formatEuro(h.taxAtHigherRate)} variant="indent" />
        <Row label="Gross income tax" value={formatEuro(h.grossIncomeTax)} />
        <Row label="Less tax credits" value={formatEuro(-h.creditsApplied)} variant="indent" />
        <Row
          label="Income tax payable"
          value={formatEuro(h.incomeTax)}
          variant="subtotal"
          note={
            couple
              ? 'One household liability. How it splits across two payslips depends on how Revenue has divided your band and credits — the annual total is the same either way.'
              : undefined
          }
        />
      </CollapsibleCard>

      <CollapsibleCard title={couple ? '6. USC — each person separately' : '6. USC'} summary={formatEuro(h.usc)}>
        {columns}
        {tables.usc.bands.map((_, i) => (
          <Figures
            key={i}
            title={uscBandLabel(i)}
            couple={couple} you={r.you.uscByBand[i] ?? 0} partner={r.partner.uscByBand[i] ?? 0}
            format={(v) => formatEuro(v, 2)}
            total={false}
          />
        ))}
        <Figures title="USC payable" couple={couple} you={r.you.usc} partner={r.partner.usc} variant="subtotal" />
        <Note style={{ marginTop: space.sm }}>
          {uscNotes ||
            (couple
              ? "Each person's own gross. A couple is never treated as one earner for USC."
              : 'Worked out on your gross pay — pension contributions do not reduce it.')}
        </Note>
      </CollapsibleCard>

      <CollapsibleCard title={couple ? '7. PRSI — each person separately' : '7. PRSI'} summary={formatEuro(h.prsi)}>
        {columns}
        <Figures title="Weekly gross pay" couple={couple} you={r.you.weeklyGross} partner={r.partner.weeklyGross} format={(v) => formatEuro(v, 2)} total={false} />
        <Figures
          title="PRSI credit for the year"
          couple={couple} you={r.you.prsiCredit} partner={r.partner.prsiCredit}
          note="Tapered credit for low weekly earnings"
        />
        <Figures title="PRSI payable" couple={couple} you={r.you.prsi} partner={r.partner.prsi} variant="subtotal" />
      </CollapsibleCard>

      <Card title="8. What lands in your accounts">
        <Row first label="Total gross pay" value={formatEuro(h.gross)} />
        <Row label="Income tax" value={formatEuro(-h.incomeTax)} variant="indent" />
        <Row label="USC" value={formatEuro(-h.usc)} variant="indent" />
        <Row label="PRSI" value={formatEuro(-h.prsi)} variant="indent" />
        <Row label="Your pension contributions" value={formatEuro(-h.contribution)} variant="indent" />
        <Row label="Total deductions" value={formatEuro(h.totalDeductions)} variant="subtotal" />
        <Row label="Household net take-home pay" value={formatEuro(h.netAnnual)} variant="headline" />
        <Row label="Per month" value={formatEuro(h.netMonthly)} variant="headline" />
      </Card>

      <CollapsibleCard title="9. How it stacks up" summary={`${formatPercent(h.effectiveTaxRate)} effective`} initiallyOpen>
        <Row
          first
          label="Effective tax rate on household gross"
          value={formatPercent(h.effectiveTaxRate)}
          note="Income tax + USC + PRSI as a share of gross. Pensions are savings, not tax, so they are excluded."
        />
        {columns}
        <Figures
          title="Marginal rate on the next €1,000"
          couple={couple} you={r.you.marginalRate} partner={r.partner.marginalRate}
          format={(v) => formatPercent(v)}
          total={false}
          note={
            couple
              ? 'Differs between you because USC depends on each person’s own income. The one with the lower marginal rate is the cheaper place for extra hours.'
              : 'Income tax + USC + PRSI on your next euro of pay'
          }
        />
        <Row label="Income tax with no pension contributions" value={formatEuro(h.incomeTaxWithoutPension)} />
        <Row label="Tax relief your pension contributions earn" value={formatEuro(h.pensionTaxRelief)} />
        <Row label="Real cost of the pensions after relief" value={formatEuro(h.pensionRealCost)} />
        <Row
          label="Each €100 into a pension really costs"
          value={formatEuro(h.pensionCostPer100, 2)}
          variant="subtotal"
          note="Only income tax relief — USC and PRSI are charged on the full amount"
        />
      </CollapsibleCard>

      <Disclaimer year={year} />
    </ScreenScroll>
  );
}

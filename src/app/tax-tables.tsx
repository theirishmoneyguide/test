import { Text, View } from 'react-native';

import { RotateCcw } from '@/components/icons';
import { AmountField, InputRow } from '@/components/inputs';
import { Button, Card, Disclaimer, Note, ScreenScroll, SubHeading } from '@/components/ui';
import {
  STATUS_LABELS,
  STATUS_NOTES,
  TAX_STATUSES,
  TAX_TABLE_SOURCES,
  cloneTaxTables,
  pensionAgeBandLabel,
  type TaxTables,
} from '@/engine';
import { usePlannerData, usePlannerStore } from '@/store/plannerStore';
import { space, themedStyles } from '@/theme/styles';
import { confirmAction } from '@/utils/dialogs';

const useStyles = themedStyles((c) => ({
  source: { fontSize: 13, lineHeight: 19, color: c.textMuted, marginTop: 6 },
}));

export default function TaxTablesScreen() {
  const styles = useStyles();
  const tables = usePlannerData().taxTables;
  const setTables = usePlannerStore((s) => s.setTaxTables);
  const reset = usePlannerStore((s) => s.resetTaxTables);

  /** Apply an edit to a copy, so the stored tables are never mutated in place. */
  const edit = (change: (draft: TaxTables) => void) => {
    const draft = cloneTaxTables(tables);
    change(draft);
    setTables(draft);
  };
  const euro = (label: string, value: number, apply: (t: TaxTables, v: number) => void, note?: string, first?: boolean) => (
    <InputRow label={label} note={note} first={first}>
      <AmountField value={value} onChange={(v) => edit((t) => apply(t, v ?? 0))} accessibilityLabel={label} />
    </InputRow>
  );
  const pct = (label: string, value: number, apply: (t: TaxTables, v: number) => void, note?: string, first?: boolean) => (
    <InputRow label={label} note={note} first={first}>
      <AmountField
        kind="percent"
        decimals={2}
        value={value}
        onChange={(v) => edit((t) => apply(t, v ?? 0))}
        accessibilityLabel={label}
      />
    </InputRow>
  );

  const usc = tables.usc.bands;

  return (
    <ScreenScroll>
      <Note>
        Every figure below is a rule the calculations read from. If Revenue changes one, change it
        here and the whole planner follows.
      </Note>

      <Card title="Income tax — rates">
        {pct('Standard rate', tables.standardRate, (t, v) => (t.standardRate = v), 'Applies up to the standard rate cut-off point', true)}
        {pct('Higher rate', tables.higherRate, (t, v) => (t.higherRate = v), 'Applies above the cut-off point')}
      </Card>

      <Card title="Cut-off point and credits by status">
        {TAX_STATUSES.map((status) => (
          <View key={status}>
            <SubHeading>{STATUS_LABELS[status]}</SubHeading>
            <Note>{STATUS_NOTES[status]}</Note>
            {euro('Standard rate cut-off point', tables.statuses[status].srcop, (t, v) => (t.statuses[status].srcop = v))}
            {euro('Personal credit', tables.statuses[status].personalCredit, (t, v) => (t.statuses[status].personalCredit = v))}
            {euro('PAYE credit', tables.statuses[status].payeCredit, (t, v) => (t.statuses[status].payeCredit = v))}
          </View>
        ))}
        <SubHeading>Couples</SubHeading>
        {euro(
          'Max band transfer to the second earner',
          tables.maxBandTransfer,
          (t, v) => (t.maxBandTransfer = v),
          "Household band = married cut-off + the lower of this or the lower earner's income",
          true,
        )}
      </Card>

      <Card title="USC — charged on each person separately">
        {usc.map((band, i) => (
          <View key={i}>
            <SubHeading>{band.upTo === null ? `Band ${i + 1} (balance)` : `Band ${i + 1}`}</SubHeading>
            {band.upTo !== null
              ? euro('Upper limit', band.upTo, (t, v) => (t.usc.bands[i].upTo = v), undefined, true)
              : null}
            {pct('Rate', band.rate, (t, v) => (t.usc.bands[i].rate = v), undefined, band.upTo === null)}
          </View>
        ))}
        <SubHeading>Thresholds</SubHeading>
        {euro(
          'USC exemption — total income at or below',
          tables.usc.exemptionThreshold,
          (t, v) => (t.usc.exemptionThreshold = v),
          'Per person. Cross it by €1 and USC applies from the first euro.',
          true,
        )}
        {euro(
          'Reduced-rate income ceiling (medical card / 70+)',
          tables.usc.reducedRateCeiling,
          (t, v) => (t.usc.reducedRateCeiling = v),
          `Below this, the maximum USC rate is band 2's rate`,
        )}
      </Card>

      <Card title="PRSI — Class A employee, each person separately">
        {pct(
          'Rate applied to the whole year',
          tables.prsi.rate,
          (t, v) => (t.prsi.rate = v),
          'The rate in force from 1 October 2026. Rises another 0.1pp each October to 2028.',
          true,
        )}
        {pct(
          'Rate 1 January – 30 September',
          tables.prsi.rateEarlierInYear,
          (t, v) => (t.prsi.rateEarlierInYear = v),
          'Reference only — not used in the calculations',
        )}
        {euro('Weekly earnings exemption', tables.prsi.weeklyExemption, (t, v) => (t.prsi.weeklyExemption = v), 'Per person — at or below this, no employee PRSI')}
        {euro('Max weekly PRSI credit', tables.prsi.maxWeeklyCredit, (t, v) => (t.prsi.maxWeeklyCredit = v), 'Reduces by 1/6 of weekly earnings above the exemption')}
        {euro('Credit tapers to nil at weekly earnings of', tables.prsi.creditTaperEnds, (t, v) => (t.prsi.creditTaperEnds = v), 'Reference only')}
      </Card>

      <Card title="Pension — age-related relief limits">
        {tables.pension.ageBands.map((band, i) => (
          <View key={band.ageFrom}>
            {pct(
              pensionAgeBandLabel(tables.pension.ageBands, i),
              band.pct,
              (t, v) => (t.pension.ageBands[i].pct = v),
              undefined,
              i === 0,
            )}
          </View>
        ))}
        {euro(
          'Earnings cap for pension relief',
          tables.pension.earningsCap,
          (t, v) => (t.pension.earningsCap = v),
          'Each person separately — age % × the lower of their salary or this cap',
        )}
      </Card>

      <Card title="Sources">
        {TAX_TABLE_SOURCES.map((s) => (
          <Text key={s} style={styles.source}>
            • {s}
          </Text>
        ))}
      </Card>

      <Button
        title="Reset to the 2026 rates"
        icon={RotateCcw}
        variant="secondary"
        onPress={async () => {
          const ok = await confirmAction(
            'Reset the tax tables?',
            'Every rate, band and limit goes back to the published 2026 figures.',
            'Reset',
          );
          if (ok) reset();
        }}
      />
      <View style={{ height: space.sm }} />
      <Disclaimer year={tables.year} />
    </ScreenScroll>
  );
}

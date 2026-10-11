import { Text, View } from 'react-native';

import { Card, Note, ScreenScroll } from '@/components/ui';
import { radius, space, themedStyles } from '@/theme/styles';

const useStyles = themedStyles((c) => ({
  lead: { fontSize: 16, lineHeight: 23, color: c.text },
  step: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: c.brand,
    color: c.onBrand,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stepTitle: { fontSize: 15, fontWeight: '700', color: c.text },
  body: { fontSize: 14.5, lineHeight: 21, color: c.textMuted, marginTop: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  swatch: { width: 44, height: 26, borderRadius: radius.sm, borderWidth: 1 },
  topic: { paddingVertical: space.sm },
}));

const STEPS = [
  {
    title: 'Pay',
    body: "Fill in the pale blue fields for you — and your partner, if you're married or in a civil partnership. A single status works exactly like a one-person calculator.",
  },
  {
    title: 'Budget',
    body: 'Overwrite the example figures. Annual bills sit in the month they actually land, so January and July look different. Tap a line to set all twelve months at once.',
  },
  {
    title: 'Net worth',
    body: 'A household balance sheet. Fill in one month at the end of each month — "Copy last month\'s balances" gets you most of the way.',
  },
  {
    title: 'Dashboard & Summary',
    body: 'Where the combined salary goes, your savings rate, each of your marginal rates, and what really moved your net worth.',
  },
  {
    title: 'Tax tables',
    body: 'Every rate in one place, under More. Change a rule there and the whole planner follows.',
  },
];

const COUPLE_TOPICS = [
  {
    title: 'Income tax is joint',
    body: "Under joint assessment your incomes are added together and taxed against one combined rate band and one set of credits. The band is €53,000 plus the lower earner's income, capped at €35,000 of transfer, so €88,000 at most.",
  },
  {
    title: 'USC and PRSI are not',
    body: 'Both are always worked out on each person individually. Two people on €40,000 are not one person on €80,000 — adding them would push income into USC bands neither of you reaches. That is why the Pay tab keeps two columns.',
  },
  {
    title: 'Pension relief is per person',
    body: "The age-related limit applies to each of you against your own salary. One partner's unused room cannot be used by the other, which is worth knowing before you decide who increases their contribution.",
  },
  {
    title: 'Check your credit certs',
    body: 'Revenue splits your band and credits between your two payslips. The annual household total here is right either way, but the monthly split across your two payslips depends on how you have asked Revenue to divide it.',
  },
];

export default function GuideScreen() {
  const styles = useStyles();
  return (
    <ScreenScroll>
      <Text style={styles.lead}>
        Work out what the household actually takes home after income tax, USC, PRSI and pension
        contributions — then budget it, and watch what it does to your net worth.
      </Text>

      <Card title="How to use it">
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card title="Colour legend">
        <Legend styleKey="input" label="Your inputs. The only figures you need to change." />
        <Legend styleKey="subtotal" label="A subtotal." />
        <Legend styleKey="headline" label="A headline result." />
      </Card>

      <Card title="How a couple is actually taxed">
        {COUPLE_TOPICS.map((t) => (
          <View key={t.title} style={styles.topic}>
            <Text style={styles.stepTitle}>{t.title}</Text>
            <Text style={styles.body}>{t.body}</Text>
          </View>
        ))}
      </Card>

      <Note>
        A planning tool built on published 2026 rates, not tax advice. Confirm anything that
        matters against revenue.ie or a qualified adviser.
      </Note>
    </ScreenScroll>
  );
}

const useLegendStyles = themedStyles((c) => ({
  input: { backgroundColor: c.inputBg, borderColor: c.inputBorder },
  subtotal: { backgroundColor: c.subtotalBg, borderColor: c.border },
  headline: { backgroundColor: c.headlineBg, borderColor: c.headlineBg },
}));

function Legend({ styleKey, label }: { styleKey: 'input' | 'subtotal' | 'headline'; label: string }) {
  const styles = useStyles();
  const legend = useLegendStyles();
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, legend[styleKey]]} />
      <Text style={[styles.body, { flex: 1, marginTop: 0 }]}>{label}</Text>
    </View>
  );
}

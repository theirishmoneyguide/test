import { useRouter } from 'expo-router';
import { ChevronRight, Copy, Eraser } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AddButton } from '@/components/AddButton';
import { NetWorthLineChart } from '@/components/charts';
import { AmountField } from '@/components/inputs';
import { MonthPicker, type MonthSelection } from '@/components/MonthPicker';
import { Button, Card, Disclaimer, Note, Row, ScreenScroll } from '@/components/ui';
import { MONTHS, MONTHS_LONG, type NetWorthSectionId } from '@/engine';
import { usePlanner, usePlannerStore } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { radius, space, themedStyles } from '@/theme/styles';
import { confirmAction, defaultMonth } from '@/utils/dialogs';
import { formatEuro, formatNumber, formatPercent, formatSignedEuro } from '@/utils/format';

const ADD_LABELS: Record<NetWorthSectionId, string> = {
  cash: 'Add an account',
  investments: 'Add an investment',
  pensions: 'Add a pension',
  property: 'Add an asset',
  liabilities: 'Add a debt',
};

const ROLE_HINTS = {
  home: 'Counts towards equity in your home',
  mortgage: 'Counts against equity in your home',
} as const;

const useStyles = themedStyles((c) => ({
  hero: { backgroundColor: c.headlineBg, borderRadius: radius.lg, padding: space.lg, gap: 4 },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.headlineText,
  },
  heroValue: { fontSize: 34, fontWeight: '800', color: c.headlineText },
  heroSub: { fontSize: 14.5, color: c.headlineText },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  action: { flexGrow: 1, flexBasis: '45%' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
    minHeight: 52,
  },
  itemFirst: { borderTopWidth: 0 },
  itemName: { fontSize: 15, color: c.text },
  itemHint: { fontSize: 12.5, color: c.textMuted, marginTop: 1 },
  headerTotal: { fontSize: 15, fontWeight: '700', color: c.sectionText, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.6 },
}));

export default function NetWorthScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const { data, result } = usePlanner();
  const nw = result.netWorth;
  const setValue = usePlannerStore((s) => s.setNetWorthValue);
  const copyMonth = usePlannerStore((s) => s.copyNetWorthMonth);
  const clearMonth = usePlannerStore((s) => s.clearNetWorthMonth);
  const addItem = usePlannerStore((s) => s.addNetWorthItem);
  const [selection, setSelection] = useState<MonthSelection>(
    () => nw.latestRecorded ?? defaultMonth(data.taxTables.year),
  );

  const month = selection === 'year' ? 0 : selection;
  const recorded = nw.recorded[month];
  const previous = month === 0 ? -1 : nw.recorded.lastIndexOf(true, month - 1);
  const value = (series: (number | null)[]) => series[month];
  const euro = (v: number | null) => (v === null ? '—' : formatEuro(v));

  const copyPrevious = async () => {
    if (previous === -1) return;
    if (recorded) {
      const ok = await confirmAction(
        `Replace ${MONTHS_LONG[month]}?`,
        `Every balance for ${MONTHS_LONG[month]} will be replaced with ${MONTHS_LONG[previous]}'s.`,
        'Replace',
      );
      if (!ok) return;
    }
    copyMonth(previous, month);
  };

  const clear = async () => {
    const ok = await confirmAction(
      `Clear ${MONTHS_LONG[month]}?`,
      `Every balance recorded for ${MONTHS_LONG[month]} will be removed.`,
      'Clear',
    );
    if (ok) clearMonth(month);
  };

  const add = (section: NetWorthSectionId) => {
    const id = addItem(section, 'New item');
    router.push({ pathname: '/net-worth-item', params: { section, id, isNew: '1' } });
  };

  return (
    <ScreenScroll header={<MonthPicker value={month} onChange={setSelection} marked={nw.recorded} />}>
      <View style={styles.hero} accessible accessibilityRole="summary">
        <Text style={styles.heroLabel}>Net worth · end of {MONTHS_LONG[month]}</Text>
        <Text style={styles.heroValue}>{recorded ? euro(value(nw.netWorth)) : '—'}</Text>
        <Text style={styles.heroSub}>
          {!recorded
            ? previous === -1
              ? 'Nothing recorded yet. Fill in your balances below at the end of the month.'
              : `Nothing recorded for ${MONTHS_LONG[month]} yet.`
            : [
                value(nw.changeVsPrevious) === null
                  ? null
                  : `${formatSignedEuro(value(nw.changeVsPrevious) ?? 0)} on ${MONTHS[previous]}`,
                value(nw.changeSinceStart) === null || nw.firstRecorded === null
                  ? null
                  : `${formatSignedEuro(value(nw.changeSinceStart) ?? 0)} since ${MONTHS[nw.firstRecorded]}`,
              ]
                .filter(Boolean)
                .join(' · ') || 'Your first recorded month.'}
        </Text>
      </View>

      <View style={styles.actions}>
        {previous !== -1 ? (
          <View style={styles.action}>
            <Button
              title={`Copy ${MONTHS[previous]}'s balances`}
              icon={Copy}
              variant={recorded ? 'secondary' : 'primary'}
              onPress={copyPrevious}
              accessibilityHint={`Starts ${MONTHS_LONG[month]} from last recorded month, ready to adjust`}
            />
          </View>
        ) : null}
        {recorded ? (
          <View style={styles.action}>
            <Button title={`Clear ${MONTHS[month]}`} icon={Eraser} variant="secondary" onPress={clear} />
          </View>
        ) : null}
      </View>

      {nw.sections.map((section) => (
        <Card
          key={section.id}
          title={section.name}
          right={<Text style={styles.headerTotal}>{euro(value(section.total))}</Text>}
        >
          {section.items.map((item, i) => (
            <View key={item.id} style={[styles.item, i === 0 && styles.itemFirst]}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/net-worth-item', params: { section: section.id, id: item.id } })
                }
                style={({ pressed }) => [
                  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}. Edit all twelve months`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.role ? <Text style={styles.itemHint}>{ROLE_HINTS[item.role]}</Text> : null}
                </View>
                <ChevronRight size={16} color={colors.textFaint} />
              </Pressable>
              <AmountField
                size="compact"
                allowEmpty
                value={item.values[month]}
                onChange={(v) => setValue({ section: section.id, itemId: item.id }, month, v)}
                accessibilityLabel={`${item.name}, end of ${MONTHS_LONG[month]}`}
              />
            </View>
          ))}
          <AddButton title={ADD_LABELS[section.id]} onPress={() => add(section.id)} />
        </Card>
      ))}

      <Card title="Balance sheet">
        <Row first label="Total assets" value={euro(value(nw.totalAssets))} />
        <Row label="Total liabilities" value={euro(value(nw.totalLiabilities))} />
        <Row label="Net worth" value={euro(value(nw.netWorth))} variant="headline" />
      </Card>

      <Card title="What it tells you">
        <Row first label="Liquid assets (cash + investments)" value={euro(value(nw.liquidAssets))} />
        <Row
          label="Months of spending that covers"
          value={recorded ? formatNumber(value(nw.monthsCovered) ?? 0, 1) : '—'}
          note="Against the budget's average month, savings included"
        />
        <Row label="Net worth excluding your home" value={euro(value(nw.netWorthExHome))} />
        <Row label="Equity in your home" value={euro(value(nw.homeEquity))} />
        <Row
          label="Share of net worth locked in pensions"
          value={recorded ? formatPercent(value(nw.pensionShare) ?? 0) : '—'}
        />
      </Card>

      {nw.latestRecorded !== null ? (
        <Card title="Net worth through the year" subtitle="Tap a month to see its figures">
          <NetWorthLineChart values={nw.netWorth} initialMonth={recorded ? month : nw.latestRecorded} />
        </Card>
      ) : null}

      <Note>
        Use market value, not what you paid. For the house, be conservative — a number you could
        actually sell at. Pensions count in full even though you can’t touch them until 50 or 60,
        which is what the pension share line is there to remind you.
      </Note>
      <Disclaimer year={data.taxTables.year} />
    </ScreenScroll>
  );
}

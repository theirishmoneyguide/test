import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AddButton } from '@/components/AddButton';
import { AmountField } from '@/components/inputs';
import { MonthPicker, type MonthSelection } from '@/components/MonthPicker';
import { Card, Disclaimer, Note, Row, ScreenScroll } from '@/components/ui';
import { MONTHS, MONTHS_LONG, type LineTotals } from '@/engine';
import { usePlanner, usePlannerStore, type BudgetListId } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { space, themedStyles } from '@/theme/styles';
import { defaultMonth } from '@/utils/dialogs';
import { formatEuro, formatPercent } from '@/utils/format';

const useStyles = themedStyles((c) => ({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
    minHeight: 52,
  },
  lineFirst: { borderTopWidth: 0 },
  lineName: { fontSize: 15, color: c.text },
  lineHint: { fontSize: 12.5, color: c.textMuted, marginTop: 1 },
  figures: { alignItems: 'flex-end' },
  figure: { fontSize: 15, color: c.text, fontVariant: ['tabular-nums'] },
  figureMuted: { fontSize: 12.5, color: c.textMuted, fontVariant: ['tabular-nums'] },
  headerTotal: { fontSize: 15, fontWeight: '700', color: c.sectionText, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.6 },
}));

/** A short description of how a line falls across the year. */
function pattern(line: LineTotals): string {
  const first = line.amounts[0];
  if (line.yearTotal === 0) return 'Nothing budgeted';
  if (line.amounts.every((a) => a === first)) return 'Every month';
  const months = line.amounts.flatMap((a, m) => (a !== 0 ? [MONTHS[m]] : []));
  if (months.length <= 3) return `${formatEuro(line.yearTotal)} a year · ${months.join(', ')}`;
  return `${formatEuro(line.yearTotal)} a year`;
}

function LineRow({
  list,
  line,
  month,
  first,
  share,
}: {
  list: BudgetListId;
  line: LineTotals;
  month: number | null;
  first?: boolean;
  share: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const setAmount = usePlannerStore((s) => s.setBudgetAmount);
  const open = () => router.push({ pathname: '/budget-line', params: { list, id: line.id } });

  return (
    <View style={[styles.line, first && styles.lineFirst]}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${line.name}. Edit all twelve months`}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.lineName}>{line.name}</Text>
          <Text style={styles.lineHint}>{pattern(line)}</Text>
        </View>
        {month === null ? null : <ChevronRight size={16} color={colors.textFaint} />}
      </Pressable>
      {month === null ? (
        <Pressable onPress={open} style={styles.figures} accessibilityRole="button">
          <Text style={styles.figure}>{formatEuro(line.yearTotal)}</Text>
          <Text style={styles.figureMuted}>
            {formatEuro(line.monthlyAvg)}/mo{share > 0 ? ` · ${formatPercent(share)}` : ''}
          </Text>
        </Pressable>
      ) : (
        <AmountField
          size="compact"
          value={line.amounts[month]}
          onChange={(v) => setAmount({ list, lineId: line.id }, month, v ?? 0)}
          accessibilityLabel={`${line.name}, ${MONTHS_LONG[month]}`}
        />
      )}
    </View>
  );
}

export default function BudgetScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const { data, result } = usePlanner();
  const addLine = usePlannerStore((s) => s.addBudgetLine);
  const [selection, setSelection] = useState<MonthSelection>(() => defaultMonth(data.taxTables.year));

  const b = result.budget;
  const month = selection === 'year' ? null : selection;
  const pick = (monthly: number[], year: number) => (month === null ? year : monthly[month]);
  const share = (amount: number) => (b.moneyInYear === 0 ? 0 : amount / b.moneyInYear);
  const leftOver = pick(b.leftOver, b.leftOverYear);

  const add = (list: BudgetListId) => {
    const id = addLine(list, list === 'income' ? 'New income' : 'New item');
    router.push({ pathname: '/budget-line', params: { list, id, isNew: '1' } });
  };

  return (
    <ScreenScroll
      header={<MonthPicker value={selection} onChange={setSelection} includeYear />}
    >
      <Card title={month === null ? 'The year at a glance' : MONTHS_LONG[month]}>
        <Row first label="Money in" value={formatEuro(pick(b.moneyIn, b.moneyInYear))} />
        <Row
          label="Money out"
          value={formatEuro(pick(b.moneyOut, b.moneyOutYear))}
          note={month === null ? `${formatPercent(b.moneyOutShare)} of money in` : undefined}
        />
        <Row
          label="Left over / (shortfall)"
          value={formatEuro(leftOver)}
          variant="headline"
          valueStyle={leftOver < 0 ? { color: colors.negative } : undefined}
        />
        {month === null ? (
          <Row label="Monthly average left over" value={formatEuro(b.leftOverAvg)} />
        ) : (
          <Row
            label="Running balance through the year"
            value={formatEuro(b.runningBalance[month])}
            valueStyle={b.runningBalance[month] < 0 ? { color: colors.negative } : undefined}
          />
        )}
      </Card>

      <Card
        title="Money in"
        right={<Text style={styles.headerTotal}>{formatEuro(pick(b.moneyIn, b.moneyInYear))}</Text>}
      >
        <Pressable
          onPress={() => router.navigate('/pay')}
          style={({ pressed }) => [styles.line, styles.lineFirst, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityHint="Opens the take-home pay calculator"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.lineName}>
              Net take-home pay{result.pay.hasPartner ? ' (both of you)' : ''}
            </Text>
            <Text style={styles.lineHint}>From the take-home pay calculator</Text>
          </View>
          <Text style={styles.figure}>{formatEuro(pick(b.netPay, b.netPayYear))}</Text>
          <ChevronRight size={16} color={colors.textFaint} />
        </Pressable>
        {b.otherIncome.map((line) => (
          <LineRow key={line.id} list="income" line={line} month={month} share={share(line.yearTotal)} />
        ))}
        <AddButton title="Add income" onPress={() => add('income')} />
      </Card>

      {b.groups.map((group) => (
        <Card
          key={group.id}
          title={group.name}
          subtitle={
            month === null
              ? `${formatEuro(group.monthlyAvg)} a month · ${formatPercent(group.shareOfMoneyIn)} of money in`
              : undefined
          }
          right={<Text style={styles.headerTotal}>{formatEuro(pick(group.monthly, group.yearTotal))}</Text>}
        >
          {group.lines.map((line, i) => (
            <LineRow
              key={line.id}
              list={group.id}
              line={line}
              month={month}
              first={i === 0}
              share={share(line.yearTotal)}
            />
          ))}
          <AddButton title="Add a line" onPress={() => add(group.id)} />
        </Card>
      ))}

      <Card title="Total money out">
        <Row first label={month === null ? 'For the year' : `In ${MONTHS_LONG[month]}`} value={formatEuro(pick(b.moneyOut, b.moneyOutYear))} variant="subtotal" />
        <Row label="Monthly average" value={formatEuro(b.moneyOutAvg)} />
        <Row label="Share of money in" value={formatPercent(b.moneyOutShare)} />
      </Card>

      <Note>
        Both pension contributions are already deducted before net take-home pay, so do not enter
        them again here. The sinking fund line is an alternative to entering annual bills in their
        own month — use one or the other, not both.
      </Note>
      <Disclaimer year={data.taxTables.year} />
    </ScreenScroll>
  );
}

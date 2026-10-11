import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AmountField } from '@/components/inputs';
import { Button, Card, Note, Row, ScreenScroll } from '@/components/ui';
import { BUDGET_GROUPS, MONTHS, MONTHS_LONG, everyMonth, sum, type GroupId } from '@/engine';
import { usePlannerData, usePlannerStore, type BudgetListId } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { radius, space, themedStyles } from '@/theme/styles';
import { confirmAction } from '@/utils/dialogs';
import { formatEuro } from '@/utils/format';

const useStyles = themedStyles((c) => ({
  name: {
    fontSize: 17,
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    backgroundColor: c.surfaceAlt,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { flexBasis: '30%', flexGrow: 1, minWidth: 96, gap: 4 },
  cellLabel: { fontSize: 12.5, fontWeight: '700', color: c.textMuted },
  fillRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  done: { color: c.onBrand, fontSize: 16, fontWeight: '700', paddingHorizontal: 8 },
}));

function isList(value: string | undefined): value is BudgetListId {
  return value === 'income' || BUDGET_GROUPS.some((g) => g.id === (value as GroupId));
}

export default function BudgetLineScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ list?: string; id?: string; isNew?: string }>();
  const data = usePlannerData();
  const rename = usePlannerStore((s) => s.renameBudgetLine);
  const setAmount = usePlannerStore((s) => s.setBudgetAmount);
  const setAmounts = usePlannerStore((s) => s.setBudgetAmounts);
  const remove = usePlannerStore((s) => s.deleteBudgetLine);
  const [fill, setFill] = useState<number | null>(null);

  const list = isList(params.list) ? params.list : null;
  const lines = list === null ? [] : list === 'income' ? data.budget.otherIncome : data.budget.groups[list];
  const line = lines.find((l) => l.id === params.id);
  const groupName =
    list === 'income' ? 'Money in' : (BUDGET_GROUPS.find((g) => g.id === list)?.name ?? '');

  const header = (
    <Stack.Screen
      options={{
        title: groupName || 'Budget line',
        headerRight: () => (
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        ),
      }}
    />
  );

  if (!list || !line) {
    return (
      <ScreenScroll>
        {header}
        <Note>This line no longer exists.</Note>
      </ScreenScroll>
    );
  }

  const ref = { list, lineId: line.id };
  const total = sum(line.amounts);

  return (
    <ScreenScroll>
      {header}
      <Card title="Name">
        <TextInput
          style={styles.name}
          value={line.name}
          onChangeText={(text) => rename(ref, text)}
          autoFocus={params.isNew === '1'}
          selectTextOnFocus={params.isNew === '1'}
          placeholder="What is it?"
          placeholderTextColor={colors.textFaint}
          accessibilityLabel="Line name"
          returnKeyType="done"
        />
      </Card>

      <Card title="Same every month" subtitle="Fill all twelve months in one go">
        <View style={styles.fillRow}>
          <View style={{ flex: 1 }}>
            <AmountField
              size="fill"
              value={fill}
              allowEmpty
              onChange={setFill}
              accessibilityLabel="Amount for every month"
              placeholder="0"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Fill all months"
              variant="secondary"
              onPress={() => setAmounts(ref, everyMonth(fill ?? 0))}
            />
          </View>
        </View>
      </Card>

      <Card title="Month by month" subtitle="Put annual bills in the month they actually land">
        <View style={styles.grid}>
          {MONTHS.map((label, m) => (
            <View key={label} style={styles.cell}>
              <Text style={styles.cellLabel}>{label}</Text>
              <AmountField
                size="fill"
                value={line.amounts[m]}
                onChange={(v) => setAmount(ref, m, v ?? 0)}
                accessibilityLabel={`${line.name}, ${MONTHS_LONG[m]}`}
              />
            </View>
          ))}
        </View>
        <View style={{ height: space.md }} />
        <Row label="Year total" value={formatEuro(total)} variant="subtotal" />
        <Row label="Monthly average" value={formatEuro(total / 12)} />
      </Card>

      <Button
        title="Delete this line"
        variant="danger"
        icon={Trash2}
        onPress={async () => {
          const ok = await confirmAction(
            `Delete “${line.name || 'this line'}”?`,
            'Its amounts for all twelve months will be removed.',
            'Delete',
          );
          if (ok) {
            router.back();
            remove(ref);
          }
        }}
      />
    </ScreenScroll>
  );
}

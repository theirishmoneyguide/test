import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AmountField } from '@/components/inputs';
import { Button, Card, Note, Row, ScreenScroll } from '@/components/ui';
import { MONTHS, MONTHS_LONG, NET_WORTH_SECTIONS, type NetWorthSectionId } from '@/engine';
import { usePlannerData, usePlannerStore } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { radius, space, themedStyles } from '@/theme/styles';
import { confirmAction } from '@/utils/dialogs';
import { formatEuro, formatSignedEuro } from '@/utils/format';

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
  done: { color: c.onBrand, fontSize: 16, fontWeight: '700', paddingHorizontal: 8 },
}));

function isSection(value: string | undefined): value is NetWorthSectionId {
  return NET_WORTH_SECTIONS.some((s) => s.id === value);
}

export default function NetWorthItemScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string; id?: string; isNew?: string }>();
  const data = usePlannerData();
  const rename = usePlannerStore((s) => s.renameNetWorthItem);
  const setValue = usePlannerStore((s) => s.setNetWorthValue);
  const remove = usePlannerStore((s) => s.deleteNetWorthItem);

  const section = isSection(params.section) ? params.section : null;
  const meta = NET_WORTH_SECTIONS.find((s) => s.id === section);
  const item = section ? data.netWorth.sections[section].find((i) => i.id === params.id) : undefined;

  const header = (
    <Stack.Screen
      options={{
        title: meta?.name ?? 'Balance',
        headerRight: () => (
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        ),
      }}
    />
  );

  if (!section || !item) {
    return (
      <ScreenScroll>
        {header}
        <Note>This item no longer exists.</Note>
      </ScreenScroll>
    );
  }

  const ref = { section, itemId: item.id };
  const filled = item.values.flatMap((v, m) => (v === null ? [] : [{ m, v }]));
  const change = filled.length >= 2 ? filled[filled.length - 1].v - filled[0].v : null;

  return (
    <ScreenScroll>
      {header}
      <Card title="Name">
        <TextInput
          style={styles.name}
          value={item.name}
          onChangeText={(text) => rename(ref, text)}
          autoFocus={params.isNew === '1'}
          selectTextOnFocus={params.isNew === '1'}
          placeholder="What is it?"
          placeholderTextColor={colors.textFaint}
          accessibilityLabel="Item name"
          returnKeyType="done"
        />
        {item.role ? (
          <Note style={{ marginTop: space.sm }}>
            {item.role === 'home'
              ? 'This is your family home: it counts towards equity in your home and is left out of net worth excluding your home.'
              : 'This is the mortgage on your family home: it counts against equity in your home.'}
          </Note>
        ) : null}
      </Card>

      <Card
        title={meta?.kind === 'liability' ? 'Balance owed at the end of each month' : 'Value at the end of each month'}
        subtitle="Leave a month blank until you have the figure"
      >
        <View style={styles.grid}>
          {MONTHS.map((label, m) => (
            <View key={label} style={styles.cell}>
              <Text style={styles.cellLabel}>{label}</Text>
              <AmountField
                size="fill"
                allowEmpty
                value={item.values[m]}
                onChange={(v) => setValue(ref, m, v)}
                accessibilityLabel={`${item.name}, end of ${MONTHS_LONG[m]}`}
              />
            </View>
          ))}
        </View>
        <View style={{ height: space.md }} />
        <Row
          label={
            filled.length >= 2
              ? `Change, ${MONTHS[filled[0].m]} to ${MONTHS[filled[filled.length - 1].m]}`
              : 'Change over the year'
          }
          value={change === null ? '—' : formatSignedEuro(change)}
          variant="subtotal"
        />
        {filled.length > 0 ? (
          <Row label="Latest" value={formatEuro(filled[filled.length - 1].v)} />
        ) : null}
      </Card>

      {item.role ? null : (
        <Button
          title="Delete this item"
          variant="danger"
          icon={Trash2}
          onPress={async () => {
            const ok = await confirmAction(
              `Delete “${item.name || 'this item'}”?`,
              'Its balances for every month will be removed.',
              'Delete',
            );
            if (ok) {
              router.back();
              remove(ref);
            }
          }}
        />
      )}
    </ScreenScroll>
  );
}

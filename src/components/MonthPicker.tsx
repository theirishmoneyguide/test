import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { MONTHS, MONTHS_LONG } from '@/engine';
import { radius, space, themedStyles } from '@/theme/styles';

/** `'year'` shows whole-year totals instead of one month. */
export type MonthSelection = number | 'year';

const CHIP_WIDTH = 56;

const useStyles = themedStyles((c) => ({
  bar: {
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  content: { paddingHorizontal: space.md, paddingVertical: space.sm, gap: 6 },
  chip: {
    minWidth: CHIP_WIDTH - 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipSelected: { backgroundColor: c.brand, borderColor: c.brand },
  chipText: { fontSize: 14, color: c.text, fontWeight: '500' },
  chipTextSelected: { color: c.onBrand, fontWeight: '700' },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.textFaint,
  },
  dotSelected: { backgroundColor: c.onBrand },
}));

export function MonthPicker({
  value,
  onChange,
  includeYear = false,
  marked,
}: {
  value: MonthSelection;
  onChange: (value: MonthSelection) => void;
  includeYear?: boolean;
  /** Months to flag with a small dot, e.g. months with balances recorded. */
  marked?: boolean[];
}) {
  const styles = useStyles();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (typeof value === 'number') {
      const offset = (value + (includeYear ? 1 : 0)) * CHIP_WIDTH - CHIP_WIDTH * 2;
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
    }
    // Only on first layout; afterwards the user scrolls the strip themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options: MonthSelection[] = [
    ...(includeYear ? (['year'] as const) : []),
    ...MONTHS.map((_, i) => i),
  ];

  return (
    <View style={styles.bar}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        accessibilityRole="tablist"
      >
        {options.map((option) => {
          const selected = option === value;
          const label = option === 'year' ? 'Year' : MONTHS[option];
          const a11y = option === 'year' ? 'Whole year' : MONTHS_LONG[option];
          const isMarked = typeof option === 'number' && marked?.[option];
          return (
            <Pressable
              key={String(option)}
              onPress={() => onChange(option)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={a11y}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
              {isMarked ? <View style={[styles.dot, selected && styles.dotSelected]} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { useState, type ReactNode } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/theme/useColors';
import { radius, space, themedStyles } from '@/theme/styles';
import { formatNumber, parseAmount } from '@/utils/format';

const useStyles = themedStyles((c) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    minHeight: 44,
    width: 150,
  },
  fieldCompact: { width: 120, minHeight: 40, paddingHorizontal: 8 },
  fieldFill: { width: 'auto', alignSelf: 'stretch' },
  fieldFocused: { borderColor: c.inputText, borderWidth: 2, paddingHorizontal: 9 },
  affix: { fontSize: 15, color: c.inputText, fontVariant: ['tabular-nums'] },
  input: {
    flex: 1,
    fontSize: 16,
    color: c.inputText,
    textAlign: 'right',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
    // Let the input shrink to its box; web inputs otherwise keep an intrinsic width.
    minWidth: 0,
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  inputRowFirst: { borderTopWidth: 0 },
  inputLabel: { flex: 1, fontSize: 15, color: c.text },
  inputNote: { fontSize: 12.5, color: c.textMuted, marginTop: 2, lineHeight: 17 },
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  segment: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    minHeight: 40,
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: c.brand, borderColor: c.brand },
  segmentText: { fontSize: 14, color: c.text, fontWeight: '500' },
  segmentTextSelected: { color: c.onBrand, fontWeight: '700' },
  accessory: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: c.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  accessoryText: { fontSize: 16, fontWeight: '700', color: c.sectionText },
}));

/** iOS number pads have no return key; this bar above them closes the keyboard. */
const KEYBOARD_DONE_ID = 'amount-keyboard-done';

export function KeyboardDoneBar() {
  const styles = useStyles();
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={styles.accessory}>
        <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} accessibilityRole="button">
          <Text style={styles.accessoryText}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

export type AmountKind = 'euro' | 'percent' | 'integer';
export type FieldSize = 'regular' | 'compact' | 'fill';

export interface AmountFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  accessibilityLabel: string;
  kind?: AmountKind;
  /** When true an empty field means "not set" (`null`); otherwise it means 0. */
  allowEmpty?: boolean;
  placeholder?: string;
  /** Decimals shown when the field isn't being edited. */
  decimals?: number;
  min?: number;
  max?: number;
  /** `regular` sits beside a label, `compact` in a list row, `fill` takes its container's width. */
  size?: FieldSize;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

/**
 * A number field styled like the workbook's input cells: blue on pale blue.
 * Shows grouped figures at rest and plain digits while editing, and pushes
 * every keystroke through so results update live, like a spreadsheet.
 */
export function AmountField({
  value,
  onChange,
  accessibilityLabel,
  kind = 'euro',
  allowEmpty = false,
  placeholder,
  decimals,
  min = 0,
  max = kind === 'percent' ? 1 : Number.MAX_SAFE_INTEGER,
  size = 'regular',
  style,
  autoFocus,
}: AmountFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [draft, setDraft] = useState<string | null>(null);
  const focused = draft !== null;

  // Percentages are stored as fractions (0.07) but typed as whole numbers (7).
  // Trim binary noise: 0.07 × 100 is 7.000000000000001.
  const toDisplay = (v: number) => (kind === 'percent' ? Number((v * 100).toPrecision(12)) : v);
  const fromDisplay = (v: number) => (kind === 'percent' ? v / 100 : v);
  const shownDecimals = decimals ?? (kind === 'percent' ? 1 : 0);

  const restingText =
    value === null
      ? ''
      : kind === 'percent'
        ? formatNumber(toDisplay(value), Number.isInteger(toDisplay(value)) ? 0 : shownDecimals)
        : formatNumber(value, shownDecimals);

  const commit = (text: string) => {
    const parsed = parseAmount(text);
    if (parsed === null) {
      if (text.trim() === '') onChange(allowEmpty ? null : 0);
      return;
    }
    const v = fromDisplay(kind === 'integer' ? Math.round(parsed) : parsed);
    onChange(Math.min(max, Math.max(min, v)));
  };

  return (
    <View
      style={[
        styles.field,
        size === 'compact' && styles.fieldCompact,
        size === 'fill' && styles.fieldFill,
        focused && styles.fieldFocused,
        style,
      ]}
    >
      {kind === 'euro' ? <Text style={styles.affix}>€</Text> : null}
      <TextInput
        style={styles.input}
        value={focused ? draft : restingText}
        placeholder={placeholder ?? (allowEmpty ? '—' : '0')}
        placeholderTextColor={colors.textFaint}
        keyboardType={kind === 'integer' ? 'number-pad' : 'decimal-pad'}
        inputMode={kind === 'integer' ? 'numeric' : 'decimal'}
        returnKeyType="done"
        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_DONE_ID : undefined}
        selectTextOnFocus
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel}
        // Keep the text unchanged on focus so select-all survives; grouping commas parse fine.
        onFocus={() => setDraft(restingText)}
        onChangeText={(text) => {
          setDraft(text);
          commit(text);
        }}
        onBlur={() => setDraft(null)}
      />
      {kind === 'percent' ? <Text style={styles.affix}>%</Text> : null}
    </View>
  );
}

/** A labelled input on one line, with an optional note underneath the label. */
export function InputRow({
  label,
  note,
  first,
  children,
}: {
  label: string;
  note?: string;
  first?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.inputRow, first && styles.inputRowFirst]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.inputLabel}>{label}</Text>
        {note ? <Text style={styles.inputNote}>{note}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function ToggleRow({
  label,
  note,
  value,
  onChange,
  first,
}: {
  label: string;
  note?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  first?: boolean;
}) {
  const colors = useColors();
  return (
    <InputRow label={label} note={note} first={first}>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.brand, false: colors.border }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
      />
    </InputRow>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

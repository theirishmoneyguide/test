import { ChevronDown, ChevronRight, ChevronUp, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/theme/useColors';
import { maxContentWidth, radius, space, themedStyles } from '@/theme/styles';

const useStyles = themedStyles((c) => ({
  scroll: { flex: 1, backgroundColor: c.background },
  scrollContent: { padding: space.lg, paddingBottom: space.xxl * 2 },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: space.lg },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  cardBody: { paddingHorizontal: space.lg, paddingVertical: space.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: c.sectionBg,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: c.sectionText },
  cardSubtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  cardHeaderValue: {
    fontSize: 15,
    fontWeight: '700',
    color: c.sectionText,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: 9,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: c.border },
  rowLabel: { flex: 1, fontSize: 15, color: c.text },
  rowLabelIndent: { paddingLeft: space.md, color: c.textMuted },
  rowValue: { fontSize: 15, color: c.text, fontVariant: ['tabular-nums'], textAlign: 'right' },
  rowNote: { fontSize: 12.5, color: c.textMuted, marginTop: -4, paddingBottom: 8, lineHeight: 17 },
  subtotal: {
    backgroundColor: c.subtotalBg,
    marginHorizontal: -space.lg,
    paddingHorizontal: space.lg,
  },
  headline: {
    backgroundColor: c.headlineBg,
    marginHorizontal: -space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  bold: { fontWeight: '700' },
  headlineText: { color: c.headlineText, fontWeight: '700', fontSize: 16 },
  columnsHeader: { flexDirection: 'row', paddingTop: 4, paddingBottom: 6 },
  columnsHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: c.textMuted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnsRow: { paddingVertical: 8 },
  columnsLabel: { fontSize: 14, color: c.text, marginBottom: 4 },
  columnsValues: { flexDirection: 'row' },
  columnsCell: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  note: { fontSize: 13, lineHeight: 19, color: c.textMuted },
  disclaimer: { fontSize: 12, lineHeight: 17, color: c.textFaint, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: space.lg,
    minHeight: 48,
  },
  buttonPrimary: { backgroundColor: c.brand },
  buttonSecondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  buttonDanger: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.negative },
  buttonText: { fontSize: 15, fontWeight: '600' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  linkTitle: { fontSize: 15, color: c.text, fontWeight: '500' },
  linkSubtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  pressed: { opacity: 0.6 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: space.sm },
  tableHeader: { paddingTop: 2, paddingBottom: 6 },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: { width: 92, fontSize: 15, color: c.text, textAlign: 'right', fontVariant: ['tabular-nums'] },
  tableFirst: { flex: 1, textAlign: 'left' },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: space.md,
    marginBottom: 2,
  },
}));

/** The scrolling page every tab and screen sits in. */
export function ScreenScroll({
  children,
  header,
}: {
  children: ReactNode;
  /** Pinned above the scrolling content, e.g. a month picker. */
  header?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.scroll}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function Card({
  title,
  subtitle,
  right,
  children,
  style,
  bodyStyle,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children ? <View style={[styles.cardBody, bodyStyle]}>{children}</View> : null}
    </View>
  );
}

/** A card whose body can fold away, keeping its headline figure in view. */
export function CollapsibleCard({
  title,
  summary,
  initiallyOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  initiallyOpen?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState(initiallyOpen);
  const Icon = open ? ChevronUp : ChevronDown;
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${summary ? `, ${summary}` : ''}`}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        {summary ? <Text style={styles.cardHeaderValue}>{summary}</Text> : null}
        <Icon size={18} color={colors.sectionText} />
      </Pressable>
      {open ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
}

export type RowVariant = 'default' | 'subtotal' | 'headline' | 'indent';

/** A label and its figure — one line of the workbook. */
export function Row({
  label,
  value,
  note,
  variant = 'default',
  valueStyle,
  first,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  variant?: RowVariant;
  valueStyle?: StyleProp<TextStyle>;
  /** Drop the divider above the first row of a card. */
  first?: boolean;
}) {
  const styles = useStyles();
  const container = [
    styles.row,
    !first && variant !== 'headline' && variant !== 'subtotal' && styles.rowBorder,
    variant === 'subtotal' && styles.subtotal,
    variant === 'headline' && styles.headline,
  ];
  const labelStyle = [
    styles.rowLabel,
    variant === 'indent' && styles.rowLabelIndent,
    variant === 'subtotal' && styles.bold,
    variant === 'headline' && styles.headlineText,
  ];
  const valueStyles = [
    styles.rowValue,
    variant === 'subtotal' && styles.bold,
    variant === 'headline' && styles.headlineText,
    valueStyle,
  ];
  return (
    <View>
      <View style={container}>
        <Text style={labelStyle}>{label}</Text>
        {typeof value === 'string' ? <Text style={valueStyles}>{value}</Text> : value}
      </View>
      {note ? <Text style={styles.rowNote}>{note}</Text> : null}
    </View>
  );
}

/** Column titles for per-person figures: You · Partner · Household. */
export function ColumnsHeader({ columns }: { columns: string[] }) {
  const styles = useStyles();
  return (
    <View style={styles.columnsHeader}>
      {columns.map((c) => (
        <Text key={c} style={styles.columnsHeaderCell}>
          {c}
        </Text>
      ))}
    </View>
  );
}

/** A label above one figure per column. `null` leaves a column empty. */
export function ColumnsRow({
  label,
  values,
  note,
  variant = 'default',
}: {
  label: string;
  values: (string | null)[];
  note?: string;
  variant?: 'default' | 'subtotal' | 'headline';
}) {
  const styles = useStyles();
  const strong = variant !== 'default';
  return (
    <View
      style={[
        styles.columnsRow,
        variant === 'default' && styles.rowBorder,
        variant === 'subtotal' && styles.subtotal,
        variant === 'headline' && styles.headline,
      ]}
    >
      <Text style={[styles.columnsLabel, strong && styles.bold, variant === 'headline' && styles.headlineText]}>
        {label}
      </Text>
      <View style={styles.columnsValues}>
        {values.map((v, i) => (
          <Text
            key={i}
            style={[styles.columnsCell, strong && styles.bold, variant === 'headline' && styles.headlineText]}
          >
            {v ?? ''}
          </Text>
        ))}
      </View>
      {note ? <Text style={[styles.rowNote, { marginTop: 4, paddingBottom: 0 }]}>{note}</Text> : null}
    </View>
  );
}

export function Note({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const styles = useStyles();
  return <Text style={[styles.note, style]}>{children}</Text>;
}

export function Disclaimer({ year = 2026 }: { year?: number }) {
  const styles = useStyles();
  return (
    <Text style={styles.disclaimer}>
      Built on published {year} Irish rates. A planning tool, not tax advice.
    </Text>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
  accessibilityHint?: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  const textColor =
    variant === 'primary' ? colors.onBrand : variant === 'danger' ? colors.negative : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.pressed,
      ]}
    >
      {Icon ? <Icon size={18} color={textColor} /> : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

/** A tappable list row with an icon and a chevron, as in a settings menu. */
export function LinkRow({
  title,
  subtitle,
  icon: Icon,
  onPress,
  first,
  destructive,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onPress: () => void;
  first?: boolean;
  destructive?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.linkRow, !first && styles.rowBorder, pressed && styles.pressed]}
    >
      <Icon size={20} color={destructive ? colors.negative : colors.sectionText} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.linkTitle, destructive && { color: colors.negative }]}>{title}</Text>
        {subtitle ? <Text style={styles.linkSubtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  );
}

/** One row of a small table: a label column, then right-aligned figures. */
export function TableRow({
  cells,
  header,
  variant = 'default',
  first,
}: {
  cells: string[];
  header?: boolean;
  variant?: 'default' | 'subtotal';
  first?: boolean;
}) {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.tableRow,
        header && styles.tableHeader,
        !header && !first && variant === 'default' && styles.rowBorder,
        variant === 'subtotal' && styles.subtotal,
      ]}
      accessibilityRole={header ? 'header' : undefined}
    >
      {cells.map((cell, i) => (
        <Text
          key={i}
          style={[
            styles.tableCell,
            i === 0 && styles.tableFirst,
            header && styles.tableHeaderText,
            variant === 'subtotal' && styles.bold,
          ]}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

/** A small uppercase heading inside a card, e.g. "Partner". */
export function SubHeading({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <Text style={styles.subHeading}>{children}</Text>;
}

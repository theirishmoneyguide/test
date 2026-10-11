import { Text, View } from 'react-native';

import { radius, space, themedStyles } from '@/theme/styles';

const useStyles = themedStyles((c) => ({
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: space.md,
    gap: 2,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.textMuted,
  },
  value: { fontSize: 24, fontWeight: '700', color: c.text, marginTop: 2 },
  caption: { fontSize: 12.5, color: c.textMuted },
}));

/** A KPI: label, value, and what the value means. */
export function StatTile({
  label,
  value,
  caption,
  valueColor,
}: {
  label: string;
  value: string;
  caption: string;
  valueColor?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}, ${caption}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

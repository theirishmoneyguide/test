import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useColors } from '@/theme/useColors';
import { space, themedStyles } from '@/theme/styles';

export type HealthStatus = 'good' | 'warning' | 'critical' | 'info';

const ICONS: Record<HealthStatus, LucideIcon> = {
  good: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
  info: Info,
};

const useStyles = themedStyles((c) => ({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  border: { borderTopWidth: 1, borderTopColor: c.border },
  body: { flex: 1, gap: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  label: { fontSize: 15, fontWeight: '600', color: c.text },
  value: { fontSize: 15, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
  text: { fontSize: 13.5, lineHeight: 19, color: c.textMuted },
}));

/** One line of the health check: an icon and a verdict, never colour alone. */
export function HealthRow({
  label,
  value,
  text,
  status,
  first,
}: {
  label: string;
  value: string;
  text: string;
  status: HealthStatus;
  first?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const Icon = ICONS[status];
  const iconColor =
    status === 'good'
      ? colors.positive
      : status === 'warning'
        ? colors.warning
        : status === 'critical'
          ? colors.negative
          : colors.sectionText;
  return (
    <View style={[styles.row, !first && styles.border]} accessible accessibilityLabel={`${label}: ${value}. ${text}`}>
      <Icon size={20} color={iconColor} style={{ marginTop: 1 }} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

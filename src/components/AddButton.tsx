import { Plus } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { useColors } from '@/theme/useColors';
import { space, themedStyles } from '@/theme/styles';

const useStyles = themedStyles((c) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
    minHeight: 44,
  },
  text: { fontSize: 15, color: c.sectionText, fontWeight: '600' },
  pressed: { opacity: 0.6 },
}));

export function AddButton({ title, onPress }: { title: string; onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Plus size={18} color={colors.sectionText} />
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

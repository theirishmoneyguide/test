import { Stack, useRouter } from 'expo-router';
import { ClipboardPaste, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, Text, TextInput } from 'react-native';

import { Button, Card, Note, ScreenScroll } from '@/components/ui';
import { usePlannerData, usePlannerStore } from '@/store/plannerStore';
import { createBackup, parseBackup } from '@/store/sanitize';
import { useColors } from '@/theme/useColors';
import { radius, space, themedStyles } from '@/theme/styles';
import { confirmAction, showMessage } from '@/utils/dialogs';

const useStyles = themedStyles((c) => ({
  box: {
    minHeight: 140,
    maxHeight: 260,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.sm,
    padding: space.md,
    fontSize: 13,
    color: c.text,
    backgroundColor: c.surfaceAlt,
    textAlignVertical: 'top',
    marginBottom: space.md,
  },
  error: { fontSize: 13.5, color: c.negative, marginBottom: space.md },
  done: { color: c.onBrand, fontSize: 16, fontWeight: '700', paddingHorizontal: 8 },
}));

export default function BackupScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const data = usePlannerData();
  const replaceData = usePlannerStore((s) => s.replaceData);
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState<string | null>(null);

  const share = async () => {
    try {
      await Share.share({ title: 'Budget planner backup', message: createBackup(data) });
    } catch {
      showMessage('Could not share', 'Your device would not open the share sheet.');
    }
  };

  const restore = async () => {
    try {
      const restored = parseBackup(pasted);
      const ok = await confirmAction(
        'Restore this backup?',
        'Every figure in the planner will be replaced with the backup.',
        'Restore',
      );
      if (!ok) return;
      replaceData(restored);
      setError(null);
      router.back();
    } catch {
      setError("That text isn't a planner backup. Paste the whole backup, from the first { to the last }.");
    }
  };

  return (
    <ScreenScroll>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          ),
        }}
      />
      <Card title="Back up">
        <Note style={{ marginBottom: space.md }}>
          Your figures live on this device only. Share a backup to your notes, email or files so you
          can restore it on a new phone.
        </Note>
        <Button title="Share a backup" icon={Share2} onPress={share} />
      </Card>

      <Card title="Restore">
        <Note style={{ marginBottom: space.md }}>
          Paste a backup below. It replaces everything currently in the planner.
        </Note>
        <TextInput
          style={styles.box}
          multiline
          value={pasted}
          onChangeText={(t) => {
            setPasted(t);
            setError(null);
          }}
          placeholder='{"format":"irish-household-budget-planner", …}'
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Backup text"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Restore from backup"
          icon={ClipboardPaste}
          variant="secondary"
          onPress={restore}
        />
      </Card>
    </ScreenScroll>
  );
}

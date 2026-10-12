import { Modal, Text, View } from 'react-native';
import { create } from 'zustand';

import { Button } from '@/components/ui';
import { radius, space, themedStyles } from '@/theme/styles';

/**
 * In-app confirm and message dialogs for the web build. Browsers' own
 * confirm()/alert() are blocked in embedded previews and look out of place;
 * native builds keep using the platform's Alert.
 */
interface DialogRequest {
  title: string;
  message: string;
  /** Present for a confirmation (with Cancel); absent for a plain message (OK). */
  confirmLabel?: string;
  resolve: (confirmed: boolean) => void;
}

const useDialogStore = create<{ current: DialogRequest | null }>(() => ({ current: null }));

export function requestDialog(request: Omit<DialogRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.getState().current?.resolve(false);
    useDialogStore.setState({ current: { ...request, resolve } });
  });
}

const useStyles = themedStyles((c) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: c.text },
  message: { fontSize: 15, lineHeight: 21, color: c.textMuted },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  button: { flex: 1 },
}));

export function DialogHost() {
  const styles = useStyles();
  const current = useDialogStore((s) => s.current);
  if (!current) return null;

  const close = (confirmed: boolean) => {
    current.resolve(confirmed);
    useDialogStore.setState({ current: null });
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => close(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert" aria-modal>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.message}>{current.message}</Text>
          <View style={styles.buttons}>
            {current.confirmLabel ? (
              <View style={styles.button}>
                <Button title="Cancel" variant="secondary" onPress={() => close(false)} />
              </View>
            ) : null}
            <View style={styles.button}>
              <Button
                title={current.confirmLabel ?? 'OK'}
                variant={current.confirmLabel ? 'danger' : 'primary'}
                onPress={() => close(true)}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

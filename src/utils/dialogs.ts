import { Alert, Platform } from 'react-native';

import { requestDialog } from '@/components/DialogHost';

/** Ask before doing something that can't be undone. Resolves to true if confirmed. */
export function confirmAction(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') return requestDialog({ title, message, confirmLabel });
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function showMessage(title: string, message: string): void {
  if (Platform.OS === 'web') {
    void requestDialog({ title, message });
    return;
  }
  Alert.alert(title, message);
}

/** The month to open on: this month, or January when planning another year. */
export function defaultMonth(planYear: number): number {
  const now = new Date();
  return now.getFullYear() === planYear ? now.getMonth() : 0;
}

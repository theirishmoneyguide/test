import { Alert, Platform } from 'react-native';

/** Ask before doing something that can't be undone. Resolves to true if confirmed. */
export function confirmAction(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function showMessage(title: string, message: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** The month to open on: this month, or January when planning another year. */
export function defaultMonth(planYear: number): number {
  const now = new Date();
  return now.getFullYear() === planYear ? now.getMonth() : 0;
}

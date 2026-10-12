import { useSyncExternalStore } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';

/** On the web, a host page can force a theme with `data-theme` on <html>. */
function readHostTheme(): 'light' | 'dark' | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light' || theme === 'dark' ? theme : null;
}

function subscribeHostTheme(onChange: () => void): () => void {
  if (Platform.OS !== 'web' || typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function useIsDark(): boolean {
  const scheme = useColorScheme();
  const hostTheme = useSyncExternalStore(subscribeHostTheme, readHostTheme, () => null);
  return (hostTheme ?? scheme) === 'dark';
}

export function useColors(): Palette {
  return useIsDark() ? darkPalette : lightPalette;
}

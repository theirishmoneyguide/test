import { StyleSheet } from 'react-native';

import type { Palette } from './colors';
import { useColors } from './useColors';

/**
 * Builds a themed StyleSheet once per palette:
 *
 *   const useStyles = themedStyles((c) => ({ card: { backgroundColor: c.surface } }));
 *   const styles = useStyles();
 */
export function themedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: Palette) => T) {
  const cache = new WeakMap<Palette, T>();
  return function useStyles(): T {
    const colors = useColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const maxContentWidth = 720;

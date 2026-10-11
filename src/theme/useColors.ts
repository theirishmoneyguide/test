import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './colors';

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

export function useColors(): Palette {
  return useIsDark() ? darkPalette : lightPalette;
}

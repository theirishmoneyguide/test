/**
 * Colours carried over from the workbook: deep-green title bars, pale-green
 * section headers, blue-on-pale-blue input cells, lime subtotals and green
 * headline results. Chart colours are validated for colour-blind separation
 * and contrast in both modes.
 */
export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** The workbook's title-bar green. */
  brand: string;
  onBrand: string;
  /** Section headers, like "1. Who is in the household". */
  sectionBg: string;
  sectionText: string;
  /** "Blue on pale blue — your inputs." */
  inputBg: string;
  inputText: string;
  inputBorder: string;
  /** "Lime shading — a subtotal." */
  subtotalBg: string;
  /** "Green shading — a headline result." */
  headlineBg: string;
  headlineText: string;
  chipBg: string;
  chipText: string;
  positive: string;
  negative: string;
  warning: string;
  tabActive: string;
  tabInactive: string;
  /** Chart marks. Never used for text. */
  chart: {
    moneyIn: string;
    moneyOut: string;
    single: string;
    grid: string;
    axis: string;
  };
}

export const lightPalette: Palette = {
  background: '#F3F7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAF9',
  border: '#DCE7E2',
  text: '#2B3330',
  textMuted: '#5D6B66',
  textFaint: '#7A8782',
  brand: '#1F6349',
  onBrand: '#FFFFFF',
  sectionBg: '#E9F8F4',
  sectionText: '#1B5C43',
  inputBg: '#E8F6F9',
  inputText: '#1D6E8A',
  inputBorder: '#BFE1EA',
  subtotalBg: '#F0F7E1',
  headlineBg: '#B3DEC8',
  headlineText: '#163F30',
  chipBg: '#CBEEE5',
  chipText: '#163F30',
  positive: '#2E7D4F',
  negative: '#C0392B',
  warning: '#9A6200',
  tabActive: '#1F6349',
  tabInactive: '#7A8782',
  chart: {
    moneyIn: '#1baf7a',
    moneyOut: '#2a78d6',
    single: '#1baf7a',
    grid: '#E6ECE9',
    axis: '#C9D3CE',
  },
};

export const darkPalette: Palette = {
  background: '#0E1513',
  surface: '#17211D',
  surfaceAlt: '#1B2722',
  border: '#27362F',
  text: '#E4ECE8',
  textMuted: '#A3B3AC',
  textFaint: '#81918A',
  brand: '#1F6349',
  onBrand: '#FFFFFF',
  sectionBg: '#1A2E27',
  sectionText: '#8EDBBE',
  inputBg: '#12303A',
  inputText: '#8FD3EA',
  inputBorder: '#1F4A57',
  subtotalBg: '#212B17',
  headlineBg: '#1F4D3B',
  headlineText: '#D8F3E6',
  chipBg: '#1E3B33',
  chipText: '#D8F3E6',
  positive: '#5CC28A',
  negative: '#F0786A',
  warning: '#E3A73B',
  tabActive: '#7DD3B0',
  tabInactive: '#81918A',
  chart: {
    moneyIn: '#199e70',
    moneyOut: '#3987e5',
    single: '#199e70',
    grid: '#24322C',
    axis: '#33433C',
  },
};

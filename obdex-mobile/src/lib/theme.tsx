import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useStore } from './store';

export const brand = {
  orange: '#FF4900',
  orangeSoft: '#FF7A3D',
  white: '#FFFFFF',
};

const dark = {
  bg: '#1C1C1C',
  bgRaised: '#252525',
  card: '#263238', // slate tiles (HPI, checklist, Bronze plan)
  row: '#434343', // My Garage row
  table: '#000000', // vehicle details table
  field: 'transparent',
  fieldBorder: '#EDEDED',
  iconBox: 'rgba(255,73,0,0.18)',
  text: '#FFFFFF',
  textMuted: '#B9B9B9',
  line: '#3A3A3A',
  decor: 'rgba(255,255,255,0.035)',
  good: '#3CCF7F',
  warn: '#F5B03A',
  bad: '#FF5A6E',
  onAccent: '#FFFFFF',
};

const light: typeof dark = {
  bg: '#F6F4F2',
  bgRaised: '#FFFFFF',
  card: '#263238',
  row: '#E7E3DF',
  table: '#FFFFFF',
  field: '#FFFFFF',
  fieldBorder: '#1C1C1C',
  iconBox: 'rgba(255,73,0,0.12)',
  text: '#1C1C1C',
  textMuted: '#6A645E',
  line: '#E0DBD6',
  decor: 'rgba(0,0,0,0.03)',
  good: '#12804A',
  warn: '#A15F00',
  bad: '#C8233F',
  onAccent: '#FFFFFF',
};

export type Palette = typeof dark;

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

const ThemeContext = createContext<Palette>(dark);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { state } = useStore();
  const pref = state.theme === 'system' ? (system === 'light' ? 'light' : 'dark') : state.theme;
  return <ThemeContext.Provider value={pref === 'light' ? light : dark}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function isLight(p: Palette) {
  return p.bg === light.bg;
}

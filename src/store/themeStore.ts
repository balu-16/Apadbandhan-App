import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ThemeMode) => void;
  toggleTheme: () => void;
  loadStoredTheme: () => Promise<void>;
  isSystem: boolean;
}

const getEffectiveColorScheme = (mode: ThemeMode): ColorSchemeName => {
  if (mode === 'system') {
    return Appearance.getColorScheme() || 'light';
  }
  return mode;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',
  colorScheme: Appearance.getColorScheme() || 'light',
  isSystem: true,

  setColorScheme: async (mode: ThemeMode) => {
    const effectiveScheme = getEffectiveColorScheme(mode);
    set({
      themeMode: mode,
      colorScheme: effectiveScheme,
      isSystem: mode === 'system'
    });
    try {
      await AsyncStorage.setItem('theme', mode);
    } catch {
      // Silently handle storage errors
    }
  },

  toggleTheme: () => {
    const current = get().colorScheme;
    const newScheme = current === 'dark' ? 'light' : 'dark';
    get().setColorScheme(newScheme);
  },

  loadStoredTheme: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        const mode = storedTheme as ThemeMode;
        const effectiveScheme = getEffectiveColorScheme(mode);
        set({
          themeMode: mode,
          colorScheme: effectiveScheme,
          isSystem: mode === 'system'
        });
      }
    } catch {
      // Silently handle storage errors
    }
  },
}));

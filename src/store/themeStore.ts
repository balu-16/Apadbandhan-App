import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

interface ThemeState {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
  toggleTheme: () => void;
  loadStoredTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: Appearance.getColorScheme() || 'light',

  setColorScheme: async (scheme: ColorSchemeName) => {
    set({ colorScheme: scheme });
    try {
      await AsyncStorage.setItem('theme', scheme || 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
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
        set({ colorScheme: storedTheme as ColorSchemeName });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },
}));

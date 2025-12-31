import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

export const useTheme = () => {
  const { colorScheme, themeMode, toggleTheme, setColorScheme, isSystem } = useThemeStore();
  const colors = Colors[colorScheme || 'light'];

  return {
    colors,
    colorScheme,
    themeMode,
    toggleTheme,
    setColorScheme,
    isDark: colorScheme === 'dark',
    isSystem,
  };
};

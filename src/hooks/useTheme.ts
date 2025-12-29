import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

export const useTheme = () => {
  const { colorScheme, toggleTheme, setColorScheme } = useThemeStore();
  const colors = Colors[colorScheme || 'light'];

  return {
    colors,
    colorScheme,
    toggleTheme,
    setColorScheme,
    isDark: colorScheme === 'dark',
  };
};

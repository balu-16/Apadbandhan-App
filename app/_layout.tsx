import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { AlertProvider } from '../src/hooks/useAlert';

export default function RootLayout() {
  const { loadStoredAuth } = useAuthStore();
  const { loadStoredTheme, colorScheme } = useThemeStore();

  useEffect(() => {
    loadStoredAuth();
    loadStoredTheme();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(superadmin)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(admin)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(police)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(hospital)" options={{ animation: 'fade' }} />
        </Stack>
      </AlertProvider>
    </GestureHandlerRootView>
  );
}

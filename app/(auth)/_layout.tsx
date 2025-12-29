import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { usePublicRoute } from '../../src/hooks/useProtectedRoute';

export default function AuthLayout() {
  const { colors } = useTheme();
  
  // Redirect authenticated users away from auth pages
  const { isLoading } = usePublicRoute();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}

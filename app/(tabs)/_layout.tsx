import { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../../src/hooks/useTheme';
import { useDeviceStore } from '../../src/store/deviceStore';
import { useAuthStore } from '../../src/store/authStore';
import { useProtectedRoute } from '../../src/hooks/useProtectedRoute';
import { FontSize, FontWeight } from '../../src/constants/theme';

const TAB_ROUTES = ['home', 'add-device', 'devices', 'settings'];
const SWIPE_THRESHOLD = 80;

export default function TabLayout() {
  const { colors } = useTheme();
  const { token, isAuthenticated, refreshProfile } = useAuthStore();
  const { fetchDevices } = useDeviceStore();
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  
  // Protect this route - only regular users can access
  const { isLoading } = useProtectedRoute({ requiredRole: 'user' });

  const getCurrentIndex = useCallback(() => {
    const currentRoute = pathname.split('/').pop() || '';
    return TAB_ROUTES.findIndex(route => route === currentRoute);
  }, [pathname]);

  const navigateToRoute = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    if (direction === 'left' && currentIndex < TAB_ROUTES.length - 1) {
      router.push(`/(tabs)/${TAB_ROUTES[currentIndex + 1]}` as any);
    } else if (direction === 'right' && currentIndex > 0) {
      router.push(`/(tabs)/${TAB_ROUTES[currentIndex - 1]}` as any);
    }
  }, [getCurrentIndex, router]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.value = Math.max(-40, Math.min(40, e.translationX * 0.2));
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -500) {
        runOnJS(navigateToRoute)('left');
      } else if (e.translationX > SWIPE_THRESHOLD || e.velocityX > 500) {
        runOnJS(navigateToRoute)('right');
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  useEffect(() => {
    // Request location permission and sync data when tabs load (user logged in)
    const initializeApp = async () => {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location access is needed to track your devices and send accurate emergency alerts. You can enable it later in Settings.',
          [{ text: 'OK' }]
        );
      }

      // Only fetch data if user is authenticated
      if (isAuthenticated && token) {
        // Sync user profile from backend
        await refreshProfile();

        // Sync devices from backend
        await fetchDevices();
      }
    };

    initializeApp();
  }, [isAuthenticated, token]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1f2937',
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarShowLabel: false,
            tabBarStyle: {
              position: 'absolute',
              bottom: 24,
              left: 20,
              right: 20,
              height: 70,
              backgroundColor: colors.surface,
              borderRadius: 35,
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 10,
              paddingHorizontal: 10,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#6366f115' : 'transparent' }}>
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={focused ? '#6366f1' : color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="add-device"
            options={{
              title: 'Add',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#6366f115' : 'transparent' }}>
                  <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={26} color={focused ? '#6366f1' : color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="devices"
            options={{
              title: 'Devices',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#6366f115' : 'transparent' }}>
                  <Ionicons name={focused ? 'phone-portrait' : 'phone-portrait-outline'} size={26} color={focused ? '#6366f1' : color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#6366f115' : 'transparent' }}>
                  <Ionicons name={focused ? 'settings' : 'settings-outline'} size={26} color={focused ? '#6366f1' : color} />
                </View>
              ),
            }}
          />
        </Tabs>
      </Animated.View>
    </GestureDetector>
  );
}

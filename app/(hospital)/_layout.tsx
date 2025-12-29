import { useEffect, useCallback } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useProtectedRoute } from '../../src/hooks/useProtectedRoute';

const TAB_ROUTES = ['dashboard', 'users', 'alerts', 'settings'];
const SWIPE_THRESHOLD = 80;

export default function HospitalTabLayout() {
  const { colors } = useTheme();
  const { refreshProfile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  
  // Protect this route - only hospital can access
  const { isLoading } = useProtectedRoute({ requiredRole: 'hospital' });

  const getCurrentIndex = useCallback(() => {
    const currentRoute = pathname.split('/').pop() || '';
    return TAB_ROUTES.findIndex(route => route === currentRoute);
  }, [pathname]);

  const navigateToRoute = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    if (direction === 'left' && currentIndex < TAB_ROUTES.length - 1) {
      router.push(`/(hospital)/${TAB_ROUTES[currentIndex + 1]}` as any);
    } else if (direction === 'right' && currentIndex > 0) {
      router.push(`/(hospital)/${TAB_ROUTES[currentIndex - 1]}` as any);
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
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  useEffect(() => {
    const initializeApp = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location access helps respond to medical emergencies.');
      }
      await refreshProfile();
    };
    initializeApp();
  }, []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#ef4444',
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
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#ef444415' : 'transparent' }}>
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={focused ? '#ef4444' : color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              title: 'Users',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#ef444415' : 'transparent' }}>
                  <Ionicons name={focused ? 'people' : 'people-outline'} size={26} color={focused ? '#ef4444' : color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="alerts"
            options={{
              title: 'Emergencies',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#ef444415' : 'transparent' }}>
                  <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={26} color={focused ? '#ef4444' : color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: 25, backgroundColor: focused ? '#ef444415' : 'transparent' }}>
                  <Ionicons name={focused ? 'settings' : 'settings-outline'} size={26} color={focused ? '#ef4444' : color} />
                </View>
              ),
            }}
          />
        </Tabs>
      </Animated.View>
    </GestureDetector>
  );
}

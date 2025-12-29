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
import { FontSize, FontWeight } from '../../src/constants/theme';

const TAB_ROUTES = ['dashboard', 'users', 'admins', 'police', 'hospitals', 'devices', 'alerts', 'settings'];
const SWIPE_THRESHOLD = 80;

export default function SuperAdminTabLayout() {
  const { colors } = useTheme();
  const { refreshProfile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  
  // Protect this route - only superadmin can access
  const { isLoading } = useProtectedRoute({ requiredRole: 'superadmin' });

  const getCurrentIndex = useCallback(() => {
    const currentRoute = pathname.split('/').pop() || '';
    return TAB_ROUTES.findIndex(route => route === currentRoute);
  }, [pathname]);

  const navigateToRoute = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    if (direction === 'left' && currentIndex < TAB_ROUTES.length - 1) {
      router.push(`/(superadmin)/${TAB_ROUTES[currentIndex + 1]}` as any);
    } else if (direction === 'right' && currentIndex > 0) {
      router.push(`/(superadmin)/${TAB_ROUTES[currentIndex - 1]}` as any);
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
    const initializeApp = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location access helps with emergency tracking.');
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
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarShowLabel: true,
            tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginTop: -4 },
            tabBarStyle: {
              position: 'absolute',
              bottom: 16,
              left: 12,
              right: 12,
              height: 70,
              backgroundColor: colors.surface,
              borderRadius: 30,
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 10,
              paddingBottom: 8,
              paddingTop: 8,
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              title: 'Users',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="admins"
            options={{
              title: 'Admins',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="police"
            options={{
              title: 'Police',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'body' : 'body-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="hospitals"
            options={{
              title: 'Hospital',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'medical' : 'medical-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="devices"
            options={{
              title: 'Devices',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'hardware-chip' : 'hardware-chip-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="alerts"
            options={{
              title: 'Alerts',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'warning' : 'warning-outline'} size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />,
            }}
          />
        </Tabs>
      </Animated.View>
    </GestureDetector>
  );
}

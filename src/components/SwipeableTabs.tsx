import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS 
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 500;

// Route configurations for different tab groups
export const TAB_ROUTES = {
  superadmin: ['dashboard', 'users', 'admins', 'police', 'hospitals', 'devices', 'alerts', 'settings'],
  admin: ['dashboard', 'users', 'devices', 'alerts', 'settings'],
  police: ['dashboard', 'users', 'alerts', 'settings'],
  hospital: ['dashboard', 'users', 'alerts', 'settings'],
  tabs: ['home', 'add-device', 'devices', 'settings'],
};

interface SwipeableTabsProps {
  children: ReactNode;
  routes: string[];
  baseRoute: string;
}

/**
 * SwipeableTabs - Wrapper component that enables horizontal swipe navigation between tabs
 * 
 * @param children - The tab content to render
 * @param routes - Array of route names in order (e.g., ['dashboard', 'users', 'devices'])
 * @param baseRoute - The base route path (e.g., '/(superadmin)')
 */
export function SwipeableTabs({ children, routes, baseRoute }: SwipeableTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);

  // Get current route index
  const getCurrentIndex = () => {
    const currentRoute = pathname.split('/').pop() || '';
    return routes.findIndex(route => route === currentRoute);
  };

  const navigateToRoute = (direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    
    if (direction === 'left' && currentIndex < routes.length - 1) {
      // Swipe left - go to next page (right)
      const nextRoute = routes[currentIndex + 1];
      router.push(`${baseRoute}/${nextRoute}` as any);
    } else if (direction === 'right' && currentIndex > 0) {
      // Swipe right - go to previous page (left)
      const prevRoute = routes[currentIndex - 1];
      router.push(`${baseRoute}/${prevRoute}` as any);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      translateX.value = Math.max(-50, Math.min(50, event.translationX * 0.25));
    })
    .onEnd((event) => {
      const { translationX: tx, velocityX } = event;
      
      if (tx < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        runOnJS(navigateToRoute)('left');
      } else if (tx > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        runOnJS(navigateToRoute)('right');
      }
      
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeableTabs;

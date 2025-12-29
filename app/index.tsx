import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '../src/store/authStore';
import { FontSize, FontWeight } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const getRouteForRole = (role: string) => {
    switch (role) {
      case 'superadmin':
        return '/(superadmin)/dashboard';
      case 'admin':
        return '/(admin)/dashboard';
      case 'police':
        return '/(police)/dashboard';
      case 'hospital':
        return '/(hospital)/dashboard';
      default:
        return '/(tabs)/home';
    }
  };

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 500 });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated && user) {
          router.replace(getRouteForRole(user.role) as any);
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, user]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6467f2', '#4f52d1']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logoBackground}>
          <View style={styles.logoInner}>
            <Ionicons name="shield-checkmark" size={64} color="#ffffff" />
          </View>
        </View>
      </Animated.View>
      <Animated.View style={textAnimatedStyle}>
        <Text style={styles.title}>Apadbandhav</Text>
        <Text style={styles.tagline}>Your Emergency Companion</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBackground: {
    width: 128,
    height: 128,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6467f2',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },
  logoInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.9,
  },
  tagline: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
});

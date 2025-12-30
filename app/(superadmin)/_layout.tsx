import { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, TouchableWithoutFeedback, Image, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useProtectedRoute } from '../../src/hooks/useProtectedRoute';

interface NavItem {
  name: string;
  route: string;
  icon: string;
  iconFocused: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', route: 'dashboard', icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'Users', route: 'users', icon: 'people-outline', iconFocused: 'people' },
  { name: 'Admins', route: 'admins', icon: 'shield-outline', iconFocused: 'shield' },
  { name: 'Police', route: 'police', icon: 'body-outline', iconFocused: 'body' },
  { name: 'Hospitals', route: 'hospitals', icon: 'medical-outline', iconFocused: 'medical' },
  { name: 'Devices', route: 'devices', icon: 'hardware-chip-outline', iconFocused: 'hardware-chip' },
  { name: 'Requests', route: 'requests', icon: 'document-text-outline', iconFocused: 'document-text' },
  { name: 'Alerts', route: 'alerts', icon: 'warning-outline', iconFocused: 'warning' },
  { name: 'Settings', route: 'settings', icon: 'settings-outline', iconFocused: 'settings' },
];

const SIDEBAR_WIDTH = 260;

export default function SuperAdminLayout() {
  const { colors, isDark } = useTheme();
  const { user, refreshProfile, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  const [overlayAnim] = useState(new Animated.Value(0));
  
  const { isLoading } = useProtectedRoute({ requiredRole: 'superadmin' });

  const currentRoute = pathname.split('/').pop() || 'dashboard';

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

  const toggleSidebar = () => {
    if (sidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 200, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const handleNavPress = (route: string) => {
    closeSidebar();
    router.push(`/(superadmin)/${route}` as any);
  };

  const handleLogout = async () => {
    closeSidebar();
    await logout();
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'SA';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hamburger Menu Button */}
      <TouchableOpacity 
        style={[styles.hamburgerBtn, { top: insets.top + 10, backgroundColor: isDark ? '#1e293b' : '#ffffff', borderWidth: isDark ? 0 : 1, borderColor: '#e2e8f0' }]} 
        onPress={toggleSidebar}
        activeOpacity={0.8}
      >
        <Ionicons name="menu" size={24} color={isDark ? '#fff' : '#0f172a'} />
      </TouchableOpacity>

      {/* Overlay */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar */}
      <Animated.View style={[
        styles.sidebar, 
        { 
          backgroundColor: isDark ? '#0f1729' : '#ffffff', 
          paddingTop: insets.top + 10,
          transform: [{ translateX: slideAnim }]
        }
      ]}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar}>
          <Ionicons name="close" size={24} color={isDark ? 'rgba(255,255,255,0.8)' : '#64748b'} />
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={[styles.logoSection, { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' }]}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.sidebarLogo}
            resizeMode="contain"
          />
          <View style={styles.brandInfo}>
            <Text style={[styles.brandName, { color: isDark ? '#fff' : '#0f172a' }]}>APADBANDHAV</Text>
            <Text style={[styles.brandTagline, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }]}>Emergency Response</Text>
          </View>
        </View>

        {/* Profile Section */}
        <View style={[styles.profileSection, { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' }]}>
          {user?.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,102,0,0.15)' }]}>
              <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#ff6600' }]}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: isDark ? '#fff' : '#0f172a' }]} numberOfLines={1}>{user?.fullName || 'Super Admin'}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={10} color={isDark ? '#fbbf24' : '#ff6600'} />
              <Text style={[styles.roleText, { color: isDark ? '#fbbf24' : '#ff6600' }]}>Super Admin</Text>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.navItem, 
                  isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,102,0,0.12)' }
                ]}
                onPress={() => handleNavPress(item.route)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(isActive ? item.iconFocused : item.icon) as any}
                  size={20}
                  color={isActive ? (isDark ? '#fff' : '#ff6600') : (isDark ? 'rgba(255,255,255,0.7)' : '#64748b')}
                />
                <Text style={[
                  styles.navText, 
                  { color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' },
                  isActive && { color: isDark ? '#fff' : '#ff6600', fontWeight: '700' }
                ]}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e2e8f0' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={isDark ? 'rgba(255,255,255,0.7)' : '#64748b'} />
          <Text style={[styles.logoutText, { color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' }]}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }]}>v1.0.0</Text>
      </Animated.View>

      {/* Main Content */}
      <View style={[styles.mainContent, { paddingTop: insets.top }]}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hamburgerBtn: { position: 'absolute', left: 16, zIndex: 10, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 20 },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, paddingHorizontal: 16, paddingBottom: 20, zIndex: 30, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  closeBtn: { position: 'absolute', top: 16, right: 12, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 10 },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
  sidebarLogo: { width: 45, height: 45, borderRadius: 10 },
  brandInfo: { flex: 1 },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  brandTagline: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500', marginTop: 2 },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  roleText: { color: '#fbbf24', fontSize: 10, fontWeight: '600' },
  navScroll: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  navText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  navTextActive: { color: '#fff', fontWeight: '700' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 16 },
  logoutText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  version: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 12 },
  mainContent: { flex: 1 },
});

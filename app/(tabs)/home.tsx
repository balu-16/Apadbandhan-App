import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useDeviceStore } from '../../src/store/deviceStore';
import SOSButton from '../../src/components/SOSButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated, token } = useAuthStore();
  const { devices, fetchDevices } = useDeviceStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDevices();
    }
  }, [isAuthenticated, token]);

  const onRefresh = async () => {
    if (!isAuthenticated || !token) return;
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const fullName = user?.fullName || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const onlineDevices = devices.filter(d => d.status === 'online').length;

  const quickActions = [
    { icon: 'add-circle-outline', label: 'ADD DEVICE', route: '/(tabs)/add-device', color: '#6366f1' },
    { icon: 'location-outline', label: 'MAP VIEW', route: '/(tabs)/devices', color: '#10b981' },
    { icon: 'warning-outline', label: 'ALERTS', route: '/(tabs)/devices', color: '#ef4444' },
    { icon: 'time-outline', label: 'HISTORY', route: '/(tabs)/devices', color: '#f59e0b' },
  ];

  const getTimeAgo = (date?: string) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getDeviceIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('car') || lowerName.includes('vehicle')) return '🚗';
    if (lowerName.includes('watch')) return '⌚';
    if (lowerName.includes('pet') || lowerName.includes('dog') || lowerName.includes('cat')) return '🐕';
    if (lowerName.includes('bike') || lowerName.includes('cycle')) return '🚲';
    if (lowerName.includes('phone')) return '📱';
    if (lowerName.includes('bag') || lowerName.includes('backpack')) return '🎒';
    return '📍';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1e1b4b', '#312e81'] : ['#6366f1', '#8b5cf6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.welcomeText}>WELCOME BACK</Text>
                <Text style={styles.userName}>{fullName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <View style={styles.statIcon}>
                <Ionicons name="phone-portrait-outline" size={22} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{devices.length}</Text>
                <Text style={styles.statLabel}>Active Devices</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(16,185,129,0.3)' }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.5)' }]}>
                <Ionicons name="pulse-outline" size={22} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{onlineDevices}</Text>
                <Text style={styles.statLabel}>Online Now</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.quickActionsCard, { backgroundColor: colors.surface }]}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionItem}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon as any} size={26} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Devices</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/devices')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {devices.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No devices yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your first device to start tracking
            </Text>
            <TouchableOpacity
              style={styles.addDeviceBtn}
              onPress={() => router.push('/(tabs)/add-device')}
            >
              <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.addDeviceBtnGradient}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addDeviceBtnText}>Add Device</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          devices.slice(0, 5).map((device, index) => (
            <TouchableOpacity
              key={device._id || index}
              style={[styles.deviceCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(tabs)/devices')}
              activeOpacity={0.7}
            >
              <View style={styles.deviceIconContainer}>
                <Text style={styles.deviceEmoji}>{getDeviceIcon(device.name || '')}</Text>
              </View>
              <View style={styles.deviceInfo}>
                <Text style={[styles.deviceName, { color: colors.text }]}>
                  {device.name || 'Unnamed Device'}
                </Text>
                <View style={styles.deviceMeta}>
                  <Text style={[
                    styles.deviceStatus,
                    { color: device.status === 'online' ? '#10b981' : '#6b7280' }
                  ]}>
                    {device.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                  <Text style={[styles.deviceTime, { color: colors.textTertiary }]}>
                    • {getTimeAgo((device as any).updatedAt) || '2m ago'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating SOS Button */}
      <View style={styles.sosContainer}>
        <SOSButton size={70} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { gap: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  welcomeText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  userName: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 },
  notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, gap: 10 },
  statIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  statTextContainer: { flex: 1 },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 28 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  quickActionsCard: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  quickActionItem: { alignItems: 'center', gap: 8 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  viewAllText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 20, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  addDeviceBtn: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  addDeviceBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24 },
  addDeviceBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deviceCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  deviceIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  deviceEmoji: { fontSize: 24 },
  deviceInfo: { flex: 1, marginLeft: 14 },
  deviceName: { fontSize: 16, fontWeight: '600' },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  deviceStatus: { fontSize: 12, fontWeight: '700' },
  deviceTime: { fontSize: 12, fontWeight: '500' },
  sosContainer: { position: 'absolute', bottom: 100, right: 20, zIndex: 1000 },
});

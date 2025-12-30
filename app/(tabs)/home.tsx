import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useDeviceStore } from '../../src/store/deviceStore';
import SOSButton from '../../src/components/SOSButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  onPress?: () => void;
}

const StatCard = ({ icon, label, value, color, bgColor, onPress }: StatCardProps) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        </View>
        <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated, token } = useAuthStore();
  const { devices, fetchDevices } = useDeviceStore();
  const insets = useSafeAreaInsets();
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
  const firstName = fullName.split(' ')[0];
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.length - onlineDevices;

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={[styles.welcomeIcon, { backgroundColor: isDark ? 'rgba(255,102,0,0.2)' : 'rgba(255,102,0,0.15)' }]}>
            <Ionicons name="home" size={28} color={colors.primary} />
          </View>
          <View style={styles.welcomeText}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome, {firstName}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Track and manage your devices
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="hardware-chip"
            label="Total Devices"
            value={devices.length}
            color="#3b82f6"
            bgColor="rgba(59, 130, 246, 0.15)"
            onPress={() => router.push('/(tabs)/devices')}
          />
          <StatCard
            icon="pulse"
            label="Online"
            value={onlineDevices}
            color="#10b981"
            bgColor="rgba(16, 185, 129, 0.15)"
            onPress={() => router.push('/(tabs)/devices')}
          />
          <StatCard
            icon="cloud-offline"
            label="Offline"
            value={offlineDevices}
            color="#ef4444"
            bgColor="rgba(239, 68, 68, 0.15)"
            onPress={() => router.push('/(tabs)/devices')}
          />
          <StatCard
            icon="add-circle"
            label="Add New"
            value={0}
            color={colors.primary}
            bgColor={isDark ? 'rgba(255,122,26,0.2)' : 'rgba(255,102,0,0.15)'}
            onPress={() => router.push('/(tabs)/add-device')}
          />
        </View>

        {/* Your Devices Section */}
        <View style={[styles.devicesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.devicesHeader}>
            <View style={styles.devicesTitleRow}>
              <Ionicons name="hardware-chip" size={20} color={colors.primary} />
              <Text style={[styles.devicesTitle, { color: colors.text }]}>Your Devices</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/devices')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {devices.length === 0 ? (
            <View style={styles.emptyDevices}>
              <Ionicons name="hardware-chip-outline" size={48} color={colors.textTertiary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyDevicesText, { color: colors.textSecondary }]}>No devices yet</Text>
              <TouchableOpacity
                style={[styles.addDeviceBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/add-device')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addDeviceBtnText}>Add Device</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.devicesList}>
              {devices.slice(0, 5).map((device, index) => (
                <TouchableOpacity
                  key={device._id || index}
                  style={[styles.deviceItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                  onPress={() => router.push('/(tabs)/devices')}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceItemLeft}>
                    <View style={[styles.deviceIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }]}>
                      <Text style={styles.deviceEmoji}>{getDeviceIcon(device.name || '')}</Text>
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={[styles.deviceName, { color: colors.text }]}>
                        {device.name || 'Unnamed Device'}
                      </Text>
                      <View style={styles.deviceMeta}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: device.status === 'online' ? '#10b981' : '#6b7280' }
                        ]} />
                        <Text style={[styles.deviceStatus, { color: device.status === 'online' ? '#10b981' : colors.textTertiary }]}>
                          {device.status === 'online' ? 'Online' : 'Offline'}
                        </Text>
                        <Text style={[styles.deviceTime, { color: colors.textTertiary }]}>
                          • {getTimeAgo((device as any).updatedAt) || '2m ago'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 140 }} />
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  
  welcomeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  welcomeIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  welcomeText: { flex: 1 },
  welcomeTitle: { fontSize: 24, fontWeight: '700' },
  welcomeSubtitle: { fontSize: 13, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: (SCREEN_WIDTH - 44) / 2, borderRadius: 16, padding: 16, borderWidth: 1 },
  statCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '700' },
  statIconContainer: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  devicesCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  devicesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  devicesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devicesTitle: { fontSize: 18, fontWeight: '600' },
  viewAllText: { fontSize: 14, fontWeight: '600' },
  devicesList: { gap: 10 },
  deviceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12 },
  deviceItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  deviceIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  deviceEmoji: { fontSize: 22 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: '600' },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  deviceStatus: { fontSize: 12, fontWeight: '500' },
  deviceTime: { fontSize: 12, fontWeight: '500' },
  emptyDevices: { alignItems: 'center', paddingVertical: 32 },
  emptyDevicesText: { fontSize: 14, marginTop: 8, marginBottom: 16 },
  addDeviceBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  addDeviceBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sosContainer: { position: 'absolute', bottom: 100, right: 20, zIndex: 1000 },
});

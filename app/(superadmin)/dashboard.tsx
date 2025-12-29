import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { adminAPI } from '../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalPolice: number;
  totalHospitals: number;
  totalDevices: number;
  onlineDevices: number;
  totalAlerts: number;
  pendingAlerts: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalPolice: 0,
    totalHospitals: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const fullName = user?.fullName || 'Super Admin';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const quickActions = [
    { icon: 'people-outline', label: 'USERS', route: '/(superadmin)/users', color: '#6366f1' },
    { icon: 'shield-outline', label: 'ADMINS', route: '/(superadmin)/admins', color: '#8b5cf6' },
    { icon: 'warning-outline', label: 'ALERTS', route: '/(superadmin)/alerts', color: '#ef4444' },
    { icon: 'stats-chart-outline', label: 'REPORTS', route: '/(superadmin)/devices', color: '#10b981' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#312e81', '#1e1b4b'] : ['#6366f1', '#8b5cf6']}
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
                <Ionicons name="people-outline" size={24} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(245,158,11,0.3)' }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245,158,11,0.5)' }]}>
                <Ionicons name="warning-outline" size={24} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.pendingAlerts}</Text>
                <Text style={styles.statLabel}>Pending</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>System Overview</Text>
        </View>

        <View style={styles.overviewGrid}>
          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(superadmin)/admins')}
          >
            <View style={[styles.overviewIcon, { backgroundColor: '#8b5cf615' }]}>
              <Ionicons name="shield" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{stats.totalAdmins}</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Admins</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(superadmin)/police')}
          >
            <View style={[styles.overviewIcon, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="body" size={24} color="#3b82f6" />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{stats.totalPolice}</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Police</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(superadmin)/hospitals')}
          >
            <View style={[styles.overviewIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="medical" size={24} color="#ef4444" />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{stats.totalHospitals}</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Hospitals</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(superadmin)/devices')}
          >
            <View style={[styles.overviewIcon, { backgroundColor: '#10b98115' }]}>
              <Ionicons name="hardware-chip" size={24} color="#10b981" />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={[styles.overviewValue, { color: colors.text }]}>{stats.totalDevices}</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Devices</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
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
  statNumber: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  quickActionsCard: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  quickActionItem: { alignItems: 'center', gap: 8 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  overviewGrid: { gap: 12 },
  overviewCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  overviewIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  overviewInfo: { flex: 1, marginLeft: 14 },
  overviewValue: { fontSize: 20, fontWeight: '700' },
  overviewLabel: { fontSize: 13, fontWeight: '500', marginTop: 2 },
});

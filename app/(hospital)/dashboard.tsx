import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { hospitalAPI, alertsAPI } from '../../src/services/api';

interface Stats {
  totalUsers: number;
  totalAlerts: number;
  pendingAlerts: number;
  resolvedAlerts: number;
}

export default function HospitalDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAlerts: 0, pendingAlerts: 0, resolvedAlerts: 0 });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        hospitalAPI.getStats().catch(() => ({ data: {} })),
        alertsAPI.getAll({ limit: 5 }).catch(() => ({ data: [] })),
      ]);
      setStats({
        totalUsers: statsRes.data?.totalUsers || 0,
        totalAlerts: statsRes.data?.totalAlerts || 0,
        pendingAlerts: statsRes.data?.pendingAlerts || 0,
        resolvedAlerts: statsRes.data?.resolvedAlerts || 0,
      });
      setRecentAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fullName = user?.fullName || 'Staff';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const quickActions = [
    { icon: 'people-outline', label: 'PATIENTS', route: '/(hospital)/users', color: '#6366f1' },
    { icon: 'medkit-outline', label: 'EMERGENCY', route: '/(hospital)/alerts', color: '#ef4444' },
    { icon: 'pulse-outline', label: 'VITALS', route: '/(hospital)/alerts', color: '#10b981' },
    { icon: 'settings-outline', label: 'SETTINGS', route: '/(hospital)/settings', color: '#8b5cf6' },
  ];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#7f1d1d', '#991b1b'] : ['#ef4444', '#dc2626']}
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
                <Ionicons name="medkit-outline" size={24} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
                <Text style={styles.statLabel}>Emergencies</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(245,158,11,0.3)' }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245,158,11,0.5)' }]}>
                <Ionicons name="time-outline" size={24} color="#fff" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Emergencies</Text>
          <TouchableOpacity onPress={() => router.push('/(hospital)/alerts')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentAlerts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent emergencies</Text>
          </View>
        ) : (
          recentAlerts.map((alert, index) => (
            <TouchableOpacity
              key={alert._id || index}
              style={[styles.alertCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(hospital)/alerts')}
            >
              <View style={[styles.alertIcon, { backgroundColor: '#ef444415' }]}>
                <Ionicons name="medkit" size={24} color="#ef4444" />
              </View>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertType, { color: colors.text }]}>{alert.type || 'Medical Emergency'}</Text>
                <Text style={[styles.alertTime, { color: colors.textSecondary }]}>
                  {new Date(alert.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.alertStatus, { backgroundColor: alert.status === 'resolved' ? '#10b981' : '#f59e0b' }]}>
                <Text style={styles.alertStatusText}>{alert.status || 'pending'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  viewAllText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 20, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  alertIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1, marginLeft: 14 },
  alertType: { fontSize: 16, fontWeight: '600' },
  alertTime: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  alertStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  alertStatusText: { color: '#ffffff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});

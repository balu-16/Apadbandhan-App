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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { adminAPI } from '../../src/services/api';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Super Admin';

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: 'people', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
    { label: 'Admins', value: stats.totalAdmins, icon: 'shield', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    { label: 'Police', value: stats.totalPolice, icon: 'body', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    { label: 'Hospitals', value: stats.totalHospitals, icon: 'medical', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    { label: 'Devices', value: stats.totalDevices, icon: 'hardware-chip', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Online', value: stats.onlineDevices, icon: 'pulse', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
    { label: 'Total Alerts', value: stats.totalAlerts, icon: 'warning', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'Pending', value: stats.pendingAlerts, icon: 'time', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  ];

  const quickActions = [
    { label: 'Manage Users', icon: 'people', route: '/(superadmin)/users', color: '#6366f1' },
    { label: 'Manage Admins', icon: 'shield', route: '/(superadmin)/admins', color: '#8b5cf6' },
    { label: 'Manage Police', icon: 'body', route: '/(superadmin)/police', color: '#3b82f6' },
    { label: 'Manage Hospitals', icon: 'medical', route: '/(superadmin)/hospitals', color: '#ef4444' },
    { label: 'All Devices', icon: 'hardware-chip', route: '/(superadmin)/devices', color: '#10b981' },
    { label: 'View Alerts', icon: 'warning', route: '/(superadmin)/alerts', color: '#f59e0b' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Welcome back, {firstName}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)' }]}>
            <Ionicons name="shield-checkmark" size={14} color="#6366f1" />
            <Text style={[styles.roleText, { color: '#6366f1' }]}>Super Admin</Text>
          </View>
        </View>

        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>System Overview</Text>
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon as any} size={20} color="#fff" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: (SCREEN_WIDTH - 52) / 4, padding: 12, borderRadius: 16, alignItems: 'center' },
  statIconContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: (SCREEN_WIDTH - 44) / 2, padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

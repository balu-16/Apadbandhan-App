import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { hospitalAPI, alertsAPI } from '../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Stats {
  totalUsers: number;
  totalAlerts: number;
  pendingAlerts: number;
  resolvedAlerts: number;
}

export default function HospitalDashboard() {
  const { colors } = useTheme();
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Welcome back, {user?.fullName}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Ionicons name="medical" size={14} color="#ef4444" />
          <Text style={[styles.roleText, { color: '#ef4444' }]}>Hospital</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
      >

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalAlerts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Emergencies</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="time" size={24} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.pendingAlerts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.resolvedAlerts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Treated</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="people" size={24} color="#6366f1" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUsers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Patients</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Emergencies</Text>
      {recentAlerts.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent emergencies</Text>
        </View>
      ) : (
        recentAlerts.map((alert, index) => (
          <View key={alert._id || index} style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.alertIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
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
          </View>
        ))
      )}
      <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '700' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: { width: (SCREEN_WIDTH - 52) / 2, padding: 18, borderRadius: 20, alignItems: 'center' },
  statIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  emptyCard: { padding: 32, borderRadius: 20, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '500', marginTop: 12 },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  alertIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1, marginLeft: 14 },
  alertType: { fontSize: 16, fontWeight: '700' },
  alertTime: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  alertStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  alertStatusText: { color: '#ffffff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});

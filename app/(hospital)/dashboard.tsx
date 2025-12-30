import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function HospitalDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
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
  const firstName = fullName.split(' ')[0];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={[styles.welcomeIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name="medkit" size={28} color="#ef4444" />
          </View>
          <View style={styles.welcomeText}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome, {firstName}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Hospital Dashboard - Medical Emergency Center
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            label="Total Users"
            value={stats.totalUsers}
            color="#3b82f6"
            bgColor="rgba(59, 130, 246, 0.15)"
            onPress={() => router.push('/(hospital)/users')}
          />
          <StatCard
            icon="notifications"
            label="Total Alerts"
            value={stats.totalAlerts}
            color={colors.primary}
            bgColor={isDark ? 'rgba(255,122,26,0.2)' : 'rgba(255,102,0,0.15)'}
            onPress={() => router.push('/(hospital)/alerts')}
          />
          <StatCard
            icon="alert-circle"
            label="Pending Alerts"
            value={stats.pendingAlerts}
            color="#ef4444"
            bgColor="rgba(239, 68, 68, 0.15)"
            onPress={() => router.push('/(hospital)/alerts')}
          />
          <StatCard
            icon="checkmark-circle"
            label="Resolved"
            value={stats.resolvedAlerts}
            color="#10b981"
            bgColor="rgba(16, 185, 129, 0.15)"
            onPress={() => router.push('/(hospital)/alerts')}
          />
        </View>

        {/* Recent Alerts Section */}
        <View style={[styles.recentAlertsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.recentAlertsHeader}>
            <View style={styles.recentAlertsTitleRow}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.recentAlertsTitle, { color: colors.text }]}>Recent Alerts</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(hospital)/alerts')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentAlerts.length > 0 ? (
            <View style={styles.alertsList}>
              {recentAlerts.map((alert, index) => (
                <View
                  key={alert._id || index}
                  style={[styles.alertItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                >
                  <View style={styles.alertItemLeft}>
                    <View style={[
                      styles.alertIcon,
                      { backgroundColor: alert.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }
                    ]}>
                      <Ionicons
                        name={alert.status === 'resolved' ? 'checkmark-circle' : 'alert-circle'}
                        size={20}
                        color={alert.status === 'resolved' ? '#10b981' : '#ef4444'}
                      />
                    </View>
                    <View style={styles.alertInfo}>
                      <Text style={[styles.alertType, { color: colors.text }]}>
                        {alert.type || 'Medical Emergency'}
                      </Text>
                      <Text style={[styles.alertDate, { color: colors.textTertiary }]}>
                        {new Date(alert.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.alertStatusBadge,
                    { backgroundColor: alert.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }
                  ]}>
                    <Text style={[
                      styles.alertStatusText,
                      { color: alert.status === 'resolved' ? '#10b981' : '#ef4444' }
                    ]}>
                      {alert.status || 'pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAlerts}>
              <Ionicons name="time-outline" size={48} color={colors.textTertiary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyAlertsText, { color: colors.textSecondary }]}>No recent alerts</Text>
            </View>
          )}
        </View>

        {/* Quick Navigation */}
        <View style={[styles.quickNavCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.quickNavTitle, { color: colors.text }]}>Quick Navigation</Text>
          <View style={styles.quickNavList}>
            {[
              { icon: 'people', label: 'Patients', route: '/(hospital)/users', color: '#3b82f6', count: stats.totalUsers },
              { icon: 'warning', label: 'Alerts', route: '/(hospital)/alerts', color: '#ef4444', count: stats.totalAlerts },
              { icon: 'settings', label: 'Settings', route: '/(hospital)/settings', color: colors.primary, count: 0 },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickNavRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.quickNavRowLeft}>
                  <View style={[styles.quickNavRowIcon, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={[styles.quickNavRowLabel, { color: colors.text }]}>{item.label}</Text>
                </View>
                <View style={styles.quickNavRowRight}>
                  {item.count > 0 && <Text style={[styles.quickNavRowCount, { color: colors.textSecondary }]}>{item.count}</Text>}
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

  recentAlertsCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  recentAlertsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  recentAlertsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentAlertsTitle: { fontSize: 18, fontWeight: '600' },
  viewAllText: { fontSize: 14, fontWeight: '600' },
  alertsList: { gap: 10 },
  alertItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12 },
  alertItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  alertIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1 },
  alertType: { fontSize: 14, fontWeight: '600' },
  alertDate: { fontSize: 11, marginTop: 2 },
  alertStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  alertStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyAlerts: { alignItems: 'center', paddingVertical: 32 },
  emptyAlertsText: { fontSize: 14, marginTop: 8 },

  quickNavCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  quickNavTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  quickNavList: { gap: 10 },
  quickNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12 },
  quickNavRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickNavRowIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickNavRowLabel: { fontSize: 15, fontWeight: '600' },
  quickNavRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickNavRowCount: { fontSize: 14, fontWeight: '600' },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { adminAPI } from '../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Stats {
  totalUsers: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalAdmins?: number;
  totalPolice?: number;
  totalHospitals?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    fetchStats();
  }, []);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
          <Ionicons name="shield" size={14} color={colors.primary} />
          <Text style={[styles.roleText, { color: colors.primary }]}>Admin</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalUsers || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="hardware-chip" size={24} color="#3b82f6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalDevices || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Devices</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="pulse" size={24} color="#10b981" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.onlineDevices || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Online</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="cloud-offline" size={24} color="#ef4444" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.offlineDevices || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Offline</Text>
        </View>
      </View>

      {isSuperAdmin && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Staff Overview</Text>
          <View style={styles.staffGrid}>
            <View style={[styles.staffCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="shield" size={28} color={colors.primary} />
              <Text style={[styles.staffValue, { color: colors.text }]}>{stats?.totalAdmins || 0}</Text>
              <Text style={[styles.staffLabel, { color: colors.textSecondary }]}>Admins</Text>
            </View>
            <View style={[styles.staffCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="car" size={28} color="#3b82f6" />
              <Text style={[styles.staffValue, { color: colors.text }]}>{stats?.totalPolice || 0}</Text>
              <Text style={[styles.staffLabel, { color: colors.textSecondary }]}>Police</Text>
            </View>
            <View style={[styles.staffCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="medical" size={28} color="#ef4444" />
              <Text style={[styles.staffValue, { color: colors.text }]}>{stats?.totalHospitals || 0}</Text>
              <Text style={[styles.staffLabel, { color: colors.textSecondary }]}>Hospitals</Text>
            </View>
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/users' as any)}
        >
          <Ionicons name="people-outline" size={32} color={colors.primary} />
          <Text style={[styles.actionTitle, { color: colors.text }]}>Manage Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/devices' as any)}
        >
          <Ionicons name="hardware-chip-outline" size={32} color="#3b82f6" />
          <Text style={[styles.actionTitle, { color: colors.text }]}>All Devices</Text>
        </TouchableOpacity>
      </View>
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
  staffGrid: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  staffCard: { flex: 1, padding: 18, borderRadius: 20, alignItems: 'center' },
  staffValue: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  staffLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center', gap: 10 },
  actionTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

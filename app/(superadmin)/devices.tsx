import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import api from '../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Device {
  _id: string;
  code: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  userId?: string;
  userName?: string;
  lastSeen?: string;
  createdAt: string;
}

interface QRCode {
  _id: string;
  deviceCode: string;
  deviceName: string;
  status: string;
  isAssigned: boolean;
  createdAt: string;
}

export default function DevicesManagement() {
  const { colors, isDark } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'devices' | 'qrcodes'>('devices');
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, available: 0, assigned: 0 });

  const fetchData = useCallback(async () => {
    try {
      const [devicesRes, qrRes] = await Promise.all([
        api.get('/admin/devices'),
        api.get('/qrcodes'),
      ]);
      
      const deviceData = devicesRes.data?.devices || devicesRes.data || [];
      const qrData = qrRes.data || [];
      
      setDevices(deviceData);
      setQrCodes(qrData);
      
      const online = deviceData.filter((d: Device) => d.status === 'online').length;
      const available = qrData.filter((q: QRCode) => !q.isAssigned).length;
      
      setStats({
        total: deviceData.length,
        online,
        offline: deviceData.length - online,
        available,
        assigned: qrData.length - available,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.includes(searchQuery) ||
      d.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQRCodes = qrCodes.filter(
    (q) =>
      q.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.deviceCode?.includes(searchQuery)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={item.status === 'online' ? ['#10b981', '#059669'] : ['#6b7280', '#4b5563']}
        style={styles.deviceIcon}
      >
        <Ionicons name="hardware-chip" size={22} color="#fff" />
      </LinearGradient>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name || 'Unnamed Device'}</Text>
        <Text style={[styles.code, { color: colors.textSecondary }]}>{item.code}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'online' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#10b981' : '#6b7280' }]} />
            <Text style={[styles.statusText, { color: item.status === 'online' ? '#10b981' : '#6b7280' }]}>
              {item.status}
            </Text>
          </View>
          {item.userName && (
            <Text style={[styles.userText, { color: colors.textTertiary }]}>{item.userName}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </View>
  );

  const renderQRCode = ({ item }: { item: QRCode }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={item.isAssigned ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
        style={styles.deviceIcon}
      >
        <Ionicons name="qr-code" size={22} color="#fff" />
      </LinearGradient>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.deviceName}</Text>
        <Text style={[styles.code, { color: colors.textSecondary }]}>{item.deviceCode}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusBadge, { backgroundColor: item.isAssigned ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' }]}>
            <Text style={[styles.statusText, { color: item.isAssigned ? '#f59e0b' : '#10b981' }]}>
              {item.isAssigned ? 'Assigned' : 'Available'}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#1a1a2e', '#16213e'] : ['#10b981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>Device Management</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Devices</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.online}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{qrCodes.length}</Text>
            <Text style={styles.statLabel}>QR Codes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.available}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'devices' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('devices')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'devices' ? '#fff' : colors.textSecondary }]}>
            Registered ({devices.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qrcodes' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('qrcodes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'qrcodes' ? '#fff' : colors.textSecondary }]}>
            QR Codes ({qrCodes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search devices..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'devices' ? (
        <FlatList
          data={filteredDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="hardware-chip-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No devices found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredQRCodes}
          renderItem={renderQRCode}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="qr-code-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No QR codes found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -10, gap: 10 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, marginTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10, elevation: 2 },
  deviceIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  code: { fontSize: 12, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  userText: { fontSize: 11 },
  dateText: { fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
});

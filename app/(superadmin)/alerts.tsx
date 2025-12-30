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
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { alertsAPI } from '../../src/services/api';

interface AlertItem {
  _id: string;
  type: string;
  severity: string;
  status: string;
  deviceId: string;
  userId?: string;
  userName?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
}

export default function AlertsManagement() {
  const { colors, isDark } = useTheme();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await alertsAPI.getAll({ limit: 100 });
      const alertData = response.data || [];
      setAlerts(alertData);
      setFilteredAlerts(alertData);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    let filtered = alerts;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.type?.toLowerCase().includes(query) ||
          a.userName?.toLowerCase().includes(query) ||
          a.location?.address?.toLowerCase().includes(query)
      );
    }
    
    setFilteredAlerts(filtered);
  }, [searchQuery, alerts, filterStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    try {
      await alertsAPI.updateStatus(alertId, { status: newStatus });
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, status: newStatus } : a))
      );
      setSelectedAlert(null);
      Alert.alert('Success', 'Alert status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return '#10b981';
      case 'pending':
      case 'active':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const pendingCount = alerts.filter((a) => ['pending', 'active', 'new'].includes(a.status)).length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const renderAlert = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => setSelectedAlert(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.severityBar, { backgroundColor: getSeverityColor(item.severity) }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.alertIcon}>
            <Ionicons name="warning" size={20} color={getSeverityColor(item.severity)} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.alertType, { color: colors.text }]}>{item.type || 'Emergency Alert'}</Text>
            <Text style={[styles.alertTime, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        {item.userName && (
          <View style={styles.userRow}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
            <Text style={[styles.userName, { color: colors.textSecondary }]}>{item.userName}</Text>
          </View>
        )}
        {item.location?.address && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location.address}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#f59e0b', '#d97706']} style={styles.header}>
        <Text style={styles.headerTitle}>Alerts Management</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#fef3c7' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#d1fae5' }]}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filtersContainer}>
        {['all', 'pending', 'active', 'resolved'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && { backgroundColor: colors.primary }]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterText, { color: filterStatus === status ? '#fff' : colors.textSecondary }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search alerts..."
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
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No alerts found</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedAlert} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Alert Details</Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedAlert && (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAlert.type}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Severity</Text>
                  <Text style={[styles.detailValue, { color: getSeverityColor(selectedAlert.severity) }]}>
                    {selectedAlert.severity}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedAlert.status) }]}>
                    {selectedAlert.status}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedAlert.createdAt)}</Text>
                </View>
                {selectedAlert.location?.address && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAlert.location.address}</Text>
                  </View>
                )}
                <Text style={[styles.updateLabel, { color: colors.textSecondary }]}>Update Status</Text>
                <View style={styles.statusButtons}>
                  {['pending', 'active', 'resolved'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusBtn, { backgroundColor: `${getStatusColor(status)}20` }]}
                      onPress={() => handleUpdateStatus(selectedAlert._id, status)}
                    >
                      <Text style={[styles.statusBtnText, { color: getStatusColor(status) }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 30 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { fontSize: 13, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, marginTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 2, flexDirection: 'row' },
  severityBar: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { marginRight: 10 },
  headerInfo: { flex: 1 },
  alertType: { fontSize: 15, fontWeight: '700' },
  alertTime: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  userName: { fontSize: 13 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: 12, flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  updateLabel: { fontSize: 14, marginTop: 20, marginBottom: 12 },
  statusButtons: { flexDirection: 'row', gap: 10 },
  statusBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  statusBtnText: { fontSize: 14, fontWeight: '600' },
});

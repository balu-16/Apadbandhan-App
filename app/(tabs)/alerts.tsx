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
import { sosAPI, alertsAPI } from '../../src/services/api';

interface SosEvent {
  _id: string;
  status: string;
  victimLocation?: {
    coordinates: [number, number];
  };
  createdAt: string;
  resolvedAt?: string;
}

interface AlertItem {
  _id: string;
  type: string;
  source: 'sos' | 'alert';
  status: string;
  severity: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

export default function UserAlertsScreen() {
  const { colors, isDark } = useTheme();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(alertId);
            try {
              await alertsAPI.delete(alertId, 'sos');
              fetchAlerts();
            } catch (error) {
              console.error('Failed to delete alert:', error);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const fetchAlerts = useCallback(async () => {
    try {
      const sosResponse = await sosAPI.getHistory();
      const sosEvents: SosEvent[] = Array.isArray(sosResponse.data) ? sosResponse.data : [];
      
      const userAlerts: AlertItem[] = sosEvents.map((sos) => ({
        _id: sos._id,
        type: 'SOS',
        source: 'sos' as const,
        status: sos.status,
        severity: 'critical',
        location: sos.victimLocation ? {
          latitude: sos.victimLocation.coordinates[1],
          longitude: sos.victimLocation.coordinates[0],
        } : undefined,
        createdAt: sos.createdAt,
        resolvedAt: sos.resolvedAt,
      }));

      userAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAlerts(userAlerts);
      setFilteredAlerts(userAlerts);
    } catch (error) {
      console.error('Failed to fetch user alerts:', error);
      setAlerts([]);
      setFilteredAlerts([]);
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
          a.status?.toLowerCase().includes(query)
      );
    }
    setFilteredAlerts(filtered);
  }, [searchQuery, alerts, filterStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return '#10b981';
      case 'pending':
      case 'active':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  const pendingCount = alerts.filter((a) => a.status !== 'resolved').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const renderAlert = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => setSelectedAlert(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.severityBar, { backgroundColor: item.status === 'resolved' ? '#10b981' : '#9333ea' }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.alertIcon, { backgroundColor: item.status === 'resolved' ? '#10b98120' : '#9333ea20' }]}>
            <Ionicons 
              name={item.status === 'resolved' ? 'checkmark-circle' : 'alert-circle'} 
              size={20} 
              color={item.status === 'resolved' ? '#10b981' : '#9333ea'} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.alertType, { color: colors.text }]}>{item.type || 'SOS Alert'}</Text>
            <Text style={[styles.alertTime, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location.address || `${item.location.latitude?.toFixed(4)}, ${item.location.longitude?.toFixed(4)}`}
            </Text>
          </View>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.viewBtn}
            onPress={() => setSelectedAlert(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#3b82f6" />
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id)}
            disabled={deletingId === item._id}
          >
            {deletingId === item._id ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#9333ea', '#7c3aed']} style={styles.header}>
        <Text style={styles.headerTitle}>My Alerts</Text>
        <Text style={styles.headerSubtitle}>View all SOS alerts you have raised</Text>
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
        {['all', 'pending', 'resolved'].map((status) => (
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
              <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Alerts Found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You haven't raised any SOS alerts yet
              </Text>
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
                  <View style={[styles.typeBadge, { backgroundColor: '#9333ea20' }]}>
                    <Text style={[styles.typeBadgeText, { color: '#9333ea' }]}>SOS</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedAlert.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedAlert.status) }]}>
                      {selectedAlert.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedAlert.createdAt)}</Text>
                </View>
                {selectedAlert.resolvedAt && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Resolved</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedAlert.resolvedAt)}</Text>
                  </View>
                )}
                {selectedAlert.location && (
                  <View style={styles.locationDetail}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                    <View style={styles.locationInfo}>
                      <Ionicons name="location" size={16} color={colors.textSecondary} />
                      <Text style={[styles.locationDetailText, { color: colors.text }]}>
                        {selectedAlert.location.address || 
                          `${selectedAlert.location.latitude?.toFixed(6)}, ${selectedAlert.location.longitude?.toFixed(6)}`}
                      </Text>
                    </View>
                  </View>
                )}
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
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 30 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { fontSize: 13, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, marginTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 120 },
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 2, flexDirection: 'row' },
  severityBar: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  alertType: { fontSize: 16, fontWeight: '700' },
  alertTime: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  locationText: { fontSize: 13, flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12, justifyContent: 'flex-end' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#3b82f620' },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ef444420' },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  locationDetail: { marginTop: 16 },
  locationInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  locationDetailText: { flex: 1, fontSize: 14, lineHeight: 20 },
});

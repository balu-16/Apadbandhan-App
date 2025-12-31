import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { policeAPI, alertsAPI } from '../../src/services/api';
import AlertDetailsModal, { AlertItem } from '../../src/components/AlertDetailsModal';

export default function PoliceAlerts() {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sos' | 'alert'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const response = await alertsAPI.getCombined(filter);
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleUpdateStatus = (alertId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'responding' : 'resolved';
    Alert.alert(
      'Update Status',
      `Mark this alert as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await policeAPI.updateAlertStatus(alertId, newStatus);
              setAlerts(alerts.map((a) => (a._id === alertId ? { ...a, status: newStatus } : a)));
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  // Derived Statistics
  const stats = useMemo(() => {
    return {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      sos: alerts.filter(a => a.source === 'sos').length,
      accidents: alerts.filter(a => a.source === 'alert').length,
    };
  }, [alerts]);

  // Filtered List based on Search
  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    const lowerQ = searchQuery.toLowerCase();
    return alerts.filter(a =>
      (a.userId?.fullName?.toLowerCase().includes(lowerQ)) ||
      (a.type?.toLowerCase().includes(lowerQ))
    );
  }, [alerts, searchQuery]);

  const getSourceColor = (source?: string) => source === 'sos' ? '#a855f7' : '#f97316';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'responding': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  const renderStatsCard = (label: string, value: number, color: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name={icon} size={16} color={color} style={{ marginRight: 6 }} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Alerts</Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search alerts..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={{ height: 90, marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {renderStatsCard('Total', stats.total, colors.text, 'layers')}
          {renderStatsCard('Pending', stats.pending, '#f59e0b', 'time')}
          {renderStatsCard('Resolved', stats.resolved, '#10b981', 'checkmark-circle')}
          {renderStatsCard('SOS', stats.sos, '#a855f7', 'alert-circle')}
          {renderStatsCard('Accidents', stats.accidents, '#f97316', 'car')}
        </ScrollView>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'sos', 'alert'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && { backgroundColor: f === 'sos' ? '#a855f7' : f === 'alert' ? '#f97316' : '#3b82f6' }
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: '#fff' }, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setSelectedAlert(item);
                setModalVisible(true);
              }}
            >
              <View style={[styles.alertIcon, { backgroundColor: `${getSourceColor(item.source)}20` }]}>
                <Ionicons name={item.source === 'sos' ? 'alert-circle' : 'car'} size={24} color={getSourceColor(item.source)} />
              </View>
              <View style={styles.alertInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={[styles.alertType, { color: colors.text }]}>{item.type || 'Emergency'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={[styles.alertLocation, { color: colors.textSecondary }]}>
                  {item.userId?.fullName || 'Unknown User'}
                </Text>
                <Text style={[styles.alertTime, { color: colors.textTertiary }]}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {item.status !== 'resolved' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: item.status === 'pending' ? '#3b82f6' : '#10b981' }]}
                      onPress={() => handleUpdateStatus(item._id, item.status)}
                    >
                      <Text style={styles.actionBtnText}>
                        {item.status === 'pending' ? 'Respond' : 'Resolve'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedAlert(item);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Alerts Found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? "Try adjusting your search" : "No emergency alerts at this time"}
              </Text>
            </View>
          }
        />
      )}

      <AlertDetailsModal
        visible={modalVisible}
        alert={selectedAlert}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },

  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, height: 48 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  statCard: { width: 100, padding: 12, borderRadius: 12, justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },

  filterTabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 10 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e5e7eb' },
  filterText: { fontSize: 12, fontWeight: '700' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  alertCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  alertIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1, marginLeft: 14 },
  alertType: { fontSize: 16, fontWeight: '700' },
  alertLocation: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  alertTime: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  actionRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, fontWeight: '500', marginTop: 8 },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { hospitalAPI, alertsAPI } from '../../src/services/api';
import AlertDetailsModal, { AlertItem } from '../../src/components/AlertDetailsModal';

export default function HospitalAlerts() {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await alertsAPI.getCombined('all');
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetails = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const getSourceColor = (source?: string) => source === 'sos' ? '#a855f7' : '#f97316';

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleUpdateStatus = (alertId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'treating' : 'resolved';
    Alert.alert(
      'Update Status',
      `Mark this emergency as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await hospitalAPI.updateAlertStatus(alertId, newStatus);
              setAlerts(alerts.map((a) => (a._id === alertId ? { ...a, status: newStatus } : a)));
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'treating': return '#3b82f6';
      default: return '#f59e0b';
    }
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Medical Emergencies</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {alerts.length} total cases
        </Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => openDetails(item)}
          >
            <View style={[styles.alertIcon, { backgroundColor: `${getSourceColor(item.source)}20` }]}>
              <Ionicons name={item.source === 'sos' ? 'alert-circle' : 'medkit'} size={24} color={getSourceColor(item.source)} />
            </View>
            <View style={styles.alertInfo}>
              <Text style={[styles.alertType, { color: colors.text }]}>{item.type || 'Emergency'}</Text>
              <Text style={[styles.alertLocation, { color: colors.textSecondary }]}>
                {item.userId?.fullName || 'Unknown User'}
              </Text>
              <Text style={[styles.alertTime, { color: colors.textTertiary }]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear!</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No medical emergencies at this time</Text>
          </View>
        }
      />

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
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  alertIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  alertInfo: { flex: 1, marginLeft: 14 },
  alertType: { fontSize: 16, fontWeight: '700' },
  alertLocation: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  alertTime: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, fontWeight: '500', marginTop: 8 },
});

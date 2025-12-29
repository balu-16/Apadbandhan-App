import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { adminAPI } from '../../src/services/api';
import { DeviceMapView } from '../../src/components/DeviceMapView';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

interface Device {
  _id: string;
  name: string;
  code: string;
  status: 'online' | 'offline';
  userId?: { fullName: string };
  location?: { latitude: number; longitude: number };
}

export default function AllDevices() {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const handleTrackDevice = (device: Device) => {
    setSelectedDevice(device);
    setShowMapModal(true);
  };

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedDevice(null);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await adminAPI.getAllDevices({ limit: 100 });
      setDevices(Array.isArray(response.data) ? response.data : response.data?.devices || []);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>All Devices</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {devices.length} total devices
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search devices..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={[styles.deviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.deviceIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="hardware-chip" size={24} color={colors.primary} />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, { color: colors.text }]}>{item.name || 'Unnamed Device'}</Text>
              <Text style={[styles.deviceCode, { color: colors.textSecondary }]}>Code: {item.code}</Text>
              {item.userId && (
                <Text style={[styles.deviceOwner, { color: colors.textTertiary }]}>
                  Owner: {item.userId.fullName}
                </Text>
              )}
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.trackButton, { backgroundColor: colors.primary }]}
                onPress={() => handleTrackDevice(item)}
              >
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.trackButtonText}>Track</Text>
              </TouchableOpacity>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'online' ? '#10b981' : colors.textTertiary }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No devices found</Text>
          </View>
        }
      />

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseMap}
      >
        {selectedDevice && (
          <DeviceMapView
            deviceId={selectedDevice._id}
            deviceName={selectedDevice.name || 'Device'}
            initialLocation={
              selectedDevice.location?.latitude && selectedDevice.location?.longitude
                ? { latitude: selectedDevice.location.latitude, longitude: selectedDevice.location.longitude }
                : undefined
            }
            isOnline={selectedDevice.status === 'online'}
            onClose={handleCloseMap}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing['2xl'], paddingTop: 60, paddingBottom: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: Spacing.xs },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing['2xl'], paddingHorizontal: Spacing.lg, height: 48, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.lg },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: FontSize.md },
  listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: 100 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.md },
  deviceIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  deviceInfo: { flex: 1, marginLeft: Spacing.lg },
  deviceName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  deviceCode: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },
  deviceOwner: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginTop: 2 },
  actionsContainer: { alignItems: 'flex-end', gap: 8 },
  trackButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.sm, gap: 4 },
  trackButtonText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { color: '#ffffff', fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing['5xl'] },
  emptyText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, marginTop: Spacing.md },
});

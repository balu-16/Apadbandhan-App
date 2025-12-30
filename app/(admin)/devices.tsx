import { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { adminAPI } from '../../src/services/api';
import { DeviceMapView } from '../../src/components/DeviceMapView';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

const API_URL = 'http://localhost:3000/api';

interface Device {
  _id: string;
  name: string;
  code: string;
  status: 'online' | 'offline';
  type?: string;
  userId?: { fullName: string; phone?: string; email?: string };
  userName?: string;
  location?: { latitude: number; longitude: number };
  createdAt?: string;
  lastSeen?: string;
  emergencyContacts?: { name: string; relation: string; phone: string }[];
  insurance?: {
    healthInsuranceNumber?: string;
    vehicleInsuranceNumber?: string;
  };
}

export default function AllDevices() {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleTrackDevice = (device: Device) => {
    setSelectedDevice(device);
    setShowMapModal(true);
  };

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedDevice(null);
  };

  const handleDevicePress = (device: Device) => {
    setSelectedDevice(device);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedDevice(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
          <TouchableOpacity
            style={[styles.deviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleDevicePress(item)}
            activeOpacity={0.7}
          >
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
                onPress={(e) => { e.stopPropagation(); handleTrackDevice(item); }}
              >
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.trackButtonText}>Track</Text>
              </TouchableOpacity>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'online' ? '#10b981' : colors.textTertiary }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
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

      {/* Device Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIcon, { backgroundColor: selectedDevice?.status === 'online' ? '#10b98120' : '#6b728020' }]}>
                  <Ionicons
                    name="hardware-chip"
                    size={28}
                    color={selectedDevice?.status === 'online' ? '#10b981' : '#6b7280'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedDevice?.name || 'Device'}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {selectedDevice?.code}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleCloseDetails} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* QR Code Image */}
              <View style={styles.qrSection}>
                <View style={styles.qrCodeContainer}>
                  <Image
                    source={{ uri: `${API_URL}/qrcodes/image/${selectedDevice?.code}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.qrHint, { color: colors.textTertiary }]}>Scan to register device</Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusSection}>
                <View style={[styles.statusBadgeLarge, { backgroundColor: selectedDevice?.status === 'online' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
                  <View style={[styles.statusDotLarge, { backgroundColor: selectedDevice?.status === 'online' ? '#10b981' : '#6b7280' }]} />
                  <Text style={[styles.statusTextLarge, { color: selectedDevice?.status === 'online' ? '#10b981' : '#6b7280' }]}>
                    {selectedDevice?.status === 'online' ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              {/* Device Information */}
              <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Device Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Type</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{selectedDevice?.type || 'Vehicle'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Created</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(selectedDevice?.createdAt)}</Text>
                  </View>
                </View>
              </View>

              {/* Assigned User */}
              {selectedDevice?.userId && (
                <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned User</Text>
                  <View style={styles.userCard}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {selectedDevice.userId.fullName || 'Unknown User'}
                      </Text>
                      {selectedDevice.userId.phone && (
                        <View style={styles.userMeta}>
                          <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.userMetaText, { color: colors.textTertiary }]}>
                            +91 {selectedDevice.userId.phone}
                          </Text>
                        </View>
                      )}
                      {selectedDevice.userId.email && (
                        <View style={styles.userMeta}>
                          <Ionicons name="mail-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.userMetaText, { color: colors.textTertiary }]}>
                            {selectedDevice.userId.email}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Emergency Contacts */}
              {selectedDevice?.emergencyContacts && selectedDevice.emergencyContacts.length > 0 && (
                <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
                  {selectedDevice.emergencyContacts.map((contact, index) => (
                    <View key={index} style={styles.contactCard}>
                      <View style={[styles.contactAvatar, { backgroundColor: '#ef444420' }]}>
                        <Ionicons name="person" size={18} color="#ef4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                        <Text style={[styles.contactRelation, { color: colors.textTertiary }]}>{contact.relation}</Text>
                      </View>
                      <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Location */}
              {selectedDevice?.location && (
                <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Last Known Location</Text>
                  <View style={styles.locationCard}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.locationCoords, { color: colors.text }]}>
                        {selectedDevice.location.latitude.toFixed(6)}, {selectedDevice.location.longitude.toFixed(6)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.mapButton, { backgroundColor: colors.primary }]}
                      onPress={() => { handleCloseDetails(); setTimeout(() => handleTrackDevice(selectedDevice), 300); }}
                    >
                      <Ionicons name="map" size={16} color="#fff" />
                      <Text style={styles.mapButtonText}>View Map</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* System Info */}
              <View style={[styles.infoSection, { backgroundColor: colors.surface, marginBottom: 30 }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>System Information</Text>
                <View style={styles.systemInfo}>
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Device ID</Text>
                  <Text style={[styles.deviceId, { color: colors.textSecondary, backgroundColor: colors.background }]}>
                    {selectedDevice?._id}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  modalIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { paddingHorizontal: 20 },
  qrSection: { alignItems: 'center', marginVertical: 20 },
  qrCodeContainer: { width: 160, height: 160, backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  qrImage: { width: '100%', height: '100%' },
  qrHint: { fontSize: 12, marginTop: 8 },
  statusSection: { alignItems: 'center', marginBottom: 20 },
  statusBadgeLarge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  statusDotLarge: { width: 10, height: 10, borderRadius: 5 },
  statusTextLarge: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  infoSection: { borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, minWidth: '45%', flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  userMetaText: { fontSize: 12 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  contactAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactRelation: { fontSize: 12 },
  contactPhone: { fontSize: 13 },
  locationCard: { flexDirection: 'row', alignItems: 'center' },
  locationCoords: { fontSize: 13 },
  mapButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  mapButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  systemInfo: { gap: 8 },
  deviceId: { fontSize: 11, padding: 10, borderRadius: 8, overflow: 'hidden' },
});

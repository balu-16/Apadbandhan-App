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
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import api from '../../src/services/api';
import { DeviceMapView } from '../../src/components/DeviceMapView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Device {
  _id: string;
  code: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  userId?: any;
  userName?: string;
  lastSeen?: string;
  createdAt: string;
  location?: { latitude: number; longitude: number };
  emergencyContacts?: { name: string; relation: string; phone: string }[];
  insurance?: {
    healthInsuranceNumber?: string;
    healthInsuranceProvider?: string;
    vehicleInsuranceNumber?: string;
    vehicleInsuranceProvider?: string;
  };
}

interface QRCode {
  _id: string;
  deviceCode: string;
  deviceName: string;
  status: string;
  isAssigned: boolean;
  createdAt: string;
  assignedUser?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

const API_URL = 'http://localhost:3000/api';

export default function DevicesManagement() {
  const { colors, isDark } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'devices' | 'qrcodes'>('devices');
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, available: 0, assigned: 0 });
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState('10');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQRCodes = async () => {
    const count = parseInt(generateCount);
    if (isNaN(count) || count < 1 || count > 100) {
      alert('Please enter a number between 1 and 100');
      return;
    }
    setIsGenerating(true);
    try {
      await api.post('/qrcodes/generate', { count });
      setShowGenerateModal(false);
      setGenerateCount('10');
      fetchData();
      alert(`Successfully generated ${count} QR codes`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate QR codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTrackDevice = (device: Device) => {
    setSelectedDevice(device);
    setShowMapModal(true);
  };

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedDevice(null);
  };

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

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDevicePress = (device: Device) => {
    setSelectedDevice(device);
    setSelectedQRCode(null);
    setShowDetailsModal(true);
  };

  const handleQRCodePress = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode);
    setSelectedDevice(null);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedDevice(null);
    setSelectedQRCode(null);
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => handleDevicePress(item)}
      activeOpacity={0.7}
    >
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
      <TouchableOpacity
        style={[styles.trackButton, { backgroundColor: colors.primary }]}
        onPress={(e) => { e.stopPropagation(); handleTrackDevice(item); }}
      >
        <Ionicons name="location" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderQRCode = ({ item }: { item: QRCode }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => handleQRCodePress(item)}
      activeOpacity={0.7}
    >
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
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Device Management</Text>
          <TouchableOpacity style={styles.generateButton} onPress={() => setShowGenerateModal(true)}>
            <Ionicons name="add" size={18} color="#10b981" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
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

      {/* Device/QR Code Details Modal */}
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
                <View style={[styles.modalIcon, { backgroundColor: selectedDevice ? (selectedDevice.status === 'online' ? '#10b98120' : '#6b728020') : '#10b98120' }]}>
                  <Ionicons
                    name={selectedDevice ? 'hardware-chip' : 'qr-code'}
                    size={28}
                    color={selectedDevice ? (selectedDevice.status === 'online' ? '#10b981' : '#6b7280') : '#10b981'}
                  />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedDevice ? selectedDevice.name : selectedQRCode?.deviceName}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {selectedDevice ? selectedDevice.code : selectedQRCode?.deviceCode}
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
                    source={{ uri: `${API_URL}/qrcodes/image/${selectedDevice?.code || selectedQRCode?.deviceCode}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.qrHint, { color: colors.textTertiary }]}>Scan to register device</Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusSection}>
                {selectedDevice ? (
                  <View style={[styles.statusBadgeLarge, { backgroundColor: selectedDevice.status === 'online' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
                    <View style={[styles.statusDotLarge, { backgroundColor: selectedDevice.status === 'online' ? '#10b981' : '#6b7280' }]} />
                    <Text style={[styles.statusTextLarge, { color: selectedDevice.status === 'online' ? '#10b981' : '#6b7280' }]}>
                      {selectedDevice.status === 'online' ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadgeLarge, { backgroundColor: selectedQRCode?.isAssigned ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name={selectedQRCode?.isAssigned ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={selectedQRCode?.isAssigned ? '#f59e0b' : '#10b981'} />
                    <Text style={[styles.statusTextLarge, { color: selectedQRCode?.isAssigned ? '#f59e0b' : '#10b981' }]}>
                      {selectedQRCode?.isAssigned ? 'Assigned' : 'Available'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Device Information */}
              <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Device Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Type</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {selectedDevice ? (selectedDevice.type || 'Vehicle') : 'QR Code'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Created</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {formatDate(selectedDevice?.createdAt || selectedQRCode?.createdAt || '')}
                    </Text>
                  </View>
                  {selectedDevice?.lastSeen && (
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Last Seen</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{formatFullDate(selectedDevice.lastSeen)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Assigned User */}
              {(selectedDevice?.userId || selectedQRCode?.assignedUser) && (
                <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned User</Text>
                  <View style={styles.userCard}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {selectedDevice?.userName || selectedDevice?.userId?.fullName || selectedQRCode?.assignedUser?.fullName || 'Unknown User'}
                      </Text>
                      {(selectedDevice?.userId?.phone || selectedQRCode?.assignedUser?.phone) && (
                        <View style={styles.userMeta}>
                          <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.userMetaText, { color: colors.textTertiary }]}>
                            +91 {selectedDevice?.userId?.phone || selectedQRCode?.assignedUser?.phone}
                          </Text>
                        </View>
                      )}
                      {(selectedDevice?.userId?.email || selectedQRCode?.assignedUser?.email) && (
                        <View style={styles.userMeta}>
                          <Ionicons name="mail-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.userMetaText, { color: colors.textTertiary }]}>
                            {selectedDevice?.userId?.email || selectedQRCode?.assignedUser?.email}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Not Assigned Banner */}
              {!selectedDevice?.userId && !selectedQRCode?.assignedUser && !selectedQRCode?.isAssigned && (
                <View style={[styles.availableBanner, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 14 }}>Available for Assignment</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>This device is ready to be assigned to a user</Text>
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
                        {selectedDevice.location.latitude?.toFixed(6) ?? 'N/A'}, {selectedDevice.location.longitude?.toFixed(6) ?? 'N/A'}
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
                    {selectedDevice?._id || selectedQRCode?._id}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Generate QR Codes Modal */}
      <Modal
        visible={showGenerateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.generateModalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.generateModalTitle, { color: colors.text }]}>Generate QR Codes</Text>
            <Text style={[styles.generateModalDesc, { color: colors.textSecondary }]}>
              Enter the number of QR codes to generate (1-100)
            </Text>
            <TextInput
              style={[styles.generateInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={generateCount}
              onChangeText={setGenerateCount}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={colors.textTertiary}
              maxLength={3}
            />
            <View style={styles.generateActions}>
              <TouchableOpacity
                style={[styles.generateCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowGenerateModal(false)}
              >
                <Text style={[styles.generateCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.generateSubmitBtn, { opacity: isGenerating ? 0.7 : 1 }]}
                onPress={handleGenerateQRCodes}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.generateSubmitText}>Generate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  generateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6 },
  generateButtonText: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 10 },
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
  trackButton: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  modalIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
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
  availableBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  contactAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactRelation: { fontSize: 12 },
  contactPhone: { fontSize: 13, fontFamily: 'monospace' },
  locationCard: { flexDirection: 'row', alignItems: 'center' },
  locationCoords: { fontSize: 13, fontFamily: 'monospace' },
  mapButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  mapButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  systemInfo: { gap: 8 },
  deviceId: { fontSize: 11, fontFamily: 'monospace', padding: 10, borderRadius: 8, overflow: 'hidden' },
  // Generate Modal styles
  generateModalContent: { margin: 20, padding: 24, borderRadius: 20 },
  generateModalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  generateModalDesc: { fontSize: 14, marginBottom: 20 },
  generateInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, textAlign: 'center', fontWeight: '600' },
  generateActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  generateCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  generateCancelText: { fontSize: 15, fontWeight: '700' },
  generateSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center' },
  generateSubmitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

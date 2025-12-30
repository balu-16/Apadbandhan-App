import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useDeviceStore } from '../../src/store/deviceStore';
import { useAlert } from '../../src/hooks/useAlert';
import { devicesAPI, sosAPI, deviceLocationsAPI } from '../../src/services/api';
import * as Location from 'expo-location';
import { DeviceMapView } from '../../src/components/DeviceMapView';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

export default function DevicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { devices, fetchDevices, deleteDevice, isLoading } = useDeviceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const handleDeleteDevice = (id: string, name: string) => {
    showAlert({
      title: 'Delete Device',
      message: `Are you sure you want to delete "${name}"?`,
      icon: 'trash',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDevice(id);
            } catch (error) {
              showAlert({ title: 'Error', message: 'Failed to delete device', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
            }
          },
        },
      ],
    });
  };

  const handleToggleStatus = async (deviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      await devicesAPI.updateStatus(deviceId, newStatus);
      await fetchDevices();
    } catch (error) {
      showAlert({ title: 'Error', message: 'Failed to update device status', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    }
  };

  const handleTrackDevice = (device: any) => {
    setSelectedDevice(device);
    setShowMapModal(true);
  };

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedDevice(null);
  };

  const handleSOS = async (device: any) => {
    showAlert({
      title: 'Trigger SOS',
      message: `Send emergency alert for "${device.name}"? This will notify nearby responders.`,
      icon: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                showAlert({ title: 'Location Required', message: 'Please enable location to trigger SOS', icon: 'location', buttons: [{ text: 'OK', style: 'default' }] });
                return;
              }
              const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              
              const sosResponse = await sosAPI.trigger({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              });

              await deviceLocationsAPI.create({
                deviceId: device._id,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 0,
                source: 'app',
                isSOS: true,
              });

              const respondersFound = sosResponse.data?.responders?.totalFound || 0;
              showAlert({
                title: 'SOS Triggered',
                message: respondersFound > 0
                  ? `Emergency alert sent! ${respondersFound} responders notified.`
                  : `Emergency location recorded. Searching for responders...`,
                icon: 'checkmark-circle',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            } catch (error) {
              showAlert({ title: 'Error', message: 'Failed to trigger SOS. Please try again.', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
            }
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Devices</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/add-device')}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {devices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(255,102,0,0.2)' : 'rgba(255,102,0,0.15)' }]}>
              <Ionicons name="hardware-chip-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Devices Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your first device to get started with emergency tracking
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/add-device')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.emptyButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>
        ) : (
          devices.map((device, index) => (
            <View
              key={device._id || index}
              style={[styles.deviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.deviceHeader}>
                <View style={[styles.deviceIcon, { backgroundColor: isDark ? 'rgba(255,102,0,0.2)' : 'rgba(255,102,0,0.12)' }]}>
                  <Ionicons name="hardware-chip" size={28} color={colors.primary} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: colors.text }]}>
                    {device.name || 'Unnamed Device'}
                  </Text>
                  <Text style={[styles.deviceCode, { color: colors.textSecondary }]}>
                    Code: {device.code || 'N/A'}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Switch
                    value={device.status === 'online'}
                    onValueChange={() => handleToggleStatus(device._id!, device.status || 'offline')}
                    trackColor={{ false: isDark ? '#374151' : colors.border, true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                  <Text style={[styles.statusText, { color: device.status === 'online' ? '#10b981' : colors.textSecondary }]}>
                    {device.status === 'online' ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              {device.emergencyContacts && device.emergencyContacts.length > 0 && (
                <View style={[styles.contactsSection, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.contactsLabel, { color: colors.textSecondary }]}>
                    Emergency Contacts: {device.emergencyContacts.length}
                  </Text>
                </View>
              )}

              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)' }]}
                  onPress={() => handleSOS(device)}
                >
                  <Ionicons name="warning" size={18} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>SOS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(255,102,0,0.15)' : 'rgba(255,102,0,0.08)' }]}
                  onPress={() => handleTrackDevice(device)}
                >
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>Track</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)' }]}
                  onPress={() => handleDeleteDevice(device._id!, device.name || 'Device')}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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
                ? {
                    latitude: selectedDevice.location.latitude,
                    longitude: selectedDevice.location.longitude,
                  }
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  deviceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  deviceName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  deviceCode: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  contactsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  contactsLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});

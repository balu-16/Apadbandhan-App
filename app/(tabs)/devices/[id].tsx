import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Switch,
    Platform,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/hooks/useTheme';
import { useDeviceStore } from '../../../src/store/deviceStore';
import { useAlert } from '../../../src/hooks/useAlert';
import { devicesAPI, sosAPI, deviceLocationsAPI } from '../../../src/services/api';
import * as Location from 'expo-location';
import { DeviceMapView } from '../../../src/components/DeviceMapView';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../../src/constants/theme';

export default function DeviceDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { currentDevice, fetchDevice, deleteDevice, isLoading } = useDeviceStore();
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchDevice(id);
        }
    }, [id]);

    const handleToggleStatus = async (currentStatus: string) => {
        if (!currentDevice?._id) return;
        const newStatus = currentStatus === 'online' ? 'offline' : 'online';
        try {
            await devicesAPI.updateStatus(currentDevice._id, newStatus);
            fetchDevice(currentDevice._id);
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to update device status', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
        }
    };

    const handleDelete = () => {
        if (!currentDevice?._id) return;

        showAlert({
            title: 'Delete Device',
            message: `Are you sure you want to delete "${currentDevice.name}"? This action cannot be undone.`,
            icon: 'trash',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteDevice(currentDevice._id!);
                            router.back();
                        } catch (error) {
                            setIsDeleting(false);
                            showAlert({ title: 'Error', message: 'Failed to delete device', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
                        }
                    },
                },
            ],
        });
    };

    const handleSOS = async () => {
        if (!currentDevice?._id) return;

        showAlert({
            title: 'Trigger SOS',
            message: `Send emergency alert for "${currentDevice.name}"?`,
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
                                deviceId: currentDevice._id!,
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
                            showAlert({ title: 'Error', message: 'Failed to trigger SOS', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
                        }
                    },
                },
            ],
        });
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    if (isLoading || !currentDevice) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {currentDevice.name}
                </Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push({ pathname: '/(tabs)/devices/edit-device', params: { id: currentDevice._id } })}
                >
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
                {/* Device Status Card */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.deviceHeader}>
                        <View style={[styles.deviceIcon, { backgroundColor: isDark ? 'rgba(255,102,0,0.2)' : 'rgba(255,102,0,0.12)' }]}>
                            <Ionicons name="hardware-chip" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.deviceInfo}>
                            <Text style={[styles.deviceName, { color: colors.text }]}>{currentDevice.name}</Text>
                            <Text style={[styles.deviceType, { color: colors.textSecondary }]}>{currentDevice.type || 'Device'}</Text>
                        </View>
                        <Switch
                            value={currentDevice.status === 'online'}
                            onValueChange={() => handleToggleStatus(currentDevice.status || 'offline')}
                            trackColor={{ false: isDark ? '#374151' : colors.border, true: '#10b981' }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.codeContainer}>
                        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Device Code</Text>
                        <View style={[styles.codeBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
                            <Text style={[styles.codeText, { color: colors.text }]}>{currentDevice.code}</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.mainActionButton, { backgroundColor: '#ef4444' }]}
                            onPress={handleSOS}
                        >
                            <Ionicons name="warning" size={20} color="#ffffff" />
                            <Text style={styles.mainActionText}>Trigger SOS</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Live Map Preview */}
                <View style={[styles.section, { marginBottom: Spacing.lg }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Location</Text>
                    <View style={[styles.mapContainer, { borderColor: colors.border }]}>
                        <DeviceMapView
                            deviceId={currentDevice._id}
                            deviceName={currentDevice.name}
                            isOnline={currentDevice.status === 'online'}
                            height={200}
                        />
                    </View>
                </View>

                {/* Emergency Contacts */}
                <View style={[styles.section, { marginBottom: Spacing.lg }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
                    {(!currentDevice.emergencyContacts || currentDevice.emergencyContacts.length === 0) ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No contacts added</Text>
                        </View>
                    ) : (
                        currentDevice.emergencyContacts.map((contact, index) => (
                            <View key={index} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={[styles.contactAvatar, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.contactInitial, { color: colors.primary }]}>{contact.name.charAt(0)}</Text>
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>{contact.relation}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.callButton, { backgroundColor: '#10b98120' }]}
                                    onPress={() => handleCall(contact.phone)}
                                >
                                    <Ionicons name="call" size={20} color="#10b981" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Insurance Information */}
                <View style={[styles.section, { marginBottom: Spacing.lg }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Insurance Information</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 0 }]}>
                        <View style={[styles.insuranceRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                            <View style={[styles.insuranceIcon, { backgroundColor: '#3b82f620' }]}>
                                <MaterialCommunityIcons name="hospital-box" size={24} color="#3b82f6" />
                            </View>
                            <View style={styles.insuranceInfo}>
                                <Text style={[styles.insuranceLabel, { color: colors.textSecondary }]}>Health Insurance</Text>
                                <Text style={[styles.insuranceValue, { color: colors.text }]}>
                                    {currentDevice.insurance?.health || 'Not provided'}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.insuranceRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                            <View style={[styles.insuranceIcon, { backgroundColor: '#f59e0b20' }]}>
                                <MaterialCommunityIcons name="car" size={24} color="#f59e0b" />
                            </View>
                            <View style={styles.insuranceInfo}>
                                <Text style={[styles.insuranceLabel, { color: colors.textSecondary }]}>Vehicle Insurance</Text>
                                <Text style={[styles.insuranceValue, { color: colors.text }]}>
                                    {currentDevice.insurance?.vehicle || 'Not provided'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.insuranceRow}>
                            <View style={[styles.insuranceIcon, { backgroundColor: '#10b98120' }]}>
                                <MaterialCommunityIcons name="file-document" size={24} color="#10b981" />
                            </View>
                            <View style={styles.insuranceInfo}>
                                <Text style={[styles.insuranceLabel, { color: colors.textSecondary }]}>Term Insurance</Text>
                                <Text style={[styles.insuranceValue, { color: colors.text }]}>
                                    {currentDevice.insurance?.term || 'Not provided'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    style={[styles.deleteButton, { borderColor: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)' }]}
                    onPress={handleDelete}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={[styles.deleteButtonText, { color: '#ef4444' }]}>
                        {isDeleting ? 'Deleting...' : 'Delete Device'}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Spacing.md,
    },
    editButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    editButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    content: {
        padding: Spacing.lg,
    },
    card: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    deviceIcon: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    deviceType: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: Spacing.md,
    },
    codeContainer: {
        marginBottom: Spacing.lg,
    },
    codeLabel: {
        fontSize: FontSize.xs,
        marginBottom: Spacing.xs,
    },
    codeBox: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    codeText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        letterSpacing: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    mainActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    mainActionText: {
        color: '#ffffff',
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    section: {
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.md,
    },
    mapContainer: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
    },
    emptyCard: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: FontSize.md,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    contactInitial: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    contactRelation: {
        fontSize: FontSize.sm,
    },
    callButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insuranceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    insuranceIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    insuranceInfo: {
        flex: 1,
    },
    insuranceLabel: {
        fontSize: FontSize.xs,
        marginBottom: 2,
    },
    insuranceValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
        marginTop: Spacing.xl,
    },
    deleteButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});

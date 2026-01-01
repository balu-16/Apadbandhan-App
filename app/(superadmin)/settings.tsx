import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useAlert } from '../../src/hooks/useAlert';
import { usersAPI, systemConfigAPI } from '../../src/services/api';

export default function SuperAdminSettings() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, logout, refreshProfile } = useAuthStore();
  const { colorScheme, setColorScheme } = useThemeStore();
  const { showAlert } = useAlert();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);

  // Alert configuration state
  const [maxPoliceAlerts, setMaxPoliceAlerts] = useState<string>('5');
  const [maxHospitalAlerts, setMaxHospitalAlerts] = useState<string>('5');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification settings
  const [accidentAlertsEnabled, setAccidentAlertsEnabled] = useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      setProfilePhoto(user.profilePhoto || null);
      setEditFullName(user.fullName || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  // Load system configuration on mount
  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await systemConfigAPI.getConfig();
      const config = response.data;
      setMaxPoliceAlerts(String(config.maxPoliceAlertRecipients || 5));
      setMaxHospitalAlerts(String(config.maxHospitalAlertRecipients || 5));
    } catch (error) {
      console.error('Failed to load system config:', error);
      // Use defaults if config fails to load
      setMaxPoliceAlerts('5');
      setMaxHospitalAlerts('5');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleSaveAlertConfig = async () => {
    const policeLimit = parseInt(maxPoliceAlerts, 10);
    const hospitalLimit = parseInt(maxHospitalAlerts, 10);

    if (isNaN(policeLimit) || policeLimit < 1 || policeLimit > 50) {
      showAlert({ title: 'Invalid Value', message: 'Police alert limit must be between 1 and 50', icon: 'alert-circle', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }
    if (isNaN(hospitalLimit) || hospitalLimit < 1 || hospitalLimit > 50) {
      showAlert({ title: 'Invalid Value', message: 'Hospital alert limit must be between 1 and 50', icon: 'alert-circle', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }

    try {
      setIsSavingConfig(true);
      await systemConfigAPI.updateConfig({
        maxPoliceAlertRecipients: policeLimit,
        maxHospitalAlertRecipients: hospitalLimit,
      });
      showAlert({ title: 'Success', message: 'Alert configuration saved successfully', icon: 'checkmark-circle', buttons: [{ text: 'OK', style: 'default' }] });
    } catch (error: any) {
      console.error('Failed to save config:', error);
      showAlert({ title: 'Error', message: 'Failed to save configuration', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      showAlert({ title: 'Error', message: 'Full name cannot be empty', icon: 'alert-circle', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      showAlert({ title: 'Error', message: 'Please enter a valid email', icon: 'alert-circle', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }
    if (!user?.id) {
      showAlert({ title: 'Error', message: 'User session not found', icon: 'alert-circle', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }

    try {
      setIsSavingProfile(true);
      await usersAPI.updateProfile(user.id, { fullName: editFullName.trim(), email: editEmail.trim() });
      await refreshProfile();
      setIsEditingProfile(false);
      showAlert({ title: 'Success', message: 'Profile updated successfully', icon: 'checkmark-circle', buttons: [{ text: 'OK', style: 'default' }] });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showAlert({ title: 'Error', message: error.response?.data?.message || 'Failed to update profile', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user?.id) return;

    showAlert({
      title: 'Delete Account',
      message: 'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      icon: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersAPI.deleteAccount(user.id);
              logout();
              router.replace('/login');
            } catch (error) {
              showAlert({ title: 'Error', message: 'Failed to delete account', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
            }
          },
        },
      ],
    });
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert({ title: 'Permission Required', message: 'Please allow access to your photos', icon: 'alert-circle', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && user?.id) {
      setIsUploadingPhoto(true);
      try {
        const asset = result.assets[0];
        setProfilePhoto(asset.uri);
        const file = {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        };
        await usersAPI.uploadProfilePhoto(user.id, file);
        await refreshProfile();
        showAlert({ title: 'Success', message: 'Profile photo updated', icon: 'checkmark-circle', buttons: [{ text: 'OK', style: 'default' }] });
      } catch (error: any) {
        showAlert({ title: 'Error', message: 'Failed to upload photo', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleLogout = () => {
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      icon: 'log-out',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    });
  };

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const updateNotificationSetting = async (key: string, value: boolean) => {
    if (!user?.id) return;
    try {
      await usersAPI.updateProfile(user.id, { [key]: value });
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      // Revert on failure - this is handled by the toggle state
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Super Admin';

  type SettingItem =
    | { icon: string; label: string; subtitle?: string; onPress: () => void; isSwitch?: false }
    | { icon: string; label: string; subtitle?: string; isSwitch: true; value: boolean; onToggle: () => void };

  interface SettingsSection {
    title: string;
    items: SettingItem[];
  }

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person', label: 'Profile', subtitle: user?.email || undefined, onPress: () => setIsEditingProfile(true) },
        { icon: 'key', label: 'Change Password', onPress: () => showAlert({ title: 'Coming Soon', message: 'Password change functionality will be available in a future update.', icon: 'information-circle', buttons: [{ text: 'OK', style: 'default' }] }) },
        { icon: 'shield-checkmark', label: 'Security', onPress: () => showAlert({ title: 'Coming Soon', message: 'Security settings will be available in a future update.', icon: 'information-circle', buttons: [{ text: 'OK', style: 'default' }] }) },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon',
          label: 'Dark Mode',
          isSwitch: true,
          value: isDark,
          onToggle: toggleTheme,
        },
        {
          icon: 'notifications',
          label: 'Push Notifications',
          isSwitch: true,
          value: notificationsEnabled,
          onToggle: () => setNotificationsEnabled(!notificationsEnabled),
        },
        {
          icon: 'car',
          label: 'Accident Alerts',
          isSwitch: true,
          value: accidentAlertsEnabled,
          onToggle: () => {
            const newValue = !accidentAlertsEnabled;
            setAccidentAlertsEnabled(newValue);
            updateNotificationSetting('accidentAlerts', newValue);
          },
        },
        {
          icon: 'chatbubble',
          label: 'SMS Notifications',
          isSwitch: true,
          value: smsNotificationsEnabled,
          onToggle: () => {
            const newValue = !smsNotificationsEnabled;
            setSmsNotificationsEnabled(newValue);
            updateNotificationSetting('smsNotifications', newValue);
          },
        },
        {
          icon: 'location',
          label: 'Location Tracking',
          isSwitch: true,
          value: locationTrackingEnabled,
          onToggle: () => {
            const newValue = !locationTrackingEnabled;
            setLocationTrackingEnabled(newValue);
            updateNotificationSetting('locationTracking', newValue);
          },
        },
      ],
    },
    {
      title: 'System',
      items: [
        { icon: 'server', label: 'System Health', onPress: () => router.push('/(superadmin)/dashboard') },
        { icon: 'analytics', label: 'Analytics', onPress: () => showAlert({ title: 'Coming Soon', message: 'Analytics dashboard will be available in a future update.', icon: 'information-circle', buttons: [{ text: 'OK', style: 'default' }] }) },
        { icon: 'document-text', label: 'Audit Logs', onPress: () => showAlert({ title: 'Coming Soon', message: 'Audit logs will be available in a future update.', icon: 'information-circle', buttons: [{ text: 'OK', style: 'default' }] }) },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help Center', onPress: () => showAlert({ title: 'Help Center', message: 'For assistance, contact support@apadbandhav.com or call our 24/7 helpline.', icon: 'help-circle', buttons: [{ text: 'OK', style: 'default' }] }) },
        { icon: 'information-circle', label: 'About', subtitle: 'Version 1.0.0', onPress: () => showAlert({ title: 'Apadbandhav v1.0.0', message: 'Emergency response & safety management platform. © 2024 NighaTech.', icon: 'information-circle', buttons: [{ text: 'OK', style: 'default' }] }) },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f1729', '#16213e'] : ['#ff6600', '#ff7a1a']}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.avatar}>
                <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={styles.cameraIcon}>
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'Super Admin'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fbbf24" />
              <Text style={styles.roleText}>Super Admin</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={item.isSwitch ? undefined : item.onPress}
                  activeOpacity={item.isSwitch ? 1 : 0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                    {item.subtitle && (
                      <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.isSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                      thumbColor={item.value ? colors.primary : '#f4f3f4'}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Alert Configuration Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Alert Configuration</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, padding: 16 }]}>
            <Text style={[styles.alertConfigDescription, { color: colors.textSecondary }]}>
              Control how many responders receive SOS/accident alerts. Only the nearest responders within the search radius will be notified.
            </Text>

            {isLoadingConfig ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <>
                {/* Police Alert Limit */}
                <View style={styles.alertConfigRow}>
                  <View style={[styles.iconContainer, { backgroundColor: '#3b82f615' }]}>
                    <Ionicons name="shield" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.alertConfigInfo}>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>Police Alert Limit</Text>
                    <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>
                      Max nearest police to notify
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.alertConfigInput, {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border
                    }]}
                    value={maxPoliceAlerts}
                    onChangeText={setMaxPoliceAlerts}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="5"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                {/* Hospital Alert Limit */}
                <View style={[styles.alertConfigRow, { marginTop: 16 }]}>
                  <View style={[styles.iconContainer, { backgroundColor: '#ef444415' }]}>
                    <Ionicons name="medkit" size={20} color="#ef4444" />
                  </View>
                  <View style={styles.alertConfigInfo}>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>Hospital Alert Limit</Text>
                    <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>
                      Max nearest hospitals to notify
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.alertConfigInput, {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border
                    }]}
                    value={maxHospitalAlerts}
                    onChangeText={setMaxHospitalAlerts}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="5"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveConfigButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveAlertConfig}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save" size={18} color="#fff" />
                      <Text style={styles.saveConfigButtonText}>Save Configuration</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, padding: 16 }]}>
            <Text style={[styles.alertConfigDescription, { color: colors.textSecondary }]}>
              Once you delete your account, there is no going back. Please be certain.
            </Text>
            <TouchableOpacity
              style={[styles.deleteAccountButton]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash" size={18} color="#ef4444" />
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 16, position: 'relative' as const },
  avatar: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 70, height: 70, borderRadius: 20 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  cameraIcon: { position: 'absolute' as const, bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#ff6600', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  roleText: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionContent: { borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 16, fontWeight: '600' },
  itemSubtitle: { fontSize: 13, marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10, marginTop: 8 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  alertConfigDescription: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  alertConfigRow: { flexDirection: 'row', alignItems: 'center' },
  alertConfigInfo: { flex: 1 },
  alertConfigInput: { width: 60, height: 44, borderRadius: 10, borderWidth: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  saveConfigButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8, marginTop: 20 },
  saveConfigButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteAccountButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', gap: 8 },
  deleteAccountText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { usersAPI } from '../../src/services/api';
import { useAlert } from '../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, toggleTheme, isDark, setColorScheme } = useTheme();
  const { user, logout, refreshProfile } = useAuthStore();
  const { showAlert } = useAlert();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [hospitalPreference, setHospitalPreference] = useState<'government' | 'private'>('government');
  const [accidentAlerts, setAccidentAlerts] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setProfilePhoto(user.profilePhoto || null);
      setHospitalPreference((user.hospitalPreference as 'government' | 'private') || 'government');
      setAccidentAlerts(user.accidentAlerts ?? true);
      setSmsNotifications(user.smsNotifications ?? true);
      setLocationTracking(user.locationTracking ?? true);
    }
  }, [user]);

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

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await usersAPI.updateProfile(user.id, { fullName, email });
      await refreshProfile();
      showAlert({ title: 'Success', message: 'Profile updated successfully', icon: 'checkmark-circle', buttons: [{ text: 'OK', style: 'default' }] });
    } catch (error: any) {
      let message = 'Failed to update profile';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Error', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHospitalPreference = async () => {
    if (!user?.id) return;
    try {
      await usersAPI.updateProfile(user.id, { hospitalPreference });
      showAlert({ title: 'Success', message: 'Hospital preference saved', icon: 'checkmark-circle', buttons: [{ text: 'OK', style: 'default' }] });
    } catch (error: any) {
      showAlert({ title: 'Error', message: 'Failed to save hospital preference', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    try {
      await usersAPI.updateProfile(user.id, { accidentAlerts, smsNotifications, locationTracking });
      showAlert({ title: 'Success', message: 'Notification settings saved', icon: 'checkmark-circle', buttons: [{ text: 'OK', style: 'default' }] });
    } catch (error: any) {
      showAlert({ title: 'Error', message: 'Failed to save notification settings', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    }
  };

  const handleLogout = () => {
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      icon: 'log-out',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); }},
      ],
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'delete my account' || !user?.id) return;
    try {
      await usersAPI.deleteAccount(user.id);
      await logout();
      router.replace('/(auth)/login');
    } catch (error: any) {
      let message = 'Failed to delete account';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Error', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    }
  };

  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
      </View>

      {/* User Information Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Information</Text>
        </View>
        
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName || 'User'}</Text>
            <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>{user?.phone}</Text>
            <TouchableOpacity onPress={handlePickImage}>
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="person-outline" size={18} color={colors.textTertiary} />
            <TextInput style={[styles.input, { color: colors.text }]} value={fullName} onChangeText={setFullName} placeholder="Enter your name" placeholderTextColor={colors.textTertiary} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
            <TextInput style={[styles.input, { color: colors.text }]} value={email} onChangeText={setEmail} placeholder="Enter your email" placeholderTextColor={colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]} onPress={handleSaveProfile} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveButtonText}>Save Profile</Text></>}
        </TouchableOpacity>
      </View>

      {/* Hospital Preference Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hospital Preference</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Choose your preferred hospital type for emergencies</Text>

        <TouchableOpacity style={[styles.radioOption, hospitalPreference === 'government' && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setHospitalPreference('government')}>
          <View style={[styles.radioCircle, hospitalPreference === 'government' && { borderColor: colors.primary }]}>
            {hospitalPreference === 'government' && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
          </View>
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, { color: colors.text }]}>Government Hospitals</Text>
            <Text style={[styles.radioDesc, { color: colors.textSecondary }]}>Public healthcare facilities</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.radioOption, hospitalPreference === 'private' && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setHospitalPreference('private')}>
          <View style={[styles.radioCircle, hospitalPreference === 'private' && { borderColor: colors.primary }]}>
            {hospitalPreference === 'private' && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
          </View>
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, { color: colors.text }]}>Private Hospitals</Text>
            <Text style={[styles.radioDesc, { color: colors.textSecondary }]}>Premium healthcare facilities</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.primary }]} onPress={handleSaveHospitalPreference}>
          <Ionicons name="save-outline" size={18} color={colors.primary} />
          <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Save Preference</Text>
        </TouchableOpacity>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        </View>

        <View style={styles.themeRow}>
          <TouchableOpacity style={[styles.themeOption, !isDark && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setColorScheme('light')}>
            <Ionicons name="sunny" size={24} color={!isDark ? colors.primary : colors.textTertiary} />
            <Text style={[styles.themeLabel, { color: !isDark ? colors.primary : colors.text }]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.themeOption, isDark && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setColorScheme('dark')}>
            <Ionicons name="moon" size={24} color={isDark ? colors.primary : colors.textTertiary} />
            <Text style={[styles.themeLabel, { color: isDark ? colors.primary : colors.text }]}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & Notifications</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Accident Alerts</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>Receive notifications for detected accidents</Text>
            </View>
          </View>
          <Switch value={accidentAlerts} onValueChange={setAccidentAlerts} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbox" size={20} color="#f59e0b" />
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>SMS Notifications</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>Receive SMS alerts on your phone</Text>
            </View>
          </View>
          <Switch value={smsNotifications} onValueChange={setSmsNotifications} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="location" size={20} color="#10b981" />
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Location Tracking</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>Enable real-time GPS tracking for devices</Text>
            </View>
          </View>
          <Switch value={locationTracking} onValueChange={setLocationTracking} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
        </View>

        <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.primary }]} onPress={handleSaveNotifications}>
          <Ionicons name="save-outline" size={18} color={colors.primary} />
          <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Save Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Session Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="log-out" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Session</Text>
        </View>
        <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.primary }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: colors.error }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning" size={20} color={colors.error} />
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Once you delete your account, there is no going back. All your data will be permanently removed.</Text>

        {!showDeleteConfirm ? (
          <TouchableOpacity style={[styles.dangerButton, { backgroundColor: colors.error }]} onPress={() => setShowDeleteConfirm(true)}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.dangerButtonText}>Delete My Account</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.deleteConfirm}>
            <Text style={[styles.deleteLabel, { color: colors.text }]}>Type "delete my account" to confirm:</Text>
            <TextInput style={[styles.deleteInput, { borderColor: colors.error, color: colors.text }]} value={deleteConfirmText} onChangeText={setDeleteConfirmText} placeholder="delete my account" placeholderTextColor={colors.textTertiary} />
            <View style={styles.deleteButtons}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteButton, { backgroundColor: colors.error, opacity: deleteConfirmText === 'delete my account' ? 1 : 0.5 }]} onPress={handleDeleteAccount} disabled={deleteConfirmText !== 'delete my account'}>
                <Text style={styles.confirmDeleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing['2xl'], paddingTop: 60, paddingBottom: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sectionDesc: { fontSize: FontSize.sm, marginBottom: Spacing.lg, lineHeight: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { marginLeft: Spacing.lg, flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  profilePhone: { fontSize: FontSize.sm, marginTop: 2 },
  changePhotoText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 4 },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 48, gap: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.md },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm },
  saveButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  radioOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderWidth: 1, borderRadius: BorderRadius.lg, borderColor: 'transparent', marginBottom: Spacing.md },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9ca3af', justifyContent: 'center', alignItems: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  radioContent: { marginLeft: Spacing.md, flex: 1 },
  radioLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  radioDesc: { fontSize: FontSize.sm, marginTop: 2 },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.sm, marginTop: Spacing.md },
  outlineButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  themeRow: { flexDirection: 'row', gap: Spacing.md },
  themeOption: { flex: 1, alignItems: 'center', padding: Spacing.lg, borderWidth: 2, borderRadius: BorderRadius.lg, borderColor: 'transparent' },
  themeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: Spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  switchInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  switchText: { flex: 1 },
  switchLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  switchDesc: { fontSize: FontSize.xs, marginTop: 2 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm, marginTop: Spacing.md },
  dangerButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  deleteConfirm: { marginTop: Spacing.md },
  deleteLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  deleteInput: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44, fontSize: FontSize.md },
  deleteButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelButton: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  cancelButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  confirmDeleteButton: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  footer: { height: 100 },
});

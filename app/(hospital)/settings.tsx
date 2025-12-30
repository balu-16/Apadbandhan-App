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
import OnDutyToggle from '../../src/components/OnDutyToggle';

export default function HospitalSettings() {
  const router = useRouter();
  const { colors, isDark, setColorScheme } = useTheme();
  const { user, logout, refreshProfile } = useAuthStore();
  const { showAlert } = useAlert();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
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

  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'H';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
      </View>

      {/* On-Duty Toggle Section */}
      <OnDutyToggle role="hospital" style={{ marginHorizontal: 16, marginBottom: 16 }} />

      {/* User Information Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color="#ef4444" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Information</Text>
        </View>
        
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Text style={[styles.avatarText, { color: '#ef4444' }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraIcon, { backgroundColor: '#ef4444' }]}>
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName || 'Hospital'}</Text>
            <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>{user?.phone}</Text>
            <View style={[styles.roleBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Text style={[styles.roleText, { color: '#ef4444' }]}>HOSPITAL</Text>
            </View>
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

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#ef4444', opacity: isSaving ? 0.7 : 1 }]} onPress={handleSaveProfile} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveButtonText}>Save Profile</Text></>}
        </TouchableOpacity>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={20} color="#ef4444" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        </View>

        <View style={styles.themeRow}>
          <TouchableOpacity style={[styles.themeOption, !isDark && { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => setColorScheme('light')}>
            <Ionicons name="sunny" size={24} color={!isDark ? '#ef4444' : colors.textTertiary} />
            <Text style={[styles.themeLabel, { color: !isDark ? '#ef4444' : colors.text }]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.themeOption, isDark && { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => setColorScheme('dark')}>
            <Ionicons name="moon" size={24} color={isDark ? '#ef4444' : colors.textTertiary} />
            <Text style={[styles.themeLabel, { color: isDark ? '#ef4444' : colors.text }]}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color="#ef4444" />
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
          <Switch value={accidentAlerts} onValueChange={setAccidentAlerts} trackColor={{ false: colors.border, true: '#ef4444' }} thumbColor="#fff" />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbox" size={20} color="#f59e0b" />
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>SMS Notifications</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>Receive SMS alerts on your phone</Text>
            </View>
          </View>
          <Switch value={smsNotifications} onValueChange={setSmsNotifications} trackColor={{ false: colors.border, true: '#ef4444' }} thumbColor="#fff" />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="location" size={20} color="#10b981" />
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Location Tracking</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>Enable real-time GPS tracking</Text>
            </View>
          </View>
          <Switch value={locationTracking} onValueChange={setLocationTracking} trackColor={{ false: colors.border, true: '#ef4444' }} thumbColor="#fff" />
        </View>

        <TouchableOpacity style={[styles.outlineButton, { borderColor: '#ef4444' }]} onPress={handleSaveNotifications}>
          <Ionicons name="save-outline" size={18} color="#ef4444" />
          <Text style={[styles.outlineButtonText, { color: '#ef4444' }]}>Save Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Session Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Session</Text>
        </View>
        <TouchableOpacity style={[styles.outlineButton, { borderColor: '#ef4444' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={[styles.outlineButtonText, { color: '#ef4444' }]}>Logout</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  section: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 20, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionDesc: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 22, fontWeight: '700' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profilePhone: { fontSize: 14, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  roleText: { fontSize: 11, fontWeight: '700' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8, marginTop: 12 },
  outlineButtonText: { fontSize: 15, fontWeight: '700' },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeOption: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 2, borderRadius: 16, borderColor: 'transparent' },
  themeLabel: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  switchInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  switchDesc: { fontSize: 12, marginTop: 2 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 12 },
  dangerButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteConfirm: { marginTop: 12 },
  deleteLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  deleteInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 15 },
  deleteButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '700' },
  confirmDeleteButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { height: 120 },
});

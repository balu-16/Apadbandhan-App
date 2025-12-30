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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useAlert } from '../../src/hooks/useAlert';
import { usersAPI } from '../../src/services/api';

export default function SuperAdminSettings() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, logout, refreshProfile } = useAuthStore();
  const { colorScheme, setColorScheme } = useThemeStore();
  const { showAlert } = useAlert();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);

  useEffect(() => {
    if (user) {
      setProfilePhoto(user.profilePhoto || null);
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
        { icon: 'person', label: 'Profile', subtitle: user?.email || undefined, onPress: () => {} },
        { icon: 'key', label: 'Change Password', onPress: () => {} },
        { icon: 'shield-checkmark', label: 'Security', onPress: () => {} },
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
          label: 'Notifications',
          isSwitch: true,
          value: notificationsEnabled,
          onToggle: () => setNotificationsEnabled(!notificationsEnabled),
        },
      ],
    },
    {
      title: 'System',
      items: [
        { icon: 'server', label: 'System Health', onPress: () => {} },
        { icon: 'analytics', label: 'Analytics', onPress: () => {} },
        { icon: 'document-text', label: 'Audit Logs', onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help Center', onPress: () => {} },
        { icon: 'information-circle', label: 'About', subtitle: 'Version 1.0.0', onPress: () => {} },
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
});

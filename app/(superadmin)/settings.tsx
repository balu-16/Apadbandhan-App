import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useAlert } from '../../src/hooks/useAlert';

export default function SuperAdminSettings() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useThemeStore();
  const { showAlert } = useAlert();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
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
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
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

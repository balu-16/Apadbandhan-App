import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useAlert } from '../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

export default function AdminSettings() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { showAlert } = useAlert();

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

  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {user?.role?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.error }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing['2xl'], paddingTop: 60, paddingBottom: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  profileCard: { marginHorizontal: Spacing['2xl'], padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  profileInfo: { marginLeft: Spacing.lg, flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  profileEmail: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: Spacing.sm },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  section: { marginHorizontal: Spacing['2xl'], padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.5, marginBottom: Spacing.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  logoutButton: { marginHorizontal: Spacing['2xl'], padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: 100 },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
});

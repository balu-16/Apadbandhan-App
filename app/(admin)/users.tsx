import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { adminAPI } from '../../src/services/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

export default function UsersManagement() {
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ limit: 50 });
      setUsers(Array.isArray(response.data) ? response.data : response.data?.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newUser.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminAPI.createUser(newUser as any);
      Alert.alert('Success', 'User created successfully');
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', phone: '' });
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminAPI.deleteUser(userId);
            setUsers(users.filter((u) => u._id !== userId));
            Alert.alert('Success', 'User deleted successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return '#ff7a1a';
      case 'admin': return colors.primary;
      case 'police': return '#3b82f6';
      case 'hospital': return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery)
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
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#ff6600', '#ff7a1a']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Users Management</Text>
            <Text style={styles.headerSubtitle}>{users.length} registered users</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={22} color="#ff6600" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={['#ff6600', '#ff7a1a']} style={styles.avatar}>
              <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
            </LinearGradient>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{item.fullName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteUser(item._id, item.fullName)}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
          </View>
        }
      />

      {/* Add User Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New User</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Create a new user account. The user will login using OTP verification.
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Full Name"
              placeholderTextColor={colors.textTertiary}
              value={newUser.fullName}
              onChangeText={(t) => setNewUser({ ...newUser, fullName: t })}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Email Address"
              placeholderTextColor={colors.textTertiary}
              value={newUser.email}
              onChangeText={(t) => setNewUser({ ...newUser, email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="10-digit Phone Number"
              placeholderTextColor={colors.textTertiary}
              value={newUser.phone}
              onChangeText={(t) => setNewUser({ ...newUser, phone: t.replace(/\D/g, '').slice(0, 10) })}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setShowAddModal(false); setNewUser({ fullName: '', email: '', phone: '' }); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn, { opacity: isSubmitting ? 0.7 : 1 }]} onPress={handleAddUser} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Create User</Text>}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  searchWrapper: { paddingHorizontal: 16, marginTop: -10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, gap: 12, elevation: 3 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 100 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  roleText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalDesc: { fontSize: 14, marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(107,114,128,0.15)' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  submitBtn: { backgroundColor: '#ff6600' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

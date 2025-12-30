import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { adminAPI } from '../../src/services/api';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  address?: string;
  profilePhoto?: string;
}

export default function UsersManagement() {
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Add User Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '' });

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getAllUsers();
      const userData = response.data?.users || response.data || [];
      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

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
      setIsAddModalVisible(false);
      setNewUser({ fullName: '', email: '', phone: '' });
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteUser(userId);
              setUsers((prev) => prev.filter((u) => u._id !== userId));
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.surface }]}
      onPress={() => openUserDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <LinearGradient colors={['#ff6600', '#ff7a1a']} style={styles.avatarGradient}>
          <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
        </LinearGradient>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.fullName || 'Unknown'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.statusBadge, { backgroundColor: item.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10b981' : '#6b7280' }]} />
            <Text style={[styles.statusText, { color: item.isActive ? '#10b981' : '#6b7280' }]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            Joined {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0f1729', '#16213e'] : ['#ff6600', '#ff7a1a']}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Users Management</Text>
            <Text style={styles.headerSubtitle}>{users.length} registered users</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
            <Ionicons name="add" size={22} color="#ff6600" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, email or phone..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
            </View>
          }
        />
      )}

      {/* User Details Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>User Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {/* User Avatar & Name */}
                <View style={styles.modalUserHeader}>
                  <LinearGradient colors={['#ff6600', '#ff7a1a']} style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.fullName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </LinearGradient>
                  <Text style={[styles.modalUserName, { color: colors.text }]}>
                    {selectedUser.fullName || 'Unknown'}
                  </Text>
                  <View style={[styles.modalStatusBadge, { backgroundColor: selectedUser.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
                    <View style={[styles.statusDot, { backgroundColor: selectedUser.isActive ? '#10b981' : '#6b7280' }]} />
                    <Text style={[styles.modalStatusText, { color: selectedUser.isActive ? '#10b981' : '#6b7280' }]}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {/* User Info Cards */}
                <View style={styles.infoSection}>
                  <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.infoIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                      <Ionicons name="mail" size={20} color="#ff6600" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedUser.email || 'Not provided'}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.infoIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <Ionicons name="call" size={20} color="#10b981" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedUser.phone || 'Not provided'}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.infoIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      <Ionicons name="shield" size={20} color="#f59e0b" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{selectedUser.role || 'user'}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.infoIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                      <Ionicons name="calendar" size={20} color="#ff7a1a" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Joined</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(selectedUser.createdAt)}</Text>
                    </View>
                  </View>

                  {selectedUser.lastLogin && (
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                      <View style={[styles.infoIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <Ionicons name="time" size={20} color="#3b82f6" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Login</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(selectedUser.lastLogin)}</Text>
                      </View>
                    </View>
                  )}

                  {selectedUser.address && (
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                      <View style={[styles.infoIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                        <Ionicons name="location" size={20} color="#ec4899" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Address</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{selectedUser.address}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={() => {
                      closeModal();
                      handleDeleteUser(selectedUser._id, selectedUser.fullName);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete User</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New User</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={[styles.addUserDesc, { color: colors.textSecondary }]}>
                Create a new user account. The user will be able to login using OTP verification.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.fullName}
                  onChangeText={(text) => setNewUser({ ...newUser, fullName: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.phone}
                  onChangeText={(text) => setNewUser({ ...newUser, phone: text.replace(/\D/g, '').slice(0, 10) })}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.addUserActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setIsAddModalVisible(false); setNewUser({ fullName: '', email: '', phone: '' }); }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
                  onPress={handleAddUser}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create User</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchContainer: { paddingHorizontal: 16, marginTop: -16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  userAvatar: { marginRight: 14 },
  avatarGradient: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  closeButton: { padding: 4 },
  modalScroll: { paddingHorizontal: 20 },
  modalUserHeader: { alignItems: 'center', paddingVertical: 24 },
  modalAvatar: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalAvatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  modalUserName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  modalStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  modalStatusText: { fontSize: 13, fontWeight: '600' },
  infoSection: { gap: 12 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  infoIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  modalActions: { marginTop: 24, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10 },
  actionBtnText: { fontSize: 16, fontWeight: '700' },
  // Add User Modal styles
  addUserDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20, marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  addUserActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ff6600', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

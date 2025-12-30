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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import api from '../../src/services/api';

interface HospitalUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  hospitalName?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export default function HospitalsManagement() {
  const { colors, isDark } = useTheme();
  const [hospitalUsers, setHospitalUsers] = useState<HospitalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<HospitalUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '', password: '', hospitalName: '', department: '' });
  const [selectedUser, setSelectedUser] = useState<HospitalUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchHospitalUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/hospital-users');
      const data = response.data || [];
      setHospitalUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch hospital users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalUsers();
  }, [fetchHospitalUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(hospitalUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = hospitalUsers.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.hospitalName?.toLowerCase().includes(query) ||
          user.department?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, hospitalUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHospitalUsers();
    setRefreshing(false);
  };

  const handleAddHospital = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone || !newUser.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await api.post('/admin/hospital-users', newUser);
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', phone: '', password: '', hospitalName: '', department: '' });
      fetchHospitalUsers();
      Alert.alert('Success', 'Hospital user added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add hospital user');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Hospital User', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/hospital-users/${id}`);
            setHospitalUsers((prev) => prev.filter((u) => u._id !== id));
            Alert.alert('Success', 'Hospital user deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: HospitalUser }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => { setSelectedUser(item); setShowDetailsModal(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.avatarGradient}>
          <Ionicons name="medical" size={24} color="#fff" />
        </LinearGradient>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.fullName}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
        <View style={styles.meta}>
          {item.hospitalName && (
            <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="business" size={10} color="#ef4444" />
              <Text style={[styles.badgeText, { color: '#ef4444' }]}>{item.hospitalName}</Text>
            </View>
          )}
          {item.department && (
            <Text style={[styles.deptText, { color: colors.textTertiary }]}>{item.department}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#ef4444', '#dc2626']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Hospitals Management</Text>
            <Text style={styles.headerSubtitle}>{hospitalUsers.length} hospital users</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, hospital..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hospital users found</Text>
            </View>
          }
        />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Hospital User</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Full Name *"
              placeholderTextColor={colors.textTertiary}
              value={newUser.fullName}
              onChangeText={(text) => setNewUser({ ...newUser, fullName: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Email *"
              placeholderTextColor={colors.textTertiary}
              value={newUser.email}
              onChangeText={(text) => setNewUser({ ...newUser, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Phone *"
              placeholderTextColor={colors.textTertiary}
              value={newUser.phone}
              onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Password *"
              placeholderTextColor={colors.textTertiary}
              value={newUser.password}
              onChangeText={(text) => setNewUser({ ...newUser, password: text })}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Hospital Name"
              placeholderTextColor={colors.textTertiary}
              value={newUser.hospitalName}
              onChangeText={(text) => setNewUser({ ...newUser, hospitalName: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Department"
              placeholderTextColor={colors.textTertiary}
              value={newUser.department}
              onChangeText={(text) => setNewUser({ ...newUser, department: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleAddHospital}>
                <Text style={styles.submitBtnText}>Add Hospital</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent onRequestClose={() => setShowDetailsModal(false)}>
        <View style={styles.detailsOverlay}>
          <View style={[styles.detailsContent, { backgroundColor: colors.background }]}>
            <View style={styles.detailsHeader}>
              <Text style={[styles.detailsTitle, { color: colors.text }]}>Hospital Staff Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsUserHeader}>
                  <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.detailsAvatar}>
                    <Ionicons name="medical" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.detailsUserName, { color: colors.text }]}>{selectedUser.fullName}</Text>
                  <View style={[styles.detailsRoleBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                    <Ionicons name="medkit" size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '600' }}>Hospital Staff</Text>
                  </View>
                </View>
                <View style={styles.detailsSection}>
                  <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.detailsIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                      <Ionicons name="mail" size={20} color="#ef4444" />
                    </View>
                    <View style={styles.detailsInfo}>
                      <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Email</Text>
                      <Text style={[styles.detailsValue, { color: colors.text }]}>{selectedUser.email}</Text>
                    </View>
                  </View>
                  <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.detailsIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                      <Ionicons name="call" size={20} color="#10b981" />
                    </View>
                    <View style={styles.detailsInfo}>
                      <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Phone</Text>
                      <Text style={[styles.detailsValue, { color: colors.text }]}>{selectedUser.phone}</Text>
                    </View>
                  </View>
                  {selectedUser.hospitalName && (
                    <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                      <View style={[styles.detailsIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                        <Ionicons name="business" size={20} color="#f59e0b" />
                      </View>
                      <View style={styles.detailsInfo}>
                        <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Hospital</Text>
                        <Text style={[styles.detailsValue, { color: colors.text }]}>{selectedUser.hospitalName}</Text>
                      </View>
                    </View>
                  )}
                  {selectedUser.department && (
                    <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                      <View style={[styles.detailsIcon, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                        <Ionicons name="git-branch" size={20} color="#ff7a1a" />
                      </View>
                      <View style={styles.detailsInfo}>
                        <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Department</Text>
                        <Text style={[styles.detailsValue, { color: colors.text }]}>{selectedUser.department}</Text>
                      </View>
                    </View>
                  )}
                  <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.detailsIcon, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                      <Ionicons name="calendar" size={20} color="#ec4899" />
                    </View>
                    <View style={styles.detailsInfo}>
                      <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Joined</Text>
                      <Text style={[styles.detailsValue, { color: colors.text }]}>{formatDate(selectedUser.createdAt)}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.detailsDeleteBtn}
                  onPress={() => { setShowDetailsModal(false); handleDelete(selectedUser._id, selectedUser.fullName); }}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <Text style={styles.detailsDeleteText}>Delete Hospital User</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
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
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: 16, marginTop: -16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, gap: 12, elevation: 3 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
  avatar: { marginRight: 14 },
  avatarGradient: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  deptText: { fontSize: 11 },
  deleteBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  input: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 15, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(107,114,128,0.15)' },
  cancelBtnText: { color: '#6b7280', fontWeight: '600' },
  submitBtn: { backgroundColor: '#ef4444' },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  // Details modal styles
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailsContent: { maxHeight: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  detailsTitle: { fontSize: 20, fontWeight: '700' },
  detailsUserHeader: { alignItems: 'center', paddingVertical: 24 },
  detailsAvatar: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  detailsUserName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  detailsRoleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  detailsSection: { paddingHorizontal: 20, gap: 12 },
  detailsCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  detailsIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  detailsInfo: { flex: 1 },
  detailsLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  detailsValue: { fontSize: 16, fontWeight: '600' },
  detailsDeleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', gap: 10 },
  detailsDeleteText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});

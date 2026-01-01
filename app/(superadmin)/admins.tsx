import { useState, useCallback } from 'react';
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
import { adminAPI } from '../../src/services/api';
import { useInfiniteList } from '../../src/hooks/useInfiniteList';
import { ListFooter } from '../../src/components/ListFooter';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

interface Admin {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminsManagement() {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const {
    data: admins,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    onEndReached,
    refetch,
  } = useInfiniteList<Admin>({
    queryKey: ['admins'],
    fetchFn: (params) => adminAPI.getAllAdmins(params),
    search: debouncedSearch,
    limit: 20,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAddAdmin = async () => {
    if (!newAdmin.fullName || !newAdmin.email || !newAdmin.phone || !newAdmin.password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await adminAPI.createAdmin(newAdmin);
      setShowAddModal(false);
      setNewAdmin({ fullName: '', email: '', phone: '', password: '' });
      refetch();
      Alert.alert('Success', 'Admin added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add admin');
    }
  };

  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    Alert.alert('Delete Admin', `Are you sure you want to delete ${adminName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminAPI.deleteAdmin(adminId);
            Alert.alert('Success', 'Admin deleted successfully');
            refetch();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete admin');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderAdmin = ({ item }: { item: Admin }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => { setSelectedAdmin(item); setShowDetailsModal(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <LinearGradient colors={['#ff7a1a', '#a855f7']} style={styles.avatarGradient}>
          <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'A'}</Text>
        </LinearGradient>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.fullName || 'Unknown'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
            <Ionicons name="shield" size={12} color="#ff7a1a" />
            <Text style={[styles.badgeText, { color: '#ff7a1a' }]}>Admin</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: item.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10b981' : '#6b7280' }]} />
            <Text style={[styles.badgeText, { color: item.isActive ? '#10b981' : '#6b7280' }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#ff7a1a', '#a855f7']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Admins Management</Text>
            <Text style={styles.headerSubtitle}>{admins.length} administrators</Text>
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
            placeholder="Search admins..."
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
          data={admins}
          renderItem={renderAdmin}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListFooterComponent={
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              dataLength={admins.length}
              primaryColor={colors.primary}
              textColor={colors.textTertiary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No admins found</Text>
            </View>
          }
        />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Admin</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={colors.textTertiary}
              value={newAdmin.fullName}
              onChangeText={(text) => setNewAdmin({ ...newAdmin, fullName: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={newAdmin.email}
              onChangeText={(text) => setNewAdmin({ ...newAdmin, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Phone"
              placeholderTextColor={colors.textTertiary}
              value={newAdmin.phone}
              onChangeText={(text) => setNewAdmin({ ...newAdmin, phone: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={newAdmin.password}
              onChangeText={(text) => setNewAdmin({ ...newAdmin, password: text })}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleAddAdmin}>
                <Text style={styles.submitBtnText}>Add Admin</Text>
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
              <Text style={[styles.detailsTitle, { color: colors.text }]}>Admin Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedAdmin && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsUserHeader}>
                  <LinearGradient colors={['#ff7a1a', '#a855f7']} style={styles.detailsAvatar}>
                    <Text style={styles.detailsAvatarText}>{selectedAdmin.fullName?.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <Text style={[styles.detailsUserName, { color: colors.text }]}>{selectedAdmin.fullName}</Text>
                  <View style={[styles.detailsRoleBadge, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                    <Ionicons name="shield" size={14} color="#ff7a1a" />
                    <Text style={{ color: '#ff7a1a', fontWeight: '600' }}>Administrator</Text>
                  </View>
                </View>
                <View style={styles.detailsSection}>
                  <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.detailsIcon, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                      <Ionicons name="mail" size={20} color="#ff7a1a" />
                    </View>
                    <View style={styles.detailsInfo}>
                      <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Email</Text>
                      <Text style={[styles.detailsValue, { color: colors.text }]}>{selectedAdmin.email}</Text>
                    </View>
                  </View>
                  <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.detailsIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                      <Ionicons name="call" size={20} color="#10b981" />
                    </View>
                    <View style={styles.detailsInfo}>
                      <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Phone</Text>
                      <Text style={[styles.detailsValue, { color: colors.text }]}>{selectedAdmin.phone}</Text>
                    </View>
                  </View>
                  <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.detailsIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                      <Ionicons name="calendar" size={20} color="#f59e0b" />
                    </View>
                    <View style={styles.detailsInfo}>
                      <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Joined</Text>
                      <Text style={[styles.detailsValue, { color: colors.text }]}>{formatDate(selectedAdmin.createdAt)}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.detailsDeleteBtn}
                  onPress={() => { setShowDetailsModal(false); handleDeleteAdmin(selectedAdmin._id, selectedAdmin.fullName); }}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <Text style={styles.detailsDeleteText}>Delete Admin</Text>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { marginRight: 14 },
  avatarGradient: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dateText: { fontSize: 11 },
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
  submitBtn: { backgroundColor: '#ff7a1a' },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  // Details modal styles
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailsContent: { maxHeight: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  detailsTitle: { fontSize: 20, fontWeight: '700' },
  detailsUserHeader: { alignItems: 'center', paddingVertical: 24 },
  detailsAvatar: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  detailsAvatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
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

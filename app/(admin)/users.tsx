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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { adminAPI } from '../../src/services/api';

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  bloodGroup?: string;
  address?: string;
  medicalConditions?: string[];
  emergencyContacts?: EmergencyContact[];
  isActive?: boolean;
  createdAt?: string;
}

interface NewUserData {
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: string;
  address: string;
  medicalConditions: string;
  emergencyContacts: EmergencyContact[];
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function UsersManagement() {
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [newUser, setNewUser] = useState<NewUserData>({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    address: '',
    medicalConditions: '',
    emergencyContacts: [],
  });

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

  const resetNewUser = () => {
    setNewUser({
      fullName: '',
      email: '',
      phone: '',
      bloodGroup: '',
      address: '',
      medicalConditions: '',
      emergencyContacts: [],
    });
  };

  const addEmergencyContact = () => {
    setNewUser({
      ...newUser,
      emergencyContacts: [...newUser.emergencyContacts, { name: '', relation: '', phone: '' }],
    });
  };

  const removeEmergencyContact = (index: number) => {
    const updated = [...newUser.emergencyContacts];
    updated.splice(index, 1);
    setNewUser({ ...newUser, emergencyContacts: updated });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...newUser.emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setNewUser({ ...newUser, emergencyContacts: updated });
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone) {
      Alert.alert('Error', 'Please fill in name, email, and phone');
      return;
    }
    if (newUser.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Validate emergency contacts
    const validContacts = newUser.emergencyContacts.filter(
      (c) => c.name.trim() && c.phone.trim() && c.relation.trim()
    );

    setIsSubmitting(true);
    try {
      await adminAPI.createUser({
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        bloodGroup: newUser.bloodGroup || undefined,
        address: newUser.address || undefined,
        medicalConditions: newUser.medicalConditions
          ? newUser.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        emergencyContacts: validContacts.length > 0 ? validContacts : undefined,
      });
      Alert.alert('Success', 'User created successfully');
      setShowAddModal(false);
      resetNewUser();
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

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userCard, { backgroundColor: colors.surface }]}
            onPress={() => handleUserPress(item)}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#ff6600', '#ff7a1a']} style={styles.avatar}>
              <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
            </LinearGradient>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{item.fullName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) + '20' }]}>
                  <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>
                {item.bloodGroup && (
                  <View style={[styles.roleBadge, { backgroundColor: '#ef444420' }]}>
                    <Text style={[styles.roleText, { color: '#ef4444' }]}>{item.bloodGroup}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteUser(item._id, item.fullName)}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
          </View>
        }
      />

      {/* Add User Modal - Enhanced */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add New User</Text>
                <TouchableOpacity onPress={() => { setShowAddModal(false); resetNewUser(); }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                {/* Basic Info */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>BASIC INFO</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Full Name *"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.fullName}
                  onChangeText={(t) => setNewUser({ ...newUser, fullName: t })}
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Email Address *"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.email}
                  onChangeText={(t) => setNewUser({ ...newUser, email: t })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="10-digit Phone Number *"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.phone}
                  onChangeText={(t) => setNewUser({ ...newUser, phone: t.replace(/\D/g, '').slice(0, 10) })}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                {/* Medical Info */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>MEDICAL INFO</Text>

                {/* Blood Group Picker */}
                <TouchableOpacity
                  style={[styles.modalInput, styles.pickerInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowBloodGroupPicker(!showBloodGroupPicker)}
                >
                  <Text style={{ color: newUser.bloodGroup ? colors.text : colors.textTertiary, flex: 1 }}>
                    {newUser.bloodGroup || 'Select Blood Group'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                {showBloodGroupPicker && (
                  <View style={[styles.pickerOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {BLOOD_GROUPS.map((bg) => (
                      <TouchableOpacity
                        key={bg}
                        style={[styles.pickerOption, newUser.bloodGroup === bg && { backgroundColor: colors.primary + '20' }]}
                        onPress={() => { setNewUser({ ...newUser, bloodGroup: bg }); setShowBloodGroupPicker(false); }}
                      >
                        <Text style={{ color: newUser.bloodGroup === bg ? colors.primary : colors.text, fontWeight: newUser.bloodGroup === bg ? '700' : '500' }}>{bg}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TextInput
                  style={[styles.modalInput, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Address"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.address}
                  onChangeText={(t) => setNewUser({ ...newUser, address: t })}
                  multiline
                  numberOfLines={2}
                />

                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Medical Conditions (comma-separated)"
                  placeholderTextColor={colors.textTertiary}
                  value={newUser.medicalConditions}
                  onChangeText={(t) => setNewUser({ ...newUser, medicalConditions: t })}
                />

                {/* Emergency Contacts */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 0, marginBottom: 0 }]}>EMERGENCY CONTACTS</Text>
                  <TouchableOpacity onPress={addEmergencyContact} style={styles.addContactBtn}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Add</Text>
                  </TouchableOpacity>
                </View>

                {newUser.emergencyContacts.map((contact, idx) => (
                  <View key={idx} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>Contact {idx + 1}</Text>
                      <TouchableOpacity onPress={() => removeEmergencyContact(idx)}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Name"
                      placeholderTextColor={colors.textTertiary}
                      value={contact.name}
                      onChangeText={(t) => updateEmergencyContact(idx, 'name', t)}
                    />
                    <TextInput
                      style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Relation (e.g., Father, Sister)"
                      placeholderTextColor={colors.textTertiary}
                      value={contact.relation}
                      onChangeText={(t) => updateEmergencyContact(idx, 'relation', t)}
                    />
                    <TextInput
                      style={[styles.contactInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Phone Number"
                      placeholderTextColor={colors.textTertiary}
                      value={contact.phone}
                      onChangeText={(t) => updateEmergencyContact(idx, 'phone', t.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                ))}

                {newUser.emergencyContacts.length === 0 && (
                  <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                    No emergency contacts added
                  </Text>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setShowAddModal(false); resetNewUser(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.submitBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
                  onPress={handleAddUser}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Create User</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* User Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent onRequestClose={() => setShowDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>User Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* User Avatar & Name */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <LinearGradient colors={['#ff6600', '#ff7a1a']} style={styles.detailsAvatar}>
                    <Text style={styles.detailsAvatarText}>{selectedUser.fullName?.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <Text style={[styles.detailsName, { color: colors.text }]}>{selectedUser.fullName}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(selectedUser.role) + '20', marginTop: 8 }]}>
                    <Text style={[styles.roleText, { color: getRoleBadgeColor(selectedUser.role) }]}>{selectedUser.role.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Contact Info */}
                <View style={[styles.detailsSection, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONTACT</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>+91 {selectedUser.phone}</Text>
                  </View>
                  {selectedUser.address && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.text }]}>{selectedUser.address}</Text>
                    </View>
                  )}
                </View>

                {/* Medical Info */}
                {(selectedUser.bloodGroup || (selectedUser.medicalConditions && selectedUser.medicalConditions.length > 0)) && (
                  <View style={[styles.detailsSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MEDICAL</Text>
                    {selectedUser.bloodGroup && (
                      <View style={styles.detailRow}>
                        <Ionicons name="water-outline" size={18} color="#ef4444" />
                        <Text style={[styles.detailText, { color: colors.text }]}>Blood Group: {selectedUser.bloodGroup}</Text>
                      </View>
                    )}
                    {selectedUser.medicalConditions && selectedUser.medicalConditions.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>Conditions:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {selectedUser.medicalConditions.map((c, i) => (
                            <View key={i} style={styles.conditionBadge}>
                              <Text style={styles.conditionText}>{c}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Emergency Contacts */}
                {selectedUser.emergencyContacts && selectedUser.emergencyContacts.length > 0 && (
                  <View style={[styles.detailsSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>EMERGENCY CONTACTS</Text>
                    {selectedUser.emergencyContacts.map((c, i) => (
                      <View key={i} style={[styles.contactRow, { borderBottomColor: colors.border }]}>
                        <View style={[styles.contactIcon, { backgroundColor: '#f9731620' }]}>
                          <Ionicons name="person" size={16} color="#f97316" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: '600' }}>{c.name}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{c.relation} • +91 {c.phone}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Account Info */}
                <View style={[styles.detailsSection, { backgroundColor: colors.surface, marginBottom: 20 }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>Joined: {formatDate(selectedUser.createdAt)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name={selectedUser.isActive !== false ? 'checkmark-circle-outline' : 'close-circle-outline'} size={18} color={selectedUser.isActive !== false ? '#10b981' : '#ef4444'} />
                    <Text style={[styles.detailText, { color: selectedUser.isActive !== false ? '#10b981' : '#ef4444' }]}>
                      {selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
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
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  textArea: { height: 70, textAlignVertical: 'top', paddingTop: 12 },
  pickerInput: { flexDirection: 'row', alignItems: 'center' },
  pickerOptions: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  pickerOption: { paddingVertical: 12, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(107,114,128,0.15)' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  submitBtn: { backgroundColor: '#ff6600' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Emergency Contacts styles
  addContactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  contactCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  contactInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },

  // Details Modal styles
  detailsAvatar: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  detailsAvatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  detailsName: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  detailsSection: { borderRadius: 16, padding: 16, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  detailText: { fontSize: 14, flex: 1 },
  conditionBadge: { backgroundColor: '#ef444415', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ef444430' },
  conditionText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  contactIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});

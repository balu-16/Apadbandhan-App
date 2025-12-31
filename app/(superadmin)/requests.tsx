import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { partnersAPI } from '../../src/services/api';

interface PartnerRequest {
  _id: string;
  partnerType: 'hospital' | 'police' | 'ranger';
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  registrationNumber?: string;
  specialization?: string;
  hospitalType?: 'government' | 'private';
  jurisdiction?: string;
  coverageArea?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  additionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const partnerTypeConfig: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  hospital: { icon: 'medical', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', label: 'Hospital' },
  police: { icon: 'shield', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', label: 'Police' },
  ranger: { icon: 'leaf', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', label: 'Ranger' },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', label: 'Pending' },
  approved: { color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', label: 'Approved' },
  rejected: { color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', label: 'Rejected' },
};

export default function SuperAdminRequestsScreen() {
  const { colors, isDark } = useTheme();

  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filteredRequests, setFilteredRequests] = useState<PartnerRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const response = await partnersAPI.getAll();
      const data = response.data || [];
      setRequests(data);
      setFilteredRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await partnersAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  useEffect(() => {
    let filtered = requests;
    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.partnerType === filterType);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.organizationName?.toLowerCase().includes(query) ||
          r.contactPerson?.toLowerCase().includes(query) ||
          r.email?.toLowerCase().includes(query)
      );
    }
    setFilteredRequests(filtered);
  }, [searchQuery, requests, filterStatus, filterType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRequests(), fetchStats()]);
    setRefreshing(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    setIsUpdating(true);
    try {
      await partnersAPI.update(id, { status: newStatus, reviewNotes });
      Alert.alert('Success', `Request ${newStatus} successfully`);
      await fetchRequests();
      await fetchStats();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update request status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await partnersAPI.delete(id);
              Alert.alert('Success', 'Request deleted successfully');
              await fetchRequests();
              await fetchStats();
              setSelectedRequest(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderRequest = ({ item }: { item: PartnerRequest }) => {
    const typeConfig = partnerTypeConfig[item.partnerType] || partnerTypeConfig.hospital;
    const status = statusConfig[item.status] || statusConfig.pending;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => {
          setSelectedRequest(item);
          setReviewNotes(item.reviewNotes || '');
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.typeIndicator, { backgroundColor: typeConfig.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: typeConfig.bgColor }]}>
              <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.orgName, { color: colors.text }]} numberOfLines={1}>
                {item.organizationName}
              </Text>
              <Text style={[styles.contactName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.contactPerson}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>{item.city}, {item.state}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={isDark ? ['#0f1729', '#16213e'] : ['#ff6600', '#ff7a1a']} style={styles.header}>
        <Text style={styles.headerTitle}>Partner Requests</Text>
        <Text style={styles.headerSubtitle}>Manage partnership applications</Text>
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#fef3c7' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#d1fae5' }]}>{stats.approved}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#fecaca' }]}>{stats.rejected}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filtersContainer}>
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && { backgroundColor: colors.primary }]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterText, { color: filterStatus === status ? '#fff' : colors.textSecondary }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filter */}
      <View style={[styles.filtersContainer, { marginTop: 8 }]}>
        {[
          { key: 'all', label: 'All Types' },
          { key: 'hospital', label: 'Hospital' },
          { key: 'police', label: 'Police' },
          { key: 'ranger', label: 'Ranger' },
        ].map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.filterChip,
              filterType === type.key && { backgroundColor: partnerTypeConfig[type.key]?.color || colors.primary },
            ]}
            onPress={() => setFilterType(type.key)}
          >
            <Text style={[styles.filterText, { color: filterType === type.key ? '#fff' : colors.textSecondary }]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search organizations..."
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
          data={filteredRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Requests Found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'No partner requests submitted yet'}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedRequest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Request Details</Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedRequest && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Organization Section */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ORGANIZATION</Text>
                  <Text style={[styles.orgNameLarge, { color: colors.text }]}>{selectedRequest.organizationName}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: partnerTypeConfig[selectedRequest.partnerType]?.bgColor }]}>
                    <Ionicons name={partnerTypeConfig[selectedRequest.partnerType]?.icon as any} size={14} color={partnerTypeConfig[selectedRequest.partnerType]?.color} />
                    <Text style={[styles.typeBadgeText, { color: partnerTypeConfig[selectedRequest.partnerType]?.color }]}>
                      {partnerTypeConfig[selectedRequest.partnerType]?.label}
                    </Text>
                  </View>
                </View>

                {/* Contact Section */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONTACT INFORMATION</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{selectedRequest.contactPerson}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{selectedRequest.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{selectedRequest.phone}</Text>
                  </View>
                  {selectedRequest.registrationNumber && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.text }]}>Reg: {selectedRequest.registrationNumber}</Text>
                    </View>
                  )}
                </View>

                {/* Address Section */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ADDRESS</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {selectedRequest.address}, {selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}
                    </Text>
                  </View>
                </View>

                {/* GPS Coordinates Section */}
                {(selectedRequest.latitude || selectedRequest.longitude) && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GPS COORDINATES</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
                      <View style={styles.detailRow}>
                        <Ionicons name="navigate-outline" size={16} color="#22c55e" />
                        <Text style={[styles.detailText, { color: colors.text }]}>Lat: {selectedRequest.latitude || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="navigate-outline" size={16} color="#3b82f6" />
                        <Text style={[styles.detailText, { color: colors.text }]}>Long: {selectedRequest.longitude || 'N/A'}</Text>
                      </View>
                    </View>
                    {selectedRequest.latitude && selectedRequest.longitude && (
                      <TouchableOpacity
                        style={[styles.mapButton, { backgroundColor: colors.primary + '20' }]}
                        onPress={() => Linking.openURL(`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`)}
                      >
                        <Ionicons name="map-outline" size={16} color={colors.primary} />
                        <Text style={[styles.mapButtonText, { color: colors.primary }]}>Open in Google Maps</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Additional Details Section */}
                {(selectedRequest.hospitalType || selectedRequest.specialization || selectedRequest.jurisdiction || selectedRequest.coverageArea) && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ADDITIONAL DETAILS</Text>
                    {selectedRequest.hospitalType && (
                      <View style={styles.detailRow}>
                        <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          Type: <Text style={{ color: selectedRequest.hospitalType === 'government' ? '#3b82f6' : '#22c55e', fontWeight: '600' }}>
                            {selectedRequest.hospitalType.charAt(0).toUpperCase() + selectedRequest.hospitalType.slice(1)} Hospital
                          </Text>
                        </Text>
                      </View>
                    )}
                    {selectedRequest.specialization && (
                      <View style={styles.detailRow}>
                        <Ionicons name="medkit-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>Specialization: {selectedRequest.specialization}</Text>
                      </View>
                    )}
                    {selectedRequest.jurisdiction && (
                      <View style={styles.detailRow}>
                        <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>Jurisdiction: {selectedRequest.jurisdiction}</Text>
                      </View>
                    )}
                    {selectedRequest.coverageArea && (
                      <View style={styles.detailRow}>
                        <Ionicons name="expand-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.text }]}>Coverage: {selectedRequest.coverageArea}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Additional Info Section */}
                {selectedRequest.additionalInfo && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ADDITIONAL INFORMATION</Text>
                    <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.infoBoxText, { color: colors.text }]}>{selectedRequest.additionalInfo}</Text>
                    </View>
                  </View>
                )}

                {/* Status Section */}
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>STATUS</Text>
                  <View style={[styles.statusBadgeLarge, { backgroundColor: statusConfig[selectedRequest.status]?.bgColor }]}>
                    <Text style={[styles.statusTextLarge, { color: statusConfig[selectedRequest.status]?.color }]}>
                      {statusConfig[selectedRequest.status]?.label}
                    </Text>
                  </View>
                </View>

                {/* Review Notes Input (for pending requests) */}
                {selectedRequest.status === 'pending' && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REVIEW NOTES (OPTIONAL)</Text>
                    <TextInput
                      style={[styles.reviewNotesInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholder="Add notes about this request..."
                      placeholderTextColor={colors.textTertiary}
                      value={reviewNotes}
                      onChangeText={setReviewNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                )}

                {/* Existing Review Notes (for approved/rejected) */}
                {selectedRequest.reviewNotes && selectedRequest.status !== 'pending' && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REVIEW NOTES</Text>
                    <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.infoBoxText, { color: colors.text }]}>{selectedRequest.reviewNotes}</Text>
                    </View>
                    {selectedRequest.reviewedAt && (
                      <Text style={[styles.timestampText, { color: colors.textTertiary }]}>
                        Reviewed on {formatDate(selectedRequest.reviewedAt)}
                      </Text>
                    )}
                  </View>
                )}

                {/* Timestamps Section */}
                <View style={[styles.detailSection, { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }]}>
                  <Text style={[styles.timestampText, { color: colors.textTertiary }]}>
                    Submitted: {formatDate(selectedRequest.createdAt)}
                  </Text>
                  <Text style={[styles.timestampText, { color: colors.textTertiary }]}>
                    Updated: {formatDate(selectedRequest.updatedAt)}
                  </Text>
                </View>

                {/* Action Buttons */}
                {selectedRequest.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleStatusUpdate(selectedRequest._id, 'approved')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={20} color="#fff" />
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleStatusUpdate(selectedRequest._id, 'rejected')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close" size={20} color="#fff" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: colors.error }]}
                  onPress={() => handleDelete(selectedRequest._id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Request</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
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
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -10, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { fontSize: 12, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, marginTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 120 },
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 2, flexDirection: 'row' },
  typeIndicator: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  orgName: { fontSize: 15, fontWeight: '700' },
  contactName: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', marginTop: 10, gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { paddingBottom: 20 },
  detailSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  orgNameLarge: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  detailText: { flex: 1, fontSize: 14 },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  statusTextLarge: { fontSize: 14, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  approveBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8, marginTop: 12 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, gap: 8 },
  mapButtonText: { fontSize: 14, fontWeight: '600' },
  infoBox: { padding: 12, borderRadius: 10 },
  infoBoxText: { fontSize: 14, lineHeight: 20 },
  reviewNotesInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, minHeight: 80 },
  timestampText: { fontSize: 11, fontWeight: '500' },
});

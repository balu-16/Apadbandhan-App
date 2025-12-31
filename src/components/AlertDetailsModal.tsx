import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';

export interface RespondedByInfo {
  responderId: string;
  role: 'police' | 'hospital';
  name: string;
  phone: string;
  respondedAt: string;
}

export interface AlertItem {
  _id: string;
  type: string;
  source?: 'alert' | 'sos';
  status: string;
  severity?: string;
  createdAt: string;
  resolvedAt?: string;
  currentSearchRadius?: number;
  respondedBy?: RespondedByInfo[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  userId?: {
    fullName?: string;
    phone?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    createdAt?: string;
    bloodGroup?: string;
    medicalConditions?: string[];
    address?: string;
    emergencyContacts?: { name: string; relation: string; phone: string; }[];
    devices?: { _id: string; name: string; code: string; status: string; }[];
  };
}

interface Props {
  visible: boolean;
  alert: AlertItem | null;
  onClose: () => void;
  colors: any;
  userRole?: 'police' | 'hospital' | 'admin' | 'superadmin';
  onUpdateStatus?: (alertId: string, newStatus: 'assigned' | 'resolved') => void;
}

export default function AlertDetailsModal({ visible, alert, onClose, colors, userRole, onUpdateStatus }: Props) {
  if (!alert) return null;
  const user = alert.userId;
  const hasLoc = alert.location?.latitude && alert.location?.longitude;
  const srcColor = alert.source === 'sos' ? '#a855f7' : '#f97316';
  const isResolved = alert.status === 'resolved';

  const call = (p: string) => Linking.openURL(`tel:+91${p}`);
  const openMap = () => {
    if (!hasLoc) return;
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${alert.location!.latitude},${alert.location!.longitude}`
      : `geo:0,0?q=${alert.location!.latitude},${alert.location!.longitude}`;
    Linking.openURL(url);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.c, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={s.h}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={s.hContent}>
            <Text style={[s.t, { color: colors.text }]}>{alert.type || 'Emergency'}</Text>
            <View style={s.badges}>
              <View style={[s.b, { backgroundColor: srcColor + '20' }]}>
                <Text style={[s.bt, { color: srcColor }]}>{alert.source?.toUpperCase() || 'ALERT'}</Text>
              </View>
              <View style={[s.b, { backgroundColor: isResolved ? '#10b98120' : '#ef444420', marginLeft: 8 }]}>
                <Text style={[s.bt, { color: isResolved ? '#10b981' : '#ef4444' }]}>{alert.status?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              {formatDate(alert.createdAt)}
            </Text>
          </View>
        </View>

        <ScrollView style={s.sc} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Location Section */}
          {hasLoc && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="location" size={18} color="#ef4444" />
                <Text style={[s.st, { color: colors.text }]}>Emergency Location</Text>
              </View>

              <View style={s.mapContainer}>
                <MapView
                  style={s.map}
                  initialRegion={{
                    latitude: alert.location!.latitude!,
                    longitude: alert.location!.longitude!,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }}
                  scrollEnabled={false}
                >
                  <Circle
                    center={{ latitude: alert.location!.latitude!, longitude: alert.location!.longitude! }}
                    radius={50}
                    fillColor="rgba(239, 68, 68, 0.3)"
                    strokeColor="#ef4444"
                    strokeWidth={2}
                  />
                  <Marker
                    coordinate={{ latitude: alert.location!.latitude!, longitude: alert.location!.longitude! }}
                    pinColor="#ef4444"
                  />
                </MapView>
              </View>

              <View style={s.coordsRow}>
                <View style={[s.coordBox, { backgroundColor: colors.background }]}>
                  <Text style={[s.coordLabel, { color: colors.textSecondary }]}>Lat</Text>
                  <Text style={[s.coordVal, { color: colors.text }]}>{alert.location!.latitude?.toFixed(6)}</Text>
                </View>
                <View style={[s.coordBox, { backgroundColor: colors.background }]}>
                  <Text style={[s.coordLabel, { color: colors.textSecondary }]}>Lng</Text>
                  <Text style={[s.coordVal, { color: colors.text }]}>{alert.location!.longitude?.toFixed(6)}</Text>
                </View>
              </View>

              {alert.location?.address && (
                <View style={[s.addrBox, { backgroundColor: colors.background }]}>
                  <Text style={[s.coordLabel, { color: colors.textSecondary }]}>Address</Text>
                  <Text style={[s.addrText, { color: colors.text }]}>{alert.location.address}</Text>
                </View>
              )}

              <TouchableOpacity style={s.mb} onPress={openMap}>
                <Ionicons name="map-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.mbt}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* User Details Section */}
          {user && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="person" size={18} color="#3b82f6" />
                <Text style={[s.st, { color: colors.text }]}>Victim Information</Text>
              </View>

              <View style={s.userHeader}>
                <View style={[s.avatar, { backgroundColor: '#3b82f620' }]}>
                  <Ionicons name="person" size={24} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.userName, { color: colors.text }]}>{user.fullName || 'Unknown User'}</Text>
                  <View style={s.userBadges}>
                    {user.role && <View style={s.roleBadge}><Text style={s.roleText}>{user.role}</Text></View>}
                    {user.isActive !== undefined && (
                      <View style={[s.activeBadge, { backgroundColor: user.isActive ? '#10b98120' : '#ef444420' }]}>
                        <Text style={[s.activeText, { color: user.isActive ? '#10b981' : '#ef4444' }]}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={s.infoList}>
                {user.phone && (
                  <TouchableOpacity style={[s.r, { backgroundColor: colors.background }]} onPress={() => call(user.phone!)}>
                    <View style={[s.iconBox, { backgroundColor: '#10b98120' }]}><Ionicons name="call" size={16} color="#10b981" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>Phone</Text>
                      <Text style={[s.val, { color: colors.text }]}>+91 {user.phone}</Text>
                    </View>
                    <Text style={s.cb}>Call</Text>
                  </TouchableOpacity>
                )}
                {user.email && (
                  <View style={[s.r, { backgroundColor: colors.background }]}>
                    <View style={[s.iconBox, { backgroundColor: '#3b82f620' }]}><Ionicons name="mail" size={16} color="#3b82f6" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
                      <Text style={[s.val, { color: colors.text }]}>{user.email}</Text>
                    </View>
                  </View>
                )}
                {user.address && (
                  <View style={[s.r, { backgroundColor: colors.background }]}>
                    <View style={[s.iconBox, { backgroundColor: '#a855f720' }]}><Ionicons name="home" size={16} color="#a855f7" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>Home Address</Text>
                      <Text style={[s.val, { color: colors.text }]}>{user.address}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Medical Info */}
          {user && (user.bloodGroup || (user.medicalConditions && user.medicalConditions.length > 0)) && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="medical" size={18} color="#ef4444" />
                <Text style={[s.st, { color: colors.text }]}>Medical Information</Text>
              </View>

              <View style={s.medGrid}>
                {user.bloodGroup && (
                  <View style={[s.medBox, { backgroundColor: colors.background }]}>
                    <Ionicons name="water" size={20} color="#ef4444" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>Blood Group</Text>
                      <Text style={[s.medVal, { color: colors.text }]}>{user.bloodGroup}</Text>
                    </View>
                  </View>
                )}
                {user.createdAt && (
                  <View style={[s.medBox, { backgroundColor: colors.background }]}>
                    <Ionicons name="calendar" size={20} color="#f59e0b" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>Member Since</Text>
                      <Text style={[s.medVal, { color: colors.text }]}>{new Date(user.createdAt).getFullYear()}</Text>
                    </View>
                  </View>
                )}
              </View>

              {user.medicalConditions && user.medicalConditions.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[s.label, { color: colors.textSecondary, marginBottom: 8 }]}>Conditions</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {user.medicalConditions.map((c, i) => (
                      <View key={i} style={s.condBadge}>
                        <Text style={s.condText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Emergency Contacts */}
          {user?.emergencyContacts && user.emergencyContacts.length > 0 && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="people" size={18} color="#f97316" />
                <Text style={[s.st, { color: colors.text }]}>Emergency Contacts</Text>
              </View>
              {user.emergencyContacts.map((c, i) => (
                <TouchableOpacity key={i} style={[s.r, { backgroundColor: colors.background }]} onPress={() => call(c.phone)}>
                  <View style={[s.iconBox, { backgroundColor: '#f9731620' }]}><Ionicons name="person" size={16} color="#f97316" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.contactName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[s.contactRel, { color: colors.textSecondary }]}>{c.relation} • +91 {c.phone}</Text>
                  </View>
                  <Text style={s.cb}>Call</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Devices */}
          {user?.devices && user.devices.length > 0 && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="phone-portrait" size={18} color="#8b5cf6" />
                <Text style={[s.st, { color: colors.text }]}>Registered Devices</Text>
              </View>
              {user.devices.map((d, i) => (
                <View key={i} style={[s.r, { backgroundColor: colors.background }]}>
                  <View style={[s.iconBox, { backgroundColor: '#8b5cf620' }]}><Ionicons name="hardware-chip" size={16} color="#8b5cf6" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.deviceName, { color: colors.text }]}>{d.name}</Text>
                    <Text style={[s.deviceCode, { color: colors.textSecondary }]}>{d.code}</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: d.status === 'online' ? '#10b981' : '#9ca3af' }]} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 6 }}>{d.status}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Response Status - Shows Police/Hospital response */}
          {alert.source === 'sos' && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                <Text style={[s.st, { color: colors.text }]}>Response Status</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Police Response */}
                {(() => {
                  const policeResponder = alert.respondedBy?.find(r => r.role === 'police');
                  return (
                    <View style={[s.responseCard, {
                      backgroundColor: policeResponder ? '#10b98115' : '#f59e0b15',
                      borderColor: policeResponder ? '#10b98140' : '#f59e0b40',
                    }]}>
                      <View style={[s.responseIcon, { backgroundColor: policeResponder ? '#10b98120' : '#3b82f620' }]}>
                        <Ionicons name="shield" size={20} color={policeResponder ? '#10b981' : '#3b82f6'} />
                      </View>
                      <Text style={[s.responseRole, { color: '#3b82f6' }]}>Police</Text>
                      <View style={[s.responseBadge, { backgroundColor: policeResponder ? '#10b98120' : '#f59e0b20' }]}>
                        <Text style={[s.responseBadgeText, { color: policeResponder ? '#10b981' : '#f59e0b' }]}>
                          {policeResponder ? 'Responded' : 'Waiting'}
                        </Text>
                      </View>
                      {policeResponder ? (
                        <View style={{ marginTop: 8 }}>
                          <Text style={[s.responderName, { color: colors.text }]}>{policeResponder.name}</Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>+91 {policeResponder.phone}</Text>
                          <TouchableOpacity
                            style={s.callBtn}
                            onPress={() => Linking.openURL(`tel:+91${policeResponder.phone}`)}
                          >
                            <Ionicons name="call" size={14} color="#fff" />
                            <Text style={s.callBtnText}>Call</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Waiting...</Text>
                      )}
                    </View>
                  );
                })()}

                {/* Hospital Response */}
                {(() => {
                  const hospitalResponder = alert.respondedBy?.find(r => r.role === 'hospital');
                  return (
                    <View style={[s.responseCard, {
                      backgroundColor: hospitalResponder ? '#10b98115' : '#f59e0b15',
                      borderColor: hospitalResponder ? '#10b98140' : '#f59e0b40',
                    }]}>
                      <View style={[s.responseIcon, { backgroundColor: hospitalResponder ? '#10b98120' : '#ef444420' }]}>
                        <FontAwesome5 name="hospital" size={16} color={hospitalResponder ? '#10b981' : '#ef4444'} />
                      </View>
                      <Text style={[s.responseRole, { color: '#ef4444' }]}>Hospital</Text>
                      <View style={[s.responseBadge, { backgroundColor: hospitalResponder ? '#10b98120' : '#f59e0b20' }]}>
                        <Text style={[s.responseBadgeText, { color: hospitalResponder ? '#10b981' : '#f59e0b' }]}>
                          {hospitalResponder ? 'Responded' : 'Waiting'}
                        </Text>
                      </View>
                      {hospitalResponder ? (
                        <View style={{ marginTop: 8 }}>
                          <Text style={[s.responderName, { color: colors.text }]}>{hospitalResponder.name}</Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>+91 {hospitalResponder.phone}</Text>
                          <TouchableOpacity
                            style={[s.callBtn, { backgroundColor: '#ef4444' }]}
                            onPress={() => Linking.openURL(`tel:+91${hospitalResponder.phone}`)}
                          >
                            <Ionicons name="call" size={14} color="#fff" />
                            <Text style={s.callBtnText}>Call</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Waiting...</Text>
                      )}
                    </View>
                  );
                })()}
              </View>
              {alert.currentSearchRadius && alert.status !== 'resolved' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}>
                  <Ionicons name="navigate" size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Search radius: {(alert.currentSearchRadius / 1000).toFixed(0)}km
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Timeline */}
          <View style={[s.sec, { backgroundColor: colors.surface }]}>
            <View style={s.secHeader}>
              <Ionicons name="time" size={18} color="#6b7280" />
              <Text style={[s.st, { color: colors.text }]}>Alert Timeline</Text>
            </View>
            <View style={s.timelineItem}>
              <View style={s.tlDot} />
              <Text style={[s.tlLabel, { color: colors.textSecondary }]}>Triggered</Text>
              <Text style={[s.tlVal, { color: colors.text }]}>{formatDate(alert.createdAt)}</Text>
            </View>
            {alert.resolvedAt && (
              <View style={[s.timelineItem, { marginTop: 12 }]}>
                <View style={[s.tlDot, { backgroundColor: '#10b981' }]} />
                <Text style={[s.tlLabel, { color: colors.textSecondary }]}>Resolved</Text>
                <Text style={[s.tlVal, { color: colors.text }]}>{formatDate(alert.resolvedAt)}</Text>
              </View>
            )}
            {alert.severity && (
              <View style={[s.timelineItem, { marginTop: 12 }]}>
                <View style={[s.tlDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[s.tlLabel, { color: colors.textSecondary }]}>Severity</Text>
                <Text style={[s.tlVal, { color: colors.text }]}>{alert.severity.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons - Only show for police/hospital users on pending/assigned alerts */}
          {onUpdateStatus && userRole && ['police', 'hospital'].includes(userRole) && !isResolved && (
            <View style={[s.sec, { backgroundColor: colors.surface }]}>
              <View style={s.secHeader}>
                <Ionicons name="flash" size={18} color="#f97316" />
                <Text style={[s.st, { color: colors.text }]}>Quick Actions</Text>
              </View>
              <View style={s.actionRow}>
                {alert.status === 'pending' && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#3b82f6' }]}
                    onPress={() => { onUpdateStatus(alert._id, 'assigned'); onClose(); }}
                  >
                    <Ionicons name="hand-right" size={20} color="#fff" />
                    <Text style={s.actionBtnText}>Respond</Text>
                  </TouchableOpacity>
                )}
                {(alert.status === 'pending' || alert.status === 'assigned') && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#10b981' }]}
                    onPress={() => { onUpdateStatus(alert._id, 'resolved'); onClose(); }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={s.actionBtnText}>Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50 },
  closeBtn: { padding: 8, marginRight: 8 },
  hContent: { flex: 1 },
  t: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  badges: { flexDirection: 'row' },
  b: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bt: { fontSize: 10, fontWeight: '800' },
  sc: { flex: 1, padding: 16 },
  sec: { marginBottom: 16, borderRadius: 16, padding: 16, overflow: 'hidden' },
  secHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  st: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  mapContainer: { borderRadius: 12, overflow: 'hidden', height: 160, marginBottom: 12 },
  map: { width: '100%', height: '100%' },
  coordsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  coordBox: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  coordLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  coordVal: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600', marginTop: 2 },
  addrBox: { padding: 10, borderRadius: 8, marginBottom: 12 },
  addrText: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  mb: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  mbt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userName: { fontSize: 18, fontWeight: '700' },
  userBadges: { flexDirection: 'row', marginTop: 4, gap: 6 },
  roleBadge: { backgroundColor: '#e5e7eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 10, fontWeight: '600', color: '#374151', textTransform: 'uppercase' },
  activeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

  infoList: { gap: 10 },
  r: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  label: { fontSize: 11, marginBottom: 2 },
  val: { fontSize: 14, fontWeight: '600' },
  cb: { color: '#10b981', fontWeight: '700', fontSize: 12 },

  contactName: { fontSize: 14, fontWeight: '600' },
  contactRel: { fontSize: 12 },

  medGrid: { flexDirection: 'row', gap: 10 },
  medBox: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  medVal: { fontSize: 16, fontWeight: '700' },
  condBadge: { backgroundColor: '#ef444415', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ef444430' },
  condText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

  deviceName: { fontSize: 14, fontWeight: '600' },
  deviceCode: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  responseCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  responseIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  responseRole: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  responseBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  responseBadgeText: { fontSize: 10, fontWeight: '700' },
  responderName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, gap: 4 },
  callBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  timelineItem: { flexDirection: 'row', alignItems: 'center' },
  tlDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6b7280', marginRight: 12 },
  tlLabel: { width: 80, fontSize: 13 },
  tlVal: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

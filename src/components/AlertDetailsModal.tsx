import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';

export interface AlertItem {
  _id: string;
  type: string;
  source?: 'alert' | 'sos';
  status: string;
  createdAt: string;
  location?: { latitude?: number; longitude?: number; };
  userId?: {
    fullName?: string;
    phone?: string;
    email?: string;
    bloodGroup?: string;
    emergencyContacts?: { name: string; relation: string; phone: string; }[];
  };
}

interface Props {
  visible: boolean;
  alert: AlertItem | null;
  onClose: () => void;
  colors: any;
}

export default function AlertDetailsModal({ visible, alert, onClose, colors }: Props) {
  if (!alert) return null;
  const user = alert.userId;
  const hasLoc = alert.location?.latitude && alert.location?.longitude;
  const srcColor = alert.source === 'sos' ? '#a855f7' : '#f97316';

  const call = (p: string) => Linking.openURL(`tel:+91${p}`);
  const openMap = () => {
    if (!hasLoc) return;
    const url = Platform.OS === 'ios' 
      ? `maps:0,0?q=${alert.location!.latitude},${alert.location!.longitude}`
      : `geo:0,0?q=${alert.location!.latitude},${alert.location!.longitude}`;
    Linking.openURL(url);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.c, { backgroundColor: colors.background }]}>
        <View style={s.h}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
          <Text style={[s.t, { color: colors.text }]}>{alert.type || 'Emergency'}</Text>
          <View style={[s.b, { backgroundColor: srcColor }]}><Text style={s.bt}>{alert.source?.toUpperCase()}</Text></View>
        </View>
        <ScrollView style={s.sc}>
          {hasLoc && (
            <View style={s.sec}>
              <Text style={[s.st, { color: colors.text }]}>📍 Location</Text>
              <MapView style={s.map} initialRegion={{ latitude: alert.location!.latitude!, longitude: alert.location!.longitude!, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
                <Circle
                  center={{ latitude: alert.location!.latitude!, longitude: alert.location!.longitude! }}
                  radius={50}
                  fillColor="rgba(239, 68, 68, 0.3)"
                  strokeColor="#ef4444"
                  strokeWidth={3}
                />
                <Marker 
                  coordinate={{ latitude: alert.location!.latitude!, longitude: alert.location!.longitude! }}
                  pinColor="#ef4444"
                  title="🚨 SOS Location"
                />
              </MapView>
              <TouchableOpacity style={s.mb} onPress={openMap}><Text style={s.mbt}>Open in Maps</Text></TouchableOpacity>
            </View>
          )}
          {user && (
            <View style={s.sec}>
              <Text style={[s.st, { color: colors.text }]}>👤 Victim: {user.fullName}</Text>
              {user.phone && <TouchableOpacity style={[s.r, { backgroundColor: colors.surface }]} onPress={() => call(user.phone!)}><Ionicons name="call" size={20} color="#10b981" /><Text style={{ color: colors.text, flex: 1, marginLeft: 10 }}>+91 {user.phone}</Text><Text style={s.cb}>Call</Text></TouchableOpacity>}
              {user.email && <View style={[s.r, { backgroundColor: colors.surface }]}><Ionicons name="mail" size={20} color="#3b82f6" /><Text style={{ color: colors.text, marginLeft: 10 }}>{user.email}</Text></View>}
              {user.bloodGroup && <View style={[s.r, { backgroundColor: colors.surface }]}><Ionicons name="water" size={20} color="#ef4444" /><Text style={{ color: colors.text, marginLeft: 10 }}>Blood: {user.bloodGroup}</Text></View>}
            </View>
          )}
          {user?.emergencyContacts?.map((c, i) => (
            <TouchableOpacity key={i} style={[s.r, { backgroundColor: colors.surface }]} onPress={() => call(c.phone)}>
              <Ionicons name="person" size={20} color="#f97316" />
              <View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: colors.text }}>{c.name} ({c.relation})</Text><Text style={{ color: colors.textSecondary }}>+91 {c.phone}</Text></View>
              <Text style={s.cb}>Call</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  c: { flex: 1 },
  h: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  t: { flex: 1, fontSize: 20, fontWeight: '700' },
  b: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sc: { flex: 1, padding: 16 },
  sec: { marginBottom: 20 },
  st: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  map: { height: 180, borderRadius: 12 },
  mb: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  mbt: { color: '#fff', fontWeight: '600' },
  r: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  cb: { color: '#10b981', fontWeight: '600' },
});

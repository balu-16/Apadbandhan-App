import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSOS } from '../hooks/useSOS';
import { SosResponder } from '../services/api';

const { width } = Dimensions.get('window');

interface SOSButtonProps {
  size?: number;
  style?: object;
}

const SOSButton: React.FC<SOSButtonProps> = ({ size = 80, style }) => {
  const { triggerSos, isTriggering, error, sosResult, clearSos } = useSOS();
  const [showResults, setShowResults] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for SOS button
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleSOS = async () => {
    const result = await triggerSos();
    if (result) {
      setShowResults(true);
    }
  };

  const handleCallResponder = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    clearSos();
  };

  const renderResponder = (responder: SosResponder, index: number) => (
    <View key={responder.id} style={styles.responderCard}>
      <View style={styles.responderHeader}>
        <View style={[
          styles.roleIcon,
          { backgroundColor: responder.role === 'police' ? '#3b82f6' : '#ef4444' }
        ]}>
          {responder.role === 'police' ? (
            <MaterialIcons name="local-police" size={20} color="#fff" />
          ) : (
            <FontAwesome5 name="hospital" size={16} color="#fff" />
          )}
        </View>
        <View style={styles.responderInfo}>
          <Text style={styles.responderName}>{responder.name}</Text>
          <Text style={styles.responderRole}>
            {responder.role === 'police' ? 'Police' : 'Hospital'}
          </Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{responder.distance} km</Text>
        </View>
      </View>
      
      <View style={styles.responderDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{responder.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons 
            name={responder.onDuty ? "check-circle" : "cancel"} 
            size={16} 
            color={responder.onDuty ? "#22c55e" : "#ef4444"} 
          />
          <Text style={[
            styles.detailText,
            { color: responder.onDuty ? "#22c55e" : "#ef4444" }
          ]}>
            {responder.onDuty ? 'On Duty' : 'Offline'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.callButton}
        onPress={() => handleCallResponder(responder.phone)}
      >
        <MaterialIcons name="call" size={18} color="#fff" />
        <Text style={styles.callButtonText}>Call Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {/* SOS Button */}
      <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
        <TouchableOpacity
          style={[styles.sosButton, { width: size, height: size, borderRadius: size / 2 }]}
          onPress={handleSOS}
          disabled={isTriggering}
          activeOpacity={0.8}
        >
          {isTriggering ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>Emergency</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseResults}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Response</Text>
              <TouchableOpacity onPress={handleCloseResults}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Status */}
            {sosResult && (
              <View style={[
                styles.statusBanner,
                { 
                  backgroundColor: sosResult.status === 'assigned' 
                    ? '#dcfce7' 
                    : sosResult.status === 'no-responders'
                    ? '#fef2f2'
                    : '#fef9c3'
                }
              ]}>
                <MaterialIcons 
                  name={
                    sosResult.status === 'assigned' 
                      ? "check-circle" 
                      : sosResult.status === 'no-responders'
                      ? "error"
                      : "pending"
                  } 
                  size={20} 
                  color={
                    sosResult.status === 'assigned' 
                      ? "#22c55e" 
                      : sosResult.status === 'no-responders'
                      ? "#ef4444"
                      : "#eab308"
                  }
                />
                <Text style={styles.statusText}>{sosResult.message}</Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Responders List */}
            <ScrollView style={styles.respondersList}>
              {sosResult?.responders?.police && sosResult.responders.police.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialIcons name="local-police" size={16} color="#3b82f6" /> Police ({sosResult.responders.police.length})
                  </Text>
                  {sosResult.responders.police.map((r, i) => renderResponder(r, i))}
                </View>
              )}

              {sosResult?.responders?.hospitals && sosResult.responders.hospitals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <FontAwesome5 name="hospital" size={14} color="#ef4444" /> Hospitals ({sosResult.responders.hospitals.length})
                  </Text>
                  {sosResult.responders.hospitals.map((r, i) => renderResponder(r, i))}
                </View>
              )}

              {sosResult?.responders?.totalFound === 0 && (
                <View style={styles.noResponders}>
                  <MaterialIcons name="warning" size={48} color="#f59e0b" />
                  <Text style={styles.noRespondersText}>No responders available nearby</Text>
                  <Text style={styles.noRespondersSubtext}>
                    Please call emergency services directly: 112
                  </Text>
                  <TouchableOpacity
                    style={styles.emergencyCallButton}
                    onPress={() => Linking.openURL('tel:112')}
                  >
                    <MaterialIcons name="call" size={20} color="#fff" />
                    <Text style={styles.emergencyCallText}>Call 112</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseResults}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sosSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  respondersList: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  responderCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  responderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  responderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  responderRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  distanceBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  responderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  callButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noResponders: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noRespondersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  noRespondersSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emergencyCallButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  emergencyCallText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SOSButton;

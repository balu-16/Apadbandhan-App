import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useDeviceStore } from '../../src/store/deviceStore';
import { qrCodesAPI } from '../../src/services/api';
import { useAlert } from '../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RELATIONSHIPS = ['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Son', 'Daughter', 'Friend', 'Other'];

export default function AddDeviceScreen() {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const { newDevice, setNewDeviceCode, setNewDeviceName, addEmergencyContact, removeEmergencyContact, setInsurance, createDevice, resetNewDevice } = useDeviceStore();
  
  const [step, setStep] = useState(1);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert({ title: 'Permission Required', message: 'Camera permission is required to scan QR codes.', icon: 'camera', buttons: [{ text: 'OK' }] });
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setShowScanner(false);
    setDeviceCode(data);
    
    // Auto-validate the scanned code
    setIsValidating(true);
    try {
      await qrCodesAPI.validateCode(data.trim());
      setNewDeviceCode(data.trim());
      setNewDeviceName(deviceName.trim() || `Device ${data.slice(-4)}`);
      setStep(2);
    } catch (error: any) {
      let message = 'Invalid device code. Please check and try again.';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Invalid Code', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateCode = async () => {
    if (!deviceCode.trim()) {
      showAlert({ title: 'Required', message: 'Please enter the device code', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    setIsValidating(true);
    try {
      await qrCodesAPI.validateCode(deviceCode.trim());
      setNewDeviceCode(deviceCode.trim());
      setNewDeviceName(deviceName.trim() || `Device ${deviceCode.slice(-4)}`);
      setStep(2);
    } catch (error: any) {
      let message = 'Invalid device code. Please check and try again.';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Invalid Code', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddContact = () => {
    if (!contactName.trim() || !contactRelation || !contactPhone.trim()) {
      showAlert({ title: 'Required', message: 'Please fill all contact fields', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    const cleanPhone = contactPhone.replace(/\s/g, '');
    if (cleanPhone.length !== 10) {
      showAlert({ title: 'Invalid Phone', message: 'Please enter a valid 10-digit phone number', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    addEmergencyContact({
      name: contactName.trim(),
      relation: contactRelation,
      phone: `+91${cleanPhone}`,
      isActive: true,
    });

    setContactName('');
    setContactRelation('');
    setContactPhone('');
  };

  const handleRegisterDevice = async () => {
    setIsRegistering(true);
    try {
      await createDevice();
      showAlert({
        title: 'Success!',
        message: 'Your device has been registered successfully.',
        icon: 'checkmark-circle',
        buttons: [{ text: 'OK', onPress: () => {
          setStep(1);
          setDeviceCode('');
          setDeviceName('');
          resetNewDevice();
        }}]
      });
    } catch (error: any) {
      let message = 'Failed to register device. Please try again.';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Error', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsRegistering(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Enter Device Details</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Scan the QR code on your Apadbandhav device or enter the code manually.
        </Text>
      </View>

      {/* QR Scanner Button */}
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: colors.primary }]}
        onPress={handleOpenScanner}
      >
        <View style={styles.scanButtonContent}>
          <View style={[styles.scanIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="scan" size={32} color="#ffffff" />
          </View>
          <View style={styles.scanTextContainer}>
            <Text style={styles.scanButtonTitle}>Scan QR Code</Text>
            <Text style={styles.scanButtonSubtitle}>Quick & easy device setup</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ffffff" />
        </View>
      </TouchableOpacity>

      <View style={styles.orDivider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.orText, { color: colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Device Code *</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="qr-code-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., AB-1234-5678"
              placeholderTextColor={colors.textTertiary}
              value={deviceCode}
              onChangeText={setDeviceCode}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Device Name (Optional)</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="hardware-chip-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., My Car Device"
              placeholderTextColor={colors.textTertiary}
              value={deviceName}
              onChangeText={setDeviceName}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isValidating ? 0.7 : 1 }]}
          onPress={handleValidateCode}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Validate & Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Contacts</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          These people will be notified immediately when an SOS is triggered.
        </Text>
      </View>

      {newDevice.emergencyContacts.map((contact, index) => (
        <View key={index} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.contactAvatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.contactInitials, { color: colors.primary }]}>{getInitials(contact.name)}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
            <Text style={[styles.contactDetails, { color: colors.textSecondary }]}>
              {contact.relation} • {contact.phone}
            </Text>
          </View>
          <TouchableOpacity onPress={() => removeEmergencyContact(index)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.textSecondary }]}>ADD NEW CONTACT</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter contact name"
              placeholderTextColor={colors.textTertiary}
              value={contactName}
              onChangeText={setContactName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Relationship</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, styles.selectWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => setShowRelationPicker(!showRelationPicker)}
          >
            <Text style={[styles.selectText, { color: contactRelation ? colors.text : colors.textTertiary }]}>
              {contactRelation || 'Select Relationship'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          {showRelationPicker && (
            <View style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.pickerItem, contactRelation === rel && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { setContactRelation(rel); setShowRelationPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, { color: contactRelation === rel ? colors.primary : colors.text }]}>{rel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <View style={[styles.countryCode, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.countryCodeText, { color: colors.text }]}>+91</Text>
            </View>
            <View style={[styles.phoneInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="00000 00000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={11}
                value={contactPhone}
                onChangeText={(text) => setContactPhone(formatPhoneNumber(text))}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
          onPress={handleAddContact}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setStep(1)}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, flex: 2 }]} onPress={() => setStep(3)}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Insurance Information</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Adding these details is optional, but helps us coordinate better during emergencies.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Health Insurance Number</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="medkit-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., HI-1234-5678"
              placeholderTextColor={colors.textTertiary}
              value={newDevice.insurance.health}
              onChangeText={(text) => setInsurance('health', text)}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Vehicle Insurance Number</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="car-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., POL-0099-8877"
              placeholderTextColor={colors.textTertiary}
              value={newDevice.insurance.vehicle}
              onChangeText={(text) => setInsurance('vehicle', text)}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Term Insurance Number</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., TL-5544-3322"
              placeholderTextColor={colors.textTertiary}
              value={newDevice.insurance.term}
              onChangeText={(text) => setInsurance('term', text)}
              autoCapitalize="characters"
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setStep(2)}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary, flex: 2, opacity: isRegistering ? 0.7 : 1 }]}
          onPress={handleRegisterDevice}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Register Device</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Device</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { backgroundColor: step >= 1 ? colors.primary : colors.border }]} />
              <View style={[styles.progressFill, { backgroundColor: step >= 2 ? colors.primary : colors.border }]} />
              <View style={[styles.progressFill, { backgroundColor: step >= 3 ? colors.primary : colors.border }]} />
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>Step {step} of 3</Text>
          </View>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowScanner(false)}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 28 }} />
            </View>
            <View style={styles.scannerFrame}>
              <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
            </View>
            <Text style={styles.scannerHint}>Point your camera at the QR code on your device</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 100 },
  header: { paddingHorizontal: Spacing['2xl'], paddingTop: 60, paddingBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  progressContainer: { gap: Spacing.sm },
  progressBar: { flexDirection: 'row', gap: Spacing.sm },
  progressFill: { flex: 1, height: 6, borderRadius: 3 },
  stepText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, textAlign: 'right' },
  stepContainer: { paddingHorizontal: Spacing['2xl'] },
  titleContainer: { marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium, lineHeight: 24 },
  form: { gap: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginLeft: Spacing.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, height: 56 },
  inputIcon: { marginRight: Spacing.md },
  input: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginTop: Spacing.lg },
  primaryButtonText: { color: '#ffffff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  secondaryButton: { flex: 1, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
  secondaryButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  buttonRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing['2xl'] },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.md },
  contactAvatar: { width: 48, height: 48, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
  contactInitials: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  contactInfo: { flex: 1, marginLeft: Spacing.lg },
  contactName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  contactDetails: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: Spacing.xs },
  formCard: { padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.lg },
  formTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.7, marginBottom: Spacing.xl },
  selectWrapper: { justifyContent: 'space-between' },
  selectText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  picker: { marginTop: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  pickerItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  pickerItemText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  phoneInputContainer: { flexDirection: 'row', gap: Spacing.md },
  countryCode: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, height: 56, justifyContent: 'center' },
  countryCodeText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  phoneInput: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, height: 56, justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderStyle: 'dashed', gap: Spacing.sm, marginTop: Spacing.md },
  addButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  // QR Scanner styles
  scanButton: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg },
  scanButtonContent: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.lg },
  scanIconContainer: { width: 56, height: 56, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  scanTextContainer: { flex: 1 },
  scanButtonTitle: { color: '#ffffff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scanButtonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
  dividerLine: { flex: 1, height: 1 },
  orText: { paddingHorizontal: Spacing.lg, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  // Scanner modal styles
  scannerContainer: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: Spacing['2xl'] },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 40 },
  closeButton: { padding: Spacing.sm },
  scannerTitle: { color: '#ffffff', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  scannerFrame: { width: SCREEN_WIDTH - 80, height: SCREEN_WIDTH - 80, alignSelf: 'center' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderRadius: 4 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderRadius: 4 },
  scannerHint: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md, fontWeight: FontWeight.medium, textAlign: 'center', paddingBottom: 60 },
});

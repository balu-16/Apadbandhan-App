import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/hooks/useTheme';
import { useDeviceStore } from '../../../src/store/deviceStore';
import { useAlert } from '../../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../../src/constants/theme';

export default function EditDeviceScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { currentDevice, fetchDevice, updateDevice, isLoading } = useDeviceStore();

    const [formData, setFormData] = useState({
        name: '',
        type: 'Vehicle',
        insurance: {
            health: '',
            vehicle: '',
            term: '',
        },
        emergencyContacts: [] as Array<{
            name: string;
            relation: string;
            phone: string;
        }>,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchDevice(id);
        }
    }, [id]);

    useEffect(() => {
        if (currentDevice) {
            setFormData({
                name: currentDevice.name || '',
                type: currentDevice.type || 'Vehicle',
                insurance: {
                    health: currentDevice.insurance?.health || '',
                    vehicle: currentDevice.insurance?.vehicle || '',
                    term: currentDevice.insurance?.term || '',
                },
                emergencyContacts: currentDevice.emergencyContacts?.map(c => ({
                    name: c.name,
                    relation: c.relation,
                    phone: c.phone
                })) || [],
            });
        }
    }, [currentDevice]);

    const handleUpdateContact = (index: number, field: string, value: string) => {
        const newContacts = [...formData.emergencyContacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setFormData({ ...formData, emergencyContacts: newContacts });
    };

    const handleAddContact = () => {
        setFormData({
            ...formData,
            emergencyContacts: [...formData.emergencyContacts, { name: '', relation: '', phone: '' }],
        });
    };

    const handleRemoveContact = (index: number) => {
        const newContacts = formData.emergencyContacts.filter((_, i) => i !== index);
        setFormData({ ...formData, emergencyContacts: newContacts });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showAlert({ title: 'Error', message: 'Device name is required', icon: 'warning', buttons: [{ text: 'OK' }] });
            return;
        }

        // Validate contacts
        const validContacts = formData.emergencyContacts.filter(
            c => c.name.trim() && c.phone.trim()
        );

        setIsSaving(true);
        try {
            await updateDevice(id as string, {
                name: formData.name,
                type: formData.type,
                insurance: formData.insurance,
                emergencyContacts: validContacts,
            });
            router.back();
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to update device', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !currentDevice) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Device</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
                    <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Device Name</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Enter device name"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                    <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: Spacing.md }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Device Type</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.type}
                            onChangeText={(text) => setFormData({ ...formData, type: text })}
                            placeholder="e.g. Vehicle, Watch, etc."
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </View>

                {/* Insurance Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Insurance Information</Text>
                    <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: Spacing.md }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Health Insurance</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.insurance.health}
                            onChangeText={(text) => setFormData({ ...formData, insurance: { ...formData.insurance, health: text } })}
                            placeholder="Policy Number"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                    <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: Spacing.md }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle Insurance</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.insurance.vehicle}
                            onChangeText={(text) => setFormData({ ...formData, insurance: { ...formData.insurance, vehicle: text } })}
                            placeholder="Policy Number"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                    <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Term Insurance</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={formData.insurance.term}
                            onChangeText={(text) => setFormData({ ...formData, insurance: { ...formData.insurance, term: text } })}
                            placeholder="Policy Number"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </View>

                {/* Emergency Contacts */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Emergency Contacts</Text>
                        <TouchableOpacity onPress={handleAddContact} style={styles.addContactButton}>
                            <Ionicons name="add-circle" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {formData.emergencyContacts.map((contact, index) => (
                        <View key={index} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.contactHeader}>
                                <Text style={[styles.contactIndex, { color: colors.textSecondary }]}>Contact {index + 1}</Text>
                                <TouchableOpacity onPress={() => handleRemoveContact(index)}>
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.contactInput, { color: colors.text, borderColor: colors.border }]}
                                value={contact.name}
                                onChangeText={(text) => handleUpdateContact(index, 'name', text)}
                                placeholder="Name"
                                placeholderTextColor={colors.textTertiary}
                            />
                            <TextInput
                                style={[styles.contactInput, { color: colors.text, borderColor: colors.border }]}
                                value={contact.phone}
                                onChangeText={(text) => handleUpdateContact(index, 'phone', text)}
                                placeholder="Phone Number"
                                placeholderTextColor={colors.textTertiary}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={[styles.contactInput, { color: colors.text, borderColor: colors.border }]}
                                value={contact.relation}
                                onChangeText={(text) => handleUpdateContact(index, 'relation', text)}
                                placeholder="Relation (e.g. Father)"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    saveButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    saveButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.md,
    },
    inputGroup: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    label: {
        fontSize: FontSize.xs,
        marginBottom: 4,
    },
    input: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        padding: 0,
    },
    addContactButton: {
        padding: 4,
    },
    contactCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    contactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    contactIndex: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        textTransform: 'uppercase',
    },
    contactInput: {
        borderBottomWidth: 1,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
        fontSize: FontSize.md,
    },
});

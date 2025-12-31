import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/hooks/useTheme';
import { adminAPI, UserProfile } from '../../../src/services/api';
import { useAlert } from '../../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../../src/constants/theme';

export default function UserDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchUser(id);
        }
    }, [id]);

    const fetchUser = async (userId: string) => {
        try {
            setIsLoading(true);
            const response = await adminAPI.getUserById(userId);
            setUser(response.data);
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'Failed to fetch user details', icon: 'close-circle' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textSecondary }}>User not found</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>User Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{user.fullName?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.userName, { color: colors.text }]}>{user.fullName}</Text>
                    <View style={[
                        styles.roleBadge,
                        { backgroundColor: user.role === 'admin' ? '#ef444420' : '#3b82f620' }
                    ]}>
                        <Text style={[
                            styles.roleText,
                            { color: user.role === 'admin' ? '#ef4444' : '#3b82f6' }
                        ]}>
                            {user.role.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Contact Information */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT INFORMATION</Text>

                    <TouchableOpacity onPress={() => handleCall(user.phone)} style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#10b98120' }]}>
                            <Ionicons name="call" size={20} color="#10b981" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Phone</Text>
                            <Text style={[styles.rowValue, { color: colors.text }]}>{user.phone}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleEmail(user.email)} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#3b82f620' }]}>
                            <Ionicons name="mail" size={20} color="#3b82f6" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Email</Text>
                            <Text style={[styles.rowValue, { color: colors.text }]}>{user.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Medical & Personal Info */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONAL INFORMATION</Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#ef444420' }]}>
                            <Ionicons name="water" size={20} color="#ef4444" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Blood Group</Text>
                            <Text style={[styles.rowValue, { color: colors.text }]}>{user.bloodGroup || 'Not set'}</Text>
                        </View>
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#f59e0b20' }]}>
                            <Ionicons name="location" size={20} color="#f59e0b" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Address</Text>
                            <Text style={[styles.rowValue, { color: colors.text }]}>{user.address || 'Not set'}</Text>
                        </View>
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#8b5cf620' }]}>
                            <MainIcon name="medical-bag" size={20} color="#8b5cf6" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Medical Conditions</Text>
                            <View style={styles.conditionsContainer}>
                                {user.medicalConditions && user.medicalConditions.length > 0 ? (
                                    user.medicalConditions.map((condition: string, index: number) => (
                                        <View key={index} style={[styles.conditionChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                            <Text style={[styles.conditionText, { color: colors.text }]}>{condition}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={[styles.rowValue, { color: colors.textSecondary }]}>None listed</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Emergency Contacts */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>EMERGENCY CONTACTS</Text>

                    {user.emergencyContacts && user.emergencyContacts.length > 0 ? (
                        user.emergencyContacts.map((contact, index) => (
                            <View key={index} style={[
                                styles.row,
                                { borderBottomColor: colors.border, borderBottomWidth: index === user.emergencyContacts!.length - 1 ? 0 : 1 }
                            ]}>
                                <View style={[styles.iconBox, { backgroundColor: colors.textSecondary + '20' }]}>
                                    <Text style={{ fontWeight: 'bold', color: colors.text }}>{index + 1}</Text>
                                </View>
                                <View style={styles.rowContent}>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                    <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>{contact.relation} • {contact.phone}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleCall(contact.phone)}>
                                    <Ionicons name="call-outline" size={22} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.row}>
                            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>No emergency contacts</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

// Icon helper with proper typing
type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const MainIcon = ({ name, size, color }: { name: MaterialIconName, size: number, color: string }) => (
    <MaterialCommunityIcons name={name} size={size} color={color} />
);

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
    content: {
        padding: Spacing.lg,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    userName: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xs,
    },
    roleBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    roleText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    section: {
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
        paddingVertical: Spacing.sm,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        marginLeft: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: FontSize.xs,
        marginBottom: 2,
    },
    rowValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    conditionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    conditionChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
    },
    conditionText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    contactName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    contactRelation: {
        fontSize: FontSize.xs,
    },
});

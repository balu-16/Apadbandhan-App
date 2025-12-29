import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { authAPI } from '../../src/services/api';
import { useAlert } from '../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setPhone } = useAuthStore();
  const { showAlert } = useAlert();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    }
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOtp = async () => {
    if (!fullName.trim()) {
      showAlert({ title: 'Required', message: 'Please enter your full name', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      showAlert({ title: 'Invalid Email', message: 'Please enter a valid email address', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length !== 10) {
      showAlert({ title: 'Invalid Phone', message: 'Please enter a valid 10-digit phone number', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.sendOtp(cleanPhone);
      setPhone(cleanPhone);
      router.push({
        pathname: '/(auth)/otp',
        params: { isLogin: 'false', fullName, email },
      });
    } catch (error: any) {
      let message = 'Failed to send OTP. Please try again.';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Error', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.blurCircleTop} />
      <View style={styles.blurCircleBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <View style={[styles.iconBackground, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person-add" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join the Apadbandhav network for emergency safety and response.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textTertiary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={[styles.countryCode, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.countryCodeText, { color: colors.text }]}>+91</Text>
              </View>
              <View style={[styles.phoneInputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Ionicons name="call-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="00000 00000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSendOtp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6467f2', '#5558e8']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurCircleTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(100, 103, 242, 0.1)',
  },
  blurCircleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(100, 103, 242, 0.05)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 80,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.7,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing['3xl'],
  },
  formContainer: {
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  countryCode: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 56,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  button: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#6467f2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  buttonIcon: {
    marginLeft: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  footerText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  linkText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

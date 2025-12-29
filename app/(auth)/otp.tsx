import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { authAPI, UserProfile } from '../../src/services/api';
import { useAlert } from '../../src/hooks/useAlert';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../src/constants/theme';

export default function OtpScreen() {
  const router = useRouter();
  const { isLogin, fullName, email } = useLocalSearchParams<{
    isLogin: string;
    fullName?: string;
    email?: string;
  }>();
  const { colors } = useTheme();
  const { phone, login } = useAuthStore();
  const { showAlert } = useAlert();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Get the correct route based on user role
  const getRouteForRole = (role: string) => {
    switch (role) {
      case 'superadmin':
        return '/(superadmin)/dashboard';
      case 'admin':
        return '/(admin)/dashboard';
      case 'police':
        return '/(police)/dashboard';
      case 'hospital':
        return '/(hospital)/dashboard';
      default:
        return '/(tabs)/home';
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const otpArray = value.slice(0, 6).split('');
      const newOtp = [...otp];
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const lastIndex = Math.min(index + otpArray.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showAlert({ title: 'Invalid OTP', message: 'Please enter the complete 6-digit OTP', icon: 'alert-circle', buttons: [{ text: 'OK' }] });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin === 'true') {
        const response = await authAPI.verifyOtp(phone, otpString);
        const { access_token, user } = response.data;
        await login(access_token, user);
        // Navigate based on user role
        router.replace(getRouteForRole(user.role) as any);
      } else {
        const response = await authAPI.signup({
          phone,
          otp: otpString,
          fullName: fullName || '',
          email: email || '',
        });
        const { access_token, user } = response.data;
        await login(access_token, user);
        // New users are always regular users, go to tabs/home
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      let message = 'Invalid OTP. Please try again.';
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      showAlert({ title: 'Error', message, icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      await authAPI.sendOtp(phone);
      setResendTimer(30);
      showAlert({ title: 'OTP Sent', message: 'A new OTP has been sent to your phone', icon: 'checkmark-circle', buttons: [{ text: 'OK' }] });
    } catch (error: any) {
      showAlert({ title: 'Error', message: 'Failed to resend OTP', icon: 'close-circle', buttons: [{ text: 'OK', style: 'destructive' }] });
    }
  };

  const maskedPhone = `+91 ${phone.slice(0, 5)} *****`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={[styles.iconBackground, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={[styles.phoneText, { color: colors.text }]}>{maskedPhone}</Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                {
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleVerifyOtp}
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
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={resendTimer > 0}>
            <Text
              style={[
                styles.resendLink,
                { color: resendTimer > 0 ? colors.textTertiary : colors.primary },
              ]}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.xs,
  },
  phoneText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  button: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#6467f2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  resendText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  resendLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});

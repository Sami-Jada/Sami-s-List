import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import Logo from '../../../assets/images/Logos/logo.svg';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { colors } from '../../theme';

type Step = 'phone' | 'password' | 'otp';

/** Normalize Jordan phone to +962XXXXXXXXX for API. Accepts 0XXXXXXXXX, XXXXXXXXX, or +962/962 prefix. */
function toJordanInternational(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  let national = digits.replace(/^962/, '').replace(/^0+/, '') || digits.replace(/^0+/, '');
  if (!/^[789]\d{8}$/.test(national)) return null;
  return `+962${national}`;
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const { checkPhone, loginWithPassword, sendOtp, verifyOtp } = useAuth();
  const { t } = useI18n();

  const handleContinue = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    const normalized = toJordanInternational(phone.trim());
    if (!normalized) {
      Alert.alert('Error', 'Please enter a valid Jordan mobile number (e.g. 07XXXXXXXX or 7XXXXXXXX)');
      return;
    }
    setLoading(true);
    try {
      const result = await checkPhone(normalized);
      if (result.exists && result.hasPassword) {
        setStep('password');
      } else {
        await sendOtp(normalized);
        setStep('otp');
        Alert.alert('Success', 'OTP sent to your phone');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    const normalized = toJordanInternational(phone.trim());
    if (!normalized) {
      Alert.alert('Error', 'Please enter a valid Jordan mobile number');
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(normalized, password);
      // AppNavigator will switch to Main/Driver
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Invalid phone or password';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }
    const normalized = toJordanInternational(phone.trim());
    if (!normalized) {
      Alert.alert('Error', 'Please enter a valid Jordan mobile number');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(normalized, otp.trim());
      // If isNewUser, AppNavigator shows onboarding; else Main
    } catch (error: any) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('exceeded');
      const isNetwork = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network');
      if (isTimeout || isNetwork) {
        Alert.alert('Connection Error', 'Request timed out. Please check your connection and try again.');
      } else if (error.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid or expired OTP code. Please try again.');
      } else {
        Alert.alert('Login Failed', error.response?.data?.message || error.message || 'Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'password' || step === 'otp') {
      setStep('phone');
      setPassword('');
      setOtp('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <LanguageToggle />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandingBlock}>
              <View style={styles.logo}>
                <Logo width={700} height={280} />
              </View>
              <Text style={styles.welcome} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                {t('home.welcome')}
              </Text>
              <Text style={styles.tagline}>{t('home.subtitle')}</Text>
              <Text style={styles.valueLine}>{t('auth.valueLine')}</Text>
            </View>
            <View style={styles.formBlock}>
              <Text style={styles.signInToContinue}>{t('auth.signInToContinue')}</Text>
              <Text style={styles.label}>{t('auth.phone')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.phonePlaceholder')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={step === 'phone'}
              />

              {step === 'password' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handlePasswordLogin}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'otp' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'phone' && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleContinue}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>{loading ? 'Checking...' : 'Continue'}</Text>
                </TouchableOpacity>
              )}

          {(step === 'password' || step === 'otp') && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
              <Text style={styles.backButtonText}>Change phone number</Text>
            </TouchableOpacity>
          )}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  brandingBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 700,
    height: 280,
    marginBottom: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: colors.primaryText,
    width: '100%',
  },
  tagline: {
    fontSize: 14,
    color: colors.heading,
    marginBottom: 8,
    textAlign: 'center',
  },
  valueLine: {
    fontSize: 13,
    color: colors.heading,
    textAlign: 'center',
  },
  formBlock: {
    marginTop: 8,
  },
  signInToContinue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.heading,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.primaryText,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: colors.primaryText,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.brand,
    fontSize: 14,
  },
});

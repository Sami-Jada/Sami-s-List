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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';

type Step = 'phone' | 'password' | 'otp';

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
    setLoading(true);
    try {
      const result = await checkPhone(phone.trim());
      if (result.exists && result.hasPassword) {
        setStep('password');
      } else {
        await sendOtp(phone.trim());
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
    setLoading(true);
    try {
      await loginWithPassword(phone.trim(), password);
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
    setLoading(true);
    try {
      await verifyOtp(phone.trim(), otp.trim());
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
          <Text style={styles.title}>{t('auth.login')}</Text>

          <TextInput
            style={styles.input}
            placeholder="Phone (+962XXXXXXXXX)"
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

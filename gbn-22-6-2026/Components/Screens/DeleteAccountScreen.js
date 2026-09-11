import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '../utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';
import * as biometricAuth from '../utils/biometricAuth';

const API_URL = API_BASE_URL;
const SUPPORT_URL = 'https://support.gbnsocialassociations.in';
const OTP_RESEND_SECONDS = 30;

const STEP_WARNING = 'warning';
const STEP_PASSWORD = 'password';
const STEP_OTP = 'otp';
const STEP_DONE = 'done';

// "jo***n@gbn.com" - enough for a member to recognize their own address
// without a bystander reading it off the screen.
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

const CONSEQUENCES = [
  { icon: 'person-remove', text: 'Your profile, chapter membership are removed' },
  { icon: 'globe-outline', text: 'Your GBN website and public listing go offline' },
  { icon: 'time-outline', text: 'Meeting history and activity records are cleared' },
  { icon: 'alert-circle', text: 'This cannot be undone once processed' },
];

export default function DeleteAccountScreen({ navigation }) {
  const [step, setStep] = useState(STEP_WARNING);
  const [email, setEmail] = useState(null);

  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpSentOnce = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        const cached = raw ? JSON.parse(raw) : null;
        if (cached?.email) setEmail(cached.email);

        const token = await AsyncStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}member/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json?.data?.email) setEmail(json.data.email);
      } catch (error) {
        console.log('DeleteAccountScreen profile load error:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn(seconds => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendOtp = async () => {
    if (!email) return;
    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_URL}auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Could not send the verification code');
      }
      setResendIn(OTP_RESEND_SECONDS);
    } catch (error) {
      setOtpError(
        getFriendlyErrorMessage(error, 'Could not send the verification code. Please try resending.'),
      );
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    if (step === STEP_OTP && !otpSentOnce.current) {
      otpSentOnce.current = true;
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === STEP_DONE) {
      Linking.openURL(SUPPORT_URL).catch(() => {});
    }
  }, [step]);

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setPasswordError('Enter your password to continue');
      return;
    }
    if (!email) {
      setPasswordError('Could not load your account details. Please go back and try again.');
      return;
    }

    setPasswordError('');
    setVerifyingPassword(true);
    try {
      const res = await fetch(`${API_URL}auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordError(data?.message || 'Incorrect password. Please try again.');
        return;
      }

      const accessToken = data?.data?.accessToken || data?.accessToken;
      const refreshToken = data?.data?.refreshToken || data?.refreshToken;
      const user = data?.data?.user || data?.user;

      if (accessToken) await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
      if (user) await AsyncStorage.setItem('userData', JSON.stringify(user));
      if (user?._id && refreshToken) {
        await biometricAuth.updateStoredRefreshToken(user._id, refreshToken);
      }

      setPassword('');
      setStep(STEP_OTP);
    } catch (error) {
      setPasswordError(getFriendlyErrorMessage(error));
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError('Enter the code we emailed you');
      return;
    }

    setOtpError('');
    setVerifyingOtp(true);
    try {
      const res = await fetch(`${API_URL}auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data?.message || "That code didn't match. Please try again.");
        return;
      }

      setStep(STEP_DONE);
    } catch (error) {
      setOtpError(getFriendlyErrorMessage(error));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const openSupportPage = async () => {
    try {
      await Linking.openURL(SUPPORT_URL);
    } catch (error) {
      Alert.alert('Oops!', `Please open ${SUPPORT_URL} from your browser to continue.`);
    }
  };

  const guardedVerifyPassword = useGuardedAction(handleVerifyPassword);
  const guardedVerifyOtp = useGuardedAction(handleVerifyOtp);
  const guardedResendOtp = useGuardedAction(sendOtp);
  const guardedOpenSupport = useGuardedAction(openSupportPage);
  const guardedGoBack = useGuardedAction(() => navigation.goBack());

  const HEADER_COPY = {
    [STEP_WARNING]: {
      heading: 'Delete Account',
      sub: "We're sorry to see you go. Here's what happens next.",
    },
    [STEP_PASSWORD]: {
      heading: 'Confirm Password',
      sub: 'Step 1 of 2 — verify it\'s really you.',
    },
    [STEP_OTP]: {
      heading: 'Verify Email',
      sub: 'Step 2 of 2 — enter the code we sent you.',
    },
    [STEP_DONE]: {
      heading: 'Identity Verified',
      sub: "You're being taken to our support portal to finish your request.",
    },
  };

  const { heading, sub } = HEADER_COPY[step];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={styles.header}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />

          <View style={styles.headerTop}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.backButton}
              onPress={guardedGoBack}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            {(step === STEP_PASSWORD || step === STEP_OTP) && (
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  {step === STEP_PASSWORD ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subHeading}>{sub}</Text>
        </View>

        <View style={styles.body}>
          {step === STEP_WARNING && (
            <View>
              <View style={styles.card}>
                <View style={styles.warnRow}>
                  <View style={styles.warnIconBox}>
                    <Icon name="warning" size={22} color="#B3261E" />
                  </View>
                  <Text style={styles.warnTitle}>This permanently deletes your account</Text>
                </View>

                {CONSEQUENCES.map((item, index) => (
                  <View
                    key={item.icon}
                    style={[styles.consequenceRow, index === 0 && { marginTop: 4 }]}
                  >
                    <Icon name={item.icon} size={18} color="#6B7280" style={styles.consequenceIcon} />
                    <Text style={styles.consequenceText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoCard}>
                <Icon name="shield-checkmark-outline" size={18} color="#0B3D2E" />
                <Text style={styles.infoText}>
                  For your security, we'll first confirm your password and email before
                  handing you off to our support team to submit the request.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dangerButton}
                activeOpacity={0.9}
                onPress={() => setStep(STEP_PASSWORD)}
              >
                <Text style={styles.dangerButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelLink}
                activeOpacity={0.7}
                onPress={guardedGoBack}
              >
                <Text style={styles.cancelLinkText}>Keep My Account</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === STEP_PASSWORD && (
            <View style={styles.card}>
              {!!email && (
                <Text style={styles.signedInAs}>Signed in as {maskEmail(email)}</Text>
              )}

              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={secure}
                  style={styles.input}
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setSecure(!secure)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <Icon name={secure ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, verifyingPassword && styles.buttonDisabled]}
                activeOpacity={0.9}
                onPress={guardedVerifyPassword}
                disabled={verifyingPassword}
              >
                {verifyingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === STEP_OTP && (
            <View style={styles.card}>
              <Text style={styles.signedInAs}>
                Code sent to {email ? maskEmail(email) : 'your email'}
              </Text>

              <Text style={styles.fieldLabel}>Verification Code</Text>
              <TextInput
                placeholder="• • • • •"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={5}
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={text => {
                  setOtp(text.replace(/[^0-9]/g, ''));
                  if (otpError) setOtpError('');
                }}
              />

              {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}

              <TouchableOpacity
                onPress={guardedResendOtp}
                disabled={resendIn > 0 || sendingOtp}
                style={styles.resendRow}
              >
                <Text style={[styles.resendText, (resendIn > 0 || sendingOtp) && styles.resendTextDisabled]}>
                  {sendingOtp
                    ? 'Sending code…'
                    : resendIn > 0
                    ? `Resend code in ${resendIn}s`
                    : "Didn't get it? Resend code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, verifyingOtp && styles.buttonDisabled]}
                activeOpacity={0.9}
                onPress={guardedVerifyOtp}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify &amp; Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === STEP_DONE && (
            <View style={styles.card}>
              <View style={styles.successIconBox}>
                <Icon name="checkmark-circle" size={48} color="#16A34A" />
              </View>

              <Text style={styles.successTitle}>You're verified</Text>
              <Text style={styles.successText}>
                We opened our support portal in your browser so you can submit your account
                deletion request. If it didn't open, use the button below.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={guardedOpenSupport}
              >
                <Text style={styles.primaryButtonText}>Open Support Page</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelLink}
                activeOpacity={0.7}
                onPress={guardedGoBack}
              >
                <Text style={styles.cancelLinkText}>Back to App</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F5F4',
  },

  header: {
    backgroundColor: '#17310F',
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },

  circleOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 200,
    backgroundColor: 'rgba(225,29,29,0.07)',
    right: -80,
    top: -60,
  },

  circleTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 120,
    backgroundColor: 'rgba(72,255,133,0.05)',
    left: -60,
    bottom: -60,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  stepBadgeText: {
    color: '#B6C4BB',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },

  subHeading: {
    marginTop: 10,
    color: '#B6C4BB',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    width: '94%',
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },

  warnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  warnIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FDEDED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  warnTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },

  consequenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  consequenceIcon: {
    marginRight: 10,
    marginTop: 2,
  },

  consequenceText: {
    flex: 1,
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF9F0',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#0B3D2E',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '600',
  },

  dangerButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E11D1D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  cancelLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },

  cancelLinkText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },

  signedInAs: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
  },

  fieldLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    height: 54,
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },

  otpInput: {
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    paddingHorizontal: 16,
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '800',
  },

  eyeButton: {
    padding: 4,
  },

  errorText: {
    color: '#B3261E',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 10,
  },

  resendRow: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },

  resendText: {
    color: '#0B3D2E',
    fontSize: 13,
    fontWeight: '800',
  },

  resendTextDisabled: {
    color: '#9CA3AF',
  },

  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0B3D2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  successIconBox: {
    alignSelf: 'center',
    marginBottom: 14,
  },

  successTitle: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },

  successText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});

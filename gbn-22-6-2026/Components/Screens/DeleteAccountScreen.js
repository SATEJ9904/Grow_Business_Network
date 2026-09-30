import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '../utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';
import * as biometricAuth from '../utils/biometricAuth';
import { disconnectSocket } from '../utils/socketManager';
import KeyboardScreen from '../KeyboardScreen';

const API_URL = API_BASE_URL;
const OTP_RESEND_SECONDS = 30;

const STEP_WARNING = 'warning';
const STEP_OTP = 'otp';
const STEP_TERMS = 'terms';

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

const TERMS = [
  'Your account and all profile data linked to it will be permanently deleted from GBN.',
  'Your GBN website, public listing and chapter membership will be removed immediately.',
  'Deleted accounts cannot be restored or recovered by you or by the GBN team.',
  'Any membership fee already paid is not refundable on account deletion.',
  'To rejoin GBN later, you will have to register a new account and go through approval again.',
];

async function authedRequest(path, { method = 'POST', body } = {}) {
  const token = await AsyncStorage.getItem('accessToken');
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.success, data };
}

export default function DeleteAccountScreen({ navigation }) {
  const [step, setStep] = useState(STEP_WARNING);
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpSentOnce = useRef(false);

  const [deletionToken, setDeletionToken] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        const cached = raw ? JSON.parse(raw) : null;
        if (cached?.email) setEmail(cached.email);
        if (cached?._id) setUserId(cached._id);

        const token = await AsyncStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}member/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json?.data?.email) setEmail(json.data.email);
        if (json?.data?._id) setUserId(json.data._id);
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
    setSendingOtp(true);
    setOtpError('');
    try {
      const { ok, data } = await authedRequest('member/delete-me/send-otp');
      if (!ok) {
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

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError('Enter the code we emailed you');
      return;
    }

    setOtpError('');
    setVerifyingOtp(true);
    try {
      const { ok, data } = await authedRequest('member/delete-me/verify-otp', {
        body: { otp: otp.trim() },
      });

      if (!ok || !data?.data?.deletionToken) {
        setOtpError(data?.message || "That code didn't match. Please try again.");
        return;
      }

      setDeletionToken(data.data.deletionToken);
      setOtp('');
      setStep(STEP_TERMS);
    } catch (error) {
      setOtpError(getFriendlyErrorMessage(error));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      const { ok, data } = await authedRequest('member/delete-me', {
        method: 'DELETE',
        body: { deletionToken, acceptedTerms: true },
      });

      if (!ok) {
        setConfirmVisible(false);
        setDeleteError(data?.message || 'Could not delete your account. Please try again.');
        return;
      }

      // The account is gone server-side - end every local session for it.
      // AsyncStorage.clear() never touches Keychain, so the biometric
      // credential has to be purged explicitly.
      disconnectSocket();
      await biometricAuth.purgeAccount(userId);
      await AsyncStorage.clear();

      setConfirmVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { accountDeleted: true } }],
      });
    } catch (error) {
      setConfirmVisible(false);
      setDeleteError(getFriendlyErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const guardedVerifyOtp = useGuardedAction(handleVerifyOtp);
  const guardedResendOtp = useGuardedAction(sendOtp);
  const guardedDelete = useGuardedAction(handleDeleteAccount);
  const guardedGoBack = useGuardedAction(() => navigation.goBack());

  const HEADER_COPY = {
    [STEP_WARNING]: {
      heading: 'Delete Account',
      sub: "We're sorry to see you go. Here's what happens next.",
    },
    [STEP_OTP]: {
      heading: 'Verify Email',
      sub: 'Step 1 of 2 — enter the code we sent you.',
    },
    [STEP_TERMS]: {
      heading: 'Confirm Deletion',
      sub: 'Step 2 of 2 — review the terms before deleting your account.',
    },
  };

  const { heading, sub } = HEADER_COPY[step];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <KeyboardScreen>
      <ScrollView
        style={{ flex: 1 }}
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

            {(step === STEP_OTP || step === STEP_TERMS) && (
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  {step === STEP_OTP ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
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
                  For your security, we'll email a verification code to your registered
                  address before you can delete your account.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dangerButton}
                activeOpacity={0.9}
                onPress={() => setStep(STEP_OTP)}
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

          {step === STEP_TERMS && (
            <View>
              <View style={styles.card}>
                <View style={styles.verifiedRow}>
                  <Icon name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.verifiedText}>
                    Email verified{email ? ` · ${maskEmail(email)}` : ''}
                  </Text>
                </View>

                <Text style={styles.termsTitle}>Terms &amp; Conditions</Text>
                {TERMS.map((term, index) => (
                  <View key={index} style={styles.termRow}>
                    <Text style={styles.termNumber}>{index + 1}.</Text>
                    <Text style={styles.termText}>{term}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    setAcceptedTerms(value => !value);
                    if (deleteError) setDeleteError('');
                  }}
                >
                  <Icon
                    name={acceptedTerms ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={acceptedTerms ? '#E11D1D' : '#6B7280'}
                  />
                  <Text style={styles.checkboxText}>
                    I have read and agree to the terms above, and understand my account
                    will be permanently deleted.
                  </Text>
                </TouchableOpacity>

                {!!deleteError && <Text style={styles.errorText}>{deleteError}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.dangerButton, !acceptedTerms && styles.buttonDisabled]}
                activeOpacity={0.9}
                disabled={!acceptedTerms}
                onPress={() => setConfirmVisible(true)}
              >
                <Text style={styles.dangerButtonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.9}
                onPress={guardedGoBack}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardScreen>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.warnIconBox, styles.modalIcon]}>
              <Icon name="trash" size={24} color="#B3261E" />
            </View>
            <Text style={styles.modalTitle}>Delete your account?</Text>
            <Text style={styles.modalText}>
              This permanently deletes your GBN account and cannot be undone. To rejoin
              later you will need to create a new account.
            </Text>

            <TouchableOpacity
              style={[styles.dangerButton, styles.modalButton, deleting && styles.buttonDisabled]}
              activeOpacity={0.9}
              disabled={deleting}
              onPress={guardedDelete}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.dangerButtonText}>Yes, Delete Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              activeOpacity={0.7}
              disabled={deleting}
              onPress={() => setConfirmVisible(false)}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  verifiedText: {
    marginLeft: 8,
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },

  termsTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  termNumber: {
    width: 20,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },

  termText: {
    flex: 1,
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EF',
  },

  checkboxText: {
    flex: 1,
    marginLeft: 10,
    color: '#111827',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  cancelButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  cancelButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
  },

  modalIcon: {
    alignSelf: 'center',
    marginRight: 0,
    marginBottom: 14,
  },

  modalTitle: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 8,
  },

  modalText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  modalButton: {
    marginTop: 20,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

const STEP_REASON = 'reason';
const STEP_DETAILS = 'details';
const STEP_REVIEW = 'review';
const STEP_DONE = 'done';

const REASON_OPTIONS = [
  { label: 'Harassment or bullying', value: 'HARASSMENT' },
  { label: 'Spam', value: 'SPAM' },
  { label: 'Scam or fraud', value: 'SCAM_FRAUD' },
  { label: 'Fake or impersonation account', value: 'FAKE_PROFILE' },
  { label: 'Impersonation of another business', value: 'IMPERSONATION' },
  { label: 'Inappropriate or offensive content', value: 'INAPPROPRIATE_CONTENT' },
  { label: 'Offensive image', value: 'OFFENSIVE_IMAGE' },
  { label: 'Other', value: 'OTHER' },
];

const CONTENT_TYPE_OPTIONS = [
  { label: 'This member’s profile', value: 'USER' },
  { label: 'Their business website', value: 'WEBSITE' },
  { label: 'A specific image', value: 'IMAGE' },
  { label: 'Something else', value: 'OTHER' },
];

const STEP_ORDER = [STEP_REASON, STEP_DETAILS, STEP_REVIEW];

export default function ReportUserScreen({ route, navigation }) {
  const reportedUserId = route?.params?.reportedUserId;
  const reportedUserName = route?.params?.reportedUserName || 'this member';

  const [step, setStep] = useState(STEP_REASON);
  const [reasonCategory, setReasonCategory] = useState(null);
  const [contentType, setContentType] = useState('USER');
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [alsoRequestBlock, setAlsoRequestBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [caseId, setCaseId] = useState(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  const goNextFromReason = () => {
    if (!reasonCategory) return;
    setStep(STEP_DETAILS);
  };

  const goNextFromDetails = () => {
    if (reasonCategory === 'OTHER' && !description.trim()) {
      setDescriptionError('Please describe the issue.');
      return;
    }
    setDescriptionError('');
    setStep(STEP_REVIEW);
  };

  const submitReport = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const token = await AsyncStorage.getItem('accessToken');

      const endpoint = alsoRequestBlock ? 'moderation/block-request' : 'moderation/report';
      const response = await axios.post(
        `${BASE_URL}${endpoint}`,
        {
          reportedUserId,
          reportedContentType: contentType,
          reasonCategory,
          description: description.trim(),
        },
        {
          timeout: 30000,
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCaseId(response.data?.data?.caseId || null);
      setStep(STEP_DONE);
    } catch (error) {
      setSubmitError(getFriendlyErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const guardedNextReason = useGuardedAction(goNextFromReason, 300);
  const guardedNextDetails = useGuardedAction(goNextFromDetails, 300);
  const guardedSubmit = useGuardedAction(submitReport);
  const guardedGoBack = useGuardedAction(() => navigation.goBack());
  const guardedBackStep = useGuardedAction(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
    else navigation.goBack();
  });
  const guardedGoMyReports = useGuardedAction(() => navigation.replace('MyReportsScreen'));

  const HEADER_COPY = {
    [STEP_REASON]: { heading: 'Report User', sub: `Step 1 of 3 — why are you reporting ${reportedUserName}?` },
    [STEP_DETAILS]: { heading: 'Add Details', sub: 'Step 2 of 3 — tell us more (optional unless "Other").' },
    [STEP_REVIEW]: { heading: 'Review & Submit', sub: 'Step 3 of 3 — confirm before submitting.' },
    [STEP_DONE]: { heading: 'Report Submitted', sub: 'Our moderation team will review this and update you.' },
  };
  const { heading, sub } = HEADER_COPY[step];

  const selectedReasonLabel = REASON_OPTIONS.find(r => r.value === reasonCategory)?.label;
  const selectedContentLabel = CONTENT_TYPE_OPTIONS.find(c => c.value === contentType)?.label;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={guardedBackStep}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            {step !== STEP_DONE && (
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP {stepIndex + 1} OF {STEP_ORDER.length}</Text>
              </View>
            )}
          </View>

          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subHeading}>{sub}</Text>
        </View>

        <View style={styles.body}>
          {step === STEP_REASON && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Reason</Text>
              <Dropdown
                style={styles.dropdown}
                data={REASON_OPTIONS}
                labelField="label"
                valueField="value"
                placeholder="Select a reason"
                value={reasonCategory}
                onChange={item => setReasonCategory(item.value)}
              />

              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>What are you reporting?</Text>
              <Dropdown
                style={styles.dropdown}
                data={CONTENT_TYPE_OPTIONS}
                labelField="label"
                valueField="value"
                placeholder="Select what this is about"
                value={contentType}
                onChange={item => setContentType(item.value)}
              />

              <TouchableOpacity
                style={[styles.primaryButton, !reasonCategory && styles.buttonDisabled]}
                activeOpacity={0.9}
                onPress={guardedNextReason}
                disabled={!reasonCategory}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === STEP_DETAILS && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>
                Please describe the issue{reasonCategory === 'OTHER' ? ' *' : ' (optional)'}
              </Text>
              <TextInput
                placeholder="Add any details that will help our team review this..."
                placeholderTextColor="#9CA3AF"
                style={styles.textArea}
                multiline
                numberOfLines={5}
                value={description}
                onChangeText={text => {
                  setDescription(text);
                  if (descriptionError) setDescriptionError('');
                }}
              />
              {!!descriptionError && <Text style={styles.errorText}>{descriptionError}</Text>}

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={guardedNextDetails}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === STEP_REVIEW && (
            <View style={styles.card}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Reason</Text>
                <Text style={styles.reviewValue}>{selectedReasonLabel}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Reporting</Text>
                <Text style={styles.reviewValue}>{selectedContentLabel}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Description</Text>
                <Text style={styles.reviewValue}>{description.trim() || 'Not provided'}</Text>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.85}
                onPress={() => setAlsoRequestBlock(!alsoRequestBlock)}
              >
                <View style={[styles.checkbox, alsoRequestBlock && styles.checkboxChecked]}>
                  {alsoRequestBlock && <Icon name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Also request this member be blocked from GBN (reviewed by our team)
                </Text>
              </TouchableOpacity>

              {!!submitError && <Text style={styles.errorText}>{submitError}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                activeOpacity={0.9}
                onPress={guardedSubmit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : (
                  <Text style={styles.primaryButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === STEP_DONE && (
            <View style={styles.card}>
              <View style={styles.successIconBox}>
                <Icon name="checkmark-circle" size={48} color="#16A34A" />
              </View>

              <Text style={styles.successTitle}>Report submitted successfully</Text>
              <Text style={styles.successText}>
                Our moderation team will review the report. You will receive an update when the
                review is completed.
              </Text>

              {!!caseId && (
                <View style={styles.caseIdBox}>
                  <Text style={styles.caseIdLabel}>Reference ID</Text>
                  <Text style={styles.caseIdValue}>{caseId}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={guardedGoMyReports}>
                <Text style={styles.primaryButtonText}>View My Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelLink} activeOpacity={0.7} onPress={guardedGoBack}>
                <Text style={styles.cancelLinkText}>Back to Profile</Text>
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
    fontSize: 28,
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
  fieldLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  dropdown: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 16,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    backgroundColor: '#F8FAF9',
    padding: 16,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#B3261E',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 10,
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
    opacity: 0.5,
  },
  primaryButtonText: {
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
  reviewRow: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 21,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0B3D2E',
    marginRight: 12,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0B3D2E',
  },
  checkboxLabel: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  successIconBox: {
    alignSelf: 'center',
    marginBottom: 14,
  },
  successTitle: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 19,
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
  caseIdBox: {
    marginTop: 18,
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    padding: 14,
    alignItems: 'center',
  },
  caseIdLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6B7280',
    marginBottom: 6,
  },
  caseIdValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'monospace',
  },
});

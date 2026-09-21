import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

const STATUS_STYLE = {
  PENDING: { bg: '#F6ECD9', text: '#7A5220', label: 'Pending' },
  UNDER_REVIEW: { bg: '#E7ECF3', text: '#132B4D', label: 'Under Review' },
  ACTION_TAKEN: { bg: '#E3EFE9', text: '#245349', label: 'Action Taken' },
  REJECTED: { bg: '#FBEAE5', text: '#8A3322', label: 'Rejected' },
  CLOSED: { bg: '#F1F1F1', text: '#48546B', label: 'Closed' },
  CANCELLED: { bg: '#F1F1F1', text: '#48546B', label: 'Cancelled' },
};

const REASON_LABELS = {
  SPAM: 'Spam',
  FAKE_PROFILE: 'Fake or impersonation account',
  INAPPROPRIATE_CONTENT: 'Inappropriate content',
  HARASSMENT: 'Harassment or bullying',
  SCAM_FRAUD: 'Scam or fraud',
  IMPERSONATION: 'Impersonation',
  OFFENSIVE_IMAGE: 'Offensive image',
  OTHER: 'Other',
};

const formatDate = date =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MyReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}moderation/my-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data?.data || []);
    } catch (error) {
      console.log('MyReportsScreen load error:', error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const guardedGoBack = useGuardedAction(() => navigation.goBack());

  const renderItem = ({ item }) => {
    const statusStyle = STATUS_STYLE[item.status] || STATUS_STYLE.PENDING;
    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.caseId}>{item.caseId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>
        <Text style={styles.reason}>{REASON_LABELS[item.reasonCategory] || item.reasonCategory}</Text>
        <Text style={styles.date}>Submitted {formatDate(item.createdAt)}</Text>
        {item.status === 'REJECTED' && !!item.rejectionReason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Reviewer's note</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={guardedGoBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>My Reports</Text>
        <Text style={styles.subHeading}>Track the reports and block requests you've submitted.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#17310F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={reports}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="flag-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>Reports you submit will show up here.</Text>
            </View>
          }
        />
      )}
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
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subHeading: {
    marginTop: 8,
    color: '#B6C4BB',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  reason: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#6B7280',
  },
  rejectionBox: {
    marginTop: 12,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/apiConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const API_URL = API_BASE_URL;

export default function StatusScreen({ navigation }) {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStatus();
    startSpinAnimation();
  }, []);

  // Drives a non-destructive "taking longer than expected" notice once
  // `loading` has stayed true for more than 15s. Unlike the old ad-hoc
  // setTimeout(() => { if (loading) ... }, 15000) inside this effect, this
  // reads the *current* loading value on every change rather than closing
  // over the initial render's value, so it can never fire a false "timed
  // out" error over a status that has already loaded successfully.
  const showSlowNotice = useDelayedNotice(loading, 15000);

  const startSpinAnimation = () => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ✅ FIXED FUNCTION
  const loadStatus = async () => {
    try {
      console.log('🔹 loadStatus() called');
      console.log('🔗 Using API_URL:', API_URL);
      setLoading(true);

      let userId = await AsyncStorage.getItem('userId');
      const userEmail = await AsyncStorage.getItem('userEmail');
      const storedUserData = await AsyncStorage.getItem('userData');

      console.log('📦 Retrieved userId from AsyncStorage:', userId);
      console.log('📦 Retrieved userEmail from AsyncStorage:', userEmail);
      console.log('📦 Retrieved userData from AsyncStorage:', storedUserData);

      if (!userId || userId === 'null' || userId === 'undefined') {
        try {
          const parsed = storedUserData ? JSON.parse(storedUserData) : null;
          userId = parsed?._id || parsed?.id || userId;
          console.log('🔁 Fallback userId from stored userData:', userId);
        } catch (parseError) {
          console.warn(
            '⚠️ Failed to parse stored userData:',
            parseError.message,
          );
        }
      }

      if (!userId || userId === 'null' || userId === 'undefined') {
        if (userEmail) {
          console.log('🔁 Falling back to check status by email:', userEmail);
          const emailResponse = await fetch(`${API_URL}auth/check-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail }),
          });
          const emailData = await emailResponse.json();
          console.log('📥 Email fallback response:', emailData);
          if (emailResponse.ok && emailData.success) {
            userId =
              emailData.data?._id ||
              emailData.data?.id ||
              emailData?._id ||
              emailData?.id ||
              emailData?.user?._id ||
              emailData?.user?.id;
            console.log('✅ Fallback userId from email check:', userId);
          }
        }
      }

      if (!userId || userId === 'null' || userId === 'undefined') {
        console.error('❌ No valid userId found in storage');
        setError('Session expired. Please login again.');
        setLoading(false);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
        return;
      }

      const endpoint = `${API_URL}admin/user-status?id=${userId}`;
      console.log('🔗 Full API endpoint:', endpoint);
      console.log('📤 Request method: GET');
      console.log('📤 Request headers:', {
        'Content-Type': 'application/json',
      });

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      const data = await response.json();
      console.log('📥 Response data:', data);
      console.log('📥 Response success:', data.success);
      console.log('📥 Response message:', data.message);
      console.log('📥 Response data object:', data.data);

      if (!response.ok) {
        console.error('❌ Response not OK:', response.status);
        console.error('❌ Error message from backend:', data.message);
        setError(data.message || 'Failed to load status. Please retry.');
        setLoading(false);
        return;
      }

      if (data.success && data.data) {
        console.log('✅ Status loaded successfully');
        const status = String(data.data.status || '')
          .trim()
          .toLowerCase();
        console.log(
          '📊 Refreshed status raw:',
          data.data.status,
          'normalized:',
          status,
        );
        setStatusData({ ...data.data, status });
        setError(null);
        await AsyncStorage.setItem('userStatus', status);
        console.log('✅ User status saved to AsyncStorage:', status);

        if (status === 'approved') {
          console.log('✅ Status is approved, navigating to Generate');
          Alert.alert(
            'Approved',
            'Your account is approved. Redirecting to Generate.',
          );
          navigation.replace('Generate');
          return;
        }
      } else {
        console.error('❌ Response success is false or no data returned');
        console.error('❌ Backend message:', data.message);
        setError(data.message || 'Failed to load status. Please retry.');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Exception in loadStatus():', error.message);
      console.error('❌ Full error:', error);
      console.error('❌ Error stack:', error.stack);
      setError(getFriendlyErrorMessage(error));
      setLoading(false);
    } finally {
      console.log('🔹 loadStatus() finally block - setting loading to false');
      setLoading(false);
    }
  };

  const guardedLoadStatus = useGuardedAction(loadStatus);

  const guardedRetry = useGuardedAction(() => {
    setError(null);
    setLoading(true);
    loadStatus();
  });

  const guardedGoLogin = useGuardedAction(() => navigation.navigate('Login'));

  const guardedOpenDashboard = useGuardedAction(() =>
    navigation.replace('Dashboard'),
  );

  const guardedContactSupport = useGuardedAction(() =>
    Linking.openURL('mailto:support@example.com'),
  );

  // 🔄 LOADING UI
  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcon name="loading" size={60} color="#2F4F1E" />
        </Animated.View>
        <Text style={styles.loadingText}>Checking your status...</Text>
        {showSlowNotice && (
          <Text style={styles.loadingText}>
            Still checking your status — this is taking longer than
            expected.
          </Text>
        )}
      </View>
    );
  }

  // ❌ ERROR UI
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2F4F1E" />
        <View style={styles.errorContainer}>
          <MaterialIcon name="alert-circle" size={80} color="#E74C3C" />
          <Text style={styles.errorTitle}>Unable to Load Status</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <TouchableOpacity
            style={styles.errorRetryButton}
            onPress={guardedRetry}
          >
            <MaterialIcon name="refresh" size={20} color="#fff" />
            <Text style={styles.errorRetryText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.errorBackButton}
            onPress={guardedGoLogin}
          >
            <Text style={styles.errorBackText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ❌ NO DATA UI
  if (!statusData && !loading) {
    return (
      <View style={styles.container}>
        <MaterialIcon name="alert-circle" size={60} color="red" />
        <Text style={{ marginTop: 10 }}>Unable to load status</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={guardedRetry}
        >
          <Text style={{ color: '#fff' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2F4F1E" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Account Status</Text>
          <Text style={styles.headerSubtitle}>
            Check your approval and refresh anytime
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshIcon}
          onPress={guardedLoadStatus}
        >
          <Icon name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {statusData.status?.toUpperCase()}
          </Text>
        </View>

        <View style={styles.iconBox}>
          {statusData.status === 'pending' && (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialIcon name="clock-outline" size={70} color="#FFA000" />
            </Animated.View>
          )}

          {statusData.status === 'approved' && (
            <MaterialIcon name="check-circle" size={70} color="#27AE60" />
          )}

          {statusData.status === 'rejected' && (
            <MaterialIcon name="close-circle" size={70} color="#E74C3C" />
          )}
        </View>

        <Text style={styles.statusText}>
          {statusData.status === 'pending' && 'Your account is under review'}
          {statusData.status === 'approved' &&
            'Your account has been approved!'}
          {statusData.status === 'rejected' && 'Your application was rejected'}
        </Text>

        <Text style={styles.info}>
          {statusData.status === 'pending' &&
            'Hang tight — our team is reviewing your submission. Refresh to check for updates.'}
          {statusData.status === 'approved' &&
            'Great news! You can now continue to the dashboard and enjoy full access.'}
          {statusData.status === 'rejected' &&
            'We are sorry. Please contact support if you believe this is a mistake.'}
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailText}>
            {statusData.name || 'Registered user'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>
            {statusData.email || 'No email available'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={guardedLoadStatus}
        >
          <Icon name="refresh-circle-outline" size={20} color="#fff" />
          <Text style={styles.refreshText}>Refresh Status</Text>
        </TouchableOpacity>

        {statusData.status === 'approved' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={guardedOpenDashboard}
          >
            <Text style={styles.btnText}>Open Dashboard</Text>
          </TouchableOpacity>
        )}

        {statusData.status === 'rejected' && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={guardedContactSupport}
          >
            <Text style={styles.secondaryText}>Contact Support</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={guardedGoLogin}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#EDF2F7' },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: '#2F4F1E',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },

  headerSubtitle: {
    color: '#D1DBD6',
    fontSize: 14,
    maxWidth: '80%',
  },

  refreshIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#4A5568',
    fontSize: 16,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  badgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#E2F0E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
    color: '#2F4F1E',
    fontWeight: '700',
    fontSize: 12,
  },

  iconBox: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1F2937',
  },

  info: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },

  detailRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },

  detailText: {
    marginLeft: 10,
    color: '#2D3748',
    fontSize: 15,
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F4F1E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    width: '100%',
    marginBottom: 14,
  },

  refreshText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  primaryButton: {
    backgroundColor: '#2F4F1E',
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
  },

  secondaryButton: {
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  secondaryText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
  },

  backBtn: {
    marginTop: 14,
    alignItems: 'center',
  },

  backText: {
    color: '#2F4F1E',
    fontWeight: '700',
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: '#F6AD55',
    padding: 12,
    borderRadius: 12,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },

  errorRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },

  errorRetryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  errorBackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2F4F1E',
    width: '100%',
    alignItems: 'center',
  },

  errorBackText: {
    color: '#2F4F1E',
    fontSize: 16,
    fontWeight: '700',
  },
});

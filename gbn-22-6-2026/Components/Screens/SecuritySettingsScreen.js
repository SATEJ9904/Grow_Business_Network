import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as biometricAuth from '../utils/biometricAuth';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

const STATE_UNAVAILABLE = 'unavailable';
const STATE_ENABLED = 'enabled';
const STATE_NOT_SET_UP = 'not_set_up';

export default function SecuritySettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(STATE_UNAVAILABLE);
  const [biometryLabel, setBiometryLabel] = useState('Biometrics');
  const [wasInvalidated, setWasInvalidated] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const { available, biometryType } = await biometricAuth.getCapability();

      if (!available || !userId) {
        setState(STATE_UNAVAILABLE);
        return;
      }

      setBiometryLabel(biometricAuth.biometryLabel(biometryType));

      const enabled = await biometricAuth.isBiometricEnabled(userId);
      setState(enabled ? STATE_ENABLED : STATE_NOT_SET_UP);

      if (!enabled) {
        const raw = await AsyncStorage.getItem(`biometric_meta:${userId}`);
        const meta = raw ? JSON.parse(raw) : null;
        setWasInvalidated(!!meta?.biometricInvalidated);
      } else {
        setWasInvalidated(false);
      }
    } catch (error) {
      console.log('SecuritySettingsScreen load error:', error);
      setState(STATE_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleEnable = async () => {
    setBusy(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!userId || !refreshToken) {
        Alert.alert(
          'Please log in again',
          'Set up biometric login again after your next password login.',
        );
        return;
      }

      const ok = await biometricAuth.enableBiometric(userId, refreshToken);
      if (ok) {
        setState(STATE_ENABLED);
        setWasInvalidated(false);
      } else {
        Alert.alert('Oops!', 'Could not set up biometric login. Please try again.');
      }
    } catch (error) {
      Alert.alert('Oops!', getFriendlyErrorMessage(error, 'Could not set up biometric login.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = () => {
    Alert.alert(
      'Disable Biometric Login',
      "You'll need your password to log in next time.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const userId = await AsyncStorage.getItem('userId');
              await biometricAuth.disableBiometric(userId);
              setState(STATE_NOT_SET_UP);
              setWasInvalidated(false);
            } catch (error) {
              Alert.alert('Oops!', getFriendlyErrorMessage(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const guardedEnable = useGuardedAction(handleEnable);
  const guardedDisable = useGuardedAction(handleDisable);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.circleOne} />
        <View style={styles.circleTwo} />

        <View style={styles.headerTop}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Security</Text>
        <Text style={styles.subHeading}>
          Manage how you sign in to your GBN account.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#17310F" />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>
                  {state === STATE_UNAVAILABLE ? '🚫' : '🔐'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{biometryLabel} Login</Text>
                <Text style={styles.cardStatus}>
                  {state === STATE_ENABLED && 'Enabled'}
                  {state === STATE_NOT_SET_UP && 'Not Set Up'}
                  {state === STATE_UNAVAILABLE && 'Unavailable'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardDescription}>
              {state === STATE_ENABLED &&
                `Use your ${biometryLabel.toLowerCase()} to securely log in without entering your password.`}
              {state === STATE_NOT_SET_UP && !wasInvalidated &&
                `Enable ${biometryLabel.toLowerCase()} login for faster, more convenient authentication.`}
              {state === STATE_NOT_SET_UP && wasInvalidated &&
                `Your biometric login was reset because your device's enrolled biometrics changed. Set it up again to keep using it.`}
              {state === STATE_UNAVAILABLE &&
                'Biometric authentication is not available on this device.'}
            </Text>

            {state === STATE_ENABLED && (
              <TouchableOpacity
                style={[styles.button, styles.disableButton]}
                onPress={guardedDisable}
                disabled={busy}
                activeOpacity={0.9}
              >
                <Text style={styles.disableButtonText}>
                  {busy ? 'Please wait…' : 'Disable Biometric Login'}
                </Text>
              </TouchableOpacity>
            )}

            {state === STATE_NOT_SET_UP && (
              <TouchableOpacity
                style={[styles.button, styles.enableButton]}
                onPress={guardedEnable}
                disabled={busy}
                activeOpacity={0.9}
              >
                <Text style={styles.enableButtonText}>
                  {busy ? 'Please wait…' : `Set Up ${biometryLabel}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
    backgroundColor: 'rgba(255,107,0,0.06)',
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
    transform: [{ translateY: 8 }],
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },

  subHeading: {
    marginTop: 10,
    color: '#B6C4BB',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    width: '92%',
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#17310F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  iconText: {
    fontSize: 22,
  },

  cardTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },

  cardStatus: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#0B3D2E',
  },

  cardDescription: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  button: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  enableButton: {
    backgroundColor: '#0B3D2E',
  },

  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  disableButton: {
    backgroundColor: '#FDEDED',
    borderWidth: 1,
    borderColor: '#F5C2C2',
  },

  disableButtonText: {
    color: '#B3261E',
    fontSize: 15,
    fontWeight: '800',
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from './utils/apiConfig';
import { navigationRef } from './utils/navigationRef';
import { clearSession } from './utils/session';
import { connectSocket } from './utils/socketManager';

/**
 * Global "account enforcement" gate — mounted once in App.js, outside the
 * navigation stack (same idiom as MeetingPopup/NotificationBell). Polls
 * GET /api/moderation/my-enforcement-status on mount and on every
 * AppState -> 'active' transition, and additionally reacts in real time to
 * the `moderation:update`/`force-logout` Socket.IO events an admin action
 * fires - so a block/ban applies immediately instead of waiting for the
 * next foreground or API call. This is defense-in-depth UI only: the
 * backend (authMiddleware) is the actual source of truth and already
 * blocks a blocked/banned account's requests with a 403 that carries the
 * same enforcementStatus/suspensionEndsAt fields this gate reads.
 */
const EnforcementStatusGate = () => {
  const [blockedState, setBlockedState] = useState(null); // { status, suspensionEndsAt } | null

  const checkStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}moderation/my-enforcement-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();

      const status = response.ok ? json?.data?.enforcementStatus : json?.enforcementStatus;
      const suspensionEndsAt = response.ok ? json?.data?.suspensionEndsAt : json?.suspensionEndsAt;

      // RESTRICTED now means "blocked" (temporarily or permanently) - it's
      // as hard a lockout as a suspension or ban, just possibly shorter.
      if (status === 'RESTRICTED' || status === 'SUSPENDED' || status === 'BANNED') {
        setBlockedState({ status, suspensionEndsAt });
        return;
      }

      setBlockedState(null);
    } catch (error) {
      // Non-fatal — a background status check failing shouldn't nag the user.
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await clearSession();
    setBlockedState(null);
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, []);

  useEffect(() => {
    checkStatus();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkStatus();
      }
    });

    return () => subscription.remove();
  }, [checkStatus]);

  useEffect(() => {
    let cancelled = false;
    let activeSocket = null;

    const onModerationUpdate = () => checkStatus();
    const onForceLogout = payload => {
      Alert.alert(
        'Account Banned',
        payload?.message || 'Your account has been banned by an administrator.',
        [{ text: 'OK', onPress: handleLogout }],
        { cancelable: false },
      );
    };

    (async () => {
      const socket = await connectSocket();
      if (!socket || cancelled) return;
      activeSocket = socket;
      socket.on('moderation:update', onModerationUpdate);
      socket.on('force-logout', onForceLogout);
    })();

    return () => {
      cancelled = true;
      activeSocket?.off('moderation:update', onModerationUpdate);
      activeSocket?.off('force-logout', onForceLogout);
    };
  }, [checkStatus, handleLogout]);

  if (!blockedState) return null;

  const isBanned = blockedState.status === 'BANNED';
  const isSuspended = blockedState.status === 'SUSPENDED';
  const endsAtText = blockedState.suspensionEndsAt
    ? new Date(blockedState.suspensionEndsAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  const badgeText = isBanned ? 'Account Banned' : isSuspended ? 'Account Suspended' : 'Account Blocked';
  const titleText = isBanned
    ? 'Your GBN account has been permanently banned.'
    : isSuspended
    ? `Your GBN account has been suspended${endsAtText ? ` until ${endsAtText}` : ''}.`
    : `Your GBN account has been blocked${endsAtText ? ` until ${endsAtText}` : ' permanently'}.`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.badge}>{badgeText}</Text>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.body}>
            This is due to a violation of GBN's community guidelines. If you believe this is a
            mistake, please contact our support team.
          </Text>
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.9} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EnforcementStatusGate;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,17,9,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  badge: {
    color: '#B3261E',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 25,
    marginBottom: 12,
  },
  body: {
    fontSize: 13.5,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 22,
  },
  logoutButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0B3D2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

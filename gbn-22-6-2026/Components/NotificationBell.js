import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchUnseenCount } from './utils/notificationsApi';
import { connectSocket } from './utils/socketManager';
import { navigationRef } from './utils/navigationRef';

// Screens where a floating bell doesn't belong: pre-login/auth flows, and
// NotificationsScreen itself (you're already there).
const HIDDEN_ROUTES = new Set([
  'Splash',
  'Login',
  'Register',
  'ResetPassword',
  'VerifyResetOTPScreen',
  'NotificationsScreen',
]);

/**
 * Global floating notification bell — mounted once in App.js, outside the
 * navigation stack (like MeetingPopup/PrivacyScreen), so it stays fixed in
 * the top-right corner, below the status bar, on every screen instead of
 * only being reachable from the Dashboard's Notifications card.
 */
const NotificationBell = ({ currentRoute }) => {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      setCount(await fetchUnseenCount());
    } catch (error) {
      // Non-fatal — badge just keeps its last known value.
    }
  }, []);

  useEffect(() => {
    loadCount();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') loadCount();
    });
    return () => subscription.remove();
  }, [loadCount]);

  // Re-check on every screen change too, e.g. coming back from
  // NotificationsScreen (which marks everything seen) should clear the badge.
  useEffect(() => {
    loadCount();
  }, [currentRoute, loadCount]);

  // Bump the badge the instant a meeting or admin notification goes out,
  // instead of waiting for the next AppState/route-change poll.
  useEffect(() => {
    let cancelled = false;
    let activeSocket = null;
    const bump = () => setCount(c => c + 1);

    (async () => {
      const socket = await connectSocket();
      if (!socket || cancelled) return;
      activeSocket = socket;
      socket.on('meeting:new', bump);
      socket.on('notification:new', bump);
    })();

    return () => {
      cancelled = true;
      activeSocket?.off('meeting:new', bump);
      activeSocket?.off('notification:new', bump);
    };
  }, [currentRoute]);

  if (!currentRoute || HIDDEN_ROUTES.has(currentRoute)) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.bell, { top: insets.top + 10 }]}
      onPress={() => navigationRef.current?.navigate('NotificationsScreen')}
    >
      <Text style={styles.bellIcon}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBell;

const styles = StyleSheet.create({
  bell: {
    position: 'absolute',
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#17310F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  bellIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F5F4',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

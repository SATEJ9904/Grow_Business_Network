import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from './utils/apiConfig';
import { connectSocket } from './utils/socketManager';
import MeetingCard from './MeetingCard';

/**
 * Global "new meeting" popup — mounted once in App.js, outside the
 * navigation stack, so it can surface over any screen. Two triggers:
 *  1. Live: a `meeting:new` Socket.IO event while the app is foregrounded.
 *  2. Catch-up: an `/api/meetings/unseen` check on mount and on every
 *     AppState -> 'active' transition, for members who were inactive when
 *     the meeting was created.
 * Both paths mark the meeting "seen" the moment it's shown, which is what
 * suppresses this popup on future opens (it then only lives in
 * NotificationsScreen).
 *
 * `currentRoute` re-triggers the socket connect attempt on every navigation
 * change (cheap/idempotent via connectSocket) so a login that happens after
 * this component has already mounted — i.e. every login, since it mounts
 * once at the App root — still ends up with a live socket instead of one
 * that was attempted before an access token existed.
 */
const MeetingPopup = ({ currentRoute }) => {
  const [queue, setQueue] = useState([]);
  const shownIdsRef = useRef(new Set());

  const markSeen = useCallback(async meetingId => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      fetch(`${BASE_URL}meetings/${meetingId}/mark-seen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (error) {
      // Non-fatal — worst case the popup shows again on the next open.
    }
  }, []);

  const enqueue = useCallback(
    meeting => {
      if (shownIdsRef.current.has(meeting._id)) return;
      shownIdsRef.current.add(meeting._id);
      setQueue(prev => [...prev, meeting]);
      markSeen(meeting._id);
    },
    [markSeen],
  );

  const checkUnseen = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}meetings/unseen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json.success) {
        (json.data || []).forEach(enqueue);
      }
    } catch (error) {
      console.log('Unseen meeting check failed:', error);
    }
  }, [enqueue]);

  useEffect(() => {
    checkUnseen();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkUnseen();
      }
    });

    return () => subscription.remove();
  }, [checkUnseen]);

  useEffect(() => {
    let cancelled = false;
    let activeSocket = null;

    const onMeetingNew = meeting => {
      enqueue({ ...meeting, isBooked: false, isSeen: false, isPast: false });
    };

    (async () => {
      const socket = await connectSocket();
      if (!socket || cancelled) return;
      activeSocket = socket;
      socket.on('meeting:new', onMeetingNew);
    })();

    return () => {
      cancelled = true;
      activeSocket?.off('meeting:new', onMeetingNew);
    };
  }, [enqueue, currentRoute]);

  const current = queue[0];

  const handleClose = () => {
    setQueue(prev => prev.slice(1));
  };

  const handleBooked = meetingId => {
    setQueue(prev => prev.map(m => (m._id === meetingId ? { ...m, isBooked: true } : m)));
  };

  if (!current) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.badge}>New Meeting Scheduled</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <MeetingCard meeting={current} onBooked={handleBooked} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MeetingPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,17,9,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  sheet: {
    backgroundColor: '#F3F5F4',
    borderRadius: 24,
    padding: 16,
    maxHeight: '86%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    color: '#17310F',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4B5563',
    lineHeight: 22,
  },
});

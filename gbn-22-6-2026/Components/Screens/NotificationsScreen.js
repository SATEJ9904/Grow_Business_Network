import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';
import { useDelayedNotice } from '../utils/guards';
import MeetingCard from '../MeetingCard';
import NotificationCard from '../NotificationCard';

const NotificationsScreen = ({ navigation }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [meetingsResponse, notificationsResponse] = await Promise.all([
        fetch(`${BASE_URL}meetings`, { headers }),
        fetch(`${BASE_URL}notifications`, { headers }),
      ]);
      const meetingsJson = await meetingsResponse.json();
      const notificationsJson = await notificationsResponse.json();

      const meetings = meetingsJson.success ? meetingsJson.data || [] : [];
      const notifications = notificationsJson.success ? notificationsJson.data || [] : [];

      const combined = [
        ...meetings.map(m => ({
          key: `meeting-${m._id}`,
          type: 'meeting',
          isSeen: m.isSeen,
          sortDate: new Date(m.meetingDateTime).getTime(),
          data: m,
        })),
        ...notifications.map(n => ({
          key: `notification-${n._id}`,
          type: 'notification',
          isSeen: n.isSeen,
          sortDate: new Date(n.sentAt || n.createdAt).getTime(),
          data: n,
        })),
      ].sort((a, b) => {
        if (a.isSeen !== b.isSeen) return a.isSeen ? 1 : -1;
        return b.sortDate - a.sortDate;
      });

      setFeed(combined);

      const unseenMeetings = meetings.filter(m => !m.isSeen);
      const unseenNotifications = notifications.filter(n => !n.isSeen);
      await Promise.all([
        ...unseenMeetings.map(m =>
          fetch(`${BASE_URL}meetings/${m._id}/mark-seen`, { method: 'POST', headers }).catch(() => {}),
        ),
        ...unseenNotifications.map(n =>
          fetch(`${BASE_URL}notifications/${n._id}/mark-seen`, { method: 'POST', headers }).catch(() => {}),
        ),
      ]);
    } catch (error) {
      console.log('Notifications fetch error:', error);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBooked = meetingId => {
    setFeed(prev =>
      prev.map(item =>
        item.type === 'meeting' && item.data._id === meetingId
          ? { ...item, data: { ...item.data, isBooked: true } }
          : item,
      ),
    );
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Notifications</Text>
        <Text style={styles.subHeading}>Meetings and announcements for your chapter.</Text>
      </View>

      {loading ? (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#17310F" />
          {showSlowNotice && (
            <Text style={[styles.emptyStateText, { marginTop: 12 }]}>
              Still working on it — this is taking longer than expected.
            </Text>
          )}
        </View>
      ) : feed.length > 0 ? (
        <FlatList
          data={feed}
          renderItem={({ item }) =>
            item.type === 'meeting' ? (
              <MeetingCard meeting={item.data} onBooked={handleBooked} showNewBadge collapsible />
            ) : (
              <NotificationCard notification={item.data} showNewBadge />
            )
          }
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No notifications yet.</Text>
        </View>
      )}
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F5F4',
  },
  header: {
    backgroundColor: '#041109',
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
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
  heading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subHeading: {
    marginTop: 10,
    color: '#B6C4BB',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
});

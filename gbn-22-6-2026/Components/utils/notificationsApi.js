import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from './apiConfig';

/**
 * Two independent feeds make up "notifications" in this app: auto-generated
 * new-meeting alerts and admin-composed announcements. Both bell badges
 * (DashboardScreen's card + the global NotificationBell) show their
 * combined unseen count, so this is the one place that adds them together.
 */
export const fetchUnseenCount = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) return 0;

  const headers = { Authorization: `Bearer ${token}` };

  const [meetingsJson, notificationsJson] = await Promise.all([
    fetch(`${BASE_URL}meetings/unseen`, { headers })
      .then(r => r.json())
      .catch(() => ({ success: false })),
    fetch(`${BASE_URL}notifications/unseen`, { headers })
      .then(r => r.json())
      .catch(() => ({ success: false })),
  ]);

  const meetingsCount = meetingsJson.success ? (meetingsJson.data || []).length : 0;
  const notificationsCount = notificationsJson.success ? (notificationsJson.data || []).length : 0;

  return meetingsCount + notificationsCount;
};

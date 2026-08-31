import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './navigationRef';
import { refreshSession } from './authSession';
import { clearSession } from './session';

// Every screen in this app calls the default `axios` export directly (e.g.
// `axios.get(...)`, `axios.put(...)`), so a single interceptor registered
// here on that same default instance covers every request in the app with
// no changes needed at any call site.
//
// Without this, an expired access token just failed every request with a
// generic error until the 30-minute client-side expiry timer in App.js
// happened to kick the user back to Login — the refresh-token endpoint and
// stored refresh token existed but nothing ever called them.

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  const result = await refreshSession(refreshToken);
  if (!result) return null;

  await AsyncStorage.setItem('accessToken', result.accessToken);
  await AsyncStorage.setItem('refreshToken', result.refreshToken);
  return result.accessToken;
}

async function handleRefreshFailure() {
  // A dead refresh token just means this session ended — the same account
  // may log back in later, so this preserves biometric config/counters
  // exactly like the explicit-logout and idle-expiry paths do. It's not an
  // account deletion, which is the only case that still uses a full
  // AsyncStorage.clear().
  await clearSession();
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}

axios.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error;

    if (!config || response?.status !== 401 || config._retriedAfterRefresh) {
      return Promise.reject(error);
    }
    config._retriedAfterRefresh = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      if (!newAccessToken) {
        await handleRefreshFailure();
        return Promise.reject(error);
      }

      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      return axios(config);
    } catch (refreshError) {
      await handleRefreshFailure();
      return Promise.reject(error);
    }
  },
);

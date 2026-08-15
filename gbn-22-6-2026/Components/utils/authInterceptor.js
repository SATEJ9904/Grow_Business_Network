import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';
import { navigationRef } from './navigationRef';

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
  if (!refreshToken) return null;

  // Plain axios (not the shared `axios` default whose interceptor we're
  // inside) so this call can't recursively trigger the 401 handler below.
  const response = await axios.create().post(
    `${API_BASE_URL}auth/refresh-token`,
    { refreshToken },
  );

  const newAccessToken = response.data?.data?.accessToken;
  const newRefreshToken = response.data?.data?.refreshToken;
  if (!newAccessToken) return null;

  await AsyncStorage.setItem('accessToken', newAccessToken);
  if (newRefreshToken) {
    await AsyncStorage.setItem('refreshToken', newRefreshToken);
  }
  return newAccessToken;
}

async function handleRefreshFailure() {
  await AsyncStorage.clear();
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

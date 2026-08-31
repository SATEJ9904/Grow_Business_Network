import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

/**
 * Exchanges a refresh token for a fresh {accessToken, refreshToken} pair.
 * Pure network call — deliberately does NOT touch AsyncStorage or Keychain
 * itself, since callers need different persistence strategies (see
 * authInterceptor.js vs. the biometric login flow in biometricAuth.js).
 *
 * Uses a fresh axios instance (not the shared default export) so this call
 * can't recursively trigger the 401 response interceptor registered on the
 * default instance in authInterceptor.js.
 *
 * Returns null if the refresh token is missing/invalid/expired.
 */
export async function refreshSession(refreshToken) {
  if (!refreshToken) return null;

  try {
    const response = await axios
      .create()
      .post(`${API_BASE_URL}auth/refresh-token`, { refreshToken });

    const accessToken = response.data?.data?.accessToken;
    const newRefreshToken = response.data?.data?.refreshToken;
    if (!accessToken) return null;

    return { accessToken, refreshToken: newRefreshToken || refreshToken };
  } catch (error) {
    return null;
  }
}

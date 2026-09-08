import AsyncStorage from '@react-native-async-storage/async-storage';

// The actual per-login keys — everything a fresh login writes and a fresh
// session depends on. Deliberately NOT `AsyncStorage.clear()`: this list is
// used by logout paths where the same account may come back (explicit
// logout, a dead refresh token), so it must leave biometric_* keys alone —
// see Components/utils/biometricAuth.js. Account-deletion flows still use a
// full `AsyncStorage.clear()` since the account itself is gone.
export const SESSION_KEYS = [
  'accessToken',
  'refreshToken',
  'userId',
  'userEmail',
  'userData',
  'userStatus',
  'userName',
];

export function clearSession() {
  return AsyncStorage.multiRemove(SESSION_KEYS);
}

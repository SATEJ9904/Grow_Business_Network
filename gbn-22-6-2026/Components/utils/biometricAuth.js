import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Biometric login: the OS (LocalAuthentication on iOS, BiometricPrompt on
 * Android via react-native-keychain) verifies the user's fingerprint/face.
 * This module never sees or stores the biometric itself — it only gates a
 * refresh token behind that OS check.
 *
 * Storage split (see plan doc for the full rationale):
 * - The refresh token, per account, biometric-gated: react-native-keychain,
 *   service `gbn_biocred_<userId>`. The only real secret in this module.
 * - Setup-prompt counters + enabled/invalidated flags, per account: plain
 *   AsyncStorage (`biometric_meta:<userId>`). Non-secret UX bookkeeping
 *   that must survive logout, so logout uses a selective multiRemove
 *   (Components/utils/session.js) instead of AsyncStorage.clear() — full
 *   clear() is reserved for account-deletion flows, which call
 *   purgeAccount() first to also drop the Keychain entry.
 * - "Last biometric account on this device" pointer, device-level: plain
 *   AsyncStorage (`biometric_last_account`), only ever set to an account
 *   that has biometricEnabled === true. This is what lets the Login screen
 *   decide whether to show the button before any text is typed, without
 *   ever letting one account's button unlock a different account's
 *   credential (each account's secret lives under its own Keychain
 *   service name).
 */

const CRED_SERVICE_PREFIX = 'gbn_biocred_';
const META_KEY_PREFIX = 'biometric_meta:';
const LAST_ACCOUNT_KEY = 'biometric_last_account';

const REQUIRED_LOGIN_GAP = 3;
const MAX_SETUP_PROMPTS = 2;

const DEFAULT_META = {
  biometricEnabled: false,
  biometricInvalidated: false,
  setupPromptCount: 0,
  successfulCredentialLoginCount: 0,
  lastPromptLoginNumber: null,
};

const credService = userId => `${CRED_SERVICE_PREFIX}${userId}`;
const metaKey = userId => `${META_KEY_PREFIX}${userId}`;

// Biometric-only: no device passcode/pattern/PIN fallback. A device with
// only a passcode (no enrolled biometric) never reaches this prompt at all
// (see getCapability()'s hardware+enrollment check), and a device that does
// have biometry must not be unlockable by its passcode as a substitute.
const CRED_OPTIONS = {
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function getMeta(userId) {
  if (!userId) return { ...DEFAULT_META };
  try {
    const raw = await AsyncStorage.getItem(metaKey(userId));
    return raw ? { ...DEFAULT_META, ...JSON.parse(raw) } : { ...DEFAULT_META };
  } catch (error) {
    return { ...DEFAULT_META };
  }
}

async function saveMeta(userId, meta) {
  await AsyncStorage.setItem(metaKey(userId), JSON.stringify(meta));
}

async function setLastAccountId(userId) {
  await AsyncStorage.setItem(LAST_ACCOUNT_KEY, userId);
}

async function clearLastAccountIfMatches(userId) {
  const current = await AsyncStorage.getItem(LAST_ACCOUNT_KEY);
  if (current === userId) {
    await AsyncStorage.removeItem(LAST_ACCOUNT_KEY);
  }
}

export function getLastAccountId() {
  return AsyncStorage.getItem(LAST_ACCOUNT_KEY);
}

/** Device support + current enrollment in one check — this library's
 * getSupportedBiometryType() resolves null unless there's both biometric
 * hardware AND at least one enrolled biometric ready to use. */
export async function getCapability() {
  try {
    const biometryType = await Keychain.getSupportedBiometryType();
    return { available: !!biometryType, biometryType };
  } catch (error) {
    return { available: false, biometryType: null };
  }
}

export function biometryLabel(biometryType) {
  switch (biometryType) {
    case Keychain.BIOMETRY_TYPE.FACE_ID:
      return 'Face ID';
    case Keychain.BIOMETRY_TYPE.TOUCH_ID:
      return 'Touch ID';
    case Keychain.BIOMETRY_TYPE.FINGERPRINT:
      return 'Fingerprint';
    case Keychain.BIOMETRY_TYPE.FACE:
      return 'Face Recognition';
    case Keychain.BIOMETRY_TYPE.IRIS:
      return 'Iris';
    default:
      return 'Biometrics';
  }
}

export async function isBiometricEnabled(userId) {
  if (!userId) return false;
  const meta = await getMeta(userId);
  return !!meta.biometricEnabled;
}

/** What the Login screen should show before any text is typed. */
export async function getLoginScreenBiometricState() {
  const { available, biometryType } = await getCapability();
  if (!available) {
    return { available: false, biometryType: null, configuredUserId: null };
  }

  const lastUserId = await getLastAccountId();
  if (lastUserId && (await isBiometricEnabled(lastUserId))) {
    return { available: true, biometryType, configuredUserId: lastUserId };
  }

  return { available: true, biometryType, configuredUserId: null };
}

export async function enableBiometric(userId, refreshToken) {
  if (!userId || !refreshToken) return false;

  const result = await Keychain.setGenericPassword('gbn', refreshToken, {
    service: credService(userId),
    ...CRED_OPTIONS,
  });
  if (!result) return false;

  const meta = await getMeta(userId);
  meta.biometricEnabled = true;
  meta.biometricInvalidated = false;
  await saveMeta(userId, meta);
  await setLastAccountId(userId);
  return true;
}

/** User-initiated disable (Security settings). Deliberately does NOT touch
 * the setup-prompt counters — suppression is permanent for the life of the
 * install, so a disable/re-enable cycle must not grant fresh prompts. */
export async function disableBiometric(userId) {
  if (!userId) return;
  await Keychain.resetGenericPassword({ service: credService(userId) }).catch(
    () => {},
  );
  const meta = await getMeta(userId);
  meta.biometricEnabled = false;
  meta.biometricInvalidated = false;
  await saveMeta(userId, meta);
  await clearLastAccountIfMatches(userId);
}

/** The device/OS invalidated our credential (enrollment changed, or a
 * stale/consumed refresh token was rejected server-side right after a
 * successful unlock). Same end state as disableBiometric, but flagged so
 * Security settings can explain why it turned off. */
export async function markInvalidated(userId) {
  if (!userId) return;
  await Keychain.resetGenericPassword({ service: credService(userId) }).catch(
    () => {},
  );
  const meta = await getMeta(userId);
  meta.biometricEnabled = false;
  meta.biometricInvalidated = true;
  await saveMeta(userId, meta);
  await clearLastAccountIfMatches(userId);
}

/** Account is being deleted — wipe everything for it, counters included. */
export async function purgeAccount(userId) {
  if (!userId) return;
  await Keychain.resetGenericPassword({ service: credService(userId) }).catch(
    () => {},
  );
  await AsyncStorage.removeItem(metaKey(userId));
  await clearLastAccountIfMatches(userId);
}

/** Refresh tokens rotate server-side, so the stored credential must be
 * re-persisted with the newly-issued one after every successful use, or
 * biometric login silently breaks after exactly one use. */
export async function updateStoredRefreshToken(userId, newRefreshToken) {
  if (!userId || !newRefreshToken) return false;
  if (!(await isBiometricEnabled(userId))) return false;

  const result = await Keychain.setGenericPassword('gbn', newRefreshToken, {
    service: credService(userId),
    ...CRED_OPTIONS,
  });
  return !!result;
}

function classifyFailure(error) {
  const message = String(error?.message || error || '').toLowerCase();
  if (message.includes('invalidat')) return 'invalidated';
  if (message.includes('lockout') || message.includes('too many attempts')) {
    return 'lockout';
  }
  if (message.includes('cancel')) return 'cancelled';
  if (
    message.includes('not available') ||
    message.includes('not enrolled') ||
    message.includes('no biometry') ||
    message.includes('no fingerprints') ||
    message.includes('not present')
  ) {
    return 'unavailable';
  }
  return 'failed';
}

/**
 * Invokes the native OS biometric prompt and, on success, returns the
 * gated refresh token. Returns a typed failure reason otherwise:
 * 'cancelled' | 'lockout' | 'invalidated' | 'unavailable' | 'failed'.
 */
export async function unlockWithBiometric(userId) {
  if (!userId) return { ok: false, reason: 'unavailable' };

  try {
    const credentials = await Keychain.getGenericPassword({
      service: credService(userId),
      authenticationPrompt: {
        title: 'Log in to GBN',
        cancel: 'Cancel',
      },
    });

    if (!credentials) {
      // Expected to exist (we only offer the button when biometricEnabled
      // is true) — its absence means the OS silently dropped it.
      await markInvalidated(userId);
      return { ok: false, reason: 'invalidated' };
    }

    return { ok: true, refreshToken: credentials.password };
  } catch (error) {
    const reason = classifyFailure(error);
    if (reason === 'invalidated' || reason === 'unavailable') {
      await markInvalidated(userId);
    }
    return { ok: false, reason };
  }
}

// ---- Anti-annoyance setup-prompt state machine ----
//
// Runs once per successful PASSWORD login (never for biometric logins).
// Traced against the spec's own worked example: prompt on login 1, skip
// 2-3, prompt on 4, skip forever after — matches exactly.

export async function recordPasswordLoginAndCheckPrompt(userId, capabilityAvailable) {
  if (!userId || !capabilityAvailable) return false;

  const meta = await getMeta(userId);
  if (meta.biometricEnabled) return false;

  meta.successfulCredentialLoginCount += 1;

  let shouldPrompt = false;
  if (meta.setupPromptCount < MAX_SETUP_PROMPTS) {
    if (meta.setupPromptCount === 0) {
      shouldPrompt = true;
    } else if (
      meta.successfulCredentialLoginCount - meta.lastPromptLoginNumber >=
      REQUIRED_LOGIN_GAP
    ) {
      shouldPrompt = true;
    }
  }

  if (shouldPrompt) {
    meta.setupPromptCount += 1;
    meta.lastPromptLoginNumber = meta.successfulCredentialLoginCount;
  }

  await saveMeta(userId, meta);
  return shouldPrompt;
}

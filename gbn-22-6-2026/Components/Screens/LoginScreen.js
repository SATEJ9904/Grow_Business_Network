import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/apiConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';
import * as biometricAuth from '../utils/biometricAuth';
import { refreshSession } from '../utils/authSession';
import KeyboardScreen from '../KeyboardScreen';

const API_URL = API_BASE_URL;

const BIOMETRIC_FAILURE_MESSAGES = {
  lockout:
    'Biometric authentication is temporarily unavailable. Please use your password.',
  invalidated:
    "Your biometric login needs to be set up again — you can do that from Security settings after you log in.",
  unavailable:
    'Biometric login is no longer available on this device. Please use your password.',
  failed: "Couldn't complete biometric login. Please try again or use your password.",
};

async function persistSession({ accessToken, refreshToken, user }) {
  if (accessToken) await AsyncStorage.setItem('accessToken', accessToken);
  if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
  if (user?._id) await AsyncStorage.setItem('userId', user._id);
  if (user) await AsyncStorage.setItem('userData', JSON.stringify(user));

  // The backend keeps one refresh token per account and rotates it on every
  // login (password or biometric) or silent refresh — so a plain password
  // login while biometric is already enabled still moves the server's copy
  // forward and orphans the one saved in Keychain. Re-sync it here too, on
  // every login, not just the biometric one; a no-op via isBiometricEnabled()
  // when biometric isn't set up for this account.
  if (user?._id && refreshToken) {
    await biometricAuth.updateStoredRefreshToken(user._id, refreshToken);
  }
}

export default function LoginScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const styles = useMemo(() => createStyles(width, height), [width, height]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [biometricState, setBiometricState] = useState({
    available: false,
    biometryType: null,
    configuredUserId: null,
  });
  const [biometricBusy, setBiometricBusy] = useState(false);

  const [setupPrompt, setSetupPrompt] = useState(null); // { userId, refreshToken } | null
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    biometricAuth.getLoginScreenBiometricState().then(state => {
      if (!cancelled) setBiometricState(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchAndPersistProfile = async accessToken => {
    const response = await fetch(`${API_URL}member/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await response.json();
    const user = json?.data;
    if (!user) throw new Error('Could not load your profile');
    return user;
  };

  const finishLogin = async ({ accessToken, refreshToken, user }) => {
    await persistSession({ accessToken, refreshToken, user });
    navigation.replace('Dashboard');
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Oops!', 'Please enter your email/username and password');
      return;
    }

    setLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const isEmail = trimmedIdentifier.includes('@');

      const payload = isEmail
        ? { email: trimmedIdentifier, password: password.trim() }
        : { username: trimmedIdentifier, password: password.trim() };

      console.log('📤 Sending Login Request...');
      console.log('👉 URL:', `${API_URL}auth/login`);
      console.log('👉 Payload:', payload);

      const response = await fetch(`${API_URL}auth/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Raw Response:', response);

      let responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.log('⚠️ Failed to parse JSON response:', parseError);
        data.message = responseText || 'Unexpected response from server';
      }

      console.log('✅ Parsed Response Data:', data);

      if (!response.ok) {
        const errorMessage =
          data?.message || `Server returned ${response.status}`;
        console.log('❌ Login Failed:', errorMessage);
        Alert.alert('Login Error', errorMessage);
        return;
      }

      if (data.success) {
        console.log('🎉 Login Success');

        const user = data?.data?.user || data?.user;

        if (user?.accountStatus === 0) {
          Alert.alert(
            'Account Deactivated',
            'Your account has been deleted or deactivated. Please contact admin.',
          );
          return;
        }
        const accessToken = data?.data?.accessToken || data?.accessToken;
        const refreshToken = data?.data?.refreshToken || data?.refreshToken;

        const shouldOfferSetup =
          user?._id &&
          refreshToken &&
          (await biometricAuth.recordPasswordLoginAndCheckPrompt(
            user._id,
            biometricState.available,
          ));

        if (shouldOfferSetup) {
          // Hold navigation until the user answers the setup prompt —
          // persist the session now so either choice can proceed safely.
          await persistSession({ accessToken, refreshToken, user });
          setSetupPrompt({ userId: user._id, refreshToken });
          return;
        }

        await finishLogin({ accessToken, refreshToken, user });
      } else {
        console.log('❌ Login Failed:', data?.message);
        console.log('📝 Full Response:', data);
        Alert.alert(
          'Login Error',
          data?.message || 'Login failed. Please check your credentials.',
        );
      }
    } catch (error) {
      console.log('🚨 Network Error:', error);
      console.log('🌐 Trying URL:', `${API_URL}auth/login`);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
      console.log('🔄 Loading End');
    }
  };

  const handleForgotPassword = async () => {
    if (forgotLoading) return;

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      Alert.alert('Oops!', 'Enter your email address');
      return;
    }

    // Password reset requires an email (not a username)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedIdentifier)) {
      Alert.alert(
        'Oops!',
        'Enter your email address (not username) to reset your password',
      );
      return;
    }

    const url = `${API_URL}auth/forgot-password`;
    console.log('📤 Forgot Password Start');
    console.log('👉 URL:', url);
    console.log('👉 Payload:', { email: trimmedIdentifier });

    setForgotLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedIdentifier }),
      });

      console.log('📥 Forgot Password Response Status:', res.status);
      const data = await res.json();
      console.log('📨 Forgot Password Response Data:', data);

      if (res.ok && data.success) {
        navigation.navigate('VerifyResetOTPScreen', {
          email: trimmedIdentifier,
        });
      } else {
        Alert.alert('Oops!', data.message || 'Unable to send reset link');
      }
    } catch (err) {
      console.log('🚨 Forgot Password Network Error:', err);
      Alert.alert('Oops!', getFriendlyErrorMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const userId = biometricState.configuredUserId;
    if (!userId || biometricBusy) return;

    console.log('[LoginScreen] handleBiometricLogin: tapped for userId =', userId);
    setBiometricBusy(true);
    try {
      const unlock = await biometricAuth.unlockWithBiometric(userId);
      console.log('[LoginScreen] handleBiometricLogin: unlock result =', unlock);

      if (!unlock.ok) {
        if (unlock.reason !== 'cancelled') {
          Alert.alert(
            'Biometric Login',
            BIOMETRIC_FAILURE_MESSAGES[unlock.reason] ||
              BIOMETRIC_FAILURE_MESSAGES.failed,
          );
        }
        if (unlock.reason === 'invalidated' || unlock.reason === 'unavailable') {
          setBiometricState(await biometricAuth.getLoginScreenBiometricState());
        }
        return;
      }

      const refreshed = await refreshSession(unlock.refreshToken);
      console.log('[LoginScreen] handleBiometricLogin: refreshSession succeeded =', !!refreshed);
      if (!refreshed) {
        // The stored refresh token was rejected server-side — it's stale
        // (rotated/expired), not a generic network hiccup. Clear it so the
        // app stops offering a dead button, same as an OS-level invalidation.
        await biometricAuth.markInvalidated(userId);
        setBiometricState(await biometricAuth.getLoginScreenBiometricState());
        Alert.alert(
          'Biometric Login',
          'Your saved session has expired. Please log in with your password.',
        );
        return;
      }

      // Re-persist immediately — refresh tokens rotate, so skipping this
      // breaks biometric login after exactly one use.
      await biometricAuth.updateStoredRefreshToken(
        userId,
        refreshed.refreshToken,
      );

      const user = await fetchAndPersistProfile(refreshed.accessToken);
      await finishLogin({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        user,
      });
      console.log('[LoginScreen] handleBiometricLogin: finished login');
    } catch (error) {
      console.log('[LoginScreen] handleBiometricLogin: caught error ->', error?.message || error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleSetUpBiometric = async () => {
    if (!setupPrompt) return;
    console.log('[LoginScreen] handleSetUpBiometric: enabling for userId =', setupPrompt.userId);
    setSettingUp(true);
    try {
      const ok = await biometricAuth.enableBiometric(
        setupPrompt.userId,
        setupPrompt.refreshToken,
      );
      console.log('[LoginScreen] handleSetUpBiometric: enableBiometric ok =', ok);
      if (!ok) {
        Alert.alert(
          'Oops!',
          'Could not set up biometric login right now. You can try again later from Security settings.',
        );
      }
    } catch (error) {
      console.log('[LoginScreen] Biometric setup error:', error);
    } finally {
      setSettingUp(false);
      setSetupPrompt(null);
      navigation.replace('Dashboard');
    }
  };

  const handleDismissSetupPrompt = () => {
    setSetupPrompt(null);
    navigation.replace('Dashboard');
  };

  const guardedForgotPassword = useGuardedAction(handleForgotPassword);
  const guardedLogin = useGuardedAction(handleLogin);
  const guardedBiometricLogin = useGuardedAction(handleBiometricLogin);
  const guardedToggleSecure = useGuardedAction(() => setSecure(s => !s), 250);
  const guardedGoRegister = useGuardedAction(() =>
    navigation.navigate('Register'),
  );

  const biometryLabel = biometricAuth.biometryLabel(
    biometricState.biometryType,
  );

  // Shared between the portrait and landscape branches below, so the form
  // itself is defined exactly once - only how it's framed (stacked under
  // the logo vs. beside it in its own scrollable pane) differs by
  // orientation.
  const formContent = (
    <>
      <Text style={styles.title}>Welcome to GBN</Text>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Email or Username"
          placeholderTextColor="#000000"
          autoCapitalize="none"
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
        />
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#000000"
          secureTextEntry={secure}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={guardedToggleSecure}
          style={styles.eyeButton}
          hitSlop={{
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
          }}
        >
          <Icon name={secure ? 'eye-off' : 'eye'} size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.forgotContainer}
        onPress={guardedForgotPassword}
        disabled={forgotLoading}
      >
        <Text style={styles.forgot}>
          {forgotLoading ? 'Sending...' : 'Forgot password?'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={guardedLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      {biometricState.available && biometricState.configuredUserId && (
        <>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[
              styles.biometricButton,
              biometricBusy && styles.disabledButton,
            ]}
            onPress={guardedBiometricLogin}
            disabled={biometricBusy}
          >
            <Icon
              name="finger-print-outline"
              size={20}
              color="#0B3D2E"
              style={styles.biometricIcon}
            />
            <Text style={styles.biometricButtonText}>
              {biometricBusy ? 'Checking…' : `Log In with ${biometryLabel}`}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.registerRow}>
        <Text style={styles.accountText}>Don’t have an account? </Text>
        <TouchableOpacity onPress={guardedGoRegister}>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ImageBackground
      source={require('../Images/bgimage2.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <KeyboardScreen>
      {isLandscape ? (
        // LANDSCAPE ONLY - a real two-pane layout, not the portrait design
        // squeezed sideways. The brand pane is fixed/always visible; only
        // the form pane scrolls if it doesn't fit the shorter viewport, so
        // the logo can never end up pushed off-screen by the form's own
        // height the way a single shared scroll region did.
        <View style={styles.landscapeSplit}>
          <View style={styles.landscapeBrandPane}>
            <View style={styles.landscapeBrandTop}>
              <Image
                source={require('../Images/logo.jpeg')}
                style={[styles.logo, styles.logoLandscape]}
              />
              <Text style={[styles.tagline, styles.taglineLandscape]}>
                Grow your network.{'\n'}Grow your business.
              </Text>

              <View style={styles.landscapeFeatureRow}>
                <View style={styles.landscapeFeature}>
                  <Icon name="people-outline" size={22} color="#FF7A00" />
                  <Text style={styles.landscapeFeatureText}>
                    Connect{'\n'}Professionals
                  </Text>
                </View>

                <View style={styles.landscapeFeature}>
                  <Icon name="trending-up-outline" size={22} color="#FF7A00" />
                  <Text style={styles.landscapeFeatureText}>
                    Expand{'\n'}Your Business
                  </Text>
                </View>

                <View style={styles.landscapeFeature}>
                  <Icon name="git-network-outline" size={22} color="#FF7A00" />
                  <Text style={styles.landscapeFeatureText}>
                    Build Stronger{'\n'}Networks
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.landscapeBrandBottomRow}>
              <Text style={styles.landscapeBrandCaption}>PEOPLE</Text>
              <Text style={styles.landscapeBrandCaptionDivider}>|</Text>
              <Text style={styles.landscapeBrandCaption}>BUSINESS</Text>
              <Text style={styles.landscapeBrandCaptionDivider}>|</Text>
              <Text style={styles.landscapeBrandCaption}>GROWTH</Text>
              <View style={styles.landscapeBrandCaptionLine} />
            </View>
          </View>

          <View style={styles.landscapeFormPane}>
            <ScrollView
              style={styles.scrollFlex}
              contentContainerStyle={styles.landscapeFormScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.card}>
                <Text style={[styles.title, styles.landscapeTitle]}>Welcome to GBN</Text>
                <Text style={styles.landscapeSubtitle}>
                  Sign in to continue to your business network
                </Text>

                <View style={[styles.inputBox, styles.landscapeInputBox]}>
                  <Icon
                    name="mail-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.landscapeInputIcon}
                  />
                  <TextInput
                    placeholder="Email or Username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    style={styles.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                </View>

                <View style={[styles.inputBox, styles.landscapeInputBox]}>
                  <Icon
                    name="lock-closed-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.landscapeInputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={secure}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={guardedToggleSecure}
                    style={styles.eyeButton}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  >
                    <Icon name={secure ? 'eye-off' : 'eye'} size={22} color="#000" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotContainer}
                  onPress={guardedForgotPassword}
                  disabled={forgotLoading}
                >
                  <Text style={styles.forgot}>
                    {forgotLoading ? 'Sending...' : 'Forgot password?'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.landscapeButton,
                    loading && styles.disabledButton,
                  ]}
                  onPress={guardedLogin}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                  {!loading && (
                    <Icon
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                      style={styles.landscapeButtonIcon}
                    />
                  )}
                </TouchableOpacity>

                {biometricState.available && biometricState.configuredUserId && (
                  <>
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.biometricButton,
                        biometricBusy && styles.disabledButton,
                      ]}
                      onPress={guardedBiometricLogin}
                      disabled={biometricBusy}
                    >
                      <Icon
                        name="finger-print-outline"
                        size={20}
                        color="#0B3D2E"
                        style={styles.biometricIcon}
                      />
                      <Text style={styles.biometricButtonText}>
                        {biometricBusy ? 'Checking…' : `Log In with ${biometryLabel}`}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.registerRow}>
                  <Text style={styles.accountText}>Don’t have an account? </Text>
                  <TouchableOpacity onPress={guardedGoRegister}>
                    <Text style={styles.registerLink}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        // PORTRAIT ONLY - unchanged from the original design.
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={require('../Images/logo.jpeg')} style={styles.logo} />
            <Text style={styles.tagline}>
              {' '}
              Grow your network. Grow your business.
            </Text>
          </View>

          <View style={styles.card}>{formContent}</View>
        </ScrollView>
      )}
      </KeyboardScreen>

      <Modal
        visible={!!setupPrompt}
        transparent
        animationType="fade"
        onRequestClose={handleDismissSetupPrompt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Icon name="finger-print" size={28} color="#0B3D2E" />
            </View>

            <Text style={styles.modalTitle}>Login faster next time</Text>
            <Text style={styles.modalBody}>
              You can use your {biometryLabel.toLowerCase()} to securely log
              in without entering your credentials again.
            </Text>

            <TouchableOpacity
              style={[styles.button, settingUp && styles.disabledButton]}
              onPress={handleSetUpBiometric}
              disabled={settingUp}
            >
              <Text style={styles.buttonText}>
                {settingUp ? 'Setting up…' : `Set Up ${biometryLabel}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalNotNow}
              onPress={handleDismissSetupPrompt}
              disabled={settingUp}
            >
              <Text style={styles.modalNotNowText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// A function of the live window width/height (via useWindowDimensions in
// the component below) rather than a plain StyleSheet.create at module
// scope - so `scale()` and the sizes derived from it stay correct after a
// rotation instead of freezing at whatever the screen was on first launch.
const createStyles = (width, height) => {
  const scale = size => (width / 375) * size;

  return StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: scale(20),
  },

  scrollFlex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.03,
  },

  // Landscape: logo/tagline sit in a left column beside the form instead
  // of stacked above it, so rotating reads as a deliberate two-pane layout
  // rather than the portrait design just squashed sideways.
  // Landscape only - portrait keeps its original single-column layout and
  // styles untouched. Content is top-anchored (not vertically centered)
  // here on purpose: centering an overflowing flex container inside a
  // ScrollView is unreliable in RN and was pushing the logo down /
  // clipping the tagline off the top when the two columns together were
  // taller than the rotated viewport - top-anchored + scrollable never
  // hides anything, however tall the content gets.
  // Landscape only, real two-pane layout - a fixed brand pane (never
  // scrolls, so the logo/tagline are always fully visible) beside an
  // independently-scrolling form pane. Using two separately-sized flex
  // regions instead of one shared scroller is what actually fixes the
  // earlier bug: the brand pane's height is the real screen height, not
  // stretched to match the form's height, so centering inside it never
  // overflows.
  landscapeSplit: {
    flex: 1,
    flexDirection: 'row',
  },

  landscapeBrandPane: {
    flex: 0.3,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    paddingVertical: scale(20),
  },

  landscapeBrandTop: {
    alignItems: 'flex-start',
  },

  landscapeFeatureRow: {
    flexDirection: 'row',
    marginTop: scale(18),
  },

  landscapeFeature: {
    marginRight: scale(16),
    maxWidth: scale(80),
  },

  landscapeFeatureText: {
    marginTop: scale(6),
    color: '#0B3D2E',
    fontSize: scale(10),
    fontWeight: '700',
    lineHeight: scale(13),
  },

  landscapeBrandBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  landscapeBrandCaption: {
    color: '#6B7280',
    fontSize: scale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  landscapeBrandCaptionDivider: {
    color: '#D1D5DB',
    fontSize: scale(10),
    marginHorizontal: scale(6),
  },

  landscapeBrandCaptionLine: {
    width: scale(40),
    height: 1,
    backgroundColor: '#D1D5DB',
    marginLeft: scale(10),
  },

  landscapeFormPane: {
    // No maxWidth here on purpose - it was capping this pane below its
    // 0.7 share on wider screens, leaving unused space instead of a true
    // 30:70 split.
    flex: 0.7,
  },

  landscapeFormScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: scale(20),
    paddingHorizontal: scale(20),
  },

  logo: {
    width: scale(160),
    height: scale(80),
    resizeMode: 'contain',
  },

  // Landscape only - smaller than the portrait logo since it now shares
  // the screen with the form instead of having the full width to itself.
  logoLandscape: {
    width: scale(100),
    height: scale(50),
  },

  tagline: {
    color: '#000',
    fontSize: scale(13),
    marginTop: 5,
  },

  // Landscape only - a more deliberate, premium treatment for the brand
  // pane's copy than plain black caption text: brand-green, a touch
  // larger, letter-spaced, with a short accent line underneath.
  taglineLandscape: {
    color: '#0B3D2E',
    fontSize: scale(19),
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'left',
    marginTop: scale(16),
    lineHeight: scale(25),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(18),
    elevation: 8,
  },

  title: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#0B3D2E',
    marginTop: scale(10),
    marginBottom: scale(25),
  },

  // Landscape only.
  landscapeTitle: {
    marginBottom: scale(4),
  },

  landscapeSubtitle: {
    color: '#6B7280',
    fontSize: scale(13),
    marginBottom: scale(20),
  },

  subtitle: {
    color: '#777',
    marginBottom: scale(12),
    fontSize: scale(13),
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: scale(12),
    paddingHorizontal: scale(10),
    marginBottom: scale(10),
    backgroundColor: '#fafafa',
  },

  // Landscape only - a bit taller, with room for the leading icon added
  // below.
  landscapeInputBox: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(4),
  },

  landscapeInputIcon: {
    marginRight: scale(10),
  },

  input: {
    flex: 1,
    padding: scale(10),
    fontSize: scale(14),
    color: '#000',
  },

  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: scale(10),
  },

  forgot: {
    color: '#0B3D2E',
    fontSize: scale(12),
    fontWeight: '600',
  },

  button: {
    backgroundColor: '#2F4F1E',
    padding: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    marginTop: scale(5),
  },

  // Landscape only - the button gains a trailing arrow icon, so it needs
  // to lay its content out as a row instead of the portrait version's
  // single centered line of text.
  landscapeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  landscapeButtonIcon: {
    marginLeft: scale(8),
  },

  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scale(15),
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(16),
    marginBottom: scale(4),
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },

  dividerText: {
    color: '#999',
    fontSize: scale(12),
    marginHorizontal: scale(10),
  },

  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: '#D9E5DE',
    padding: scale(13),
    borderRadius: scale(12),
    marginTop: scale(12),
  },

  biometricIcon: {
    marginRight: scale(8),
  },

  biometricButtonText: {
    color: '#0B3D2E',
    fontWeight: '700',
    fontSize: scale(14),
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scale(12),
  },

  accountText: {
    color: '#666',
    fontSize: scale(13),
  },

  registerLink: {
    color: '#0B3D2E',
    fontWeight: 'bold',
    fontSize: scale(13),
  },

  eyeIcon: {
    fontSize: scale(16),
    paddingHorizontal: scale(5),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: scale(22),
    padding: scale(22),
    alignItems: 'center',
  },

  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F0F5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(14),
  },

  modalTitle: {
    fontSize: scale(18),
    fontWeight: '800',
    color: '#0B3D2E',
    textAlign: 'center',
  },

  modalBody: {
    marginTop: scale(8),
    marginBottom: scale(18),
    fontSize: scale(13),
    lineHeight: scale(20),
    color: '#666',
    textAlign: 'center',
  },

  modalNotNow: {
    marginTop: scale(10),
    padding: scale(8),
  },

  modalNotNowText: {
    color: '#888',
    fontWeight: '600',
    fontSize: scale(13),
  },
  });
};

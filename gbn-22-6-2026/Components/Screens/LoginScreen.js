import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

// const rawApiUrl =  '192.168.14.149:5001/api/';
const API_URL = BASE_URL;

const { width, height } = Dimensions.get('window');

const scale = size => (width / 375) * size;

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email/username and password');
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

        console.log('👤 User:', user);
        console.log('🔐 Access Token:', accessToken);
        console.log('📊 Refresh Token:', refreshToken);

        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          console.log('✅ AccessToken Saved');
        }

        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
          console.log('✅ RefreshToken Saved');
        }

        if (user?._id) {
          await AsyncStorage.setItem('userId', user._id);
          console.log('✅ UserID Saved:', user._id);
        }

        if (user) {
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          console.log('✅ User Data Saved');
        }

        await AsyncStorage.setItem('loginTime', Date.now().toString());
        console.log('✅ Login Time Saved');

        console.log('📦 AsyncStorage Save Complete');

        // Navigate immediately without alert for better UX
        console.log('➡️ Navigating to AllProfiles');
        navigation.replace('Dashboard');
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
      Alert.alert('Error', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
      console.log('🔄 Loading End');
    }
  };

  const handleForgotPassword = async () => {
    if (forgotLoading) return;

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      Alert.alert('Error', 'Enter your email address');
      return;
    }

    // Password reset requires an email (not a username)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedIdentifier)) {
      Alert.alert(
        'Error',
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
        Alert.alert('Error', data.message || 'Unable to send reset link');
      }
    } catch (err) {
      console.log('🚨 Forgot Password Network Error:', err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setForgotLoading(false);
    }
  };

  const guardedForgotPassword = useGuardedAction(handleForgotPassword);
  const guardedLogin = useGuardedAction(handleLogin);
  const guardedToggleSecure = useGuardedAction(() => setSecure(s => !s), 250);
  const guardedGoRegister = useGuardedAction(() =>
    navigation.navigate('Register'),
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

      <View style={styles.logoContainer}>
        <Image source={require('../Images/logo.jpeg')} style={styles.logo} />
        <Text style={styles.tagline}>
          {' '}
          Grow your network. Grow your business.
        </Text>
      </View>

      <View style={styles.card}>
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

        <View style={styles.registerRow}>
          <Text style={styles.accountText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={guardedGoRegister}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.03,
  },

  logo: {
    width: scale(160),
    height: scale(80),
    resizeMode: 'contain',
  },

  tagline: {
    color: '#000',
    fontSize: scale(13),
    marginTop: 5,
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

  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scale(15),
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
});

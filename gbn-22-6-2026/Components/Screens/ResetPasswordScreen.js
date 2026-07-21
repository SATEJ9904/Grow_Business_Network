import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BASE_URL } from '@env';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

const API_URL = BASE_URL;
const { width } = Dimensions.get('window');
const scale = size => (width / 375) * size;

export default function ResetPasswordScreen({ route, navigation }) {
  const email = route?.params?.email;

  console.log('EMAIL:', email);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please enter all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Invalid email');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      console.log('📥 Reset response status:', res.status);
      console.log('📥 Reset response:', data);

      if (data.success) {
        setIsSuccess(true);
        // Navigate to Login after 2 seconds
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      } else {
        console.log('❌ Reset failed:', data.message);
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.log('🚨 Reset Error:', err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const guardedToggleSecurePassword = useGuardedAction(
    () => setSecurePassword(prev => !prev),
    250,
  );
  const guardedToggleSecureConfirmPassword = useGuardedAction(
    () => setSecureConfirmPassword(prev => !prev),
    250,
  );
  const guardedReset = useGuardedAction(handleReset);

  // Success screen
  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Password Reset Successful!</Text>
          <Text style={styles.successMessage}>
            Your password has been updated. Redirecting to login...
          </Text>
        </View>
      </View>
    );
  }

  // Reset form
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter a new password and confirm it to finish resetting your account.
      </Text>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="New Password"
          placeholderTextColor="#000"
          secureTextEntry={securePassword}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={guardedToggleSecurePassword}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Icon
            name={securePassword ? 'eye-off' : 'eye'}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#000"
          secureTextEntry={secureConfirmPassword}
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={guardedToggleSecureConfirmPassword}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Icon
            name={secureConfirmPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={guardedReset}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f7fafc',
    padding: scale(20),
  },
  heading: {
    fontSize: scale(26),
    color: '#2F4F1E',
    fontWeight: '700',
    marginBottom: scale(10),
  },
  subtitle: {
    fontSize: scale(14),
    color: '#4a4a4a',
    marginBottom: scale(24),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#dde2ea',
  },
  eyeButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: scale(48),
    fontSize: scale(16),
    color: '#121212',
  },
  button: {
    backgroundColor: '#2F4F1E',
    paddingVertical: scale(15),
    borderRadius: scale(16),
    alignItems: 'center',
    marginTop: scale(10),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(30),
    alignItems: 'center',
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
  },
  successIcon: {
    fontSize: scale(60),
    color: '#28a745',
    marginBottom: scale(15),
  },
  successTitle: {
    fontSize: scale(22),
    color: '#2F4F1E',
    fontWeight: '700',
    marginBottom: scale(10),
    textAlign: 'center',
  },
  successMessage: {
    fontSize: scale(14),
    color: '#666',
    textAlign: 'center',
  },
});

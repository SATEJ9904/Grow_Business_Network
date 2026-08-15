// Components/Screens/VerifyResetOTPScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { API_BASE_URL } from '../utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

const API_URL = API_BASE_URL;

export default function VerifyResetOTPScreen({
  route,
  navigation,
}) {
  const email = route?.params?.email;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert('Oops!', 'Enter OTP');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}auth/verify-reset-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        },
      );

      const data = await res.json();

      console.log('VERIFY OTP RESPONSE:', data);

      if (data.success) {
        navigation.navigate('ResetPassword', {
          email,
        });
      } else {
        Alert.alert(
          'Oops!',
          data.message || 'Invalid OTP',
        );
      }
    } catch (error) {
      Alert.alert(
        'Oops!',
        getFriendlyErrorMessage(error),
      );
    }

    setLoading(false);
  };

  const guardedVerifyOtp = useGuardedAction(verifyOtp);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Verify OTP
      </Text>

      <Text style={styles.subTitle}>
        OTP sent to:
      </Text>

      <Text style={styles.email}>
        {email}
      </Text>

      <TextInput
        placeholder="Enter OTP"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={guardedVerifyOtp}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Verifying...'
            : 'Verify OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    ...StyleSheet.absoluteFillObject,
    justifyContent:'center',
    padding:20,
    backgroundColor:'#fff',
  },
  title:{
    fontSize:28,
    fontWeight:'bold',
    marginBottom:20,
  },
  subTitle:{
    fontSize:14,
  },
  email:{
    fontWeight:'bold',
    marginBottom:20,
  },
  input:{
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:10,
    padding:12,
    marginBottom:20,
  },
  button:{
    backgroundColor:'#2F4F1E',
    padding:15,
    borderRadius:10,
  },
  buttonText:{
    color:'#fff',
    textAlign:'center',
    fontWeight:'bold',
  },
});
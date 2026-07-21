import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDelayedNotice } from '../utils/guards';

const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export default function SplashScreen({ navigation, route }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [initializing, setInitializing] = useState(true);
  const showSlowNotice = useDelayedNotice(initializing, 8000);

  useEffect(() => {
    const token = route?.params?.token;

    const checkLogin = async () => {
      try {
        const user = await AsyncStorage.getItem('userData');
        const loginTime = await AsyncStorage.getItem('loginTime');

        if (
          user &&
          loginTime &&
          Date.now() - parseInt(loginTime, 10) < EXPIRY_TIME
        ) {
          console.log('✅ Session valid - auto-login');
          navigation.replace('Dashboard');
          return;
        }

        if (loginTime) {
          console.log('⚠️ Session expired, clearing storage');
          await AsyncStorage.clear();
        }

        navigation.replace('Login');
      } catch (error) {
        console.log('🚨 Splash login check failed:', error);
        navigation.replace('Login');
      } finally {
        setInitializing(false);
      }
    };

    Animated.sequence([
      // Fade + Zoom In
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),

      // Small delay
      Animated.delay(500),

      // Fade Out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (token) {
        console.log('🔐 Deep link detected with token:', token);
        setInitializing(false);
        navigation.replace('ResetPassword', { token });
      } else {
        checkLogin();
      }
    });
  }, [route?.params?.token]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2F4F1E" barStyle="light-content" />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image source={require('../Images/logo.jpeg')} style={styles.logo} />

        <Text style={styles.text}>Grow Business Networks</Text>
      </Animated.View>

      {initializing && showSlowNotice && (
        <Text style={styles.slowNotice}>
          Still working on it — this is taking longer than expected. Please
          check your connection.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    alignItems: 'center',
  },

  logo: {
    width: 180,
    height: 100,
    resizeMode: 'contain',
  },

  text: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    letterSpacing: 1,
  },

  slowNotice: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    color: '#cfe8db',
    fontSize: 12,
    textAlign: 'center',
  },
});
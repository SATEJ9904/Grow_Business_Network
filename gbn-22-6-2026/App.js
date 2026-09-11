import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './Components/Screens/SplashScreen';
import LoginScreen from './Components/Screens/LoginScreen';
import RegisterScreen from './Components/Screens/RegisterScreen';
import GenerateScreen from './Components/Screens/GenerateScreen';
import PreviewScreen from './Components/Screens/PreviewScreen';
import AccountScreen from './Components/Screens/AccountScreen';
import StatusScreen from './Components/Screens/StatusScreen';
import AllProfilesScreen from './Components/Screens/AllProfilesScreen';
import ResetPasswordScreen from './Components/Screens/ResetPasswordScreen';
import DashboardScreen from './Components/Screens/DashboardScreen';
import SelectChapterScreen from './Components/Screens/SelectChapterScreen';
import EditWebsiteScreen from './Components/Screens/EditWebsiteScreen';
import EditProfileScreen from './Components/Screens/EditProfileScreen';
import ProfileScreen from './Components/Screens/ProfileScreen';
import MembersScreen from './Components/Screens/MembersScreen';
import VerifyResetOTPScreen from './Components/Screens/VerifyResetOTPScreen';
import MeetingsScreen from './Components/Screens/MeetingsScreen';
import NotificationsScreen from './Components/Screens/NotificationsScreen';
import SecuritySettingsScreen from './Components/Screens/SecuritySettingsScreen';
import DeleteAccountScreen from './Components/Screens/DeleteAccountScreen';
import ErrorBoundary from './Components/ErrorBoundary';
import PrivacyScreen from './Components/PrivacyScreen';
import MeetingPopup from './Components/MeetingPopup';
import NotificationBell from './Components/NotificationBell';
import { navigationRef } from './Components/utils/navigationRef';
import { clearSession } from './Components/utils/session';
import { isPaymentInFlight } from './Components/utils/paymentGuard';
import './Components/utils/authInterceptor';

const Stack = createNativeStackNavigator();

const BACKGROUNDED_AT_KEY = 'backgroundedAt';
const SESSION_GRACE_MS = 30 * 60 * 1000; // keep the session alive across up to 30 min backgrounded

const linking = {
  prefixes: ['gbn://', 'https://api.gbnsocialassociations.in'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(null);

  const syncCurrentRoute = () => {
    setCurrentRoute(navigationRef.current?.getCurrentRoute()?.name ?? null);
  };

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      console.log('INITIAL URL =', url);
    });

    const sub = Linking.addEventListener('url', event => {
      console.log('DEEP LINK URL =', event.url);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextState => {
      // Backgrounding (Home button, task switch, or handing off to a native
      // picker like the image/video library) just records when it happened.
      // The session only actually gets cleared on resume, and only if more
      // than SESSION_GRACE_MS has passed — so a quick trip to the photo
      // picker or another app doesn't force a fresh login, but leaving the
      // app idle for a while does. An in-flight Razorpay payment (which
      // backgrounds the app to hand off to a UPI app/browser) is exempted
      // from the grace period entirely — see paymentGuard.js.
      if (nextState === 'background') {
        try {
          if (await isPaymentInFlight()) return;
          await AsyncStorage.setItem(BACKGROUNDED_AT_KEY, String(Date.now()));
        } catch (err) {
          console.log('Recording background timestamp failed:', err);
        }
        return;
      }

      if (nextState === 'active') {
        try {
          const backgroundedAt = await AsyncStorage.getItem(BACKGROUNDED_AT_KEY);
          await AsyncStorage.removeItem(BACKGROUNDED_AT_KEY);

          if (backgroundedAt && Date.now() - Number(backgroundedAt) > SESSION_GRACE_MS) {
            await clearSession();
          }

          const accessToken = await AsyncStorage.getItem('accessToken');
          if (!accessToken) {
            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        } catch (err) {
          console.log('Resume auth check failed:', err);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <NavigationContainer
            linking={linking}
            ref={navigationRef}
            onReady={syncCurrentRoute}
            onStateChange={syncCurrentRoute}
          >
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />

              <Stack.Screen name="Login" component={LoginScreen} />

              <Stack.Screen name="Register" component={RegisterScreen} />

              <Stack.Screen name="Generate" component={GenerateScreen} />

              <Stack.Screen name="Preview" component={PreviewScreen} />

              <Stack.Screen name="Account" component={AccountScreen} />

              <Stack.Screen name="Status" component={StatusScreen} />

              <Stack.Screen name="AllProfiles" component={AllProfilesScreen} />

              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
              />

              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen
                name="SelectChapterScreen"
                component={SelectChapterScreen}
              />
              <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
              <Stack.Screen
                name="EditProfileScreen"
                component={EditProfileScreen}
              />
              <Stack.Screen
                name="EditWebsiteScreen"
                component={EditWebsiteScreen}
              />
              <Stack.Screen name="MembersScreen" component={MembersScreen} />
              <Stack.Screen
                name="VerifyResetOTPScreen"
                component={VerifyResetOTPScreen}
              />
              <Stack.Screen name="MeetingsScreen" component={MeetingsScreen} />
              <Stack.Screen
                name="NotificationsScreen"
                component={NotificationsScreen}
              />
              <Stack.Screen
                name="SecuritySettingsScreen"
                component={SecuritySettingsScreen}
              />
              <Stack.Screen
                name="DeleteAccountScreen"
                component={DeleteAccountScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <PrivacyScreen />
          <MeetingPopup currentRoute={currentRoute} />
          <NotificationBell currentRoute={currentRoute} />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

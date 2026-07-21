import React, { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { Linking } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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


const Stack = createNativeStackNavigator();

const navigationRef = React.createRef();

const EXPIRY_TIME = 30 * 60 * 1000;
const linking = {
  prefixes: ['gbn://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {
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
    const subscription = AppState.addEventListener(
      'change',
      async nextState => {
        // ⏰ Auto logout after expiry
        if (nextState === 'active') {
          try {
            const loginTime = await AsyncStorage.getItem('loginTime');

            if (
              loginTime &&
              Date.now() - parseInt(loginTime, 10) > EXPIRY_TIME
            ) {
              await AsyncStorage.clear();

              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          } catch (err) {
            console.log('App resume expiry check failed:', err);
          }
        }
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer linking={linking} ref={navigationRef}>
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

          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

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
          <Stack.Screen name="VerifyResetOTPScreen" component={VerifyResetOTPScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

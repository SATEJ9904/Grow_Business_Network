import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useGuardedAction } from '../utils/guards';
import { clearSession } from '../utils/session';

export default function SettingsScreen({ navigation }) {
  const logoutUser = async () => {
    // Preserves biometric config/counters for this account — see
    // Components/utils/session.js and Components/utils/biometricAuth.js.
    await clearSession();
    navigation.replace('Login');
  };

  const guardedGoBack = useGuardedAction(() => navigation.goBack());
  const guardedLogout = useGuardedAction(logoutUser);

  const guardedGoSecurity = useGuardedAction(() =>
    navigation.navigate('SecuritySettingsScreen'),
  );

  const guardedGoMyReports = useGuardedAction(() =>
    navigation.navigate('MyReportsScreen'),
  );

  const guardedGoBlockedUsers = useGuardedAction(() =>
    navigation.navigate('BlockedUsersScreen'),
  );

  const guardedGoDeleteAccount = useGuardedAction(() =>
    navigation.navigate('DeleteAccountScreen'),
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.circleOne} />
        <View style={styles.circleTwo} />

        <View style={styles.headerTop}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.backButton}
            onPress={guardedGoBack}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.subHeading}>
          Manage your account, security and privacy.
        </Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={guardedGoSecurity}
        >
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🔐</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Security</Text>
            <Text style={styles.cardSub}>Biometric login settings</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={guardedGoMyReports}
        >
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🚩</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>My Reports</Text>
            <Text style={styles.cardSub}>Track reports you've submitted</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={guardedGoBlockedUsers}
        >
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🚫</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Blocked Users</Text>
            <Text style={styles.cardSub}>Manage members you've blocked</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.dangerCard}
          onPress={guardedGoDeleteAccount}
        >
          <View style={styles.dangerIconBox}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.dangerCardTitle}>Delete Account</Text>
            <Text style={styles.dangerCardSub}>
              Permanently remove your account
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutButton}
          onPress={guardedLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F5F4',
  },

  header: {
    backgroundColor: '#17310F',
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },

  circleOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 200,
    backgroundColor: 'rgba(255,107,0,0.06)',
    right: -80,
    top: -60,
  },

  circleTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 120,
    backgroundColor: 'rgba(72,255,133,0.05)',
    left: -60,
    bottom: -60,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },

  subHeading: {
    marginTop: 10,
    color: '#B6C4BB',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    width: '92%',
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#17310F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  iconText: {
    fontSize: 22,
  },

  cardTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },

  cardSub: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },

  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDED',
    borderWidth: 1,
    borderColor: '#F5C2C2',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },

  dangerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  dangerCardTitle: {
    color: '#B3261E',
    fontSize: 16,
    fontWeight: '800',
  },

  dangerCardSub: {
    marginTop: 3,
    color: '#B3261E',
    fontSize: 12,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E9E7',
    marginVertical: 20,
  },

  logoutButton: {
    backgroundColor: '#E11D1D',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

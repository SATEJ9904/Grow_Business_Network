import React, { useEffect, useState } from 'react';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';

// Android's FLAG_SECURE (MainActivity.kt) already blanks the recent-apps
// switcher preview at the OS level. iOS has no equivalent, so the last
// frame of whatever screen was open (a member's profile, a payment step)
// sits in the switcher's snapshot in the clear. This covers the whole app
// with a neutral splash-like screen for the entire time it's backgrounded,
// so that snapshot is always this cover, never real content.
export default function PrivacyScreen() {
  const [hidden, setHidden] = useState(AppState.currentState !== 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setHidden(nextState !== 'active');
    });

    return () => subscription.remove();
  }, []);

  if (!hidden) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Image source={require('./Images/logo.jpeg')} style={styles.logo} />
      <Text style={styles.text}>GBN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: '#0B3D2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 66,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '700',
  },
});

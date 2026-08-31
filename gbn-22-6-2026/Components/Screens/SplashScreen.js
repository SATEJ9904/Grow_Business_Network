import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDelayedNotice } from '../utils/guards';
import { clearSession } from '../utils/session';

const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

const BG = '#0B3D2E';
const ORANGE = '#F07E1D';
const LEAF = '#3C7A3E';
const CREAM = '255, 232, 194'; // warm cream, used at low alpha for glow/light

// Fast start, long weightless glide to rest — motion that feels inevitable,
// never springy or bouncy.
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
const POP = Easing.out(Easing.back(1.6));

/**
 * "Two Become One" — the GBN mark is a handshake forming the N, so the
 * splash re-enacts it: an orange token and a green token approach from
 * opposite sides, meet at center in a spark of contact, and the real mark
 * crystallizes out of that point of light. A tiny 3-bar growth-tick closes
 * the story, echoing the same orange/green that opened it.
 */
export default function SplashScreen({ navigation, route }) {
  const [initializing, setInitializing] = useState(true);
  const showSlowNotice = useDelayedNotice(initializing, 8000);

  // Act I — Approach: two brand-colored tokens glide toward center.
  const orangeX = useRef(new Animated.Value(-150)).current;
  const orangeScale = useRef(new Animated.Value(0.7)).current;
  const orangeOpacity = useRef(new Animated.Value(0)).current;
  const greenX = useRef(new Animated.Value(150)).current;
  const greenScale = useRef(new Animated.Value(0.7)).current;
  const greenOpacity = useRef(new Animated.Value(0)).current;

  // Act II — Contact: the tokens dissolve into a spark + shockwave.
  const sparkScale = useRef(new Animated.Value(0)).current;
  const sparkOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Act III — Crystallize: the real mark grows out of the light.
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.86)).current;
  const glint = useRef(new Animated.Value(0)).current;

  // Act IV — Signature: tagline + a tiny ascending growth-tick.
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordLift = useRef(new Animated.Value(6)).current;
  const tick1 = useRef(new Animated.Value(0)).current;
  const tick2 = useRef(new Animated.Value(0)).current;
  const tick3 = useRef(new Animated.Value(0)).current;

  // Ambient — a slow breathing bloom behind everything. Alive, never busy.
  const bloom = useRef(new Animated.Value(0)).current;

  // A whisper-thin progress hairline, filling quietly across the full 5s.
  const hairline = useRef(new Animated.Value(0)).current;

  // Exit — a calm contraction, not a punch forward.
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const sceneScale = useRef(new Animated.Value(1)).current;

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
          // Preserves biometric config/counters for this account — see
          // Components/utils/session.js and
          // Components/utils/biometricAuth.js.
          await clearSession();
        }

        navigation.replace('Login');
      } catch (error) {
        console.log('🚨 Splash login check failed:', error);
        navigation.replace('Login');
      } finally {
        setInitializing(false);
      }
    };

    const bloomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bloom, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bloom, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    bloomLoop.start();

    Animated.timing(hairline, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const native = extra => ({ useNativeDriver: true, ...extra });

    Animated.sequence([
      // A short breath of nothing before the story begins.
      Animated.delay(120),

      // ACT I — Two tokens approach, 1100ms.
      Animated.parallel([
        Animated.timing(orangeX, native({ toValue: -6, duration: 1100, easing: SETTLE })),
        Animated.timing(orangeScale, native({ toValue: 1, duration: 1100, easing: SETTLE })),
        Animated.timing(orangeOpacity, native({ toValue: 1, duration: 700, easing: SETTLE })),
        Animated.timing(greenX, native({ toValue: 6, duration: 1100, easing: SETTLE })),
        Animated.timing(greenScale, native({ toValue: 1, duration: 1100, easing: SETTLE })),
        Animated.timing(greenOpacity, native({ toValue: 1, duration: 700, easing: SETTLE })),
      ]),

      // ACT II — Contact: tokens dissolve into a spark + shockwave, 260ms.
      Animated.parallel([
        Animated.timing(orangeX, native({ toValue: 0, duration: 220, easing: EASE_IN })),
        Animated.timing(greenX, native({ toValue: 0, duration: 220, easing: EASE_IN })),
        Animated.timing(orangeOpacity, native({ toValue: 0, duration: 220, easing: EASE_IN })),
        Animated.timing(greenOpacity, native({ toValue: 0, duration: 220, easing: EASE_IN })),
        Animated.timing(orangeScale, native({ toValue: 0.6, duration: 260, easing: EASE_IN })),
        Animated.timing(greenScale, native({ toValue: 0.6, duration: 260, easing: EASE_IN })),
        Animated.sequence([
          Animated.timing(sparkOpacity, native({ toValue: 0.95, duration: 90 })),
          Animated.timing(sparkOpacity, native({ toValue: 0, duration: 170 })),
        ]),
        Animated.timing(sparkScale, native({ toValue: 1.6, duration: 260, easing: Easing.out(Easing.quad) })),
        Animated.timing(ringOpacity, native({ toValue: 0.5, duration: 40 })),
        Animated.timing(ringScale, native({ toValue: 2.1, duration: 260, easing: Easing.out(Easing.quad) })),
      ]),

      // ACT III — The mark crystallizes out of the light, 900ms.
      Animated.parallel([
        Animated.timing(cardOpacity, native({ toValue: 1, duration: 780, easing: SETTLE })),
        Animated.timing(cardScale, native({ toValue: 1, duration: 900, easing: SETTLE })),
        Animated.timing(ringOpacity, native({ toValue: 0, duration: 400, easing: EASE_IN })),
      ]),

      // A single soft glint crosses the settled card, 500ms.
      Animated.timing(glint, native({ toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad) })),

      // A brief beat before the signature.
      Animated.delay(130),

      // ACT IV — Tagline rises in, 500ms.
      Animated.parallel([
        Animated.timing(wordOpacity, native({ toValue: 1, duration: 500, easing: SETTLE })),
        Animated.timing(wordLift, native({ toValue: 0, duration: 500, easing: SETTLE })),
      ]),

      // The growth-tick draws itself in, echoing orange + green.
      Animated.stagger(70, [
        Animated.timing(tick1, native({ toValue: 1, duration: 210, easing: POP })),
        Animated.timing(tick2, native({ toValue: 1, duration: 210, easing: POP })),
        Animated.timing(tick3, native({ toValue: 1, duration: 210, easing: POP })),
      ]),

      // Hold — the mark simply exists.
      Animated.delay(590),

      // Exit — a calm contraction and fade, not a zoom.
      Animated.parallel([
        Animated.timing(sceneOpacity, native({ toValue: 0, duration: 550, easing: EASE_IN })),
        Animated.timing(sceneScale, native({ toValue: 0.98, duration: 550, easing: EASE_IN })),
      ]),
    ]).start(() => {
      bloomLoop.stop();

      if (token) {
        setInitializing(false);
        navigation.replace('ResetPassword', { token });
      } else {
        checkLogin();
      }
    });

    return () => {
      bloomLoop.stop();
    };
  }, [route?.params?.token]);

  const bloomStyle = (size, peak) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: bloom.interpolate({
      inputRange: [0, 1],
      outputRange: [peak * 0.6, peak],
    }),
    transform: [
      {
        scale: bloom.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1.05],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={BG} barStyle="light-content" />

      <Animated.View
        style={[
          styles.scene,
          { opacity: sceneOpacity, transform: [{ scale: sceneScale }] },
        ]}
      >
        <View style={styles.stage}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bloomLayer,
              bloomStyle(360, 0.1),
              { backgroundColor: `rgba(${CREAM}, 1)` },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bloomLayer,
              bloomStyle(240, 0.16),
              { backgroundColor: `rgba(${CREAM}, 1)` },
            ]}
          />

          {/* Act I & II — the two tokens that meet and dissolve into light */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.token,
              styles.tokenOrange,
              {
                opacity: orangeOpacity,
                transform: [{ translateX: orangeX }, { scale: orangeScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.token,
              styles.tokenGreen,
              {
                opacity: greenOpacity,
                transform: [{ translateX: greenX }, { scale: greenScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spark,
              { opacity: sparkOpacity, transform: [{ scale: sparkScale }] },
            ]}
          />

          {/* Act III — the real mark, crystallized */}
          <Animated.View
            style={[
              styles.cardShadowWrap,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <View style={styles.cardClip}>
              <Image
                source={require('../Images/logo.jpeg')}
                style={styles.logo}
              />

              {/* Soft-edged glint: three stacked bars fake a gaussian falloff */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.glintGroup,
                  {
                    transform: [
                      {
                        translateX: glint.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-260, 260],
                        }),
                      },
                      { rotate: '16deg' },
                    ],
                  },
                ]}
              >
                <View style={[styles.glintBar, styles.glintOuter]} />
                <View style={[styles.glintBar, styles.glintMid]} />
                <View style={[styles.glintBar, styles.glintCore]} />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: wordOpacity,
              transform: [{ translateY: wordLift }],
            },
          ]}
        >
          GROW BUSINESS NETWORK
        </Animated.Text>

        {/* Act IV — the growth-tick: a tiny ascending chart, orange to green */}
        <View style={styles.tickRow} pointerEvents="none">
          <Animated.View
            style={[
              styles.tickBar,
              styles.tickShort,
              { backgroundColor: LEAF, transform: [{ scaleY: tick1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.tickBar,
              styles.tickMid,
              {
                backgroundColor: `rgba(${CREAM}, 0.9)`,
                transform: [{ scaleY: tick2 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.tickBar,
              styles.tickTall,
              { backgroundColor: ORANGE, transform: [{ scaleY: tick3 }] },
            ]}
          />
        </View>

        <View style={styles.hairlineTrack}>
          <Animated.View
            style={[styles.hairlineFill, { transform: [{ scaleX: hairline }] }]}
          />
        </View>
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
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scene: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  stage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bloomLayer: {
    position: 'absolute',
  },

  token: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 54,
    height: 32,
    marginLeft: -27,
    marginTop: -16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },

  tokenOrange: {
    backgroundColor: ORANGE,
  },

  tokenGreen: {
    backgroundColor: LEAF,
  },

  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 90,
    height: 90,
    marginLeft: -45,
    marginTop: -45,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: `rgba(${CREAM}, 0.9)`,
  },

  spark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 70,
    height: 70,
    marginLeft: -35,
    marginTop: -35,
    borderRadius: 35,
    backgroundColor: `rgba(${CREAM}, 1)`,
  },

  cardShadowWrap: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.28,
        shadowRadius: 28,
      },
      android: {
        elevation: 14,
      },
    }),
  },

  cardClip: {
    width: 208,
    height: 118,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: BG,
  },

  logo: {
    width: 208,
    height: 118,
    resizeMode: 'contain',
  },

  glintGroup: {
    position: 'absolute',
    top: -160,
    left: -20,
    width: 90,
    height: 440,
  },

  glintBar: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },

  glintOuter: {
    left: 0,
    width: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  glintMid: {
    left: 26,
    width: 38,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  glintCore: {
    left: 40,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  tagline: {
    color: 'rgba(255,255,255,0.92)',
    marginTop: 24,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3,
  },

  tickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    height: 16,
  },

  tickBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 3,
    transformOrigin: 'bottom',
  },

  tickShort: { height: 7 },
  tickMid: { height: 11 },
  tickTall: { height: 16 },

  hairlineTrack: {
    marginTop: 20,
    width: 64,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },

  hairlineFill: {
    width: '100%',
    height: '100%',
    backgroundColor: `rgba(${CREAM}, 0.65)`,
    transformOrigin: 'left',
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

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BASE_URL } from '@env';
import React, { useEffect, useRef, useState } from 'react';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const DashboardScreen = ({ navigation }) => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    getChapters();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getChapters = async () => {
    setLoading(true);
    try {
      console.log('Fetching all cities...');
      // First get all cities
      const citiesResponse = await fetch(`${BASE_URL}chapters/cities`);
      const citiesJson = await citiesResponse.json();
      console.log('Cities response:', citiesJson);

      if (citiesJson.success && citiesJson.data && citiesJson.data.length > 0) {
        // Then fetch chapters for each city
        const allChapters = [];

        for (const city of citiesJson.data) {
          try {
            const response = await fetch(
              `${BASE_URL}chapters/chapters-by-city/${city}`,
            );
            const json = await response.json();

            if (json.success && json.data) {
              allChapters.push(...json.data);
              console.log(`Chapters loaded for ${city}:`, json.data);
            }
          } catch (cityError) {
            console.log(`Error fetching chapters for ${city}:`, cityError);
          }
        }

        console.log('All chapters:', allChapters);
        setChapters(allChapters);
      } else {
        console.log('No cities found');
        setChapters([]);
      }
    } catch (error) {
      console.log('Chapter Error:', error);
      setChapters([]);
      Alert.alert('Error', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);

  const guardedGoToMembers = useGuardedAction((chapterId, chapterName) =>
    navigation.navigate('MembersScreen', { chapterId, chapterName }),
  );

  const guardedContinue = useGuardedAction(() =>
    navigation.navigate('SelectChapterScreen'),
  );

  const features = [
    'Meeting Flyer',
    'Dashboard Promotion',
    'Business Meetings',
    'Networking Events',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        {/* PREMIUM HEADER */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* TOP GLOW */}
          <View style={styles.topGlow} />

          {/* LOGO CONTAINER */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../Images/logo.jpeg')}
              style={styles.logo}
            />
          </View>

          {/* APP NAME */}
          <Text style={styles.title}>Grow Business Network</Text>

          {/* SUB TITLE */}
          <Text style={styles.tagline}>
            India's Professional Business Community
          </Text>

          {/* SMALL DESCRIPTION */}
          <Text style={styles.headerDescription}>
            Connect entrepreneurs, startups & professionals across powerful
            business chapters.
          </Text>

          {/* BADGES */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <View style={styles.orangeDot} />

              <Text style={styles.badgeText}>Trusted Network</Text>
            </View>

            <View style={styles.badge}>
              <View style={styles.orangeDot} />

              <Text style={styles.badgeText}>Esta. Date 24 oct 2022</Text>
            </View>
          </View>

          {/* STATS */}
          {/* <View style={styles.statsContainer}>

    <View style={styles.statCard}>

      <Text style={styles.statNumber}>
        5+
      </Text>

      <Text style={styles.statLabel}>
        Chapters
      </Text>

    </View>

    <View style={styles.statDivider} />

    <View style={styles.statCard}>

      <Text style={styles.statNumber}>
        100+
      </Text>

      <Text style={styles.statLabel}>
        Members
      </Text>

    </View>

    <View style={styles.statDivider} />

    <View style={styles.statCard}>

      <Text style={styles.statNumber}>
        2022
      </Text>

      <Text style={styles.statLabel}>
        Founded
      </Text>

    </View>

  </View> */}
        </Animated.View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leadership Team</Text>

          <View style={styles.line} />

          {/* FOUNDER */}
          <Animated.View
            style={[
              styles.founderCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={require('../Images/founder.jpeg')}
              style={styles.profile}
            />

            <View style={{ marginLeft: 14 }}>
              <Text style={styles.name}>Mr. Vikrant Gokhale</Text>

              <Text style={styles.role}>Founder President</Text>
            </View>
          </Animated.View>

          {/* PRESIDENT */}
          <Animated.View
            style={[
              styles.founderCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={require('../Images/foundervc.jpeg')}
              style={styles.profile}
            />

            <View style={{ marginLeft: 14 }}>
              <Text style={styles.name}>Mrs. Sanjyot Daptardar</Text>

              <Text style={styles.role}>Founder Vice President</Text>
            </View>
          </Animated.View>
        </View>

        {/* ABOUT */}
        <Animated.View
          style={[
            styles.aboutCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>About GBN</Text>

          <View style={styles.line} />

          <Text style={styles.description}>
            Grow Business Networks is the best platform for Small, Medium & Big
            organisations.
          </Text>

          <Text style={styles.description}>
            No annual membership fees required.
          </Text>
        </Animated.View>

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Features</Text>

          <View style={styles.line} />

          <View style={styles.featureContainer}>
            {features.map((item, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.dot} />

                <Text style={styles.featureText}>{item}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* CHAPTERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GBN Chapters</Text>

          <View style={styles.line} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#17310F" />
              <Text style={styles.loadingText}>Loading chapters...</Text>
              {showSlowNotice && (
                <Text style={styles.loadingText}>
                  Still working on it — this is taking longer than expected.
                  Please check your connection.
                </Text>
              )}
            </View>
          ) : chapters.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chapterScrollContent}
            >
              {chapters.map((item, index) => (
                <TouchableOpacity
                  key={item._id || index}
                  activeOpacity={0.8}
                  style={styles.chapterCard}
                  onPress={() => guardedGoToMembers(item._id, item.name)}
                >
                  <Text style={styles.chapterText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyChapterContainer}>
              <Text style={styles.noChapterText}>No chapters available</Text>
            </View>
          )}
        </View>

        {/* EVENT */}
        {/* <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Upcoming Meetings
          </Text>

          <View style={styles.line} />

          <Animated.View
            style={[
              styles.eventCard,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>

            <Text style={styles.eventTitle}>
              Weekly Business Meetup
            </Text>

            <Text style={styles.eventSub}>
              Sunday • 10:00 AM
            </Text>

            <Text style={styles.eventSub}>
              Pune Chapter Hall
            </Text>

          </Animated.View>

        </View> */}

        {/* BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.button}
          onPress={guardedContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F4',
  },

  header: {
    backgroundColor: '#17310F',
    paddingTop: 35,
    paddingBottom: 45,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    alignItems: 'center',
    overflow: 'hidden',
  },

  topGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -120,
    right: -80,
  },

  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  logo: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
    borderRadius: 20,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  tagline: {
    color: '#D1D5DB',
    fontSize: 15,
    marginTop: 12,
    letterSpacing: 1,
  },

  headerDescription: {
    color: '#BFC8C2',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 12,
  },

  badgeRow: {
    flexDirection: 'row',
    marginTop: 24,
  },

  badge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
  },

  statsContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    marginTop: 28,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    elevation: 8,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    color: '#17310F',
    fontSize: 24,
    fontWeight: '800',
  },

  statLabel: {
    color: '#6B7280',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    resizeMode: 'contain',
  },

  heading: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 0.5,
  },

  subHeading: {
    color: '#D1D5DB',
    marginTop: 8,
    fontSize: 14,
    letterSpacing: 1,
  },

  establishedBox: {
    backgroundColor: '#fff',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
  },

  establishedText: {
    color: '#17310F',
    fontWeight: '600',
    fontSize: 13,
  },

  aboutCard: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 24,
    padding: 22,
    elevation: 5,
  },

  section: {
    marginTop: 26,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#17310F',
  },

  line: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 18,
  },

  description: {
    color: '#4B5563',
    lineHeight: 26,
    fontSize: 15,
    marginBottom: 10,
  },

  featureContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 14,
    marginBottom: 16,
    elevation: 4,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
    marginBottom: 14,
  },

  featureText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22,
  },

  chapterCard: {
    backgroundColor: '#17310F',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 22,
    marginRight: 14,
    elevation: 4,
  },

  chapterText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  founderCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },

  profile: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  role: {
    marginTop: 6,
    color: '#FF6B00',
    fontWeight: '600',
  },

  eventCard: {
    backgroundColor: '#17310F',
    borderRadius: 24,
    padding: 22,
    elevation: 5,
  },

  eventTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },

  eventSub: {
    color: '#D1D5DB',
    marginTop: 8,
    fontSize: 14,
  },

  button: {
    backgroundColor: '#FF6B00',
    marginHorizontal: 18,
    marginTop: 34,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  noChapterText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },

  chapterScrollContent: {
    paddingRight: 18,
    paddingVertical: 8,
  },

  emptyChapterContainer: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
  },

  loadingContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  chapterScrollContent: {
    paddingRight: 18,
    paddingVertical: 8,
  },
});

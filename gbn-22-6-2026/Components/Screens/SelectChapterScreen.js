import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Dropdown } from 'react-native-element-dropdown';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const { width, height } = Dimensions.get('window');

const SelectChapterScreen = ({ navigation }) => {
  const [cities, setCities] = useState([]);
  const dropdownRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [noChapterFound, setNoChapterFound] = useState(false);

  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ================= SIDEBAR =================

  const [sidebarVisible, setSidebarVisible] = useState(false);

  const sidebarAnim = useRef(new Animated.Value(-width)).current;

  const [profileImage, setProfileImage] = useState(null);
  const [memberName, setMemberName] = useState('Welcome Member');

  useEffect(() => {
    getCities();
    getProfile();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ================= API =================

  const getProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${BASE_URL}member/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      const user = json?.data;

      if (user?.profileImage) {
        setProfileImage(
          BASE_URL.replace('/api/', '/') +
            user.profileImage.replace(/\\/g, '/'),
        );
      }

      if (user?.name) {
        setMemberName(user.name);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    }
  };

  const getCities = async () => {
    try {
      const response = await fetch(`${BASE_URL}chapters/cities`);

      const json = await response.json();

      if (json.success) {
        const formattedCities = json.data.map(item => ({
          label: item,
          value: item,
        }));

        setCities(formattedCities);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    }
  };
  const getChapters = async city => {
    setSelectedCity(city);
    setLoading(true);
    setNoChapterFound(false);

    try {
      const response = await fetch(
        `${BASE_URL}chapters/chapters-by-city/${city}`,
      );
      console.log('Fetching chapters for city:', city);

      const json = await response.json();

      if (json.success) {
        setChapters(json.data);

        if (json.data.length === 0) {
          setNoChapterFound(true);
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    }

    setLoading(false);
  };

  // ================= SIDEBAR =================

  const openSidebar = () => {
    setSidebarVisible(true);

    Animated.spring(sidebarAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarAnim, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  const logoutUser = async () => {
    await AsyncStorage.clear();

    navigation.replace('Login');
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);

  const guardedGoToMembers = useGuardedAction((chapterId, chapterName) =>
    navigation.navigate('MembersScreen', { chapterId, chapterName }),
  );

  const guardedLogout = useGuardedAction(logoutUser);

  const guardedGoProfile = useGuardedAction(() => {
    closeSidebar();
    navigation.navigate('EditProfileScreen');
  });

  const guardedGoWebsite = useGuardedAction(() => {
    closeSidebar();
    navigation.navigate('EditWebsiteScreen');
  });

  const renderChapter = ({ item }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.chapterCard}
        onPress={() => guardedGoToMembers(item._id, item.name)}
      >
        {/* TOP */}

        <View style={styles.chapterHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.smallBadge}>
              <View style={styles.smallDot} />

              <Text style={styles.smallBadgeText}>PREMIUM</Text>
            </View>

            <Text numberOfLines={1} style={styles.chapterName}>
              {item.name}
            </Text>

            <Text style={styles.chapterSub}>{item.city} Business Network</Text>
          </View>

          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        {/* DESCRIPTION */}

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.viewButton}
          onPress={() => guardedGoToMembers(item._id, item.name)}
        >
          <Text style={styles.viewButtonText}>VIEW MEMBERS</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#031109" barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        contentContainerStyle={{
          paddingBottom: 120,
          flexGrow: 1,
        }}
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />

          {/* MENU */}

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.menuButton}
            onPress={openSidebar}
          >
            <Text style={styles.menuText}>☰</Text>
          </TouchableOpacity>

          {/* TITLE */}

          <Text style={styles.heading}>Select</Text>

          <Text style={styles.heading}>Location</Text>

          <Text style={styles.subHeading}>
            Discover verified chapters & premium business members across India.
          </Text>

          {/* TAG */}

          <View style={styles.tagContainer}>
            <View style={styles.tagDot} />

            <Text style={styles.tagText}>PREMIUM BUSINESS COMMUNITY</Text>
          </View>

          {/* DROPDOWN */}

          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Choose Your City</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => dropdownRef.current?.open()}
            >
              <Dropdown
                ref={dropdownRef}
                style={styles.dropdown}
                data={cities}
                labelField="label"
                valueField="value"
                placeholder="Select City"
                value={selectedCity}
                onChange={item => getChapters(item.value)}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= LOADER ================= */}

        {loading && (
          <>
            <ActivityIndicator
              size="large"
              color="#17310F"
              style={{ marginTop: 40 }}
            />
            {showSlowNotice && (
              <Text style={styles.noChapterText}>
                Still working on it — this is taking longer than expected.
                Please check your connection.
              </Text>
            )}
          </>
        )}

        {/* ================= CHAPTERS ================= */}

        {chapters.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>GBN Chapters</Text>

              <View style={styles.orangeLine} />
            </View>

            <FlatList
              data={chapters}
              renderItem={renderChapter}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              contentContainerStyle={{
                paddingBottom: 50,
              }}
            />
          </View>
        )}

        {noChapterFound && !loading && (
          <View style={styles.section}>
            <Text style={styles.noChapterText}>
              No chapters found in this city
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ================= SIDEBAR ================= */}

      {sidebarVisible && (
        <View style={styles.sidebarWrapper}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.overlay}
            onPress={closeSidebar}
          />

          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [
                  {
                    translateX: sidebarAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.sidebarGlow} />

            <View style={styles.sidebarTop}>
              <View style={styles.profileOuter}>
                <Image
                  source={
                    profileImage
                      ? { uri: profileImage }
                      : require('../Images/user.png')
                  }
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.profileName}>{memberName}</Text>

              <Text style={styles.profileSub}>Premium Business Community</Text>
            </View>

            {/* PROFILE */}

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.sidebarCard}
              onPress={guardedGoProfile}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>👤</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>My Profile</Text>

                <Text style={styles.cardSub}>Edit professional profile</Text>
              </View>
            </TouchableOpacity>

            {/* WEBSITE */}

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.sidebarCard}
              onPress={guardedGoWebsite}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>🌐</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Manage Website</Text>

                <Text style={styles.cardSub}>Customize your website</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* LOGOUT */}

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.logoutButton}
              onPress={guardedLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default SelectChapterScreen;

const styles = StyleSheet.create({
  // ================= HEADER =================

  header: {
    backgroundColor: '#041C15',
    paddingTop: 58,
    paddingHorizontal: 22,
    paddingBottom: 34,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    overflow: 'hidden',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F5F4',
  },

  circleOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: 'rgba(34,197,94,0.08)',
    right: -90,
    top: -40,
  },

  circleTwo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: 'rgba(16,185,129,0.05)',
    left: -70,
    bottom: -70,
  },

  menuButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  subHeading: {
    marginTop: 16,
    color: '#B7C4BC',
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '500',
    width: '92%',
  },

  // ================= TAG =================

  tagContainer: {
    marginTop: 22,
    backgroundColor: 'rgba(72,255,133,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(72,255,133,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#4ADE80',
    marginRight: 8,
  },

  tagText: {
    color: '#8EFFAB',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ================= DROPDOWN =================

  dropdownContainer: {
    marginTop: 26,
  },

  dropdownLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

dropdown: {
  width: '100%',
  height: 58,
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  paddingHorizontal: 18,
},

  placeholderStyle: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },

  selectedTextStyle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },

  // ================= SECTION =================

  section: {
    marginTop: 26,
    paddingHorizontal: 16,
    flex: 1,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },

  orangeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#FF7A00',
    marginLeft: 14,
    borderRadius: 20,
  },

  // ================= PREMIUM COMPACT CARD =================

  chapterCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: '#EEF2EF',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.05,
    shadowRadius: 12,

    elevation: 4,
  },

  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#EEF9F0',

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 14,

    alignSelf: 'flex-start',

    marginBottom: 10,
  },

  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },

  smallBadgeText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  chapterName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  chapterSub: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },

  activeBadge: {
    backgroundColor: '#17310F',

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 14,
  },

  activeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  chapterDescription: {
    marginTop: 14,

    color: '#5B6470',

    fontSize: 13,
    lineHeight: 22,

    fontWeight: '500',
  },

  // ================= STATS =================

  statsContainer: {
    marginTop: 18,

    backgroundColor: '#F8FAF9',

    borderRadius: 18,

    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 14,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },

  statNumber: {
    color: '#17310F',
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
  },

  // ================= BUTTON =================

  viewButton: {
    marginTop: 18,

    backgroundColor: '#17310F',

    height: 46,

    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',
  },

  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // ================= SIDEBAR =================

  sidebarWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  sidebar: {
    width: width * 0.82,
    height: height,
    backgroundColor: '#041C15',
    paddingTop: 70,
    paddingHorizontal: 22,
    borderTopRightRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },

  sidebarGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(72,255,133,0.04)',
    right: -80,
    top: -40,
  },

  sidebarTop: {
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },

  profileOuter: {
    width: 110,
    height: 110,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 60,
  },

  profileName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 18,
  },

  profileSub: {
    color: '#9FB1A7',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },

  sidebarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#17310F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  iconText: {
    fontSize: 24,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  cardSub: {
    color: '#9FB1A7',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 24,
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

  noChapterText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
});

import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProfileScreen = ({ route }) => {
  const userId = route?.params?.user?._id;

  const [user, setUser] = useState({});
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  const [coverImage, setCoverImage] = useState(user?.coverImage || null);
  const [loading, setLoading] = useState(true);
  const showSlowNotice = useDelayedNotice(loading, 8000);

  // FETCH PROFILE API

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${BASE_URL}member/${userId}`);

      if (response.data.success) {
        const userData = response.data.data;

        setUser(userData);

        if (userData?.profileImage) {
          setProfileImage(
            BASE_URL.replace('/api/', '/') +
              userData.profileImage.replace(/\\/g, '/'),
          );
        }

        if (userData?.coverImage) {
          setCoverImage(
            BASE_URL.replace('/api/', '/') +
              userData.coverImage.replace(/\\/g, '/'),
          );
        }
      }
    } catch (error) {
      console.log(
        'PROFILE FETCH ERROR:',
        error?.response?.data || error.message,
      );
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // CALL API

  useEffect(() => {
    fetchProfile();
  }, []);

  // IMAGE PICKERS

  const pickProfileImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
      },
      response => {
        if (response.assets?.length > 0) {
          setProfileImage(response.assets[0].uri);
        }
      },
    );
  };

  const pickCoverImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
      },
      response => {
        if (response.assets?.length > 0) {
          setCoverImage(response.assets[0].uri);
        }
      },
    );
  };

  // RENDER INFO

  const renderInfo = (label, value, emoji = '•') => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {emoji} {label}
      </Text>

      <Text style={styles.infoValue}>
        {value && value !== '' ? value : 'Not Added'}
      </Text>
    </View>
  );

  // ARRAY DATA

  const renderArray = (label, data, emoji = '•') => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {emoji} {label}
      </Text>

      <Text style={styles.infoValue}>
        {data?.length > 0 ? data.join(', ') : 'Not Added'}
      </Text>
    </View>
  );

  // DROPDOWN CARD

  const DropdownCard = ({ title, children }) => {
    const [open, setOpen] = useState(false);

    const toggleDropdown = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setOpen(!open);
    };

    const guardedToggleDropdown = useGuardedAction(toggleDropdown, 300);

    return (
      <View style={styles.dropdownCard}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          activeOpacity={0.8}
          onPress={guardedToggleDropdown}
        >
          <Text style={styles.dropdownTitle}>{title}</Text>

          <View style={styles.arrowContainer}>
            <Text style={styles.plusText}>{open ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {open && <View style={styles.dropdownContent}>{children}</View>}
      </View>
    );
  };

  const openEmail = () => {
    if (user?.email) {
      Linking.openURL(`mailto:${user.email}`);
    }
  };

  const openMobile = () => {
    if (user?.mobile) {
      Linking.openURL(`tel:${user.mobile}`);
    }
  };

  const openWebsite = () => {
    let url = '';

    if (user?.websiteSlug) {
      url = `${BASE_URL.replace(/\/api\/?$/, '')}/site/${user.websiteSlug}`;
    } else if (user?.website) {
      url = user.website;

      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
    }

    if (url) {
      Linking.openURL(url);
    }
  };

  const openInstagram = () => {
    if (user?.instagram) {
      let url = user.instagram;

      if (!url.startsWith('http')) {
        url = `https://instagram.com/${url.replace('@', '')}`;
      }

      Linking.openURL(url);
    }
  };

  const openLinkedin = () => {
    if (user?.linkedin) {
      let url = user.linkedin;

      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }

      Linking.openURL(url);
    }
  };

  const guardedOpenEmail = useGuardedAction(openEmail);
  const guardedOpenMobile = useGuardedAction(openMobile);
  const guardedOpenWebsite = useGuardedAction(openWebsite);
  const guardedOpenInstagram = useGuardedAction(openInstagram);
  const guardedOpenLinkedin = useGuardedAction(openLinkedin);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        {loading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#0A66C2" />
            <Text style={styles.loadingBannerText}>Loading profile...</Text>
            {showSlowNotice && (
              <Text style={styles.slowNoticeText}>
                Still working on it — this is taking longer than expected.
                Please check your connection.
              </Text>
            )}
          </View>
        )}

        {/* COVER SECTION */}

        <View style={styles.coverSection}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
              }}
              style={styles.coverImage}
            />
          )}

          {/* DARK OVERLAY */}

          <View style={styles.overlay} />

          <View style={styles.profileWrapper}>
            <View>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
                  }}
                  style={styles.profileImage}
                />
              )}
            </View>

            {/* ONLINE DOT */}
          </View>
        </View>

        {/* PROFILE CONTENT */}

        <View style={styles.profileContainer}>
          <Text style={styles.name}>{user?.name || 'Professional User'}</Text>

          <Text style={styles.company}>
            {user?.companyName || 'Professional Company'}
          </Text>

          <Text style={styles.tagline}>
            {user?.tagline ||
              'Business networking • Professional growth • Collaboration'}
          </Text>

          <Text style={styles.location}>
            📍 {user?.city || 'City'}, {user?.state || 'State'}
          </Text>

          {/* TOP CONTACT INFO */}

          <View style={styles.topContactContainer}>
            {/* EMAIL */}

            {/* EMAIL */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.topContactBox}
              onPress={guardedOpenEmail}
            >
              <View style={styles.topIconContainer}>
                <Text style={styles.topIcon}>✉️</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.topLabel}>EMAIL</Text>

                <Text style={styles.topValue}>
                  {user?.email || 'Not Added'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* MOBILE */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.topContactBox}
              onPress={guardedOpenMobile}
            >
              <View style={styles.topIconContainer}>
                <Text style={styles.topIcon}>📞</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.topLabel}>MOBILE</Text>

                <Text style={styles.topValue}>
                  {user?.mobile || 'Not Added'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* MOBILE */}
            {/* 
            <View style={styles.topContactBox}>
              <View style={styles.topIconContainer}>
                <Text style={styles.topIcon}>📞</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.topLabel}>MOBILE</Text>

                <Text style={styles.topValue}>
                  {user?.mobile || 'Not Added'}
                </Text>
              </View>
            </View> */}

            {/* WEBSITE */}
            {/* WEBSITE */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.topContactBox}
              onPress={guardedOpenWebsite}
            >
              <View style={styles.topIconContainer}>
                <Text style={styles.topIcon}>🌐</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.topLabel}>WEBSITE</Text>

                <Text style={styles.topValue}>
                  {user?.websiteSlug
                    ? `${BASE_URL.replace(/\/api\/?$/, '')}/site/${user.websiteSlug}`
                    : user?.website || 'Not Added'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ABOUT */}

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About</Text>

          <Text style={styles.aboutText}>
            {user?.uniqueBusiness || 'Not Added'}
          </Text>
        </View>

        {/* CONTACT */}

        {/* <DropdownCard title="Contact Information">
          {renderInfo('Email', user?.email, '✉️')}
          {renderInfo('Mobile', user?.mobile, '📞')}
          {renderInfo('Website', user?.website, '🌐')}
          {renderInfo('Address', user?.address, '📍')}
        </DropdownCard> */}

        {/* BUSINESS */}

        <DropdownCard title="Business Details">
          {renderInfo('Industry', user?.industry, '🏭')}
          {renderInfo('Business Category', user?.businessCategory, '💼')}
          {/* {renderInfo('Business Type', user?.businessType, '🏢')}
          {renderInfo('Business Started', user?.businessStarted, '📅')} */}

          {renderInfo('Products', user?.products, '📦')}
          {renderInfo('Price Range', user?.priceRange, '💵')}
          {renderInfo('Minimum Order', user?.minimumOrder, '🛒')}
          {renderInfo('Service Areas', user?.serviceAreas, '🌍')}
        </DropdownCard>

        {/* PROFESSIONAL */}

        <DropdownCard title="Professional Details">
          {renderInfo('Expertise', user?.expertise, '⭐')}
          {/* {renderInfo('Specialization', user?.specialization, '🎯')} */}
          {renderInfo('Achievements', user?.achievements, '🏆')}
          {renderInfo('Professional Values', user?.professionalValues, '🤝')}
          {/* {renderInfo('Long Term Vision', user?.longTermVision, '🚀')} */}
          {renderInfo('Growth Opportunities', user?.growthOpportunities, '📈')}
          {/* {renderInfo('Business Challenges', user?.businessChallenges, '⚡')} */}
        </DropdownCard>

        {/* NETWORK */}

        <DropdownCard title="Networking">
          {renderInfo('Connect Reason', user?.connectReason, '🔗')}
          {renderInfo('Collaboration Type', user?.collaborationType, '🤝')}
          {renderInfo('Preferred Cities', user?.preferredCities, '🏙️')}
          {/* {renderInfo('Franchise Partner', user?.franchisePartner, '🏬')} */}
        </DropdownCard>

        {/* BUSINESS INTEREST */}

        {/* <DropdownCard title="Business Interests">
          {renderArray('Looking For', user?.lookingFor, '🔍')}
          {renderArray('Sell Type', user?.sellType, '🛍️')}
          {renderArray('What We Do', user?.whatWeDo, '💡')}
        </DropdownCard> */}

        {/* SOCIAL */}

        <DropdownCard title="Social Presence">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={guardedOpenInstagram}
          >
            {renderInfo('Instagram', user?.instagram, '📸')}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={guardedOpenLinkedin}
          >
            {renderInfo('LinkedIn', user?.linkedin, '💼')}
          </TouchableOpacity>
        </DropdownCard>

        {/* PREMIUM CARD */}
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F2EF',
  },
  loadingBanner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  loadingBannerText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  slowNoticeText: {
    color: '#b45309',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  topContactContainer: {
    marginTop: 24,
  },

  topContactBox: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#fff',

    padding: 16,

    borderRadius: 22,

    marginBottom: 14,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },

  topIconContainer: {
    width: 52,
    height: 52,

    borderRadius: 16,

    backgroundColor: '#EEF4FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 15,
  },

  topIcon: {
    fontSize: 22,
  },

  topLabel: {
    fontSize: 11,
    fontWeight: '800',

    letterSpacing: 1.2,

    color: '#6B7280',
  },

  topValue: {
    marginTop: 5,

    fontSize: 15,
    fontWeight: '700',

    color: '#111827',
  },

  /* COVER */

  coverSection: {
    position: 'relative',
    backgroundColor: '#fff',
    paddingBottom: 80,
  },

  coverImage: {
    width: '100%',
    height: 250,
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  coverEditBtn: {
    position: 'absolute',
    top: 20,
    right: 20,

    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor: '#fff',

    justifyContent: 'center',
    alignItems: 'center',

    elevation: 6,
  },

  editIcon: {
    fontSize: 20,
  },

  /* PROFILE IMAGE */

  profileWrapper: {
    position: 'absolute',
    left: 20,
    bottom: -65,
  },

  profileImage: {
    width: 135,
    height: 135,

    borderRadius: 68,

    borderWidth: 5,
    borderColor: '#fff',

    backgroundColor: '#E5E7EB',
    marginBottom: 70,
  },

  onlineDot: {
    position: 'absolute',
    right: 10,
    bottom: 12,

    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: '#22C55E',

    borderWidth: 3,
    borderColor: '#fff',
  },

  /* PROFILE */

  profileContainer: {
    paddingTop: 15,
    paddingHorizontal: 18,
  },

  name: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
    marginTop: 10,
  },

  company: {
    marginTop: 8,

    fontSize: 20,
    fontWeight: '700',

    color: '#374151',
  },

  tagline: {
    marginTop: 10,

    fontSize: 15,

    color: '#4B5563',

    lineHeight: 24,
  },

  location: {
    marginTop: 10,

    fontSize: 15,
    fontWeight: '600',

    color: '#6B7280',
  },

  /* ABOUT */

  aboutCard: {
    backgroundColor: '#fff',

    marginTop: 22,

    borderRadius: 25,

    padding: 22,

    elevation: 4,
  },

  aboutTitle: {
    fontSize: 22,
    fontWeight: '900',

    color: '#111827',

    marginBottom: 14,
  },

  aboutText: {
    fontSize: 15,

    lineHeight: 28,

    color: '#374151',

    fontWeight: '500',
  },

  /* DROPDOWN */

  dropdownCard: {
    backgroundColor: '#fff',

    marginTop: 18,

    borderRadius: 24,

    overflow: 'hidden',

    elevation: 3,
  },

  dropdownHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    paddingHorizontal: 22,
    paddingVertical: 20,
  },

  dropdownTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  arrowContainer: {
    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: '#EEF2FF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownArrow: {
    fontSize: 20,
    color: '#0A66C2',
    fontWeight: '900',
  },

  dropdownContent: {
    paddingHorizontal: 22,
    paddingBottom: 20,

    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  /* INFO */

  infoRow: {
    marginTop: 16,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '800',

    letterSpacing: 1,

    color: '#6B7280',

    marginBottom: 7,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '600',

    color: '#111827',

    lineHeight: 24,
  },

  /* PREMIUM */

  premiumCard: {
    backgroundColor: '#0A66C2',

    marginTop: 24,

    borderRadius: 30,

    padding: 28,

    marginBottom: 40,
  },

  premiumTag: {
    color: '#BFDBFE',

    fontSize: 12,

    fontWeight: '800',

    letterSpacing: 2,
  },

  premiumCompany: {
    marginTop: 14,

    color: '#fff',

    fontSize: 28,

    fontWeight: '900',
  },

  premiumText: {
    marginTop: 14,

    color: 'rgba(255,255,255,0.9)',

    lineHeight: 28,

    fontSize: 15,
  },
});

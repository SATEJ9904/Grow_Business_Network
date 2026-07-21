import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');
import { BASE_URL } from '@env';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const MembersScreen = ({ navigation, route }) => {
  const { chapterId, chapterName } = route.params;

  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    fetchMembers();

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

  // ================= FETCH MEMBERS =================

  const fetchMembers = async () => {
    if (!chapterId) return;

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}users/chapter/${chapterId}`);

      const json = await response.json();

      if (json.success) {
        setMembers(json.data || []);
        setFilteredMembers(json.data || []);
      } else {
        console.log('Members fetch failed:', json);
        setMembers([]);
        setFilteredMembers([]);
      }
    } catch (error) {
      console.log(error);
      setMembers([]);
      setFilteredMembers([]);
      Alert.alert('Error', getFriendlyErrorMessage(error));
    }

    setLoading(false);
  };

  // ================= SEARCH =================

  const searchMembers = text => {
    setSearch(text);

    const filtered = members.filter(
      item =>
        item.name?.toLowerCase().includes(text.toLowerCase()) ||
        item.companyName?.toLowerCase().includes(text.toLowerCase()),
    );

    setFilteredMembers(filtered);
  };

  const getSiteUrl = slug => {
    if (!slug) return null;
    return `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;
  };

  const openMemberWebsite = async item => {
    try {
      console.log('USER ID:', item._id);

      const response = await fetch(`${BASE_URL}website/website/${item._id}`);

      const json = await response.json();

      console.log('WEBSITE RESPONSE:', json);

      if (json.success && json.website?.slug) {
        const url = `${BASE_URL.replace(/\/api\/?$/, '')}/site/${
          json.website.slug
        }`;

        console.log('OPEN URL:', url);

        Linking.openURL(url);

        return;
      }

      Alert.alert('Website not found');
    } catch (error) {
      console.log('WEBSITE ERROR:', error);
      Alert.alert('Error', getFriendlyErrorMessage(error));
    }
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);

  const guardedGoToProfile = useGuardedAction(item =>
    navigation.navigate('ProfileScreen', { user: item }),
  );

  const guardedOpenWebsite = useGuardedAction(async item => {
    console.log('MEMBER DATA:', item);

    try {
      const response = await fetch(`${BASE_URL}website/website/${item._id}`);

      const json = await response.json();

      console.log('WEBSITE RESPONSE:', json);

      if (json.success && json.website?.slug) {
        const url = `${BASE_URL.replace(/\/api\/?$/, '')}/site/${
          json.website.slug
        }`;

        console.log('OPEN URL:', url);

        Linking.openURL(url);
      } else {
        Alert.alert('Website not found');
      }
    } catch (error) {
      console.log('ERROR:', error);
      Alert.alert('Error', getFriendlyErrorMessage(error));
    }
  });

  // ================= MEMBER CARD =================

  const renderMember = ({ item }) => {
    const hasWebsite = Boolean(item.websiteSlug || item.website?.trim());

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.memberCard}
          onPress={() => guardedGoToProfile(item)}
        >
          {/* TOP ACCENT */}

          <View style={styles.topBar} />

          {/* MEMBER ROW */}

          <View style={styles.memberTop}>
            {/* IMAGE */}

            <View style={styles.imageOuter}>
              <Image
                source={
                  item.profileImage
                    ? {
                        uri:
                          BASE_URL.replace('/api/', '/') +
                          item.profileImage.replace(/\\/g, '/'),
                      }
                    : require('../Images/user.png')
                }
                style={styles.profileImage}
              />
            </View>

            {/* CONTENT */}

            <View style={styles.memberContent}>
              {/* NAME + VERIFIED */}

              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.memberName}>
                  {item.name}
                </Text>

                <View style={styles.verifyBadge}>
                  <Text style={styles.verifyText}>VERIFIED</Text>
                </View>
              </View>

              {/* COMPANY */}

              <Text numberOfLines={1} style={styles.companyName}>
                {item.companyName || 'Business Company'}
              </Text>

              {/* CITY */}

              <Text style={styles.cityText}>📍 {item.city || 'India'}</Text>

              {/* WEBSITE STATUS */}

              <Text style={styles.websiteStatusText}>
                {hasWebsite ? 'Website available' : 'No website created yet'}
              </Text>

              {/* BUTTON ROW */}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.smallButton}
                  onPress={() => guardedGoToProfile(item)}
                >
                  <Text style={styles.smallButtonText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.smallButton, styles.websiteButton]}
                  onPress={() => guardedOpenWebsite(item)}
                >
                  <Text style={styles.smallButtonText}>View Website</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#041109" barStyle="light-content" />

      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <View style={styles.circleOne} />
        <View style={styles.circleTwo} />

        {/* TOP ROW */}

        <View style={styles.headerTop}>
          {/* <TouchableOpacity
            activeOpacity={0.9}
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity> */}
          {/* 
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.menuButton}>
            <Text style={styles.menuText}>⋮</Text>
          </TouchableOpacity> */}
        </View>

        {/* TITLE */}

        <Text style={styles.heading}>Business</Text>

        <Text style={styles.heading}>Members</Text>

        <Text style={styles.subHeading}>
          Explore verified premium business members from {chapterName}.
        </Text>

        {/* SEARCH */}

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            placeholder="Search members or company"
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={searchMembers}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* ================= CONTENT ================= */}

      {loading ? (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#17310F" />
          {showSlowNotice && (
            <Text style={[styles.emptyStateText, { marginTop: 12 }]}>
              Still working on it — this is taking longer than expected.
              Please check your connection.
            </Text>
          )}
        </View>
      ) : filteredMembers.length > 0 ? (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 40,
          }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No members found for this chapter yet.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MembersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F4',
  },

  // ================= HEADER =================

  header: {
    backgroundColor: '#041109',
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
    backgroundColor: 'rgba(72,255,133,0.05)',
    right: -80,
    top: -60,
  },

  circleTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 120,
    backgroundColor: 'rgba(72,255,133,0.04)',
    left: -60,
    bottom: -60,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },

  backButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 46,
    letterSpacing: -1.2,
    marginTop: 15,
  },

  subHeading: {
    marginTop: 16,
    color: '#B6C4BB',
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '500',
    width: '92%',
  },

  // ================= SEARCH =================

  searchContainer: {
    marginTop: 24,
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.05,
    shadowRadius: 12,

    elevation: 4,
  },

  searchIcon: {
    fontSize: 22,
    color: '#6B7280',
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },

  // ================= MEMBER CARD =================

  memberCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    padding: 12,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#EEF2EF',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 3,

    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: '#0B6E4F',

    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },

  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageOuter: {
    width: 56,
    height: 56,
    borderRadius: 18,

    backgroundColor: '#F3F4F6',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },
  profileImage: {
    width: 74,
    height: 74,
    borderRadius: 40,
  },

  memberContent: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  memberName: {
    flex: 1,

    color: '#111827',

    fontSize: 15,

    fontWeight: '800',

    marginRight: 8,
  },

  verifyBadge: {
    backgroundColor: '#ECFDF3',

    paddingHorizontal: 8,
    paddingVertical: 3,

    borderRadius: 20,
  },

  verifyText: {
    color: '#16A34A',

    fontSize: 8,

    fontWeight: '800',

    letterSpacing: 0.5,
  },

  companyName: {
    marginTop: 4,

    color: '#0B6E4F',

    fontSize: 12,

    fontWeight: '700',
  },

  cityText: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },

  description: {
    marginTop: 10,
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

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },

  statNumber: {
    color: '#17310F',
    fontSize: 20,
    fontWeight: '900',
  },

  statLabel: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
  },

  // ================= BUTTONS =================

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  profileButton: {
    marginTop: 10,

    height: 34,

    paddingHorizontal: 14,

    borderRadius: 10,

    backgroundColor: '#17310F',

    justifyContent: 'center',
    alignItems: 'center',

    alignSelf: 'flex-start',
  },

  profileButtonText: {
    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '700',
  },

  websiteStatusText: {
    marginTop: 10,
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },

  smallButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#17310F',
    marginTop: 14,
    marginRight: 10,
  },

  websiteButton: {
    backgroundColor: '#0B6E4F',
    marginRight: 0,
  },

  websiteButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },

  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },

  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
});

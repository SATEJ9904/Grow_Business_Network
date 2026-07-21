import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  Linking,
  TextInput,
  Alert,
  ScrollView,
  Share,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import PreviewScreen from './PreviewScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;

const AllProfilesScreen = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState(null);
  const [previewCompany, setPreviewCompany] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [userId, setUserId] = useState(null);
  const [websiteHtml, setWebsiteHtml] = useState('');
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [editWebsiteForm, setEditWebsiteForm] = useState({
    company: '',
    services: '',
    about: '',
    footerInfo: '',
    theme: 'Modern',
  });

  const [currentUser, setCurrentUser] = useState(null);

  const LOCAL_BACKEND_HOST = Platform.select({
    android: 'http://192.168.14.149',
    ios: 'http://192.168.14.149',
    default: 'http://192.168.14.149',
  });

  // const BASE_URL = `${LOCAL_BACKEND_HOST}:5001`;
  const PYTHON_URL = `${LOCAL_BACKEND_HOST}:5002`;

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('📦 Loading user from AsyncStorage...');

        const id = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('accessToken');

        console.log('✅ Loaded UserID:', id);
        console.log('✅ Loaded Token:', token);

        if (id) {
          setUserId(id);
        } else {
          console.log('❌ No userId found');
        }
      } catch (error) {
        console.log('🚨 AsyncStorage Error:', error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    fetchUsers('');
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextState => {
        if (nextState === 'active') {
          try {
            const loginTime = await AsyncStorage.getItem('loginTime');
            if (!loginTime) {
              return;
            }

            if (Date.now() - parseInt(loginTime, 10) > EXPIRY_TIME) {
              console.log(
                '⚠️ Session expired on resume, clearing storage and redirecting',
              );
              await AsyncStorage.clear();
              navigation.replace('Login');
            }
          } catch (err) {
            console.log('🚨 AppState expiry check failed:', err);
          }
        }
      },
    );

    return () => subscription.remove();
  }, [navigation]);

  useEffect(() => {
    if (userId) {
      fetchCurrentUser();
      fetchMyWebsite();
    }
  }, [userId]);

  const getImageUrl = path => {
    if (!path) return null;
    return `${BASE_URL}/${path.replace(/\\/g, '/')}`;
  };

  const fetchUsers = async (searchText = '') => {
    try {
      searchText ? setSearchLoading(true) : setLoading(true);

      const url = searchText
        ? `${BASE_URL}/api/member/search?search=${searchText}`
        : `${BASE_URL}/api/member/list?page=1&limit=50`;

      const res = await axios.get(url);

      setData(res.data.data || []);
    } catch (err) {
      console.log('FETCH ERROR:', err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }

    setLoading(false);
    setSearchLoading(false);
  };

  const handleSearch = text => {
    setSearch(text);
    fetchUsers(text);
  };

  const fetchCurrentUser = async () => {
    try {
      console.log('📡 Fetching current user profile');

      const token = await AsyncStorage.getItem('accessToken');

      const res = await axios.get(`${BASE_URL}/api/member/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = res.data.data;

      console.log('✅ USER:', user);

      setCurrentUser(user);

      setProfileForm({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        companyName: user.companyName,
      });

      setWebsiteHtml(user.websiteHtml || '');
    } catch (err) {
      console.log('🚨 User fetch error:', err.response?.data || err.message);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };
  const fetchMyWebsite = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/website/website/${userId}`);
      const site = res.data.website;

      if (site) {
        setWebsiteHtml(site.html);

        setEditWebsiteForm({
          company: site.company || '',
          services: site.services || '',
          about: site.about || '',
          footerInfo: site.footerInfo || '',
          theme: site.theme || 'Modern',
        });
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const fetchUserProfile = async id => {
    try {
      const res = await axios.get(`${BASE_URL}/api/member/${id}`);

      setData(prev =>
        prev.map(item =>
          item._id === id ? { ...item, ...res.data.data } : item,
        ),
      );
    } catch (err) {
      console.log('❌ ERROR:', err.response?.data || err.message);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const updateWebsite = async () => {
    try {
      if (!editWebsiteForm.company?.trim()) {
        alert('Please enter your company name');
        return;
      }

      console.log('📤 Generating website...');

      const formData = new FormData();
      formData.append('company', editWebsiteForm.company);
      formData.append('services', editWebsiteForm.services || '');
      formData.append('about', editWebsiteForm.about || '');

      // ✅ FIXED NAME
      formData.append('footerInfo', editWebsiteForm.footerInfo || '');

      formData.append('footer_info', editWebsiteForm.footerInfo || '');
      const res = await axios.post(`${PYTHON_URL}/generate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('🔥 API RESPONSE:', res.data);

      if (!res.data?.websites || res.data.websites.length === 0) {
        alert('Failed to generate website ❌');
        return;
      }

      // ✅ SAFE THEME MATCH
      let selected = res.data.websites.find(
        w => w.style?.toLowerCase() === editWebsiteForm.theme?.toLowerCase(),
      );

      // ✅ FALLBACK
      if (!selected) {
        console.log('⚠️ Theme not found → using first template');
        selected = res.data.websites[0];
      }

      const updatedHtml = selected?.html;

      // ❗ FIX: REMOVE LENGTH CHECK
      if (!updatedHtml) {
        alert('Website generation failed ❌');
        return;
      }

      console.log('💾 Saving website...');

      const saveRes = await axios.post(`${BASE_URL}/api/website/save-website`, {
        heroTitle: editWebsiteForm.heroTitle,

        heroHighlight: editWebsiteForm.heroHighlight,

        heroDescription: editWebsiteForm.heroDescription,
        userId,
        html: updatedHtml,
        theme: editWebsiteForm.theme,
        company: editWebsiteForm.company,
        services: editWebsiteForm.services,
        about: editWebsiteForm.about,
        footerInfo: editWebsiteForm.footerInfo,
      });

      const savedWebsite = saveRes.data.website;

      console.log('✅ Saved:', savedWebsite);

      if (savedWebsite?.html) {
        setWebsiteHtml(savedWebsite.html);
      }

      setEditWebsiteForm({
        company: savedWebsite.company || '',
        services: savedWebsite.services || '',
        about: savedWebsite.about || '',
        footerInfo: savedWebsite.footerInfo || '',
        theme: savedWebsite.theme || 'Modern',
      });

      await fetchMyWebsite();
      setIsEditingWebsite(false);

      alert('Website Updated ✅');
    } catch (err) {
      console.log('❌ FULL ERROR:', err);
      console.log('❌ MESSAGE:', err.message);
      console.log('❌ RESPONSE:', err.response?.data);
      console.log('❌ CONFIG:', err.config);
      Alert.alert(
        'Error',
        getFriendlyErrorMessage(err, 'Failed to update website. Please try again.'),
      );
    }
  };

  // ================= UPDATE =================
  const updateUserProfile = async id => {
    try {
      await axios.put(`${BASE_URL}/api/admin/member/${id}`, editForm);

      alert('Updated Successfully ✅');
      setEditingUserId(null);
      fetchUserProfile(id);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', getFriendlyErrorMessage(err, 'Update failed. Please try again.'));
    }
  };

  // ================= DELETE ACCOUNT =================
  const deleteAccount = async () => {
    Alert.alert(
      '⚠️ Deactivate Account',
      'Are you sure you want to deactivate your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');

              const res = await axios.put(
                `${BASE_URL}/api/member/delete/${userId}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              console.log('DELETE RESPONSE:', res?.data);

              // ✅ CLEAR STATE
              setCurrentUser(null);

              // ✅ CLEAR STORAGE
              await AsyncStorage.clear();

              // ✅ NAVIGATE
              navigation.replace('Login');
            } catch (err) {
              console.log('DELETE ERROR:', err?.response?.data || err.message);

              Alert.alert(
                'Error',
                getFriendlyErrorMessage(err, 'Failed to deactivate account.'),
              );
            }
          },
        },
      ],
    );
  };

  // ================= WEBSITE =================
  const fetchWebsiteForUser = async userId => {
    try {
      console.log('📡 Fetching website for:', userId);

      const res = await axios.get(`${BASE_URL}/api/website/website/${userId}`);
      const site = res.data.website;

      console.log('🎯 Found Site:', site);

      setData(prev =>
        prev.map(item =>
          item._id === userId ? { ...item, html: site?.html || null } : item,
        ),
      );
    } catch (err) {
      console.log('🚨 Website Error:', err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  // ================= EXPAND =================
  const toggleExpand = item => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const isOpening = expandedId !== item._id;
    setExpandedId(isOpening ? item._id : null);

    if (isOpening) {
      fetchUserProfile(item._id);
      fetchWebsiteForUser(item._id);
    }
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);
  const showSearchSlowNotice = useDelayedNotice(searchLoading, 8000);

  const guardedGoAccount = useGuardedAction(() =>
    navigation.navigate('Account'),
  );

  const guardedToggleExpand = useGuardedAction(item => toggleExpand(item));

  const guardedViewWebsite = useGuardedAction(item =>
    navigation.navigate('Preview', {
      html: item.html,
      title: item.name,
      slug: item.slug,
      companyName: item.companyName,
    }),
  );

  const filteredData = userId ? data.filter(item => item._id !== userId) : data;

  if (selectedHtml) {
    return (
      <PreviewScreen
        html={selectedHtml}
        onClose={() => {
          setSelectedHtml(null);
          setPreviewCompany('');
        }}
        company={previewCompany}
      />
    );
  }
  const updateMyProfile = async () => {
    if (updating) return;

    setUpdating(true);

    try {
      const token = await AsyncStorage.getItem('accessToken');

      await axios.put(`${BASE_URL}/api/member/profile`, profileForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Updated ✅');

      // Refresh user data from backend
      await fetchCurrentUser();

      // Close edit mode
      setIsEditingProfile(false);
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert('Error', getFriendlyErrorMessage(err, 'Update failed. Please try again.'));
    }

    setUpdating(false);
  };

  const shareWebsite = () => {
    if (!editWebsiteForm.company) {
      alert('Please create website first');
      return;
    }

    const slug = editWebsiteForm.company.toLowerCase().replace(/\s+/g, '-');
    const url = `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;

    Share.share({
      message: `Check my website: ${url}`,
    });
  };

  const copyToClipboard = async text => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard');
      Clipboard.setString(text);
      Alert.alert('Copied', `${text} copied to clipboard`);
    } catch (err) {
      console.log('Clipboard copy failed', err);
      try {
        await Share.share({ message: text });
      } catch (shareError) {
        console.log('Share fallback failed', shareError);
      }
      Alert.alert(
        'Copy unavailable',
        'Clipboard support is missing. The share menu is open so you can copy the text from there.',
      );
    }
  };

  const handlePhonePress = phone => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(err => {
      console.log('Phone call failed', err);
      Alert.alert('Cannot call', 'Unable to open phone dialer.');
    });
  };

  const handlePhoneLongPress = phone => {
    if (!phone) return;
    Alert.alert('Phone options', phone, [
      {
        text: 'Call',
        onPress: () => handlePhonePress(phone),
      },
      {
        text: 'Copy',
        onPress: () => copyToClipboard(phone),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleEmailPress = async email => {
    if (!email) return;
    const gmailUrl = `googlegmail://co?to=${email}`;
    const mailUrl = `mailto:${email}`;

    try {
      const supported = await Linking.canOpenURL(gmailUrl);
      if (supported) {
        return Linking.openURL(gmailUrl);
      }
    } catch (err) {
      console.log('Gmail intent failed', err);
    }

    Linking.openURL(mailUrl).catch(err => {
      console.log('Mail open failed', err);
      Alert.alert('Cannot open mail', 'Unable to open email app.');
    });
  };

  // ================= ITEM =================
  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item._id;

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, isExpanded && styles.cardExpanded]}>
          {/* Card Header */}
          <TouchableOpacity
            onPress={() => guardedToggleExpand(item)}
            activeOpacity={0.7}
            style={styles.cardHeader}
          >
            <View style={styles.profileInfo}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarEmoji}>
                  {(item.name || item.email)?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>
                  {item.name || item.fullName || 'No Name'}
                </Text>
                <Text style={styles.company}>
                  {item.companyName || 'No Company'}
                </Text>
              </View>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{item.email || 'N/A'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  {/* <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>
                    {item.isActive ? '✅ Active' : '⚫ Inactive'}
                  </Text> */}
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Joined</Text>
                  <Text style={styles.infoValue}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Website Section */}
              <View style={styles.websiteSection}>
                {item.html ? (
                  <TouchableOpacity
                    style={styles.viewWebsiteBtnNew}
                    onPress={() => {
                      console.log('🌐 Opening Website...', {
                        company: item.companyName || item.name || 'unknown',
                        htmlExists: !!item.html,
                      });
                      guardedViewWebsite(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewWebsiteBtnIcon}>🌐</Text>
                    <Text style={styles.viewWebsiteBtnText}>View Website</Text>
                    <Text style={styles.viewWebsiteBtnArrow}>→</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noWebsiteBox}>
                    <Text style={styles.noWebsiteEmoji}>📭</Text>
                    <Text style={styles.noWebsiteText}>No website yet</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* ================= GRADIENT HEADER ================= */}
      <View style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.appBrand}>🌐 GBN</Text>
            <Text style={styles.headerSubtitle}>Community Profiles</Text>
          </View>
          <TouchableOpacity
            style={styles.accountButtonNew}
            onPress={guardedGoAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.accountButtonIconNew}>👤</Text>
            <Text style={styles.accountButtonTextNew}>Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= WELCOME BANNER ================= */}
      {/* <View style={styles.welcomeBanner}>
        <View>
          <Text style={styles.welcomeTitle}>Connect & Discover</Text>
          <Text style={styles.welcomeSubtitle}>
            Explore amazing websites from our community
          </Text>
        </View>
        <Text style={styles.bannerEmoji}>✨</Text>
      </View> */}

      {/* ================= SEARCH BAR ================= */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            placeholder="Search by name, company, mobile, chapter..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />

          {searchLoading && <ActivityIndicator size="small" color="#2F4F1E" />}
        </View>
        {searchLoading && showSearchSlowNotice && (
          <Text style={styles.emptyText}>
            Still working on it — this is taking longer than expected. Please
            check your connection.
          </Text>
        )}
      </View>

      {/* ================= LIST ================= */}
      <View style={styles.container}>
        {filteredData.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No Profiles Yet</Text>
            <Text style={styles.emptyText}>
              Check back soon for amazing websites
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            // onEndReached={fetchUsers}
            // onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading ? (
                <View style={{ marginVertical: 20 }}>
                  <ActivityIndicator size="large" color="#2F4F1E" />
                  {showSlowNotice && (
                    <Text style={[styles.emptyText, { marginTop: 10 }]}>
                      Still working on it — this is taking longer than
                      expected. Please check your connection.
                    </Text>
                  )}
                </View>
              ) : null
            }
            scrollIndicatorInsets={{ right: 1 }}
          />
        )}
      </View>
    </View>
  );
};

export default AllProfilesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    padding: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2F4F1E',
    marginTop: 50,
  },
  accountButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  accountButtonText: {
    color: '#2F4F1E',
    fontWeight: '700',
  },
  menu: { fontSize: 24, color: '#fff' },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 2,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2F4F1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logo: { width: '100%', height: '100%', borderRadius: 25 },
  avatarText: { color: '#fff', fontSize: 18 },
  name: { fontWeight: 'bold' },
  company: { color: '#777' },
  linkText: {
    color: '#2563eb',
    fontWeight: '700',
    marginBottom: 4,
  },

  dropdown: { marginTop: 10 },
  button: {
    backgroundColor: '#2F4F1E',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff' },

  input: {
    backgroundColor: '#f1f3f6',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    color: '#111827',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: '#fff',
    padding: 20,
    elevation: 10,
    zIndex: 1000,
  },
  drawerContainer: {
    flex: 1,
    marginTop: 50,
  },

  profileHeader: {
    backgroundColor: '#2F4F1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },

  avatarBig: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatarTextBig: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2F4F1E',
  },

  nameBig: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  companyBig: {
    color: '#cde3dc',
    fontSize: 13,
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
  },

  info: {
    fontSize: 13,
    marginBottom: 4,
  },

  primaryBtn: {
    backgroundColor: '#2F4F1E',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  secondaryBtn: {
    backgroundColor: '#1f6f54',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  websiteCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },

  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },

  textArea: {
    backgroundColor: '#f1f3f6',
    padding: 10,
    borderRadius: 10,
    minHeight: 100,
    marginBottom: 10,
  },

  noWebsite: {
    color: '#999',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  pickerContainer: {
    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  // ================= NEW GRADIENT HEADER STYLES =================
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2F4F1E',

    elevation: 8,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 16,
    paddingBottom: 30,
    marginTop: 50,
    paddingVertical: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  appBrand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  accountButtonNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  accountButtonIconNew: {
    fontSize: 16,
    marginRight: 6,
  },
  accountButtonTextNew: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  // ================= WELCOME BANNER =================
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  bannerEmoji: {
    fontSize: 24,
  },
  // ================= EMPTY STATE =================
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // ================= ENHANCED CARD STYLES =================
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardExpanded: {
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2F4F1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '700',
  },
  // ================= EXPANDED CONTENT =================
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  websiteSection: {
    marginTop: 12,
  },
  viewWebsiteBtnNew: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #2F4F1E 0%, #4a7c59 100%)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  viewWebsiteBtnIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  viewWebsiteBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  viewWebsiteBtnArrow: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '700',
  },
  noWebsiteBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(249,250,251,1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noWebsiteEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  noWebsiteText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  // ================= SEARCH =================

  searchContainer: {
    paddingHorizontal: 16,

    marginTop: 16,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
});

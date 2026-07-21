import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  ScrollView,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
  Share,
  Linking,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import PreviewScreen from './PreviewScreen';
import { BASE_URL } from '@env';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const isSmallScreen = windowWidth < 380;
const isMediumScreen = windowWidth < 768;
const isTablet = windowWidth >= 768;

const GenerateScreen = ({ navigation }) => {
  const [company, setCompany] = useState('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [currentServiceImage, setCurrentServiceImage] = useState(null);
  const [serviceItems, setServiceItems] = useState([]);
  const [about, setAbout] = useState('');
  const [footerInfo, setFooterInfo] = useState('');
  const [footerText, setFooterText] = useState('');
  const [footerItems, setFooterItems] = useState([]);
  const [logo, setLogo] = useState(null);
  const [heroImage, setHeroImage] = useState(null);
  const [servicesImage, setServicesImage] = useState(null);
  const [aboutImage, setAboutImage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile: '',
    companyName: '',
  });
  const [myWebsite, setMyWebsite] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [selectedHtml, setSelectedHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skipVerification, setSkipVerification] = useState(false); // 🔄 TEMPORARY BYPASS
  const fadeAnim = useRef(new Animated.Value(0));
  const scaleAnim = useRef(new Animated.Value(0.95));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim.current, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim.current, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
        }
      } catch (err) {
        console.log('GenerateScreen loadUser error', err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCurrentUser();
      fetchMyWebsite();
    }
  }, [userId]);

  const BACKEND_HOST = Platform.select({
    android: 'http://192.168.14.149',
    ios: 'http://192.168.14.149',
    default: 'http://192.168.14.149',
  });
  // const BASE_URL = `${BACKEND_HOST}:5001`;
  const PYTHON_BACKEND_PORT = 5002;
  const PYTHON_BACKEND_URL = `${BACKEND_HOST}:${PYTHON_BACKEND_PORT}`;
  console.log('Python Backend URL:', PYTHON_BACKEND_URL);

  const GENERATE_URL = `${PYTHON_BACKEND_URL}/generate`;

  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const res = await axios.get(`${BASE_URL}/api/member/profile`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const user = res.data.data;
      if (user) {
        setCurrentUser(user);
        setProfileForm({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || '',
          companyName: user.companyName || '',
        });
      }
    } catch (err) {
      console.log(
        'GenerateScreen fetchCurrentUser error',
        err?.response?.data || err.message,
      );
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const fetchMyWebsite = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/website/website/${userId}`);
      if (res.data?.website) {
        setMyWebsite(res.data.website);
      }
    } catch (err) {
      console.log(
        'GenerateScreen fetchMyWebsite error',
        err?.response?.data || err.message,
      );
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const shareWebsite = () => {
    const slug = myWebsite?.slug;

    if (!slug) {
      Alert.alert(
        'Share Website',
        'Please save or publish your website first before sharing the public URL.',
      );
      return;
    }

    const url = `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;

    Share.share({
      message: `Check out my website: ${url}`,
    });
  };

  const getAuthHeaders = async (contentType = 'multipart/form-data') => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const headers = {};

    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  };

  const requestPhotoPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(permission);
    return status === PermissionsAndroid.RESULTS.GRANTED;
  };

  const optionPalettes = [
    { bg: '#eef2ff', border: '#c7d2fe', accent: '#4338ca', label: '#312e81' },
    { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', label: '#713f12' },
    { bg: '#ecfdf5', border: '#86efac', accent: '#047857', label: '#064e3b' },
    { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626', label: '#991b1b' },
    { bg: '#eef2ff', border: '#bfdbfe', accent: '#2563eb', label: '#1e3a8a' },
  ];

  const getOptionCardStyle = index =>
    optionPalettes[index % optionPalettes.length];

  const pickImage = async () => {
    const hasPermission = await requestPhotoPermission();
    if (!hasPermission) {
      alert('Permission required to select an image.');
      return;
    }

    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        alert(response.errorMessage || 'Image picker error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setLogo(response.assets[0]);
      }
    });
  };

  const pickHeroImage = async () => {
    const hasPermission = await requestPhotoPermission();
    if (!hasPermission) {
      alert('Permission required to select an image.');
      return;
    }

    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        alert(response.errorMessage || 'Image picker error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setHeroImage(response.assets[0]);
      }
    });
  };

  const pickServicesImage = async () => {
    const hasPermission = await requestPhotoPermission();
    if (!hasPermission) {
      alert('Permission required to select an image.');
      return;
    }

    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        alert(response.errorMessage || 'Image picker error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setServicesImage(response.assets[0]);
      }
    });
  };

  const pickAboutImage = async () => {
    const hasPermission = await requestPhotoPermission();
    if (!hasPermission) {
      alert('Permission required to select an image.');
      return;
    }

    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        alert(response.errorMessage || 'Image picker error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setAboutImage(response.assets[0]);
      }
    });
  };

  const addServiceItem = () => {
    const title = serviceTitle.trim();
    const description = serviceDescription.trim();
    if (!title && !description) return;

    setServiceItems(prev => [
      ...prev,
      {
        title,
        description,
        image: currentServiceImage,
      },
    ]);

    setServiceTitle('');
    setServiceDescription('');
    setCurrentServiceImage(null);
  };

  const addFooterItem = () => {
    const value = footerText.trim();
    if (!value) return;
    setFooterItems(prev => [...prev, value]);
    setFooterText('');
  };

  const removeFooterItem = index => {
    setFooterItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const removeServiceItem = index => {
    setServiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const pickServiceItemImage = async index => {
    if (!(await requestPhotoPermission())) return;

    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        alert(response.errorMessage || 'Image picker error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (typeof index === 'number') {
          setServiceItems(prev =>
            prev.map((item, idx) =>
              idx === index ? { ...item, image: asset } : item,
            ),
          );
        } else {
          setCurrentServiceImage(asset);
        }
      }
    });
  };

  const generate = async () => {
    const form = new FormData();
    form.append('company', company);
    form.append(
      'services',
      serviceItems.length
        ? serviceItems.map(item => item.title).join('\n')
        : '',
    );
    form.append('service_items', JSON.stringify(serviceItems));
    form.append('about', about);
    const footerPayload = footerItems.length
      ? footerItems.join('\n')
      : footerInfo;
    form.append('footer_info', footerPayload);

    if (logo) {
      form.append('logo', {
        uri: logo.uri,
        type: logo.type || 'image/jpeg',
        name: logo.fileName || 'logo.jpg',
      });
    }

    if (heroImage) {
      form.append('hero_image', {
        uri: heroImage.uri,
        type: heroImage.type || 'image/jpeg',
        name: heroImage.fileName || 'hero.jpg',
      });
    }

    if (servicesImage) {
      form.append('services_image', {
        uri: servicesImage.uri,
        type: servicesImage.type || 'image/jpeg',
        name: servicesImage.fileName || 'services.jpg',
      });
    }

    serviceItems.forEach((item, index) => {
      if (item.image) {
        form.append('service_images', {
          uri: item.image.uri,
          type: item.image.type || 'image/jpeg',
          name: item.image.fileName || `service-${index + 1}.jpg`,
        });
      }
    });

    if (aboutImage) {
      form.append('about_image', {
        uri: aboutImage.uri,
        type: aboutImage.type || 'image/jpeg',
        name: aboutImage.fileName || 'about.jpg',
      });
    }

    try {
      setLoading(true);
      const res = await axios.post(GENERATE_URL, form, {
        headers: await getAuthHeaders(),
      });
      setWebsites(res.data.websites || []);
    } catch (e) {
      console.log('Error:', e.message);
      console.log('Response:', e.response?.data);
      Alert.alert('Error', getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const saveWebsite = async item => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName');
      const token = await AsyncStorage.getItem('accessToken');

      if (!userId) {
        alert('Please log in before saving your website.');
        return;
      }

      const servicePayload = serviceItems.length
        ? serviceItems
            .map(item => item.title || item.description || 'Service')
            .join('\n')
        : '';

      const res = await axios.post(
        `${BASE_URL}/api/website/save-website`,
        {
          userId,
          userName,

          // ✅ Theme and layout
          theme: item.style,
          layoutId: item.id || item.style,
          layoutName: item.style,

          // ✅ HTML
          html: item.html,

          // ✅ Company Details
          company,

          // ✅ Services
          services: servicePayload,

          // ✅ Full Service Items
          serviceItems: serviceItems,

          // ✅ About Section
          about,

          // ✅ Footer Info
          footerInfo: footerItems.length ? footerItems.join('\n') : footerInfo,

          // ✅ Contact Details
          contactEmail: currentUser?.email || '',

          contactPhone: currentUser?.mobile || '',

          contactAddress: currentUser?.companyName || '',

          // ✅ Optional Full Contact Items
          contactItems: [
            {
              email: currentUser?.email || '',
              phone: currentUser?.mobile || '',
              address: currentUser?.companyName || '',
            },
          ],
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,

            'Content-Type': 'application/json',
          },
        },
      );
      console.log('Saved:', res.data);

      setSelectedHtml(item.html);
      if (res.data?.website) {
        setMyWebsite(res.data.website);
      }
      await fetchMyWebsite();

      // 🔄 TEMPORARY BYPASS - Skip verification and navigate
      if (skipVerification) {
        console.log('⏭️ Skipping verification, navigating to Dashboard...');
        setSkipVerification(false);
        navigation.navigate('Dashboard');
        return;
      }
    } catch (err) {
      console.log('Save error:', err.response?.data || err.message || err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);

  const guardedGoToAllProfiles = useGuardedAction(() =>
    navigation.navigate('AllProfiles'),
  );
  const guardedPickImage = useGuardedAction(pickImage);
  const guardedPickHeroImage = useGuardedAction(pickHeroImage);
  const guardedPickServicesImage = useGuardedAction(pickServicesImage);
  const guardedPickAboutImage = useGuardedAction(pickAboutImage);
  const guardedPickServiceItemImage = useGuardedAction(pickServiceItemImage);
  const guardedAddServiceItem = useGuardedAction(addServiceItem);
  const guardedRemoveServiceItem = useGuardedAction(removeServiceItem);
  const guardedAddFooterItem = useGuardedAction(addFooterItem);
  const guardedRemoveFooterItem = useGuardedAction(removeFooterItem);
  const guardedGenerate = useGuardedAction(generate);
  const guardedToggleSkipVerification = useGuardedAction(
    () => setSkipVerification(!skipVerification),
    250,
  );
  const guardedSelectHtml = useGuardedAction(htmlContent =>
    setSelectedHtml(htmlContent),
  );
  const guardedSaveWebsite = useGuardedAction(item => saveWebsite(item));

  if (selectedHtml) {
    return (
      <PreviewScreen
        html={selectedHtml}
        company={company}
        slug={myWebsite?.slug}
        onClose={() => setSelectedHtml(null)}
      />
    );
  }

  return (
    <ImageBackground
      source={require('../Images/bgimage2.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isSmallScreen && styles.contentSmall,
        ]}
      >
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>
          Create Your Website
        </Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          Pick a single-page layout, edit your content, and preview the live
          site.
        </Text>

        <TouchableOpacity
          style={styles.myProfilesButton}
          onPress={guardedGoToAllProfiles}
        >
          <Text style={styles.myProfilesButtonText}>📱 My Profiles</Text>
        </TouchableOpacity>

        {/* <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'G'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {currentUser?.name || 'Guest User'}
              </Text>
              <Text style={styles.profileCompany}>
                {currentUser?.companyName || 'Business Owner'}
              </Text>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>Email</Text>
              <Text style={styles.profileStatValue}>
                {currentUser?.email || 'Not available'}
              </Text>
            </View>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>Phone</Text>
              <Text style={styles.profileStatValue}>
                {currentUser?.mobile || 'Not available'}
              </Text>
            </View>
          </View>

          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              onPress={shareWebsite}
              style={styles.profileOutlineButton}
            >
              <Text style={styles.profileOutlineButtonText}>Share Website</Text>
            </TouchableOpacity>
          </View>
        </View> */}

        {/* <View style={styles.websiteSummaryCard}>
          <View style={styles.websiteSummaryHeader}>
            <Text style={styles.websiteSummaryTitle}>Website</Text>
            {myWebsite?.html ? (
              <TouchableOpacity
                style={styles.websitePreviewButton}
                onPress={() => setSelectedHtml(myWebsite.html)}
              >
                <Text style={styles.websitePreviewText}>Preview</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.websiteSummarySubtitle}>
            {myWebsite?.company ? (
              <Text style={styles.websiteSummaryText}>
                Website for <Text style={styles.companyHighlight}>{myWebsite.company}</Text>
              </Text>
            ) : (
              'Your website is ready to build here.'
            )}
          </Text>
          <Text style={styles.websiteSummaryBody}>
            {myWebsite?.html
              ? 'Manage your website content and preview the current site.'
              : 'Add your business details below and generate a new website.'}
          </Text>
          {(serviceItems.length > 0 || footerItems.length > 0) && (
            <View style={styles.websiteSummaryMeta}>
              {serviceItems.length > 0 ? (
                <View style={styles.websiteMetaBlock}>
                  <Text style={styles.websiteMetaLabel}>Services</Text>
                  <View style={styles.serviceChipsRow}>
                    {serviceItems.map((item, index) => (
                      <View
                        key={`meta-${item}-${index}`}
                        style={styles.serviceChip}
                      >
                        <Text style={styles.serviceChipText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {footerItems.length > 0 ? (
                <View style={styles.websiteMetaBlock}>
                  <Text style={styles.websiteMetaLabel}>Footer Items</Text>
                  <View style={styles.footerChipsRow}>
                    {footerItems.map((item, index) => (
                      <View
                        key={`footer-meta-${item}-${index}`}
                        style={styles.footerChip}
                      >
                        <Text style={styles.footerChipText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}
          <View style={styles.profileActionsRow}>
            {myWebsite?.html ? (
              <TouchableOpacity
                style={styles.profileOutlineButton}
                onPress={() => setSelectedHtml(myWebsite.html)}
              >
                <Text style={styles.profileOutlineButtonText}>
                  View Website
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View> */}

        <View style={styles.field}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            value={company}
            onChangeText={setCompany}
            placeholder="Enter your company name"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Services</Text>
          <TextInput
            value={serviceTitle}
            onChangeText={setServiceTitle}
            placeholder="Service title"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
          <TextInput
            value={serviceDescription}
            onChangeText={setServiceDescription}
            placeholder="Service description"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.input, styles.multilineInput, { marginTop: 12 }]}
          />
          <TouchableOpacity
            style={[
              styles.uploadButton,
              isSmallScreen && styles.uploadButtonSmall,
              { marginTop: 12 },
            ]}
            onPress={() => guardedPickServiceItemImage()}
          >
            <Text style={styles.uploadButtonText}>
              {currentServiceImage
                ? 'Change Service Photo'
                : 'Upload Service Photo'}
            </Text>
          </TouchableOpacity>
          {currentServiceImage && (
            <Image
              source={{ uri: currentServiceImage.uri }}
              style={[
                styles.imagePreview,
                isSmallScreen && styles.imagePreviewSmall,
              ]}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            style={[styles.serviceAddButton, { marginTop: 14 }]}
            onPress={guardedAddServiceItem}
            activeOpacity={0.8}
          >
            <Text style={styles.serviceAddText}>+ Add Service</Text>
          </TouchableOpacity>

          {serviceItems.length > 0 && (
            <View style={{ marginTop: 16 }}>
              {serviceItems.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.serviceCard}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image.uri }}
                      style={styles.serviceCardImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.serviceCardTitle}>
                      {item.title || 'Service'}
                    </Text>
                    {item.description ? (
                      <Text style={styles.serviceCardDescription}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.serviceCardActions}>
                    <TouchableOpacity
                      style={styles.serviceAddButton}
                      onPress={() => guardedPickServiceItemImage(index)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.serviceAddText}>Change Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => guardedRemoveServiceItem(index)}
                      style={[
                        styles.serviceAddButton,
                        { backgroundColor: '#ef4444', marginLeft: 10 },
                      ]}
                    >
                      <Text style={styles.serviceAddText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>About</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            placeholder="Write a short company summary"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[styles.input, styles.aboutInput]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Footer Items</Text>
          <View style={styles.serviceRow}>
            <TextInput
              value={footerText}
              onChangeText={setFooterText}
              placeholder="Add footer item and tap +"
              placeholderTextColor="#9ca3af"
              style={[styles.input, styles.serviceInput]}
              returnKeyType="done"
              onSubmitEditing={addFooterItem}
            />
            <TouchableOpacity
              style={styles.serviceAddButton}
              onPress={guardedAddFooterItem}
              activeOpacity={0.8}
            >
              <Text style={styles.serviceAddText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {footerItems.length > 0 ? (
            <View style={styles.footerChipsRow}>
              {footerItems.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.footerChip}>
                  <Text style={styles.footerChipText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => guardedRemoveFooterItem(index)}
                    style={styles.serviceChipRemove}
                  >
                    <Text style={styles.serviceChipRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <TextInput
              value={footerInfo}
              onChangeText={setFooterInfo}
              placeholder="Your name, email, or a closing message"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.input, styles.aboutInput]}
            />
          )}
        </View>

        {/* <View style={styles.websiteSettingsCard}>
          <Text style={styles.websiteSettingsTitle}>Website Branding</Text>
          <Text style={styles.websiteSettingsSubtitle}>
            Upload your logo and choose the services that will appear on your
            website.
          </Text>
          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              style={[
                styles.profileOutlineButton,
                styles.websiteSettingsButton,
              ]}
              onPress={pickImage}
            >
              <Text style={styles.profileOutlineButtonText}>
                {logo ? 'Change Logo' : 'Upload Logo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileButton, styles.websiteSettingsButton]}
              onPress={pickServicesImage}
            >
              <Text style={styles.profileButtonText}>
                Upload Services Image
              </Text>
            </TouchableOpacity>
          </View>
          {logo ? (
            <Image
              source={{ uri: logo.uri }}
              style={[
                styles.logoPreview,
                isSmallScreen && styles.logoPreviewSmall,
              ]}
              resizeMode="contain"
            />
          ) : null}
        </View> */}

        <View style={styles.field}>
          <Text style={styles.label}>Hero Image</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              isSmallScreen && styles.uploadButtonSmall,
            ]}
            onPress={guardedPickHeroImage}
          >
            <Text style={styles.uploadButtonText}>
              {heroImage ? 'Change Hero Image' : 'Upload Hero Image'}
            </Text>
          </TouchableOpacity>
          {heroImage && (
            <Image
              source={{ uri: heroImage.uri }}
              style={[
                styles.imagePreview,
                isSmallScreen && styles.imagePreviewSmall,
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Services Image</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              isSmallScreen && styles.uploadButtonSmall,
            ]}
            onPress={guardedPickServicesImage}
          >
            <Text style={styles.uploadButtonText}>
              {servicesImage
                ? 'Change Services Image'
                : 'Upload Services Image'}
            </Text>
          </TouchableOpacity>
          {servicesImage && (
            <Image
              source={{ uri: servicesImage.uri }}
              style={[
                styles.imagePreview,
                isSmallScreen && styles.imagePreviewSmall,
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>About Image</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              isSmallScreen && styles.uploadButtonSmall,
            ]}
            onPress={guardedPickAboutImage}
          >
            <Text style={styles.uploadButtonText}>
              {aboutImage ? 'Change About Image' : 'Upload About Image'}
            </Text>
          </TouchableOpacity>
          {aboutImage && (
            <Image
              source={{ uri: aboutImage.uri }}
              style={[
                styles.imagePreview,
                isSmallScreen && styles.imagePreviewSmall,
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            isSmallScreen && styles.uploadButtonSmall,
          ]}
          onPress={guardedPickImage}
        >
          <Text style={styles.uploadButtonText}>Upload Logo</Text>
        </TouchableOpacity>

        {logo && (
          <Image
            source={{ uri: logo.uri }}
            style={[
              styles.logoPreview,
              isSmallScreen && styles.logoPreviewSmall,
            ]}
            resizeMode="contain"
          />
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            isSmallScreen && styles.generateButtonSmall,
          ]}
          onPress={guardedGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Website</Text>
          )}
        </TouchableOpacity>

        {loading && showSlowNotice ? (
          <Text style={styles.slowNoticeText}>
            Still generating your website — this is taking longer than
            expected.
          </Text>
        ) : null}

        {/* 🔄 TEMPORARY BYPASS - Skip Email Verification */}
        <TouchableOpacity
          style={[
            styles.bypassButton,
            skipVerification && styles.bypassButtonActive,
            isSmallScreen && styles.generateButtonSmall,
          ]}
          onPress={guardedToggleSkipVerification}
        >
          <Text style={styles.bypassButtonText}>
            {skipVerification
              ? '✅ Skip Verification: ON'
              : '⏭️ Skip Verification (Temporary)'}
          </Text>
        </TouchableOpacity>

        {websites.length > 0 && (
          <>
            <Text style={styles.optionsTitle}>Choose one design</Text>
            <Text style={styles.optionsSubtitle}>
              Tap a style to preview a unique layout with its own color palette.
            </Text>
          </>
        )}
        {websites.map((item, index) => {
          const palette = getOptionCardStyle(index);
          return (
            <TouchableOpacity
              key={item.id || index}
              style={[
                styles.optionCard,
                {
                  backgroundColor: palette.bg,
                  borderColor: palette.border,
                },
              ]}
              onPress={() => guardedSelectHtml(item.html)}
            >
              <View
                style={[
                  styles.optionHeader,
                  { backgroundColor: `${palette.accent}1A` },
                ]}
              >
                <Text style={[styles.optionLabel, { color: palette.label }]}>
                  {item.style || `Design ${index + 1}`}
                </Text>
                <Text
                  style={[
                    styles.optionTag,
                    { color: palette.accent, borderColor: palette.accent },
                  ]}
                >
                  Modern
                </Text>
              </View>
              <Text style={styles.optionDescription}>
                {item.description ||
                  'Bold sections, clean spacing, and a premium visual rhythm.'}
              </Text>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => guardedSaveWebsite(item)}
              >
                <Text style={styles.saveButtonText}>Save & Preview</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f0f4f9',
  },
  backgroundImage: {
    opacity: 0.18,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 22,
    paddingBottom: 50,
  },
  contentSmall: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: -0.8,
    marginTop: 24,
  },
  titleSmall: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  subtitleSmall: {
    fontSize: 14,
    marginBottom: 28,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 10,
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  aboutInput: {
    minHeight: 140,
    paddingTop: 14,
  },
  uploadButton: {
    backgroundColor: '#2F4F1E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2F4F1E',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  uploadButtonSmall: {
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fafbfc',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoPreviewSmall: {
    height: 120,
    marginBottom: 18,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fafbfc',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imagePreviewSmall: {
    height: 100,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  generateButton: {
    backgroundColor: '#2F4F1E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#2F4F1E',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 32,
    borderWidth: 0,
  },
  generateButtonSmall: {
    paddingVertical: 15,
    marginBottom: 28,
  },
  generateButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  slowNoticeText: {
    textAlign: 'center',
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
    marginTop: -16,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  // 🔄 TEMPORARY BYPASS BUTTON STYLES
  bypassButton: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#dc2626',
    opacity: 0.7,
  },
  bypassButtonActive: {
    backgroundColor: '#dc2626',
    opacity: 1,
    borderColor: '#991b1b',
  },
  bypassButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  optionsTitle: {
    marginBottom: 8,
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  optionsSubtitle: {
    marginBottom: 20,
    color: '#64748b',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  optionCard: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    minHeight: 140,
    backgroundColor: '#ffffff',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  optionTag: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInput: {
    flex: 1,
    marginRight: 8,
  },
  serviceChipsRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: 14,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginRight: 10,
    marginBottom: 10,
  },
  serviceChipText: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceChipRemove: {
    marginLeft: 10,
    padding: 2,
  },
  serviceChipRemoveText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '800',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  serviceCardImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 14,
  },
  serviceCardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  serviceCardDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  serviceCardActions: {
    flexDirection: 'row',
    marginTop: 14,
  },
  serviceAddButton: {
    backgroundColor: '#2F4F1E',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  serviceAddText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  optionDescription: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23,
    paddingHorizontal: 4,
  },
  saveButton: {
    marginTop: 18,
    backgroundColor: '#2F4F1E',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  myProfilesButton: {
    backgroundColor: '#2F4F1E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 16,
    minWidth: 160,
  },
  myProfilesButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1f2937',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileCompany: {
    color: '#475569',
    fontSize: 14,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  profileStatItem: {
    flex: 1,
  },
  profileStatLabel: {
    color: '#6b7280',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '700',
  },
  profileStatValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  profileActionsRow: {
    flexDirection: 'row',
  },
  profileButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  profileButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  profileOutlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  profileOutlineButtonText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 14,
  },
  profileEditCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileEditTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  websiteSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  websiteSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  websiteSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  websitePreviewButton: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  websitePreviewText: {
    color: '#0c4a6e',
    fontWeight: '700',
  },
  websiteSummarySubtitle: {
    color: '#6b7280',
    marginBottom: 10,
  },
  websiteSummaryText: {
    color: '#6b7280',
    fontSize: 14,
  },
  companyHighlight: {
    color: '#0f172a',
    fontWeight: '800',
    backgroundColor: 'rgba(59,130,246,0.12)',
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  websiteSettingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  websiteSettingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  websiteSettingsSubtitle: {
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  websiteSettingsButton: {
    flex: 1,
  },
  footerChipsRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: 14,
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginRight: 10,
    marginBottom: 10,
  },
  footerChipText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },

  websiteSummaryBody: {
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  websiteSummaryMeta: {
    marginBottom: 16,
  },
  websiteMetaBlock: {
    marginBottom: 12,
  },
  websiteMetaLabel: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 13,
  },
  profilesButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  profilesButtonText: {
    color: '#2F4F1E',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default GenerateScreen;

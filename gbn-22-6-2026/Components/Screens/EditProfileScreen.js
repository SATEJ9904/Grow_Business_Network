import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  memo,
  useRef,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { BASE_URL } from '@env';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

// const BASE_URL = 'http://192.168.14.149:5001';

// Uncontrolled TextInput component with ref - NEVER re-renders
const TextInputField = memo(
  ({ label, defaultValue, multiline, onChangeText, inputRef }) => {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>{label}</Text>

        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && { height: 110, paddingTop: 14 }]}
          defaultValue={defaultValue}
          multiline={multiline}
          editable={true}
          scrollEnabled={multiline}
          selectTextOnFocus={false}
          autoCorrect={false}
          autoCapitalize="none"
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholder={`Enter ${label}`}
          placeholderTextColor="#9CA3AF"
          onChangeText={onChangeText}
          blurOnSubmit={false}
        />
      </View>
    );
  },
  () => true, // Always return true - NEVER re-render this component
);

const EditProfileScreen = () => {
  // Use ref to store form values during editing to prevent state updates on every keystroke
  const formValuesRef = useRef({
    name: '',
    email: '',
    mobile: '',
    companyName: '',
    tagline: '',
    businessCategory: '',
    industry: '',
    website: '',
    uniqueBusiness: '',
    professionalValues: '',
    expertise: '',
    achievements: '',
    connectReason: '',
    collaborationType: '',
    growthOpportunities: '',
    preferredCities: '',
    products: '',
    priceRange: '',
    minimumOrder: '',
    serviceAreas: '',
    instagram: '',
    linkedin: '',
  });

  // Store TextInput component refs
  const inputRefs = useRef({
    name: null,
    email: null,
    mobile: null,
    companyName: null,
    tagline: null,
    businessCategory: null,
    industry: null,
    website: null,
    uniqueBusiness: null,
    professionalValues: null,
    expertise: null,
    achievements: null,
    connectReason: null,
    collaborationType: null,
    growthOpportunities: null,
    preferredCities: null,
    products: null,
    priceRange: null,
    minimumOrder: null,
    serviceAreas: null,
    instagram: null,
    linkedin: null,
  });

  const [expandedSection, setExpandedSection] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const [coverImage, setCoverImage] = useState(null);

  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const showSlowNotice = useDelayedNotice(loadingProfile, 8000);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile: '',
    companyName: '',
    tagline: '',
    businessCategory: '',
    industry: '',
    website: '',

    uniqueBusiness: '',
    professionalValues: '',
    expertise: '',
    achievements: '',

    collaborationType: '',
    growthOpportunities: '',
    connectReason: '',
    preferredCities: '',

    products: '',
    priceRange: '',
    minimumOrder: '',
    serviceAreas: '',

    instagram: '',
    linkedin: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = await AsyncStorage.getItem('accessToken');

      const res = await axios.get(`${BASE_URL}member/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = res.data.data;

      setUserId(user._id);
      console.log('PROFILE IMAGE DB:', user.profileImage);
      console.log('COVER IMAGE DB:', user.coverImage);

      // Update state
      setProfileForm({
        ...profileForm,
        ...user,
      });

      // Also update formValuesRef for consistency
      formValuesRef.current = {
        ...formValuesRef.current,
        ...user,
      };

      // Update refs with user data
      Object.keys(inputRefs.current).forEach(key => {
        if (inputRefs.current[key] && user[key]) {
          inputRefs.current[key].setNativeProps({ text: user[key] });
        }
      });

      if (user.profileImage) {
        const profileUrl =
          BASE_URL.replace('/api/', '/') +
          user.profileImage.replace(/\\/g, '/');

        console.log('PROFILE URL:', profileUrl);

        setProfileImage(profileUrl);
      }

      if (user.coverImage) {
        const coverUrl =
          BASE_URL.replace('/api/', '/') + user.coverImage.replace(/\\/g, '/');

        console.log('COVER URL:', coverUrl);

        setCoverImage(coverUrl);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = useCallback((key, text) => {
    // Store in ref - NO state update = NO parent re-render = keyboard stays open
    formValuesRef.current[key] = text;
  }, []);

  const completion = useMemo(() => {
    // Merge state and ref values for accurate completion calculation
    const mergedForm = { ...profileForm, ...formValuesRef.current };
    const values = Object.values(mergedForm);

    const filled = values.filter(
      item => item && item.toString().trim() !== '',
    ).length;

    return Math.min(100, Math.floor((filled / values.length) * 100));
  }, [profileForm]);

  const calculateSectionCompletion = sectionKey => {
    const sectionFields = {
      identity: [
        'name',
        'email',
        'mobile',
        'companyName',
        'tagline',
        'businessCategory',
        'industry',
        'website',
      ],
      strength: [
        'uniqueBusiness',
        'professionalValues',
        'expertise',
        'achievements',
      ],
      networking: [
        'connectReason',
        'collaborationType',
        'growthOpportunities',
        'preferredCities',
      ],
      products: ['products', 'priceRange', 'minimumOrder', 'serviceAreas'],
      social: ['instagram', 'linkedin'],
    };

    const fields = sectionFields[sectionKey] || [];
    if (fields.length === 0) return 0;

    const filledFields = fields.filter(field => {
      const mergedForm = { ...profileForm, ...formValuesRef.current };
      return mergedForm[field] && mergedForm[field].toString().trim() !== '';
    }).length;

    return Math.floor((filledFields / fields.length) * 100);
  };

  const pickImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
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
        quality: 1,
      },
      response => {
        if (response.assets?.length > 0) {
          setCoverImage(response.assets[0].uri);
        }
      },
    );
  };

  const saveProfile = async (retryCount = 0) => {
    try {
      console.log('🔄 [SAVE START] Starting profile save process...');
      setSaving(true);

      const token = await AsyncStorage.getItem('accessToken');
      console.log(
        '🔑 [TOKEN CHECK] Token retrieved:',
        token ? 'YES ✓' : 'NO ✗',
      );
      console.log('🔑 [TOKEN LENGTH]:', token?.length || 0);

      if (!token) {
        console.log('❌ [TOKEN ERROR] No token found in AsyncStorage');
        Alert.alert(
          'Error',
          'No authentication token found. Please login again.',
        );
        return;
      }

      if (!BASE_URL) {
        console.log('❌ [URL ERROR] BASE_URL is not defined');
        Alert.alert('Error', 'API endpoint not configured. Contact support.');
        return;
      }

      const formData = new FormData();

      // Get values from ref (typed during editing) and merge with state
      const finalFormData = {
        ...profileForm,
        ...formValuesRef.current,
      };

      console.log('📤 [SAVING PROFILE] Attempt:', retryCount + 1);
      console.log('🌐 [BASE_URL]:', BASE_URL);
      console.log(
        '🔑 [TOKEN]:',
        token ? token.substring(0, 20) + '...' : 'NO TOKEN',
      );
      console.log('📋 [FORM DATA BEFORE MERGE]:', profileForm);
      console.log('📝 [FORM DATA FROM REF]:', formValuesRef.current);
      console.log('✅ [FINAL FORM DATA]:', finalFormData);

      const fieldsCount = Object.keys(finalFormData).length;
      console.log('📊 [TOTAL FIELDS]:', fieldsCount);

      const payload = {
        name: finalFormData.name,
        email: finalFormData.email,
        mobile: finalFormData.mobile,
        companyName: finalFormData.companyName,
        tagline: finalFormData.tagline,
        businessCategory: finalFormData.businessCategory,
        industry: finalFormData.industry,
        website: finalFormData.website,
        uniqueBusiness: finalFormData.uniqueBusiness,
        professionalValues: finalFormData.professionalValues,
        expertise: finalFormData.expertise,
        achievements: finalFormData.achievements,
        collaborationType: finalFormData.collaborationType,
        growthOpportunities: finalFormData.growthOpportunities,
        connectReason: finalFormData.connectReason,
        preferredCities: finalFormData.preferredCities,
        products: finalFormData.products,
        priceRange: finalFormData.priceRange,
        minimumOrder: finalFormData.minimumOrder,
        serviceAreas: finalFormData.serviceAreas,
        instagram: finalFormData.instagram,
        linkedin: finalFormData.linkedin,
      };

      Object.keys(payload).forEach(key => {
        formData.append(key, payload[key] || '');
      });

      if (profileImage && !profileImage.startsWith('http')) {
        console.log(
          '🖼️  [PROFILE IMAGE] Adding profile image:',
          profileImage.substring(0, 50),
        );
        formData.append('profileImage', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      } else {
        console.log('🖼️  [PROFILE IMAGE] No new profile image to upload');
      }

      if (coverImage && !coverImage.startsWith('http')) {
        console.log(
          '🎨 [COVER IMAGE] Adding cover image:',
          coverImage.substring(0, 50),
        );
        formData.append('coverImage', {
          uri: coverImage,
          type: 'image/jpeg',
          name: 'cover.jpg',
        });
      } else {
        console.log('🎨 [COVER IMAGE] No new cover image to upload');
      }

      const apiUrl = `${BASE_URL}member/profile`;
      console.log('📡 [API URL]:', apiUrl);
      console.log('📡 [REQUEST METHOD]: PUT');
      console.log('📡 [REQUEST TIMEOUT]: 30000ms');
      console.log('📡 [CONTENT TYPE]: multipart/form-data');
      console.log(
        '📡 [AUTH HEADER]: Bearer ' + token?.substring(0, 20) + '...',
      );

      const response = await axios.put(apiUrl, formData, {
        timeout: 120000,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('🚀 [REQUEST SENDING] Making PUT request to:', apiUrl);

      console.log('✅ [SUCCESS RESPONSE] Response received:', response.data);
      console.log('✅ [STATUS CODE]:', response.status);
      console.log('✅ [STATUS TEXT]:', response.statusText);

      // Update state after successful save
      setProfileForm(finalFormData);
      formValuesRef.current = { ...finalFormData };

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.log('\n❌❌❌ [ERROR CAUGHT] ❌❌❌');
      console.log('⏰ [ERROR TIME]:', new Date().toISOString());
      console.log('🔄 [RETRY ATTEMPT]:', retryCount);

      // Full error object
      console.log('📦 [FULL ERROR OBJECT]:', JSON.stringify(error, null, 2));

      // Error message and code
      console.log('❌ [ERROR MESSAGE]:', error.message);
      console.log('❌ [ERROR CODE]:', error.code);
      console.log('❌ [ERROR NAME]:', error.name);

      // Network-specific errors
      console.log('🌐 [ERROR CONFIG]:', {
        method: error.config?.method,
        url: error.config?.url,
        timeout: error.config?.timeout,
        headers: error.config?.headers,
      });

      // Response information
      console.log('📥 [RESPONSE STATUS]:', error.response?.status);
      console.log('📥 [RESPONSE STATUS TEXT]:', error.response?.statusText);
      console.log('📥 [RESPONSE DATA]:', error.response?.data);
      console.log('📥 [RESPONSE HEADERS]:', error.response?.headers);

      // Request information
      console.log('📤 [REQUEST]:', {
        method: error.request?.method,
        url: error.request?.url,
        timeout: error.request?.timeout,
        responseType: error.request?.responseType,
      });

      // Platform-specific error details
      if (error.response === undefined && error.request === undefined) {
        console.log(
          '⚠️  [ERROR TYPE]: Client setup error (no network request made)',
        );
      } else if (error.response === undefined) {
        console.log(
          '⚠️  [ERROR TYPE]: Network error (request sent but no response)',
        );
        console.log('🔍 [NETWORK DETAILS]:', {
          readyState: error.request?.readyState,
          status: error.request?.status,
          statusText: error.request?.statusText,
        });
      } else {
        console.log('⚠️  [ERROR TYPE]: Server responded with error');
      }

      console.log('❌❌❌ [END ERROR LOG] ❌❌❌\n');

      let errorMessage = 'Network error occurred';
      let canRetry = false;

      console.log('\n🔍 [ERROR CLASSIFICATION]');
      if (error.code === 'ECONNABORTED') {
        console.log('📍 Diagnosis: Request timeout');
        errorMessage = 'Request timeout. Server took too long to respond.';
        canRetry = true;
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('📍 Diagnosis: Cannot connect to server');
        errorMessage =
          'Cannot connect to server. Check your internet connection.';
        canRetry = true;
      } else if (
        error.message === 'Network Error' ||
        error.code === 'ERR_NETWORK'
      ) {
        console.log('📍 Diagnosis: Network connection failed');
        errorMessage =
          'Network connection failed. Check internet and try again.';
        canRetry = true;
      } else if (error.response?.status === 401) {
        console.log(
          '📍 Diagnosis: Unauthorized - Session expired or invalid token',
        );
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.status === 403) {
        console.log('📍 Diagnosis: Forbidden - Permission denied');
        errorMessage = 'Permission denied. You cannot update this profile.';
      } else if (error.response?.status === 404) {
        console.log('📍 Diagnosis: Not Found - API endpoint incorrect');
        errorMessage = 'Profile endpoint not found. Check API configuration.';
      } else if (error.response?.status === 500) {
        console.log('📍 Diagnosis: Server error');
        errorMessage = 'Server error. Please try again later.';
        canRetry = true;
      } else if (error.response?.data?.message) {
        console.log('📍 Diagnosis: Server returned error message');
        errorMessage = error.response.data.message;
      } else {
        console.log('📍 Diagnosis: Unknown error -', error.message);
        errorMessage = error.message || 'Unknown error occurred';
      }

      console.log('💬 [ERROR MESSAGE SHOWN]:', errorMessage);
      console.log('🔄 [CAN RETRY]:', canRetry);
      console.log('🔍 [ERROR CLASSIFICATION END]\n');

      const alertButtons = [
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ];

      // Allow retry if network error and haven't tried too many times
      if (canRetry && retryCount < 2) {
        alertButtons.unshift({
          text: 'Retry',
          onPress: () => {
            setTimeout(() => saveProfile(retryCount + 1), 1000);
          },
        });
      } else if (canRetry) {
        alertButtons.unshift({
          text: 'Try Again',
          onPress: () => saveProfile(0),
        });
      }

      Alert.alert('Update Failed', errorMessage, alertButtons);
    } finally {
      setSaving(false);
    }
  };
 const deleteProfile = async () => {
  Alert.alert(
    'Request For Profile Deletion',
    'Do you want to delete your account?',
    [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          Alert.alert(
            'Warning',
            'This action is not reversible. Are you sure?',
            [
              {
                text: 'No',
                style: 'cancel',
              },
              {
                text: 'Yes',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const token =
                      await AsyncStorage.getItem('accessToken');

                    await axios.put(
                      `${BASE_URL}member/delete/${userId}`,
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      },
                    );

                    Alert.alert(
                      'Profile Deleted',
                      'Your profile deletion request has been submitted successfully.',
                    );

                    await AsyncStorage.clear();

                    // navigation.replace('Login');
                  } catch (error) {
                    console.log(error.response?.data);
                    Alert.alert(
                      'Error',
                      getFriendlyErrorMessage(error, 'Failed to delete profile'),
                    );
                  }
                },
              },
            ],
          );
        },
      },
    ],
  );
};

  const SectionCard = ({
    title,
    subtitle,
    sectionKey,
    children,
    percentage,
  }) => {
    const isOpen = expandedSection === sectionKey;

    const guardedToggleSection = useGuardedAction(
      () => setExpandedSection(isOpen ? null : sectionKey),
      300,
    );

    return (
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={guardedToggleSection}
        >
          <View style={styles.sectionTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{title}</Text>

              <Text style={styles.sectionSub}>{subtitle}</Text>
            </View>

            <View style={styles.sectionRight}>
              <Text style={styles.percentText}>{percentage}%</Text>

              <View style={styles.editButton}>
                <Text style={styles.editText}>{isOpen ? 'Close' : 'Edit'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {isOpen && <View style={styles.expandedContainer}>{children}</View>}
      </View>
    );
  };

  const renderInput = (label, key, multiline = false) => {
    return (
      <TextInputField
        key={key}
        label={label}
        defaultValue={profileForm[key] || ''}
        multiline={multiline}
        onChangeText={text => handleInputChange(key, text)}
        inputRef={ref => {
          if (ref) {
            inputRefs.current[key] = ref;
          }
        }}
      />
    );
  };

  const guardedPickImage = useGuardedAction(pickImage);
  const guardedPickCoverImage = useGuardedAction(pickCoverImage);
  const guardedClearProfileImage = useGuardedAction(() =>
    setProfileImage(null),
  );
  const guardedClearCoverImage = useGuardedAction(() => setCoverImage(null));
  const guardedSaveProfile = useGuardedAction(saveProfile);
  const guardedDeleteProfile = useGuardedAction(deleteProfile);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {loadingProfile && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#17310F" />
            <Text style={styles.loadingBannerText}>Loading profile...</Text>
            {showSlowNotice && (
              <Text style={styles.slowNoticeText}>
                Still working on it — this is taking longer than expected.
                Please check your connection.
              </Text>
            )}
          </View>
        )}

        {/* COVER IMAGE */}

        {coverImage && (
          <TouchableOpacity
            onPress={guardedClearCoverImage}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: 'red',
              width: 32,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.coverImageWrapper}
          onPress={guardedPickCoverImage}
        >
          <Image
            source={
              coverImage
                ? { uri: coverImage }
                : {
                    uri: 'https://via.placeholder.com/500x300/1a472a/1a472a?text=Cover+Image',
                  }
            }
            style={styles.coverImage}
          />

          <View style={styles.coverOverlay} />

          <View style={styles.coverEditBadge}>
            <Text style={styles.coverEditIcon}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* HEADER WITH PROFILE IMAGE */}

        <View style={styles.heroSection}>
          {/* PROFILE INFO CARD */}
          <View style={styles.profileInfoCard}>
            {/* LEFT SIDE - PROFILE IMAGE */}

            {profileImage && (
              <TouchableOpacity
                onPress={guardedClearProfileImage}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: 'red',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 999,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.profileImageContainer}
              onPress={guardedPickImage}
            >
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require('../Images/user.png')
                }
                style={styles.profileImageLarge}
              />

              <View style={styles.cameraBadge}>
                <Text style={styles.cameraText}>✎</Text>
              </View>
            </TouchableOpacity>

            {/* RIGHT SIDE - CONTACT INFO */}
            <View style={styles.profileDetailsContainer}>
              <Text style={styles.profileNameMain}>
                {profileForm.name || 'Business Member'}
              </Text>

              <Text style={styles.profileRoleMain}>
                {profileForm.companyName || 'Company Name'}
              </Text>

              <View style={styles.contactInfoSection}>
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>
                    {profileForm.email || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Mobile</Text>
                  <Text style={styles.contactValue}>
                    {profileForm.mobile || 'Not provided'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* PROGRESS */}

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressTitle}>Profile Strength</Text>

                <Text style={styles.progressSub}>
                  Complete your profile to build stronger business connections
                </Text>
              </View>

              <Text style={styles.progressPercent}>{completion}%</Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${completion}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.profileTip}>
              🚀 Add expertise, achievements and networking goals to increase
              visibility
            </Text>
          </View>
        </View>

        {/* BUSINESS IDENTITY */}

        <View style={{ paddingHorizontal: 4 }}>
          <SectionCard
            title="Business Identity"
            subtitle="Business category, tagline and industry"
            sectionKey="identity"
            percentage={calculateSectionCompletion('identity')}
          >
            {renderInput('Full Name', 'name')}

            {renderInput('Email Address', 'email')}

            {renderInput('Mobile Number', 'mobile')}

            {renderInput('Company Name', 'companyName')}

            {renderInput('Business Tagline', 'tagline')}

            {renderInput('Business Category', 'businessCategory')}

            {renderInput('Industry / Subcategory', 'industry')}

            {renderInput('Website', 'website')}
          </SectionCard>
        </View>

        {/* BUSINESS STRENGTH */}

        <View style={{ paddingHorizontal: 4 }}>
          <SectionCard
            title="Business Strength"
            subtitle="Show what makes your business unique"
            sectionKey="strength"
            percentage={calculateSectionCompletion('strength')}
          >
            {renderInput(
              'What makes your business different?',
              'uniqueBusiness',
              true,
            )}

            {renderInput('Professional Values', 'professionalValues', true)}

            {renderInput('Business Expertise', 'expertise', true)}

            {renderInput('Achievements', 'achievements', true)}
          </SectionCard>
        </View>

        {/* NETWORKING */}

        <View style={{ paddingHorizontal: 4 }}>
          <SectionCard
            title="Networking Goals"
            subtitle="Partnerships, investors and expansion"
            sectionKey="networking"
            percentage={calculateSectionCompletion('networking')}
          >
            {renderInput('Why should people connect?', 'connectReason', true)}

            {renderInput('Collaboration Goals', 'collaborationType', true)}

            {renderInput('Growth Opportunities', 'growthOpportunities', true)}

            {renderInput('Preferred Cities', 'preferredCities')}
          </SectionCard>
        </View>

        {/* PRODUCTS */}

        <View style={{ paddingHorizontal: 4 }}>
          <SectionCard
            title="Products & Services"
            subtitle="Showcase your offerings"
            sectionKey="products"
            percentage={calculateSectionCompletion('products')}
          >
            {renderInput('Products & Services', 'products', true)}

            {renderInput('Price Range', 'priceRange')}

            {renderInput('Minimum Order Quantity', 'minimumOrder')}

            {renderInput('Areas You Serve', 'serviceAreas')}
          </SectionCard>
        </View>

        {/* SOCIAL */}

        <View style={{ paddingHorizontal: 4 }}>
          <SectionCard
            title="Social Presence"
            subtitle="Increase trust and visibility"
            sectionKey="social"
            percentage={calculateSectionCompletion('social')}
          >
            {renderInput('Instagram Profile', 'instagram')}

            {renderInput('LinkedIn Profile', 'linkedin')}
          </SectionCard>
        </View>

        {/* SAVE */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.saveButton}
          onPress={guardedSaveProfile}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Updating Profile...' : 'Save Professional Profile'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={guardedDeleteProfile}>
          <Text style={styles.deleteButtonText}>Delete Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  loadingBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
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

  coverImageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },

  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  coverEditBadge: {
    position: 'absolute',
    top: 76,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 22,
  },

  coverEditIcon: {
    fontSize: 22,
    color: '#17310F',
  },

  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 0,
    marginTop: -70,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 10,
    overflow: 'visible',
    paddingHorizontal: 16,
  },

  profileInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 8,
  },

  profileImageContainer: {
    position: 'relative',
    marginRight: 18,
    marginTop: -70,
  },

  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },

  profileDetailsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  profileNameMain: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A0E27',
    marginBottom: 2,
    letterSpacing: -0.3,
  },

  profileRoleMain: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17310F',
    marginBottom: 12,
  },

  contactInfoSection: {
    gap: 10,
  },

  contactItem: {
    marginBottom: 0,
  },

  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A0E27',
  },

  heroGlow1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: 'rgba(34,197,94,0.12)',
    right: -100,
    top: -100,
  },

  heroGlow2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    left: -60,
    bottom: -30,
  },

  screenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    alignSelf: 'center',
    marginTop: Platform.OS === 'android' ? 18 : 6,
    letterSpacing: 1,
  },

  imageWrapper: {
    display: 'none',
  },

  profileImage: {
    display: 'none',
  },

  profileName: {
    display: 'none',
  },

  profileRole: {
    display: 'none',
  },

  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#17310F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },

  cameraText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  progressCard: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  progressTitle: {
    color: '#0A0E27',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },

  progressSub: {
    marginTop: 0,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  progressPercent: {
    color: '#17310F',
    fontSize: 32,
    fontWeight: '900',
    minWidth: 50,
    textAlign: 'right',
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 14,
  },

  progressBarFill: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#17310F',
  },

  profileTip: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#0A0E27',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    flex: 1,
  },

  sectionSub: {
    marginTop: 0,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  sectionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },

  percentText: {
    color: '#17310F',
    fontSize: 20,
    fontWeight: '900',
  },

  editButton: {
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },

  editText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  expandedContainer: {
    marginTop: 22,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  label: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },

  saveButton: {
    height: 56,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#17310F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17310F',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  deleteButton: {
    height: 56,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

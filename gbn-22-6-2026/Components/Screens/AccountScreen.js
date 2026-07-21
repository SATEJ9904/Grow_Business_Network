import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import PreviewScreen from './PreviewScreen';
import { BASE_URL } from '@env';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const LOCAL_BACKEND_HOST = Platform.select({
  android: 'http://192.168.14.149',
  ios: 'http://192.168.14.149',
  default: 'http://192.168.14.149',
});

// const BASE_URL = `${LOCAL_BACKEND_HOST}:5001`;
const PYTHON_URL = `${LOCAL_BACKEND_HOST}:5002`;

const AccountScreen = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [logo, setLogo] = useState(null);
  const [newServiceItem, setNewServiceItem] = useState({
    title: '',
    description: '',
    image: null,
  });
  const [contactItems, setContactItems] = useState([]);
  const [websiteMode, setWebsiteMode] = useState('service');

  const [productItems, setProductItems] = useState([]);
  const [newProductItem, setNewProductItem] = useState({
    title: '',

    price: '',

    description: '',

    image: null,
  });

  const [testimonialItems, setTestimonialItems] = useState([]);

  const [faqItems, setFaqItems] = useState([]);

  const [galleryItems, setGalleryItems] = useState([]);
  const [newContactItem, setNewContactItem] = useState({
    email: '',
    phone: '',
    address: '',
  });
  const [editWebsiteForm, setEditWebsiteForm] = useState({
    company: '',

    services: [],

    about: '',

    contactEmail: '',

    contactPhone: '',

    contactAddress: '',

    theme: 'Modern',

    heroTitle: '',

    heroHighlight: '',

    heroSubtitle: '',

    heroDescription: '',

    primaryColor: '#7c5cff',

    secondaryColor: '#06b6d4',

    websiteMode: 'service', // service, product, both
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState(null);
  const [websiteHtml, setWebsiteHtml] = useState('');
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const showSlowNotice = useDelayedNotice(loading, 8000);
  const THEME_OPTIONS = ['Modern', 'Dark', 'Faint', 'Minimal', 'Card', 'Hero'];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
        }
      } catch (err) {
        console.log('AccountScreen loadUser error', err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const loadAccountData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCurrentUser(), fetchMyWebsite()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAccountData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getImageUrl = path => {
    if (!path) return null;
    return `${BASE_URL}/${path.replace(/\\/g, '/')}`;
  };

  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const res = await axios.get(`${BASE_URL}/api/member/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data.data;
      setCurrentUser(user);
      setProfileForm({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        companyName: user.companyName,
      });
    } catch (err) {
      console.log(
        'AccountScreen fetchCurrentUser error',
        err?.response?.data || err.message,
      );
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    setEditWebsiteForm(prev => ({
      ...prev,
      company: prev.company || currentUser.companyName || '',
      contactEmail: prev.contactEmail || currentUser.email || '',
      contactPhone: prev.contactPhone || currentUser.mobile || '',
    }));
  }, [currentUser]);

  useEffect(() => {
    if (isEditingWebsite && currentUser) {
      // Pre-populate contact info from database when editing website
      setNewContactItem({
        email: currentUser.email || '',
        phone: currentUser.mobile || '',
        address: '',
      });
      // Set company logo from current user if available
      if (currentUser.companyLogo && !logo) {
        setLogo({
          uri: getImageUrl(currentUser.companyLogo),
          type: 'image/jpeg',
          name: 'company-logo.jpg',
        });
      }
    }
  }, [isEditingWebsite]);

  const fetchMyWebsite = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/website/website/${userId}`);
      const site = res.data.website;
      if (site) {
        let services = [];
        if (site.serviceItems) {
          try {
            let parsed = site.serviceItems;
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            if (Array.isArray(parsed)) {
              services = parsed.map((item, index) => ({
                title: item.title || '',
                description: item.description || '',
                image: null,
                imageUrl:
                  item.imageUrl ||
                  item.image_url ||
                  (site.serviceImageUrls && site.serviceImageUrls[index]) ||
                  '',
              }));
            }
          } catch (_) {
            services = [];
          }
        }
        if (!services.length && site.services) {
          services = site.services.split(',').map((service, index) => ({
            title: service.trim(),
            description: '',
            image: null,
            imageUrl:
              (site.serviceImageUrls && site.serviceImageUrls[index]) || '',
          }));
        }

        let contacts = [];
        if (site.contactItems) {
          try {
            const parsed = JSON.parse(site.contactItems);
            if (Array.isArray(parsed)) {
              contacts = parsed.map(item => ({
                email: item.email || '',
                phone: item.phone || '',
                address: item.address || '',
              }));
            }
          } catch (_) {
            contacts = [];
          }
        }
        if (
          !contacts.length &&
          (site.contactEmail || site.contactPhone || site.contactAddress)
        ) {
          contacts = [
            {
              email: site.contactEmail || '',
              phone: site.contactPhone || '',
              address: site.contactAddress || '',
            },
          ];
        }

        setContactItems(contacts);
        setEditWebsiteForm({
          company: site.company || '',
          services,
          about: site.about || '',
          contactEmail: site.contactEmail || '',
          contactPhone: site.contactPhone || '',
          contactAddress: site.contactAddress || '',
          theme: site.theme || 'Modern',
        });
        setWebsiteHtml(site.html || '');
        setWebsiteSlug(site.slug || '');
      }
    } catch (err) {
      console.log('AccountScreen fetchMyWebsite error', err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    }
  };

  const updateMyProfile = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.put(`${BASE_URL}/api/member/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditingProfile(false);
      await fetchCurrentUser();
    } catch (err) {
      console.log(
        'AccountScreen updateMyProfile error',
        err?.response?.data || err.message,
      );
      Alert.alert('Error', getFriendlyErrorMessage(err, 'Failed to update profile'));
    }
    setUpdating(false);
  };

  const updateWebsite = async () => {
    if (savingWebsite) return;

    setSavingWebsite(true);

    try {
      const payload = {
        userId,

        company: editWebsiteForm.company,

        websiteMode,

        theme: editWebsiteForm.theme || 'Modern',

        // HERO

        heroTitle: editWebsiteForm.heroTitle,

        heroHighlight: editWebsiteForm.heroHighlight,

        heroSubtitle: editWebsiteForm.heroSubtitle,

        heroDescription: editWebsiteForm.heroDescription,

        // ABOUT

        about: editWebsiteForm.about,

        // COLORS

        primaryColor: editWebsiteForm.primaryColor,

        secondaryColor: editWebsiteForm.secondaryColor,

        // SERVICES

        serviceItems: editWebsiteForm.services || [],

        // PRODUCTS

        productItems: productItems || [],

        // CONTACT

        contactItems: [
          {
            email: newContactItem.email,

            phone: newContactItem.phone,

            address: newContactItem.address,
          },
        ],

        // TESTIMONIALS

        testimonialItems: testimonialItems || [],

        // FAQ

        faqItems: faqItems || [],

        // GALLERY

        galleryItems: galleryItems || [],

        footerInfo: `${newContactItem.email}
         ${newContactItem.phone}
         ${newContactItem.address}`,
      };

      console.log('🚀 WEBSITE PAYLOAD:', payload);

      const res = await axios.post(
        `${BASE_URL}/api/website/save-website`,

        payload,
      );

      console.log('✅ WEBSITE SAVED:', res.data);

      if (res.data.website?.html) {
        setWebsiteHtml(res.data.website.html);
      }

      await fetchMyWebsite();

      Alert.alert('Success', 'Website Updated Successfully');

      setIsEditingWebsite(false);
    } catch (err) {
      console.log('❌ WEBSITE ERROR:', err.response?.data || err.message);

      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setSavingWebsite(false);
    }
  };

  const getPublicWebsiteUrl = slug =>
    `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;

  const shareWebsite = () => {
    if (!websiteSlug) {
      Alert.alert('Please save your website first');
      return;
    }

    const url = getPublicWebsiteUrl(websiteSlug);
    Share.share({ message: `Check my website: ${url}` });
  };

  const deactivateAccount = async () => {
    Alert.alert(
      'Deactivate Account',
      'This will sign you out and deactivate your account permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              await axios.put(
                `${BASE_URL}/api/member/delete/${userId}`,
                {},
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (err) {
              console.log(
                'AccountScreen deactivateAccount error',
                err?.response?.data || err.message,
              );
              Alert.alert(
                'Error',
                getFriendlyErrorMessage(err, 'Failed to deactivate account'),
              );
            }
          },
        },
      ],
    );
  };
  const pickLogo = async () => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (response.didCancel) return;
      if (response.errorCode) return;

      const asset = response.assets?.[0];
      if (!asset) return;

      setLogo({
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'logo.jpg',
      });
    });
  };

  const pickServiceImageForNew = async () => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (response.didCancel) return;
      if (response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset) return;

      setNewServiceItem(prev => ({
        ...prev,
        image: {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'service.jpg',
        },
      }));
    });
  };

  const pickServiceImageForItem = async index => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (response.didCancel) return;
      if (response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset) return;

      setEditWebsiteForm(prev => {
        const updatedServices = [...prev.services];
        updatedServices[index] = {
          ...updatedServices[index],
          image: {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || `service_${index}.jpg`,
          },
          imageUrl: '',
        };
        return { ...prev, services: updatedServices };
      });
    });
  };

  const addService = () => {
    if (!newServiceItem.title.trim()) return;

    setEditWebsiteForm(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          title: newServiceItem.title.trim(),
          description: newServiceItem.description.trim(),
          image: newServiceItem.image,
          imageUrl: newServiceItem.imageUrl || '',
        },
      ],
    }));

    setNewServiceItem({ title: '', description: '', image: null });
  };

  const addContactItem = contact => {
    if (!contact.email && !contact.phone && !contact.address) {
      return;
    }
    setContactItems(prev => [...prev, contact]);
  };

  const removeService = index => {
    const updated = [...editWebsiteForm.services];
    updated.splice(index, 1);

    setEditWebsiteForm(prev => ({
      ...prev,
      services: updated,
    }));
  };
  const addProduct = () => {
    if (!newProductItem.title || !newProductItem.price) {
      Alert.alert('Error', 'Please enter product details');

      return;
    }

    const updatedProducts = [
      ...productItems,

      {
        ...newProductItem,
        id: Date.now().toString(),
      },
    ];

    setProductItems(updatedProducts);

    setNewProductItem({
      title: '',

      price: '',

      description: '',

      image: null,
    });
  };
  const pickProductImage = async () => {
    launchImageLibrary(
      { mediaType: 'photo' },

      response => {
        if (response.didCancel) return;

        if (response.errorCode) return;

        const asset = response.assets?.[0];

        if (!asset) return;

        setNewProductItem(prev => ({
          ...prev,

          image: {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || 'product.jpg',
          },
        }));
      },
    );
  };

  const guardedGoBack = useGuardedAction(() => navigation.goBack());
  const guardedOpenEditProfile = useGuardedAction(() =>
    setIsEditingProfile(true),
  );
  const guardedOpenEditWebsite = useGuardedAction(() =>
    setIsEditingWebsite(true),
  );
  const guardedCancelEditProfile = useGuardedAction(() =>
    setIsEditingProfile(false),
  );
  const guardedCancelEditWebsite = useGuardedAction(() =>
    setIsEditingWebsite(false),
  );
  const guardedUpdateMyProfile = useGuardedAction(updateMyProfile);
  const guardedUpdateWebsite = useGuardedAction(updateWebsite);
  const guardedShareWebsite = useGuardedAction(shareWebsite);
  const guardedDeactivateAccount = useGuardedAction(deactivateAccount);
  const guardedPickLogo = useGuardedAction(pickLogo);
  const guardedPickServiceImageForNew = useGuardedAction(
    pickServiceImageForNew,
  );
  const guardedPickProductImage = useGuardedAction(pickProductImage);
  const guardedAddService = useGuardedAction(addService);
  const guardedAddProduct = useGuardedAction(addProduct);
  const guardedRemoveService = useGuardedAction(index => removeService(index));
  const guardedSetWebsiteMode = useGuardedAction(mode =>
    setWebsiteMode(mode),
    250,
  );
  const guardedPreviewWebsite = useGuardedAction(() =>
    setSelectedHtml(websiteHtml),
  );

  if (selectedHtml) {
    return (
      <PreviewScreen
        html={selectedHtml}
        onClose={() => setSelectedHtml(null)}
        company={editWebsiteForm.company}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={guardedGoBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#1f2937" />
            <Text style={styles.loadingBannerText}>
              Loading your account...
            </Text>
            {showSlowNotice && (
              <Text style={styles.slowNoticeText}>
                Still working on it — this is taking longer than expected.
                Please check your connection.
              </Text>
            )}
          </View>
        )}
        <View style={styles.heroCard}>
          <View style={styles.avatarLarge}>
            {currentUser?.companyLogo ? (
              <Image
                source={{ uri: getImageUrl(currentUser.companyLogo) }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {currentUser?.name?.charAt(0) || 'G'}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>
            {currentUser?.name || 'Guest User'}
          </Text>
          <Text style={styles.userRole}>
            {currentUser?.companyName || 'Business Owner'}
          </Text>
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.sectionLabel}>Account Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {currentUser?.email || 'Not available'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {currentUser?.mobile || 'Not available'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {currentUser?.createdAt
                ? new Date(currentUser.createdAt).toLocaleDateString()
                : '—'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={guardedOpenEditProfile}
          >
            <Text style={styles.primaryText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={guardedOpenEditWebsite}
          >
            <Text style={styles.secondaryText}>Edit Website</Text>
          </TouchableOpacity>
        </View>

        {isEditingProfile && (
          <View style={styles.editCard}>
            <Text style={styles.sectionHeader}>Profile Update</Text>
            <TextInput
              style={styles.input}
              value={profileForm.name}
              onChangeText={text =>
                setProfileForm({ ...profileForm, name: text })
              }
              placeholder="Name"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.input}
              value={profileForm.email}
              onChangeText={text =>
                setProfileForm({ ...profileForm, email: text })
              }
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.input}
              value={profileForm.mobile}
              onChangeText={text =>
                setProfileForm({ ...profileForm, mobile: text })
              }
              placeholder="Mobile"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.input}
              value={profileForm.companyName}
              onChangeText={text =>
                setProfileForm({ ...profileForm, companyName: text })
              }
              placeholder="Company"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={guardedUpdateMyProfile}
                disabled={updating}
              >
                <Text style={styles.primaryText}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAction}
                onPress={guardedCancelEditProfile}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.websiteCard}>
          <View style={styles.websiteHeader}>
            <View>
              <Text style={styles.sectionLabel}>Website Builder</Text>

              <Text style={styles.websiteSubtitle}>
                {editWebsiteForm.company ? (
                  <Text style={styles.websiteSubtitleText}>
                    Website for{' '}
                    <Text style={styles.companyHighlight}>
                      {editWebsiteForm.company}
                    </Text>
                  </Text>
                ) : (
                  'Create Your Professional Website'
                )}
              </Text>
            </View>

            {websiteHtml ? (
              <TouchableOpacity
                style={styles.viewLink}
                onPress={guardedPreviewWebsite}
              >
                <Text style={styles.viewLinkText}>Preview</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isEditingWebsite ? (
            <>
              {/* ================= WEBSITE TYPE ================= */}

              <Text style={styles.sectionHeader}>Website Type</Text>

              <View style={styles.websiteTypeWrapper}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.websiteTypeCard,

                    websiteMode === 'service' && styles.activeWebsiteType,
                  ]}
                  onPress={() => guardedSetWebsiteMode('service')}
                >
                  <View style={styles.websiteTypeIconBox}>
                    <Text style={styles.websiteTypeIcon}>🛠️</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.websiteTypeTitle}>Service Website</Text>

                    <Text style={styles.websiteTypeDesc}>
                      Agencies, Gyms, Hospitals, Salons, Consultants
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.websiteTypeCard,

                    websiteMode === 'product' && styles.activeWebsiteType,
                  ]}
                  onPress={() => guardedSetWebsiteMode('product')}
                >
                  <View style={styles.websiteTypeIconBox}>
                    <Text style={styles.websiteTypeIcon}>🛍️</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.websiteTypeTitle}>Product Website</Text>

                    <Text style={styles.websiteTypeDesc}>
                      Ecommerce, Bakery, Clothing, Electronics
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.websiteTypeCard,

                    websiteMode === 'both' && styles.activeWebsiteType,
                  ]}
                  onPress={() => guardedSetWebsiteMode('both')}
                >
                  <View style={styles.websiteTypeIconBox}>
                    <Text style={styles.websiteTypeIcon}>🚀</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.websiteTypeTitle}>Hybrid Website</Text>

                    <Text style={styles.websiteTypeDesc}>
                      Products + Services Combined Website
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ================= COMPANY ================= */}

              <Text style={styles.sectionHeader}>Business Information</Text>

              <TextInput
                style={styles.input}
                placeholder="Company Name"
                value={editWebsiteForm.company}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    company: text,
                  })
                }
                placeholderTextColor="#9ca3af"
              />

              {/* ================= HERO ================= */}

              <Text style={styles.sectionHeader}>Hero Section</Text>

              <TextInput
                style={styles.input}
                placeholder="Hero Title"
                value={editWebsiteForm.heroTitle}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    heroTitle: text,
                  })
                }
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={styles.input}
                placeholder="Hero Highlight"
                value={editWebsiteForm.heroHighlight}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    heroHighlight: text,
                  })
                }
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Hero Description"
                multiline
                value={editWebsiteForm.heroDescription}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    heroDescription: text,
                  })
                }
                placeholderTextColor="#9ca3af"
              />

              {/* ================= LOGO ================= */}

              <Text style={styles.sectionHeader}>Company Logo</Text>

              <TouchableOpacity style={styles.logoPicker} onPress={guardedPickLogo}>
                {logo ? (
                  <Image
                    source={{ uri: logo.uri }}
                    style={styles.logoPreview}
                  />
                ) : currentUser?.companyLogo ? (
                  <Image
                    source={{
                      uri: getImageUrl(currentUser.companyLogo),
                    }}
                    style={styles.logoPreview}
                  />
                ) : (
                  <Text style={styles.logoPickerText}>Select Logo</Text>
                )}
              </TouchableOpacity>

              {/* ================= SERVICES ================= */}

              {(websiteMode === 'service' || websiteMode === 'both') && (
                <>
                  <Text style={styles.sectionHeader}>Services</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Service Title"
                    value={newServiceItem.title}
                    onChangeText={text =>
                      setNewServiceItem(prev => ({
                        ...prev,
                        title: text,
                      }))
                    }
                    placeholderTextColor="#9ca3af"
                  />

                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Service Description"
                    value={newServiceItem.description}
                    onChangeText={text =>
                      setNewServiceItem(prev => ({
                        ...prev,
                        description: text,
                      }))
                    }
                    multiline
                    placeholderTextColor="#9ca3af"
                  />

                  <TouchableOpacity
                    style={styles.logoPicker}
                    onPress={guardedPickServiceImageForNew}
                  >
                    {newServiceItem.image ? (
                      <Image
                        source={{
                          uri: newServiceItem.image.uri,
                        }}
                        style={styles.logoPreview}
                      />
                    ) : (
                      <Text style={styles.logoPickerText}>
                        Select Service Image
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addServiceButton}
                    onPress={guardedAddService}
                  >
                    <Text style={styles.addServiceText}>Add Service</Text>
                  </TouchableOpacity>
                </>
              )}
              {editWebsiteForm.services.map((item, index) => (
                <View key={index} style={styles.serviceCard}>
                  {item.image && (
                    <Image
                      source={{ uri: item.image.uri }}
                      style={styles.serviceItemImage}
                    />
                  )}

                  <Text style={styles.serviceItemTitle}>{item.title}</Text>

                  <Text style={styles.serviceItemDescription}>
                    {item.description}
                  </Text>

                  <TouchableOpacity onPress={() => guardedRemoveService(index)}>
                    <Text style={styles.removeServiceText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* ================= PRODUCTS ================= */}

              {(websiteMode === 'product' || websiteMode === 'both') && (
                <>
                  <Text style={styles.sectionHeader}>Products</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Product Name"
                    value={newProductItem.title}
                    onChangeText={text =>
                      setNewProductItem(prev => ({
                        ...prev,
                        title: text,
                      }))
                    }
                    placeholderTextColor="#9ca3af"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    keyboardType="numeric"
                    value={newProductItem.price}
                    onChangeText={text =>
                      setNewProductItem(prev => ({
                        ...prev,
                        price: text,
                      }))
                    }
                    placeholderTextColor="#9ca3af"
                  />

                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Product Description"
                    multiline
                    value={newProductItem.description}
                    onChangeText={text =>
                      setNewProductItem(prev => ({
                        ...prev,
                        description: text,
                      }))
                    }
                    placeholderTextColor="#9ca3af"
                  />

                  <TouchableOpacity
                    style={styles.logoPicker}
                    onPress={guardedPickProductImage}
                  >
                    {newProductItem.image ? (
                      <Image
                        source={{
                          uri: newProductItem.image.uri,
                        }}
                        style={styles.logoPreview}
                      />
                    ) : (
                      <Text style={styles.logoPickerText}>
                        Select Product Image
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addServiceButton}
                    onPress={guardedAddProduct}
                  >
                    <Text style={styles.addServiceText}>Add Product</Text>
                  </TouchableOpacity>

                  {productItems.map(item => (
                    <View key={item.id} style={styles.serviceCard}>
                      {item.image && (
                        <Image
                          source={{ uri: item.image.uri }}
                          style={styles.serviceItemImage}
                        />
                      )}

                      <Text style={styles.serviceItemTitle}>{item.title}</Text>

                      <Text
                        style={{
                          color: '#7c5cff',
                          fontWeight: '800',
                          marginTop: 6,
                          marginBottom: 6,
                          fontSize: 18,
                        }}
                      >
                        ₹{item.price}
                      </Text>

                      <Text style={styles.serviceItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.sectionHeader}>About Business</Text>

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="About Business"
                value={editWebsiteForm.about}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    about: text,
                  })
                }
                multiline
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.sectionHeader}>Contact Information</Text>

              <TextInput
                style={styles.input}
                placeholder="Business Email"
                value={newContactItem.email}
                onChangeText={text =>
                  setNewContactItem(prev => ({
                    ...prev,
                    email: text,
                  }))
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Business Phone"
                value={newContactItem.phone}
                onChangeText={text =>
                  setNewContactItem(prev => ({
                    ...prev,
                    phone: text,
                  }))
                }
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Business Address"
                value={newContactItem.address}
                onChangeText={text =>
                  setNewContactItem(prev => ({
                    ...prev,
                    address: text,
                  }))
                }
                multiline
              />

              {/* ================= THEME & COLORS ================= */}

              <Text style={styles.sectionHeader}>Theme & Colors</Text>

              {/* <Text style={styles.subHeader}>Website Mode</Text>
              <View style={styles.themeSelector}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    editWebsiteForm.websiteMode === 'service' &&
                      styles.themeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditWebsiteForm({
                      ...editWebsiteForm,
                      websiteMode: 'service',
                    })
                  }
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      editWebsiteForm.websiteMode === 'service' &&
                        styles.themeOptionTextSelected,
                    ]}
                  >
                    Service
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    editWebsiteForm.websiteMode === 'product' &&
                      styles.themeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditWebsiteForm({
                      ...editWebsiteForm,
                      websiteMode: 'product',
                    })
                  }
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      editWebsiteForm.websiteMode === 'product' &&
                        styles.themeOptionTextSelected,
                    ]}
                  >
                    Product
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    editWebsiteForm.websiteMode === 'both' &&
                      styles.themeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditWebsiteForm({
                      ...editWebsiteForm,
                      websiteMode: 'both',
                    })
                  }
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      editWebsiteForm.websiteMode === 'both' &&
                        styles.themeOptionTextSelected,
                    ]}
                  >
                    Both
                  </Text>
                </TouchableOpacity>
              </View> */}

              <Text style={styles.subHeader}>Website Theme</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editWebsiteForm.theme}
                  style={styles.picker}
                  onValueChange={itemValue =>
                    setEditWebsiteForm({
                      ...editWebsiteForm,
                      theme: itemValue,
                    })
                  }
                >
                  {THEME_OPTIONS.map(theme => (
                    <Picker.Item key={theme} label={theme} value={theme} />
                  ))}
                </Picker>
              </View>

              {/* <Text style={styles.subHeader}>Primary Color</Text>
              <TextInput
                style={styles.input}
                placeholder="Primary Color (e.g., #7c5cff)"
                value={editWebsiteForm.primaryColor}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    primaryColor: text,
                  })
                }
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.subHeader}>Secondary Color</Text>
              <TextInput
                style={styles.input}
                placeholder="Secondary Color (e.g., #06b6d4)"
                value={editWebsiteForm.secondaryColor}
                onChangeText={text =>
                  setEditWebsiteForm({
                    ...editWebsiteForm,
                    secondaryColor: text,
                  })
                }
                placeholderTextColor="#9ca3af"
              /> */}

              {/* ================= SAVE ================= */}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[
                    styles.primaryAction,
                    savingWebsite && styles.disabledAction,
                  ]}
                  onPress={guardedUpdateWebsite}
                  disabled={savingWebsite}
                >
                  {savingWebsite ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 10 }}
                      />

                      <Text style={styles.primaryText}>Saving...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryText}>Save Website</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelAction}
                  onPress={guardedCancelEditWebsite}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.websiteStatus}>
                {editWebsiteForm.company
                  ? 'Your website is ready to share.'
                  : 'Create a beautiful professional website.'}
              </Text>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={guardedShareWebsite}
                >
                  <Text style={styles.secondaryText}>Share Website</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={guardedOpenEditWebsite}
                >
                  <Text style={styles.primaryText}>Build Website</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.footerCard}>
          {/* <Text style={styles.warningTitle}>Danger Zone</Text> */}
          <Text style={styles.warningText}>
            Deactivating your account is permanent and cannot be undone.
          </Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={guardedDeactivateAccount}
          >
            <Text style={styles.dangerText}>Deactivate Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef4fb',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 70 : 76,
    paddingHorizontal: 24,
    paddingBottom: 18,
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    lineHeight: 18,
    color: '#111827',
  },
  screenTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginRight: 'auto',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
  heroCard: {
    backgroundColor: '#1f2937',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1f2937',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  userName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  userRole: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  infoPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  sectionLabel: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
  },
  infoLabel: {
    color: '#4b5563',
    fontSize: 14,
  },
  infoValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#1f2937',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
    color: '#111827',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '700',
  },
  disabledAction: {
    opacity: 0.65,
  },
  logoPicker: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoPickerText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '700',
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  serviceInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTextInput: {
    flex: 1,
  },
  addServiceButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addServiceText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contactField: {
    flex: 1,
    minHeight: 54,
  },
  smallActionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  contactButton: {
    alignSelf: 'flex-end',
    marginBottom: 0,
  },
  smallActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  serviceList: {
    marginBottom: 14,
  },
  serviceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  contactCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceItemImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    marginBottom: 12,
  },
  serviceItemContent: {
    paddingTop: 0,
  },
  serviceItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  serviceItemDescription: {
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  serviceItemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  changeImageText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  serviceItemText: {
    color: '#111827',
    flex: 1,
  },
  removeServiceText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  websiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  websiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  websiteSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  websiteSubtitleText: {
    color: '#6b7280',
    fontSize: 13,
  },
  companyHighlight: {
    color: '#0f172a',
    fontWeight: '800',
    backgroundColor: 'rgba(59,130,246,0.12)',
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  viewLink: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  viewLinkText: {
    color: '#0c4a6e',
    fontWeight: '700',
  },
  websiteStatus: {
    color: '#6b7280',
    marginBottom: 16,
  },
  footerCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
  },
  warningTitle: {
    color: '#991b1b',
    fontWeight: '800',
    marginBottom: 8,
    fontSize: 15,
  },
  warningText: {
    color: '#7f1d1d',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#b91c1c',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  dangerText: {
    color: '#fff',
    fontWeight: '800',
  },
  websiteTypeWrapper: {
    gap: 16,

    marginBottom: 24,
  },

  websiteTypeCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#f8fafc',

    borderRadius: 24,

    padding: 18,

    borderWidth: 1.5,

    borderColor: '#e2e8f0',

    shadowColor: '#000',

    shadowOpacity: 0.06,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 4,
  },

  activeWebsiteType: {
    backgroundColor: '#111827',

    borderColor: '#7c5cff',

    transform: [
      {
        scale: 1.02,
      },
    ],
  },

  websiteTypeIconBox: {
    width: 70,

    height: 70,

    borderRadius: 22,

    backgroundColor: '#ede9fe',

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 16,
  },

  websiteTypeIcon: {
    fontSize: 32,
  },

  websiteTypeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  activeWebsiteTitle: {
    color: '#ffffff',
  },

  activeWebsiteDesc: {
    color: '#cbd5e1',
  },

  websiteTypeDesc: {
    fontSize: 13,

    lineHeight: 20,

    color: '#64748b',
  },

  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
  },

  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  themeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    alignItems: 'center',
  },

  themeOptionSelected: {
    backgroundColor: '#7c5cff',
    borderColor: '#7c5cff',
  },

  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  themeOptionTextSelected: {
    color: '#ffffff',
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },

  picker: {
    height: 50,
    color: '#374151',
  },
});

export default AccountScreen;

import React, { useEffect, useState } from 'react';

import {
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';

import Video from 'react-native-video';

import AsyncStorage from '@react-native-async-storage/async-storage';

import axios from 'axios';

import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '@env';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const { width } = Dimensions.get('window');

// const LOCAL_BACKEND_HOST = Platform.select({
//   android: 'http://192.168.14.149',
//   ios: 'http://192.168.14.149',
//   default: 'http://192.168.14.149',
// });

const EditWebsiteScreen = () => {
  const navigation = useNavigation();

  const [userId, setUserId] = useState(null);

  const [savingWebsite, setSavingWebsite] = useState(false);

  const [websiteSlug, setWebsiteSlug] = useState('');

  const [websiteMode, setWebsiteMode] = useState('service');

  const [logo, setLogo] = useState(null);

  const [productItems, setProductItems] = useState([]);

  const [newServiceItem, setNewServiceItem] = useState({
    title: '',
    description: '',
    image: null,
  });

  const [newProductItem, setNewProductItem] = useState({
    title: '',
    price: '',
    description: '',
    image: null,
  });

  const [newContactItem, setNewContactItem] = useState({
    email: '',
    phone: '',
    address: '',
  });

  const [heroVideo, setHeroVideo] = useState(null);

  const [videoItems, setVideoItems] = useState([]);

  const [newVideoItem, setNewVideoItem] = useState({
    title: '',
    description: '',
    video: null,
    thumbnail: null,
  });

  const [editWebsiteForm, setEditWebsiteForm] = useState({
    company: '',
    services: [],
    about: '',
    theme: 'Modern',

    heroTitle: '',
    heroHighlight: '',
    heroDescription: '',
    heroVideo: null,

    // NEW FIELDS
    tagline: '',
    expertise: '',
    uniqueBusiness: '',
    industry: '',
    businessCategory: '',
    growthOpportunities: '',

    city: '',
  });

  const THEME_OPTIONS = ['Modern'];

  const [loadingWebsite, setLoadingWebsite] = useState(true);
  const showSlowNotice = useDelayedNotice(loadingWebsite, 8000);

  // ================= LOAD =================

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const id = await AsyncStorage.getItem('userId');

    if (id) {
      setUserId(id);

      fetchWebsite(id);
    } else {
      setLoadingWebsite(false);
    }
  };

  const getAssetUrl = uri => {
    if (!uri) return null;

    if (
      uri.startsWith('http://') ||
      uri.startsWith('https://') ||
      uri.startsWith('file://') ||
      uri.startsWith('content://')
    ) {
      return uri;
    }

    const host = BASE_URL.replace(/\/api\/?$/, '');
    return `${host}${uri.startsWith('/') ? '' : '/'}${uri}`;
  };

  const uploadMedia = async (asset, type) => {
    if (!asset?.uri) return null;

    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

    if (type === 'video') {
      console.log('VIDEO SIZE:', asset.fileSize / 1024 / 1024, 'MB');

      if (asset.fileSize > MAX_VIDEO_SIZE) {
        Alert.alert('Video Too Large', 'Maximum video size is 500 MB');
        return null;
      }
    }

    const formData = new FormData();

    formData.append('file', {
      uri:
        Platform.OS === 'android'
          ? asset.uri
          : asset.uri.replace('file://', ''),

      type: asset.type || 'video/mp4',

      name: asset.fileName || `video_${Date.now()}.mp4`,
    });

    try {
      const uploadUrl = `${BASE_URL}website/${
        type === 'video' ? 'upload-video' : 'upload-image'
      }`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },

        timeout: 1000 * 60 * 15,

        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data.url;
    } catch (error) {
      console.log('UPLOAD ERROR', error.response?.data || error.message);

      Alert.alert(
        'Upload Failed',
        getFriendlyErrorMessage(error, 'Upload failed. Please try again.'),
      );

      return null;
    }
  };
  const normalizeImage = image => {
    if (!image) return null;

    if (typeof image === 'string') {
      return { uri: getAssetUrl(image) };
    }

    if (typeof image === 'object' && image.uri) {
      return {
        uri: getAssetUrl(image.uri),
        type: image.type,
        name: image.name,
      };
    }

    return null;
  };

  const normalizeItems = items =>
    (items || []).map(item => ({
      ...item,
      image: normalizeImage(item?.image),
    }));

  const fetchWebsite = async id => {
    try {
      setLoadingWebsite(true);
      const res = await axios.get(`${BASE_URL}website/website/${id}`);

      console.log('WEBSITE API RESPONSE:', res.data);

      const site = res.data.website || {};
      const userData = res.data.user || {};

      console.log('USER DATA:', userData);
      console.log('COMPANY LOGO:', userData?.companyLogo);
      console.log('SITE LOGO:', site?.logo);

      const logoImage =
        normalizeImage(site?.logo) || normalizeImage(userData?.companyLogo);

      console.log('FINAL LOGO IMAGE:', logoImage);

      setLogo(logoImage);

      setEditWebsiteForm({
        company: site?.company || userData?.companyName || '',
        services: (site?.serviceItems || []).map(item => ({
          ...item,
          image: item.image
            ? {
                uri: getAssetUrl(
                  typeof item.image === 'object' ? item.image.uri : item.image,
                ),
              }
            : null,
        })),
        about: site?.about || userData?.aboutBusiness || '',
        theme: 'Modern',

        heroTitle: site?.heroTitle || userData?.uniqueBusiness || '',
        heroHighlight: site?.heroHighlight || userData?.tagline || '',
        heroDescription: site?.heroDescription || userData?.expertise || '',
        heroVideo: site?.heroVideo || null,

        tagline: site?.tagline || userData?.tagline || '',
        expertise: site?.expertise || userData?.expertise || '',
        uniqueBusiness: site?.uniqueBusiness || userData?.uniqueBusiness || '',
        industry: site?.industry || userData?.industry || '',
        businessCategory:
          site?.businessCategory || userData?.businessCategory || '',
        growthOpportunities:
          site?.growthOpportunities || userData?.growthOpportunities || '',

        city: site?.city || userData?.city || '',
      });

      if (site?.slug) {
        setWebsiteSlug(site.slug);
      }

      setProductItems(normalizeItems(site?.productItems || []));
      setVideoItems(site?.videoItems || []);

      if (site?.heroVideo) {
        setHeroVideo({ uri: site.heroVideo });
      }

      if (site?.contactItems?.length > 0) {
        setNewContactItem({
          email: site.contactItems[0]?.email || '',
          phone: site.contactItems[0]?.phone || '',
          address: site.contactItems[0]?.address || '',
        });
      }

      if (!site?.html || site.html.trim() === '') {
        console.log('⚠️ HTML missing, regenerating...');
        try {
          await axios.post(`${BASE_URL}website/regenerate-html/${id}`);
          console.log('✅ HTML regenerated');
        } catch (err) {
          console.log('⚠️ HTML regeneration failed', err);
        }
      }
    } catch (err) {
      console.log('FETCH WEBSITE ERROR:', err?.response?.data || err);
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setLoadingWebsite(false);
    }
  };

  // ================= PICKERS =================

  const pickLogo = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
      },
      async response => {
        if (response.didCancel) return;

        const asset = response.assets?.[0];

        if (!asset) return;

        const uploadedUrl = await uploadMedia(asset, 'image');

        console.log('================================');
        console.log('UPLOADED URL:', uploadedUrl);
        console.log('================================');
        if (!uploadedUrl) return;

        setLogo({
          uri: uploadedUrl,
          type: asset.type,
          name: asset.fileName || 'logo.jpg',
        });
      },
    );
  };

  const pickServiceImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
      },
      async response => {
        if (response.didCancel) return;

        const asset = response.assets?.[0];

        if (!asset) return;

        const uploadedUrl = await uploadMedia(asset, 'image');
        if (!uploadedUrl) return;

        setNewServiceItem(prev => ({
          ...prev,
          image: {
            uri: uploadedUrl,
            type: asset.type,
            name: asset.fileName || 'service.jpg',
          },
        }));
      },
    );
  };

  const pickProductImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
      },
      async response => {
        if (response.didCancel) return;

        const asset = response.assets?.[0];

        if (!asset) return;

        const uploadedUrl = await uploadMedia(asset, 'image');
        if (!uploadedUrl) return;

        setNewProductItem(prev => ({
          ...prev,
          image: {
            uri: uploadedUrl,
            type: asset.type,
            name: asset.fileName || 'product.jpg',
          },
        }));
      },
    );
  };

  const pickHeroVideo = async () => {
    launchImageLibrary(
      {
        mediaType: 'video',
      },
      async response => {
        console.log('VIDEO RESPONSE:', JSON.stringify(response, null, 2));

        if (response.didCancel) {
          console.log('USER CANCELLED VIDEO PICKER');
          return;
        }

        const asset = response.assets?.[0];

        if (!asset) {
          console.log('NO VIDEO ASSET FOUND');
          Alert.alert('Error', 'No video selected');
          return;
        }

        console.log('SELECTED VIDEO:', asset);

        Alert.alert('Info', 'Uploading video...');
        const uploadedUrl = await uploadMedia(asset, 'video');

        if (!uploadedUrl) return;

        // remove previous video
        setHeroVideo(null);

        setEditWebsiteForm(prev => ({
          ...prev,
          heroVideo: null,
        }));

        // add new video

        setHeroVideo({
          uri: uploadedUrl,
          type: asset.type,
          name: asset.fileName,
        });

        setEditWebsiteForm(prev => ({
          ...prev,
          heroVideo: uploadedUrl,
        }));

        Alert.alert('Success', 'Video Updated');

        console.log('HERO VIDEO SAVED:', uploadedUrl);

        Alert.alert('Success', 'Video uploaded successfully');
      },
    );
  };
  const pickVideo = async () => {
    launchImageLibrary(
      {
        mediaType: 'video',
        selectionLimit: 1,
        includeExtra: true,
        videoQuality: 'high',
      },
      async response => {
        if (response.didCancel) return;

        const asset = response.assets?.[0];

        if (!asset) return;

        const uploadedUrl = await uploadMedia(asset, 'video');

        console.log('VIDEO ITEM URL:', uploadedUrl);

        if (!uploadedUrl) return;

        setNewVideoItem(prev => ({
          ...prev,
          video: {
            uri: uploadedUrl,
            type: asset.type,
            name: asset.fileName || 'video.mp4',
          },
        }));
      },
    );
  };

  const pickVideoThumbnail = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
      },
      async response => {
        if (response.didCancel) return;

        const asset = response.assets?.[0];

        if (!asset) return;

        const uploadedUrl = await uploadMedia(asset, 'image');
        if (!uploadedUrl) return;

        setNewVideoItem(prev => ({
          ...prev,
          thumbnail: {
            uri: uploadedUrl,
            type: asset.type,
            name: asset.fileName || 'thumbnail.jpg',
          },
        }));
      },
    );
  };

  // ================= SERVICES =================

  const addService = () => {
    if (!newServiceItem.title) return;

    setEditWebsiteForm(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          title: newServiceItem.title,
          description: newServiceItem.description,
          image: newServiceItem.image,
        },
      ],
    }));

    setNewServiceItem({
      title: '',
      description: '',
      image: null,
    });
  };

  const removeService = index => {
    const updated = [...editWebsiteForm.services];

    updated.splice(index, 1);

    setEditWebsiteForm(prev => ({
      ...prev,
      services: updated,
    }));
  };

  // ================= VIDEOS =================

  const addVideo = () => {
    if (!newVideoItem.title || !newVideoItem.video) {
      Alert.alert('Error', 'Please select a video');
      return;
    }
    setVideoItems(prev => [
      ...prev,
      {
        ...newVideoItem,
        id: Date.now().toString(),
      },
    ]);

    setNewVideoItem({
      title: '',
      description: '',
      video: null,
      thumbnail: null,
    });
  };

  const removeVideo = index => {
    const updated = [...videoItems];
    updated.splice(index, 1);
    setVideoItems(updated);
  };

  // ================= PRODUCTS =================

  const addProduct = () => {
    if (!newProductItem.title || !newProductItem.price) {
      Alert.alert('Error', 'Enter Product Details');

      return;
    }

    setProductItems(prev => [
      ...prev,
      {
        ...newProductItem,
        id: Date.now().toString(),
      },
    ]);

    setNewProductItem({
      title: '',
      price: '',
      description: '',
      image: null,
    });
  };

  // ================= SAVE =================

  // ================= SAVE =================

  const updateWebsite = async () => {
    if (savingWebsite) return;

    setSavingWebsite(true);

    try {
      // ================= FORMAT VIDEOS =================
      const formattedVideoItems = videoItems.map(item => ({
        title: item.title || '',
        description: item.description || '',
        videoUrl: item.videoUrl || item.video?.uri || item.video || '',
        thumbnail: item.thumbnail?.uri || item.thumbnail || '',
        platform: item.platform || '',
      }));

      const formattedServices = editWebsiteForm.services.map(item => ({
        title: item.title,
        description: item.description,
        image: item.image?.uri || item.image || '',
      }));

      const payload = {
        // ================= BASIC =================

        userId,

        company: editWebsiteForm.company,

        websiteMode,

        theme: 'Modern',

        // ================= HERO =================

        heroTitle: editWebsiteForm.heroTitle,

        heroHighlight: editWebsiteForm.heroHighlight,

        heroDescription: editWebsiteForm.heroDescription,

        heroVideo: editWebsiteForm.heroVideo || null,

        // ================= ABOUT =================

        about: editWebsiteForm.about,

        // ================= SERVICES =================
        serviceItems: formattedServices,

        // ================= PRODUCTS =================

        productItems,

        // ================= VIDEOS =================

        videoItems: formattedVideoItems,

        // ================= BUSINESS DETAILS =================

        tagline: editWebsiteForm.tagline,

        expertise: editWebsiteForm.expertise,

        uniqueBusiness: editWebsiteForm.uniqueBusiness,

        industry: editWebsiteForm.industry,

        businessCategory: editWebsiteForm.businessCategory,

        growthOpportunities: editWebsiteForm.growthOpportunities,

        city: editWebsiteForm.city,

        logo: logo?.uri || logo || null,

        // ================= CONTACT =================

        contactItems: [
          {
            email: newContactItem.email,

            phone: newContactItem.phone,

            address: newContactItem.address,
          },
        ],
      };

      console.log('WEBSITE PAYLOAD:', payload);

      const res = await axios.post(`${BASE_URL}website/save-website`, payload);

      console.log('SAVE RESPONSE:', res.data);

      if (res.data.website?.slug) {
        setWebsiteSlug(res.data.website.slug);
      }

      Alert.alert('Success', 'Website Updated Successfully');
    } catch (err) {
      console.log('SAVE WEBSITE ERROR:', err?.response?.data || err);

      Alert.alert(
        'Error',
        getFriendlyErrorMessage(err, 'Failed to save website'),
      );
    }

    setSavingWebsite(false);
  };

  const getPublicWebsiteUrl = slug =>
    `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;

  // ================= PREVIEW =================

  const previewWebsite = () => {
    if (!websiteSlug) {
      Alert.alert(
        'Save Website First',
        'Please save your website before previewing',
      );

      return;
    }

    const url = getPublicWebsiteUrl(websiteSlug);

    Linking.openURL(url).catch(err =>
      Alert.alert('Error', 'Cannot open website URL'),
    );
  };

  // ================= SHARE =================

  const shareWebsite = () => {
    if (!websiteSlug) {
      Alert.alert('Save Website First');

      return;
    }

    const url = getPublicWebsiteUrl(websiteSlug);

    Share.share({
      message: `Check my website ${url}`,
    });
  };

  const guardedGoBack = useGuardedAction(() => navigation.goBack());
  const guardedSetModeService = useGuardedAction(
    () => setWebsiteMode('service'),
    250,
  );
  const guardedSetModeProduct = useGuardedAction(
    () => setWebsiteMode('product'),
    250,
  );
  const guardedSetModeBoth = useGuardedAction(() => setWebsiteMode('both'), 250);
  const guardedPickLogo = useGuardedAction(pickLogo);
  const guardedPickHeroVideo = useGuardedAction(pickHeroVideo);
  const guardedPickServiceImage = useGuardedAction(pickServiceImage);
  const guardedAddService = useGuardedAction(addService);
  const guardedRemoveService = useGuardedAction(index => removeService(index));
  const guardedPickProductImage = useGuardedAction(pickProductImage);
  const guardedAddProduct = useGuardedAction(addProduct);
  const guardedPreviewWebsite = useGuardedAction(previewWebsite);
  const guardedShareWebsite = useGuardedAction(shareWebsite);
  const guardedUpdateWebsite = useGuardedAction(updateWebsite);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03120A" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingBottom: 120,
          flexGrow: 1,
        }}
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <View style={styles.glow1} />

          <View style={styles.glow2} />

          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.backBtn}
              onPress={guardedGoBack}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Website Studio</Text>

            <View style={{ width: 50 }} />
          </View>

          {/* HERO */}

          <View style={styles.heroSection}>
            <Text style={styles.heroBadge}>PREMIUM BUSINESS WEBSITE</Text>

            <Text style={styles.heroHeading}>
              Build Your{'\n'}
              Professional Presence
            </Text>

            <Text style={styles.heroSub}>
              Create premium service, product and hybrid business websites with
              modern UI.
            </Text>
          </View>
        </View>

        {/* ================= BODY ================= */}

        {/* MAIN CARD */}

        <View style={styles.mainCard}>
          {loadingWebsite && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.loadingBannerText}>
                Loading your website...
              </Text>
              {showSlowNotice && (
                <Text style={styles.slowNoticeText}>
                  Still working on it — this is taking longer than expected.
                  Please check your connection.
                </Text>
              )}
            </View>
          )}

          {/* WEBSITE MODE */}

          <Text style={styles.sectionTitle}>Website Type</Text>

          <View style={styles.modeWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.modeCard,

                websiteMode === 'service' && styles.activeMode,
              ]}
              onPress={guardedSetModeService}
            >
              <Text style={styles.modeIcon}>🛠️</Text>

              <Text
                style={[
                  styles.modeTitle,

                  websiteMode === 'service' && styles.activeModeText,
                ]}
              >
                Service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.modeCard,

                websiteMode === 'product' && styles.activeMode,
              ]}
              onPress={guardedSetModeProduct}
            >
              <Text style={styles.modeIcon}>🛍️</Text>

              <Text
                style={[
                  styles.modeTitle,

                  websiteMode === 'product' && styles.activeModeText,
                ]}
              >
                Product
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.modeCard,

                websiteMode === 'both' && styles.activeMode,
              ]}
              onPress={guardedSetModeBoth}
            >
              <Text style={styles.modeIcon}>🚀</Text>

              <Text
                style={[
                  styles.modeTitle,

                  websiteMode === 'both' && styles.activeModeText,
                ]}
              >
                Hybrid
              </Text>
            </TouchableOpacity>
          </View>

          {/* COMPANY */}

          <Text style={styles.label}>Company Name</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter company name"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.company}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                company: text,
              })
            }
          />

          {/* HERO TITLE */}

          <Text style={styles.label}>Hero Title</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter hero title"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.heroTitle}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                heroTitle: text,
              })
            }
          />

          {/* HERO HIGHLIGHT */}

          <Text style={styles.label}>Hero Highlight</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter hero highlight"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.heroHighlight}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                heroHighlight: text,
              })
            }
          />

          {/* HERO DESCRIPTION */}

          <Text style={styles.label}>Hero Description</Text>

          <TextInput
            style={[styles.input, styles.multiInput]}
            multiline
            placeholder="Describe your business..."
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.heroDescription}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                heroDescription: text,
              })
            }
          />

          {/* LOGO */}

          <Text style={styles.label}>Company Logo</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.logoPicker}
            onPress={guardedPickLogo}
          >
            {logo ? (
              <Image
                source={{
                  uri: logo?.uri || logo,
                }}
                style={styles.logo}
                resizeMode="contain"
                onError={e => console.log('LOGO ERROR', e.nativeEvent)}
              />
            ) : (
              <>
                <Text style={styles.logoPickerIcon}>⬆️</Text>

                <Text style={styles.logoPickerText}>Upload Company Logo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* HERO VIDEO */}

          <Text style={styles.label}>Hero Video (Optional)</Text>

          <Text style={styles.helperText}>
            Add a video to your hero section for a more engaging experience
          </Text>

          {heroVideo ? (
            <View style={styles.videoPreviewWrapper}>
              <Video
                source={{ uri: heroVideo.uri }}
                style={styles.videoPreviewPlayer}
                resizeMode="cover"
                controls
                paused
              />

              <View style={styles.uploadedBadge}>
                <Text style={styles.uploadedText}>✓ Uploaded</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.changeVideoBtn}
                onPress={guardedPickHeroVideo}
              >
                <Text style={styles.changeVideoText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.videoPicker}
              onPress={guardedPickHeroVideo}
            >
              <Text style={styles.videoPickerIcon}>🎥</Text>

              <Text style={styles.videoPickerText}>Upload Hero Video</Text>
            </TouchableOpacity>
          )}

          {/* ================= VIDEOS SECTION ================= */}

          {/* <Text style={styles.sectionTitle}>Promotional Videos</Text>

          <Text style={styles.helperText}>
            Add videos to showcase your products or services
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Video title"
            placeholderTextColor="#94A3B8"
            value={newVideoItem.title}
            onChangeText={text =>
              setNewVideoItem(prev => ({
                ...prev,
                title: text,
              }))
            }
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.videoPicker}
            onPress={pickVideo}
          >
            <Text style={styles.videoPickerIcon}>🎥</Text>

            <Text style={styles.videoPickerText}>
              {newVideoItem.video ? 'Video Selected ✓' : 'Upload Video'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.multiInput]}
            multiline
            placeholder="Video description"
            placeholderTextColor="#94A3B8"
            value={newVideoItem.description}
            onChangeText={text =>
              setNewVideoItem(prev => ({
                ...prev,
                description: text,
              }))
            }
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.imagePicker}
            onPress={pickVideoThumbnail}
          >
            {newVideoItem.thumbnail ? (
              <Image
                source={{
                  uri: newVideoItem.thumbnail.uri,
                }}
                style={styles.serviceImage}
              />
            ) : (
              <Text style={styles.imagePickerText}>
                Upload Thumbnail (Optional)
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.addBtn}
            onPress={addVideo}
          >
            <Text style={styles.addBtnText}>Add Video</Text>
          </TouchableOpacity>

          {videoItems.length > 0 && (
            <>
              <Text style={styles.label}>
                Videos Added ({videoItems.length})
              </Text>
              {videoItems.map((item, index) => (
                <View key={item.id} style={styles.videoCard}>
                  {item.thumbnail && (
                    <Image
                      source={{
                        uri:
                          typeof item.thumbnail === 'string'
                            ? item.thumbnail
                            : item.thumbnail?.uri,
                      }}
                      style={styles.cardImage}
                    />
                  )}
                  <Text style={styles.videoCardTitle}>{item.title}</Text>

                  <Text style={styles.videoCardDesc}>{item.description}</Text>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.removeBtn}
                    onPress={() => removeVideo(index)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )} */}

          {/* ================= SERVICES ================= */}

          {(websiteMode === 'service' || websiteMode === 'both') && (
            <>
              <Text style={styles.sectionTitle}>Services</Text>

              <TextInput
                style={styles.input}
                placeholder="Service title"
                placeholderTextColor="#94A3B8"
                value={newServiceItem.title}
                onChangeText={text =>
                  setNewServiceItem(prev => ({
                    ...prev,
                    title: text,
                  }))
                }
              />

              <TextInput
                style={[styles.input, styles.multiInput]}
                multiline
                placeholder="Service description"
                placeholderTextColor="#94A3B8"
                value={newServiceItem.description}
                onChangeText={text =>
                  setNewServiceItem(prev => ({
                    ...prev,
                    description: text,
                  }))
                }
              />

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.imagePicker}
                onPress={guardedPickServiceImage}
              >
                {newServiceItem.image ? (
                  <>
                    <Image
                      source={normalizeImage(newServiceItem.image)}
                      style={styles.serviceImage}
                    />

                    <View style={styles.uploadedBadge}>
                      <Text style={styles.uploadedText}>✓ Uploaded</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={styles.imagePickerText}>
                      Tap to Upload Service Image
                    </Text>
                    <Text style={styles.helperText}>JPG, PNG supported</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.addBtn}
                onPress={guardedAddService}
              >
                <Text style={styles.addBtnText}>Add Service</Text>
              </TouchableOpacity>

              {editWebsiteForm.services.map((item, index) => (
                <View key={index} style={styles.serviceCard}>
                  {item.image && (
                    <Image
                      source={normalizeImage(item.image)}
                      style={styles.cardImage}
                    />
                  )}

                  <Text style={styles.serviceTitle}>{item.title}</Text>

                  <Text style={styles.serviceDesc}>{item.description}</Text>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.removeBtn}
                    onPress={() => guardedRemoveService(index)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* ================= PRODUCTS ================= */}

          {(websiteMode === 'product' || websiteMode === 'both') && (
            <>
              <Text style={styles.sectionTitle}>Products</Text>

              <TextInput
                style={styles.input}
                placeholder="Product name"
                placeholderTextColor="#94A3B8"
                value={newProductItem.title}
                onChangeText={text =>
                  setNewProductItem(prev => ({
                    ...prev,
                    title: text,
                  }))
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Price"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newProductItem.price}
                onChangeText={text =>
                  setNewProductItem(prev => ({
                    ...prev,
                    price: text,
                  }))
                }
              />

              <TextInput
                style={[styles.input, styles.multiInput]}
                multiline
                placeholder="Product description"
                placeholderTextColor="#94A3B8"
                value={newProductItem.description}
                onChangeText={text =>
                  setNewProductItem(prev => ({
                    ...prev,
                    description: text,
                  }))
                }
              />

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.imagePicker}
                onPress={guardedPickProductImage}
              >
                {newProductItem.image ? (
                  <Image
                    source={normalizeImage(newProductItem.image)}
                    style={styles.serviceImage}
                  />
                ) : (
                  <Text style={styles.imagePickerText}>
                    Upload Product Image
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.addBtn}
                onPress={guardedAddProduct}
              >
                <Text style={styles.addBtnText}>Add Product</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ABOUT */}

          <Text style={styles.sectionTitle}>About Business</Text>

          <TextInput
            style={[styles.input, styles.multiInput]}
            multiline
            placeholder="About your business..."
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.about}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                about: text,
              })
            }
          />

          {/* ================= BUSINESS DETAILS ================= */}

          <Text style={styles.sectionTitle}>Business Details</Text>

          {/* TAGLINE */}

          <Text style={styles.label}>Business Tagline</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter tagline"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.tagline}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                tagline: text,
              })
            }
          />

          {/* EXPERTISE */}

          <Text style={styles.label}>Expertise</Text>

          <TextInput
            style={[styles.input, styles.multiInput]}
            multiline
            placeholder="Enter expertise"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.expertise}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                expertise: text,
              })
            }
          />

          {/* UNIQUE BUSINESS */}

          <Text style={styles.label}>Unique Business</Text>

          <TextInput
            style={[styles.input, styles.multiInput]}
            multiline
            placeholder="What makes your business unique?"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.uniqueBusiness}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                uniqueBusiness: text,
              })
            }
          />

          {/* INDUSTRY */}

          <Text style={styles.label}>Industry</Text>

          <TextInput
            style={styles.input}
            placeholder="Industry"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.industry}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                industry: text,
              })
            }
          />

          <Text style={styles.label}>Business Category</Text>

          <TextInput
            style={styles.input}
            placeholder="Business Category"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.businessCategory}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                businessCategory: text,
              })
            }
          />

          <Text style={styles.label}>Growth Opportunities</Text>

          <TextInput
            style={styles.input}
            placeholder="Growth Opportunities"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.growthOpportunities}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                growthOpportunities: text,
              })
            }
          />

          <Text style={styles.label}>City</Text>

          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#94A3B8"
            value={editWebsiteForm.city}
            onChangeText={text =>
              setEditWebsiteForm({
                ...editWebsiteForm,
                city: text,
              })
            }
          />

          {/* CONTACT */}

          <Text style={styles.sectionTitle}>Contact Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Business email"
            placeholderTextColor="#94A3B8"
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
            placeholder="Business phone"
            placeholderTextColor="#94A3B8"
            value={newContactItem.phone}
            onChangeText={text =>
              setNewContactItem(prev => ({
                ...prev,
                phone: text,
              }))
            }
          />

          <TextInput
            style={[styles.input, styles.multiInput]}
            multiline
            placeholder="Business address"
            placeholderTextColor="#94A3B8"
            value={newContactItem.address}
            onChangeText={text =>
              setNewContactItem(prev => ({
                ...prev,
                address: text,
              }))
            }
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.previewBtn}
            onPress={guardedPreviewWebsite}
          >
            <Text style={styles.previewText}>👁️ Preview Website</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.shareBtn}
            onPress={guardedShareWebsite}
          >
            <Text style={styles.shareText}>Share Website</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.saveBtn}
            onPress={guardedUpdateWebsite}
          >
            {savingWebsite ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Publish Website</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditWebsiteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#F4F7F5',
  },

  // ================= HEADER =================

  header: {
    backgroundColor: '#03120A',

    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,

    paddingBottom: 36,

    overflow: 'hidden',
  },

  glow1: {
    position: 'absolute',

    width: 260,
    height: 260,

    borderRadius: 160,

    backgroundColor: 'rgba(22,163,74,0.08)',

    right: -90,
    top: -90,
  },

  glow2: {
    position: 'absolute',

    width: 180,
    height: 180,

    borderRadius: 100,

    backgroundColor: 'rgba(255,255,255,0.04)',

    left: -60,
    bottom: -50,
  },

  // ================= TOP =================

  topBar: {
    marginTop: Platform.OS === 'android' ? 18 : 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 20,
  },

  headerTitle: {
    color: '#FFFFFF',

    fontSize: 24,

    fontWeight: '900',

    letterSpacing: -0.6,
    marginTop: 50,
  },

  // ================= HERO =================

  heroSection: {
    marginTop: 28,

    paddingHorizontal: 24,
  },

  heroBadge: {
    alignSelf: 'flex-start',

    backgroundColor: 'rgba(22,163,74,0.16)',

    color: '#A7F3D0',

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 18,

    overflow: 'hidden',

    fontSize: 11,

    fontWeight: '900',

    letterSpacing: 1,
  },

  heroHeading: {
    marginTop: 24,

    color: '#FFFFFF',

    fontSize: 38,

    lineHeight: 48,

    fontWeight: '900',

    letterSpacing: -1.4,
  },

  heroSub: {
    marginTop: 18,

    color: '#C7D2D9',

    fontSize: 15,

    lineHeight: 28,

    fontWeight: '500',
  },

  // ================= LOADING =================

  loadingBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  loadingBannerText: {
    color: '#166534',
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

  // ================= MAIN =================

  mainCard: {
    backgroundColor: '#FFFFFF',

    marginHorizontal: 18,

    marginTop: 22,

    borderRadius: 34,

    padding: 22,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 10,
    },

    shadowOpacity: 0.06,

    shadowRadius: 18,

    elevation: 6,
  },

  sectionTitle: {
    color: '#111827',

    fontSize: 22,

    fontWeight: '900',

    marginBottom: 18,

    marginTop: 14,
  },

  label: {
    color: '#111827',

    fontSize: 14,

    fontWeight: '800',

    marginBottom: 12,

    marginTop: 8,
  },

  // ================= INPUT =================

  input: {
    backgroundColor: '#F8FAFC',

    borderWidth: 1.5,

    borderColor: '#E2E8F0',

    borderRadius: 22,

    paddingHorizontal: 18,
    paddingVertical: 18,

    color: '#111827',

    fontSize: 15,

    fontWeight: '600',

    marginBottom: 16,
  },

  multiInput: {
    minHeight: 120,

    textAlignVertical: 'top',
  },

  // ================= LOGO =================

  logoPicker: {
    height: 180,

    backgroundColor: '#F8FAFC',

    borderWidth: 2,

    borderStyle: 'dashed',

    borderColor: '#CBD5E1',

    borderRadius: 28,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 20,

    overflow: 'hidden',
  },

  logoPickerIcon: {
    fontSize: 30,

    marginBottom: 12,
  },

  logoPickerText: {
    color: '#64748B',

    fontSize: 15,

    fontWeight: '800',
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  // ================= MODE =================

  modeWrapper: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    marginBottom: 20,
  },

  modeCard: {
    width: '31%',

    backgroundColor: '#F8FAFC',

    borderRadius: 24,

    paddingVertical: 22,

    alignItems: 'center',

    borderWidth: 1.5,

    borderColor: '#E2E8F0',
  },

  activeMode: {
    backgroundColor: '#17310F',

    borderColor: '#17310F',

    elevation: 6,
  },

  modeIcon: {
    fontSize: 30,

    marginBottom: 12,
  },

  modeTitle: {
    color: '#111827',

    fontSize: 14,

    fontWeight: '800',
  },

  activeModeText: {
    color: '#FFFFFF',
  },

  // ================= IMAGE PICKER =================

  imagePicker: {
    height: 160,

    backgroundColor: '#F8FAFC',

    borderRadius: 24,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1.5,

    borderColor: '#E2E8F0',

    overflow: 'hidden',

    marginBottom: 18,
  },

  imagePickerText: {
    color: '#64748B',

    fontSize: 14,

    fontWeight: '800',
  },

  serviceImage: {
    width: '100%',
    height: '100%',
  },

  // ================= ADD BTN =================

  addBtn: {
    height: 58,

    backgroundColor: '#17310F',

    borderRadius: 22,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 20,

    elevation: 6,
  },

  addBtnText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '900',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  uploadedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  // ================= CARD =================

  serviceCard: {
    backgroundColor: '#F8FAFC',

    borderRadius: 28,

    padding: 18,

    marginBottom: 18,

    borderWidth: 1,

    borderColor: '#E2E8F0',
  },

  cardImage: {
    width: '100%',
    height: 180,

    borderRadius: 20,

    marginBottom: 16,
  },

  serviceTitle: {
    color: '#111827',

    fontSize: 18,

    fontWeight: '900',
  },

  serviceDesc: {
    color: '#64748B',

    fontSize: 14,

    lineHeight: 24,

    marginTop: 10,

    fontWeight: '500',
  },

  removeBtn: {
    alignSelf: 'flex-start',

    marginTop: 16,

    backgroundColor: 'rgba(239,68,68,0.12)',

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 16,
  },

  removeText: {
    color: '#EF4444',

    fontWeight: '900',
  },

  // ================= PICKER =================

  pickerContainer: {
    backgroundColor: '#F8FAFC',

    borderWidth: 1.5,

    borderColor: '#E2E8F0',

    borderRadius: 22,

    overflow: 'hidden',

    marginBottom: 20,
  },

  // ================= BUTTONS =================

  previewBtn: {
    height: 60,

    backgroundColor: '#4F46E5',

    borderRadius: 22,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 12,
  },

  previewText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '900',
  },

  shareBtn: {
    height: 60,

    backgroundColor: '#E2E8F0',

    borderRadius: 22,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 16,
  },

  shareText: {
    color: '#111827',

    fontSize: 15,

    fontWeight: '900',
  },

  saveBtn: {
    height: 64,

    backgroundColor: '#17310F',

    borderRadius: 24,

    justifyContent: 'center',
    alignItems: 'center',

    elevation: 8,

    shadowColor: '#17310F',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.3,

    shadowRadius: 16,
  },

  saveText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '900',

    letterSpacing: 0.4,
  },

  // ================= VIDEO STYLES =================

  helperText: {
    color: '#64748B',

    fontSize: 12,

    marginBottom: 12,

    fontStyle: 'italic',
  },

  videoPicker: {
    backgroundColor: '#F0F9FF',

    borderWidth: 2,

    borderColor: '#0EA5E9',

    borderRadius: 20,

    borderStyle: 'dashed',

    padding: 36,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 20,
  },

  videoPreview: {
    alignItems: 'center',

    justifyContent: 'center',
  },

  videoPreviewWrapper: {
    height: 200,

    borderRadius: 20,

    overflow: 'hidden',

    marginBottom: 20,

    backgroundColor: '#000',
  },

  videoPreviewPlayer: {
    width: '100%',
    height: '100%',
  },

  changeVideoBtn: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  changeVideoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  videoPickerIcon: {
    fontSize: 48,

    marginBottom: 12,
  },

  videoPickerText: {
    color: '#0EA5E9',

    fontSize: 16,

    fontWeight: '600',

    textAlign: 'center',
  },

  videoCard: {
    backgroundColor: '#F8FAFC',

    borderWidth: 1,

    borderColor: '#E2E8F0',

    borderRadius: 16,

    padding: 16,

    marginBottom: 16,

    overflow: 'hidden',
  },

  cardImage: {
    width: '100%',

    height: 160,

    borderRadius: 12,

    marginBottom: 12,
  },

  videoCardTitle: {
    color: '#111827',

    fontSize: 16,

    fontWeight: '700',

    marginBottom: 6,
  },

  videoCardDesc: {
    color: '#475569',

    fontSize: 13,

    lineHeight: 20,

    marginBottom: 8,
  },

  videoUrl: {
    color: '#0EA5E9',

    fontSize: 12,

    marginBottom: 12,

    fontWeight: '500',
  },
});

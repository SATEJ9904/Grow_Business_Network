// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Animated,
//   Dimensions,
//   Platform,
//   Text,
//   Share,
//   Alert,
// } from 'react-native';
// import { WebView } from 'react-native-webview';
// import { BASE_URL } from '@env';

// const windowWidth = Dimensions.get('window').width;
// const isSmallScreen = windowWidth < 380;

// const PreviewScreen = ({ html, onClose, company, slug }) => {
//   const [headerAnim] = useState(new Animated.Value(0));

//   useEffect(() => {
//     Animated.timing(headerAnim, {
//       toValue: 1,
//       duration: 500,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const handleBackPress = () => {
//     if (onClose) {
//       onClose();
//     }
//   };

//   const createSlug = () => {
//     if (slug) {
//       return slug;
//     }

//     const titleMatch = html?.match(/<title>([^<]*)<\/title>/i);
//     const fallbackName = company?.trim() || titleMatch?.[1]?.trim();
//     if (!fallbackName) {
//       return null;
//     }

//     return fallbackName
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, '-')
//       .replace(/[^a-z0-9-]/g, '');
//   };

//   const getPublicWebsiteUrl = slug =>
//     `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;

//   const shareWebsite = () => {
//     const finalSlug = createSlug();
//     if (!finalSlug) {
//       Alert.alert(
//         'Share unavailable',
//         'Please save or publish your website first so the public link works.',
//       );
//       return;
//     }

//     const url = getPublicWebsiteUrl(finalSlug);

//     console.log('[PreviewScreen] shareWebsite slug/url', {
//       slug: finalSlug,
//       url,
//     });

//     Share.share({
//       message: `🌐 Check out my website:\n${url}\n\nBuilt with GBN 🚀`,
//     }).catch(err => {
//       console.log('[PreviewScreen] shareWebsite error', err);
//     });
//   };

//   return (
//     <View style={styles.background}>
//       <View style={styles.container}>
//         <Animated.View
//           style={[
//             styles.header,
//             {
//               opacity: headerAnim,
//               transform: [
//                 {
//                   translateY: headerAnim.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [-20, 0],
//                   }),
//                 },
//               ],
//             },
//           ]}
//         >
//           <Text style={styles.title}>Website Preview</Text>
//           <View style={styles.headerButtons}>
//             <TouchableOpacity
//               style={styles.shareButton}
//               onPress={shareWebsite}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.shareButtonText}>🔗 Share</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={handleBackPress}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.closeText}>Back</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//         <View style={styles.webviewCard}>
//           <WebView
//             originWhitelist={['*']}
//             source={{ html }}
//             style={styles.webview}
//             javaScriptEnabled={true}
//             onError={e => {
//               console.log('WEBVIEW ERROR', e.nativeEvent);
//             }}
//             onHttpError={e => {
//               console.log('WEBVIEW HTTP ERROR', e.nativeEvent);
//             }}
//           />
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: 'transparent',
//   },
//   header: {
//     paddingTop: Platform.OS === 'android' ? 16 : 14,
//     paddingHorizontal: 18,
//     paddingBottom: 16,
//     backgroundColor: '#ffffff',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e2e8f0',
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 14,
//     shadowOffset: { width: 0, height: 6 },
//     elevation: 3,
//   },
//   title: {
//     fontSize: isSmallScreen ? 17 : 20,
//     fontWeight: '800',
//     color: '#0f172a',
//     letterSpacing: -0.4,
//     flex: 1,
//     marginTop: 35,
//   },
//   headerButtons: {
//     flexDirection: 'row',
//     gap: 10,
//     alignItems: 'center',
//     marginTop: 34,
//   },
//   shareButton: {
//     backgroundColor: '#0ea5e9',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 11,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#0ea5e9',
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 3,
//   },
//   shareButtonText: {
//     color: '#ffffff',
//     fontWeight: '800',
//     fontSize: isSmallScreen ? 13 : 14,
//     letterSpacing: 0.1,
//   },
//   closeButton: {
//     backgroundColor: '#2F4F1E',
//     paddingHorizontal: 18,
//     paddingVertical: 11,
//     borderRadius: 12,
//     minWidth: 80,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#2F4F1E',
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 4,
//   },
//   closeText: {
//     color: '#ffffff',
//     fontWeight: '800',
//     fontSize: isSmallScreen ? 14 : 15,
//     letterSpacing: 0.1,
//   },
//   webviewCard: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     margin: 18,
//     marginTop: 0,
//     borderRadius: 22,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     shadowOffset: { width: 0, height: 8 },
//     elevation: 6,
//   },
//   webview: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
// });

// export default PreviewScreen;

















import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Text,
  Share,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {API_BASE_URL as BASE_URL} from '../utils/apiConfig';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';

const windowWidth = Dimensions.get('window').width;
const isSmallScreen = windowWidth < 380;

const PreviewScreen = ({html, onClose, company, slug}) => {
  const [headerAnim] = useState(new Animated.Value(0));
  const [webviewLoading, setWebviewLoading] = useState(true);
  const [webviewErrorMessage, setWebviewErrorMessage] = useState(null);
  const showSlowNotice = useDelayedNotice(webviewLoading, 8000);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    }
  };

  const createSlug = () => {
    if (slug) {
      return slug;
    }

    const titleMatch = html?.match(/<title>([^<]*)<\/title>/i);
    const fallbackName = company?.trim() || titleMatch?.[1]?.trim();

    if (!fallbackName) {
      return null;
    }

    return fallbackName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const getPublicWebsiteUrl = slug =>
    `${BASE_URL.replace(/\/api\/?$/, '')}/site/${slug}`;

  const shareWebsite = () => {
    const finalSlug = createSlug();

    if (!finalSlug) {
      Alert.alert(
        'Share unavailable',
        'Please save or publish your website first.',
      );
      return;
    }

    const url = getPublicWebsiteUrl(finalSlug);

    Share.share({
      message: `🌐 Check out my website:\n${url}\n\nBuilt with GBN 🚀`,
    }).catch(err => {
      console.log('Share Error:', err);
    });
  };

  const finalSlug = createSlug();
  const previewUrl = finalSlug
    ? getPublicWebsiteUrl(finalSlug)
    : null;

  console.log('Preview URL:', previewUrl);

  const guardedShareWebsite = useGuardedAction(shareWebsite);
  const guardedHandleBackPress = useGuardedAction(handleBackPress);

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.title}>Website Preview</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={guardedShareWebsite}>
              <Text style={styles.shareButtonText}>🔗 Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={guardedHandleBackPress}>
              <Text style={styles.closeText}>Back</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.webviewCard}>
          {webviewErrorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{webviewErrorMessage}</Text>
            </View>
          ) : null}
          {!webviewErrorMessage && webviewLoading && showSlowNotice ? (
            <View style={styles.slowNoticeBanner}>
              <Text style={styles.slowNoticeText}>
                Still loading — this is taking longer than expected.
              </Text>
            </View>
          ) : null}
          {previewUrl ? (
            <WebView
              source={{uri: previewUrl}}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={[`${BASE_URL.replace(/\/api\/?$/, '')}/*`]}
              mixedContentMode="never"
              cacheEnabled={true}
              startInLoadingState={true}
              onLoadStart={() => {
                console.log('WEBVIEW LOAD START');
                setWebviewLoading(true);
                setWebviewErrorMessage(null);
              }}
              onLoadEnd={() => {
                console.log('WEBVIEW LOAD END');
                setWebviewLoading(false);
              }}
              onError={e => {
                console.log('WEBVIEW ERROR', e.nativeEvent);
                setWebviewLoading(false);
                setWebviewErrorMessage(
                  getFriendlyErrorMessage(
                    e.nativeEvent,
                    'Unable to load the website. Please check your connection and try again.',
                  ),
                );
              }}
              onHttpError={e => {
                console.log('WEBVIEW HTTP ERROR', e.nativeEvent);
                setWebviewLoading(false);
                setWebviewErrorMessage(
                  getFriendlyErrorMessage(
                    e.nativeEvent,
                    'The website could not be loaded. Please try again.',
                  ),
                );
              }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text>No website URL found</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 16 : 14,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 3,
  },
  title: {
    fontSize: isSmallScreen ? 17 : 20,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginTop: 35,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 34,
  },
  shareButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
    marginRight: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  closeButton: {
    backgroundColor: '#2F4F1E',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  closeText: {
    color: '#fff',
    fontWeight: '800',
  },
  webviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 18,
    marginTop: 0,
    borderRadius: 22,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  slowNoticeBanner: {
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  slowNoticeText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PreviewScreen;
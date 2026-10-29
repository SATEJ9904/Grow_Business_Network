import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Animated,
  useWindowDimensions,
  Modal,
  Alert,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/apiConfig';

const API_URL = API_BASE_URL;
import { launchImageLibrary } from 'react-native-image-picker';
import { Image } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  useGuardedAction,
  useDelayedNotice,
  getFriendlyErrorMessage,
} from '../utils/guards';
import KeyboardScreen from '../KeyboardScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The registration fee is never hardcoded here - it's fetched from
// GET /api/payment/registration-fee, which computes it from the backend's
// REGISTRATION_FEE_PAISE the same way payment/create-order does. That way
// what the member sees before paying always matches what Razorpay actually
// charges, with a single source of truth (the .env var) instead of a
// duplicated constant that can silently drift out of sync with it.

// Mirrors backend/validations/authValidation.js so a field that passes here
// is guaranteed to pass server-side too - nothing should fail for the first
// time only after the user has already paid.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const PASSWORD_MIN_LENGTH = 6;

export default function RegisterScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    otp: '',
    companyName: '',
    city: '',
    chapterId: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [cities, setCities] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState('');
  const [logo, setLogo] = useState(null);

  const [registrationFee, setRegistrationFee] = useState(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState('');

  const [otpModal, setOtpModal] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [chapterDropdownVisible, setChapterDropdownVisible] = useState(false);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [cityDropdownVisible, setCityDropdownVisible] = useState(false);

  const LOCAL_CHAPTERS = [
    { _id: '1', name: 'Mumbai Chapter', city: 'Mumbai' },
    { _id: '2', name: 'Bangalore Chapter', city: 'Bangalore' },
    { _id: '3', name: 'Delhi Chapter', city: 'Delhi' },
    { _id: '4', name: 'Pune Chapter', city: 'Pune' },
    { _id: '5', name: 'Hyderabad Chapter', city: 'Hyderabad' },
  ];

  useEffect(() => {
    fetchCities();
    fetchChapters();
    fetchRegistrationFee();
  }, []);

  const fetchRegistrationFee = async () => {
    try {
      setFeeLoading(true);
      setFeeError('');

      const response = await fetch(`${API_URL}payment/registration-fee`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Unable to load the registration fee');
      }

      setRegistrationFee(data.data.totalAmount);
    } catch (error) {
      setFeeError(getFriendlyErrorMessage(error, 'Unable to load the registration fee.'));
    } finally {
      setFeeLoading(false);
    }
  };

  useEffect(() => {
    console.log('otpModal state changed:', otpModal);
  }, [otpModal]);

  useEffect(() => {
    console.log('Chapters state updated:', chapters);
    console.log('Chapters count:', chapters.length);
  }, [chapters]);

  const fetchChapters = async () => {
    try {
      setChaptersLoading(true);
      setChaptersError('');

      console.log('Fetching chapters from:', `${API_URL}admin/chapters`);

      const response = await fetch(`${API_URL}admin/chapters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Chapters response status:', response.status);

      const data = await response.json();

      console.log('Chapters data:', data);

      if (data.success && data.data && data.data.length > 0) {
        console.log('Chapters loaded successfully:', data.data);
        setChapters(data.data);
        setChaptersError('');
      } else {
        console.log('Error fetching chapters or empty response:', data.message);
        setChaptersError('Unable to load chapter list');
        setChapters(LOCAL_CHAPTERS);
      }
    } catch (error) {
      console.log('Error fetching chapters:', error.message);
      console.log('Error details:', error);
      setChaptersError(
        getFriendlyErrorMessage(
          error,
          'Unable to load chapter list. Using local chapters.',
        ),
      );
      setChapters(LOCAL_CHAPTERS);
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleRegistration = async (paymentData, invoiceId) => {
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('mobile', form.mobile);
      formData.append('password', form.password);
      formData.append('companyName', form.companyName);
      formData.append('city', form.city);

      formData.append('chapterId', form.chapterId);

      if (invoiceId) {
        formData.append('razorpayInvoiceId', invoiceId);
      }

      formData.append('razorpayOrderId', paymentData.razorpay_order_id);
      formData.append('razorpayPaymentId', paymentData.razorpay_payment_id);
      formData.append('razorpaySignature', paymentData.razorpay_signature);

      if (logo) {
        const logoUri = logo.uri;
        const logoName = logo.fileName || `logo_${Date.now()}.jpg`;
        const logoType = logo.type || 'image/jpeg';

        formData.append('companyLogo', {
          uri: logoUri,
          name: logoName,
          type: logoType,
        });
      }

      console.log('Submitting registration with data:', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        companyName: form.companyName,
        chapterId: form.chapterId,
        hasLogo: !!logo,
        razorpayPaymentId: paymentData.razorpay_payment_id,
      });

      const response = await fetch(`${API_URL}auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Registration response:', response.status, data);

      if (data.success) {
        console.log('REGISTER RESPONSE:', data);

        const userId =
          data.data?.userId ||
          data.data?._id ||
          data.data?.id ||
          data?._id ||
          data?.id ||
          data?.user?._id ||
          data?.user?.id;
        const userStatus = data.data?.status || data?.data?.status || 'pending';
        console.log('User ID:', userId);

        if (userId) {
          await AsyncStorage.setItem('userId', userId);
          console.log('Saved UserId:', userId);
        } else {
          console.log('❌ UserId not found in response');
        }

        const emailToSave =
          form.email ||
          data.data?.email ||
          data?.data?.email ||
          data?.user?.email;
        if (emailToSave) {
          await AsyncStorage.setItem('userEmail', emailToSave);
        }

        await AsyncStorage.setItem('userStatus', userStatus);

        Alert.alert('Done! ✅', data.message || 'Registration successful!');
        navigation.navigate('Login');
      } else if (data.message === 'Email already registered') {
        console.log('User already exists, fetching status...');

        try {
          const statusResponse = await fetch(`${API_URL}auth/check-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email }),
          });

          const statusData = await statusResponse.json();
          console.log('Status API response:', statusData);

          if (statusData.success) {
            const userId =
              statusData.data?.userId ||
              statusData.data?._id ||
              statusData.data?.id ||
              statusData?._id ||
              statusData?.id ||
              statusData?.user?._id ||
              statusData?.user?.id;
            const userStatus =
              statusData.data?.status || statusData?.data?.status || 'pending';

            if (userId) {
              await AsyncStorage.setItem('userId', userId);
              console.log('Saved existing UserId:', userId);
            }

            if (form.email) {
              await AsyncStorage.setItem('userEmail', form.email);
            }

            await AsyncStorage.setItem('userStatus', userStatus);

            navigation.navigate('Status');
          } else {
            Alert.alert(
              'Oops!',
              statusData.message || 'Failed to fetch status',
            );
          }
        } catch (error) {
          console.log('Status fetch error:', error);
          Alert.alert(
            'Oops!',
            getFriendlyErrorMessage(error, 'Unable to fetch user status'),
          );
        }
      } else {
        Alert.alert(
          'Registration Failed',
          data.message || 'Something went wrong',
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const handlePayment = async () => {
    // Last line of defense: re-validate every field against the exact rules
    // the backend enforces, so it's structurally impossible to open the
    // Razorpay checkout - and take the user's money - with data the
    // register endpoint will reject afterwards.
    const finalErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      mobile: validateField('mobile', form.mobile),
      companyName: validateField('companyName', form.companyName),
      password: validateField('password', form.password),
      confirmPassword: validateField('confirmPassword', form.confirmPassword),
    };
    const firstFieldError = Object.values(finalErrors).find(Boolean);

    if (firstFieldError || !otpVerified || !form.chapterId.trim()) {
      setErrors(prev => ({ ...prev, ...finalErrors }));
      Alert.alert(
        'Incomplete Details',
        firstFieldError ||
          (!otpVerified
            ? 'Please verify your email before proceeding to payment.'
            : 'Please go back and select a chapter before proceeding to payment.'),
      );
      return;
    }

    setPaymentProcessing(true);
    try {
      const orderResponse = await fetch(`${API_URL}payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          companyName: form.companyName,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        Alert.alert(
          'Oops!',
          orderData.message || 'Unable to start payment. Please try again.',
        );
        setPaymentProcessing(false);
        return;
      }

      const { invoiceId, orderId, amount, currency, keyId } = orderData.data;

      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'GBN Social Association',
        description: 'Membership Registration Fee',
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.mobile,
        },
        theme: { color: '#0B3D2E' },
      };

      RazorpayCheckout.open(options)
        .then(async paymentData => {
          // Confirm the captured payment and let Razorpay email the invoice
          // right away - deliberately independent of whether the
          // registration submission below goes on to succeed. A member who
          // paid should get their receipt even if registration itself
          // errors out afterward (bad chapter, dropped connection, etc).
          try {
            await fetch(`${API_URL}payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: paymentData.razorpay_order_id,
                razorpayPaymentId: paymentData.razorpay_payment_id,
                razorpaySignature: paymentData.razorpay_signature,
                razorpayInvoiceId: invoiceId,
              }),
            });
          } catch (verifyError) {
            console.log('Payment verify/invoice-notify error:', verifyError);
          }

          handleRegistration(paymentData, invoiceId);
        })
        .catch(error => {
          setPaymentProcessing(false);
          if (error?.code !== 0) {
            // code 0 is user-cancelled checkout; anything else is a real failure
            Alert.alert(
              'Payment Failed',
              error?.description || 'Payment could not be completed. Please try again.',
            );
          }
        });
    } catch (error) {
      console.error('Create order error:', error);
      Alert.alert(
        'Oops!',
        getFriendlyErrorMessage(
          error,
          'Network error while starting payment. Please try again.',
        ),
      );
      setPaymentProcessing(false);
    }
  };

  const isStep1Valid = () => {
    return (
      !validateField('name', form.name) &&
      !validateField('email', form.email) &&
      !validateField('mobile', form.mobile) &&
      otpVerified
    );
  };

  const isStep2Valid = () => {
    return !validateField('companyName', form.companyName) && form.chapterId.trim();
  };

  const isStep3Valid = () => {
    return true;
  };

  const isStep4Valid = () => {
    return (
      !validateField('password', form.password) &&
      !validateField('confirmPassword', form.confirmPassword)
    );
  };

  // Single source of truth for field validity - used both for the inline
  // "on the spot" error text and for the final pre-payment safety check, so
  // the two can never disagree.
  const validateField = (key, value, currentForm = form) => {
    switch (key) {
      case 'name':
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name cannot exceed 50 characters';
        return '';
      case 'email':
        return EMAIL_REGEX.test(value.trim())
          ? ''
          : 'Enter a valid email address';
      case 'mobile':
        return MOBILE_REGEX.test(value.trim())
          ? ''
          : 'Mobile number must be exactly 10 digits';
      case 'companyName':
        return value.trim().length > 0 ? '' : 'Company name is required';
      case 'password':
        return value.length >= PASSWORD_MIN_LENGTH
          ? ''
          : `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
      case 'confirmPassword':
        return value === currentForm.password ? '' : "Passwords don't match";
      default:
        return '';
    }
  };

  const handleChange = (key, value) => {
    if (key === 'email' && otpVerified) {
      setOtpVerified(false);
      setOtpError('');
      setOtpModal(false);
      console.log('✅ Email changed after verification, OTP status reset');
    }
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    setErrors(prev => {
      const next = { ...prev, [key]: validateField(key, value, nextForm) };
      // Changing the password should re-check confirmPassword against it too.
      if (key === 'password' && nextForm.confirmPassword) {
        next.confirmPassword = validateField(
          'confirmPassword',
          nextForm.confirmPassword,
          nextForm,
        );
      }
      return next;
    });
  };

  const sendOtp = async () => {
    console.log('🔹 sendOtp() called');
    if (!form.email.trim()) {
      console.warn('❌ Email is empty, cannot send OTP');
      Alert.alert('Oops!', 'Please enter your email address first.');
      return;
    }
    const emailError = validateField('email', form.email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      Alert.alert('Oops!', emailError);
      return;
    }
    console.log('✅ Email validated:', form.email);
    setOtpLoading(true);
    setOtpError('');
    setOtpSuccessMessage('');

    // Catch an already-registered email here, before an OTP is even sent -
    // otherwise the very first time the user hears about it is after they've
    // already paid, when handleRegistration's backend call finally rejects it.
    try {
      const statusResponse = await fetch(`${API_URL}auth/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const statusData = await statusResponse.json();
      if (statusData.success) {
        setOtpLoading(false);
        Alert.alert(
          'Already Registered',
          'An account with this email already exists. Please log in, or check your registration status instead.',
        );
        return;
      }
    } catch (checkError) {
      // If the availability check itself fails (network hiccup etc.), don't
      // block the user - fall through to send-otp/register, which still
      // enforce this same rule server-side as a safety net.
      console.log('Email availability check failed:', checkError.message);
    }

    try {
      console.log('📧 Sending OTP to:', form.email);
      console.log('🔗 API URL:', `${API_URL}auth/send-otp`);
      console.log('📝 Request payload:', { email: form.email });

      const response = await fetch(`${API_URL}auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: form.email }),
      });

      console.log('📨 Response received - Status:', response.status);

      const data = await response.json();
      console.log('✅ Response data parsed:', data);
      console.log('OTP send response', response.status, data);

      if (!response.ok) {
        console.warn('❌ OTP send failed with status', response.status);
        console.warn('❌ Error message from server:', data);
        setOtpError(data.message || `Server error ${response.status}`);
        return;
      }

      if (data.success) {
        console.log('✅ OTP sent successfully');
        console.log('Setting OTP modal to true');
        setOtpSuccessMessage(data.message || 'OTP sent successfully');
        setOtpModal(true);
        console.log('✅ OTP modal state opened');

        setTimeout(() => {
          console.log(
            '⏱️ Modal should be visible now, otpModal state:',
            otpModal,
          );
        }, 100);
      } else {
        console.warn('⚠️ OTP send unsuccessful - success flag is false');
        console.warn('⚠️ Error from server:', data.message);
        setOtpError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ OTP send exception:', error.message);
      console.error('❌ Full error object:', error);
      setOtpError(getFriendlyErrorMessage(error, 'Network error. Please try again.'));
    } finally {
      console.log('🔹 sendOtp() finally block - setting otpLoading to false');
      setOtpLoading(false);
    }
  };
  console.log('Form State:', form);
  const verifyOtp = async () => {
    if (!form.otp.trim()) {
      Alert.alert('Oops!', 'Please enter the OTP.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const response = await fetch(`${API_URL}auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.token || data.accessToken) {
          const token = data.token || data.accessToken;
          await AsyncStorage.setItem('accessToken', token);
          console.log('✅ Token saved to AsyncStorage');
        }

        if (data.userId || data.data?._id || data.data?.id) {
          const userId = data.userId || data.data?._id || data.data?.id;
          await AsyncStorage.setItem('userId', userId);
          console.log('✅ UserId saved to AsyncStorage');
        }

        Alert.alert('Done! ✅', data.message);
        setOtpVerified(true);
        setOtpModal(false);
        setForm({ ...form, otp: '' });

        setChaptersLoading(true);
        setTimeout(() => fetchChapters(), 500);
      } else {
        setVerifyError(data.message || 'Failed to verify OTP');
      }
    } catch (error) {
      setVerifyError(getFriendlyErrorMessage(error, 'Network error. Please try again.'));
    } finally {
      setVerifyLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Oops!', result.errorMessage || 'Image selection failed.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setLogo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Oops!', 'Unable to open image library. Please try again.');
    }
  };

  const nextStep = () => {
    if (step === 1 && !isStep1Valid()) {
      const fieldError =
        validateField('name', form.name) ||
        validateField('email', form.email) ||
        validateField('mobile', form.mobile);
      Alert.alert(
        'Oops!',
        fieldError || 'Please verify your email with OTP before continuing.',
      );
      return;
    }
    if (step === 2 && !isStep2Valid()) {
      Alert.alert(
        'Oops!',
        validateField('companyName', form.companyName) ||
          'Please select a chapter.',
      );
      return;
    }
    if (step === 3 && !isStep4Valid()) {
      Alert.alert(
        'Oops!',
        validateField('password', form.password) ||
          validateField('confirmPassword', form.confirmPassword) ||
          'Please complete your account setup.',
      );
      return;
    }

    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(step + 1);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const prevStep = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(step - 1);
      slideAnim.setValue(-width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCitySelect = async city => {
    try {
      console.log('Selected City:', city);

      setSelectedCity(city);

      setForm(prev => ({
        ...prev,
        city: city,
        chapterId: '',
      }));

      setCityDropdownVisible(false);

      setFilteredChapters([]);

      const response = await fetch(
        `${API_URL}chapters/chapters-by-city/${city}`,
      );

      const data = await response.json();

      console.log('Chapters API Response:', data);

      if (data.success) {
        setFilteredChapters(data.data);
      } else {
        setFilteredChapters([]);
      }
    } catch (error) {
      console.log('Chapter Fetch Error:', error);

      Alert.alert('Oops!', getFriendlyErrorMessage(error));
      setFilteredChapters([]);
    }
  };
  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_URL}chapters/cities`);

      const data = await response.json();

      if (data.success) {
        setCities(data.data);
      }
    } catch (error) {
      console.log('Cities error:', error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    }
  };

  const openCityDropdown = () => setCityDropdownVisible(true);
  const closeCityDropdown = () => setCityDropdownVisible(false);
  const openChapterDropdown = () => {
    if (!selectedCity) {
      Alert.alert('Select City', 'Please select city first');
      return;
    }
    setChapterDropdownVisible(true);
  };
  const closeChapterDropdown = () => setChapterDropdownVisible(false);
  const selectChapter = ch => {
    handleChange('chapterId', ch._id);
    setChapterDropdownVisible(false);
  };
  const toggleShowPassword = () => setShowPassword(prev => !prev);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(prev => !prev);
  const closeOtpModal = () => setOtpModal(false);

  const showChaptersSlowNotice = useDelayedNotice(chaptersLoading, 8000);

  const guardedSendOtp = useGuardedAction(sendOtp);
  const guardedNextStep = useGuardedAction(nextStep);
  const guardedPrevStep = useGuardedAction(prevStep);
  const guardedPickImage = useGuardedAction(pickImage);
  const guardedOpenCityDropdown = useGuardedAction(openCityDropdown, 250);
  const guardedCloseCityDropdown = useGuardedAction(closeCityDropdown, 250);
  const guardedHandleCitySelect = useGuardedAction(handleCitySelect);
  const guardedFetchChapters = useGuardedAction(fetchChapters);
  const guardedOpenChapterDropdown = useGuardedAction(openChapterDropdown, 250);
  const guardedCloseChapterDropdown = useGuardedAction(closeChapterDropdown, 250);
  const guardedSelectChapter = useGuardedAction(selectChapter, 250);
  const guardedHandlePayment = useGuardedAction(handlePayment);
  const guardedToggleShowPassword = useGuardedAction(toggleShowPassword, 250);
  const guardedToggleShowConfirmPassword = useGuardedAction(
    toggleShowConfirmPassword,
    250,
  );
  const guardedCloseOtpModal = useGuardedAction(closeOtpModal, 250);
  const guardedVerifyOtp = useGuardedAction(verifyOtp);


  const STEP_META = [
    { title: 'Personal Details', icon: 'person-outline' },
    { title: 'Business Details', icon: 'business-outline' },
    { title: 'Account Setup', icon: 'lock-closed-outline' },
    { title: 'Registration Fee', icon: 'card-outline' },
  ];
  const currentStep = STEP_META[step - 1];

  const selectedChapterName = form.chapterId
    ? filteredChapters.find(ch => ch._id === form.chapterId)?.name
    : '';

  return (
    <ImageBackground
      source={require('../Images/bgimage2.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <KeyboardScreen>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Create Account</Text>
          <Text style={styles.subHeader}>
            Step {step} of {STEP_META.length}
          </Text>

          <View style={styles.progressRow}>
            {STEP_META.map((s, i) => (
              <View
                key={s.title}
                style={[
                  styles.progressSegment,
                  i < step && styles.progressSegmentActive,
                  i === STEP_META.length - 1 && { marginRight: 0 },
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[styles.card, { transform: [{ translateX: slideAnim }] }]}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <Icon name={currentStep.icon} size={20} color="#0B3D2E" />
              </View>
              <Text style={styles.title}>{currentStep.title}</Text>
            </View>

            {/* STEP 1 - PERSONAL DETAILS */}
            {step === 1 && (
              <>
                <View style={[styles.field, errors.name && styles.fieldError]}>
                  <Icon name="person-outline" size={18} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Full Name"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    style={styles.fieldInput}
                    value={form.name}
                    onChangeText={v => handleChange('name', v)}
                  />
                </View>
                {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

                <View
                  style={[
                    styles.field,
                    errors.email && styles.fieldError,
                    otpVerified && styles.fieldVerified,
                  ]}
                >
                  <Icon name="mail-outline" size={18} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    style={styles.fieldInput}
                    value={form.email}
                    onChangeText={v => handleChange('email', v)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {otpVerified && (
                    <Icon name="checkmark-circle" size={20} color="#1f8a4c" />
                  )}
                </View>
                {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

                {!otpVerified && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      otpLoading && styles.disabledButton,
                    ]}
                    onPress={guardedSendOtp}
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <ActivityIndicator color="#0B3D2E" />
                    ) : (
                      <Text style={styles.secondaryButtonText}>Verify Email</Text>
                    )}
                  </TouchableOpacity>
                )}

                {otpError ? <Text style={styles.error}>{otpError}</Text> : null}

                {otpVerified && (
                  <Text style={styles.success}>✔ Email Verified</Text>
                )}

                <View style={[styles.field, errors.mobile && styles.fieldError]}>
                  <Icon name="call-outline" size={18} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Mobile Number"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChangeText={v =>
                      handleChange('mobile', v.replace(/[^0-9]/g, '').slice(0, 10))
                    }
                  />
                </View>
                {errors.mobile ? <Text style={styles.error}>{errors.mobile}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, !isStep1Valid() && styles.disabledButton]}
                  disabled={!isStep1Valid()}
                  onPress={guardedNextStep}
                >
                  <Text style={styles.buttonText}>Next →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 - BUSINESS DETAILS */}
            {step === 2 && (
              <>
                <View
                  style={[styles.field, errors.companyName && styles.fieldError]}
                >
                  <Icon name="business-outline" size={18} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Company Name"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    style={styles.fieldInput}
                    value={form.companyName}
                    onChangeText={v => handleChange('companyName', v)}
                  />
                </View>
                {errors.companyName ? (
                  <Text style={styles.error}>{errors.companyName}</Text>
                ) : null}

                <TouchableOpacity style={styles.upload} onPress={guardedPickImage}>
                  {logo?.uri ? (
                    <Image
                      source={{ uri: logo.uri }}
                      style={styles.logoPreview}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="cloud-upload-outline" size={26} color="#0B3D2E" />
                  )}
                  <Text style={styles.uploadText}>
                    {logo ? 'Change Company Logo' : 'Upload Company Logo'}
                  </Text>
                  {!logo && <Text style={styles.uploadHint}>Optional</Text>}
                </TouchableOpacity>

                {/* CITY DROPDOWN */}
                <TouchableOpacity
                  style={styles.field}
                  onPress={
                    cityDropdownVisible
                      ? guardedCloseCityDropdown
                      : guardedOpenCityDropdown
                  }
                >
                  <Icon name="location-outline" size={18} style={styles.fieldIcon} />
                  <Text
                    style={[
                      styles.fieldValue,
                      !selectedCity && styles.fieldPlaceholder,
                    ]}
                  >
                    {selectedCity || 'Select City'}
                  </Text>
                  <Icon
                    name={cityDropdownVisible ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#4a5a52"
                  />
                </TouchableOpacity>

                {cityDropdownVisible && (
                  <View style={styles.dropdownPanel}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {cities.length > 0 ? (
                        cities.map((city, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              selectedCity === city && styles.dropdownItemSelected,
                            ]}
                            onPress={() => guardedHandleCitySelect(city)}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedCity === city &&
                                  styles.dropdownItemTextSelected,
                              ]}
                            >
                              {city}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noChapers}>No cities available</Text>
                      )}
                    </ScrollView>
                  </View>
                )}

                {chaptersLoading ? (
                  <>
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#0B3D2E" size="small" />
                      <Text style={styles.loading}>Loading chapters...</Text>
                    </View>
                    {showChaptersSlowNotice && (
                      <Text style={styles.loading}>
                        Still working on it — this is taking longer than
                        expected. Please check your connection.
                      </Text>
                    )}
                  </>
                ) : chaptersError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {chaptersError}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={guardedFetchChapters}
                    >
                      <Text style={styles.buttonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.field, !selectedCity && styles.fieldDisabled]}
                      onPress={
                        chapterDropdownVisible
                          ? guardedCloseChapterDropdown
                          : guardedOpenChapterDropdown
                      }
                    >
                      <Icon name="people-outline" size={18} style={styles.fieldIcon} />
                      <Text
                        style={[
                          styles.fieldValue,
                          !selectedChapterName && styles.fieldPlaceholder,
                        ]}
                      >
                        {!selectedCity
                          ? 'Select City First'
                          : selectedChapterName || 'Select Chapter'}
                      </Text>
                      <Icon
                        name={chapterDropdownVisible ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#4a5a52"
                      />
                    </TouchableOpacity>

                    {chapterDropdownVisible && (
                      <View style={styles.dropdownPanel}>
                        <ScrollView
                          style={styles.dropdownScroll}
                          keyboardShouldPersistTaps="handled"
                          nestedScrollEnabled
                        >
                          {filteredChapters && filteredChapters.length > 0 ? (
                            filteredChapters.map(ch => (
                              <TouchableOpacity
                                key={ch._id}
                                style={[
                                  styles.dropdownItem,
                                  form.chapterId === ch._id &&
                                    styles.dropdownItemSelected,
                                ]}
                                onPress={() => guardedSelectChapter(ch)}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    form.chapterId === ch._id &&
                                      styles.dropdownItemTextSelected,
                                  ]}
                                >
                                  {ch.name} - {ch.city}
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noChapers}>
                              No chapters available
                            </Text>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.row}>
                  <TouchableOpacity style={styles.back} onPress={guardedPrevStep}>
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.rowButton,
                      !isStep2Valid() && styles.disabledButton,
                    ]}
                    disabled={!isStep2Valid()}
                    onPress={guardedNextStep}
                  >
                    <Text style={styles.buttonText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP 3 - ACCOUNT SETUP */}
            {step === 3 && (
              <>
                <View style={styles.field}>
                  <Icon name="lock-closed-outline" size={18} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    secureTextEntry={!showPassword}
                    style={styles.fieldInput}
                    value={form.password}
                    onChangeText={v => handleChange('password', v)}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={guardedToggleShowPassword}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#4a5a52"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Icon name="lock-closed-outline" size={18} style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.fieldInput}
                    value={form.confirmPassword}
                    onChangeText={v => handleChange('confirmPassword', v)}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={guardedToggleShowConfirmPassword}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#4a5a52"
                    />
                  </TouchableOpacity>
                </View>

                {form.password && form.password.length < PASSWORD_MIN_LENGTH ? (
                  <Text style={styles.error}>
                    Password must be at least {PASSWORD_MIN_LENGTH} characters
                  </Text>
                ) : null}
                {form.password &&
                form.confirmPassword &&
                form.password !== form.confirmPassword ? (
                  <Text style={styles.error}>❌ Passwords don't match</Text>
                ) : null}
                {isStep4Valid() && (
                  <Text style={styles.success}>✅ Passwords match</Text>
                )}

                <View style={styles.row}>
                  <TouchableOpacity style={styles.back} onPress={guardedPrevStep}>
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.rowButton,
                      !isStep4Valid() && styles.disabledButton,
                    ]}
                    disabled={!isStep4Valid()}
                    onPress={guardedNextStep}
                  >
                    <Text style={styles.buttonText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP 4 - REGISTRATION FEE */}
            {step === 4 && (
              <>
                <View style={styles.feeCard}>
                  {feeLoading ? (
                    <ActivityIndicator color="#0B3D2E" />
                  ) : feeError || !registrationFee ? (
                    <TouchableOpacity onPress={fetchRegistrationFee}>
                      <Text style={styles.feeErrorText}>
                        {feeError || 'Unable to load the registration fee.'} Tap
                        to retry.
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>GBN Membership Fee</Text>
                        <Text style={styles.feeValue}>
                          ₹{registrationFee.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.feeDivider} />
                      <View style={styles.feeRow}>
                        <Text style={styles.feeTotalLabel}>Total Payable</Text>
                        <Text style={styles.feeTotalValue}>
                          ₹{registrationFee.toFixed(2)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.secureBadge}>
                  <Icon name="shield-checkmark" size={16} color="#0B3D2E" />
                  <Text style={styles.secureBadgeText}>
                    Secured by Razorpay — Cards, UPI, Netbanking & Wallets
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.payNowButton,
                    (paymentProcessing || feeLoading || !registrationFee) &&
                      styles.disabledButton,
                  ]}
                  onPress={guardedHandlePayment}
                  disabled={paymentProcessing || feeLoading || !registrationFee}
                >
                  <Text style={styles.payNowText}>
                    {paymentProcessing
                      ? 'Processing...'
                      : feeLoading
                      ? 'Loading fee...'
                      : !registrationFee
                      ? 'Fee unavailable'
                      : `Pay ₹${registrationFee.toFixed(2)} & Register`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.back, styles.backFull]}
                  onPress={guardedPrevStep}
                  disabled={paymentProcessing}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={paymentProcessing || loading}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardScreen>

      {/* OTP MODAL */}
      <Modal
        visible={otpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOtpModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={guardedCloseOtpModal}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              We sent a code to {form.email}
            </Text>

            {otpSuccessMessage ? (
              <Text style={styles.success}>{otpSuccessMessage}</Text>
            ) : null}

            <TextInput
              style={styles.otpInput}
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.otp}
              onChangeText={v => handleChange('otp', v)}
              keyboardType="numeric"
              placeholder="Enter OTP"
              maxLength={6}
            />

            {verifyError ? <Text style={styles.error}>{verifyError}</Text> : null}

            <TouchableOpacity
              style={[styles.button, verifyLoading && styles.disabledButton]}
              onPress={guardedVerifyOtp}
              disabled={verifyLoading}
            >
              {verifyLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const PLACEHOLDER_COLOR = '#7b8a83';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4ef',
  },

  backgroundImage: {
    opacity: 0.16,
  },

  // flexGrow + center keeps the card vertically centered when it's short,
  // while still letting it scroll when a step (or the keyboard) makes it tall.
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  header: {
    color: '#0B3D2E',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  subHeader: {
    color: '#4a5a52',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },

  progressRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(11,61,46,0.15)',
    marginRight: 6,
  },

  progressSegmentActive: {
    backgroundColor: '#0B3D2E',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(11,61,46,0.08)',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f1ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  title: {
    fontWeight: '800',
    fontSize: 20,
    color: '#0B3D2E',
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cde2d7',
    backgroundColor: '#f6fbf8',
    borderRadius: 14,
    marginTop: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },

  fieldError: {
    borderColor: '#e57373',
  },

  fieldVerified: {
    borderColor: '#1f8a4c',
  },

  fieldDisabled: {
    opacity: 0.6,
  },

  fieldIcon: {
    color: '#0B3D2E',
    marginRight: 10,
  },

  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#122620',
  },

  fieldValue: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#122620',
  },

  fieldPlaceholder: {
    color: PLACEHOLDER_COLOR,
  },

  button: {
    backgroundColor: '#0B3D2E',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#0B3D2E',
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#0B3D2E',
    fontWeight: 'bold',
    fontSize: 15,
  },

  disabledButton: {
    backgroundColor: '#b8c7be',
    borderColor: '#b8c7be',
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowButton: {
    flex: 2,
  },

  back: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0B3D2E',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 20,
    marginRight: 10,
    alignItems: 'center',
  },

  backFull: {
    flex: 0,
    marginRight: 0,
    marginTop: 12,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  backText: {
    color: '#0B3D2E',
    fontWeight: 'bold',
    fontSize: 15,
  },

  upload: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9cc3b0',
    backgroundColor: '#fbfdfb',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 12,
    alignItems: 'center',
  },

  uploadText: {
    color: '#0B3D2E',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 6,
  },

  uploadHint: {
    color: PLACEHOLDER_COLOR,
    fontSize: 12,
    marginTop: 2,
  },

  logoPreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },

  success: {
    color: '#1f8a4c',
    marginTop: 10,
    fontWeight: '600',
  },

  error: {
    color: '#c62828',
    marginTop: 5,
    marginLeft: 4,
    fontSize: 12,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  loading: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
    marginLeft: 8,
  },

  dropdownPanel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d6e8de',
    marginTop: 6,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  dropdownScroll: {
    maxHeight: 220,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  dropdownItemSelected: {
    backgroundColor: '#f0f8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#0B3D2E',
  },

  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },

  dropdownItemTextSelected: {
    color: '#0B3D2E',
    fontWeight: 'bold',
  },

  eyeButton: {
    padding: 8,
  },

  noChapers: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },

  errorBox: {
    backgroundColor: '#ffe6e6',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  errorText: {
    color: '#c92a2a',
    fontSize: 14,
    marginBottom: 10,
  },

  retryButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },

  loginLinkText: {
    color: '#4a5a52',
    fontSize: 14,
  },

  loginLinkBold: {
    color: '#0B3D2E',
    fontWeight: '800',
  },

  // OTP MODAL
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },

  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B3D2E',
  },

  modalSubtitle: {
    fontSize: 13,
    color: '#4a5a52',
    marginTop: 6,
  },

  otpInput: {
    borderWidth: 1,
    borderColor: '#cde2d7',
    backgroundColor: '#f6fbf8',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 16,
    color: '#122620',
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
  },

  // 💳 REGISTRATION FEE / RAZORPAY PAYMENT STYLES
  feeCard: {
    backgroundColor: '#f6fbf8',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2ECE6',
  },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  feeDivider: {
    height: 1,
    backgroundColor: '#dbe8e1',
    marginVertical: 6,
  },

  feeLabel: {
    fontSize: 15,
    color: '#4a5a52',
  },

  feeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#122620',
  },

  feeTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B3D2E',
  },

  feeTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B3D2E',
  },

  feeErrorText: {
    fontSize: 14,
    color: '#b3261e',
    textAlign: 'center',
  },

  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },

  secureBadgeText: {
    color: '#4a5a52',
    fontSize: 12,
    marginLeft: 6,
    flexShrink: 1,
  },

  payNowButton: {
    backgroundColor: '#0B3D2E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },

  payNowText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

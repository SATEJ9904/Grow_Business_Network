import AsyncStorage from '@react-native-async-storage/async-storage';

// Razorpay checkout hands off to a UPI app or browser, which backgrounds
// this app mid-payment. App.js logs the user out on every background
// transition, so this flag (persisted, not module-scoped, since the RN
// process can be torn down and rebuilt during that handoff) tells it to
// skip the logout while a payment is actually in flight.
const PAYMENT_IN_FLIGHT_KEY = 'paymentInFlight';

export function markPaymentInFlight() {
  return AsyncStorage.setItem(PAYMENT_IN_FLIGHT_KEY, '1');
}

export function clearPaymentInFlight() {
  return AsyncStorage.removeItem(PAYMENT_IN_FLIGHT_KEY);
}

export async function isPaymentInFlight() {
  return (await AsyncStorage.getItem(PAYMENT_IN_FLIGHT_KEY)) === '1';
}

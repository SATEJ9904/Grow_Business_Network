import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import { API_BASE_URL as BASE_URL, getAssetUrl } from './utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from './utils/guards';
import CountdownTimer from './CountdownTimer';

/**
 * Shared meeting card used by both MeetingsScreen and NotificationsScreen
 * (and the global MeetingPopup) so the flyer/details/countdown/seat-button
 * presentation and the Razorpay booking flow live in exactly one place.
 */
// Real flyers range from tall vertical posters to wide banners. Clamp the
// measured ratio to sane bounds so a pathological image (e.g. a near-square
// screenshot mistakenly uploaded) can't collapse the card or blow past the
// screen height.
const MIN_FLYER_RATIO = 0.55; // tall vertical flyer
const MAX_FLYER_RATIO = 2.2; // wide landscape banner
const DEFAULT_FLYER_RATIO = 343 / 190; // previous fixed-size look, used until measured

// Mirrors backend/config/meetingFees.js so the breakdown shown here matches
// what create-order actually charges. gstPercent is admin-set per meeting
// (Meeting.gstPercent); Razorpay's own commission + GST on that commission
// stay fixed platform costs.
const RAZORPAY_COMMISSION_RATE = 0.02;
const RAZORPAY_COMMISSION_GST_RATE = 0.18;
const round2 = value => Math.round(value * 100) / 100;

const getFeeBreakdown = (fee, gstPercent) => {
  const baseAmount = fee;
  const resolvedGstPercent = gstPercent || 0;
  const gstAmount = round2(baseAmount * (resolvedGstPercent / 100));
  const commission = round2(baseAmount * RAZORPAY_COMMISSION_RATE);
  const commissionGst = round2(commission * RAZORPAY_COMMISSION_GST_RATE);
  const total = round2(baseAmount + gstAmount + commission + commissionGst);

  return { baseAmount, gstPercent: resolvedGstPercent, gstAmount, commission, commissionGst, total };
};

const MeetingCard = ({ meeting, onBooked, showNewBadge, collapsible = false }) => {
  const [processing, setProcessing] = useState(false);
  const [flyerRatio, setFlyerRatio] = useState(DEFAULT_FLYER_RATIO);
  const [expanded, setExpanded] = useState(!collapsible);

  useEffect(() => {
    const uri = getAssetUrl(meeting.flyerImage);
    if (!uri) return;

    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        if (cancelled || !width || !height) return;
        const ratio = Math.min(MAX_FLYER_RATIO, Math.max(MIN_FLYER_RATIO, width / height));
        setFlyerRatio(ratio);
      },
      () => {
        // Non-fatal — keep the default ratio if dimensions can't be read.
      },
    );

    return () => {
      cancelled = true;
    };
  }, [meeting.flyerImage]);

  const meetingDateLabel = new Date(meeting.meetingDateTime).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleBookSeat = async () => {
    setProcessing(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');

      const orderResponse = await fetch(`${BASE_URL}meetings/${meeting._id}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        Alert.alert('Oops!', orderData.message || 'Unable to start payment. Please try again.');
        setProcessing(false);
        return;
      }

      const { orderId, amount, currency, keyId } = orderData.data;

      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'GBN Social Association',
        description: meeting.name,
        theme: { color: '#17310F' },
      };

      RazorpayCheckout.open(options)
        .then(async paymentData => {
          try {
            const verifyResponse = await fetch(
              `${BASE_URL}meetings/${meeting._id}/verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpayOrderId: paymentData.razorpay_order_id,
                  razorpayPaymentId: paymentData.razorpay_payment_id,
                  razorpaySignature: paymentData.razorpay_signature,
                }),
              },
            );
            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onBooked?.(meeting._id);
              Alert.alert('Seat Booked!', 'Your seat is confirmed. A receipt has been emailed to you.');
            } else {
              Alert.alert(
                'Payment Verification Failed',
                verifyData.message ||
                  'We could not confirm your payment. Please contact support with your payment ID.',
              );
            }
          } catch (verifyError) {
            Alert.alert('Oops!', getFriendlyErrorMessage(verifyError));
          } finally {
            setProcessing(false);
          }
        })
        .catch(error => {
          setProcessing(false);
          if (error?.code !== 0) {
            Alert.alert(
              'Payment Failed',
              error?.description || 'Payment could not be completed. Please try again.',
            );
          }
        });
    } catch (error) {
      Alert.alert('Oops!', getFriendlyErrorMessage(error, 'Network error while starting payment.'));
      setProcessing(false);
    }
  };

  const guardedBookSeat = useGuardedAction(handleBookSeat);
  const toggleExpanded = () => {
    if (collapsible) setExpanded(prev => !prev);
  };

  const buttonLabel = meeting.isBooked
    ? 'Your Seat is Booked'
    : meeting.isPast
    ? 'Meeting Ended'
    : processing
    ? 'Processing...'
    : 'Book a Seat';

  const buttonDisabled = meeting.isBooked || meeting.isPast || processing;

  const feeBreakdown = getFeeBreakdown(meeting.fee, meeting.gstPercent);

  if (collapsible && !expanded) {
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.collapsedCard} onPress={toggleExpanded}>
        {showNewBadge && !meeting.isSeen && (
          <View style={styles.collapsedNewBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        <Image
          source={{ uri: getAssetUrl(meeting.flyerImage) }}
          style={styles.collapsedFlyer}
          resizeMode="cover"
        />

        <View style={styles.collapsedContent}>
          <Text style={styles.collapsedName} numberOfLines={1}>
            {meeting.name}
          </Text>
          <Text style={styles.collapsedSubtext} numberOfLines={1}>
            {meeting.description || `${meetingDateLabel} · ${meeting.venue}`}
          </Text>

          <View style={styles.collapsedFooterRow}>
            <CountdownTimer targetDateTime={meeting.meetingDateTime} compact />

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.collapsedSeatButton, buttonDisabled && styles.seatButtonDisabled]}
              onPress={guardedBookSeat}
              disabled={buttonDisabled}
            >
              <Text style={styles.collapsedSeatButtonText} numberOfLines={1}>
                {buttonLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const FlyerWrapper = collapsible ? TouchableOpacity : View;
  const flyerWrapperProps = collapsible ? { activeOpacity: 0.9, onPress: toggleExpanded } : {};

  return (
    <View style={styles.card}>
      {showNewBadge && !meeting.isSeen && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}

      <FlyerWrapper style={[styles.flyerWrap, { aspectRatio: flyerRatio }]} {...flyerWrapperProps}>
        <Image source={{ uri: getAssetUrl(meeting.flyerImage) }} style={styles.flyer} resizeMode="cover" />
        <View style={styles.flyerOverlay}>
          <Text style={styles.meetingName} numberOfLines={2}>
            {meeting.name}
          </Text>
          <Text style={styles.chapterBadge}>
            {meeting.chapterName} • {meeting.city}
          </Text>
        </View>
      </FlyerWrapper>

      <View style={styles.content}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            {meetingDateLabel} · {meeting.meetingTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{meeting.venue}</Text>
        </View>
        {meeting.description ? <Text style={styles.description}>{meeting.description}</Text> : null}

        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Final Amount</Text>
            <Text style={styles.feeTotalValue}>₹{feeBreakdown.total}</Text>
          </View>
        </View>

        <View style={styles.countdownWrap}>
          <CountdownTimer targetDateTime={meeting.meetingDateTime} />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.seatButton, buttonDisabled && styles.seatButtonDisabled]}
          onPress={guardedBookSeat}
          disabled={buttonDisabled}
        >
          <Text style={styles.seatButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MeetingCard;

const styles = StyleSheet.create({
  collapsedCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEF2EF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  collapsedNewBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  collapsedFlyer: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#17310F',
  },
  collapsedContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  collapsedName: {
    color: '#122620',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  collapsedSubtext: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  collapsedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  collapsedSeatButton: {
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginLeft: 8,
    flexShrink: 1,
  },
  collapsedSeatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2EF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  newBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  flyerWrap: {
    width: '100%',
    backgroundColor: '#17310F',
  },
  flyer: {
    width: '100%',
    height: '100%',
  },
  flyerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(4,17,9,0.72)',
  },
  meetingName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  chapterBadge: {
    color: '#D8E6DD',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  description: {
    color: '#5B6470',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  feeCard: {
    backgroundColor: '#F7F9F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7ECE9',
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3D2E',
  },
  feeTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B3D2E',
  },
  countdownWrap: {
    marginTop: 8,
    marginBottom: 16,
  },
  seatButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatButtonDisabled: {
    backgroundColor: '#0B6E4F',
  },
  seatButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

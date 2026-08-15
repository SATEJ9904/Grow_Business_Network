import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';

/**
 * Card for an admin-composed announcement (subject/message/optional CTA
 * button), shown alongside MeetingCard items in the unified Notifications
 * feed.
 */
const NotificationCard = ({ notification, showNewBadge }) => {
  const sentLabel = notification.sentAt
    ? new Date(notification.sentAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handlePressButton = async () => {
    const url = notification.buttonLink;
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Oops!', 'This link could not be opened.');
      }
    } catch (error) {
      Alert.alert('Oops!', 'This link could not be opened.');
    }
  };

  return (
    <View style={styles.card}>
      {showNewBadge && !notification.isSeen && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}

      <View style={styles.iconWrap}>
        <Text style={styles.icon}>📣</Text>
      </View>

      <Text style={styles.subject}>{notification.subject}</Text>
      {sentLabel ? <Text style={styles.timestamp}>{sentLabel}</Text> : null}
      <Text style={styles.message}>{notification.message}</Text>

      {notification.buttonLabel && notification.buttonLink ? (
        <TouchableOpacity activeOpacity={0.9} style={styles.ctaButton} onPress={handlePressButton}>
          <Text style={styles.ctaButtonText}>{notification.buttonLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default NotificationCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 18,
    padding: 18,
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 18,
  },
  subject: {
    color: '#122620',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  timestamp: {
    color: '#8792A6',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  message: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginTop: 10,
  },
  ctaButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#17310F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

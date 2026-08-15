import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from '../utils/apiConfig';
import { useDelayedNotice, getFriendlyErrorMessage } from '../utils/guards';
import MeetingCard from '../MeetingCard';

const MeetingsScreen = ({ navigation }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    fetchMeetings();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();

      if (json.success) {
        setMeetings(json.data || []);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.log('Meetings fetch error:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBooked = meetingId => {
    setMeetings(prev =>
      prev.map(m => (m._id === meetingId ? { ...m, isBooked: true } : m)),
    );
  };

  const showSlowNotice = useDelayedNotice(loading, 8000);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.circleOne} />
        <View style={styles.circleTwo} />

        <View style={styles.headerTop}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Chapter</Text>
        <Text style={styles.heading}>Meetings</Text>
        <Text style={styles.subHeading}>
          Every meeting scheduled for your chapter, with live seat booking.
        </Text>
      </View>

      {loading ? (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#17310F" />
          {showSlowNotice && (
            <Text style={[styles.emptyStateText, { marginTop: 12 }]}>
              Still working on it — this is taking longer than expected.
              Please check your connection.
            </Text>
          )}
        </View>
      ) : meetings.length > 0 ? (
        <Animated.FlatList
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          data={meetings}
          renderItem={({ item }) => <MeetingCard meeting={item} onBooked={handleBooked} />}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No meetings have been scheduled for your chapter yet.
          </Text>
        </View>
      )}
    </View>
  );
};

export default MeetingsScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F5F4',
  },
  header: {
    backgroundColor: '#17310F',
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  circleOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 200,
    backgroundColor: 'rgba(255,107,0,0.06)',
    right: -80,
    top: -60,
  },
  circleTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 120,
    backgroundColor: 'rgba(72,255,133,0.05)',
    left: -60,
    bottom: -60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -1.2,
  },
  subHeading: {
    marginTop: 14,
    color: '#B6C4BB',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    width: '92%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
});

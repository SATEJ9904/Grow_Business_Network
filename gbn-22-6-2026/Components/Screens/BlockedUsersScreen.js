import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL as BASE_URL, getAssetUrl } from '../utils/apiConfig';
import { useGuardedAction, getFriendlyErrorMessage } from '../utils/guards';

export default function BlockedUsersScreen({ navigation }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlockedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}moderation/my-blocked-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedUsers(response.data?.data || []);
    } catch (error) {
      console.log('BlockedUsersScreen load error:', error);
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = async userId => {
    setUnblockingId(userId);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.delete(`${BASE_URL}moderation/personal-block/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      Alert.alert('Oops!', getFriendlyErrorMessage(error));
    } finally {
      setUnblockingId(null);
    }
  };

  const confirmUnblock = user => {
    Alert.alert(
      `Unblock ${user.name}?`,
      'You’ll be able to see their profile and hear from them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: () => handleUnblock(user._id) },
      ],
    );
  };

  const guardedGoBack = useGuardedAction(() => navigation.goBack());

  const renderItem = ({ item }) => {
    const guardedUnblock = () => confirmUnblock(item);
    return (
      <View style={styles.row}>
        <Image
          source={
            item.profileImage
              ? { uri: getAssetUrl(item.profileImage) }
              : { uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }
          }
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          {!!item.companyName && <Text style={styles.company}>{item.companyName}</Text>}
        </View>
        <TouchableOpacity
          style={styles.unblockBtn}
          activeOpacity={0.85}
          onPress={guardedUnblock}
          disabled={unblockingId === item._id}
        >
          {unblockingId === item._id ? (
            <ActivityIndicator size="small" color="#0B3D2E" />
          ) : (
            <Text style={styles.unblockText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#17310F" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={guardedGoBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Blocked Users</Text>
        <Text style={styles.subHeading}>Members you’ve blocked won’t appear in your directory.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#17310F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="shield-checkmark-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No blocked users</Text>
              <Text style={styles.emptyText}>Members you block will show up here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

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
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subHeading: {
    marginTop: 8,
    color: '#B6C4BB',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: '#E5E7EB',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  company: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0B3D2E',
    minWidth: 84,
    alignItems: 'center',
  },
  unblockText: {
    color: '#0B3D2E',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
});

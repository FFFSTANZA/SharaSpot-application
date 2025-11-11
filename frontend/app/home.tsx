import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Charger {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  port_types: string[];
  available: boolean;
  distance?: number;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChargers();
  }, []);

  const loadChargers = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/chargers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChargers(response.data);
    } catch (error: any) {
      console.error('Load chargers error:', error);
      Alert.alert('Error', 'Failed to load charging stations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChargers();
  };

  const handleAddCharger = () => {
    if (user?.is_guest) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add charging stations',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => handleLogout() },
        ]
      );
      return;
    }
    Alert.alert('Coming Soon', 'Add charger feature will be available in the next module');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const renderCharger = ({ item }: { item: Charger }) => (
    <View style={styles.chargerCard}>
      <View style={styles.chargerHeader}>
        <View style={styles.chargerIcon}>
          <Ionicons name="flash" size={24} color="#4CAF50" />
        </View>
        <View style={styles.chargerInfo}>
          <Text style={styles.chargerName}>{item.name}</Text>
          <Text style={styles.chargerAddress}>{item.address}</Text>
        </View>
        <View style={[styles.statusBadge, !item.available && styles.statusBadgeOccupied]}>
          <Text style={[styles.statusText, !item.available && styles.statusTextOccupied]}>
            {item.available ? 'Available' : 'Occupied'}
          </Text>
        </View>
      </View>

      <View style={styles.chargerDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="locate" size={16} color="#666666" />
          <Text style={styles.detailText}>{item.distance} {user?.distance_unit || 'km'} away</Text>
        </View>
        <View style={styles.portTypesContainer}>
          {item.port_types.map((type, index) => (
            <View key={index} style={styles.portTypeBadge}>
              <Text style={styles.portTypeText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.navigateButton}>
        <Ionicons name="navigate" size={16} color="#4CAF50" />
        <Text style={styles.navigateText}>Navigate</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.homeHeader}>
      <View>
        <Text style={styles.greeting}>Hello, {user?.name || 'Guest'}!</Text>
        <Text style={styles.subtitle}>Find nearby charging stations</Text>
      </View>
      <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
        <Ionicons name="person-circle" size={40} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chargers}
        renderItem={renderCharger}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flash-off" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No charging stations found</Text>
          </View>
        }
      />

      {user?.is_guest && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.guestBannerText}>Guest mode - Sign in for full features</Text>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddCharger}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 100,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  chargerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chargerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chargerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chargerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chargerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  chargerAddress: {
    fontSize: 14,
    color: '#666666',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeOccupied: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  statusTextOccupied: {
    color: '#C62828',
  },
  chargerDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  portTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portTypeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  portTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navigateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
  guestBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

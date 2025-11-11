import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, RefreshControl, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { VerificationBadge } from '../components/VerificationBadge';
import { AmenitiesIcons } from '../components/AmenitiesIcons';
import { FilterModal, Filters } from '../components/FilterModal';

// Conditional import for MapView (mobile only)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

interface Charger {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  port_types: string[];
  available_ports: number;
  total_ports: number;
  source_type: string;
  verification_level: number;
  added_by?: string;
  amenities: string[];
  last_verified?: string;
  uptime_percentage: number;
  distance?: number;
  created_at: string;
}

type ViewMode = 'map' | 'list';

const VERIFICATION_COLORS = {
  1: '#F44336',
  2: '#FF9800',
  3: '#FFC107',
  4: '#8BC34A',
  5: '#4CAF50',
};

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    verificationLevel: null,
    portType: null,
    amenity: null,
    maxDistance: null,
  });

  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    loadChargers();
  }, [filters]);

  const loadChargers = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      // Build query params
      const params: any = {};
      if (filters.verificationLevel !== null) params.verification_level = filters.verificationLevel;
      if (filters.portType !== null) params.port_type = filters.portType;
      if (filters.amenity !== null) params.amenity = filters.amenity;
      if (filters.maxDistance !== null) params.max_distance = filters.maxDistance;

      const response = await axios.get(`${API_URL}/api/chargers`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
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
        'Please sign in to add hidden chargers',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => handleLogout() },
        ]
      );
      return;
    }
    Alert.alert('Coming Soon', 'Add hidden charger feature will be available in the next module');
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

  const handleChargerPress = (charger: Charger) => {
    router.push({
      pathname: '/charger-detail',
      params: { charger: JSON.stringify(charger) },
    });
  };

  const handleFilterApply = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.verificationLevel !== null) count++;
    if (filters.portType !== null) count++;
    if (filters.amenity !== null) count++;
    if (filters.maxDistance !== null) count++;
    return count;
  };

  const renderChargerCard = ({ item }: { item: Charger }) => (
    <TouchableOpacity
      style={styles.chargerCard}
      onPress={() => handleChargerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconCircle}>
          <Ionicons name="flash" size={24} color="#4CAF50" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.chargerName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.chargerAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <VerificationBadge level={item.verification_level} size="small" />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="locate" size={14} color="#666666" />
          <Text style={styles.detailText}>
            {item.distance} {user?.distance_unit || 'km'} away
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons 
            name={item.available_ports > 0 ? "checkmark-circle" : "close-circle"} 
            size={14} 
            color={item.available_ports > 0 ? "#4CAF50" : "#F44336"} 
          />
          <Text style={styles.detailText}>
            {item.available_ports}/{item.total_ports} ports available
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.portTypes}>
          {item.port_types.slice(0, 3).map((type, index) => (
            <View key={index} style={styles.portBadge}>
              <Text style={styles.portBadgeText}>{type}</Text>
            </View>
          ))}
          {item.port_types.length > 3 && (
            <Text style={styles.moreText}>+{item.port_types.length - 3}</Text>
          )}
        </View>
        {item.amenities && item.amenities.length > 0 && (
          <AmenitiesIcons amenities={item.amenities} size={14} />
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.uptimeText}>{item.uptime_percentage}% uptime</Text>
          <Text style={styles.verifiedText}>
            • Verified {item.last_verified ? formatDate(item.last_verified) : 'N/A'}
          </Text>
        </View>
        <View style={[styles.sourceTag, item.source_type === 'official' ? styles.officialTag : styles.communityTag]}>
          <Text style={styles.sourceText}>
            {item.source_type === 'official' ? 'Official' : 'Community'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.homeHeader}>
      <View>
        <Text style={styles.greeting}>Hello, {user?.name || 'Guest'}!</Text>
        <Text style={styles.subtitle}>{chargers.length} charging stations nearby</Text>
      </View>
      <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
        <Ionicons name="person-circle" size={40} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );

  const renderMapView = () => {
    if (chargers.length === 0) return null;

    // Web fallback - show list of chargers with map placeholder
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.webMapFallback}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={64} color="#CCCCCC" />
            <Text style={styles.mapPlaceholderText}>Map view available on mobile</Text>
            <Text style={styles.mapPlaceholderSubtext}>Download Expo Go app to view interactive map</Text>
          </View>
        </View>
      );
    }

    const initialRegion = {
      latitude: chargers[0]?.latitude || 37.7749,
      longitude: chargers[0]?.longitude || -122.4194,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    return (
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {chargers.map((charger) => {
          const markerColor = VERIFICATION_COLORS[charger.verification_level as keyof typeof VERIFICATION_COLORS];
          return (
            <Marker
              key={charger.id}
              coordinate={{
                latitude: charger.latitude,
                longitude: charger.longitude,
              }}
              onPress={() => handleChargerPress(charger)}
            >
              <View style={[styles.markerContainer, { backgroundColor: markerColor }]}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}
      </MapView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel" size={20} color="#4CAF50" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* View Toggle & Content */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {renderMapView()}
        </View>
      ) : (
        <FlatList
          data={chargers}
          renderItem={renderChargerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flash-off" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No charging stations found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      {/* Guest Banner */}
      {user?.is_guest && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.guestBannerText}>Guest mode - Sign in to add chargers</Text>
        </View>
      )}

      {/* View Toggle Button */}
      <TouchableOpacity
        style={styles.viewToggle}
        onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
      >
        <Ionicons name={viewMode === 'map' ? 'list' : 'map'} size={24} color="#FFFFFF" />
        <Text style={styles.viewToggleText}>{viewMode === 'map' ? 'List' : 'Map'}</Text>
      </TouchableOpacity>

      {/* Add Hidden Charger FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddCharger}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Hidden Charger</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
      />
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
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  filterBadge: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 200,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  chargerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  chargerAddress: {
    fontSize: 13,
    color: '#666666',
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portTypes: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  portBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  portBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
  },
  moreText: {
    fontSize: 11,
    color: '#999999',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uptimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4CAF50',
  },
  verifiedText: {
    fontSize: 11,
    color: '#999999',
  },
  sourceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  officialTag: {
    backgroundColor: '#E3F2FD',
  },
  communityTag: {
    backgroundColor: '#FFF3E0',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
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
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  guestBanner: {
    position: 'absolute',
    bottom: 160,
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
  viewToggle: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

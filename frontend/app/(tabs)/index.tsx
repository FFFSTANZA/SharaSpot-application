import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, RefreshControl, Platform, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SessionManager } from '../../utils/secureStorage';
import axios from 'axios';
import Constants from 'expo-constants';
import { VerificationBadge } from '../../components/VerificationBadge';
import { AmenitiesIcons } from '../../components/AmenitiesIcons';
import { FilterModal, Filters } from '../../components/FilterModal';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

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
  1: '#9E9E9E',  // Grey - New Entry
  2: Colors.primary,  // Burnt Orange - Community Verified
  3: '#2196F3',  // Blue - Reliable
  4: '#FFB300',  // Gold - Trusted
  5: '#9C27B0',  // Platinum - Certified Partner
};

export default function Discover() {
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

  const mapRef = React.useRef<any>(null);

  useEffect(() => {
    loadChargers();
  }, [filters]);

  const loadChargers = async () => {
    try {
      const token = await SessionManager.getToken();

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
          <Ionicons name="flash" size={22} color="#06B6D4" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.chargerName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.chargerAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/verification-report',
              params: {
                charger: JSON.stringify(item),
              },
            });
          }}
          activeOpacity={0.7}
        >
          <VerificationBadge level={item.verification_level} size="small" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="locate" size={16} color="#666666" />
          <Text style={styles.detailText}>
            {item.distance} {user?.distance_unit || 'km'} away
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name={item.available_ports > 0 ? "checkmark-circle" : "close-circle"}
            size={16}
            color={item.available_ports > 0 ? Colors.accent : Colors.error}
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
          <AmenitiesIcons amenities={item.amenities} size={16} />
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
      latitude: chargers[0]?.latitude || 13.0827,
      longitude: chargers[0]?.longitude || 80.2707,
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {renderHeader()}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel" size={20} color={Colors.primary} />
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
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

      {/* View Toggle Button - Lowered Position */}
      <TouchableOpacity
        style={styles.viewToggle}
        onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        activeOpacity={0.85}
      >
        <Ionicons name={viewMode === 'map' ? 'list' : 'map'} size={22} color="#FFFFFF" />
        <Text style={styles.viewToggleText}>{viewMode === 'map' ? 'List View' : 'Map View'}</Text>
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
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#F8FAFC',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '400',
  },
  filterBar: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterBadge: {
    backgroundColor: '#3B82F6',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  listContent: {
    paddingBottom: 200,
  },
  chargerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CFFAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  chargerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  chargerAddress: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 19,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  portBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  moreText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uptimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  verifiedText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sourceTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  officialTag: {
    backgroundColor: '#DBEAFE',
  },
  communityTag: {
    backgroundColor: '#FEF3C7',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CBD5E1',
    marginTop: Spacing.sm,
  },
  guestBanner: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  viewToggle: {
    position: 'absolute',
    bottom: 20,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: Spacing.sm,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  viewToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  mapPlaceholderText: {
    ...Typography.titleMedium,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    ...Typography.bodyMedium,
    color: Colors.textDisabled,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

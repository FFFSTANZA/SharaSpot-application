import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { VerificationBadge } from '../components/VerificationBadge';
import { AmenitiesIcons } from '../components/AmenitiesIcons';
import { FilterModal, Filters } from '../components/FilterModal';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

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
  1: '#9E9E9E',      // Grey - New Entry
  2: Colors.primary,  // Electric Blue - Community Verified
  3: Colors.accent,   // Neon Cyan - Reliable
  4: Colors.accentGold, // Gold - Trusted
  5: Colors.secondary,  // Electric Purple - Certified Partner
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

  const mapRef = React.useRef<any>(null);

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
    router.push('/add-charger');
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
          <Ionicons name="flash" size={24} color={Colors.primary} />
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
          <Ionicons name="locate" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            {item.distance} {user?.distance_unit || 'km'} away
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name={item.available_ports > 0 ? "checkmark-circle" : "close-circle"}
            size={14}
            color={item.available_ports > 0 ? Colors.success : Colors.error}
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
      <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
        <Ionicons name="person-circle" size={40} color={Colors.primary} />
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flash-off" size={64} color={Colors.borderLight} />
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,           // 24px - using theme
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    ...Typography.headlineSmall,   // Enhanced typography
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodyMedium,      // Enhanced typography
    color: Colors.textSecondary,
    marginTop: Spacing['1'],       // 4px - using theme
  },
  profileButton: {
    padding: Spacing['1'],         // 4px - using theme
  },
  filterBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingVertical: Spacing['2.5'],  // 10px - using theme
    paddingHorizontal: Spacing.md,    // 16px - using theme
    borderRadius: BorderRadius.full,  // Perfect pill shape
    gap: Spacing.sm,                  // 8px - using theme
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    ...Typography.labelLarge,         // Enhanced typography (15px)
    color: Colors.successDark,
  },
  filterBadge: {
    backgroundColor: Colors.success,
    width: 22,                        // Slightly larger
    height: 22,                       // Slightly larger
    borderRadius: BorderRadius.full,  // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...Typography.labelSmall,         // Enhanced typography (11px)
    color: Colors.textInverse,
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
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  listContent: {
    paddingBottom: 200,
  },
  chargerCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,    // 16px - using theme
    marginTop: Spacing.md,           // 16px - using theme
    padding: Spacing.lg,             // 24px - improved padding
    borderRadius: BorderRadius.lg,   // 18px - more modern curves
    ...Shadows.md,                   // Enhanced HD shadows
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing['3'],      // 12px - using theme
  },
  cardIconCircle: {
    width: 44,                       // Improved touch target
    height: 44,                      // Improved touch target
    borderRadius: BorderRadius.full, // Perfect circle
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing['3'],       // 12px - using theme
  },
  cardInfo: {
    flex: 1,
  },
  chargerName: {
    ...Typography.titleMedium,      // Enhanced typography (20px)
    color: Colors.textPrimary,
    marginBottom: Spacing['1'],     // 4px - using theme
  },
  chargerAddress: {
    ...Typography.bodySmall,        // Enhanced typography (13px)
    color: Colors.textSecondary,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: Spacing.md,                // 16px - using theme
    marginBottom: Spacing['3'],     // 12px - using theme
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['1'],              // 4px - using theme
  },
  detailText: {
    ...Typography.labelMedium,      // Enhanced typography (13px)
    color: Colors.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  portTypes: {
    flexDirection: 'row',
    gap: Spacing['1.5'],
    alignItems: 'center',
  },
  portBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,    // 8px - using theme
    paddingVertical: Spacing['1'],    // 4px - using theme
    borderRadius: BorderRadius.xs,    // 6px - using theme
  },
  portBadgeText: {
    ...Typography.labelSmall,         // Enhanced typography (11px)
    color: Colors.textSecondary,
  },
  moreText: {
    ...Typography.labelSmall,         // Enhanced typography (11px)
    color: Colors.textTertiary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing['3'],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['1'],
  },
  uptimeText: {
    ...Typography.labelSmall,
    color: Colors.success,
  },
  verifiedText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  sourceTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['1'],
    borderRadius: BorderRadius.xs,
  },
  officialTag: {
    backgroundColor: Colors.primarySubtle,
  },
  communityTag: {
    backgroundColor: Colors.warningLight,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textDisabled,
    marginTop: Spacing.sm,
  },
  guestBanner: {
    position: 'absolute',
    bottom: 160,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.warningLight,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['3'],
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  guestBannerText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Colors.warningDark,
    fontWeight: '500',
  },
  viewToggle: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,                // 24px - using theme
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info,
    paddingVertical: Spacing['3'],    // 12px - using theme
    paddingHorizontal: Spacing.lg,    // 24px - improved padding
    borderRadius: BorderRadius.full,  // Perfect pill shape
    gap: Spacing.sm,                  // 8px - using theme
    ...Shadows.lg,                    // Enhanced HD shadows
  },
  viewToggleText: {
    ...Typography.labelLarge,         // Enhanced typography (15px)
    color: Colors.textInverse,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,               // 24px - using theme
    right: Spacing.lg,                // 24px - using theme
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing['3'],    // 12px - using theme
    paddingHorizontal: Spacing.lg,    // 24px - improved padding
    borderRadius: BorderRadius.full,  // Perfect pill shape
    gap: Spacing.sm,                  // 8px - using theme
    ...Shadows.lg,                    // Enhanced HD shadows
  },
  fabText: {
    ...Typography.labelMedium,        // Enhanced typography (13px)
    color: Colors.textInverse,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  mapPlaceholderText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    ...Typography.bodySmall,
    color: Colors.textDisabled,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

// Conditional import for MapView (mobile only)
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

interface RouteAlternative {
  id: string;
  type: 'eco' | 'balanced' | 'fastest';
  distance_m: number;
  duration_s: number;
  base_time_s: number;
  polyline: string;
  coordinates: Array<{latitude: number, longitude: number}>;
  energy_consumption_kwh: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
  eco_score: number;
  reliability_score: number;
  summary: {
    distance_km: number;
    duration_min: number;
    avg_speed_kmh: number;
    chargers_available: number;
    traffic_delay_min: number;
  };
}

interface Charger {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  port_types: string[];
  available_ports: number;
  total_ports: number;
  verification_level: number;
  uptime_percentage: number;
  distance_from_route_km: number;
  amenities: string[];
}

export default function SmartEcoRouting() {
  const { user } = useAuth();
  const mapRef = useRef<any>(null);
  
  // State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteAlternative[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteAlternative | null>(null);
  const [chargersAlongRoute, setChargersAlongRoute] = useState<Charger[]>([]);
  const [batteryPercent, setBatteryPercent] = useState(80);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'input' | 'results'>('input');

  // Mock battery capacity based on vehicle type
  const getBatteryCapacity = () => {
    const vehicleType = user?.vehicle_type?.toLowerCase() || 'sedan';
    const capacities: Record<string, number> = {
      'sedan': 60,
      'suv': 75,
      'hatchback': 50,
      'truck': 100,
    };
    return capacities[vehicleType] || 60;
  };

  // Calculate routes using HERE API
  const calculateRoutes = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Missing Information', 'Please enter both origin and destination');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('session_token');
      const batteryCapacity = getBatteryCapacity();

      // Mock coordinates (San Francisco area) - in production, use geocoding
      const mockOrigin = { lat: 37.7749, lng: -122.4194 };
      const mockDestination = { lat: 37.8049, lng: -122.3894 };

      const response = await axios.post(
        `${API_URL}/api/routing/here/calculate`,
        {
          origin_lat: mockOrigin.lat,
          origin_lng: mockOrigin.lng,
          destination_lat: mockDestination.lat,
          destination_lng: mockDestination.lng,
          battery_capacity_kwh: batteryCapacity,
          current_battery_percent: batteryPercent,
          vehicle_type: user?.vehicle_type || 'sedan',
          port_type: user?.port_type || 'Type 2',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.routes) {
        setRoutes(response.data.routes);
        setChargersAlongRoute(response.data.chargers_along_route || []);
        setWeatherData(response.data.weather_data);
        setSelectedRoute(response.data.routes[0]); // Default to eco route
        setViewMode('results');

        // Zoom to route on map
        if (mapRef.current && Platform.OS !== 'web' && response.data.routes[0].coordinates) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(response.data.routes[0].coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
              animated: true,
            });
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Route calculation error:', error);
      Alert.alert('Error', 'Failed to calculate routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get route type info
  const getRouteTypeInfo = (type: string) => {
    const typeInfo = {
      eco: {
        name: 'Eco-Optimized',
        icon: 'leaf',
        color: '#4CAF50',
        description: 'Lowest energy consumption'
      },
      balanced: {
        name: 'Balanced',
        icon: 'speedometer',
        color: '#2196F3',
        description: 'Good mix of time and energy'
      },
      fastest: {
        name: 'Fastest',
        icon: 'flash',
        color: '#FF9800',
        description: 'Shortest travel time'
      }
    };
    return typeInfo[type as keyof typeof typeInfo] || typeInfo.balanced;
  };

  // Calculate battery at arrival
  const calculateBatteryAtArrival = (energyKwh: number) => {
    const batteryCapacity = getBatteryCapacity();
    const currentBatteryKwh = (batteryCapacity * batteryPercent) / 100;
    const remainingBatteryKwh = currentBatteryKwh - energyKwh;
    const remainingPercent = (remainingBatteryKwh / batteryCapacity) * 100;
    return Math.max(0, Math.min(100, remainingPercent));
  };

  // Render route option card
  const renderRouteOption = (route: RouteAlternative) => {
    const isSelected = selectedRoute?.id === route.id;
    const typeInfo = getRouteTypeInfo(route.type);
    const batteryAtArrival = calculateBatteryAtArrival(route.energy_consumption_kwh);

    return (
      <TouchableOpacity
        key={route.id}
        style={[styles.routeCard, isSelected && styles.routeCardSelected]}
        onPress={() => setSelectedRoute(route)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.routeHeader}>
          <View style={[styles.routeIconCircle, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{typeInfo.name}</Text>
            <Text style={styles.routeDescription}>{typeInfo.description}</Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Ionicons name="navigate" size={16} color="#666666" />
            <Text style={styles.statValue}>{route.summary.distance_km} km</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#666666" />
            <Text style={styles.statValue}>{Math.round(route.summary.duration_min)} min</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="battery-charging" size={16} color="#666666" />
            <Text style={styles.statValue}>{route.energy_consumption_kwh.toFixed(1)} kWh</Text>
          </View>
        </View>

        {/* Scores */}
        <View style={styles.scoresSection}>
          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <Ionicons name="leaf" size={14} color="#4CAF50" />
              <Text style={styles.scoreLabel}>Eco Score</Text>
            </View>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${route.eco_score}%`, backgroundColor: '#4CAF50' }]} />
            </View>
            <Text style={styles.scoreValue}>{Math.round(route.eco_score)}/100</Text>
          </View>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <Ionicons name="shield-checkmark" size={14} color="#2196F3" />
              <Text style={styles.scoreLabel}>Reliability</Text>
            </View>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${route.reliability_score}%`, backgroundColor: '#2196F3' }]} />
            </View>
            <Text style={styles.scoreValue}>{Math.round(route.reliability_score)}/100</Text>
          </View>
        </View>

        {/* Battery Prediction */}
        <View style={styles.batteryPrediction}>
          <Text style={styles.predictionLabel}>Battery at Arrival</Text>
          <View style={styles.batteryBar}>
            <View 
              style={[
                styles.batteryFill, 
                { 
                  width: `${batteryAtArrival}%`,
                  backgroundColor: batteryAtArrival > 30 ? '#4CAF50' : batteryAtArrival > 15 ? '#FF9800' : '#F44336'
                }
              ]} 
            />
            <Text style={styles.batteryText}>{Math.round(batteryAtArrival)}%</Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalStats}>
          {route.summary.traffic_delay_min > 0 && (
            <View style={styles.infoChip}>
              <Ionicons name="car" size={12} color="#FF9800" />
              <Text style={styles.infoChipText}>+{Math.round(route.summary.traffic_delay_min)}m traffic</Text>
            </View>
          )}
          <View style={styles.infoChip}>
            <Ionicons name="trending-up" size={12} color="#2196F3" />
            <Text style={styles.infoChipText}>↑{route.elevation_gain_m}m</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="flash" size={12} color="#4CAF50" />
            <Text style={styles.infoChipText}>{route.summary.chargers_available} chargers</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render map with routes
  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.webMapFallback}>
          <Ionicons name="map" size={64} color="#CCCCCC" />
          <Text style={styles.mapPlaceholderText}>Map view available on mobile</Text>
          <Text style={styles.mapPlaceholderSubtext}>Download the app to see interactive routes</Text>
        </View>
      );
    }

    if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length === 0) {
      return (
        <View style={styles.webMapFallback}>
          <Ionicons name="map-outline" size={64} color="#CCCCCC" />
          <Text style={styles.mapPlaceholderText}>Loading route...</Text>
        </View>
      );
    }

    const initialRegion = {
      latitude: selectedRoute.coordinates[0].latitude,
      longitude: selectedRoute.coordinates[0].longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    const typeInfo = getRouteTypeInfo(selectedRoute.type);

    return (
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {/* Route polyline */}
        <Polyline
          coordinates={selectedRoute.coordinates}
          strokeColor={typeInfo.color}
          strokeWidth={5}
        />
        
        {/* Origin marker */}
        <Marker
          coordinate={selectedRoute.coordinates[0]}
          title="Origin"
          description={origin}
        >
          <View style={[styles.markerCircle, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="location" size={20} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Destination marker */}
        <Marker
          coordinate={selectedRoute.coordinates[selectedRoute.coordinates.length - 1]}
          title="Destination"
          description={destination}
        >
          <View style={[styles.markerCircle, { backgroundColor: '#F44336' }]}>
            <Ionicons name="flag" size={20} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Charger markers */}
        {chargersAlongRoute.slice(0, 5).map((charger) => (
          <Marker
            key={charger.id}
            coordinate={{
              latitude: charger.latitude,
              longitude: charger.longitude,
            }}
            title={charger.name}
            description={`${charger.available_ports}/${charger.total_ports} available • ${charger.distance_from_route_km} km from route`}
          >
            <View style={[styles.markerCircle, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
      </MapView>
    );
  };

  // Render input view
  if (viewMode === 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="navigate-circle" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.headerTitle}>Smart Eco-Routing</Text>
              <Text style={styles.headerSubtitle}>
                Powered by HERE API • AI-optimized for EV efficiency
              </Text>
            </View>

            {/* Battery Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Battery Status</Text>
              <View style={styles.batteryCard}>
                <View style={styles.batteryHeader}>
                  <Ionicons name="battery-charging" size={32} color="#4CAF50" />
                  <View style={styles.batteryInfo}>
                    <Text style={styles.batteryPercent}>{batteryPercent}%</Text>
                    <Text style={styles.batteryCapacity}>
                      {getBatteryCapacity()} kWh • {user?.vehicle_type || 'Sedan'}
                    </Text>
                  </View>
                </View>
                <View style={styles.batterySlider}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setBatteryPercent(Math.max(0, batteryPercent - 10))}
                  >
                    <Ionicons name="remove" size={20} color="#666666" />
                  </TouchableOpacity>
                  <View style={styles.sliderTrack}>
                    <View 
                      style={[
                        styles.sliderFill, 
                        { 
                          width: `${batteryPercent}%`,
                          backgroundColor: batteryPercent > 30 ? '#4CAF50' : '#FF9800'
                        }
                      ]} 
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setBatteryPercent(Math.min(100, batteryPercent + 10))}
                  >
                    <Ionicons name="add" size={20} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Route Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plan Your Journey</Text>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location" size={20} color="#2196F3" />
                  <TextInput
                    style={styles.input}
                    placeholder="Starting point (e.g., Downtown SF)"
                    value={origin}
                    onChangeText={setOrigin}
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.routeDivider}>
                  <View style={styles.dividerLine} />
                  <Ionicons name="arrow-down" size={20} color="#CCCCCC" />
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="flag" size={20} color="#F44336" />
                  <TextInput
                    style={styles.input}
                    placeholder="Destination (e.g., Oakland)"
                    value={destination}
                    onChangeText={setDestination}
                    placeholderTextColor="#999999"
                  />
                </View>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
              onPress={calculateRoutes}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.calculateButtonText}>Calculating routes...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="#FFFFFF" />
                  <Text style={styles.calculateButtonText}>Find Best EV Routes</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Feature Cards */}
            <View style={styles.featuresSection}>
              <View style={styles.featureCard}>
                <Ionicons name="leaf" size={28} color="#4CAF50" />
                <Text style={styles.featureTitle}>Energy First</Text>
                <Text style={styles.featureText}>
                  Routes optimized for lowest battery consumption using real terrain and traffic data
                </Text>
              </View>
              
              <View style={styles.featureCard}>
                <Ionicons name="flash" size={28} color="#FF9800" />
                <Text style={styles.featureTitle}>Smart Charging</Text>
                <Text style={styles.featureText}>
                  Only suggests verified, high-uptime chargers from SharaSpot community
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Ionicons name="cloudy" size={28} color="#2196F3" />
                <Text style={styles.featureTitle}>Live Conditions</Text>
                <Text style={styles.featureText}>
                  Adapts to real-time weather, traffic, and elevation for accurate predictions
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Render results view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultsContainer}>
        {/* Map Section */}
        <View style={styles.mapSection}>
          {renderMap()}
          
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setViewMode('input');
              setRoutes([]);
              setSelectedRoute(null);
              setChargersAlongRoute([]);
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Route type indicator */}
          {selectedRoute && (
            <View style={[styles.routeTypeIndicator, { backgroundColor: getRouteTypeInfo(selectedRoute.type).color }]}>
              <Ionicons 
                name={getRouteTypeInfo(selectedRoute.type).icon as any} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.routeTypeText}>{getRouteTypeInfo(selectedRoute.type).name}</Text>
            </View>
          )}

          {/* Weather info */}
          {weatherData && (
            <View style={styles.weatherBadge}>
              <Ionicons name="partly-sunny" size={16} color="#FF9800" />
              <Text style={styles.weatherText}>{weatherData.temperature_c}°C</Text>
            </View>
          )}
        </View>

        {/* Route Options */}
        <View style={styles.routeOptionsSection}>
          <View style={styles.routeOptionsHeader}>
            <Text style={styles.routeOptionsTitle}>Route Options</Text>
            <Text style={styles.routeOptionsSubtitle}>
              {routes.length} alternatives • Tap to compare
            </Text>
          </View>
          
          <ScrollView 
            style={styles.routeOptionsList}
            showsVerticalScrollIndicator={false}
          >
            {routes.map(route => renderRouteOption(route))}

            {/* Chargers Along Route */}
            {chargersAlongRoute.length > 0 && selectedRoute && (
              <View style={styles.chargersSection}>
                <Text style={styles.chargersSectionTitle}>
                  ⚡ Charging Stations Along Route
                </Text>
                {chargersAlongRoute.slice(0, 3).map((charger) => (
                  <View key={charger.id} style={styles.chargerItem}>
                    <View style={styles.chargerIconCircle}>
                      <Ionicons name="flash" size={16} color="#4CAF50" />
                    </View>
                    <View style={styles.chargerItemInfo}>
                      <Text style={styles.chargerItemName}>{charger.name}</Text>
                      <Text style={styles.chargerItemDetails}>
                        {charger.distance_from_route_km} km from route • {charger.available_ports}/{charger.total_ports} available
                      </Text>
                    </View>
                    <View style={styles.reliabilityBadge}>
                      <Text style={styles.reliabilityText}>{Math.round(charger.uptime_percentage)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  batteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  batteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  batteryInfo: {
    marginLeft: 16,
  },
  batteryPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  batteryCapacity: {
    fontSize: 14,
    color: '#666666',
  },
  batterySlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  dividerLine: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  mapSection: {
    height: height * 0.35,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    marginTop: 12,
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
    textAlign: 'center',
  },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  routeTypeIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  routeTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  weatherBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  routeOptionsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 20,
  },
  routeOptionsHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  routeOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  routeOptionsSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  routeOptionsList: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routeCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  routeDescription: {
    fontSize: 12,
    color: '#666666',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scoresSection: {
    gap: 12,
    marginBottom: 12,
  },
  scoreItem: {
    gap: 6,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  scoreBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  batteryPrediction: {
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  batteryBar: {
    height: 28,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  batteryFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 8,
  },
  batteryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    zIndex: 1,
  },
  additionalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    color: '#666666',
  },
  chargersSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chargersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  chargerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chargerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chargerItemInfo: {
    flex: 1,
  },
  chargerItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  chargerItemDetails: {
    fontSize: 11,
    color: '#666666',
  },
  reliabilityBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  reliabilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bottomPadding: {
    height: 20,
  },
});

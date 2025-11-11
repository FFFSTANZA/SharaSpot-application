import React, { useState, useRef, useEffect } from 'react';
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

interface RouteOption {
  id: string;
  name: string;
  distance_km: number;
  duration_minutes: number;
  energy_kwh: number;
  eco_score: number;
  reliability_score: number;
  type: 'eco' | 'balanced' | 'fastest';
  suggested_chargers: any[];
  weather_conditions?: any;
  terrain_summary?: any;
  coordinates?: Array<{latitude: number, longitude: number}>;
}

export default function SmartEcoRouting() {
  const { user } = useAuth();
  const mapRef = useRef<any>(null);
  
  // State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [batteryPercent, setBatteryPercent] = useState(80);
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

  // Calculate route with eco optimization
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

      // Mock coordinates for demo (San Francisco area)
      const mockOrigin = { lat: 37.7749, lng: -122.4194 };
      const mockDestination = { lat: 37.8049, lng: -122.3894 };

      // Generate 3 route options: eco-optimized, balanced, fastest
      const mockRoutes: RouteOption[] = [
        {
          id: '1',
          name: 'Eco-Optimized Route',
          type: 'eco',
          distance_km: 42.5,
          duration_minutes: 58,
          energy_kwh: 6.8,
          eco_score: 92,
          reliability_score: 95,
          suggested_chargers: [
            { name: 'Tesla Supercharger', distance_from_route: 0.5, verification_level: 5 },
            { name: 'ChargePoint Station', distance_from_route: 1.2, verification_level: 4 },
          ],
          weather_conditions: { temp: 22, condition: 'Clear', wind_speed: 8 },
          terrain_summary: { elevation_gain: 85, max_slope: 6, flat_percentage: 78 },
          coordinates: [
            mockOrigin,
            { latitude: 37.7849, longitude: -122.4094 },
            { latitude: 37.7949, longitude: -122.3994 },
            mockDestination,
          ],
        },
        {
          id: '2',
          name: 'Balanced Route',
          type: 'balanced',
          distance_km: 39.8,
          duration_minutes: 52,
          energy_kwh: 7.2,
          eco_score: 85,
          reliability_score: 88,
          suggested_chargers: [
            { name: 'EVgo Fast Charging', distance_from_route: 0.8, verification_level: 3 },
          ],
          weather_conditions: { temp: 22, condition: 'Clear', wind_speed: 8 },
          terrain_summary: { elevation_gain: 120, max_slope: 9, flat_percentage: 65 },
          coordinates: [
            mockOrigin,
            { latitude: 37.7899, longitude: -122.4044 },
            mockDestination,
          ],
        },
        {
          id: '3',
          name: 'Fastest Route',
          type: 'fastest',
          distance_km: 38.2,
          duration_minutes: 45,
          energy_kwh: 8.5,
          eco_score: 72,
          reliability_score: 78,
          suggested_chargers: [
            { name: 'Electrify America', distance_from_route: 2.1, verification_level: 5 },
          ],
          weather_conditions: { temp: 22, condition: 'Clear', wind_speed: 8 },
          terrain_summary: { elevation_gain: 180, max_slope: 12, flat_percentage: 52 },
          coordinates: [
            mockOrigin,
            { latitude: 37.7999, longitude: -122.4144 },
            mockDestination,
          ],
        },
      ];

      setRoutes(mockRoutes);
      setSelectedRoute(mockRoutes[0]); // Default to eco-optimized
      setViewMode('results');

      // Zoom to route on map
      if (mapRef.current && Platform.OS !== 'web') {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(mockRoutes[0].coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }, 500);
      }
    } catch (error: any) {
      console.error('Route calculation error:', error);
      Alert.alert('Error', 'Failed to calculate routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render route options list
  const renderRouteOption = (route: RouteOption) => {
    const isSelected = selectedRoute?.id === route.id;
    const batteryCapacity = getBatteryCapacity();
    const currentBatteryKwh = (batteryCapacity * batteryPercent) / 100;
    const remainingBatteryKwh = currentBatteryKwh - route.energy_kwh;
    const remainingPercent = (remainingBatteryKwh / batteryCapacity) * 100;

    const typeColors = {
      eco: '#4CAF50',
      balanced: '#2196F3',
      fastest: '#FF9800',
    };

    const typeIcons = {
      eco: 'leaf',
      balanced: 'speedometer',
      fastest: 'flash',
    };

    return (
      <TouchableOpacity
        key={route.id}
        style={[styles.routeCard, isSelected && styles.routeCardSelected]}
        onPress={() => setSelectedRoute(route)}
        activeOpacity={0.7}
      >
        <View style={styles.routeHeader}>
          <View style={[styles.routeIconCircle, { backgroundColor: typeColors[route.type] + '20' }]}>
            <Ionicons name={typeIcons[route.type] as any} size={20} color={typeColors[route.type]} />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{route.name}</Text>
            <View style={styles.routeMetrics}>
              <Text style={styles.metricText}>{route.distance_km} km</Text>
              <Text style={styles.metricDivider}>•</Text>
              <Text style={styles.metricText}>{route.duration_minutes} min</Text>
            </View>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
        </View>

        {/* Energy & Scores */}
        <View style={styles.routeDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="battery-charging" size={16} color="#666666" />
            <Text style={styles.detailLabel}>Energy</Text>
            <Text style={styles.detailValue}>{route.energy_kwh} kWh</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="leaf" size={16} color="#4CAF50" />
            <Text style={styles.detailLabel}>Eco Score</Text>
            <Text style={[styles.detailValue, { color: '#4CAF50' }]}>{route.eco_score}/100</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="shield-checkmark" size={16} color="#2196F3" />
            <Text style={styles.detailLabel}>Reliability</Text>
            <Text style={[styles.detailValue, { color: '#2196F3' }]}>{route.reliability_score}%</Text>
          </View>
        </View>

        {/* Battery Prediction */}
        <View style={styles.batteryPrediction}>
          <Text style={styles.predictionLabel}>Estimated Battery at Arrival:</Text>
          <View style={styles.batteryBar}>
            <View 
              style={[
                styles.batteryFill, 
                { 
                  width: `${Math.max(0, Math.min(100, remainingPercent))}%`,
                  backgroundColor: remainingPercent > 30 ? '#4CAF50' : remainingPercent > 15 ? '#FF9800' : '#F44336'
                }
              ]} 
            />
            <Text style={styles.batteryText}>{Math.round(remainingPercent)}%</Text>
          </View>
        </View>

        {/* Chargers Along Route */}
        {route.suggested_chargers.length > 0 && (
          <View style={styles.chargersInfo}>
            <Ionicons name="flash" size={14} color="#4CAF50" />
            <Text style={styles.chargersText}>
              {route.suggested_chargers.length} charger(s) along route
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render map with route
  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.webMapFallback}>
          <Ionicons name="map" size={64} color="#CCCCCC" />
          <Text style={styles.mapPlaceholderText}>Map view available on mobile</Text>
        </View>
      );
    }

    const initialRegion = {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    const routeColors = {
      eco: '#4CAF50',
      balanced: '#2196F3',
      fastest: '#FF9800',
    };

    return (
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {selectedRoute && selectedRoute.coordinates && (
          <>
            {/* Route polyline */}
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor={routeColors[selectedRoute.type]}
              strokeWidth={4}
            />
            
            {/* Origin marker */}
            <Marker
              coordinate={selectedRoute.coordinates[0]}
              title="Origin"
            >
              <View style={[styles.markerCircle, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Destination marker */}
            <Marker
              coordinate={selectedRoute.coordinates[selectedRoute.coordinates.length - 1]}
              title="Destination"
            >
              <View style={[styles.markerCircle, { backgroundColor: '#F44336' }]}>
                <Ionicons name="flag" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Charger markers */}
            {selectedRoute.suggested_chargers.map((charger, index) => {
              // Mock positions along route
              const position = selectedRoute.coordinates[
                Math.floor(selectedRoute.coordinates.length / 2)
              ];
              return (
                <Marker
                  key={index}
                  coordinate={position}
                  title={charger.name}
                >
                  <View style={[styles.markerCircle, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              );
            })}
          </>
        )}
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
              <View style={styles.headerIcon}>
                <Ionicons name="navigate-circle" size={40} color="#4CAF50" />
              </View>
              <Text style={styles.headerTitle}>Smart Eco-Routing</Text>
              <Text style={styles.headerSubtitle}>
                Plan your route with AI-powered energy optimization
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
                      {getBatteryCapacity()} kWh capacity
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
              <Text style={styles.sectionTitle}>Plan Your Route</Text>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location" size={20} color="#2196F3" />
                  <TextInput
                    style={styles.input}
                    placeholder="Starting point (e.g., San Francisco)"
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

            {/* Vehicle Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Vehicle</Text>
              <View style={styles.vehicleCard}>
                <Ionicons name="car-sport" size={24} color="#4CAF50" />
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleType}>
                    {user?.vehicle_type || 'Not set'}
                  </Text>
                  <Text style={styles.vehiclePort}>
                    {user?.port_type || 'No port selected'}
                  </Text>
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="#FFFFFF" />
                  <Text style={styles.calculateButtonText}>Calculate Eco Routes</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info Cards */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Ionicons name="leaf" size={24} color="#4CAF50" />
                <Text style={styles.infoTitle}>Energy Optimized</Text>
                <Text style={styles.infoText}>
                  Routes prioritize lowest battery consumption
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
                <Text style={styles.infoTitle}>Reliable Chargers</Text>
                <Text style={styles.infoText}>
                  Only suggests verified charging stations
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
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Route type indicator */}
          {selectedRoute && (
            <View style={styles.routeTypeIndicator}>
              <Ionicons 
                name={selectedRoute.type === 'eco' ? 'leaf' : selectedRoute.type === 'balanced' ? 'speedometer' : 'flash'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.routeTypeText}>{selectedRoute.name}</Text>
            </View>
          )}
        </View>

        {/* Route Options */}
        <View style={styles.routeOptionsSection}>
          <View style={styles.routeOptionsHeader}>
            <Text style={styles.routeOptionsTitle}>Route Options</Text>
            <Text style={styles.routeOptionsSubtitle}>
              Tap to compare • {routes.length} routes found
            </Text>
          </View>
          <ScrollView 
            style={styles.routeOptionsList}
            showsVerticalScrollIndicator={false}
          >
            {routes.map(route => renderRouteOption(route))}

            {/* Weather & Terrain Info */}
            {selectedRoute && (
              <View style={styles.additionalInfo}>
                <Text style={styles.additionalInfoTitle}>Route Conditions</Text>
                
                {selectedRoute.weather_conditions && (
                  <View style={styles.conditionCard}>
                    <View style={styles.conditionHeader}>
                      <Ionicons name="partly-sunny" size={20} color="#FF9800" />
                      <Text style={styles.conditionTitle}>Weather</Text>
                    </View>
                    <View style={styles.conditionDetails}>
                      <Text style={styles.conditionText}>
                        {selectedRoute.weather_conditions.temp}°C • {selectedRoute.weather_conditions.condition}
                      </Text>
                      <Text style={styles.conditionText}>
                        Wind: {selectedRoute.weather_conditions.wind_speed} km/h
                      </Text>
                    </View>
                  </View>
                )}

                {selectedRoute.terrain_summary && (
                  <View style={styles.conditionCard}>
                    <View style={styles.conditionHeader}>
                      <Ionicons name="trending-up" size={20} color="#2196F3" />
                      <Text style={styles.conditionTitle}>Terrain</Text>
                    </View>
                    <View style={styles.conditionDetails}>
                      <Text style={styles.conditionText}>
                        Elevation gain: {selectedRoute.terrain_summary.elevation_gain}m
                      </Text>
                      <Text style={styles.conditionText}>
                        Flat road: {selectedRoute.terrain_summary.flat_percentage}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
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
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
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
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  vehiclePort: {
    fontSize: 14,
    color: '#666666',
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
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  mapSection: {
    height: height * 0.4,
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
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
  },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
    backgroundColor: '#4CAF50',
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
    marginBottom: 4,
  },
  routeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricText: {
    fontSize: 13,
    color: '#666666',
  },
  metricDivider: {
    fontSize: 13,
    color: '#CCCCCC',
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailItem: {
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999999',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  batteryPrediction: {
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  batteryBar: {
    height: 32,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    zIndex: 1,
  },
  chargersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chargersText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  additionalInfo: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  conditionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  conditionDetails: {
    gap: 6,
  },
  conditionText: {
    fontSize: 13,
    color: '#666666',
  },
});

/**
 * Production-Grade EV Navigation Screen
 *
 * Features:
 * - Full-screen turn-by-turn navigation
 * - Voice guidance with Expo Speech API (FREE)
 * - Real-time battery monitoring with alerts
 * - Charging stop prompts
 * - Lane guidance and visual indicators
 * - Arrival summary with coins earned
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Types
interface TurnInstruction {
  step_index: number;
  distance_m: number;
  duration_s: number;
  instruction: string;
  voice_text: string;
  type: string;
  modifier: string;
  street_name: string;
  location: [number, number];
  lanes?: any[];
}

interface Charger {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  verification_level: number;
  available_ports: number;
  port_types: string[];
}

interface NavigationData {
  route: {
    coordinates: { latitude: number; longitude: number }[];
    distance_m: number;
    duration_s: number;
    energy_consumption_kwh: number;
    summary: {
      turn_instructions: TurnInstruction[];
      distance_km: number;
      duration_min: number;
    };
  };
  chargers: Charger[];
  starting_battery_percent: number;
  battery_capacity_kwh: number;
}

export default function NavigationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Navigation state
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(0);
  const [batteryPercent, setBatteryPercent] = useState(80);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showChargingPrompt, setShowChargingPrompt] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [showArrivalSummary, setShowArrivalSummary] = useState(false);
  const [navigationStats, setNavigationStats] = useState({
    distance_driven_km: 0,
    energy_used_kwh: 0,
    coins_earned: 0,
    duration_min: 0,
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [startLocation, setStartLocation] = useState<Location.LocationObject | null>(null);
  const [totalDistanceTraveled, setTotalDistanceTraveled] = useState(0);
  const [remainingDistanceKm, setRemainingDistanceKm] = useState(0);
  const [remainingDurationMin, setRemainingDurationMin] = useState(0);

  // Voice guidance state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpokenStep, setLastSpokenStep] = useState(-1);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState<string>('');

  // Animation values
  const instructionFadeAnim = useRef(new Animated.Value(1)).current;

  // Load navigation data on mount
  useEffect(() => {
    loadNavigationData();
    requestLocationPermission();

    return () => {
      // Cleanup
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      Speech.stop();
    };
  }, []);

  const loadNavigationData = async () => {
    try {
      // In production, this would come from route params or AsyncStorage
      const routeData = params.routeData ? JSON.parse(params.routeData as string) : null;

      if (!routeData) {
        Alert.alert('Error', 'No navigation data available', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      // Validate required fields
      if (!routeData.route || !routeData.route.coordinates || routeData.route.coordinates.length === 0) {
        Alert.alert('Error', 'Invalid route data - missing coordinates', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      if (!routeData.route.summary || !routeData.route.summary.turn_instructions) {
        Alert.alert('Error', 'Invalid route data - missing turn instructions', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      if (typeof routeData.battery_capacity_kwh !== 'number' || routeData.battery_capacity_kwh <= 0) {
        Alert.alert('Error', 'Invalid battery capacity', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setNavigationData(routeData);
      setBatteryPercent(routeData.starting_battery_percent || 80);
      setRemainingDistanceKm(routeData.route.summary.distance_km);
      setRemainingDurationMin(routeData.route.summary.duration_min);

      // Calculate initial arrival time
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + routeData.route.summary.duration_min);
      setEstimatedArrivalTime(arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Failed to load navigation data:', error);
      Alert.alert('Error', 'Failed to load navigation data. Please try again.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        startLocationTracking();
      } else {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setCurrentLocation(location);
      setStartLocation(location);
      setStartTime(new Date());

      // Animate map to user location with navigation perspective
      if (mapRef.current && navigationData) {
        mapRef.current.animateCamera({
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          pitch: 60, // 3D tilt like Google Maps
          heading: location.coords.heading || 0, // Rotate map in direction of travel
          altitude: 500,
          zoom: 17,
        }, { duration: 1000 });
      }

      // Start watching location with high accuracy
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 5, // Or every 5 meters
        },
        (newLocation) => {
          setCurrentLocation(newLocation);
          updateNavigationProgress(newLocation);

          // Smoothly follow user location with heading
          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              },
              heading: newLocation.coords.heading || 0,
            }, { duration: 500 });
          }
        }
      );

      setIsNavigating(true);
    } catch (error) {
      console.error('Location tracking error:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const updateNavigationProgress = (location: Location.LocationObject) => {
    if (!navigationData || !navigationData.route.summary.turn_instructions) return;

    const instructions = navigationData.route.summary.turn_instructions;
    if (currentStepIndex >= instructions.length) {
      // Navigation complete
      handleArrival();
      return;
    }

    const currentInstruction = instructions[currentStepIndex];
    const [lng, lat] = currentInstruction.location;

    // Calculate distance to next turn
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      lat,
      lng
    );

    setDistanceToNextTurn(distance);

    // Update real-time stats
    if (currentLocation && startLocation && startTime) {
      // Calculate distance traveled from start
      const distanceTraveled = calculateDistance(
        startLocation.coords.latitude,
        startLocation.coords.longitude,
        location.coords.latitude,
        location.coords.longitude
      ) / 1000; // Convert to km

      setTotalDistanceTraveled(distanceTraveled);

      // Calculate duration in minutes
      const durationMs = new Date().getTime() - startTime.getTime();
      const durationMin = durationMs / (1000 * 60);

      // Calculate energy used (based on distance and route energy rate)
      const energyRate = navigationData.route.energy_consumption_kwh / (navigationData.route.distance_m / 1000);
      const energyUsed = distanceTraveled * energyRate;

      // Update stats
      setNavigationStats({
        distance_driven_km: distanceTraveled,
        energy_used_kwh: energyUsed,
        coins_earned: 0, // Will be set at arrival
        duration_min: durationMin,
      });

      // Update battery percentage
      const batteryUsedPercent = (energyUsed / navigationData.battery_capacity_kwh) * 100;
      setBatteryPercent(Math.max(0, navigationData.starting_battery_percent - batteryUsedPercent));

      // Update remaining distance and duration
      const totalRouteDistance = navigationData.route.distance_m / 1000; // km
      const remainingDist = Math.max(0, totalRouteDistance - distanceTraveled);
      setRemainingDistanceKm(remainingDist);

      // Calculate remaining duration based on remaining distance and average speed
      const totalRouteDuration = navigationData.route.duration_s / 60; // minutes
      const progressRatio = distanceTraveled / totalRouteDistance;
      const remainingDur = Math.max(0, totalRouteDuration * (1 - progressRatio));
      setRemainingDurationMin(remainingDur);

      // Update estimated arrival time
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + remainingDur);
      setEstimatedArrivalTime(arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }

    // Voice guidance triggers with haptic feedback
    if (distance <= 200 && currentStepIndex !== lastSpokenStep && !isSpeaking) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Haptic feedback
      speakInstruction(`In ${Math.round(distance)} meters, ${currentInstruction.voice_text}`);
      setLastSpokenStep(currentStepIndex);
    } else if (distance <= 50 && currentStepIndex !== lastSpokenStep) {
      // Repeat when very close with stronger haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      speakInstruction(currentInstruction.voice_text);
    }

    // Move to next instruction if close enough
    if (distance <= 20) {
      // Fade out current instruction, then switch
      Animated.sequence([
        Animated.timing(instructionFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(instructionFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Strong haptic for turn completion
      setCurrentStepIndex((prev) => prev + 1);
      setLastSpokenStep(-1); // Reset for next instruction
    }

    // Check battery level for charging alert
    checkBatteryAlert();
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const speakInstruction = async (text: string) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const checkBatteryAlert = () => {
    if (batteryPercent <= 22 && batteryPercent > 20 && !showChargingPrompt && navigationData) {
      // Find nearest charger
      const nearestCharger = findNearestCharger();
      if (nearestCharger) {
        setSelectedCharger(nearestCharger);
        setShowChargingPrompt(true);
        speakInstruction(`Battery low, charging station in ${nearestCharger.name} nearby`);
      }
    }
  };

  const findNearestCharger = (): Charger | null => {
    if (!navigationData || !currentLocation || !navigationData.chargers) return null;

    let nearest = navigationData.chargers[0];
    let minDistance = Infinity;

    for (const charger of navigationData.chargers) {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        charger.latitude,
        charger.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = charger;
      }
    }

    return nearest;
  };

  const handleAddChargingStop = () => {
    if (selectedCharger) {
      Alert.alert(
        'Charging Stop Added',
        `Rerouting to ${selectedCharger.name}`,
        [{ text: 'OK', onPress: () => setShowChargingPrompt(false) }]
      );
      // In production: reroute to charger, then continue to destination
    }
  };

  const handleArrival = async () => {
    setIsNavigating(false);
    Speech.stop();

    // Stop location tracking
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    // Calculate coins earned (example: 1 coin per 10 km)
    const coinsEarned = Math.floor(navigationStats.distance_driven_km / 10) + 5; // Base 5 coins

    setNavigationStats({
      ...navigationStats,
      coins_earned: coinsEarned,
    });

    // Award coins via API
    await awardNavigationCoins(coinsEarned);

    speakInstruction("You've arrived at your destination");
    setShowArrivalSummary(true);
  };

  const awardNavigationCoins = async (coins: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_URL}/api/coins/award`,
        {
          amount: coins,
          reason: 'navigation_completed',
          metadata: { distance_km: navigationStats.distance_driven_km },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to award coins:', error);
    }
  };

  const getManeuverIcon = (type: string, modifier: string): string => {
    const maneuverMap: Record<string, string> = {
      'turn-right': 'arrow-forward',
      'turn-left': 'arrow-back',
      'slight-right': 'arrow-up-outline',
      'slight-left': 'arrow-up-outline',
      'sharp-right': 'return-up-forward',
      'sharp-left': 'return-up-back',
      'straight': 'arrow-up',
      'uturn': 'return-down-back',
      'merge': 'git-merge-outline',
      'roundabout': 'radio-button-off-outline',
    };

    return maneuverMap[`${type}-${modifier}`] || maneuverMap[type] || 'arrow-up';
  };

  const getBatteryColor = (percent: number): string => {
    if (percent > 30) return '#4CAF50'; // Green
    if (percent > 15) return '#FF9800'; // Amber
    return '#F44336'; // Red
  };

  const formatDistance = (meters: number): string => {
    if (meters < 100) {
      return `${Math.round(meters / 10) * 10} m`; // Round to nearest 10m
    } else if (meters < 1000) {
      return `${Math.round(meters / 50) * 50} m`; // Round to nearest 50m
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  if (!navigationData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }

  const currentInstruction =
    currentStepIndex < navigationData.route.summary.turn_instructions.length
      ? navigationData.route.summary.turn_instructions[currentStepIndex]
      : null;

  return (
    <View style={styles.container}>
      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: navigationData.route.coordinates[0].latitude,
          longitude: navigationData.route.coordinates[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        followsUserLocation
        showsCompass
        showsTraffic
      >
        {/* Route Polyline - Google Maps style */}
        <Polyline
          coordinates={navigationData.route.coordinates}
          strokeColor="#5E96FF"
          strokeWidth={6}
          lineJoin="round"
          lineCap="round"
        />
        {/* Route Outline for better visibility */}
        <Polyline
          coordinates={navigationData.route.coordinates}
          strokeColor="#1565C0"
          strokeWidth={9}
          lineJoin="round"
          lineCap="round"
          zIndex={-1}
        />

        {/* Charger Markers */}
        {navigationData.chargers.map((charger) => (
          <Marker
            key={charger.id}
            coordinate={{
              latitude: charger.latitude,
              longitude: charger.longitude,
            }}
            title={charger.name}
            description={`${charger.available_ports} ports available`}
          >
            <View style={styles.chargerMarker}>
              <Ionicons name="flash" size={20} color="#4CAF50" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Battery Indicator */}
        <View style={styles.batteryContainer}>
          <Ionicons name="battery-charging" size={20} color={getBatteryColor(batteryPercent)} />
          <Text style={[styles.batteryText, { color: getBatteryColor(batteryPercent) }]}>
            {Math.round(batteryPercent)}%
          </Text>
        </View>

        {/* ETA */}
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>ARRIVE</Text>
          <Text style={styles.etaValue}>{estimatedArrivalTime || '--:--'}</Text>
        </View>

        {/* Distance */}
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{remainingDistanceKm.toFixed(1)} km</Text>
          <Text style={styles.distanceLabel}>remaining</Text>
        </View>
      </View>

      {/* Turn Instruction Card with Smooth Animations */}
      {currentInstruction && (
        <Animated.View style={[styles.instructionCard, { opacity: instructionFadeAnim }]}>
          <View style={styles.instructionHeader}>
            <View style={styles.maneuverIconContainer}>
              <Ionicons
                name={getManeuverIcon(currentInstruction.type, currentInstruction.modifier) as any}
                size={56}
                color="#2196F3"
              />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionDistance}>
                {formatDistance(distanceToNextTurn)}
              </Text>
              <Text style={styles.instructionMain}>{currentInstruction.instruction}</Text>
              {currentInstruction.street_name && (
                <Text style={styles.streetName}>on {currentInstruction.street_name}</Text>
              )}
            </View>
          </View>

          {/* Lane Guidance */}
          {currentInstruction.lanes && currentInstruction.lanes.length > 0 && (
            <View style={styles.laneGuidance}>
              {currentInstruction.lanes.map((lane: any, idx: number) => (
                <View
                  key={idx}
                  style={[styles.lane, lane.valid && styles.laneActive]}
                >
                  <Ionicons
                    name="arrow-up"
                    size={16}
                    color={lane.valid ? '#4CAF50' : '#999'}
                  />
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* Charging Prompt Modal */}
      <Modal visible={showChargingPrompt} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="battery-dead" size={48} color="#F44336" />
            <Text style={styles.modalTitle}>Battery Low!</Text>
            <Text style={styles.modalMessage}>
              Your battery is at {Math.round(batteryPercent)}%.
              {selectedCharger && ` ${selectedCharger.name} is nearby.`}
            </Text>
            {selectedCharger && (
              <View style={styles.chargerInfo}>
                <Text style={styles.chargerName}>{selectedCharger.name}</Text>
                <Text style={styles.chargerAddress}>{selectedCharger.address}</Text>
                <Text style={styles.chargerPorts}>
                  {selectedCharger.available_ports} ports available
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowChargingPrompt(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddChargingStop}
              >
                <Text style={styles.modalButtonText}>Add Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Arrival Summary Modal */}
      <Modal visible={showArrivalSummary} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.modalTitle}>You've Arrived!</Text>

            <View style={styles.summaryStats}>
              <View style={styles.statRow}>
                <Ionicons name="navigate" size={24} color="#666" />
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{navigationStats.distance_driven_km.toFixed(1)} km</Text>
              </View>

              <View style={styles.statRow}>
                <Ionicons name="flash" size={24} color="#666" />
                <Text style={styles.statLabel}>Energy Used</Text>
                <Text style={styles.statValue}>{navigationStats.energy_used_kwh.toFixed(1)} kWh</Text>
              </View>

              <View style={styles.statRow}>
                <Ionicons name="time" size={24} color="#666" />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{Math.round(navigationStats.duration_min)} min</Text>
              </View>

              <View style={styles.statRow}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.statLabel}>SharaCoins Earned</Text>
                <Text style={[styles.statValue, styles.coinsValue]}>
                  {navigationStats.coins_earned}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { width: '100%' }]}
              onPress={() => router.back()}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  map: {
    width,
    height,
  },
  statusBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  batteryText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  etaContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  etaLabel: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '500',
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  distanceContainer: {
    marginLeft: 20,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
    fontWeight: '500',
  },
  instructionCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maneuverIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    flex: 1,
    marginLeft: 20,
  },
  instructionDistance: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2196F3',
    letterSpacing: -1,
    marginBottom: 4,
  },
  instructionMain: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
    lineHeight: 28,
  },
  streetName: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  laneGuidance: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'center',
  },
  lane: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  laneActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  chargerMarker: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  chargerInfo: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  chargerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chargerAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chargerPorts: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryStats: {
    width: '100%',
    marginVertical: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  coinsValue: {
    color: '#FFD700',
    fontSize: 18,
  },
});

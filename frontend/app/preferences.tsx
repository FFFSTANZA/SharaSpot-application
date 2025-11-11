import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as Location from 'expo-location';

const PORT_TYPES = ['Type 2', 'CCS', 'CHAdeMO', 'Type 1'];
const VEHICLE_TYPES = ['2W (Scooter/Bike)', '4W (Car)', 'e-Bus', 'e-Rickshaw'];
const DISTANCE_UNITS = ['km', 'mi'];

export default function Preferences() {
  const router = useRouter();
  const { updatePreferences } = useAuth();
  const [portType, setPortType] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        console.log('User location:', location.coords);
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handleSave = async () => {
    if (!portType || !vehicleType) {
      alert('Please select port type and vehicle type');
      return;
    }

    setLoading(true);
    try {
      await updatePreferences({
        port_type: portType,
        vehicle_type: vehicleType,
        distance_unit: distanceUnit,
      });
      router.replace('/home');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your experience</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Location Access</Text>
          </View>
          <Text style={styles.sectionDescription}>We need your location to find nearby charging stations</Text>
          {locationPermission === 'granted' ? (
            <View style={styles.permissionGranted}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.permissionText}>Location access granted</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
              <Text style={styles.permissionButtonText}>Enable Location</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="power" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Charging Port Type</Text>
          </View>
          <View style={styles.optionsGrid}>
            {PORT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionCard,
                  portType === type && styles.optionCardSelected,
                ]}
                onPress={() => setPortType(type)}
              >
                <Ionicons
                  name="flash"
                  size={24}
                  color={portType === type ? '#4CAF50' : '#999999'}
                />
                <Text
                  style={[
                    styles.optionText,
                    portType === type && styles.optionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Vehicle Type</Text>
          </View>
          <View style={styles.optionsList}>
            {VEHICLE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionRow,
                  vehicleType === type && styles.optionRowSelected,
                ]}
                onPress={() => setVehicleType(type)}
              >
                <Text
                  style={[
                    styles.optionRowText,
                    vehicleType === type && styles.optionRowTextSelected,
                  ]}
                >
                  {type}
                </Text>
                {vehicleType === type && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Distance Unit</Text>
          </View>
          <View style={styles.optionsRow}>
            {DISTANCE_UNITS.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitButton,
                  distanceUnit === unit && styles.unitButtonSelected,
                ]}
                onPress={() => setDistanceUnit(unit)}
              >
                <Text
                  style={[
                    styles.unitText,
                    distanceUnit === unit && styles.unitTextSelected,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  permissionGranted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  optionsList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionRowText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  optionRowTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  unitTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

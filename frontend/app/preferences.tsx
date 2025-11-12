import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as Location from 'expo-location';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

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
        await Location.getCurrentPositionAsync({});
      }
    } catch (error) {
      // Silent error handling for location permission
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
      router.replace('/(tabs)');
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
            <Ionicons name="location" size={24} color={Colors.success} />
            <Text style={styles.sectionTitle}>Location Access</Text>
          </View>
          <Text style={styles.sectionDescription}>We need your location to find nearby charging stations</Text>
          {locationPermission === 'granted' ? (
            <View style={styles.permissionGranted}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
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
            <Ionicons name="power" size={24} color={Colors.primary} />
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
                  color={portType === type ? Colors.success : Colors.textTertiary}
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
            <Ionicons name="car" size={24} color={Colors.primary} />
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
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer" size={24} color={Colors.primary} />
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
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.titleMedium,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
  },
  sectionDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  permissionGranted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successLight,
    padding: Spacing['3'],
    borderRadius: BorderRadius.sm,
  },
  permissionText: {
    ...Typography.bodyMedium,
    color: Colors.successDark,
  },
  permissionButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  permissionButtonText: {
    ...Typography.titleMedium,
    color: Colors.textInverse,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['3'],
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  optionText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.successDark,
    fontWeight: '600',
  },
  optionsList: {
    gap: Spacing['3'],
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  optionRowText: {
    ...Typography.titleMedium,
    color: Colors.textSecondary,
  },
  optionRowTextSelected: {
    color: Colors.successDark,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  unitButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonSelected: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  unitText: {
    ...Typography.titleMedium,
    color: Colors.textSecondary,
  },
  unitTextSelected: {
    color: Colors.successDark,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.titleMedium,
    color: Colors.textInverse,
  },
});

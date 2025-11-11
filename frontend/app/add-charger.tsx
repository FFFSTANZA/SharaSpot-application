import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

const PORT_TYPES = ['Type 2', 'CCS', 'CHAdeMO', 'Type 1'];
const AMENITIES = ['restroom', 'cafe', 'wifi', 'parking', 'shopping'];
const NEARBY_AMENITIES = ['restaurant', 'atm', 'gas station', 'mall', 'hospital', 'bank', 'food court', 'pharmacy'];

export default function AddCharger() {
  const router = useRouter();
  
  // Form state
  const [stationName, setStationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedPortTypes, setSelectedPortTypes] = useState<string[]>([]);
  const [numberOfPorts, setNumberOfPorts] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedNearbyAmenities, setSelectedNearbyAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (locationPermission !== 'granted') {
      Alert.alert('Permission Required', 'Please enable location permissions to use this feature');
      return;
    }

    setLocationLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      
      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        setAddress(fullAddress);
      }
      
      Alert.alert('Success', 'Current location captured!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const togglePortType = (type: string) => {
    setSelectedPortTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleNearbyAmenity = (amenity: string) => {
    setSelectedNearbyAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        if (photos.length >= 5) {
          Alert.alert('Limit Reached', 'Maximum 5 photos allowed');
          return;
        }
        setPhotos([...photos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!stationName.trim()) {
      Alert.alert('Validation Error', 'Please enter station name');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter or capture location');
      return false;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Validation Error', 'Please capture GPS coordinates');
      return false;
    }
    if (selectedPortTypes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one port type');
      return false;
    }
    if (!numberOfPorts || parseInt(numberOfPorts) < 1) {
      Alert.alert('Validation Error', 'Please enter valid number of ports');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      const response = await axios.post(
        `${API_URL}/api/chargers`,
        {
          name: stationName.trim(),
          address: address.trim(),
          latitude: latitude!,
          longitude: longitude!,
          port_types: selectedPortTypes,
          total_ports: parseInt(numberOfPorts),
          amenities: selectedAmenities,
          nearby_amenities: selectedNearbyAmenities,
          photos: photos,
          notes: notes.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      Alert.alert(
        'Success! 🎉',
        '🪙 +50 SharaCoins earned!\n\nYour hidden charger has been added and will be verified by the community.',
        [
          {
            text: 'View Chargers',
            onPress: () => router.replace('/home'),
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add charger');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Hidden Charger</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Reward Info */}
          <View style={styles.rewardCard}>
            <Ionicons name="trophy" size={24} color="#FFB300" />
            <Text style={styles.rewardText}>Earn 50 SharaCoins for adding a charger!</Text>
          </View>

          {/* Station Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Station Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Local Cafe Charger"
              placeholderTextColor="#999999"
              value={stationName}
              onChangeText={setStationName}
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Location <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <>
                    <Ionicons name="locate" size={16} color="#4CAF50" />
                    <Text style={styles.currentLocationText}>Use Current</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address or use current location"
              placeholderTextColor="#999999"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
            {latitude && longitude && (
              <View style={styles.coordsDisplay}>
                <Ionicons name="location" size={14} color="#666666" />
                <Text style={styles.coordsText}>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>

          {/* Port Types */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Port Type(s) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipsContainer}>
              {PORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    selectedPortTypes.includes(type) && styles.chipSelected,
                  ]}
                  onPress={() => togglePortType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedPortTypes.includes(type) && styles.chipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Number of Ports */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Number of Ports <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2"
              placeholderTextColor="#999999"
              value={numberOfPorts}
              onChangeText={setNumberOfPorts}
              keyboardType="number-pad"
            />
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.label}>Amenities at Station</Text>
            <View style={styles.chipsContainer}>
              {AMENITIES.map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.chip,
                    selectedAmenities.includes(amenity) && styles.chipSelected,
                  ]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Ionicons
                    name={
                      amenity === 'restroom' ? 'male-female' :
                      amenity === 'cafe' ? 'cafe' :
                      amenity === 'wifi' ? 'wifi' :
                      amenity === 'parking' ? 'car' :
                      amenity === 'shopping' ? 'cart' : 'ellipse'
                    }
                    size={16}
                    color={selectedAmenities.includes(amenity) ? '#2E7D32' : '#666666'}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedAmenities.includes(amenity) && styles.chipTextSelected,
                    ]}
                  >
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nearby Amenities */}
          <View style={styles.section}>
            <Text style={styles.label}>Nearby Amenities (within 500m)</Text>
            <View style={styles.chipsContainer}>
              {NEARBY_AMENITIES.map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.chip,
                    selectedNearbyAmenities.includes(amenity) && styles.chipSelected,
                  ]}
                  onPress={() => toggleNearbyAmenity(amenity)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedNearbyAmenities.includes(amenity) && styles.chipTextSelected,
                    ]}
                  >
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Upload */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Photo Proof (Optional)</Text>
              <Text style={styles.photoCount}>{photos.length}/5</Text>
            </View>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="camera" size={24} color="#4CAF50" />
              <Text style={styles.uploadText}>Add Photos</Text>
            </TouchableOpacity>
            {photos.length > 0 && (
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removePhoto}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any helpful information..."
              placeholderTextColor="#999999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Charger</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your submission will start at Level 1 and can be promoted through community verification.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  rewardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  coordsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  coordsText: {
    fontSize: 12,
    color: '#666666',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  chipTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  photoCount: {
    fontSize: 12,
    color: '#999999',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
  },
});

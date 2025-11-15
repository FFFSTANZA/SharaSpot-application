import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionManager } from '../utils/secureStorage';
import axios from 'axios';
import Constants from 'expo-constants';
import { VerificationBadge } from '../components/VerificationBadge';
import { AmenitiesIcons } from '../components/AmenitiesIcons';
import { VerificationReportModal } from '../components/VerificationReportModal';
import { EnhancedVerificationModal, VerificationData } from '../components/EnhancedVerificationModal';
import { useAuth } from '../contexts/AuthContext';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ChargerDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const [charger, setCharger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);

  useEffect(() => {
    loadChargerDetails();
  }, []);

  const loadChargerDetails = async () => {
    try {
      // First try to parse from params (from list/map view)
      if (params.charger) {
        const chargerData = JSON.parse(params.charger as string);
        setCharger(chargerData);
        setLoading(false);
      } else if (params.id) {
        // Fetch from API if only ID provided
        const token = await SessionManager.getToken();
        const response = await axios.get(`${API_URL}/api/chargers/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCharger(response.data);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Load charger error:', error);
      if (error.response?.status === 404) {
        Alert.alert('Charger Not Found', 'This charging station could not be found. It may have been removed or the link is incorrect.');
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Failed to load charger details. Please check your connection and try again.');
      }
      setLoading(false);
      setCharger(null);
    }
  };

  const handleNavigate = () => {
    if (!charger) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${charger.latitude},${charger.longitude}`,
      android: `geo:0,0?q=${charger.latitude},${charger.longitude}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${charger.latitude},${charger.longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const handleOpenVerificationModal = () => {
    if (user?.is_guest) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to verify chargers',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.replace('/welcome') },
        ]
      );
      return;
    }
    setVerificationModalVisible(true);
  };

  const handleVerificationSubmit = async (data: VerificationData) => {
    setVerificationModalVisible(false);
    setActionLoading(data.action);

    try {
      const token = await SessionManager.getToken();
      const response = await axios.post(
        `${API_URL}/api/chargers/${charger.id}/verify`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const totalCoins = response.data.coins_earned;
      const baseCoins = response.data.base_coins;
      const bonusCoins = response.data.bonus_coins;
      const bonusReasons = response.data.bonus_reasons || [];
      const newLevel = response.data.new_level;

      let message = `🪙 +${totalCoins} SharaCoins earned!`;
      if (bonusCoins > 0) {
        message += `\n\n✨ Bonus: +${bonusCoins} (${bonusReasons.join(', ')})`;
      }
      message += `\n\nStation level: L${newLevel}`;

      Alert.alert('Verified! 🎉', message, [
        { text: 'OK', onPress: () => loadChargerDetails() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to verify charger');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!charger) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#CCCCCC" />
          <Text style={styles.errorText}>Charger not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Station Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={28} color="#4CAF50" />
            </View>
            <View style={styles.titleContent}>
              <Text style={styles.name}>{charger.name}</Text>
              <View style={styles.badgeRow}>
                <VerificationBadge level={charger.verification_level} size="medium" />
                <View
                  style={[
                    styles.sourceTag,
                    charger.source_type === 'official' ? styles.officialTag : styles.communityTag,
                  ]}
                >
                  <Text style={styles.sourceText}>
                    {charger.source_type === 'official' ? 'Official' : 'Community'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color="#666666" />
            <Text style={styles.address}>{charger.address}</Text>
          </View>

          <View style={styles.distanceRow}>
            <Ionicons name="navigate" size={20} color="#4CAF50" />
            <Text style={styles.distance}>{charger.distance} km away</Text>
          </View>
        </View>

        {/* Mini Map / Navigate Button */}
        <View style={styles.mapSection}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color="#CCCCCC" />
            <Text style={styles.mapPlaceholderText}>Map Preview</Text>
          </View>
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.navigateText}>Navigate via Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Community Verification */}
        {!user?.is_guest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Verification</Text>
            <Text style={styles.sectionDescription}>
              Help the community by verifying this station's status
            </Text>
            <TouchableOpacity
              style={styles.verifyStationButton}
              onPress={handleOpenVerificationModal}
              disabled={actionLoading !== null}
            >
              {actionLoading !== null ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <View style={styles.verifyButtonIcon}>
                    <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.verifyButtonContent}>
                    <Text style={styles.verifyButtonTitle}>Verify This Station</Text>
                    <Text style={styles.verifyButtonSubtitle}>
                      Earn up to 6 🪙 with detailed feedback
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{charger.verified_by_count}</Text>
            <Text style={styles.statLabel}>Verified By</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{charger.uptime_percentage.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Uptime</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <Text style={styles.statValue}>
              {charger.last_verified ? formatDate(charger.last_verified) : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Last Check</Text>
          </View>
        </View>

        {/* Port Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Ports</Text>
          <View style={styles.portRow}>
            <View style={styles.portsContainer}>
              {charger.port_types.map((type: string, index: number) => (
                <View key={index} style={styles.portCard}>
                  <Ionicons name="power" size={20} color="#4CAF50" />
                  <Text style={styles.portType}>{type}</Text>
                </View>
              ))}
            </View>
            <View style={styles.portCount}>
              <Text style={styles.portCountNumber}>
                {charger.available_ports}/{charger.total_ports}
              </Text>
              <Text style={styles.portCountLabel}>Available</Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        {charger.amenities && charger.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities at Station</Text>
            <View style={styles.amenitiesContainer}>
              {charger.amenities.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityCard}>
                  <Ionicons
                    name={
                      amenity === 'restroom' ? 'male-female' :
                      amenity === 'cafe' ? 'cafe' :
                      amenity === 'wifi' ? 'wifi' :
                      amenity === 'parking' ? 'car' :
                      amenity === 'shopping' ? 'cart' : 'ellipse'
                    }
                    size={24}
                    color="#666666"
                  />
                  <Text style={styles.amenityText}>
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nearby Amenities */}
        {charger.nearby_amenities && charger.nearby_amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby (within 500m)</Text>
            <View style={styles.nearbyContainer}>
              {charger.nearby_amenities.map((amenity: string, index: number) => (
                <View key={index} style={styles.nearbyChip}>
                  <Text style={styles.nearbyText}>
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Photos */}
        {charger.photos && charger.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosContainer}>
                {charger.photos.map((photo: string, index: number) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photo} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Notes */}
        {charger.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{charger.notes}</Text>
          </View>
        )}

        {/* View Report Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setReportModalVisible(true)}
          >
            <Ionicons name="document-text" size={20} color="#2196F3" />
            <Text style={styles.reportButtonText}>View Verification Report</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Verification Report Modal */}
      <VerificationReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        charger={charger}
      />

      {/* Enhanced Verification Modal */}
      <EnhancedVerificationModal
        visible={verificationModalVisible}
        onClose={() => setVerificationModalVisible(false)}
        onSubmit={handleVerificationSubmit}
        chargerName={charger?.name || ''}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBackButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  mainInfo: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  officialTag: {
    backgroundColor: '#E3F2FD',
  },
  communityTag: {
    backgroundColor: '#FFF3E0',
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  navigateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    minHeight: 90,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  notWorkingButton: {
    backgroundColor: '#F44336',
  },
  partialButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionReward: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  verifyStationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  verifyButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonContent: {
    flex: 1,
  },
  verifyButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  verifyButtonSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  portRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  portType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  portCount: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  portCountNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  portCountLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  nearbyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nearbyChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  nearbyText: {
    fontSize: 12,
    color: '#666666',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

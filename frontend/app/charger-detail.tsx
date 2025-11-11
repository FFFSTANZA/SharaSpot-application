import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VerificationBadge } from '../components/VerificationBadge';
import { AmenitiesIcons } from '../components/AmenitiesIcons';

export default function ChargerDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse the charger data from params
  const charger = params.charger ? JSON.parse(params.charger as string) : null;

  if (!charger) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Charger not found</Text>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Station Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Station Info */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={32} color="#4CAF50" />
            </View>
            <View style={styles.titleContent}>
              <Text style={styles.name}>{charger.name}</Text>
              <View style={styles.badgeRow}>
                <VerificationBadge level={charger.verification_level} size="medium" />
                <View style={[styles.sourceTag, charger.source_type === 'official' ? styles.officialTag : styles.communityTag]}>
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

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{charger.uptime_percentage}%</Text>
            <Text style={styles.statLabel}>Uptime</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flash" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{charger.available_ports}/{charger.total_ports}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{formatDate(charger.last_verified)}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
        </View>

        {/* Port Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Ports</Text>
          <View style={styles.portsContainer}>
            {charger.port_types.map((type: string, index: number) => (
              <View key={index} style={styles.portCard}>
                <Ionicons name="power" size={20} color="#4CAF50" />
                <Text style={styles.portType}>{type}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Amenities */}
        {charger.amenities && charger.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
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
                  <Text style={styles.amenityText}>{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.navigateButton}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.navigateText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportButton}>
            <Ionicons name="flag" size={20} color="#666666" />
            <Text style={styles.reportText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  portsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  portType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
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
  actions: {
    padding: 24,
    gap: 12,
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
});

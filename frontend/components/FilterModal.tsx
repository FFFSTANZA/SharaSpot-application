import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  currentFilters: Filters;
}

export interface Filters {
  verificationLevel: number | null;
  portType: string | null;
  amenity: string | null;
  maxDistance: number | null;
}

const VERIFICATION_LEVELS = [
  { value: null, label: 'All Levels' },
  { value: 5, label: 'L5 - Verified' },
  { value: 4, label: 'L4 & Above' },
  { value: 3, label: 'L3 & Above' },
  { value: 2, label: 'L2 & Above' },
];

const PORT_TYPES = [
  { value: null, label: 'All Types' },
  { value: 'Type 2', label: 'Type 2' },
  { value: 'CCS', label: 'CCS' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type 1', label: 'Type 1' },
];

const AMENITIES = [
  { value: null, label: 'All Amenities' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'cafe', label: 'Café' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'parking', label: 'Parking' },
  { value: 'shopping', label: 'Shopping' },
];

const DISTANCE_RANGES = [
  { value: null, label: 'Any Distance' },
  { value: 1, label: 'Within 1 km' },
  { value: 2, label: 'Within 2 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<Filters>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      verificationLevel: null,
      portType: null,
      amenity: null,
      maxDistance: null,
    };
    setFilters(resetFilters);
    onApply(resetFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Verification Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Level</Text>
              <View style={styles.optionsGrid}>
                {VERIFICATION_LEVELS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionButton,
                      filters.verificationLevel === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setFilters({ ...filters, verificationLevel: option.value })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.verificationLevel === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Port Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Port Type</Text>
              <View style={styles.optionsGrid}>
                {PORT_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionButton,
                      filters.portType === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setFilters({ ...filters, portType: option.value })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.portType === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.optionsGrid}>
                {AMENITIES.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionButton,
                      filters.amenity === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setFilters({ ...filters, amenity: option.value })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.amenity === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance Range</Text>
              <View style={styles.optionsGrid}>
                {DISTANCE_RANGES.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionButton,
                      filters.maxDistance === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setFilters({ ...filters, maxDistance: option.value })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.maxDistance === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary, // Section heading in Deep Teal (BRAND COLOR)
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary, // Section heading in Deep Teal (BRAND COLOR)
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    backgroundColor: Colors.primarySubtle, // Light Teal Background (BRAND COLOR)
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary, // Secondary text (BRAND COLOR)
  },
  optionTextActive: {
    color: Colors.primary, // Deep Teal for active chip (BRAND COLOR)
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.primarySubtle, // Light Teal Background (BRAND COLOR)
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary, // Secondary text (BRAND COLOR)
  },
  applyButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

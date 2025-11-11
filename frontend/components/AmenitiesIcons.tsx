import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AmenitiesIconsProps {
  amenities: string[];
  size?: number;
  color?: string;
}

const AMENITY_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  restroom: 'male-female',
  cafe: 'cafe',
  wifi: 'wifi',
  parking: 'car',
  shopping: 'cart',
};

export const AmenitiesIcons: React.FC<AmenitiesIconsProps> = ({ 
  amenities, 
  size = 16, 
  color = '#666666' 
}) => {
  return (
    <View style={styles.container}>
      {amenities.slice(0, 5).map((amenity, index) => {
        const iconName = AMENITY_ICONS[amenity] || 'ellipse';
        return (
          <View key={index} style={styles.iconWrapper}>
            <Ionicons name={iconName} size={size} color={color} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  iconWrapper: {
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderRadius: 6,
  },
});

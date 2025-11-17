import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

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
  color = Colors.textSecondary
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
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 6,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

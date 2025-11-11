import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileTest() {
  return (
    <View style={styles.container}>
      <Text>Profile Test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

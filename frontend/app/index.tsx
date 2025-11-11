import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading, needsPreferences } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/welcome');
      } else if (needsPreferences && !user.is_guest) {
        router.replace('/preferences');
      } else {
        router.replace('/home');
      }
    }
  }, [loading, user, needsPreferences]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

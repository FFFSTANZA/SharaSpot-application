import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function Welcome() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const handleGoogleSignIn = () => {
    // For MVP, we'll show info that this opens browser
    alert('Google Sign-In will open in your browser. For testing, use email/password login.');
  };

  const handleGuest = async () => {
    try {
      await continueAsGuest();
      router.replace('/home');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="flash" size={80} color="#4CAF50" />
          <Text style={styles.title}>SharaSpot</Text>
          <Text style={styles.subtitle}>Whether you drive, Charge Nearby</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Ionicons name="logo-google" size={24} color="#DB4437" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.emailButton} onPress={() => router.push('/login')}>
            <Ionicons name="mail" size={24} color="#FFFFFF" />
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>Guest mode has limited features</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  buttonsContainer: {
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signupButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999999',
    marginTop: 24,
  },
});

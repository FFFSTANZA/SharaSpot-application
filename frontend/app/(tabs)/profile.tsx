import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface ProfileStats {
  shara_coins: number;
  chargers_added: number;
  verifications_count: number;
  photos_uploaded: number;
  reports_submitted: number;
  trust_score: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileStats();
  }, []);

  const loadProfileStats = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/api/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      // Set default stats if API fails
      setStats({
        shara_coins: 0,
        chargers_added: 0,
        verifications_count: 0,
        photos_uploaded: 0,
        reports_submitted: 0,
        trust_score: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/preferences');
  };

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'Platinum', color: '#9C27B0', icon: 'star' };
    if (score >= 75) return { level: 'Gold', color: '#FFB300', icon: 'trophy' };
    if (score >= 50) return { level: 'Silver', color: '#2196F3', icon: 'ribbon' };
    return { level: 'Bronze', color: '#4CAF50', icon: 'leaf' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D3FE8" />
      </View>
    );
  }

  const trustInfo = getTrustLevel(stats?.trust_score || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Premium Header with Gradient */}
        <LinearGradient
          colors={['#2D3FE8', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Settings Icon */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#06B6D4', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          {/* Trust Badge */}
          <View style={[styles.trustBadge, { backgroundColor: trustInfo.color + '20' }]}>
            <Ionicons name={trustInfo.icon as any} size={16} color={trustInfo.color} />
            <Text style={[styles.trustText, { color: trustInfo.color }]}>
              {trustInfo.level} Member
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          
          {/* SharaCoins Card */}
          <TouchableOpacity
            style={styles.coinsCard}
            onPress={() => {
              Alert.alert(
                '🎉 Coming Soon!',
                'Exciting rewards and coupon redemption features are currently under development. Stay tuned for amazing offers!\n\nYour SharaCoins will unlock:\n• Exclusive EV charging discounts\n• Premium features\n• Partner rewards\n• And much more!',
                [{ text: 'Got it!', style: 'default' }]
              );
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F97316', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coinsGradient}
            >
              <View style={styles.coinsContent}>
                <View style={styles.coinsLeft}>
                  <Ionicons name="diamond" size={32} color="#FFFFFF" />
                  <View style={styles.coinsInfo}>
                    <Text style={styles.coinsLabel}>SharaCoins</Text>
                    <Text style={styles.coinsValue}>{stats?.shara_coins || 0}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#2D3FE8' + '15' }]}>
                <Ionicons name="flash" size={24} color="#2D3FE8" />
              </View>
              <Text style={styles.statValue}>{stats?.chargers_added || 0}</Text>
              <Text style={styles.statLabel}>Chargers Added</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#0EA5E9' + '15' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
              </View>
              <Text style={styles.statValue}>{stats?.verifications_count || 0}</Text>
              <Text style={styles.statLabel}>Verifications</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#06B6D4' + '15' }]}>
                <Ionicons name="camera" size={24} color="#06B6D4" />
              </View>
              <Text style={styles.statValue}>{stats?.photos_uploaded || 0}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F97316' + '15' }]}>
                <Ionicons name="alert-circle" size={24} color="#F97316" />
              </View>
              <Text style={styles.statValue}>{stats?.reports_submitted || 0}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
          </View>

          {/* Trust Score Progress */}
          <View style={styles.trustScoreCard}>
            <View style={styles.trustScoreHeader}>
              <Text style={styles.trustScoreTitle}>Trust Score</Text>
              <Text style={styles.trustScoreValue}>{stats?.trust_score || 0}/100</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#2D3FE8', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${stats?.trust_score || 0}%` }]}
              />
            </View>
            <Text style={styles.trustScoreDescription}>
              Keep contributing to increase your trust score and unlock rewards!
            </Text>
          </View>
        </View>

        {/* Vehicle Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconCircle}>
                <Ionicons name="car-sport" size={24} color="#2D3FE8" />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>Vehicle Type</Text>
                <Text style={styles.vehicleValue}>{user?.vehicle_type || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.vehicleDivider} />
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconCircle}>
                <Ionicons name="plug" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>Port Type</Text>
                <Text style={styles.vehicleValue}>{user?.port_type || 'Not set'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditProfile}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#2D3FE8' + '15' }]}>
                <Ionicons name="person-outline" size={20} color="#2D3FE8" />
              </View>
              <Text style={styles.actionText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-charger')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#0EA5E9' + '15' }]}>
                <Ionicons name="add-circle-outline" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.actionText}>Add Hidden Charger</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#06B6D4' + '15' }]}>
                <Ionicons name="time-outline" size={20} color="#06B6D4" />
              </View>
              <Text style={styles.actionText}>My Activity</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#2D3FE8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  settingsButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2D3FE8',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    marginTop: 24,
  },
  coinsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  coinsGradient: {
    padding: 20,
  },
  coinsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coinsInfo: {
    gap: 4,
  },
  coinsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  coinsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  trustScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  trustScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  trustScoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3FE8',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  trustScoreDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 24,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  vehicleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomPadding: {
    height: 24,
  },
});

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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const { width: windowWidth } = useWindowDimensions();
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

  const handleGoHome = () => {
    router.push('/(tabs)');
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
          colors={Colors.gradientPremium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleGoHome}
            >
              <Ionicons name="home" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.accentCyan, Colors.accentPurple]}
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
                'Coming Soon!',
                'Exciting rewards and coupon redemption features are currently under development. Stay tuned for amazing offers!\n\nYour SharaCoins will unlock:\n• Exclusive EV charging discounts\n• Premium features\n• Partner rewards\n• And much more!',
                [{ text: 'Got it!', style: 'default' }]
              );
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primaryLight, Colors.accentAmber]}
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
            <View style={[styles.statCard, { width: (windowWidth - 60) / 2 }]}>
              <View style={[styles.statIconCircle, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="flash" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats?.chargers_added || 0}</Text>
              <Text style={styles.statLabel}>Chargers Added</Text>
            </View>

            <View style={[styles.statCard, { width: (windowWidth - 60) / 2 }]}>
              <View style={[styles.statIconCircle, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{stats?.verifications_count || 0}</Text>
              <Text style={styles.statLabel}>Verifications</Text>
            </View>

            <View style={[styles.statCard, { width: (windowWidth - 60) / 2 }]}>
              <View style={[styles.statIconCircle, { backgroundColor: Colors.accentCyan + '15' }]}>
                <Ionicons name="camera" size={24} color={Colors.accentCyan} />
              </View>
              <Text style={styles.statValue}>{stats?.photos_uploaded || 0}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>

            <View style={[styles.statCard, { width: (windowWidth - 60) / 2 }]}>
              <View style={[styles.statIconCircle, { backgroundColor: Colors.warning + '15' }]}>
                <Ionicons name="alert-circle" size={24} color={Colors.warning} />
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
                colors={Colors.gradientPremium}
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
                <Ionicons name="car-sport" size={24} color={Colors.primary} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>Vehicle Type</Text>
                <Text style={styles.vehicleValue}>{user?.vehicle_type || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.vehicleDivider} />
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconCircle}>
                <Ionicons name="plug" size={24} color={Colors.accentPurple} />
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
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-charger')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.success} />
              </View>
              <Text style={styles.actionText}>Add Hidden Charger</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.xxxl,
    borderBottomRightRadius: BorderRadius.xxxl,
    ...Shadows.xl,
  },
  headerActions: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.displayMedium,
    color: Colors.primary,
  },
  userName: {
    ...Typography.headlineSmall,
    color: Colors.textInverse,
    marginBottom: 4,
  },
  userEmail: {
    ...Typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.md,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  trustText: {
    ...Typography.labelLarge,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  coinsCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.primaryGlow,
    marginBottom: Spacing.lg,
  },
  coinsGradient: {
    padding: Spacing.xl,
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
    ...Typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  coinsValue: {
    ...Typography.displaySmall,
    color: Colors.textInverse,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['3'],
    marginBottom: Spacing.lg,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  statValue: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  trustScoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  trustScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  trustScoreTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  trustScoreValue: {
    ...Typography.titleLarge,
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
    marginBottom: Spacing['3'],
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  trustScoreDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  vehicleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  vehicleValue: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing['3'],
    ...Shadows.xs,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.errorLight,
    ...Shadows.xs,
  },
  logoutIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...Typography.titleMedium,
    color: Colors.error,
    flex: 1,
    marginLeft: Spacing['3'],
    fontWeight: '600',
  },
  bottomPadding: {
    height: Spacing.lg,
  },
});

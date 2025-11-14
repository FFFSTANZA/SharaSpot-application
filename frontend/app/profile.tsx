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
  Switch,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any>(null);
  const [theme, setTheme] = useState('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'profile' | 'wallet' | 'settings'>('profile');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');

      const statsResponse = await axios.get(`${API_URL}/api/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsResponse.data);

      const transactionsResponse = await axios.get(`${API_URL}/api/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(transactionsResponse.data);
    } catch (error: any) {
      console.error('Load profile error:', error);
      if (error.response?.status === 404) {
        Alert.alert('Profile Not Found', 'Unable to load profile data. The API endpoint may be unavailable.');
      } else if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to view your profile.');
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Failed to load profile data. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileData();
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

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 50) return '#2196F3';
    if (score >= 30) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'profile' && styles.tabActive]}
          onPress={() => setSelectedTab('profile')}
        >
          <Ionicons name="person" size={24} color={selectedTab === 'profile' ? '#4CAF50' : '#999999'} />
          <Text style={[styles.tabText, selectedTab === 'profile' && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'wallet' && styles.tabActive]}
          onPress={() => setSelectedTab('wallet')}
        >
          <Ionicons name="wallet" size={24} color={selectedTab === 'wallet' ? '#4CAF50' : '#999999'} />
          <Text style={[styles.tabText, selectedTab === 'wallet' && styles.tabTextActive]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'settings' && styles.tabActive]}
          onPress={() => setSelectedTab('settings')}
        >
          <Ionicons name="settings" size={24} color={selectedTab === 'settings' ? '#4CAF50' : '#999999'} />
          <Text style={[styles.tabText, selectedTab === 'settings' && styles.tabTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Tab */}
      {selectedTab === 'profile' && (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          <View style={styles.coinCard}>
            <View style={styles.coinHeader}>
              <Ionicons name="diamond" size={32} color="#FFB300" />
              <View style={styles.coinInfo}>
                <Text style={styles.coinLabel}>SharaCoin Balance</Text>
                <Text style={styles.coinValue}>{stats?.shara_coins || 0} coins</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.redeemButton} onPress={() => setRedeemModalVisible(true)}>
              <Text style={styles.redeemButtonText}>Redeem Coins</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trust Score</Text>
            <View style={styles.trustCard}>
              <Text style={[styles.trustScore, { color: getTrustScoreColor(stats?.trust_score || 0) }]}>
                {stats?.trust_score || 0}%
              </Text>
              <Text style={styles.trustLabel}>Trusted Contributor</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${stats?.trust_score || 0}%`, backgroundColor: getTrustScoreColor(stats?.trust_score || 0) }]} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="add-circle" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats?.chargers_added || 0}</Text>
                <Text style={styles.statLabel}>Added</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>{stats?.verifications_count || 0}</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="camera" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{stats?.photos_uploaded || 0}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Wallet Tab */}
      {selectedTab === 'wallet' && (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <View style={styles.walletSummary}>
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>{transactions?.total_coins || 0}</Text>
              <Text style={styles.walletStatLabel}>Balance</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>{transactions?.coins_earned || 0}</Text>
              <Text style={styles.walletStatLabel}>Earned</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>{transactions?.coins_redeemed || 0}</Text>
              <Text style={styles.walletStatLabel}>Redeemed</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earning Guide</Text>
            <View style={styles.earningCard}>
              <View style={styles.earningRow}>
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={styles.earningText}>+5 coins</Text>
                <Text style={styles.earningLabel}>Add charger</Text>
              </View>
              <View style={styles.earningRow}>
                <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                <Text style={styles.earningText}>+2 coins</Text>
                <Text style={styles.earningLabel}>Verify charger</Text>
              </View>
              <View style={styles.earningRow}>
                <Ionicons name="camera" size={20} color="#FF9800" />
                <Text style={styles.earningText}>+3 coins</Text>
                <Text style={styles.earningLabel}>Upload photo</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions?.transactions && transactions.transactions.length > 0 ? (
              transactions.transactions.map((txn: any, idx: number) => (
                <View key={idx} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <Ionicons name={txn.amount > 0 ? 'add-circle' : 'remove-circle'} size={24} color={txn.amount > 0 ? '#4CAF50' : '#F44336'} />
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{txn.description}</Text>
                      <Text style={styles.transactionDate}>{formatDate(txn.timestamp)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: txn.amount > 0 ? '#4CAF50' : '#F44336' }]}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No transactions yet</Text>
            )}
          </View>

          <View style={styles.couponStatus}>
            <Ionicons name="ticket" size={24} color="#FF9800" />
            <Text style={styles.couponStatusText}>Coupon Access: Pending Approval</Text>
          </View>
        </ScrollView>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <ScrollView>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name={theme === 'light' ? 'sunny' : 'moon'} size={24} color="#666666" />
                <Text style={styles.settingLabel}>Theme</Text>
              </View>
              <TouchableOpacity style={styles.themeToggle} onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                <Text style={styles.themeText}>{theme === 'light' ? 'Light' : 'Dark'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color="#666666" />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={24} color="#F44336" />
              <Text style={[styles.settingLabel, { color: '#F44336' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Redeem Modal */}
      <Modal visible={redeemModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Coins</Text>
              <TouchableOpacity onPress={() => setRedeemModalVisible(false)}>
                <Ionicons name="close" size={28} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Ionicons name="ticket" size={64} color="#FFB300" />
              <Text style={styles.modalHeading}>Coupons Coming Soon!</Text>
              <Text style={styles.modalText}>
                EV charging discount coupons will be available soon.
              </Text>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => setRedeemModalVisible(false)}>
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4CAF50' },
  tabText: { fontSize: 12, color: '#999999' },
  tabTextActive: { color: '#4CAF50', fontWeight: '600' },
  profileHeader: { backgroundColor: '#FFFFFF', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666666' },
  coinCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 16, elevation: 3 },
  coinHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  coinInfo: { flex: 1 },
  coinLabel: { fontSize: 14, color: '#666666', marginBottom: 4 },
  coinValue: { fontSize: 28, fontWeight: '700', color: '#FFB300' },
  redeemButton: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  redeemButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  section: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  trustCard: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, alignItems: 'center' },
  trustScore: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  trustLabel: { fontSize: 14, color: '#666666', marginBottom: 12 },
  progressBarContainer: { height: 8, width: '100%', backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#666666', textAlign: 'center' },
  walletSummary: { flexDirection: 'row', backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 16, elevation: 3 },
  walletStat: { flex: 1, alignItems: 'center' },
  walletStatValue: { fontSize: 24, fontWeight: '700', color: '#4CAF50', marginBottom: 4 },
  walletStatLabel: { fontSize: 12, color: '#666666' },
  walletDivider: { width: 1, backgroundColor: '#E0E0E0' },
  earningCard: { gap: 12 },
  earningRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  earningText: { fontSize: 14, fontWeight: '600', color: '#4CAF50', width: 70 },
  earningLabel: { flex: 1, fontSize: 14, color: '#666666' },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 8 },
  transactionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionInfo: { flex: 1 },
  transactionDescription: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#999999' },
  transactionAmount: { fontSize: 16, fontWeight: '700' },
  couponStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E0', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, gap: 12 },
  couponStatusText: { fontSize: 14, fontWeight: '600', color: '#F57C00' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16, color: '#1A1A1A' },
  themeToggle: { backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  themeText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  emptyText: { fontSize: 14, color: '#999999', textAlign: 'center', paddingVertical: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '85%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  modalContent: { padding: 32, alignItems: 'center' },
  modalHeading: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginTop: 16, marginBottom: 12 },
  modalText: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 20 },
  modalButton: { backgroundColor: '#4CAF50', paddingVertical: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

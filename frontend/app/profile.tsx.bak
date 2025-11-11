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
  Image,
  Modal,
  RefreshControl,
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
  const [activity, setActivity] = useState<any>(null);
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
      
      // Load stats
      const statsResponse = await axios.get(`${API_URL}/api/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsResponse.data);
      
      // Load activity
      const activityResponse = await axios.get(`${API_URL}/api/profile/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivity(activityResponse.data);
      
      // Load transactions
      const transactionsResponse = await axios.get(`${API_URL}/api/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(transactionsResponse.data);
      
      // Load settings
      setTheme(user?.theme || 'light');
      setNotificationsEnabled(user?.notifications_enabled !== false);
    } catch (error) {
      console.error('Load profile error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleUpdateSettings = async (key: string, value: any) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      await axios.put(
        `${API_URL}/api/settings`,
        { [key]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Update settings error:', error);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await handleUpdateSettings('theme', newTheme);
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await handleUpdateSettings('notifications_enabled', value);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 50) return '#2196F3';
    if (score >= 30) return '#FF9800';
    return '#F44336';
  };

  const renderProfileTab = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* SharaCoin Balance */}
      <View style={styles.coinCard}>
        <View style={styles.coinHeader}>
          <Ionicons name="diamond" size={32} color="#FFB300" />
          <View style={styles.coinInfo}>
            <Text style={styles.coinLabel}>SharaCoin Balance</Text>
            <Text style={styles.coinValue}>{stats?.shara_coins || 0} \ud83e\ude99</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => setRedeemModalVisible(true)}
        >
          <Text style={styles.redeemButtonText}>Redeem Coins</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Vehicle Details */}
      {user?.vehicle_type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="car" size={20} color="#666666" />
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{user.vehicle_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="power" size={20} color="#666666" />
              <Text style={styles.detailLabel}>Port:</Text>
              <Text style={styles.detailValue}>{user.port_type || 'Not set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="speedometer" size={20} color="#666666" />
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>{user.distance_unit || 'km'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Trust Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trust Score</Text>
        <View style={styles.trustCard}>
          <View style={styles.trustHeader}>
            <Text style={[styles.trustScore, { color: getTrustScoreColor(stats?.trust_score || 0) }]}>
              {stats?.trust_score || 0}%
            </Text>
            <Text style={styles.trustLabel}>Trusted Contributor</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${stats?.trust_score || 0}%`, backgroundColor: getTrustScoreColor(stats?.trust_score || 0) }]} />
          </View>
        </View>
      </View>

      {/* Activity Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats?.chargers_added || 0}</Text>
            <Text style={styles.statLabel}>Chargers Added</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>{stats?.verifications_count || 0}</Text>
            <Text style={styles.statLabel}>Verifications</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="camera" size={24} color="#FF9800" />
            <Text style={styles.statNumber}>{stats?.photos_uploaded || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>
      </View>

      {/* My Submissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Submissions</Text>
        {activity?.submissions && activity.submissions.length > 0 ? (
          activity.submissions.slice(0, 5).map((charger: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.activityCard}
              onPress={() => router.push({
                pathname: '/charger-detail',
                params: { charger: JSON.stringify(charger) },
              })}
            >
              <Ionicons name="flash" size={20} color="#4CAF50" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{charger.name}</Text>
                <Text style={styles.activityAddress}>{charger.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No submissions yet</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderWalletTab = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
      }
    >
      {/* Wallet Summary */}
      <View style={styles.walletSummary}>
        <View style={styles.walletStat}>
          <Text style={styles.walletStatValue}>{transactions?.total_coins || 0}</Text>
          <Text style={styles.walletStatLabel}>Current Balance</Text>
        </View>
        <View style={styles.walletDivider} />
        <View style={styles.walletStat}>
          <Text style={styles.walletStatValue}>{transactions?.coins_earned || 0}</Text>
          <Text style={styles.walletStatLabel}>Total Earned</Text>
        </View>
        <View style={styles.walletDivider} />
        <View style={styles.walletStat}>
          <Text style={styles.walletStatValue}>{transactions?.coins_redeemed || 0}</Text>
          <Text style={styles.walletStatLabel}>Redeemed</Text>
        </View>
      </View>

      {/* Earning Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Earn Coins</Text>
        <View style={styles.earningCard}>
          <View style={styles.earningRow}>
            <Ionicons name="add-circle" size={20} color="#4CAF50" />
            <Text style={styles.earningText}>+5 coins</Text>
            <Text style={styles.earningLabel}>Add new charger</Text>
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
          <View style={styles.earningRow}>
            <Ionicons name="flag" size={20} color="#F44336" />
            <Text style={styles.earningText}>+1 coin</Text>
            <Text style={styles.earningLabel}>Report invalid data</Text>
          </View>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coin Logs</Text>
        {transactions?.transactions && transactions.transactions.length > 0 ? (
          transactions.transactions.map((transaction: any, index: number) => (
            <View key={index} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <Ionicons
                  name={
                    transaction.action === 'add_charger' ? 'add-circle' :
                    transaction.action === 'verify_charger' ? 'checkmark-circle' :
                    transaction.action === 'upload_photo' ? 'camera' :
                    transaction.action === 'report_invalid' ? 'flag' :
                    'diamond'
                  }
                  size={24}
                  color={transaction.amount > 0 ? '#4CAF50' : '#F44336'}
                />
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.timestamp)}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.amount > 0 ? '#4CAF50' : '#F44336' }
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}{transaction.amount} \ud83e\ude99
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}
      </View>

      {/* Coupon Status */}
      <View style={styles.couponStatus}>
        <Ionicons name="ticket" size={24} color="#FF9800" />
        <Text style={styles.couponStatusText}>Coupon Access: Pending Approval</Text>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView>
      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={theme === 'light' ? 'sunny' : 'moon'} size={24} color="#666666" />
            <Text style={styles.settingLabel}>Theme</Text>
          </View>
          <TouchableOpacity style={styles.themeToggle} onPress={handleThemeToggle}>
            <Text style={styles.themeText}>{theme === 'light' ? 'Light' : 'Dark'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color="#666666" />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#F44336" />
          <Text style={[styles.settingLabel, { color: '#F44336' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRedeemModal = () => (
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
              EV charging discount coupons and partner store offers will be available soon.
            </Text>
            <View style={styles.modalStatus}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.modalStatusText}>Access: Pending Approval</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setRedeemModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          <Text style={[styles.tabText, selectedTab === 'profile' && styles.tabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'wallet' && styles.tabActive]}
          onPress={() => setSelectedTab('wallet')}
        >
          <Ionicons name="wallet" size={24} color={selectedTab === 'wallet' ? '#4CAF50' : '#999999'} />
          <Text style={[styles.tabText, selectedTab === 'wallet' && styles.tabTextActive]}>
            Wallet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'settings' && styles.tabActive]}
          onPress={() => setSelectedTab('settings')}
        >
          <Ionicons name="settings" size={24} color={selectedTab === 'settings' ? '#4CAF50' : '#999999'} />
          <Text style={[styles.tabText, selectedTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === 'profile' && renderProfileTab()}
      {selectedTab === 'wallet' && renderWalletTab()}
      {selectedTab === 'settings' && renderSettingsTab()}

      {/* Redeem Modal */}
      {renderRedeemModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 12,
    color: '#999999',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  coinCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  coinInfo: {
    flex: 1,
  },
  coinLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  coinValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFB300',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  detailCard: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  trustCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  trustHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  trustScore: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  trustLabel: {
    fontSize: 14,
    color: '#666666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  activityAddress: {
    fontSize: 12,
    color: '#666666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  walletSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  walletStat: {
    flex: 1,
    alignItems: 'center',
  },
  walletStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  walletStatLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  walletDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  earningCard: {
    gap: 12,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  earningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    width: 70,
  },
  earningLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  couponStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  couponStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  themeToggle: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalContent: {
    padding: 32,
    alignItems: 'center',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

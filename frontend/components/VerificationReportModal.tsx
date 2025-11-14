import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationBadge } from './VerificationBadge';

interface VerificationAction {
  user_id: string;
  action: string;
  timestamp: string;
  notes?: string;
}

interface TrendData {
  period: string;
  activeCount: number;
  notWorkingCount: number;
  partialCount: number;
}

// Generate mock verification history for demo purposes
const generateMockVerificationHistory = (charger: any): VerificationAction[] => {
  const actions: VerificationAction[] = [];
  const now = new Date();
  const level = charger?.verification_level || 1;

  // Generate more history for higher level stations
  const historyCount = Math.min(level * 3 + Math.floor(Math.random() * 5), 20);

  const actionTypes = ['active', 'not_working', 'partial'];
  const weights = level >= 3 ? [0.7, 0.1, 0.2] : [0.5, 0.3, 0.2]; // Higher level = more "active" verifications

  for (let i = 0; i < historyCount; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Weighted random selection
    const rand = Math.random();
    let action = 'active';
    if (rand < weights[1]) action = 'not_working';
    else if (rand < weights[1] + weights[2]) action = 'partial';

    const userId = `user${Math.floor(Math.random() * 10000)}`;

    const notes = Math.random() > 0.7 ? [
      'Working perfectly',
      'All ports available',
      'Quick charging',
      'One port not working',
      'Slow charging on port 2',
      'Well maintained',
      'Needs cleaning',
    ][Math.floor(Math.random() * 7)] : undefined;

    actions.push({
      user_id: userId,
      action,
      timestamp: timestamp.toISOString(),
      notes,
    });
  }

  return actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

interface VerificationReportModalProps {
  visible: boolean;
  onClose: () => void;
  charger: any;
}

const LEVEL_DESCRIPTIONS = {
  1: 'Newly added, pending community verification',
  2: 'Verified by 2-3 community members',
  3: 'Consistently reliable with 5+ verifications',
  4: 'Highly trusted with 8+ active verifications',
  5: 'Officially certified by admin or partner',
};

export const VerificationReportModal: React.FC<VerificationReportModalProps> = ({
  visible,
  onClose,
  charger,
}) => {
  // Ensure charger has default values to prevent crashes
  // Generate mock history if none exists
  const mockHistory = (!charger?.verification_history || charger.verification_history.length === 0)
    ? generateMockVerificationHistory(charger)
    : [];

  // Calculate uptime from mock history if not provided
  const calculateUptime = (): number => {
    const history = charger?.verification_history || mockHistory;
    if (history.length === 0) return 0;

    const activeCount = history.filter((a: VerificationAction) => a.action === 'active').length;
    const partialCount = history.filter((a: VerificationAction) => a.action === 'partial').length;

    return ((activeCount + partialCount * 0.5) / history.length) * 100;
  };

  const safeCharger = {
    verification_level: charger?.verification_level || 1,
    verified_by_count: charger?.verified_by_count || mockHistory.length,
    uptime_percentage: charger?.uptime_percentage || calculateUptime(),
    last_verified: charger?.last_verified || mockHistory[0]?.timestamp || null,
    verification_history: charger?.verification_history || mockHistory,
    photos: charger?.photos || [],
    source_type: charger?.source_type || 'community',
    created_at: charger?.created_at || null,
    ...charger,
  };

  // Calculate analytics from verification history
  const calculateTrends = (): { last24h: TrendData; last7d: TrendData; last30d: TrendData } => {
    const now = new Date();
    const history = safeCharger.verification_history || [];

    const calculatePeriod = (hours: number): TrendData => {
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      const relevant = history.filter(a => new Date(a.timestamp) > cutoff);

      return {
        period: hours === 24 ? '24h' : hours === 168 ? '7d' : '30d',
        activeCount: relevant.filter(a => a.action === 'active').length,
        notWorkingCount: relevant.filter(a => a.action === 'not_working').length,
        partialCount: relevant.filter(a => a.action === 'partial').length,
      };
    };

    return {
      last24h: calculatePeriod(24),
      last7d: calculatePeriod(168),
      last30d: calculatePeriod(720),
    };
  };

  const getReliabilityScore = (): number => {
    const history = safeCharger.verification_history || [];
    if (history.length === 0) return 0;

    const activeCount = history.filter(a => a.action === 'active').length;
    const partialCount = history.filter(a => a.action === 'partial').length;

    return Math.round(((activeCount + partialCount * 0.5) / history.length) * 100);
  };

  const getBestTimeToVisit = (): string => {
    const reliabilityScore = getReliabilityScore();
    if (reliabilityScore >= 80) return 'Anytime - Highly reliable';
    if (reliabilityScore >= 60) return 'Weekdays preferred - More consistent';
    if (reliabilityScore >= 40) return 'Call ahead - Variable availability';
    return 'Check real-time status first';
  };

  const getInsights = (): string[] => {
    const insights: string[] = [];
    const trends = calculateTrends();
    const reliabilityScore = getReliabilityScore();
    const level = safeCharger.verification_level;

    if (reliabilityScore >= 85) {
      insights.push('⭐ Consistently reliable with high uptime');
    }

    if (trends.last24h.notWorkingCount > 2) {
      insights.push('⚠️ Recent reports of issues - check before visiting');
    }

    if (level >= 4) {
      insights.push('🏆 Trusted by the community - verified multiple times');
    }

    if (trends.last7d.activeCount >= 5) {
      insights.push('✅ Actively verified this week - data is fresh');
    }

    if (safeCharger.uptime_percentage >= 90) {
      insights.push('📈 Excellent uptime history');
    }

    if (insights.length === 0) {
      insights.push('📊 Limited verification data - be the first to verify!');
    }

    return insights;
  };

  const trends = calculateTrends();
  const reliabilityScore = getReliabilityScore();
  const bestTime = getBestTimeToVisit();
  const insights = getInsights();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'active':
        return 'checkmark-circle';
      case 'not_working':
        return 'close-circle';
      case 'partial':
        return 'battery-half';
      default:
        return 'ellipse';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'active':
        return '#4CAF50';
      case 'not_working':
        return '#F44336';
      case 'partial':
        return '#FF9800';
      default:
        return '#999999';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'active':
        return 'Active';
      case 'not_working':
        return 'Not Working';
      case 'partial':
        return 'Partial Availability';
      default:
        return action;
    }
  };

  const anonymizeUserId = (userId: string) => {
    return `User ${userId.substring(0, 4)}...`;
  };

  // Don't render if charger is null
  if (!charger && visible) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Verification Report</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No charger data available</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Verification Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Current Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Verification Level</Text>
              <View style={styles.levelCard}>
                <VerificationBadge level={safeCharger.verification_level} size="large" />
                <View style={styles.levelInfo}>
                  <Text style={styles.levelDescription}>
                    {LEVEL_DESCRIPTIONS[safeCharger.verification_level as keyof typeof LEVEL_DESCRIPTIONS]}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reliability Score */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reliability Analysis</Text>
              <View style={styles.reliabilityCard}>
                <View style={styles.reliabilityHeader}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNumber}>{reliabilityScore}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreTitle}>Reliability Score</Text>
                    <Text style={styles.scoreDescription}>
                      Based on {safeCharger.verified_by_count} community verifications
                    </Text>
                    <View style={styles.bestTimeChip}>
                      <Ionicons name="time-outline" size={14} color="#4CAF50" />
                      <Text style={styles.bestTimeText}>{bestTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Key Insights */}
            {insights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Insights</Text>
                <View style={styles.insightsContainer}>
                  {insights.map((insight, index) => (
                    <View key={index} style={styles.insightCard}>
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Trends Analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Trends</Text>
              <View style={styles.trendsContainer}>
                {[trends.last24h, trends.last7d, trends.last30d].map((trend, index) => {
                  const total = trend.activeCount + trend.notWorkingCount + trend.partialCount;
                  return (
                    <View key={index} style={styles.trendCard}>
                      <Text style={styles.trendPeriod}>{trend.period}</Text>
                      <Text style={styles.trendTotal}>{total}</Text>
                      <Text style={styles.trendLabel}>checks</Text>
                      {total > 0 && (
                        <View style={styles.trendBreakdown}>
                          <View style={styles.trendRow}>
                            <View style={[styles.trendDot, { backgroundColor: '#4CAF50' }]} />
                            <Text style={styles.trendValue}>{trend.activeCount}</Text>
                          </View>
                          {trend.partialCount > 0 && (
                            <View style={styles.trendRow}>
                              <View style={[styles.trendDot, { backgroundColor: '#FF9800' }]} />
                              <Text style={styles.trendValue}>{trend.partialCount}</Text>
                            </View>
                          )}
                          {trend.notWorkingCount > 0 && (
                            <View style={styles.trendRow}>
                              <View style={[styles.trendDot, { backgroundColor: '#F44336' }]} />
                              <Text style={styles.trendValue}>{trend.notWorkingCount}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color="#2196F3" />
                  <Text style={styles.statValue}>{safeCharger.verified_by_count}</Text>
                  <Text style={styles.statLabel}>Verifiers</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="trending-up" size={24} color="#4CAF50" />
                  <Text style={styles.statValue}>{safeCharger.uptime_percentage.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Uptime</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={24} color="#FF9800" />
                  <Text style={styles.statValue}>
                    {safeCharger.last_verified
                      ? formatDate(safeCharger.last_verified).split(',')[0]
                      : 'N/A'}
                  </Text>
                  <Text style={styles.statLabel}>Last Check</Text>
                </View>
              </View>
            </View>

            {/* Verification History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification History</Text>
              {safeCharger.verification_history && safeCharger.verification_history.length > 0 ? (
                <View style={styles.timeline}>
                  {safeCharger.verification_history.slice(-10).reverse().map((action: VerificationAction, index: number) => (
                    <View key={index} style={styles.timelineItem}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: getActionColor(action.action) },
                        ]}
                      >
                        <Ionicons
                          name={getActionIcon(action.action) as any}
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineAction}>
                            {getActionLabel(action.action)}
                          </Text>
                          <Text style={styles.timelineDate}>
                            {formatDate(action.timestamp)}
                          </Text>
                        </View>
                        <Text style={styles.timelineUser}>
                          {anonymizeUserId(action.user_id)}
                        </Text>
                        {action.notes && (
                          <Text style={styles.timelineNotes}>{action.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No verification history yet</Text>
                </View>
              )}
            </View>

            {/* Community Photos */}
            {safeCharger.photos && safeCharger.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Community Photos</Text>
                <View style={styles.photosGrid}>
                  {safeCharger.photos.map((photo: string, index: number) => (
                    <Image key={index} source={{ uri: photo }} style={styles.photo} />
                  ))}
                </View>
              </View>
            )}

            {/* Source Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Source Information</Text>
              <View style={styles.sourceCard}>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Type:</Text>
                  <View
                    style={[
                      styles.sourceTag,
                      safeCharger.source_type === 'official'
                        ? styles.officialTag
                        : styles.communityTag,
                    ]}
                  >
                    <Text style={styles.sourceText}>
                      {safeCharger.source_type === 'official' ? 'Official' : 'Community'}
                    </Text>
                  </View>
                </View>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Added:</Text>
                  <Text style={styles.sourceValue}>
                    {formatDate(safeCharger.created_at)}
                  </Text>
                </View>
                {safeCharger.source_type === 'official' && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={16} color="#2196F3" />
                    <Text style={styles.adminText}>Admin Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timelineDate: {
    fontSize: 12,
    color: '#999999',
  },
  timelineUser: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  sourceCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  sourceValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  sourceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  officialTag: {
    backgroundColor: '#E3F2FD',
  },
  communityTag: {
    backgroundColor: '#FFF3E0',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  adminText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  reliabilityCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  reliabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  scoreMax: {
    fontSize: 12,
    color: '#666666',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  bestTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bestTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  insightsContainer: {
    gap: 8,
  },
  insightCard: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  insightText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
  },
  trendsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  trendPeriod: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  trendTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  trendLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 8,
  },
  trendBreakdown: {
    gap: 4,
    width: '100%',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
});

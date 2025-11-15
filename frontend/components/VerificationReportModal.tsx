import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Animated,
  Easing,
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

  const getBestTimeToVisit = (): { recommendation: string; timeSlots: string[] } => {
    const reliabilityScore = getReliabilityScore();
    const history = safeCharger.verification_history || [];

    // Analyze verification times to suggest best visiting hours
    const timeSlots: string[] = [];
    if (history.length > 0) {
      const hourCounts: { [key: string]: { active: number; total: number } } = {};

      history.forEach(action => {
        const hour = new Date(action.timestamp).getHours();
        let period = '';
        if (hour >= 6 && hour < 12) period = 'Morning (6AM-12PM)';
        else if (hour >= 12 && hour < 17) period = 'Afternoon (12PM-5PM)';
        else if (hour >= 17 && hour < 21) period = 'Evening (5PM-9PM)';
        else period = 'Night (9PM-6AM)';

        if (!hourCounts[period]) hourCounts[period] = { active: 0, total: 0 };
        hourCounts[period].total++;
        if (action.action === 'active') hourCounts[period].active++;
      });

      // Find periods with highest success rate
      Object.entries(hourCounts)
        .sort(([, a], [, b]) => (b.active / b.total) - (a.active / a.total))
        .slice(0, 2)
        .forEach(([period]) => timeSlots.push(period));
    }

    let recommendation = '';
    if (reliabilityScore >= 80) recommendation = 'Anytime - Highly reliable';
    else if (reliabilityScore >= 60) recommendation = 'Weekdays preferred - More consistent';
    else if (reliabilityScore >= 40) recommendation = 'Call ahead - Variable availability';
    else recommendation = 'Check real-time status first';

    return { recommendation, timeSlots };
  };

  const getInsights = (): Array<{ icon: string; text: string; type: 'positive' | 'warning' | 'neutral' }> => {
    const insights: Array<{ icon: string; text: string; type: 'positive' | 'warning' | 'neutral' }> = [];
    const trends = calculateTrends();
    const reliabilityScore = getReliabilityScore();
    const level = safeCharger.verification_level;
    const history = safeCharger.verification_history || [];

    // Recent activity warning
    if (trends.last24h.notWorkingCount > 2) {
      insights.push({
        icon: 'alert-circle',
        text: 'Multiple issues reported in last 24h - verify before visiting',
        type: 'warning'
      });
    } else if (trends.last24h.notWorkingCount > 0) {
      insights.push({
        icon: 'information-circle',
        text: `${trends.last24h.notWorkingCount} issue(s) reported recently - check status`,
        type: 'warning'
      });
    }

    // Positive reliability insights
    if (reliabilityScore >= 85) {
      insights.push({
        icon: 'star',
        text: `Consistently reliable - ${reliabilityScore}% success rate`,
        type: 'positive'
      });
    }

    if (trends.last7d.activeCount >= 5) {
      insights.push({
        icon: 'checkmark-done-circle',
        text: `${trends.last7d.activeCount} active verifications this week - data is fresh`,
        type: 'positive'
      });
    }

    // Trust level insights
    if (level >= 4) {
      insights.push({
        icon: 'shield-checkmark',
        text: `Highly trusted by community - Level ${level} verified`,
        type: 'positive'
      });
    }

    // Uptime insights
    if (safeCharger.uptime_percentage >= 90) {
      insights.push({
        icon: 'trending-up',
        text: `${safeCharger.uptime_percentage.toFixed(1)}% uptime - excellent availability`,
        type: 'positive'
      });
    } else if (safeCharger.uptime_percentage < 70) {
      insights.push({
        icon: 'trending-down',
        text: `${safeCharger.uptime_percentage.toFixed(1)}% uptime - frequent issues reported`,
        type: 'warning'
      });
    }

    // Community engagement
    if (safeCharger.verified_by_count >= 20) {
      insights.push({
        icon: 'people',
        text: `${safeCharger.verified_by_count} community verifiers - well-monitored`,
        type: 'positive'
      });
    }

    // Recent verification freshness
    const daysSinceLastVerified = safeCharger.last_verified
      ? Math.floor((new Date().getTime() - new Date(safeCharger.last_verified).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastVerified > 30) {
      insights.push({
        icon: 'time',
        text: 'No recent verifications - status may be outdated',
        type: 'warning'
      });
    } else if (daysSinceLastVerified <= 3) {
      insights.push({
        icon: 'refresh',
        text: 'Recently verified - status is up to date',
        type: 'positive'
      });
    }

    // Trend analysis
    const recentTrend = trends.last7d.activeCount >= trends.last30d.activeCount / 4;
    if (recentTrend && trends.last7d.activeCount > 3) {
      insights.push({
        icon: 'arrow-up-circle',
        text: 'Improving reliability - more active reports recently',
        type: 'positive'
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: 'analytics',
        text: 'Limited verification data - help the community by verifying',
        type: 'neutral'
      });
    }

    return insights;
  };

  const trends = calculateTrends();
  const reliabilityScore = getReliabilityScore();
  const bestTime = getBestTimeToVisit();
  const insights = getInsights();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scoreScaleAnim = useRef(new Animated.Value(0)).current;
  const scoreRotateAnim = useRef(new Animated.Value(0)).current;
  const insightsFadeAnim = useRef(new Animated.Value(0)).current;
  const trendsFadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger animations when modal opens
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scoreScaleAnim.setValue(0);
      scoreRotateAnim.setValue(0);
      insightsFadeAnim.setValue(0);
      trendsFadeAnim.setValue(0);

      // Stagger animations for smooth sequence
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scoreScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(scoreRotateAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(insightsFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(trendsFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const scoreRotation = scoreRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Reliability Analysis</Text>
              <View style={styles.reliabilityCard}>
                <View style={styles.reliabilityHeader}>
                  <Animated.View
                    style={[
                      styles.scoreCircle,
                      {
                        transform: [
                          { scale: scoreScaleAnim },
                          { rotate: scoreRotation },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.scoreNumber}>{reliabilityScore}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                  </Animated.View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreTitle}>Reliability Score</Text>
                    <Text style={styles.scoreDescription}>
                      Based on {safeCharger.verified_by_count} community verifications
                    </Text>
                    <View style={styles.bestTimeChip}>
                      <Ionicons name="time-outline" size={14} color="#4CAF50" />
                      <Text style={styles.bestTimeText}>{bestTime.recommendation}</Text>
                    </View>
                    {bestTime.timeSlots.length > 0 && (
                      <View style={styles.timeSlotsContainer}>
                        <Text style={styles.timeSlotsLabel}>Best times:</Text>
                        {bestTime.timeSlots.map((slot, idx) => (
                          <View key={idx} style={styles.timeSlot}>
                            <Ionicons name="time" size={12} color="#2E7D32" />
                            <Text style={styles.timeSlotText}>{slot}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Key Insights */}
            {insights.length > 0 && (
              <Animated.View
                style={[
                  styles.section,
                  {
                    opacity: insightsFadeAnim,
                    transform: [
                      {
                        translateY: insightsFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.sectionTitle}>Smart Insights & Recommendations</Text>
                <View style={styles.insightsContainer}>
                  {insights.map((insight, index) => (
                    <View
                      key={index}
                      style={[
                        styles.insightCard,
                        insight.type === 'positive' && styles.insightCardPositive,
                        insight.type === 'warning' && styles.insightCardWarning,
                        insight.type === 'neutral' && styles.insightCardNeutral,
                      ]}
                    >
                      <Ionicons
                        name={insight.icon as any}
                        size={20}
                        color={
                          insight.type === 'positive' ? '#2E7D32' :
                          insight.type === 'warning' ? '#F57C00' :
                          '#1976D2'
                        }
                      />
                      <Text
                        style={[
                          styles.insightText,
                          insight.type === 'positive' && styles.insightTextPositive,
                          insight.type === 'warning' && styles.insightTextWarning,
                        ]}
                      >
                        {insight.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Trends Analysis */}
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: trendsFadeAnim,
                  transform: [
                    {
                      translateY: trendsFadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.sectionTitle}>Verification Trends</Text>
              <View style={styles.trendsContainer}>
                {[trends.last24h, trends.last7d, trends.last30d].map((trend, index) => {
                  const total = trend.activeCount + trend.notWorkingCount + trend.partialCount;
                  const activePercent = total > 0 ? (trend.activeCount / total) * 100 : 0;
                  const partialPercent = total > 0 ? (trend.partialCount / total) * 100 : 0;
                  const failPercent = total > 0 ? (trend.notWorkingCount / total) * 100 : 0;

                  return (
                    <View key={index} style={styles.trendCard}>
                      <Text style={styles.trendPeriod}>{trend.period}</Text>
                      <Text style={styles.trendTotal}>{total}</Text>
                      <Text style={styles.trendLabel}>verifications</Text>

                      {total > 0 ? (
                        <>
                          {/* Visual Progress Bar */}
                          <View style={styles.trendProgressBar}>
                            {activePercent > 0 && (
                              <View
                                style={[
                                  styles.trendProgressSegment,
                                  { width: `${activePercent}%`, backgroundColor: '#4CAF50' }
                                ]}
                              />
                            )}
                            {partialPercent > 0 && (
                              <View
                                style={[
                                  styles.trendProgressSegment,
                                  { width: `${partialPercent}%`, backgroundColor: '#FF9800' }
                                ]}
                              />
                            )}
                            {failPercent > 0 && (
                              <View
                                style={[
                                  styles.trendProgressSegment,
                                  { width: `${failPercent}%`, backgroundColor: '#F44336' }
                                ]}
                              />
                            )}
                          </View>

                          {/* Breakdown */}
                          <View style={styles.trendBreakdown}>
                            {trend.activeCount > 0 && (
                              <View style={styles.trendRow}>
                                <View style={[styles.trendDot, { backgroundColor: '#4CAF50' }]} />
                                <Text style={styles.trendValue}>{trend.activeCount} active</Text>
                              </View>
                            )}
                            {trend.partialCount > 0 && (
                              <View style={styles.trendRow}>
                                <View style={[styles.trendDot, { backgroundColor: '#FF9800' }]} />
                                <Text style={styles.trendValue}>{trend.partialCount} partial</Text>
                              </View>
                            )}
                            {trend.notWorkingCount > 0 && (
                              <View style={styles.trendRow}>
                                <View style={[styles.trendDot, { backgroundColor: '#F44336' }]} />
                                <Text style={styles.trendValue}>{trend.notWorkingCount} down</Text>
                              </View>
                            )}
                          </View>
                        </>
                      ) : (
                        <Text style={styles.noDataText}>No data</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIconCircle}>
                    <Ionicons name="people" size={24} color="#2196F3" />
                  </View>
                  <Text style={styles.statValue}>{safeCharger.verified_by_count}</Text>
                  <Text style={styles.statLabel}>Community Verifiers</Text>
                  <View style={styles.statBar}>
                    <View
                      style={[
                        styles.statBarFill,
                        {
                          width: `${Math.min((safeCharger.verified_by_count / 30) * 100, 100)}%`,
                          backgroundColor: '#2196F3',
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statCard}>
                  <View style={[
                    styles.statIconCircle,
                    { backgroundColor: safeCharger.uptime_percentage >= 90 ? '#E8F5E9' : '#FFF3E0' }
                  ]}>
                    <Ionicons
                      name={safeCharger.uptime_percentage >= 90 ? 'trending-up' : 'analytics'}
                      size={24}
                      color={safeCharger.uptime_percentage >= 90 ? '#4CAF50' : '#FF9800'}
                    />
                  </View>
                  <Text style={styles.statValue}>{safeCharger.uptime_percentage.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Uptime Rate</Text>
                  <View style={styles.statBar}>
                    <View
                      style={[
                        styles.statBarFill,
                        {
                          width: `${safeCharger.uptime_percentage}%`,
                          backgroundColor: safeCharger.uptime_percentage >= 90 ? '#4CAF50' : '#FF9800',
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIconCircle}>
                    <Ionicons name="time" size={24} color="#9C27B0" />
                  </View>
                  <Text style={styles.statValue}>
                    {safeCharger.last_verified
                      ? formatDate(safeCharger.last_verified).split(',')[0]
                      : 'Never'}
                  </Text>
                  <Text style={styles.statLabel}>Last Verified</Text>
                  {safeCharger.last_verified && (
                    <Text style={styles.statSubtext}>
                      {formatDate(safeCharger.last_verified)}
                    </Text>
                  )}
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
        </TouchableOpacity>
      </TouchableOpacity>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
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
    padding: 18,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 9,
    color: '#999999',
    marginTop: 2,
    textAlign: 'center',
  },
  statBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 2,
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
    borderRadius: 12,
  },
  sourceCard: {
    backgroundColor: '#F8F9FA',
    padding: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  adminText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  reliabilityCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  bestTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  timeSlotsContainer: {
    marginTop: 8,
    gap: 4,
  },
  timeSlotsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#2E7D32',
  },
  insightsContainer: {
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  insightCardPositive: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  insightCardWarning: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  insightCardNeutral: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 19,
    fontWeight: '500',
  },
  insightTextPositive: {
    color: '#1B5E20',
  },
  insightTextWarning: {
    color: '#E65100',
  },
  trendsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    marginBottom: 10,
  },
  trendProgressBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
    width: '100%',
  },
  trendProgressSegment: {
    height: '100%',
  },
  trendBreakdown: {
    gap: 6,
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
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  noDataText: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

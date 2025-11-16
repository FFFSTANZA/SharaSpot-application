import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VerificationBadge } from '../components/VerificationBadge';
import { SessionManager } from '../utils/secureStorage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface VerificationAction {
  user_id: string;
  action: string;
  timestamp: string;
  notes?: string;
  wait_time?: number;
  port_type_used?: string;
  ports_available?: number;
  charging_success?: boolean;
  payment_method?: string;
  station_lighting?: string;
  cleanliness_rating?: number;
  charging_speed_rating?: number;
  amenities_rating?: number;
  would_recommend?: boolean;
  photo_url?: string;
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

  const historyCount = Math.min(level * 3 + Math.floor(Math.random() * 5), 20);
  const actionTypes = ['active', 'not_working', 'partial'];
  const weights = level >= 3 ? [0.7, 0.1, 0.2] : [0.5, 0.3, 0.2];

  for (let i = 0; i < historyCount; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

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

const LEVEL_DESCRIPTIONS = {
  1: 'Newly added, pending community verification',
  2: 'Verified by 2-3 community members',
  3: 'Consistently reliable with 5+ verifications',
  4: 'Highly trusted with 8+ active verifications',
  5: 'Officially certified by admin or partner',
};

export default function VerificationReport() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [charger, setCharger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scoreScaleAnim = useRef(new Animated.Value(0)).current;
  const scoreRotateAnim = useRef(new Animated.Value(0)).current;
  const insightsFadeAnim = useRef(new Animated.Value(0)).current;
  const trendsFadeAnim = useRef(new Animated.Value(0)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const riskBadgeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadChargerData();
  }, []);

  useEffect(() => {
    if (charger) {
      triggerAnimations();
    }
  }, [charger]);

  const loadChargerData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      if (params.charger) {
        const chargerData = JSON.parse(params.charger as string);
        setCharger(chargerData);
      } else if (params.chargerId) {
        const token = await SessionManager.getToken();
        const response = await axios.get(`${API_URL}/api/chargers/${params.chargerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCharger(response.data);
      }
    } catch (error) {
      console.error('Load charger error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadChargerData(true);
  };

  const triggerAnimations = () => {
    // Reset animations
    fadeAnim.setValue(0);
    scoreScaleAnim.setValue(0);
    scoreRotateAnim.setValue(0);
    insightsFadeAnim.setValue(0);
    trendsFadeAnim.setValue(0);
    headerFadeAnim.setValue(0);
    riskBadgeAnim.setValue(0);

    // Stagger animations for smooth sequence with improved timing
    Animated.sequence([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scoreScaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(scoreRotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(riskBadgeAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100, [
        Animated.timing(insightsFadeAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(trendsFadeAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous pulse animation for risk badge with improved easing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Ensure charger has default values to prevent crashes
  const mockHistory = (!charger?.verification_history || charger.verification_history.length === 0)
    ? generateMockVerificationHistory(charger)
    : [];

  const calculateUptime = (): number => {
    if (!charger) return 0;
    const history = charger?.verification_history || mockHistory;
    if (history.length === 0) return 0;

    const activeCount = history.filter((a: VerificationAction) => a.action === 'active').length;
    const partialCount = history.filter((a: VerificationAction) => a.action === 'partial').length;

    return ((activeCount + partialCount * 0.5) / history.length) * 100;
  };

  const safeCharger = charger ? {
    verification_level: charger?.verification_level || 1,
    verified_by_count: charger?.verified_by_count || mockHistory.length,
    uptime_percentage: charger?.uptime_percentage || calculateUptime(),
    last_verified: charger?.last_verified || mockHistory[0]?.timestamp || null,
    verification_history: charger?.verification_history || mockHistory,
    photos: charger?.photos || [],
    source_type: charger?.source_type || 'community',
    created_at: charger?.created_at || null,
    ...charger,
  } : null;

  // Calculate analytics from verification history
  const calculateTrends = (): { last24h: TrendData; last7d: TrendData; last30d: TrendData } => {
    if (!safeCharger) return {
      last24h: { period: '24h', activeCount: 0, notWorkingCount: 0, partialCount: 0 },
      last7d: { period: '7d', activeCount: 0, notWorkingCount: 0, partialCount: 0 },
      last30d: { period: '30d', activeCount: 0, notWorkingCount: 0, partialCount: 0 },
    };

    const now = new Date();
    const history = safeCharger.verification_history || [];

    const calculatePeriod = (hours: number): TrendData => {
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      const relevant = history.filter((a: VerificationAction) => new Date(a.timestamp) > cutoff);

      return {
        period: hours === 24 ? '24h' : hours === 168 ? '7d' : '30d',
        activeCount: relevant.filter((a: VerificationAction) => a.action === 'active').length,
        notWorkingCount: relevant.filter((a: VerificationAction) => a.action === 'not_working').length,
        partialCount: relevant.filter((a: VerificationAction) => a.action === 'partial').length,
      };
    };

    return {
      last24h: calculatePeriod(24),
      last7d: calculatePeriod(168),
      last30d: calculatePeriod(720),
    };
  };

  const getReliabilityScore = (): number => {
    if (!safeCharger) return 0;
    const history = safeCharger.verification_history || [];
    if (history.length === 0) return 0;

    const activeCount = history.filter((a: VerificationAction) => a.action === 'active').length;
    const partialCount = history.filter((a: VerificationAction) => a.action === 'partial').length;

    return Math.round(((activeCount + partialCount * 0.5) / history.length) * 100);
  };

  const getBestTimeToVisit = (): { recommendation: string; timeSlots: string[] } => {
    if (!safeCharger) return { recommendation: '', timeSlots: [] };

    const reliabilityScore = getReliabilityScore();
    const history = safeCharger.verification_history || [];

    const timeSlots: string[] = [];
    if (history.length > 0) {
      const hourCounts: { [key: string]: { active: number; total: number } } = {};

      history.forEach((action: VerificationAction) => {
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
    if (!safeCharger) return [];

    const insights: Array<{ icon: string; text: string; type: 'positive' | 'warning' | 'neutral' }> = [];
    const trends = calculateTrends();
    const reliabilityScore = getReliabilityScore();
    const level = safeCharger.verification_level;

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

    if (level >= 4) {
      insights.push({
        icon: 'shield-checkmark',
        text: `Highly trusted by community - Level ${level} verified`,
        type: 'positive'
      });
    }

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

    if (safeCharger.verified_by_count >= 20) {
      insights.push({
        icon: 'people',
        text: `${safeCharger.verified_by_count} community verifiers - well-monitored`,
        type: 'positive'
      });
    }

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

  const getRiskAssessment = (): {
    level: 'low' | 'medium' | 'high';
    score: number;
    label: string;
    color: string;
    backgroundColor: string;
    recommendation: string;
  } => {
    if (!safeCharger) return {
      level: 'medium',
      score: 50,
      label: 'Medium Risk',
      color: Colors.warningDark,
      backgroundColor: Colors.warningLight,
      recommendation: 'Loading data...'
    };

    const reliabilityScore = getReliabilityScore();
    const trends = calculateTrends();

    let riskScore = 100 - reliabilityScore;

    if (trends.last24h.notWorkingCount > 0) riskScore += 20;
    if (trends.last7d.notWorkingCount > 2) riskScore += 10;

    const daysSinceLastVerified = safeCharger.last_verified
      ? Math.floor((new Date().getTime() - new Date(safeCharger.last_verified).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if (daysSinceLastVerified > 30) riskScore += 15;

    if (safeCharger.verified_by_count >= 20) riskScore -= 10;
    if (safeCharger.verification_level >= 4) riskScore -= 15;

    riskScore = Math.max(0, Math.min(100, riskScore));

    if (riskScore < 25) {
      return {
        level: 'low',
        score: riskScore,
        label: 'Low Risk - Highly Reliable',
        color: Colors.successDark,
        backgroundColor: Colors.successLight,
        recommendation: 'Safe to visit anytime. This station is consistently reliable.'
      };
    } else if (riskScore < 60) {
      return {
        level: 'medium',
        score: riskScore,
        label: 'Medium Risk - Generally Reliable',
        color: Colors.warningDark,
        backgroundColor: Colors.warningLight,
        recommendation: 'Usually works well. Check recent status before visiting.'
      };
    } else {
      return {
        level: 'high',
        score: riskScore,
        label: 'High Risk - Verify First',
        color: Colors.error,
        backgroundColor: Colors.errorLight,
        recommendation: 'Exercise caution. Contact station or verify status before traveling.'
      };
    }
  };

  const getNetworkComparison = (): {
    betterThanAverage: boolean;
    percentile: number;
    message: string;
  } => {
    const reliabilityScore = getReliabilityScore();
    const networkAverage = 75;
    const percentile = Math.min(95, Math.round((reliabilityScore / 100) * 95));

    return {
      betterThanAverage: reliabilityScore > networkAverage,
      percentile,
      message: reliabilityScore > networkAverage
        ? `${percentile}th percentile - Better than ${percentile}% of stations`
        : `Below network average - Room for improvement`
    };
  };

  const getTopContributors = (): Array<{ userId: string; count: number }> => {
    if (!safeCharger) return [];
    const history = safeCharger.verification_history || [];
    const userCounts: { [key: string]: number } = {};

    history.forEach((action: VerificationAction) => {
      userCounts[action.user_id] = (userCounts[action.user_id] || 0) + 1;
    });

    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getExpectations = (): string[] => {
    if (!safeCharger) return [];
    const expectations: string[] = [];
    const reliabilityScore = getReliabilityScore();

    if (reliabilityScore >= 80) {
      expectations.push('✓ High chance all ports will be available');
      expectations.push('✓ Fast charging speeds confirmed by community');
    } else if (reliabilityScore >= 60) {
      expectations.push('~ Some ports may be in use or unavailable');
      expectations.push('~ Charging speeds may vary');
    } else {
      expectations.push('⚠ May experience issues or downtime');
      expectations.push('⚠ Consider having a backup station nearby');
    }

    if (safeCharger.amenities && safeCharger.amenities.length > 0) {
      expectations.push(`✓ Amenities: ${safeCharger.amenities.slice(0, 2).join(', ')}`);
    }

    return expectations;
  };

  const getPeakHoursAnalysis = (): {
    peakHours: string;
    quietHours: string;
    avgWaitTime: number;
    hourlyData: Array<{ hour: number; count: number; successRate: number }>;
  } => {
    if (!safeCharger) return {
      peakHours: 'N/A',
      quietHours: 'N/A',
      avgWaitTime: 0,
      hourlyData: []
    };

    const history = safeCharger.verification_history || [];
    const hourlyStats: { [key: number]: { total: number; active: number; waitTimes: number[] } } = {};

    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { total: 0, active: 0, waitTimes: [] };
    }

    history.forEach((action: VerificationAction) => {
      const hour = new Date(action.timestamp).getHours();
      hourlyStats[hour].total++;
      if (action.action === 'active') {
        hourlyStats[hour].active++;
        if (action.wait_time !== undefined && action.wait_time !== null) {
          hourlyStats[hour].waitTimes.push(action.wait_time);
        }
      }
    });

    const hoursWithData = Object.entries(hourlyStats)
      .filter(([_, stats]) => stats.total > 0)
      .sort((a, b) => b[1].total - a[1].total);

    const peakHour = hoursWithData[0] ? parseInt(hoursWithData[0][0]) : 12;
    const quietHour = hoursWithData[hoursWithData.length - 1]
      ? parseInt(hoursWithData[hoursWithData.length - 1][0])
      : 3;

    const allWaitTimes = Object.values(hourlyStats).flatMap(stats => stats.waitTimes);
    const avgWaitTime = allWaitTimes.length > 0
      ? Math.round(allWaitTimes.reduce((sum, time) => sum + time, 0) / allWaitTimes.length)
      : 0;

    const hourlyData = Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      count: stats.total,
      successRate: stats.total > 0 ? (stats.active / stats.total) * 100 : 0
    }));

    const formatHour = (h: number) => {
      if (h === 0) return '12 AM';
      if (h < 12) return `${h} AM`;
      if (h === 12) return '12 PM';
      return `${h - 12} PM`;
    };

    return {
      peakHours: formatHour(peakHour),
      quietHours: formatHour(quietHour),
      avgWaitTime,
      hourlyData
    };
  };

  const getCommunityRatings = (): {
    avgCleanliness: number;
    avgChargingSpeed: number;
    avgAmenities: number;
    recommendationRate: number;
    totalRatings: number;
  } => {
    if (!safeCharger) return {
      avgCleanliness: 0,
      avgChargingSpeed: 0,
      avgAmenities: 0,
      recommendationRate: 0,
      totalRatings: 0
    };

    const history = safeCharger.verification_history || [];
    const ratings = history.filter(
      (action: VerificationAction) => action.cleanliness_rating || action.charging_speed_rating || action.amenities_rating
    );

    if (ratings.length === 0) {
      return {
        avgCleanliness: 0,
        avgChargingSpeed: 0,
        avgAmenities: 0,
        recommendationRate: 0,
        totalRatings: 0
      };
    }

    const cleanlinessRatings = ratings.filter((r: VerificationAction) => r.cleanliness_rating).map((r: VerificationAction) => r.cleanliness_rating!);
    const speedRatings = ratings.filter((r: VerificationAction) => r.charging_speed_rating).map((r: VerificationAction) => r.charging_speed_rating!);
    const amenitiesRatings = ratings.filter((r: VerificationAction) => r.amenities_rating).map((r: VerificationAction) => r.amenities_rating!);
    const recommendations = history.filter((r: VerificationAction) => r.would_recommend !== undefined && r.would_recommend !== null);

    const avgCleanliness = cleanlinessRatings.length > 0
      ? cleanlinessRatings.reduce((sum, r) => sum + r, 0) / cleanlinessRatings.length
      : 0;

    const avgChargingSpeed = speedRatings.length > 0
      ? speedRatings.reduce((sum, r) => sum + r, 0) / speedRatings.length
      : 0;

    const avgAmenities = amenitiesRatings.length > 0
      ? amenitiesRatings.reduce((sum, r) => sum + r, 0) / amenitiesRatings.length
      : 0;

    const recommendationRate = recommendations.length > 0
      ? (recommendations.filter((r: VerificationAction) => r.would_recommend).length / recommendations.length) * 100
      : 0;

    return {
      avgCleanliness: Math.round(avgCleanliness * 10) / 10,
      avgChargingSpeed: Math.round(avgChargingSpeed * 10) / 10,
      avgAmenities: Math.round(avgAmenities * 10) / 10,
      recommendationRate: Math.round(recommendationRate),
      totalRatings: ratings.length
    };
  };

  const getAvailabilityPrediction = (): {
    currentProbability: number;
    status: 'high' | 'medium' | 'low';
    message: string;
    color: string;
  } => {
    const currentHour = new Date().getHours();
    const peakHours = [8, 9, 17, 18, 19];
    const reliabilityScore = getReliabilityScore();

    let probability = reliabilityScore;

    if (peakHours.includes(currentHour)) {
      probability = Math.max(0, probability - 15);
    }

    if (currentHour >= 0 && currentHour < 6) {
      probability = Math.min(100, probability + 10);
    }

    if (probability >= 75) {
      return {
        currentProbability: probability,
        status: 'high',
        message: 'Very likely available now',
        color: Colors.primary
      };
    } else if (probability >= 50) {
      return {
        currentProbability: probability,
        status: 'medium',
        message: 'Might have some wait time',
        color: Colors.warning
      };
    } else {
      return {
        currentProbability: probability,
        status: 'low',
        message: 'Call ahead recommended',
        color: Colors.error
      };
    }
  };

  const trends = calculateTrends();
  const reliabilityScore = getReliabilityScore();
  const bestTime = getBestTimeToVisit();
  const insights = getInsights();
  const riskAssessment = getRiskAssessment();
  const networkComparison = getNetworkComparison();
  const topContributors = getTopContributors();
  const expectations = getExpectations();
  const peakAnalysis = getPeakHoursAnalysis();
  const availabilityPrediction = getAvailabilityPrediction();
  const communityRatings = getCommunityRatings();

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
        return Colors.primary;
      case 'not_working':
        return Colors.error;
      case 'partial':
        return Colors.warning;
      default:
        return Colors.textTertiary;
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading verification data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!charger || !safeCharger) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Verification Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>No charger data available</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Header animation based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -5],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          }
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Verification Report</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Quick Decision Helper */}
        <Animated.View
          style={[
            styles.section,
            styles.decisionSection,
            { opacity: headerFadeAnim }
          ]}
        >
          <View style={styles.decisionHeader}>
            <Ionicons name="flash" size={24} color={Colors.accentGold} />
            <Text style={styles.decisionTitle}>Quick Decision</Text>
          </View>
          <Animated.View
            style={[
              styles.riskBadge,
              { backgroundColor: riskAssessment.backgroundColor },
              {
                transform: [
                  { scale: riskBadgeAnim },
                  { scale: riskAssessment.level === 'high' ? pulseAnim : 1 }
                ]
              }
            ]}
          >
            <View style={styles.riskBadgeContent}>
              <Ionicons
                name={
                  riskAssessment.level === 'low' ? 'shield-checkmark' :
                  riskAssessment.level === 'medium' ? 'warning' :
                  'alert-circle'
                }
                size={32}
                color={riskAssessment.color}
              />
              <View style={styles.riskBadgeText}>
                <Text style={[styles.riskLabel, { color: riskAssessment.color }]}>
                  {riskAssessment.label}
                </Text>
                <Text style={styles.riskRecommendation}>
                  {riskAssessment.recommendation}
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* What to Expect */}
        <Animated.View
          style={[
            styles.section,
            { opacity: headerFadeAnim }
          ]}
        >
          <Text style={styles.sectionTitle}>What to Expect</Text>
          <View style={styles.expectationsContainer}>
            {expectations.map((expectation, index) => (
              <View key={index} style={styles.expectationItem}>
                <Text style={styles.expectationText}>{expectation}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Real-Time Availability Prediction */}
        <Animated.View
          style={[
            styles.section,
            styles.availabilitySection,
            { opacity: headerFadeAnim }
          ]}
        >
          <View style={styles.availabilityHeader}>
            <Ionicons name="pulse" size={22} color={Colors.info} />
            <Text style={styles.sectionTitle}>Availability Right Now</Text>
          </View>
          <View style={styles.availabilityCard}>
            <View style={styles.probabilityCircle}>
              <Text style={[styles.probabilityNumber, { color: availabilityPrediction.color }]}>
                {availabilityPrediction.currentProbability}%
              </Text>
              <Text style={styles.probabilityLabel}>Likely Available</Text>
            </View>
            <View style={styles.availabilityInfo}>
              <Ionicons
                name={
                  availabilityPrediction.status === 'high' ? 'checkmark-circle' :
                  availabilityPrediction.status === 'medium' ? 'time' :
                  'warning'
                }
                size={24}
                color={availabilityPrediction.color}
              />
              <Text style={[styles.availabilityMessage, { color: availabilityPrediction.color }]}>
                {availabilityPrediction.message}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Community Ratings */}
        {communityRatings.totalRatings > 0 && (
          <Animated.View
            style={[
              styles.section,
              styles.ratingsSection,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.ratingsSectionHeader}>
              <Ionicons name="star" size={22} color={Colors.accentGold} />
              <Text style={styles.sectionTitle}>Community Ratings</Text>
              <View style={styles.ratingsCount}>
                <Text style={styles.ratingsCountText}>{communityRatings.totalRatings} ratings</Text>
              </View>
            </View>

            <View style={styles.ratingsGrid}>
              {communityRatings.avgCleanliness > 0 && (
                <View style={styles.ratingCard}>
                  <Ionicons name="sparkles" size={32} color={Colors.accentPurple} />
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(communityRatings.avgCleanliness) ? 'star' : 'star-outline'}
                        size={16}
                        color={Colors.accentGold}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>{communityRatings.avgCleanliness.toFixed(1)}</Text>
                  <Text style={styles.ratingLabel}>Cleanliness</Text>
                </View>
              )}

              {communityRatings.avgChargingSpeed > 0 && (
                <View style={styles.ratingCard}>
                  <Ionicons name="flash" size={32} color={Colors.primary} />
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(communityRatings.avgChargingSpeed) ? 'star' : 'star-outline'}
                        size={16}
                        color={Colors.accentGold}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>{communityRatings.avgChargingSpeed.toFixed(1)}</Text>
                  <Text style={styles.ratingLabel}>Charging Speed</Text>
                </View>
              )}

              {communityRatings.avgAmenities > 0 && (
                <View style={styles.ratingCard}>
                  <Ionicons name="restaurant" size={32} color={Colors.warning} />
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(communityRatings.avgAmenities) ? 'star' : 'star-outline'}
                        size={16}
                        color={Colors.accentGold}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>{communityRatings.avgAmenities.toFixed(1)}</Text>
                  <Text style={styles.ratingLabel}>Amenities</Text>
                </View>
              )}
            </View>

            {communityRatings.recommendationRate > 0 && (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationIcon}>
                  <Ionicons name="thumbs-up" size={28} color={Colors.primary} />
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationValue}>{communityRatings.recommendationRate}%</Text>
                  <Text style={styles.recommendationLabel}>Would Recommend</Text>
                </View>
                <View style={styles.recommendationBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Usage Patterns & Wait Times */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.sectionTitle}>Usage Patterns</Text>
          {peakAnalysis.avgWaitTime > 0 && (
            <View style={styles.waitTimeCard}>
              <Ionicons name="time-outline" size={32} color={Colors.accentPurple} />
              <View style={styles.waitTimeInfo}>
                <Text style={styles.waitTimeValue}>{peakAnalysis.avgWaitTime} min</Text>
                <Text style={styles.waitTimeLabel}>Average Wait Time</Text>
              </View>
            </View>
          )}
          <View style={styles.peakTimesContainer}>
            <View style={styles.peakTimeRow}>
              <Ionicons name="arrow-up-circle" size={20} color={Colors.error} />
              <View style={styles.peakTimeInfo}>
                <Text style={styles.peakTimeLabel}>Busiest Time</Text>
                <Text style={styles.peakTimeValue}>{peakAnalysis.peakHours}</Text>
              </View>
            </View>
            <View style={styles.peakTimeRow}>
              <Ionicons name="arrow-down-circle" size={20} color={Colors.primary} />
              <View style={styles.peakTimeInfo}>
                <Text style={styles.peakTimeLabel}>Quietest Time</Text>
                <Text style={styles.peakTimeValue}>{peakAnalysis.quietHours}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Current Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.levelCard}>
            <VerificationBadge level={safeCharger.verification_level} size="large" />
            <View style={styles.levelInfo}>
              <Text style={styles.levelDescription}>
                {LEVEL_DESCRIPTIONS[safeCharger.verification_level as keyof typeof LEVEL_DESCRIPTIONS]}
              </Text>
              {/* Network Comparison */}
              <View style={styles.comparisonBadge}>
                <Ionicons
                  name={networkComparison.betterThanAverage ? 'trending-up' : 'analytics'}
                  size={14}
                  color={networkComparison.betterThanAverage ? Colors.primary : Colors.warning}
                />
                <Text style={[
                  styles.comparisonText,
                  { color: networkComparison.betterThanAverage ? Colors.successDark : Colors.warningDark }
                ]}>
                  {networkComparison.message}
                </Text>
              </View>
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
                  <Ionicons name="time-outline" size={14} color={Colors.primary} />
                  <Text style={styles.bestTimeText}>{bestTime.recommendation}</Text>
                </View>
                {bestTime.timeSlots.length > 0 && (
                  <View style={styles.timeSlotsContainer}>
                    <Text style={styles.timeSlotsLabel}>Best times:</Text>
                    {bestTime.timeSlots.map((slot, idx) => (
                      <View key={idx} style={styles.timeSlot}>
                        <Ionicons name="time" size={12} color={Colors.successDark} />
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
                      insight.type === 'positive' ? Colors.successDark :
                      insight.type === 'warning' ? Colors.warningDark :
                      Colors.infoDark
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
                      <View style={styles.trendProgressBar}>
                        {activePercent > 0 && (
                          <View
                            style={[
                              styles.trendProgressSegment,
                              { width: `${activePercent}%`, backgroundColor: Colors.primary }
                            ]}
                          />
                        )}
                        {partialPercent > 0 && (
                          <View
                            style={[
                              styles.trendProgressSegment,
                              { width: `${partialPercent}%`, backgroundColor: Colors.warning }
                            ]}
                          />
                        )}
                        {failPercent > 0 && (
                          <View
                            style={[
                              styles.trendProgressSegment,
                              { width: `${failPercent}%`, backgroundColor: Colors.error }
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.trendBreakdown}>
                        {trend.activeCount > 0 && (
                          <View style={styles.trendRow}>
                            <View style={[styles.trendDot, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.trendValue}>{trend.activeCount} active</Text>
                          </View>
                        )}
                        {trend.partialCount > 0 && (
                          <View style={styles.trendRow}>
                            <View style={[styles.trendDot, { backgroundColor: Colors.warning }]} />
                            <Text style={styles.trendValue}>{trend.partialCount} partial</Text>
                          </View>
                        )}
                        {trend.notWorkingCount > 0 && (
                          <View style={styles.trendRow}>
                            <View style={[styles.trendDot, { backgroundColor: Colors.error }]} />
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
                <Ionicons name="people" size={24} color={Colors.info} />
              </View>
              <Text style={styles.statValue}>{safeCharger.verified_by_count}</Text>
              <Text style={styles.statLabel}>Community Verifiers</Text>
              <View style={styles.statBar}>
                <View
                  style={[
                    styles.statBarFill,
                    {
                      width: `${Math.min((safeCharger.verified_by_count / 30) * 100, 100)}%`,
                      backgroundColor: Colors.info,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[
                styles.statIconCircle,
                { backgroundColor: safeCharger.uptime_percentage >= 90 ? Colors.successLight : Colors.warningLight }
              ]}>
                <Ionicons
                  name={safeCharger.uptime_percentage >= 90 ? 'trending-up' : 'analytics'}
                  size={24}
                  color={safeCharger.uptime_percentage >= 90 ? Colors.primary : Colors.warning}
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
                      backgroundColor: safeCharger.uptime_percentage >= 90 ? Colors.primary : Colors.warning,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <Ionicons name="time" size={24} color={Colors.accentPurple} />
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

        {/* Top Contributors */}
        {topContributors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Community Contributors</Text>
            <View style={styles.contributorsContainer}>
              {topContributors.map((contributor, index) => (
                <View key={index} style={styles.contributorCard}>
                  <View style={styles.contributorRank}>
                    <Ionicons
                      name={index === 0 ? 'trophy' : index === 1 ? 'medal' : 'ribbon'}
                      size={20}
                      color={index === 0 ? Colors.accentGold : index === 1 ? Colors.borderStrong : Colors.accentCopper}
                    />
                  </View>
                  <View style={styles.contributorInfo}>
                    <Text style={styles.contributorName}>
                      {anonymizeUserId(contributor.userId)}
                    </Text>
                    <Text style={styles.contributorCount}>
                      {contributor.count} verification{contributor.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Verification History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Verification History</Text>
          {safeCharger.verification_history && safeCharger.verification_history.length > 0 ? (
            <View style={styles.timeline}>
              {safeCharger.verification_history.slice(0, 8).map((action: VerificationAction, index: number) => (
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
                      color={Colors.textInverse}
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
              <Ionicons name="document-text-outline" size={48} color={Colors.textDisabled} />
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
                <Ionicons name="shield-checkmark" size={16} color={Colors.info} />
                <Text style={styles.adminText}>Admin Verified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
  loadingText: {
    ...Typography.bodyMedium,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing['2'],
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  title: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    marginBottom: Spacing['3'],
    ...Shadows.xs,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  levelInfo: {
    flex: 1,
  },
  levelDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  statBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
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
    borderBottomColor: Colors.borderLight,
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
    color: Colors.textPrimary,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  timelineUser: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  retryButtonText: {
    ...Typography.labelLarge,
    color: Colors.textInverse,
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
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.textSecondary,
  },
  sourceValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sourceTag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  officialTag: {
    backgroundColor: Colors.infoLight,
  },
  communityTag: {
    backgroundColor: Colors.warningLight,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  adminText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.info,
  },
  reliabilityCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
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
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  scoreMax: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bestTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  bestTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.successDark,
  },
  timeSlotsContainer: {
    marginTop: 8,
    gap: 4,
  },
  timeSlotsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.successDark,
  },
  insightsContainer: {
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightCardPositive: {
    backgroundColor: Colors.successLight,
    borderLeftColor: Colors.primary,
  },
  insightCardWarning: {
    backgroundColor: Colors.warningLight,
    borderLeftColor: Colors.warning,
  },
  insightCardNeutral: {
    backgroundColor: Colors.infoLight,
    borderLeftColor: Colors.info,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    fontWeight: '500',
  },
  insightTextPositive: {
    color: Colors.successDark,
  },
  insightTextWarning: {
    color: Colors.warningDark,
  },
  trendsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trendCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  trendPeriod: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  trendTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  trendLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 10,
  },
  trendProgressBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: Colors.backgroundTertiary,
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
    color: Colors.textSecondary,
  },
  noDataText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  decisionSection: {
    backgroundColor: Colors.surface,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 12,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  decisionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  riskBadge: {
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  riskBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  riskBadgeText: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  riskRecommendation: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    fontWeight: '500',
  },
  expectationsContainer: {
    gap: 10,
  },
  expectationItem: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  expectationText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    fontWeight: '500',
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  comparisonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contributorsContainer: {
    gap: 12,
  },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contributorRank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contributorCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  availabilitySection: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Colors.surface,
    padding: 22,
    borderRadius: 16,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  probabilityCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.border,
  },
  probabilityNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  probabilityLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  availabilityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityMessage: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  peakTimesContainer: {
    gap: 12,
  },
  peakTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  peakTimeInfo: {
    flex: 1,
  },
  peakTimeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  peakTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ratingsSection: {
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1,
    borderColor: Colors.accentGold,
  },
  ratingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingsCount: {
    marginLeft: 'auto',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingsCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warningDark,
  },
  ratingsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ratingCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.accentGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 8,
    marginBottom: 6,
  },
  ratingValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  ratingLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: 18,
    borderRadius: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  recommendationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.successDark,
    marginBottom: 2,
  },
  recommendationLabel: {
    fontSize: 13,
    color: Colors.successDark,
    fontWeight: '600',
  },
  recommendationBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    padding: 18,
    borderRadius: 14,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  waitTimeInfo: {
    flex: 1,
  },
  waitTimeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  waitTimeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 60,
  },
});

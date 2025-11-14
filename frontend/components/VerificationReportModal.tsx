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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationBadge } from './VerificationBadge';

interface VerificationAction {
  user_id: string;
  action: string;
  timestamp: string;
  notes?: string;
}

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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Calculate responsive sizes
  const isSmallScreen = windowWidth < 380;
  const photoSize = isSmallScreen ? windowWidth * 0.28 : 100; // 28% of screen width on small screens
  const maxModalHeight = windowHeight * 0.9; // 90% of screen height

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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, { maxHeight: maxModalHeight }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Verification Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            {/* Current Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Verification Level</Text>
              <View style={styles.levelCard}>
                <VerificationBadge level={charger.verification_level} size="large" />
                <View style={styles.levelInfo}>
                  <Text style={styles.levelDescription}>
                    {LEVEL_DESCRIPTIONS[charger.verification_level as keyof typeof LEVEL_DESCRIPTIONS]}
                  </Text>
                </View>
              </View>
            </View>

            {/* Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              <View style={[styles.statsGrid, isSmallScreen && styles.statsGridSmall]}>
                <View style={[styles.statCard, isSmallScreen && styles.statCardSmall]}>
                  <Ionicons name="people" size={24} color="#2196F3" />
                  <Text style={styles.statValue}>{charger.verified_by_count}</Text>
                  <Text style={styles.statLabel}>Verifiers</Text>
                </View>
                <View style={[styles.statCard, isSmallScreen && styles.statCardSmall]}>
                  <Ionicons name="trending-up" size={24} color="#4CAF50" />
                  <Text style={styles.statValue}>{charger.uptime_percentage.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Uptime</Text>
                </View>
                <View style={[styles.statCard, isSmallScreen && styles.statCardSmall]}>
                  <Ionicons name="time" size={24} color="#FF9800" />
                  <Text style={styles.statValue}>
                    {charger.last_verified
                      ? formatDate(charger.last_verified).split(',')[0]
                      : 'N/A'}
                  </Text>
                  <Text style={styles.statLabel}>Last Check</Text>
                </View>
              </View>
            </View>

            {/* Verification History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification History</Text>
              {charger.verification_history && charger.verification_history.length > 0 ? (
                <View style={styles.timeline}>
                  {charger.verification_history.slice(-10).reverse().map((action: VerificationAction, index: number) => (
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
            {charger.photos && charger.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Community Photos</Text>
                <View style={styles.photosGrid}>
                  {charger.photos.map((photo: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      style={[styles.photo, { width: photoSize, height: photoSize }]}
                    />
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
                      charger.source_type === 'official'
                        ? styles.officialTag
                        : styles.communityTag,
                    ]}
                  >
                    <Text style={styles.sourceText}>
                      {charger.source_type === 'official' ? 'Official' : 'Community'}
                    </Text>
                  </View>
                </View>
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Added:</Text>
                  <Text style={styles.sourceValue}>
                    {charger.created_at ? formatDate(charger.created_at) : 'N/A'}
                  </Text>
                </View>
                {charger.source_type === 'official' && (
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
    // maxHeight is now dynamic and set inline
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
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridSmall: {
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardSmall: {
    flex: 0,
    flexBasis: '30%',
    minWidth: 90,
    padding: 12,
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
    // width and height are now dynamic and set inline
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
});

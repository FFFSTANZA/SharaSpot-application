import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnhancedVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: VerificationData) => void;
  chargerName: string;
}

export interface VerificationData {
  action: 'active' | 'not_working' | 'partial';
  notes?: string;
  wait_time?: number;
  cleanliness_rating?: number;
  charging_speed_rating?: number;
  amenities_rating?: number;
  would_recommend?: boolean;
}

export function EnhancedVerificationModal({
  visible,
  onClose,
  onSubmit,
  chargerName,
}: EnhancedVerificationModalProps) {
  const [step, setStep] = useState<'action' | 'details'>('action');
  const [action, setAction] = useState<'active' | 'not_working' | 'partial' | null>(null);
  const [notes, setNotes] = useState('');
  const [waitTime, setWaitTime] = useState<number | undefined>();
  const [cleanlinessRating, setCleanlinessRating] = useState<number | undefined>();
  const [chargingSpeedRating, setChargingSpeedRating] = useState<number | undefined>();
  const [amenitiesRating, setAmenitiesRating] = useState<number | undefined>();
  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>();

  const resetForm = () => {
    setStep('action');
    setAction(null);
    setNotes('');
    setWaitTime(undefined);
    setCleanlinessRating(undefined);
    setChargingSpeedRating(undefined);
    setAmenitiesRating(undefined);
    setWouldRecommend(undefined);
  };

  const handleActionSelect = (selectedAction: 'active' | 'not_working' | 'partial') => {
    setAction(selectedAction);
    setStep('details');
  };

  const handleSubmit = () => {
    if (!action) return;

    const data: VerificationData = {
      action,
      notes: notes.trim() || undefined,
      wait_time: waitTime,
      cleanliness_rating: cleanlinessRating,
      charging_speed_rating: chargingSpeedRating,
      amenities_rating: amenitiesRating,
      would_recommend: wouldRecommend,
    };

    onSubmit(data);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSkipDetails = () => {
    handleSubmit();
  };

  const getBonusCoins = (): number => {
    let bonus = 0;
    const detailedFields = [cleanlinessRating, chargingSpeedRating, amenitiesRating, wouldRecommend];
    const detailedCount = detailedFields.filter(f => f !== undefined).length;

    if (detailedCount >= 3) bonus = 3;
    else if (detailedCount >= 2) bonus = 2;
    else if (detailedCount >= 1) bonus = 1;

    if (waitTime !== undefined) bonus += 1;

    return bonus;
  };

  const renderStarRating = (
    value: number | undefined,
    onChange: (rating: number) => void,
    label: string,
    icon: string
  ) => (
    <View style={styles.ratingContainer}>
      <View style={styles.ratingHeader}>
        <Ionicons name={icon as any} size={24} color="#4CAF50" />
        <Text style={styles.ratingLabel}>{label}</Text>
      </View>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={value && star <= value ? 'star' : 'star-outline'}
              size={36}
              color={value && star <= value ? '#FFB300' : '#CCCCCC'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 'action' ? 'Verify Station' : 'Share More Details'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.chargerName}>{chargerName}</Text>

            {step === 'action' ? (
              /* Step 1: Action Selection */
              <View>
                <Text style={styles.instructionText}>
                  What's the current status of this charging station?
                </Text>

                <TouchableOpacity
                  style={[styles.actionCard, styles.activeCard]}
                  onPress={() => handleActionSelect('active')}
                >
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Active & Working</Text>
                    <Text style={styles.actionDescription}>
                      All chargers are functional and available
                    </Text>
                    <Text style={styles.actionReward}>Earn 2-6 🪙</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, styles.notWorkingCard]}
                  onPress={() => handleActionSelect('not_working')}
                >
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="close-circle" size={40} color="#F44336" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Not Working</Text>
                    <Text style={styles.actionDescription}>
                      Station is down or not operational
                    </Text>
                    <Text style={styles.actionReward}>Earn 2 🪙</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, styles.partialCard]}
                  onPress={() => handleActionSelect('partial')}
                >
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="battery-half" size={40} color="#FF9800" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Partially Working</Text>
                    <Text style={styles.actionDescription}>
                      Some chargers working, others not available
                    </Text>
                    <Text style={styles.actionReward}>Earn 2 🪙</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
            ) : (
              /* Step 2: Detailed Feedback */
              <View>
                <View style={styles.bonusBanner}>
                  <Ionicons name="gift" size={24} color="#4CAF50" />
                  <View style={styles.bonusContent}>
                    <Text style={styles.bonusTitle}>Earn Bonus Coins!</Text>
                    <Text style={styles.bonusDescription}>
                      Provide detailed feedback to earn up to +4 extra coins
                    </Text>
                  </View>
                </View>

                {/* Wait Time */}
                <View style={styles.questionSection}>
                  <Text style={styles.questionTitle}>How long did you wait?</Text>
                  <View style={styles.waitTimeButtons}>
                    {[0, 5, 10, 15, 20, 30].map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.waitTimeButton,
                          waitTime === time && styles.waitTimeButtonSelected,
                        ]}
                        onPress={() => setWaitTime(time)}
                      >
                        <Text
                          style={[
                            styles.waitTimeButtonText,
                            waitTime === time && styles.waitTimeButtonTextSelected,
                          ]}
                        >
                          {time === 0 ? 'No wait' : `${time} min`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {waitTime !== undefined && (
                    <Text style={styles.bonusIndicator}>+1 🪙 bonus</Text>
                  )}
                </View>

                {/* Ratings */}
                <View style={styles.ratingsSection}>
                  <Text style={styles.sectionTitle}>Rate Your Experience (Optional)</Text>

                  {renderStarRating(
                    cleanlinessRating,
                    setCleanlinessRating,
                    'Cleanliness',
                    'sparkles'
                  )}

                  {renderStarRating(
                    chargingSpeedRating,
                    setChargingSpeedRating,
                    'Charging Speed',
                    'flash'
                  )}

                  {renderStarRating(
                    amenitiesRating,
                    setAmenitiesRating,
                    'Amenities',
                    'restaurant'
                  )}
                </View>

                {/* Recommendation */}
                <View style={styles.recommendSection}>
                  <Text style={styles.questionTitle}>Would you recommend this station?</Text>
                  <View style={styles.recommendButtons}>
                    <TouchableOpacity
                      style={[
                        styles.recommendButton,
                        wouldRecommend === true && styles.recommendButtonYes,
                      ]}
                      onPress={() => setWouldRecommend(true)}
                    >
                      <Ionicons
                        name="thumbs-up"
                        size={28}
                        color={wouldRecommend === true ? '#FFFFFF' : '#4CAF50'}
                      />
                      <Text
                        style={[
                          styles.recommendButtonText,
                          wouldRecommend === true && styles.recommendButtonTextSelected,
                        ]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.recommendButton,
                        wouldRecommend === false && styles.recommendButtonNo,
                      ]}
                      onPress={() => setWouldRecommend(false)}
                    >
                      <Ionicons
                        name="thumbs-down"
                        size={28}
                        color={wouldRecommend === false ? '#FFFFFF' : '#F44336'}
                      />
                      <Text
                        style={[
                          styles.recommendButtonText,
                          wouldRecommend === false && styles.recommendButtonTextSelected,
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.notesSection}>
                  <Text style={styles.questionTitle}>Additional Notes (Optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Share any additional details about your experience..."
                    placeholderTextColor="#999999"
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                    textAlignVertical="top"
                  />
                </View>

                {/* Current Bonus Display */}
                {getBonusCoins() > 0 && (
                  <View style={styles.currentBonusCard}>
                    <Ionicons name="trophy" size={24} color="#FFB300" />
                    <Text style={styles.currentBonusText}>
                      Current bonus: +{getBonusCoins()} 🪙
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipDetails}
                  >
                    <Text style={styles.skipButtonText}>Skip & Submit (2 🪙)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>
                      Submit ({2 + getBonusCoins()} 🪙)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  chargerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  notWorkingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  partialCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  actionIconCircle: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
    lineHeight: 18,
  },
  actionReward: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    gap: 12,
  },
  bonusContent: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  bonusDescription: {
    fontSize: 13,
    color: '#1B5E20',
    lineHeight: 18,
  },
  questionSection: {
    marginBottom: 28,
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  waitTimeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  waitTimeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  waitTimeButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  waitTimeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  waitTimeButtonTextSelected: {
    color: '#FFFFFF',
  },
  bonusIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 8,
  },
  ratingsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  recommendSection: {
    marginBottom: 28,
  },
  recommendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  recommendButtonYes: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  recommendButtonNo: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  recommendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  recommendButtonTextSelected: {
    color: '#FFFFFF',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currentBonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 24,
  },
  currentBonusText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F57C00',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

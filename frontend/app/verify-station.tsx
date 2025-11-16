import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionManager } from '../utils/secureStorage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

export interface VerificationData {
  action: 'active' | 'not_working' | 'partial';
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

type Step = 'action' | 'wait_time' | 'port_context' | 'operational' | 'quality' | 'photo';

export default function VerifyStation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chargerId = params.chargerId as string;
  const chargerName = params.chargerName as string;

  const [step, setStep] = useState<Step>('action');
  const [action, setAction] = useState<'active' | 'not_working' | 'partial' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Wait time and port context
  const [waitTime, setWaitTime] = useState<number | undefined>();
  const [portTypeUsed, setPortTypeUsed] = useState<string | undefined>();
  const [portsAvailable, setPortsAvailable] = useState<number | undefined>();
  const [chargingSuccess, setChargingSuccess] = useState<boolean | undefined>();

  // Operational details
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [stationLighting, setStationLighting] = useState<string | undefined>();

  // Quality ratings
  const [cleanlinessRating, setCleanlinessRating] = useState<number | undefined>();
  const [chargingSpeedRating, setChargingSpeedRating] = useState<number | undefined>();
  const [amenitiesRating, setAmenitiesRating] = useState<number | undefined>();
  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>();

  // Photo evidence
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coinPulse = useRef(new Animated.Value(1)).current;
  const coinShimmer = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and animate content on step change
    slideAnim.setValue(300);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  useEffect(() => {
    // Animate progress bar
    const { current, total } = getStepNumber();
    Animated.spring(progressAnim, {
      toValue: current / total,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [step, action]);

  useEffect(() => {
    // Continuous shimmer effect for coin badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinShimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(coinShimmer, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Pulse coin counter when bonus changes
    Animated.sequence([
      Animated.timing(coinPulse, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(coinPulse, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [portTypeUsed, portsAvailable, chargingSuccess, paymentMethod, stationLighting, cleanlinessRating, chargingSpeedRating, amenitiesRating, wouldRecommend, waitTime, photoUrl, action]);

  const handleActionSelect = (selectedAction: 'active' | 'not_working' | 'partial') => {
    setAction(selectedAction);
    setStep('wait_time');
  };

  const getNextStep = (currentStep: Step): Step | null => {
    if (currentStep === 'action') return 'wait_time';
    if (currentStep === 'wait_time') return 'port_context';
    if (currentStep === 'port_context') return 'operational';
    if (currentStep === 'operational') return 'quality';
    if (currentStep === 'quality') {
      if (action === 'not_working') return 'photo';
      return null;
    }
    if (currentStep === 'photo') return null;
    return null;
  };

  const handleNext = () => {
    const next = getNextStep(step);
    if (next) {
      setStep(next);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'wait_time') setStep('action');
    else if (step === 'port_context') setStep('wait_time');
    else if (step === 'operational') setStep('port_context');
    else if (step === 'quality') setStep('operational');
    else if (step === 'photo') setStep('quality');
    else router.back();
  };

  const handleSubmit = async () => {
    if (!action) return;

    setSubmitting(true);

    const data: VerificationData = {
      action,
      notes: notes.trim() || undefined,
      wait_time: waitTime,
      port_type_used: portTypeUsed,
      ports_available: portsAvailable,
      charging_success: chargingSuccess,
      payment_method: paymentMethod,
      station_lighting: stationLighting,
      cleanliness_rating: cleanlinessRating,
      charging_speed_rating: chargingSpeedRating,
      amenities_rating: amenitiesRating,
      would_recommend: wouldRecommend,
      photo_url: photoUrl,
    };

    try {
      const token = await SessionManager.getToken();
      const response = await axios.post(
        `${API_URL}/api/chargers/${chargerId}/verify`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const totalCoins = response.data.coins_earned;
      const bonusCoins = response.data.bonus_coins;
      const bonusReasons = response.data.bonus_reasons || [];
      const newLevel = response.data.new_level;

      // Celebratory message based on coins earned
      let title = 'Verified! 🎉';
      if (totalCoins >= 9) title = 'Perfect Verification! 🏆';
      else if (totalCoins >= 7) title = 'Excellent Work! ✨';
      else if (totalCoins >= 5) title = 'Great Job! 🌟';

      let message = `🪙 +${totalCoins} SharaCoins earned!`;
      if (bonusCoins > 0) {
        message += `\n\n✨ Bonus: +${bonusCoins} (${bonusReasons.join(', ')})`;
      }
      if (totalCoins >= 9) {
        message += `\n\n🏆 Maximum rewards unlocked!`;
      }
      message += `\n\nStation level: L${newLevel}`;

      Alert.alert(title, message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to verify charger');
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    handleSubmit();
  };

  const getBonusCoins = (): number => {
    let bonus = 0;

    const portContextFields = [portTypeUsed, portsAvailable, chargingSuccess];
    const portContextCount = portContextFields.filter(f => f !== undefined).length;
    if (portContextCount >= 2) bonus += 1;

    if (paymentMethod && stationLighting) bonus += 1;

    const qualityFields = [cleanlinessRating, chargingSpeedRating, amenitiesRating, wouldRecommend];
    const qualityCount = qualityFields.filter(f => f !== undefined).length;
    if (qualityCount >= 3) bonus += 3;
    else if (qualityCount >= 2) bonus += 2;
    else if (qualityCount >= 1) bonus += 1;

    if (waitTime !== undefined) bonus += 1;

    if (photoUrl && action === 'not_working') bonus += 2;

    return bonus;
  };

  const getTotalCoins = (): number => {
    return Math.min(2 + getBonusCoins(), 9);
  };

  const getStepNumber = (): { current: number; total: number } => {
    const stepOrder: Step[] = ['action', 'wait_time', 'port_context', 'operational', 'quality'];
    if (action === 'not_working') stepOrder.push('photo');

    const current = stepOrder.indexOf(step) + 1;
    const total = stepOrder.length;

    return { current, total };
  };

  const renderProgressBar = () => {
    const { current, total } = getStepNumber();

    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>
          Step {current} of {total}
        </Text>
      </View>
    );
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

  const renderActionStep = () => (
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
          <Text style={styles.actionReward}>Earn up to 9 🪙</Text>
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
          <Text style={styles.actionReward}>Earn up to 7 🪙 (with photo)</Text>
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
          <Text style={styles.actionReward}>Earn up to 9 🪙</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666666" />
      </TouchableOpacity>
    </View>
  );

  const renderWaitTimeStep = () => (
    <View>
      <View style={styles.bonusBanner}>
        <Ionicons name="gift" size={24} color="#4CAF50" />
        <View style={styles.bonusContent}>
          <Text style={styles.bonusTitle}>Earn Up To 9 Coins!</Text>
          <Text style={styles.bonusDescription}>
            Share port details, payment info & ratings to unlock maximum rewards 🏆
          </Text>
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Wait time for available port?</Text>
        <Text style={styles.questionSubtitle}>How long did you wait to find an available charger?</Text>
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

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip to Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPortContextStep = () => (
    <View>
      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Which port type did you use?</Text>
        <View style={styles.optionButtons}>
          {['Type 1', 'Type 2', 'CCS', 'CHAdeMO'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                portTypeUsed === type && styles.optionButtonSelected,
              ]}
              onPress={() => setPortTypeUsed(type)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  portTypeUsed === type && styles.optionButtonTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>How many ports were available when you arrived?</Text>
        <View style={styles.optionButtons}>
          {[0, 1, 2, 3, '4+'].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.optionButton,
                portsAvailable === (num === '4+' ? 4 : num) && styles.optionButtonSelected,
              ]}
              onPress={() => setPortsAvailable(num === '4+' ? 4 : (num as number))}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  portsAvailable === (num === '4+' ? 4 : num) && styles.optionButtonTextSelected,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Did charging work on the first try?</Text>
        <View style={styles.yesNoButtons}>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              chargingSuccess === true && styles.yesNoButtonYes,
            ]}
            onPress={() => setChargingSuccess(true)}
          >
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={chargingSuccess === true ? '#FFFFFF' : '#4CAF50'}
            />
            <Text
              style={[
                styles.yesNoButtonText,
                chargingSuccess === true && styles.yesNoButtonTextSelected,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              chargingSuccess === false && styles.yesNoButtonNo,
            ]}
            onPress={() => setChargingSuccess(false)}
          >
            <Ionicons
              name="close-circle"
              size={28}
              color={chargingSuccess === false ? '#FFFFFF' : '#F44336'}
            />
            <Text
              style={[
                styles.yesNoButtonText,
                chargingSuccess === false && styles.yesNoButtonTextSelected,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {([portTypeUsed, portsAvailable, chargingSuccess].filter(f => f !== undefined).length >= 2) && (
        <Text style={styles.bonusIndicator}>
          Port context: +1 🪙
        </Text>
      )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip to Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOperationalStep = () => (
    <View>
      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>How did you pay?</Text>
        <View style={styles.optionButtons}>
          {['App', 'Card', 'Cash', 'Free'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.optionButton,
                paymentMethod === method && styles.optionButtonSelected,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  paymentMethod === method && styles.optionButtonTextSelected,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>How was the station lighting?</Text>
        <View style={styles.optionButtons}>
          {['Well-lit', 'Adequate', 'Poor'].map((lighting) => (
            <TouchableOpacity
              key={lighting}
              style={[
                styles.optionButton,
                stationLighting === lighting && styles.optionButtonSelected,
              ]}
              onPress={() => setStationLighting(lighting)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  stationLighting === lighting && styles.optionButtonTextSelected,
                ]}
              >
                {lighting}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {paymentMethod && stationLighting && (
        <Text style={styles.bonusIndicator}>Operational details: +1 🪙</Text>
      )}

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip to Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQualityStep = () => {
    const qualityFields = [cleanlinessRating, chargingSpeedRating, amenitiesRating, wouldRecommend];
    const qualityCount = qualityFields.filter(f => f !== undefined).length;
    let qualityBonus = 0;
    if (qualityCount >= 3) qualityBonus = 3;
    else if (qualityCount >= 2) qualityBonus = 2;
    else if (qualityCount >= 1) qualityBonus = 1;

    return (
      <View>
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

        <View style={styles.recommendSection}>
          <Text style={styles.questionTitle}>Would you recommend this station?</Text>
          <View style={styles.yesNoButtons}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                wouldRecommend === true && styles.yesNoButtonYes,
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
                  styles.yesNoButtonText,
                  wouldRecommend === true && styles.yesNoButtonTextSelected,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.yesNoButton,
                wouldRecommend === false && styles.yesNoButtonNo,
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
                  styles.yesNoButtonText,
                  wouldRecommend === false && styles.yesNoButtonTextSelected,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {qualityBonus > 0 && (
          <Text style={styles.bonusIndicator}>Quality ratings: +{qualityBonus} 🪙</Text>
        )}

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

        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={20} color="#666666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleNext} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {action === 'not_working' ? 'Next' : `Submit (${getTotalCoins()} 🪙)`}
              </Text>
            )}
            {action === 'not_working' && !submitting && <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPhotoStep = () => (
    <View>
      <View style={styles.photoBanner}>
        <Ionicons name="camera" size={32} color="#4CAF50" />
        <Text style={styles.photoBannerTitle}>Help Others With Photo Evidence</Text>
        <Text style={styles.photoBannerSubtitle}>
          Earn +2 extra coins by uploading a photo of the issue
        </Text>
      </View>

      <View style={styles.photoSection}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => {
            setPhotoUrl(`https://example.com/photos/station_${Date.now()}.jpg`);
          }}
        >
          <Ionicons name="cloud-upload" size={40} color="#4CAF50" />
          <Text style={styles.uploadButtonText}>
            {photoUrl ? 'Photo Added ✓' : 'Upload Photo'}
          </Text>
          {photoUrl && <Text style={styles.uploadSuccess}>+2 🪙 bonus!</Text>}
        </TouchableOpacity>

        {!photoUrl && (
          <Text style={styles.photoHint}>
            Optional: Take a photo showing the issue with the charger
          </Text>
        )}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit ({getTotalCoins()} 🪙)</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'action':
        return renderActionStep();
      case 'wait_time':
        return renderWaitTimeStep();
      case 'port_context':
        return renderPortContextStep();
      case 'operational':
        return renderOperationalStep();
      case 'quality':
        return renderQualityStep();
      case 'photo':
        return renderPhotoStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'action' ? 'Verify Station' : 'Enhanced Details'}
        </Text>
        <Animated.View
          style={[
            styles.coinBadge,
            {
              transform: [{ scale: coinPulse }],
              opacity: coinShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.85, 1],
              }),
            }
          ]}
        >
          <Text style={styles.coinBadgeText}>{getTotalCoins()} 🪙</Text>
        </Animated.View>
      </View>

      {/* Progress Bar */}
      {step !== 'action' && renderProgressBar()}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <Text style={styles.chargerName}>{chargerName}</Text>
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  coinBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFB300',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  coinBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57C00',
    textShadowColor: 'rgba(245, 124, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activeCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.15,
  },
  notWorkingCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
    shadowColor: '#F44336',
    shadowOpacity: 0.15,
  },
  partialCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOpacity: 0.15,
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
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bonusContent: {
    alignItems: 'center',
    marginTop: 8,
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
    textAlign: 'center',
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
  questionSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 18,
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
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  yesNoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  yesNoButtonYes: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
  },
  yesNoButtonNo: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
    shadowColor: '#F44336',
    shadowOpacity: 0.3,
  },
  yesNoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  yesNoButtonTextSelected: {
    color: '#FFFFFF',
  },
  bonusIndicator: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
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
  photoBanner: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  photoBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 12,
    marginBottom: 8,
  },
  photoBannerSubtitle: {
    fontSize: 13,
    color: '#1B5E20',
    textAlign: 'center',
    lineHeight: 18,
  },
  photoSection: {
    marginBottom: 24,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFF9',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 12,
  },
  uploadSuccess: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 8,
  },
  photoHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  skipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFB300',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F57C00',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

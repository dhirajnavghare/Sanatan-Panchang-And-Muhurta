import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Colors';
import { triggerHaptic } from '@/src/services/sacredAudio';
import { useTour } from '@/src/services/appTourContext';
import { getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';

export interface AppTourModalProps {
  visible: boolean;
  onClose: () => void;
  isHi: boolean;
}

interface TourSlide {
  emoji: string;
  badge: string;
  badgeHi: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  description: string;
  descriptionHi: string;
  highlight: string;
  highlightHi: string;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    emoji: '🕉️',
    badge: 'Welcome • 100% Offline',
    badgeHi: 'स्वागतम् • १००% ऑफ़लाइन',
    title: 'Welcome to Sanatan Dinacharya',
    titleHi: 'सनातन दिनचर्या में आपका स्वागत है',
    subtitle: 'Your authentic daily Panchang, Muhurta & Sadhana companion',
    subtitleHi: 'दैनिक पञ्चाङ्ग, शुभ मुहूर्त एवं साधना का प्रामाणिक साथी',
    description:
      'See today’s Tithi, sunrise timings, Rahu Kaal alerts, and live auspicious energy right at a glance — computed privately on your device.',
    descriptionHi:
      'आज की तिथि, सूर्योदय समय, राहु काल सावधानी और सक्रिय शुभ मुहूर्त तुरंत जानें — पूर्णतः ऑफ़लाइन व निजी गणना के साथ।',
    highlight: '⚡ Start the 2-minute interactive walkthrough or pick any section below',
    highlightHi: '⚡ २ मिनट का लाइव गाइड शुरू करें या नीचे से कोई एक अनुभाग चुनें',
  },
  {
    emoji: '🎯',
    badge: 'Plan Your Day Calmly',
    badgeHi: 'दिन योजना व नित्य साधना',
    title: '24h Muhurta Planner & 5 Habits',
    titleHi: '२४h मुहूर्त दिनचर्या व दैनिक साधना',
    subtitle: 'Align everyday work with fruitful Vedic windows',
    subtitleHi: 'हर कार्य को उसके अनुकूल शुभ काल में नियोजित करें',
    description:
      'Schedule tasks into 24-hour Muhurta slots with 1-tap Shastric suggestions, build your 5-habit Sadhana streak, and check Ekadashi or festival dates on the Monthly grid.',
    descriptionHi:
      '२४ घंटे के मुहूर्त स्लॉट्स में अपने कार्य जोड़ें, ५ नित्य साधनाओं से स्ट्रीक बनाएं और मासिक ग्रिड में एकादशी व पर्व देखें।',
    highlight: '🔔 Pre-scheduled offline reminders keep important windows on time',
    highlightHi: '🔔 समयपूर्व ऑफ़लाइन अलर्ट हर शुभ मुहूर्त याद दिलाते हैं',
  },
  {
    emoji: '📿',
    badge: 'Devotion, Shrines & Help',
    badgeHi: 'स्तोत्र, तीर्थ व मार्गदर्शन',
    title: 'Prayers, Pilgrimages & Help Anytime',
    titleHi: 'स्तोत्र-जप माला, तीर्थ व तत्काल सहायता',
    subtitle: 'Everything across 7 dedicated bottom tabs',
    subtitleHi: '७ व्यवस्थित टैब्स और हर स्क्रीन पर "?" मदद बटन',
    description:
      'Chant Stotras with a 108-bead haptic Japa Mala, read Vrat Kathas and Jyotirlinga guides, or tap "?" on any screen anytime for quick help or a section tour.',
    descriptionHi:
      '१०८ मनकों की जप माला, व्रत कथा व ज्योतिर्लिंग गाइड का उपयोग करें — किसी भी स्क्रीन पर "?" दबाकर कभी भी सहायता पाएं।',
    highlight: '🧭 Zero ads, zero tracking — launch live guidance or explore freely',
    highlightHi: '🧭 शून्य विज्ञापन — लाइव गाइड आज़माएं या सीधे उपयोग शुरू करें',
  },
];

const QUICK_LAUNCH_SECTIONS = [
  { id: 'dinacharya', emoji: '🌅', labelEn: 'Daily', labelHi: 'दिनचर्या' },
  { id: 'dayplanner', emoji: '🎯', labelEn: 'Planner', labelHi: 'दिन योजना' },
  { id: 'muhurta', emoji: '✨', labelEn: 'Muhurta', labelHi: 'मुहूर्त' },
  { id: 'prayers', emoji: '📿', labelEn: 'Prayers', labelHi: 'जप-स्तोत्र' },
];

export const AppTourModal: React.FC<AppTourModalProps> = ({
  visible,
  onClose,
  isHi,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = getAppTheme(isDark);
  const { width, height } = useWindowDimensions();
  const { startTour, startSectionTour, resumeTour, savedProgressStep, totalSteps } = useTour();

  if (!visible) return null;

  const currentSlide = TOUR_SLIDES[currentStep];
  const isLastStep = currentStep === TOUR_SLIDES.length - 1;

  const handleNext = () => {
    triggerHaptic('tap').catch(() => {});
    if (isLastStep) {
      setCurrentStep(0);
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    triggerHaptic('tap').catch(() => {});
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    triggerHaptic('tap').catch(() => {});
    setCurrentStep(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
      testID="app-tour-modal"
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.tourCard,
            isDark && styles.tourCardDark,
            {
              width: Math.min(Math.max(260, width - 32), 420),
              maxHeight: Math.min(height * 0.88, 640),
            },
          ]}
        >
          {/* Header Row: Step counter & Skip Button */}
          <View style={styles.topRow}>
            <View style={[styles.stepBadge, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder, borderWidth: 1 }]}>
              <Text style={[styles.stepBadgeText, isDark && { color: theme.primary }]}>
                {isHi ? `चरण ${currentStep + 1} / ${TOUR_SLIDES.length}` : `Step ${currentStep + 1} of ${TOUR_SLIDES.length}`}
              </Text>
            </View>

            <TouchableOpacity
              testID="tour-skip-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'टूर छोड़ें' : 'Skip tour'}
              style={[styles.skipBtn, isDark && { backgroundColor: theme.cardMuted }]}
              onPress={handleSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.skipBtnText, isDark && { color: theme.textSecondary }]}>{isHi ? 'छोड़ें ✕' : 'Skip ✕'}</Text>
            </TouchableOpacity>
          </View>

          {/* Slide Content Scroll */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Visual Icon */}
            <View style={[styles.iconCircle, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
              <Text style={styles.iconEmoji}>{currentSlide.emoji}</Text>
            </View>

            {/* Category Badge */}
            <View style={[styles.categoryBadge, isDark && { backgroundColor: theme.cardMuted }]}>
              <Text style={[styles.categoryBadgeText, isDark && { color: theme.textSecondary }]}>
                {isHi ? currentSlide.badgeHi : currentSlide.badge}
              </Text>
            </View>

            {/* Slide Title */}
            <Text style={[styles.slideTitle, isDark && styles.textWhite]}>
              {isHi ? currentSlide.titleHi : currentSlide.title}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.slideSubtitle, isDark && { color: theme.primary }]}>
              {isHi ? currentSlide.subtitleHi : currentSlide.subtitle}
            </Text>

            {/* Description Box */}
            <View style={[styles.descriptionBox, isDark && styles.descriptionBoxDark]}>
              <Text style={[styles.descriptionText, isDark && styles.textMutedDark]}>
                {isHi ? currentSlide.descriptionHi : currentSlide.description}
              </Text>
            </View>

            {/* Feature Highlight Pill */}
            <View style={[styles.highlightPill, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }]}>
              <Text style={[styles.highlightPillText, isDark && { color: theme.successText }]}>
                {isHi ? currentSlide.highlightHi : currentSlide.highlight}
              </Text>
            </View>

            {/* Live Interactive Tour Callout Button */}
            {savedProgressStep > 0 && savedProgressStep < totalSteps && (
              <TouchableOpacity
                testID="tour-resume-interactive-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'अधूरा लाइव टूर जारी रखें' : 'Resume saved live tour'}
                style={[styles.liveTourBtn, { backgroundColor: '#b45309', marginBottom: 4, minHeight: MIN_TOUCH_TARGET }]}
                onPress={() => {
                  triggerHaptic('tap').catch(() => {});
                  onClose();
                  resumeTour();
                }}
                activeOpacity={0.88}
              >
                <Ionicons name="play-forward" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.liveTourBtnText}>
                  {isHi
                    ? `अधूरा टूर जारी रखें (चरण ${savedProgressStep + 1}/${totalSteps})`
                    : `Resume Tour (Step ${savedProgressStep + 1}/${totalSteps})`}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              testID="tour-start-interactive-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'संपूर्ण लाइव ऐप टूर देखें' : 'Start Live Guided Tour'}
              style={[styles.liveTourBtn, { minHeight: MIN_TOUCH_TARGET }]}
              onPress={() => {
                triggerHaptic('tap').catch(() => {});
                onClose();
                startTour(0);
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="compass" size={17} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.liveTourBtnText}>
                {isHi ? '🚀 इंटरएक्टिव लाइव गाइड शुरू करें' : '🚀 Start Interactive Tour (~2 min)'}
              </Text>
            </TouchableOpacity>

            {/* Quick Section Tour Chips for Progressive Learning */}
            <View style={styles.quickSectionWrap}>
              <Text style={[styles.quickSectionLabel, { color: theme.textMuted }]}>
                {isHi ? 'या केवल एक अनुभाग का गाइड चुनें:' : 'Or jump straight to one area:'}
              </Text>
              <View style={styles.quickSectionRow}>
                {QUICK_LAUNCH_SECTIONS.map((sec) => (
                  <TouchableOpacity
                    key={sec.id}
                    testID={`tour-welcome-section-${sec.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={isHi ? `${sec.labelHi} गाइड शुरू करें` : `Tour ${sec.labelEn}`}
                    style={[
                      styles.quickSectionChip,
                      {
                        backgroundColor: theme.cardMuted,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('tap').catch(() => {});
                      onClose();
                      startSectionTour(sec.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickSectionEmoji}>{sec.emoji}</Text>
                    <Text style={[styles.quickSectionChipText, { color: theme.text }]}>
                      {isHi ? sec.labelHi : sec.labelEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer: Indicator Dots & Action Buttons */}
          <View style={[styles.footerContainer, isDark && { borderTopColor: theme.border }]}>
            {/* Dots */}
            <View style={styles.dotsRow}>
              {TOUR_SLIDES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentStep ? styles.dotActive : isDark ? styles.dotInactiveDark : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Buttons Row */}
            <View style={styles.actionsRow}>
              {currentStep > 0 ? (
                <TouchableOpacity
                  testID="tour-back-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'पिछला परिचय कार्ड' : 'Previous intro slide'}
                  style={[styles.backBtn, { minHeight: MIN_TOUCH_TARGET }]}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color={theme.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.backBtnText, { color: theme.textMuted }]}>{isHi ? 'पीछे' : 'Back'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 70 }} />
              )}

              <TouchableOpacity
                testID={isLastStep ? 'tour-finish-btn' : 'tour-next-btn'}
                accessibilityRole="button"
                accessibilityLabel={
                  isLastStep
                    ? (isHi ? 'स्वयं उपयोग शुरू करें' : 'Explore on my own')
                    : (isHi ? 'अगला परिचय' : 'Next overview')
                }
                style={[styles.primaryBtn, { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }, isLastStep && styles.primaryBtnFinish]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {isLastStep
                    ? isHi ? 'स्वयं देखें 🙏' : 'Explore App 🙏'
                    : isHi ? 'आगे बढ़ें →' : 'Next →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  tourCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  tourCardDark: {
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2e2e38',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stepBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  skipBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  skipBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52525b',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconEmoji: {
    fontSize: 38,
  },
  categoryBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#52525b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 27,
  },
  slideSubtitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#b45309',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 21,
  },
  descriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  descriptionBoxDark: {
    backgroundColor: '#262632',
    borderColor: '#383848',
  },
  descriptionText: {
    fontSize: 14.5,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'left',
    fontWeight: '400',
  },
  highlightPill: {
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    width: '100%',
    alignItems: 'center',
  },
  highlightPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
    textAlign: 'center',
    lineHeight: 19,
  },
  liveTourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  liveTourBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  quickSectionWrap: {
    width: '100%',
    marginTop: 14,
    alignItems: 'center',
  },
  quickSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickSectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickSectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickSectionEmoji: {
    fontSize: 14,
  },
  quickSectionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#b45309',
  },
  dotInactive: {
    backgroundColor: '#e4e4e7',
  },
  dotInactiveDark: {
    backgroundColor: '#3f3f46',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#52525b',
  },
  primaryBtn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnFinish: {
    backgroundColor: '#047857',
    shadowColor: '#047857',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  textWhite: {
    color: '#f4f4f5',
  },
  textMutedDark: {
    color: '#cbd5e1',
  },
});

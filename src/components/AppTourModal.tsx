import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { triggerHaptic } from '@/src/services/sacredAudio';

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
    emoji: '🌅',
    badge: 'Kāla (Cosmic Time)',
    badgeHi: 'काल चेतना',
    title: 'Welcome to Sanatan Dinacharya',
    titleHi: 'सनातन दिनचर्या में आपका स्वागत है',
    subtitle: 'Time is not just a clock; it is cosmic Kāla',
    subtitleHi: 'समय केवल घड़ी नहीं, जीवित काल-ऊर्जा है',
    description:
      'In Vedic tradition, every hour carries a specific spiritual frequency. Sanatan Dinacharya guides you in real time — knowing whether Amrit, Shubh, or Rahu Kaal is active right now so your actions bring peace and triumph.',
    descriptionHi:
      'सनातन परम्परा में हर घड़ी का एक विशेष प्रभाव होता है। सनातन दिनचर्या आपको सीधे बताती है कि अभी इस क्षण कौन सा मुहूर्त सक्रिय है — अमृत, शुभ अथवा राहु काल — ताकि आप सही समय पर शुभ कर्म कर सकें।',
    highlight: '⚡ Live Cosmic Compass: Know your exact auspicious window now',
    highlightHi: '⚡ सजीव काल कम्पास: जानें अभी क्या शुभ कार्य करना चाहिए',
  },
  {
    emoji: '🎯',
    badge: 'Muhurta Day Planner',
    badgeHi: 'दैनिक कार्य योजना',
    title: 'Continuous Vedic Day Planner & To-Do',
    titleHi: 'मुहूर्त आधारित दिनचर्या व To-Do सूची',
    subtitle: 'Hour-by-hour contiguous timeline from 4 AM to sleep',
    subtitleHi: 'सुबह 4:00 से रात्रि विश्राम तक की अविरल समय-सारणी',
    description:
      'A seamless 24-hour schedule connected by Vedic Muhurtas and Choghadiyas. Add 1-tap Shastric preset tasks (Meditation, Surya Arghya, Gita study, Key decisions) or type custom tasks into your daily checklist.',
    descriptionHi:
      'ब्रह्म मुहूर्त से रात्रि शयन तक २४ घंटे की अविरल समय-सारणी। प्रत्येक मुहूर्त में १-टैप से शास्त्रीय सुझाव जोड़ें (ध्यान, सूर्य अर्घ्य, स्वाध्याय, अनुबंध हस्ताक्षर) अथवा अपने निजी कार्य लिखकर टू-डू लिस्ट बनाएं।',
    highlight: '✨ 1-Tap Presets • Checklists • Completion Progress Badges',
    highlightHi: '✨ १-टैप सुझाव • चेकलिस्ट • पूर्णता प्रगति 🎯',
  },
  {
    emoji: '📿',
    badge: 'Daily Sadhana & Sankalpa',
    badgeHi: 'नित्यकर्म व सङ्कल्प',
    title: 'Daily Micro-Sadhana & Gotra Sankalpa',
    titleHi: 'दैनिक नित्यकर्म साधना व गोत्र सङ्कल्प',
    subtitle: '5 micro-habits & personalized Vedic Sankalpa',
    subtitleHi: '५ सूक्ष्म साधनाएं एवं आपके गोत्र-नाम से सङ्कल्प पाठ',
    description:
      'Complete 5 daily micro-habits to build an unbroken spiritual streak: Pre-dawn waking, Surya Arghya, Ishta Puja, Satvik deeds, and Evening Lamp. Recite your authentic daily Gotra & Name Sankalpa in one tap.',
    descriptionHi:
      'दैनिक ५ सूक्ष्म साधनाएं पूर्ण कर अपनी स्ट्रीक बनाएं: प्रातः जागरण, सूर्य अर्घ्य, इष्ट पूजा, सात्विक कर्म एवं सायं दीप। साथ ही अपने नाम व गोत्र से युक्त शास्त्रसम्मत दैनिक सङ्कल्प का १-टैप में पाठ करें।',
    highlight: '🔥 Sadhana Streak • Personalized Vedic Gotra Sankalpa',
    highlightHi: '🔥 साधना स्ट्रीक • व्यक्तिगत गोत्र सङ्कल्प • आत्म-शांति',
  },
  {
    emoji: '🔔',
    badge: 'Sacred Audio & Sharing',
    badgeHi: 'देव ध्वनि व शेयर',
    title: 'Mandir Brass Bell & WhatsApp Cards',
    titleHi: 'मन्दिर पीतल घंटी एवं पञ्चाङ्ग शेयर कार्ड',
    subtitle: 'Sacred acoustic chime & 1-tap family cards',
    subtitleHi: 'पवित्र ध्वनि तरंगें एवं परिवार संग दैनिक पञ्चाङ्ग साझा',
    description:
      'Chime the authentic brass temple bell with real acoustic frequency to start your morning auspiciously. Generate high-devotion, beautiful daily Panchang & Shubh Muhurta cards to share on family WhatsApp groups.',
    descriptionHi:
      'शीर्ष पर स्थित मन्दिर की पीतल घंटी बजाकर शुद्ध ध्वनि तरंगों का अनुभव करें। प्रतिदिन सुबह परिवार व मित्रों के वॉट्सऐप ग्रुप के लिए सुंदर, प्रामाणिक पञ्चाङ्ग व शुभ मुहूर्त कार्ड एक टैप में तैयार करें।',
    highlight: '🔔 Real Brass Bell Chime • 📲 Viral WhatsApp Card Generator',
    highlightHi: '🔔 वास्तविक पीतल घंटी • 📲 १-टैप वॉट्सऐप ग्रुप कार्ड',
  },
  {
    emoji: '🌟',
    badge: '6 Sacred Tabs',
    badgeHi: '६ पवित्र अनुभाग',
    title: 'Your 6 Sacred Companion Tabs',
    titleHi: 'आपके ६ दैनिक सहायक अनुभाग',
    subtitle: 'The comprehensive daily companion for every Sanatani',
    subtitleHi: 'हर सनातनी का संपूर्ण एवं प्रामाणिक डिजिटल साथी',
    description:
      '• दिनचर्या (Dinacharya): Your daily Muhurta Planner & To-Do workspace\n• मुहूर्त (Muhurta): 12+ categories Shubh Muhurta Finder\n• पर्व-व्रत (Festivals): Full Ekadashi, Vrat & Festival almanac\n• स्तोत्र-जप (Prayers): 108-bead Japa Mala counter & Stotras\n• तीर्थ (More): Jyotirlinga, Char Dham & Divine Deities\n• सेटिंग्स (Settings): Personalized Alerts, Gotra Profile & Language',
    descriptionHi:
      '• दिनचर्या: आपका दैनिक मुहूर्त प्लानर व टू-डू कार्य योजना\n• मुहूर्त: विवाह, गृह प्रवेश आदि १२+ श्रेणियों का मुहूर्त शोधक\n• पर्व-व्रत: सम्पूर्ण एकादशी, पूर्णिमा व त्योहार पञ्चिका\n• स्तोत्र-जप: १०८ मनकों की जप माला, चालीसा व स्तोत्र संग्रह\n• तीर्थ: ज्योतिर्लिंग, चार धाम व देवी-देवता दर्शन\n• सेटिंग्स: फोन नोटिफिकेशन, गोत्र प्रोफाइल व भाषा सेटिंग्स',
    highlight: '🚩 Authentic mathematical ephemeris with zero approximations',
    highlightHi: '🚩 नासा व प्राचीन भारतीय सिद्धान्तों पर आधारित पूर्णतः सटीक',
  },
];

export const AppTourModal: React.FC<AppTourModalProps> = ({
  visible,
  onClose,
  isHi,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        <View style={[styles.tourCard, isDark && styles.tourCardDark]}>
          {/* Header Row: Step counter & Skip Button */}
          <View style={styles.topRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {isHi ? `चरण ${currentStep + 1} / ${TOUR_SLIDES.length}` : `Step ${currentStep + 1} of ${TOUR_SLIDES.length}`}
              </Text>
            </View>

            <TouchableOpacity
              testID="tour-skip-btn"
              style={styles.skipBtn}
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipBtnText}>{isHi ? 'छोड़ें ✕' : 'Skip ✕'}</Text>
            </TouchableOpacity>
          </View>

          {/* Slide Content Scroll */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Visual Icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{currentSlide.emoji}</Text>
            </View>

            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {isHi ? currentSlide.badgeHi : currentSlide.badge}
              </Text>
            </View>

            {/* Slide Title */}
            <Text style={[styles.slideTitle, isDark && styles.textWhite]}>
              {isHi ? currentSlide.titleHi : currentSlide.title}
            </Text>

            {/* Subtitle */}
            <Text style={styles.slideSubtitle}>
              {isHi ? currentSlide.subtitleHi : currentSlide.subtitle}
            </Text>

            {/* Description Box */}
            <View style={[styles.descriptionBox, isDark && styles.descriptionBoxDark]}>
              <Text style={[styles.descriptionText, isDark && styles.textMutedDark]}>
                {isHi ? currentSlide.descriptionHi : currentSlide.description}
              </Text>
            </View>

            {/* Feature Highlight Pill */}
            <View style={styles.highlightPill}>
              <Text style={styles.highlightPillText}>
                {isHi ? currentSlide.highlightHi : currentSlide.highlight}
              </Text>
            </View>
          </ScrollView>

          {/* Footer: Indicator Dots & Action Buttons */}
          <View style={styles.footerContainer}>
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
                  style={styles.backBtn}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color="#71717a" style={{ marginRight: 4 }} />
                  <Text style={styles.backBtnText}>{isHi ? 'पीछे' : 'Back'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 70 }} />
              )}

              <TouchableOpacity
                testID={isLastStep ? 'tour-finish-btn' : 'tour-next-btn'}
                style={[styles.primaryBtn, isLastStep && styles.primaryBtnFinish]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {isLastStep
                    ? isHi ? 'आरम्भ करें 🙏' : 'Get Started 🙏'
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

const { width, height } = Dimensions.get('window');

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
    width: Math.min(width - 32, 420),
    maxHeight: Math.min(height * 0.88, 640),
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 24,
  },
  slideSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  descriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
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
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    textAlign: 'left',
    fontWeight: '400',
  },
  highlightPill: {
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    width: '100%',
    alignItems: 'center',
  },
  highlightPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    textAlign: 'center',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#71717a',
  },
  primaryBtn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 120,
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
    fontSize: 14,
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

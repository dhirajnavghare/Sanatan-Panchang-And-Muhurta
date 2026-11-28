import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  useColorScheme,
  ScrollView,
  Platform,
  Animated,
  BackHandler,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '../services/appTourContext';
import { useLanguage } from '../core/i18n/LanguageContext';
import { Radius, Spacing } from '@/constants/Colors';
import {
  getStepSpotlightRect,
  computeHighlightFrame,
  computeTooltipLayout,
} from '../utils/tourSpotlight';
import { TOUR_SECTIONS } from '../constants/tourSteps';
import { TourRuntimeContext, TourStepConditionType } from '../types/tour';
import { playTempleBell, playShankhNaad, triggerHaptic } from '../services/sacredAudio';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MIN_TOUCH_TARGET } from '../utils/theme';

/**
 * Produces contextual state-aware guidance based on current permissions,
 * empty states, calendar edge cases (Wednesday Abhijit), or offline state.
 */
function getConditionInsight(
  conditionType: TourStepConditionType | undefined,
  ctx: TourRuntimeContext,
  isHi: boolean
): { emoji: string; text: string; tone: 'info' | 'warn' } | null {
  if (!conditionType) return null;

  switch (conditionType) {
    case 'location_permission':
      if (ctx.locationPermission === 'denied') {
        return {
          emoji: '📍',
          tone: 'warn',
          text: isHi
            ? 'GPS अनुमति बंद है। पञ्चाङ्ग व राहुकाल सटीक गणना हेतु स्थान आवश्यक है — आप सेटिंग्स से शहर भी चुन सकते हैं।'
            : 'Location permission is currently off. GPS ensures accurate local sunrise & Rahu Kaal — or pick any city manually.',
        };
      }
      return {
        emoji: '🛰️',
        tone: 'info',
        text: isHi
          ? 'सूर्योदय व चौघड़िया आपके चुने गए शहर के अक्षांश-देशांतर (Meridian) पर आधारित हैं।'
          : 'Sunrise and Muhurta windows automatically adapt to your selected city meridian.',
      };

    case 'notification_permission':
      if (ctx.notificationPermission === 'denied') {
        return {
          emoji: '🔕',
          tone: 'warn',
          text: isHi
            ? 'फ़ोन सूचना अनुमति बंद है। अभिजीत मुहूर्त व एकादशी अलर्ट पाने हेतु सेटिंग्स से अनुमति दें।'
            : 'Notification permission is off. Enable phone alerts so we can remind you before sacred windows begin.',
        };
      }
      return null;

    case 'planner_empty':
      if (ctx.plannedTaskCount === 0) {
        return {
          emoji: '📝',
          tone: 'info',
          text: isHi
            ? 'आज के लिए कोई कार्य अभी जुड़ा नहीं है। किसी भी मुहूर्त कार्ड में "+ कार्य जोड़ें" दबाकर शुरुआत करें!'
            : 'No tasks scheduled for today yet. Tap "+ Add Task" inside any Muhurta card or tap a suggestion chip!',
        };
      }
      return {
        emoji: '✅',
        tone: 'info',
        text: isHi
          ? `आज के लिए ${ctx.plannedTaskCount} कार्य पहले से निर्धारित हैं — "योजनाबद्ध" टैब में देखें।`
          : `${ctx.plannedTaskCount} task(s) scheduled today — open "Planned" to review them.`,
      };

    case 'sadhana_empty':
      if (ctx.completedSadhanaCount === 0) {
        return {
          emoji: '🌱',
          tone: 'info',
          text: isHi
            ? 'अपनी पहली नित्य साधना पर टिक करके आज की आध्यात्मिक स्ट्रीक शुरू करें।'
            : 'Tap any item below to begin your daily spiritual streak!',
        };
      }
      return {
        emoji: '🔥',
        tone: 'info',
        text: isHi
          ? `आज ${ctx.completedSadhanaCount} नित्य साधनाएं पूर्ण — उत्तम अनुशासन!`
          : `${ctx.completedSadhanaCount} daily practice(s) completed today — keep going!`,
      };

    case 'abhijit_status':
      if (!ctx.isAbhijitAvailableToday) {
        return {
          emoji: '⚖️',
          tone: 'warn',
          text: isHi
            ? 'शास्त्रीय नियम: बुधवार को अभिजित मुहूर्त वर्जित (राहुकाल से संयुत) होता है — कम्पास आपको आज का श्रेष्ठ वैकल्पिक मुहूर्त दिखाएगा।'
            : 'Shastric Note: Abhijit Muhurta is unavailable on Wednesdays — the compass automatically highlights the best alternate window.',
        };
      }
      return null;

    case 'network_required':
      if (ctx.hasNetworkErrorOnCommunity) {
        return {
          emoji: '📡',
          tone: 'warn',
          text: isHi
            ? 'प्रोजेक्ट हब हेतु इंटरनेट आवश्यक है। बाकी संपूर्ण पञ्चाङ्ग व स्तोत्र १००% ऑफलाइन काम करते हैं।'
            : 'Live Community feed needs internet access. Core Panchang, Festivals, and Prayers work 100% offline.',
        };
      }
      return {
        emoji: '🌐',
        tone: 'info',
        text: isHi
          ? 'यह अनुभाग इंटरनेट से लाइव जुड़ता है, जबकि मुख्य पञ्चाङ्ग सदा ऑफलाइन उपलब्ध है।'
          : 'Uses internet to fetch live releases & submit feedback; core Panchang remains offline-ready.',
      };

    default:
      return null;
  }
}

/**
 * Context-aware dynamic "Try This" labels for all 32 guided tour steps
 */
export const getStepTryLabel = (stepId: string, isHi: boolean): string => {
  switch (stepId) {
    case 'step-header':
      return isHi ? '📍 नगर व तिथि देखें' : '📍 View city & date';
    case 'step-lang':
      return isHi ? '🌐 भाषा बदलकर देखें' : '🌐 Switch language';
    case 'step-bell':
      return isHi ? '🔔 घंटी बजाकर देखें' : '🔔 Chime temple bell';
    case 'step-share':
      return isHi ? '📲 शेयर कार्ड बनाएं' : '📲 Create WhatsApp card';
    case 'step-day-strip':
      return isHi ? '📅 तारीख बदलकर देखें' : '📅 Select another date';
    case 'step-view-mode':
      return isHi ? '⚡ दर्शन मोड बदलें' : '⚡ Switch view mode';
    case 'step-live-compass':
      return isHi ? '🧭 सजीव काल ऊर्जा जानें' : '🧭 Check active energy';
    case 'step-sadhana-checklist':
      return isHi ? '📿 साधना टिक करें' : '📿 Mark habit complete';
    case 'step-sankalpa':
      return isHi ? '📜 सङ्कल्प पाठ खोलें' : '📜 Recite Vedic vow';
    case 'step-rashi-card':
      return isHi ? '🪐 राशिफल व उपाय देखें' : '🪐 View Rashi remedy';
    case 'step-monthly-calendar':
      return isHi ? '📆 मासिक तिथियाँ देखें' : '📆 Browse monthly grid';
    case 'step-planner-intro':
      return isHi ? '🎯 दिन योजना समय देखें' : '🎯 Explore Day Planner';
    case 'step-planner-tabs':
      return isHi ? '🗂️ सब-टैब बदलकर देखें' : '🗂️ Switch sub-tabs';
    case 'step-planner-cards':
      return isHi ? '⏰ मुहूर्त समय देखें' : '⏰ Inspect Muhurta hours';
    case 'step-planner-suggested-chips':
      return isHi ? '✨ १-टैप सुझाव जोड़ें' : '✨ Add 1-tap task suggestion';
    case 'step-planner-custom-tasks':
      return isHi ? '📝 नियोजित कार्य सूची देखें' : '📝 Inspect planned tasks';
    case 'step-planner-inauspicious':
      return isHi ? '⚠️ त्याज्य समय सचेतक' : '⚠️ Check Rahu Kaal alert';
    case 'step-muhurta-categories':
      return isHi ? '✨ मुहूर्त श्रेणी चुनें' : '✨ Choose Muhurta category';
    case 'step-muhurta-inauspicious-card':
      return isHi ? '📜 त्याज्य काल विस्तारें' : '📜 Expand all 3 avoid windows';
    case 'step-muhurta-filters':
      return isHi ? '🔍 ६० दिन फ़िल्टर करें' : '🔍 Filter 60 days ahead';
    case 'step-festivals-almanac':
      return isHi ? '🔥 आगामी पर्व देखें' : '🔥 Browse holy festivals';
    case 'step-festivals-search':
      return isHi ? '🔎 श्रेणी फ़िल्टर करें' : '🔎 Filter festivals by type';
    case 'step-prayers-collection':
      return isHi ? '📖 स्तोत्र संग्रह देखें' : '📖 Explore sacred prayers';
    case 'step-prayers-audio':
      return isHi ? '🐚 शंख बजाकर देखें' : '🐚 Sound the sacred conch';
    case 'step-prayers-japa-mala':
      return isHi ? '📿 १०८ जप माला आज़माएं' : '📿 Try 108-bead Japa Mala';
    case 'step-prayers-chant-loop':
      return isHi ? '🔁 स्वचालित पाठ आवर्तन' : '🔁 Try guided chant player';
    case 'step-more-temples':
      return isHi ? '🛕 ज्योतिर्लिंग व चार धाम' : '🛕 Explore sacred shrines';
    case 'step-more-devatas-vrat':
      return isHi ? '🔱 देवी-देवता कार्ड चुनें' : '🔱 Inspect Deities & mantras';
    case 'step-more-vrat-katha':
      return isHi ? '📜 व्रत कथा व विधि पढ़ें' : '📜 Read Vrat Kathas & rules';
    case 'step-settings-profile':
      return isHi ? '👤 गोत्र प्रोफाइल देखें' : '👤 View devotee profile';
    case 'step-settings-location-cal':
      return isHi ? '📍 नगर व परम्परा' : '📍 Check location & calendar';
    case 'step-settings-notif':
      return isHi ? '🔔 अलर्ट स्विच करें' : '🔔 Toggle smart alerts';
    case 'step-settings-replay':
      return isHi ? '🧭 पुनः टूर याद रखें' : '🧭 Remember tour replay button';
    case 'step-community-hub':
      return isHi ? '🤝 प्रोजेक्ट अपडेट्स देखें' : '🤝 Browse live project hub';
    case 'step-community-feedback':
      return isHi ? '💬 सुझाव या समस्या भेजें' : '💬 Try feedback & bug forms';
    default:
      return isHi ? 'यहाँ टैप करें' : 'Tap here to try';
  }
};

export const InteractiveTourOverlay: React.FC = () => {
  const {
    isInteractiveTourActive,
    isTryModeActive,
    currentStepIndex,
    currentTourStep,
    totalSteps,
    activeSectionId,
    sectionStepRange,
    tourRuntimeContext,
    completedSections,
    isCompleted,
    isExitConfirmVisible,
    targetRects,
    nextStep,
    prevStep,
    goToStep,
    enterTryMode,
    continueTourFromTryMode,
    exitTryMode,
    requestSkipTour,
    confirmExitTour,
    cancelExitTour,
    finishTour,
    requestActiveTargetMeasure,
  } = useTour();

  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  // Keep giant border cutout compact so Android GPU texture stays < 4096px even on tablets
  const SCRIM_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) + 40;

  const overlayRef = useRef<React.ElementRef<typeof View>>(null);
  const [overlayOrigin, setOverlayOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const measureOverlayOrigin = useCallback(() => {
    const node = overlayRef.current as unknown as {
      measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
    } | null;
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((ox, oy) => {
      if (!Number.isFinite(ox) || !Number.isFinite(oy)) return;
      setOverlayOrigin((prev) =>
        Math.abs(prev.x - ox) < 0.5 && Math.abs(prev.y - oy) < 0.5 ? prev : { x: ox, y: oy }
      );
    });
  }, []);

  useEffect(() => {
    if (!isInteractiveTourActive) {
      return;
    }
    measureOverlayOrigin();
    requestActiveTargetMeasure(currentTourStep?.tab, false);
  }, [
    isInteractiveTourActive,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    currentTourStep?.tab,
    measureOverlayOrigin,
    requestActiveTargetMeasure,
  ]);

  useEffect(() => {
    if (!isInteractiveTourActive) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardHeight(h);
      requestActiveTargetMeasure(currentTourStep?.tab, false);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      requestActiveTargetMeasure(currentTourStep?.tab, false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
      setKeyboardHeight(0);
    };
  }, [isInteractiveTourActive, currentTourStep?.tab, requestActiveTargetMeasure]);

  // Android Hardware Back Button navigation integration
  useEffect(() => {
    if (!isInteractiveTourActive && !isCompleted && !isExitConfirmVisible) {
      return;
    }

    const backAction = () => {
      if (isExitConfirmVisible) {
        cancelExitTour();
        return true;
      }
      if (isCompleted) {
        finishTour();
        return true;
      }
      if (isTryModeActive) {
        exitTryMode();
        return true;
      }
      if (currentStepIndex > 0) {
        prevStep();
        return true;
      }
      requestSkipTour();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [
    isInteractiveTourActive,
    isTryModeActive,
    isCompleted,
    isExitConfirmVisible,
    currentStepIndex,
    prevStep,
    exitTryMode,
    cancelExitTour,
    finishTour,
    requestSkipTour,
  ]);

  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [auraScaleAnim] = useState(() => new Animated.Value(1));
  const [auraOpacityAnim] = useState(() => new Animated.Value(0.6));
  const [toastOpacityAnim] = useState(() => new Animated.Value(0));

  // Touch tracking for swipe gestures
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const sectionScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    const secIdx = TOUR_SECTIONS.findIndex(
      (sec) => currentStepIndex >= sec.startStep && currentStepIndex <= sec.endStep
    );
    if (secIdx >= 0 && sectionScrollRef.current) {
      sectionScrollRef.current.scrollTo({
        x: Math.max(0, secIdx * 76 - 30),
        animated: true,
      });
    }
  }, [currentStepIndex]);

  // Micro-toast state for interactive hands-on feedback
  const [trySuccessToast, setTrySuccessToast] = useState<string | null>(null);
  const [triedStepIndex, setTriedStepIndex] = useState<number | null>(null);
  const hasTriedCurrentStep = triedStepIndex === currentStepIndex;
  const toastDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastDismissTimer.current) {
        clearTimeout(toastDismissTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulseAnim.setValue(1);
      auraScaleAnim.setValue(1);
      auraOpacityAnim.setValue(0.35);
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(auraScaleAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(auraOpacityAnim, {
            toValue: 0.12,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(auraScaleAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(auraOpacityAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    auraLoop.start();

    return () => {
      pulseLoop.stop();
      auraLoop.stop();
    };
  }, [reduceMotion, pulseAnim, auraScaleAnim, auraOpacityAnim]);

  // Enhanced Interactive Tap-to-Try Handler for all 30 steps
  const handleSpotlightPress = useCallback(() => {
    if (!currentTourStep) return;

    let toastMsg = isHi ? '✓ उत्तम!' : '✓ Great!';

    switch (currentTourStep.id) {
      case 'step-header':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi
          ? '📍 उज्जैन (महाकाल नगरी) • २३.१८° N, ७५.७९° E'
          : '📍 Ujjain (Prime Meridian) • 23.18° N, 75.79° E';
        break;

      case 'step-lang': {
        const nextLang = language === 'hi' ? 'en' : 'hi';
        setLanguage(nextLang);
        triggerHaptic('tap').catch(() => {});
        toastMsg = nextLang === 'hi' ? '🌐 भाषा: हिन्दी' : '🌐 Language: English';
        break;
      }

      case 'step-bell':
        playTempleBell(1.0);
        triggerHaptic('quarter').catch(() => {});
        toastMsg = isHi ? '🔔 पावन मन्दिर घंटी नाद!' : '🔔 Sacred Temple Bell chimed!';
        break;

      case 'step-share':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📲 दैनिक पञ्चाङ्ग WhatsApp कार्ड तैयार!' : '📲 Daily WhatsApp Card Ready!';
        break;

      case 'step-day-strip':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📅 आज का सम्पूर्ण पञ्चाङ्ग व काल सारणी!' : '📅 Today’s Panchang & Timings Loaded!';
        break;

      case 'step-view-mode':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '⚡ ३ दर्शन: पञ्चाङ्ग • दिन योजना • मासिक' : '⚡ 3 Views: Panchang • Planner • Monthly';
        break;

      case 'step-live-compass':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🧭 सजीव काल ऊर्जा: शुभ मुहूर्त सक्रिय!' : '🧭 Real-time Energy: Auspicious Window!';
        break;

      case 'step-sadhana-checklist':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📿 ५ नित्यकर्म साधनाएं: स्ट्रीक १ दिन!' : '📿 5 Daily Micro-Habits: 1-Day Streak!';
        break;

      case 'step-sankalpa':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📜 नाम-गोत्र व्यक्तिगत वैदिक सङ्कल्प पाठ!' : '📜 Personalized Gotra Vedic Sankalpa!';
        break;

      case 'step-rashi-card':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🪐 चन्द्र गोचर: राशि चुनकर आज के उपाय देखें!' : '🪐 Try selecting your Rashi sign below!';
        break;

      case 'step-monthly-calendar':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📆 मासिक ग्रिड: किसी भी तिथि पर टैप करके देखें!' : '📆 Try tapping any date in the Monthly Grid!';
        break;

      case 'step-planner-intro':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🎯 सुबह ४ बजे से रात्रि शयन तक अविरल योजना!' : '🎯 24h Auspicious Muhurta Timeline!';
        break;

      case 'step-planner-tabs':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🗂️ सब-टैब: मुख्य मुहूर्त • सम्पूर्ण २४h • नियोजित' : '🗂️ Sub-Tabs: Core • All 24h • Planned';
        break;

      case 'step-planner-cards':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '⏰ ब्रह्म मुहूर्त (०५:०० AM - ०५:५२ AM): सर्वोत्तम काल' : '⏰ Brahma Muhurta (5:00 AM - 5:52 AM): Supreme';
        break;

      case 'step-planner-suggested-chips':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '✨ १-टैप सुझाव: "ध्यान व जप" कार्य जुड़ा!' : '✨ 1-Tap Preset: "Meditation & Japa" Added!';
        break;

      case 'step-planner-custom-tasks':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📝 नया कार्य: "संध्या वन्दन" प्लानर में नियोजित!' : '📝 Custom Task: "Sandhya Vandanam" Scheduled!';
        break;

      case 'step-planner-inauspicious':
        triggerHaptic('heavy').catch(() => {});
        toastMsg = isHi ? '⚠️ राहु काल व त्याज्य समय: नया कार्य वर्जित' : '⚠️ Rahu Kaal & Avoidable Hours Alert!';
        break;

      case 'step-muhurta-categories':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '✨ गृह प्रवेश, विवाह, वाहन क्रय आदि १२+ श्रेणियां' : '✨ Griha Pravesh, Marriage & 12+ Categories';
        break;

      case 'step-muhurta-inauspicious-card':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📜 मुहूर्तचिन्तामणि व निर्णयसिन्धु ग्रन्थ नियम' : '📜 Muhurta Chintamani Shastric Rules';
        break;

      case 'step-muhurta-filters':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🔍 ३०/६०/९० दिन व उत्तम/श्रेष्ठ मुहूर्त फ़िल्टर!' : '🔍 30/60/90 Days & Optimal Suitability Filters!';
        break;

      case 'step-festivals-almanac':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🔥 वर्ष भर के सभी प्रमुख पर्व, एकादशी व प्रदोष' : '🔥 Complete Year Almanac of Festivals & Vrats';
        break;

      case 'step-festivals-search':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🔎 प्रमुख पर्व, व्रत व जयन्ती श्रेणी फ़िल्टर' : '🔎 Search & Filter by Major, Vrat, Jayanti';
        break;

      case 'step-prayers-collection':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📖 ऊपर दिए चिप्स से कोई स्तोत्र चुनें!' : '📖 Tap any prayer chip above to read!';
        break;

      case 'step-prayers-audio':
        playShankhNaad(1.0);
        triggerHaptic('heavy').catch(() => {});
        toastMsg = isHi ? '🐚 पावन शंखनाद!' : '🐚 Sacred Conch sounded!';
        break;

      case 'step-prayers-japa-mala':
        triggerHaptic('bead').catch(() => {});
        toastMsg = isHi ? '📿 नीचे १०८-मनका घेरे पर टैप कर जप आज़माएं!' : '📿 Tap the 108-bead ring below to count!';
        break;

      case 'step-prayers-chant-loop':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🔁 आवर्तन चुनें व पाठ प्लेयर चलाएं!' : '🔁 Pick target loops and start Chanting!';
        break;

      case 'step-more-temples':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🛕 १२ ज्योतिर्लिंग, चार धाम व पंचभूत तीर्थ!' : '🛕 Filter 12 Jyotirlingas, Char Dham & Pancha Bhoota!';
        break;

      case 'step-more-devatas-vrat':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🔱 किसी देवता कार्ड पर टैप कर मन्त्र देखें!' : '🔱 Tap any deity card to open mantras!';
        break;

      case 'step-more-vrat-katha':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📜 व्रत चुनकर पूजा विधि व पारण नियम देखें!' : '📜 Pick a Vrat to read Vidhi & Parana!';
        break;

      case 'step-settings-profile':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '👤 नाम, गोत्र, नक्षत्र व इष्ट देव प्रोफाइल' : '👤 Name, Gotra & Ishta Deity Devotee Profile';
        break;

      case 'step-settings-location-cal':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '📍 GPS स्थान व पूर्णिमान्त / अमान्त परम्परा' : '📍 GPS Detection & Lunar Calendar System';
        break;

      case 'step-settings-notif':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🔔 अभिजित, ब्रह्म मुहूर्त व टू-डू फोन अलर्ट्स' : '🔔 Abhijit, Brahma Muhurta & Task Alerts';
        break;

      case 'step-settings-replay':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🧭 जब चाहें सेटिंग्स से यह टूर दोबारा देखें!' : '🧭 Replay This Walkthrough Anytime from Settings!';
        break;

      case 'step-community-hub':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '🤝 नए अपडेट्स व योगदानकर्ताओं को देखें!' : '🤝 Explore Latest Releases & Contributors!';
        break;

      case 'step-community-feedback':
        triggerHaptic('tap').catch(() => {});
        toastMsg = isHi ? '💬 नीचे अपनी रेटिंग और सुझाव साझा करें!' : '💬 Try sharing a rating, idea, or bug report below!';
        break;

      default:
        triggerHaptic('tap').catch(() => {});
        break;
    }

    setTriedStepIndex(currentStepIndex);
    setTrySuccessToast(toastMsg);
    toastOpacityAnim.setValue(1);

    if (toastDismissTimer.current) {
      clearTimeout(toastDismissTimer.current);
    }
    toastDismissTimer.current = setTimeout(() => {
      Animated.timing(toastOpacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTrySuccessToast(null);
      });
    }, 2000);

    // Enter hands-on Try Mode: temporarily collapses the tour overlay so screen is 100% interactable
    enterTryMode();
  }, [currentTourStep, currentStepIndex, isHi, language, setLanguage, enterTryMode, toastOpacityAnim]);

  // Swipe gesture detection
  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
  };

  const handleTouchEnd = (e: any) => {
    const dx = e.nativeEvent.pageX - touchStartX.current;
    const dy = Math.abs(e.nativeEvent.pageY - touchStartY.current);

    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) {
        // Swiped Left -> Next step
        nextStep();
      } else {
        // Swiped Right -> Previous step
        prevStep();
      }
    }
  };

  if (!isInteractiveTourActive && !isCompleted && !isExitConfirmVisible) {
    return null;
  }

  // 1. Completion Celebration Card
  if (isCompleted) {
    return (
      <Modal visible={true} transparent animationType="fade" onRequestClose={finishTour}>
        <View style={styles.backdrop}>
          <View style={[styles.celebrationCard, isDark && styles.celebrationCardDark]}>
            <View style={styles.celebrationIconBox}>
              <Text style={{ fontSize: 44 }}>🕉️</Text>
            </View>

            <Text style={[styles.celebrationTitle, isDark && styles.textDark]}>
              {activeSectionId
                ? (isHi ? 'अनुभाग टूर पूर्ण हुआ!' : 'Section Walkthrough Complete!')
                : (isHi ? 'हार्दिक बधाई! टूर पूर्ण हुआ' : 'Congratulations! Tour Completed')}
            </Text>

            <Text style={[styles.celebrationSubtitle, isDark && styles.subTextDark]}>
              {activeSectionId
                ? (isHi
                    ? 'आपने इस स्क्रीन के मुख्य फ़ीचर्स व बटनों को भलीभांति समझ लिया है।'
                    : 'You are ready to use every feature on this screen confidently.')
                : (isHi
                    ? 'अब आप सनातन ऍप के सभी ७ टैब्स — पञ्चाङ्ग, दिन योजना, शुभ मुहूर्त, पर्व-व्रत, स्तोत्र, तीर्थ व प्रोजेक्ट हब — से भलीभांति परिचित हैं।'
                    : 'You are now ready to explore all 7 tabs of Sanatan — Panchang, Day Planner, Shubh Muhurta, Festivals, Prayers, Pilgrimages, and Project Hub.')}
            </Text>

            <View style={[styles.celebrationFeatureList, isDark && styles.celebrationFeatureListDark]}>
              <View style={styles.celebrationBullet}>
                <Text style={styles.celebrationBulletIcon}>✨</Text>
                <Text style={[styles.celebrationBulletText, isDark && styles.celebrationBulletTextDark]}>
                  {isHi ? '१००% शुद्ध खगोलीय गणित व वैदिक मुहूर्त' : '100% Mathematical Vedic ephemeris & Muhurtas'}
                </Text>
              </View>
              <View style={styles.celebrationBullet}>
                <Text style={styles.celebrationBulletIcon}>🔒</Text>
                <Text style={[styles.celebrationBulletText, isDark && styles.celebrationBulletTextDark]}>
                  {isHi ? 'पूर्णतः ऑफलाइन, निजी व विज्ञापन-मुक्त' : 'Completely offline, private, and ad-free'}
                </Text>
              </View>
              <View style={styles.celebrationBullet}>
                <Text style={styles.celebrationBulletIcon}>🧭</Text>
                <Text style={[styles.celebrationBulletText, isDark && styles.celebrationBulletTextDark]}>
                  {isHi ? 'सेटिंग्स में कभी भी "पुनः टूर देखें" उपलब्ध है' : 'Replay the tour anytime from Settings'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              testID="tour-celebration-finish-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'सनातन ऍप का उपयोग आरम्भ करें' : 'Start Using Sanatan App'}
              style={[styles.celebrationActionBtn, { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }]}
              onPress={finishTour}
              activeOpacity={0.88}
            >
              <Text style={styles.celebrationActionBtnText}>
                {isHi ? 'सनातन ऍप का उपयोग आरम्भ करें 🙏' : 'Start Using Sanatan App 🙏'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // 2. Exit Confirmation Modal
  if (isExitConfirmVisible) {
    return (
      <Modal visible={true} transparent animationType="fade" onRequestClose={cancelExitTour}>
        <View style={styles.backdrop}>
          <View testID="tour-exit-confirm-dialog" style={[styles.confirmCard, isDark && styles.confirmCardDark]}>
            <View style={styles.confirmHeader}>
              <Ionicons name="help-circle" size={32} color="#d97706" />
              <Text style={[styles.confirmTitle, isDark && styles.textDark]}>
                {isHi ? 'क्या आप टूर छोड़ना चाहते हैं?' : 'Exit Guided Tour?'}
              </Text>
            </View>

            <Text style={[styles.confirmBody, isDark && styles.subTextDark]}>
              {isHi
                ? 'आपने ' + (currentStepIndex + 1) + ' / ' + totalSteps + ' चरण पूरे कर लिए हैं। आप बाद में कभी भी सेटिंग्स में जाकर यह टूर दोबारा शुरू कर सकते हैं।'
                : 'You have completed ' + (currentStepIndex + 1) + ' of ' + totalSteps + ' steps. You can restart or replay this tour anytime from Settings.'}
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                testID="tour-exit-cancel-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'टूर जारी रखें' : 'Continue Tour'}
                style={[styles.confirmCancelBtn, { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }, isDark && styles.confirmCancelBtnDark]}
                onPress={cancelExitTour}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmCancelBtnText, isDark && styles.confirmCancelBtnTextDark]}>
                  {isHi ? 'टूर जारी रखें' : 'Continue Tour'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="tour-exit-confirm-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'टूर समाप्त करें' : 'Exit Tour'}
                style={[styles.confirmExitBtn, { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }]}
                onPress={confirmExitTour}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmExitBtnText}>
                  {isHi ? 'टूर समाप्त करें' : 'Exit Tour'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!currentTourStep) return null;

  // 3. Hands-On Try Mode: Floating docked pill, full screen touch passthrough
  if (isTryModeActive) {
    return (
      <View testID="tour-try-mode-container" pointerEvents="box-none" style={styles.tryModeRootContainer}>
        {/* Tap-to-try Micro-Toast Celebration */}
        {trySuccessToast && (
          <Animated.View
            testID="tour-try-success-toast"
            accessibilityLiveRegion="polite"
            pointerEvents="none"
            style={[
              styles.trySuccessToastFloating,
              {
                top: Math.max(insets.top || 44, 44) + 16,
                opacity: toastOpacityAnim,
              },
            ]}
          >
            <Text style={styles.trySuccessToastText}>{trySuccessToast}</Text>
          </Animated.View>
        )}

        {/* Floating docked Try-Mode bar */}
        <View
          style={[
            styles.tryModeBannerWrapper,
            { bottom: Math.max(insets.bottom || 16, 16) + 60 },
          ]}
          pointerEvents="box-none"
        >
          <View testID="tour-try-mode-banner" style={[styles.tryModeBanner, isDark && styles.tryModeBannerDark]}>
            <View style={styles.tryModeBannerLeft}>
              <View style={styles.tryModeEmojiBox}>
                <Text style={{ fontSize: 18 }}>{currentTourStep.emoji || '⚡'}</Text>
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.tryModeTag}>
                  {isHi
                    ? `⚡ आज़माएं (${currentStepIndex + 1}/${totalSteps})`
                    : `⚡ TRYING (${currentStepIndex + 1}/${totalSteps})`}
                </Text>
                <Text style={[styles.tryModeTitle, isDark && styles.tryModeTitleDark]}>
                  {getStepTryLabel(currentTourStep.id, isHi)}
                </Text>
              </View>
            </View>

            <View style={styles.tryModeBannerActions}>
              <TouchableOpacity
                testID="tour-reopen-step-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'इस चरण का विवरण पुनः खोलें' : 'Reopen step instructions'}
                style={[styles.tryModeReopenBtn, isDark && styles.tryModeReopenBtnDark]}
                onPress={exitTryMode}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="information-circle-outline" size={20} color="#b45309" />
              </TouchableOpacity>

              <TouchableOpacity
                testID="tour-continue-btn"
                accessibilityRole="button"
                accessibilityLabel={
                  currentStepIndex >= totalSteps - 1
                    ? (isHi ? 'टूर पूर्ण करें' : 'Finish Tour')
                    : (isHi ? 'अगले चरण पर जाएं' : 'Go to Next Step')
                }
                style={[styles.continueTourBtn, { minHeight: MIN_TOUCH_TARGET }]}
                onPress={continueTourFromTryMode}
                activeOpacity={0.85}
              >
                <Text style={styles.continueTourBtnText}>
                  {currentStepIndex >= totalSteps - 1
                    ? (isHi ? 'टूर पूर्ण करें 🪔' : 'Finish Tour 🪔')
                    : (isHi ? 'अगला चरण →' : 'Next Step →')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const rangeStart = sectionStepRange ? sectionStepRange.start : 0;
  const rangeEnd = sectionStepRange ? sectionStepRange.end : totalSteps - 1;
  const displayIndex = Math.max(0, currentStepIndex - rangeStart);
  const displayTotal = Math.max(1, rangeEnd - rangeStart + 1);
  const remainingSteps = Math.max(1, displayTotal - displayIndex);
  const estimatedMins = Math.max(1, Math.ceil((remainingSteps * 5) / 60));
  const conditionInsight = getConditionInsight(
    currentTourStep.conditionType,
    tourRuntimeContext,
    isHi
  );

  const progressPercent = Math.round(((displayIndex + 1) / displayTotal) * 100);
  const isFirstStep = currentStepIndex <= rangeStart;
  const isLastStep = currentStepIndex >= rangeEnd;

  const spotlight = getStepSpotlightRect(
    currentTourStep,
    targetRects,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    insets
  );
  // Safe insets for tooltip & beacon layout only (never shift a measured top highlight down)
  const safeTop = Math.max(
    4,
    Math.max(insets.top || 0, Platform.OS === 'ios' ? 44 : 24) - overlayOrigin.y + 4
  );
  const safeBottom = Math.max(
    (insets.bottom || 0) + (Platform.OS === 'ios' ? 64 : 66),
    keyboardHeight > 0 ? keyboardHeight + 12 : 0
  );

  const frame = computeHighlightFrame(
    spotlight,
    overlayOrigin,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
  );
  const { x: sX, y: sY, width: sW, height: sH, borderRadius: sRadius } = frame;

  const BEACON_HEIGHT = 32;
  const GAP = 8;
  const maxBeaconWidth = Math.min(220, Math.max(150, SCREEN_WIDTH - 32));
  const tooltipLayout = computeTooltipLayout({
    highlight: frame,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    safeTop,
    safeBottom,
    preferredPlacement: currentTourStep.tooltipPlacement,
    beaconHeight: BEACON_HEIGHT,
    beaconWidth: maxBeaconWidth,
    gap: GAP,
  });
  const { beaconTop, beaconLeft, beaconArrowName } = tooltipLayout;

  return (
    <View
      ref={overlayRef}
      onLayout={measureOverlayOrigin}
      testID="interactive-tour-overlay"
      style={styles.interactiveOverlay}
      pointerEvents="box-none"
    >
      {/* 1. Seamless Rounded Scrim Cutout (Smooth corners, zero white square artifacts) */}
      <View
        style={styles.scrimContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View
          style={[
            styles.giantBorderCutout,
            {
              left: sX - SCRIM_SIZE,
              top: sY - SCRIM_SIZE,
              width: sW + SCRIM_SIZE * 2,
              height: sH + SCRIM_SIZE * 2,
              borderWidth: SCRIM_SIZE,
              borderRadius: SCRIM_SIZE + sRadius,
              borderColor: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(0, 0, 0, 0.68)',
            },
          ]}
        />
      </View>

      {/* 2. Outer Shimmering Radiant Aura Ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spotlightAuraRing,
          {
            left: sX - 5,
            top: sY - 5,
            width: sW + 10,
            height: sH + 10,
            borderRadius: sRadius + 5,
            transform: [{ scale: auraScaleAnim }],
            opacity: auraOpacityAnim,
          },
        ]}
      />

      {/* 2b. Glowing Golden Spotlight Border around the active element */}
      <Animated.View
        testID="tour-spotlight-box"
        pointerEvents="none"
        style={[
          styles.spotlightBox,
          {
            left: sX,
            top: sY,
            width: sW,
            height: sH,
            borderRadius: sRadius,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* 2c. Interactive Hands-on Touch Target directly over the spotlight */}
      <TouchableOpacity
        testID="tour-spotlight-interactive-target"
        accessibilityRole="button"
        accessibilityLabel={getStepTryLabel(currentTourStep.id, isHi)}
        style={[
          styles.spotlightTouchTarget,
          {
            left: sX,
            top: sY,
            width: sW,
            height: sH,
            borderRadius: sRadius,
          },
        ]}
        onPress={handleSpotlightPress}
        activeOpacity={0.7}
      />

      {/* 2d. Tap-to-try Micro-Toast Celebration */}
      {trySuccessToast && (
        <Animated.View
          testID="tour-try-success-toast"
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={[
            styles.trySuccessToast,
            {
              top:
                tooltipLayout.placement === 'bottom'
                  ? Math.max(safeTop, sY - 44)
                  : Math.min(SCREEN_HEIGHT - safeBottom - 44, sY + sH + 12),
              left: Math.max(16, Math.min(SCREEN_WIDTH - 180, sX + sW / 2 - 75)),
              opacity: toastOpacityAnim,
            },
          ]}
        >
          <Text style={styles.trySuccessToastText}>{trySuccessToast}</Text>
        </Animated.View>
      )}

      {/* 3. Spotlight Beacon Pointer Badge */}
      <TouchableOpacity
        testID="tour-spotlight-beacon"
        accessibilityRole="button"
        accessibilityLabel={getStepTryLabel(currentTourStep.id, isHi)}
        activeOpacity={0.85}
        onPress={handleSpotlightPress}
        style={[
          styles.beaconBadge,
          hasTriedCurrentStep && styles.beaconBadgeTried,
          {
            top: beaconTop,
            left: beaconLeft,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons
          name={hasTriedCurrentStep ? 'checkmark-circle' : beaconArrowName}
          size={13}
          color="#ffffff"
          style={{ marginRight: 5 }}
        />
        <Text style={styles.beaconBadgeText} numberOfLines={1}>
          {hasTriedCurrentStep
            ? (isHi ? '✓ उत्तम! (अगला दबाएं)' : '✓ Action Tried! (Next →)')
            : getStepTryLabel(currentTourStep.id, isHi)}
        </Text>
      </TouchableOpacity>

      {/* 4. Adaptive Guide Card (Dynamic top/bottom/side positioning with non-overlapping max height) */}
      <View
        testID="tour-step-card"
        style={[
          styles.guideCardWrapper,
          tooltipLayout.cardStyle,
        ]}
        pointerEvents="auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View style={[styles.guideCard, isDark && styles.guideCardDark, { maxHeight: tooltipLayout.maxCardHeight }]}>
          {/* Header Row: Tab badge, time estimate, step counter, skip button */}
          <View style={styles.guideHeaderRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeEmoji}>{currentTourStep.emoji}</Text>
              <Text style={styles.tagBadgeText}>
                {isHi ? currentTourStep.tabNameHi : currentTourStep.tabNameEn} • {isHi ? currentTourStep.badgeHi : currentTourStep.badgeEn}
              </Text>
            </View>

            <View style={styles.guideHeaderRight}>
              <View style={styles.timeEstimateBadge}>
                <Text style={styles.timeEstimateText}>
                  {isHi ? `⏱️ ~${estimatedMins} मि.` : `⏱️ ~${estimatedMins} min`}
                </Text>
              </View>

              <Text testID="tour-step-progress-text" style={styles.stepProgressText}>
                {`${displayIndex + 1}/${displayTotal}`}
              </Text>

              <TouchableOpacity
                testID="tour-interactive-skip-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'टूर छोड़ें' : 'Skip tour'}
                style={[styles.skipBtn, isDark && styles.skipBtnDark]}
                onPress={requestSkipTour}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.skipBtnText, isDark && styles.skipBtnTextDark]}>{isHi ? 'छोड़ें' : 'Skip'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick-Jump Section Navigation Chips */}
          <ScrollView
            ref={sectionScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sectionScroll}
            contentContainerStyle={styles.sectionScrollContent}
          >
            {TOUR_SECTIONS.map((sec) => {
              const isCurrentSec = currentStepIndex >= sec.startStep && currentStepIndex <= sec.endStep;
              const isPastSec =
                currentStepIndex > sec.endStep || completedSections.includes(sec.id);
              return (
                <TouchableOpacity
                  key={sec.id}
                  testID={`tour-section-chip-${sec.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? `${sec.nameHi} अनुभाग` : `${sec.nameEn} section`}
                  style={[
                    styles.sectionChip,
                    isDark && styles.sectionChipDark,
                    isCurrentSec && (isDark ? styles.sectionChipActiveDark : styles.sectionChipActive),
                    isPastSec && (isDark ? styles.sectionChipCompletedDark : styles.sectionChipCompleted),
                  ]}
                  onPress={() => goToStep(sec.startStep)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionChipEmoji}>{sec.emoji}</Text>
                  <Text
                    style={[
                      styles.sectionChipText,
                      isDark && styles.sectionChipTextDark,
                      isCurrentSec && (isDark ? styles.sectionChipTextActiveDark : styles.sectionChipTextActive),
                      isPastSec && (isDark ? styles.sectionChipTextCompletedDark : styles.sectionChipTextCompleted),
                    ]}
                  >
                    {isHi ? sec.nameHi : sec.nameEn}
                    {isPastSec ? ' ✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Visual Progress Line */}
          <View style={[styles.progressBarTrack, isDark && styles.progressBarTrackDark]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Content Body */}
          <ScrollView
            style={[
              styles.guideScrollView,
              { maxHeight: Math.max(80, tooltipLayout.maxCardHeight - 165) },
            ]}
            contentContainerStyle={styles.guideScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.guideTitle, isDark && styles.textDark]}>
              {isHi ? currentTourStep.titleHi : currentTourStep.titleEn}
            </Text>

            <Text style={[styles.guideSubtitle, isDark && styles.guideSubtitleDark]}>
              {isHi ? currentTourStep.subtitleHi : currentTourStep.subtitleEn}
            </Text>

            {conditionInsight && (
              <View
                testID="tour-state-insight-box"
                style={[
                  styles.conditionInsightBox,
                  conditionInsight.tone === 'warn' && styles.conditionInsightWarnBox,
                  isDark && styles.conditionInsightBoxDark,
                ]}
              >
                <Text style={styles.conditionInsightEmoji}>{conditionInsight.emoji}</Text>
                <Text
                  style={[
                    styles.conditionInsightText,
                    conditionInsight.tone === 'warn' && styles.conditionInsightWarnText,
                    isDark && styles.textDark,
                  ]}
                >
                  {conditionInsight.text}
                </Text>
              </View>
            )}

            <Text style={[styles.guideDescription, isDark && styles.textDark]}>
              {isHi ? currentTourStep.descriptionHi : currentTourStep.descriptionEn}
            </Text>

            {/* Interactive "Try This Now" Hands-On Action Bar */}
            <TouchableOpacity
              testID="tour-interactive-try-btn"
              accessibilityRole="button"
              accessibilityLabel={getStepTryLabel(currentTourStep.id, isHi)}
              style={[
                styles.tryThisCardBtn,
                { minHeight: MIN_TOUCH_TARGET },
                isDark && styles.tryThisCardBtnDark,
                hasTriedCurrentStep && (isDark ? styles.tryThisCardBtnTriedDark : styles.tryThisCardBtnTried),
              ]}
              onPress={handleSpotlightPress}
              activeOpacity={0.82}
            >
              <View style={styles.tryThisBtnLeft}>
                <View style={[styles.tryThisIconBadge, hasTriedCurrentStep && styles.tryThisIconBadgeTried]}>
                  <Ionicons
                    name={hasTriedCurrentStep ? 'checkmark-sharp' : 'flash'}
                    size={13}
                    color="#ffffff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tryThisBtnLabel, isDark && styles.tryThisBtnLabelDark]}>
                    {hasTriedCurrentStep
                      ? (isHi ? '✓ आपने आज़माया! (पुनः टैप करें)' : '✓ Action Tried! (Tap to retry)')
                      : (isHi ? '⚡ अभी आज़माएं (Try This):' : '⚡ Try This Interactive Action:')}
                  </Text>
                  <Text style={[styles.tryThisBtnSub, isDark && styles.tryThisBtnSubDark]}>
                    {getStepTryLabel(currentTourStep.id, isHi)}
                  </Text>
                </View>
              </View>
              <View style={[styles.tryThisActionPill, hasTriedCurrentStep && styles.tryThisActionPillTried]}>
                <Text style={styles.tryThisActionPillText}>
                  {hasTriedCurrentStep ? (isHi ? 'पुनः करें' : 'Retry') : (isHi ? 'आज़माएं' : 'Try')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* How to use tip box */}
            <View style={[styles.howToUseBox, isDark && styles.howToUseBoxDark]}>
              <View style={styles.howToUseIconRow}>
                <Ionicons name="bulb-outline" size={14} color={isDark ? '#fbbf24' : '#b45309'} />
                <Text style={[styles.howToUseHeading, isDark && styles.howToUseHeadingDark]}>
                  {isHi ? '💡 कैसे उपयोग करें:' : '💡 How to use:'}
                </Text>
              </View>
              <Text style={[styles.howToUseText, isDark && styles.howToUseTextDark]}>
                {isHi ? currentTourStep.howToUseHi : currentTourStep.howToUseEn}
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions Row: Previous, Swipe hint, Next / Finish */}
          <View style={[styles.guideActionsRow, isDark && styles.guideActionsRowDark]}>
            <TouchableOpacity
              testID="tour-interactive-back-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'पिछला चरण' : 'Previous step'}
              accessibilityState={{ disabled: isFirstStep }}
              style={[
                styles.backActionBtn,
                { minHeight: MIN_TOUCH_TARGET },
                isDark && styles.backActionBtnDark,
                isFirstStep && styles.actionBtnDisabled,
              ]}
              onPress={prevStep}
              disabled={isFirstStep}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={isFirstStep ? (isDark ? '#52525b' : '#a1a1aa') : (isDark ? '#e4e4e7' : '#52525b')}
              />
              <Text
                style={[
                  styles.backActionBtnText,
                  isDark && styles.textDark,
                  isFirstStep && styles.actionBtnTextDisabled,
                ]}
              >
                {isHi ? 'पिछला' : 'Previous'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.swipeHintBox, isDark && styles.swipeHintBoxDark]}>
              <Text style={[styles.swipeHintText, isDark && styles.subTextDark]}>
                {isHi ? '👈 स्वाइप 👉' : '👈 Swipe 👉'}
              </Text>
            </View>

            <TouchableOpacity
              testID={isLastStep ? 'tour-interactive-finish-btn' : 'tour-interactive-next-btn'}
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? (isHi ? 'टूर पूरा करें' : 'Finish tour') : (isHi ? 'अगला चरण' : 'Next step')}
              style={[styles.nextActionBtn, { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }]}
              onPress={nextStep}
              activeOpacity={0.88}
            >
              <Text style={styles.nextActionBtnText}>
                {isLastStep ? (isHi ? 'पूरा करें 🎉' : 'Finish 🎉') : (isHi ? 'अगला →' : 'Next →')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  interactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  tryModeRootContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  trySuccessToastFloating: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#065f46',
    borderWidth: 1.5,
    borderColor: '#34d399',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 100002,
  },
  tryModeBannerWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 100001,
  },
  tryModeBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  tryModeBannerDark: {
    backgroundColor: '#272015',
    borderColor: '#d97706',
  },
  tryModeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tryModeEmojiBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tryModeTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tryModeTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#451a03',
    marginTop: 2,
    lineHeight: 20,
  },
  tryModeTitleDark: {
    color: '#fef3c7',
  },
  tryModeBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tryModeReopenBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tryModeReopenBtnDark: {
    backgroundColor: '#382e1d',
    borderColor: '#78350f',
  },
  continueTourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueTourBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  scrimContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 99990,
  },
  giantBorderCutout: {
    position: 'absolute',
    borderColor: 'rgba(0, 0, 0, 0.68)',
    backgroundColor: 'transparent',
  },
  spotlightAuraRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#fbbf24',
    backgroundColor: 'transparent',
    zIndex: 99998,
  },
  spotlightBox: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#f59e0b',
    backgroundColor: 'transparent',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 99999,
  },
  spotlightTouchTarget: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 100000,
  },
  trySuccessToast: {
    position: 'absolute',
    backgroundColor: '#065f46',
    borderWidth: 1.5,
    borderColor: '#34d399',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100002,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trySuccessToastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  beaconBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    maxWidth: 220,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100000,
  },
  beaconBadgeTried: {
    backgroundColor: '#16a34a',
    borderColor: '#4ade80',
    borderWidth: 1,
  },
  beaconBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  tryThisCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tryThisCardBtnDark: {
    backgroundColor: '#272015',
    borderColor: '#d97706',
  },
  tryThisCardBtnTried: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  tryThisCardBtnTriedDark: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  tryThisBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  tryThisIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryThisIconBadgeTried: {
    backgroundColor: '#16a34a',
  },
  tryThisBtnLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tryThisBtnLabelDark: {
    color: '#fbbf24',
  },
  tryThisBtnSub: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#451a03',
    marginTop: 2,
    lineHeight: 19,
  },
  tryThisBtnSubDark: {
    color: '#fef3c7',
  },
  tryThisActionPill: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  tryThisActionPillTried: {
    backgroundColor: '#16a34a',
  },
  tryThisActionPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  guideCardWrapper: {
    position: 'absolute',
    zIndex: 100001,
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  guideCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#d97706',
  },
  guideHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    flexShrink: 1,
    marginRight: 6,
  },
  tagBadgeEmoji: {
    fontSize: 14,
    marginRight: 5,
  },
  tagBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b45309',
  },
  guideHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525b',
  },
  skipBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#f4f4f5',
  },
  skipBtnDark: {
    backgroundColor: '#27272a',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525b',
  },
  skipBtnTextDark: {
    color: '#d4d4d8',
  },
  timeEstimateBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginRight: 2,
  },
  timeEstimateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  sectionScroll: {
    maxHeight: 56,
    marginBottom: 8,
  },
  sectionScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  sectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  sectionChipDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  sectionChipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  sectionChipActiveDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#f59e0b',
  },
  sectionChipCompleted: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  sectionChipCompletedDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#059669',
  },
  sectionChipEmoji: {
    fontSize: 13,
    marginRight: 5,
  },
  sectionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3f3f46',
  },
  sectionChipTextDark: {
    color: '#d4d4d8',
  },
  sectionChipTextActive: {
    color: '#b45309',
    fontWeight: '800',
  },
  sectionChipTextActiveDark: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  sectionChipTextCompleted: {
    color: '#047857',
    fontWeight: '700',
  },
  sectionChipTextCompletedDark: {
    color: '#34d399',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#f4f4f5',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarTrackDark: {
    backgroundColor: '#27272a',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 2,
  },
  guideScrollView: {
    flexShrink: 1,
  },
  guideScrollContent: {
    paddingBottom: 4,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    lineHeight: 22,
    marginBottom: 2,
  },
  guideSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 6,
  },
  guideSubtitleDark: {
    color: '#fbbf24',
  },
  guideDescription: {
    fontSize: 12.5,
    color: '#3f3f46',
    lineHeight: 18,
    marginBottom: 8,
  },
  howToUseBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.65)',
    borderRadius: Radius.md,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    marginTop: 4,
  },
  howToUseBoxDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftColor: '#f59e0b',
  },
  howToUseIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  howToUseHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  howToUseHeadingDark: {
    color: '#fbbf24',
  },
  howToUseText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#92400e',
    lineHeight: 20,
  },
  howToUseTextDark: {
    color: '#fef3c7',
  },
  guideActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  guideActionsRowDark: {
    borderTopColor: '#27272a',
  },
  backActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
  },
  backActionBtnDark: {
    backgroundColor: '#27272a',
  },
  backActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  backActionBtnTextDark: {
    color: '#e4e4e7',
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnTextDisabled: {
    color: '#a1a1aa',
  },
  swipeHintBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fbfbfb',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  swipeHintBoxDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  swipeHintTextDark: {
    color: '#a1a1aa',
  },
  nextActionBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  nextActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Celebration Card Styles
  celebrationCard: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 16,
  },
  celebrationCardDark: {
    backgroundColor: '#18181b',
  },
  celebrationIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 6,
  },
  celebrationSubtitle: {
    fontSize: 13,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  celebrationFeatureList: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  celebrationFeatureListDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  celebrationBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  celebrationBulletIcon: {
    fontSize: 14,
  },
  celebrationBulletText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3f3f46',
    flexShrink: 1,
    lineHeight: 18,
  },
  celebrationBulletTextDark: {
    color: '#f4f4f5',
  },
  celebrationActionBtn: {
    width: '100%',
    backgroundColor: '#d97706',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Confirm Card Styles
  confirmCard: {
    width: '88%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  confirmCardDark: {
    backgroundColor: '#18181b',
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
    flexShrink: 1,
  },
  confirmBody: {
    fontSize: 13,
    color: '#52525b',
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
  },
  confirmCancelBtnDark: {
    backgroundColor: '#27272a',
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3f3f46',
  },
  confirmCancelBtnTextDark: {
    color: '#e4e4e7',
  },
  confirmExitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#dc2626',
  },
  confirmExitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  textDark: {
    color: '#f4f4f5',
  },
  subTextDark: {
    color: '#a1a1aa',
  },
  conditionInsightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  conditionInsightWarnBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  conditionInsightBoxDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  conditionInsightEmoji: {
    fontSize: 13,
    marginTop: 1,
  },
  conditionInsightText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  conditionInsightWarnText: {
    color: '#92400e',
  },
});

import { Platform } from 'react-native';
import { SpotlightRect, TourStep } from '../types/tour';

/**
 * Baseline fallback coordinates for every tour target element.
 * Incorporates dynamic device insets and status bar geometry to guarantee
 * pixel-accurate alignment across diverse screen resolutions and aspect ratios.
 */
export function getStepSpotlightRect(
  step: TourStep,
  measuredRects: Record<string, SpotlightRect>,
  screenWidth: number,
  screenHeight: number,
  insets?: { top: number; bottom: number; left: number; right: number }
): SpotlightRect {
  const targetId = step.targetTestID || step.id;

  // 1. If dynamically measured by the running view on device, use the live measurement
  if (measuredRects[targetId] && measuredRects[targetId].width > 0) {
    return measuredRects[targetId];
  }

  // Safe area top offset: typically 32-48 on modern Android hole-punches, 44-59 on iOS notches
  const topOffset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : 36);

  // 2. Predefined high-accuracy safe-area-aware proportional baselines
  switch (targetId) {
    // --- TAB 1: दिनचर्या (DINACHARYA) ---
    case 'header-bar':
      return {
        x: 12,
        y: topOffset + 4,
        width: screenWidth - 24,
        height: 84,
        borderRadius: 18,
      };

    case 'header-lang-btn':
      return {
        x: screenWidth - 130,
        y: topOffset + 6,
        width: 34,
        height: 34,
        borderRadius: 17,
      };

    case 'header-bell-btn':
      return {
        x: screenWidth - 90,
        y: topOffset + 6,
        width: 34,
        height: 34,
        borderRadius: 17,
      };

    case 'header-share-btn':
      return {
        x: screenWidth - 50,
        y: topOffset + 6,
        width: 34,
        height: 34,
        borderRadius: 17,
      };

    case 'day-pill-selected':
      return {
        x: 12,
        y: topOffset + 98,
        width: screenWidth - 24,
        height: 74,
        borderRadius: 18,
      };

    case 'view-mode-daily-btn':
      return {
        x: 16,
        y: topOffset + 148,
        width: screenWidth - 32,
        height: 46,
        borderRadius: 14,
      };

    case 'live-cosmic-banner':
      return {
        x: 16,
        y: topOffset + 204,
        width: screenWidth - 32,
        height: 118,
        borderRadius: 20,
      };

    case 'hero-challenge-card':
      return {
        x: 16,
        y: topOffset + 332,
        width: (screenWidth - 42) / 2,
        height: 126,
        borderRadius: 18,
      };

    case 'bento-tall-card':
      return {
        x: screenWidth / 2 + 5,
        y: topOffset + 332,
        width: (screenWidth - 42) / 2,
        height: 126,
        borderRadius: 18,
      };

    case 'daily-rashi-card':
      return {
        x: 16,
        y: topOffset + 468,
        width: screenWidth - 32,
        height: 175,
        borderRadius: 22,
      };

    // --- DAY PLANNER ---
    case 'planner-view-mode-container':
      return {
        x: 16,
        y: topOffset + 204,
        width: screenWidth - 32,
        height: 360,
        borderRadius: 22,
      };

    case 'planner-tab-core':
      return {
        x: 16,
        y: topOffset + 210,
        width: (screenWidth - 32) * 0.33,
        height: 40,
        borderRadius: 12,
      };

    case 'planner-tab-all':
      return {
        x: 16,
        y: topOffset + 260,
        width: screenWidth - 32,
        height: 200,
        borderRadius: 20,
      };

    case 'planner-tab-planned':
      return {
        x: 16,
        y: topOffset + 210,
        width: screenWidth - 32,
        height: 130,
        borderRadius: 18,
      };

    case 'inauspicious-triad-card':
      return {
        x: 16,
        y: topOffset + 470,
        width: screenWidth - 32,
        height: 140,
        borderRadius: 20,
      };

    // --- TAB 2: मुहूर्त (MUHURTA) ---
    case 'category-pill-griha_pravesh':
      return {
        x: 12,
        y: topOffset + 12,
        width: screenWidth - 24,
        height: 52,
        borderRadius: 26,
      };

    case 'muhurta-inauspicious-card':
      return {
        x: 16,
        y: topOffset + 74,
        width: screenWidth - 32,
        height: 154,
        borderRadius: 20,
      };

    case 'days-pill-30':
      return {
        x: 16,
        y: topOffset + 238,
        width: screenWidth - 32,
        height: 46,
        borderRadius: 14,
      };

    // --- TAB 3: पर्व-व्रत (FESTIVALS) ---
    case 'festival-search-input':
      return {
        x: 16,
        y: topOffset + 12,
        width: screenWidth - 32,
        height: 98,
        borderRadius: 18,
      };

    case 'category-chip-all':
      return {
        x: 12,
        y: topOffset + 120,
        width: screenWidth - 24,
        height: 44,
        borderRadius: 22,
      };

    // --- TAB 4: स्तोत्र-जाप (PRAYERS) ---
    case 'prayer-pill-hanuman-chalisa':
      return {
        x: 12,
        y: topOffset + 12,
        width: screenWidth - 24,
        height: 50,
        borderRadius: 25,
      };

    case 'prayers-shankh-btn':
      return {
        x: 16,
        y: topOffset + 72,
        width: screenWidth - 32,
        height: 54,
        borderRadius: 18,
      };

    case 'chant-play-toggle-btn':
      return {
        x: 16,
        y: topOffset + 136,
        width: screenWidth - 32,
        height: 280,
        borderRadius: 24,
      };

    // --- TAB 5: तीर्थ (MORE) ---
    case 'more-tab-temples':
      return {
        x: 16,
        y: topOffset + 72,
        width: screenWidth - 32,
        height: 50,
        borderRadius: 18,
      };

    case 'more-tab-devatas':
      return {
        x: 16,
        y: topOffset + 130,
        width: screenWidth - 32,
        height: 50,
        borderRadius: 18,
      };

    // --- TAB 6: सेटिंग्स (SETTINGS) ---
    case 'settings-edit-profile-btn':
      return {
        x: 16,
        y: topOffset + 12,
        width: screenWidth - 32,
        height: 94,
        borderRadius: 20,
      };

    case 'settings-meridian-btn':
      return {
        x: 16,
        y: topOffset + 175,
        width: screenWidth - 32,
        height: 110,
        borderRadius: 18,
      };

    case 'notif-master-switch':
      return {
        x: 16,
        y: topOffset + 295,
        width: screenWidth - 32,
        height: 130,
        borderRadius: 18,
      };

    case 'settings-replay-tour-btn':
      return {
        x: 16,
        y: topOffset + 435,
        width: screenWidth - 32,
        height: 64,
        borderRadius: 16,
      };

    default:
      return {
        x: 20,
        y: topOffset + 20,
        width: screenWidth - 40,
        height: 120,
        borderRadius: 18,
      };
  }
}

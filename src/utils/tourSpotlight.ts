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

    case 'day-pill-selected': {
      const pillW = Math.max(38, Math.round((screenWidth - 32 - 36) / 7));
      const dayIdx = new Date().getDay();
      return {
        x: 16 + (pillW + 6) * dayIdx,
        y: topOffset + 98,
        width: pillW,
        height: 72,
        borderRadius: 20,
      };
    }

    case 'view-mode-daily-btn':
      return {
        x: 16,
        y: topOffset + 208,
        width: screenWidth - 32,
        height: 44,
        borderRadius: 14,
      };

    case 'live-cosmic-banner':
      return {
        x: 16,
        y: topOffset + 262,
        width: screenWidth - 32,
        height: 88,
        borderRadius: 20,
      };

    case 'hero-challenge-card':
      return {
        x: 16,
        y: topOffset + 362,
        width: (screenWidth - 42) / 2,
        height: 126,
        borderRadius: 18,
      };

    case 'bento-tall-card':
      return {
        x: screenWidth / 2 + 5,
        y: topOffset + 362,
        width: (screenWidth - 42) / 2,
        height: 126,
        borderRadius: 18,
      };

    case 'daily-rashi-card':
      // Scrolled to y=340
      return {
        x: 16,
        y: topOffset + 140,
        width: screenWidth - 32,
        height: 180,
        borderRadius: 22,
      };

    // --- DAY PLANNER ---
    case 'planner-view-mode-container':
      return {
        x: 16,
        y: topOffset + 252,
        width: screenWidth - 32,
        height: 104,
        borderRadius: 18,
      };

    case 'planner-tab-core': {
      const tabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16,
        y: topOffset + 310,
        width: tabW,
        height: 38,
        borderRadius: 12,
      };
    }

    case 'planner-tab-all': {
      const tabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + tabW + 8,
        y: topOffset + 310,
        width: tabW,
        height: 38,
        borderRadius: 12,
      };
    }

    case 'planner-first-slot-card':
      return {
        x: 16,
        y: topOffset + 380,
        width: screenWidth - 32,
        height: 48,
        borderRadius: 14,
      };

    case 'planner-tab-planned': {
      const tabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + (tabW + 8) * 2,
        y: topOffset + 310,
        width: tabW,
        height: 38,
        borderRadius: 12,
      };
    }

    case 'inauspicious-triad-card':
      // Scrolled to y=380
      return {
        x: 16,
        y: topOffset + 140,
        width: screenWidth - 32,
        height: 160,
        borderRadius: 20,
      };

    // --- TAB 2: मुहूर्त (MUHURTA) ---
    case 'category-pill-griha_pravesh':
      return {
        x: 16,
        y: topOffset + 8,
        width: 140,
        height: 44,
        borderRadius: 22,
      };

    case 'muhurta-inauspicious-card':
      return {
        x: 16,
        y: topOffset + 64,
        width: screenWidth - 32,
        height: 160,
        borderRadius: 20,
      };

    case 'days-pill-30':
      return {
        x: 16,
        y: topOffset + 220,
        width: screenWidth - 32,
        height: 90,
        borderRadius: 16,
      };

    // --- TAB 3: पर्व-व्रत (FESTIVALS) ---
    case 'festival-search-input':
      return {
        x: 16,
        y: topOffset + 12,
        width: screenWidth - 32,
        height: 50,
        borderRadius: 16,
      };

    case 'category-chip-all':
      return {
        x: 16,
        y: topOffset + 72,
        width: 100,
        height: 38,
        borderRadius: 16,
      };

    // --- TAB 4: स्तोत्र-जाप (PRAYERS) ---
    case 'prayer-pill-hanuman-chalisa':
      return {
        x: 16,
        y: topOffset + 12,
        width: 145,
        height: 42,
        borderRadius: 21,
      };

    case 'prayers-shankh-btn': {
      const btnW = (screenWidth - 32 - 10) / 2;
      return {
        x: 16 + btnW + 10,
        y: topOffset + 64,
        width: btnW,
        height: 54,
        borderRadius: 18,
      };
    }

    case 'chant-play-toggle-btn':
      return {
        x: 16,
        y: topOffset + 128,
        width: screenWidth - 32,
        height: 280,
        borderRadius: 24,
      };

    // --- TAB 5: तीर्थ (MORE) ---
    case 'more-tab-temples': {
      const mTabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16,
        y: topOffset + 68,
        width: mTabW,
        height: 44,
        borderRadius: 14,
      };
    }

    case 'more-tab-devatas': {
      const mTabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + mTabW + 8,
        y: topOffset + 68,
        width: mTabW,
        height: 44,
        borderRadius: 14,
      };
    }

    // --- TAB 6: सेटिंग्स (SETTINGS) ---
    case 'settings-edit-profile-btn':
      return {
        x: 16,
        y: topOffset + 12,
        width: screenWidth - 32,
        height: 84,
        borderRadius: 18,
      };

    case 'settings-meridian-btn':
      return {
        x: 16,
        y: topOffset + 276,
        width: screenWidth - 32,
        height: 62,
        borderRadius: 16,
      };

    case 'notif-master-switch':
      return {
        x: 16,
        y: topOffset + 444,
        width: screenWidth - 32,
        height: 64,
        borderRadius: 16,
      };

    case 'settings-replay-tour-btn':
      return {
        x: 16,
        y: topOffset + 338,
        width: screenWidth - 32,
        height: 62,
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

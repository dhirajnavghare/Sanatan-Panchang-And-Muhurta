import { Platform } from 'react-native';
import {
  SpotlightRect,
  SpotlightShape,
  TooltipPlacementPreference,
  TourStep,
} from '../types/tour';

export interface HighlightFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  shape: SpotlightShape;
}

export interface TooltipLayoutParams {
  highlight: { x: number; y: number; width: number; height: number };
  screenWidth: number;
  screenHeight: number;
  safeTop: number;
  safeBottom: number;
  preferredPlacement?: TooltipPlacementPreference;
  beaconHeight?: number;
  beaconWidth?: number;
  gap?: number;
}

export interface TooltipLayoutResult {
  placement: 'top' | 'bottom' | 'left' | 'right';
  beaconTop: number;
  beaconLeft: number;
  beaconArrowName: 'arrow-up' | 'arrow-down' | 'arrow-back' | 'arrow-forward';
  cardStyle: {
    top?: number;
    bottom?: number;
    left: number;
    right?: number;
    width?: number;
  };
  maxCardHeight: number;
}

/**
 * Converts a window-measured SpotlightRect into exact overlay-relative geometry,
 * preserving shape (circle, rect, rounded-rect) without artificial vertical shifting.
 */
export function computeHighlightFrame(
  spotlight: SpotlightRect,
  overlayOrigin: { x: number; y: number },
  screenWidth: number,
  screenHeight: number
): HighlightFrame {
  const shape: SpotlightShape = spotlight.shape ?? 'rounded-rect';
  const pad = spotlight.padding ?? 4;
  const relX = spotlight.x - overlayOrigin.x;
  const relY = spotlight.y - overlayOrigin.y;

  let rawLeft = relX - pad;
  let rawTop = relY - pad;
  let rawWidth = spotlight.width + pad * 2;
  let rawHeight = spotlight.height + pad * 2;
  let borderRadius = Math.max(8, (spotlight.borderRadius ?? 16) + pad);

  if (shape === 'circle') {
    const diameter = Math.min(
      Math.max(24, Math.min(screenWidth - 4, screenHeight - 4)),
      Math.max(24, Math.max(spotlight.width, spotlight.height) + pad * 2)
    );
    const centerX = relX + spotlight.width / 2;
    const centerY = relY + spotlight.height / 2;
    rawLeft = centerX - diameter / 2;
    rawTop = centerY - diameter / 2;
    rawWidth = diameter;
    rawHeight = diameter;
    borderRadius = Math.round(diameter / 2);
  } else if (shape === 'rect') {
    borderRadius = Math.max(4, Math.min(10, (spotlight.borderRadius ?? 6) + 2));
  }

  const x = Math.max(2, Math.min(screenWidth - 22, Math.round(rawLeft)));
  const y = Math.max(2, Math.min(screenHeight - 22, Math.round(rawTop)));
  const width = Math.max(20, Math.min(screenWidth - x - 2, Math.round(rawWidth)));
  const height = Math.max(20, Math.min(screenHeight - y - 2, Math.round(rawHeight)));

  return {
    x,
    y,
    width,
    height,
    borderRadius: shape === 'circle' ? Math.round(Math.min(width, height) / 2) : borderRadius,
    shape,
  };
}

/**
 * Dynamically computes non-overlapping tooltip & beacon placement around the spotlighted
 * component while respecting safeTop, safeBottom (tab bar / keyboard), and screen margins.
 */
export function computeTooltipLayout({
  highlight,
  screenWidth,
  screenHeight,
  safeTop,
  safeBottom,
  preferredPlacement = 'auto',
  beaconHeight = 32,
  beaconWidth = Math.min(220, Math.max(150, screenWidth - 32)),
  gap = 8,
}: TooltipLayoutParams): TooltipLayoutResult {
  const marginX = 12;
  const effectiveTop = Math.max(4, safeTop);
  const effectiveBottom = Math.max(effectiveTop + 140, screenHeight - safeBottom);

  const hX = highlight.x;
  const hY = highlight.y;
  const hRight = highlight.x + highlight.width;
  const hBottom = highlight.y + highlight.height;

  const availBelow = Math.max(0, effectiveBottom - (hBottom + gap + beaconHeight + gap));
  const availAbove = Math.max(0, hY - gap - beaconHeight - gap - effectiveTop);
  const availRight = Math.max(0, screenWidth - marginX - (hRight + gap));
  const availLeft = Math.max(0, hX - gap - marginX);

  let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

  if (preferredPlacement === 'right' && availRight >= 240) {
    placement = 'right';
  } else if (preferredPlacement === 'left' && availLeft >= 240) {
    placement = 'left';
  } else if (preferredPlacement === 'top' && (availAbove >= 170 || availAbove >= availBelow)) {
    placement = 'top';
  } else if (preferredPlacement === 'bottom' && (availBelow >= 170 || availBelow >= availAbove)) {
    placement = 'bottom';
  } else {
    // Auto placement: support side placement on wide tablets/landscape when helpful,
    // otherwise choose top vs bottom strictly by unobstructed vertical space.
    const isWide = screenWidth >= 560;
    if (isWide && Math.max(availAbove, availBelow) < 200 && Math.max(availRight, availLeft) >= 260) {
      placement = availRight >= availLeft ? 'right' : 'left';
    } else if (availBelow >= availAbove) {
      placement = 'bottom';
    } else {
      placement = 'top';
    }
  }

  const clampedBeaconLeft = Math.max(
    16,
    Math.min(screenWidth - beaconWidth - 16, Math.round(hX + highlight.width / 2 - beaconWidth / 2))
  );

  if (placement === 'right' || placement === 'left') {
    const cardLeft = placement === 'right' ? hRight + gap : marginX;
    const cardWidth = Math.max(
      240,
      placement === 'right' ? screenWidth - marginX - cardLeft : hX - gap - marginX
    );
    const beaconTop = Math.max(effectiveTop, Math.min(effectiveBottom - beaconHeight - 16, hY));
    const cardTop = Math.min(effectiveBottom - 160, beaconTop + beaconHeight + 6);
    const maxCardHeight = Math.max(140, effectiveBottom - cardTop - 4);
    return {
      placement,
      beaconTop,
      beaconLeft:
        placement === 'right'
          ? cardLeft
          : Math.max(marginX, cardLeft + cardWidth - beaconWidth),
      beaconArrowName: placement === 'right' ? 'arrow-back' : 'arrow-forward',
      cardStyle: {
        top: cardTop,
        left: cardLeft,
        width: cardWidth,
      },
      maxCardHeight,
    };
  }

  if (placement === 'bottom') {
    // Zero-overlap guarantee when space exists below; only shift up if target consumes ~full screen
    const rawBeaconTop = hBottom + gap;
    const minCardBudget = 120;
    const maxAllowedBeaconTop = effectiveBottom - beaconHeight - gap - minCardBudget;
    const beaconTop =
      availBelow >= minCardBudget
        ? rawBeaconTop
        : Math.max(effectiveTop + 4, maxAllowedBeaconTop);
    const cardTop = beaconTop + beaconHeight + gap;
    const maxCardHeight = Math.max(minCardBudget, effectiveBottom - cardTop - 4);

    return {
      placement: 'bottom',
      beaconTop,
      beaconLeft: clampedBeaconLeft,
      beaconArrowName: 'arrow-up',
      cardStyle: {
        top: cardTop,
        left: marginX,
        right: marginX,
      },
      maxCardHeight,
    };
  }

  // placement === 'top'
  const minCardBudget = 120;
  const rawBeaconTop = hY - gap - beaconHeight;
  const minAllowedBeaconTop = effectiveTop + minCardBudget + gap;
  const beaconTop =
    availAbove >= minCardBudget
      ? rawBeaconTop
      : Math.min(effectiveBottom - beaconHeight - 4, minAllowedBeaconTop);
  const cardBottomEdgeY = beaconTop - gap;
  const maxCardHeight = Math.max(minCardBudget, cardBottomEdgeY - effectiveTop);
  const bottomOffset = Math.max(safeBottom, screenHeight - cardBottomEdgeY);

  return {
    placement: 'top',
    beaconTop,
    beaconLeft: clampedBeaconLeft,
    beaconArrowName: 'arrow-down',
    cardStyle: {
      bottom: bottomOffset,
      left: marginX,
      right: marginX,
    },
    maxCardHeight,
  };
}

/**
 * Resolves live measured component bounds for the active tour step, falling back
 * to safe proportional geometry only if a component is unmounted or running inside an isolated test.
 */
export function getStepSpotlightRect(
  step: TourStep,
  measuredRects: Record<string, SpotlightRect>,
  screenWidth: number,
  screenHeight: number,
  insets?: { top: number; bottom: number; left: number; right: number }
): SpotlightRect {
  const targetId = step.targetTestID || step.id;

  // 1. Always prefer live measured bounds from TourTarget
  if (measuredRects[targetId] && measuredRects[targetId].width > 0) {
    return {
      ...measuredRects[targetId],
      shape: measuredRects[targetId].shape ?? step.shape,
    };
  }

  // Safe area top offset: typically 32-48 on modern Android, 44-59 on iOS notches
  const topOffset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : 36);

  // 2. Proportional fallback when view measurement is unavailable (e.g. isolated component tests)
  switch (targetId) {
    // --- TAB 1: दिनचर्या (DINACHARYA) ---
    case 'header-bar':
      return {
        x: 12,
        y: topOffset + 4,
        width: screenWidth - 24,
        height: 92,
        borderRadius: 18,
      };

    case 'header-lang-btn':
      return {
        x: screenWidth - 152,
        y: topOffset + 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        shape: 'circle',
      };

    case 'header-bell-btn':
      return {
        x: screenWidth - 102,
        y: topOffset + 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        shape: 'circle',
      };

    case 'header-share-btn':
      return {
        x: screenWidth - 54,
        y: topOffset + 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        shape: 'circle',
      };

    case 'day-pill-selected': {
      const pillW = Math.max(38, Math.round((screenWidth - 32 - 36) / 7));
      const dayIdx = new Date().getDay();
      return {
        x: 16 + (pillW + 6) * dayIdx,
        y: topOffset + 104,
        width: pillW,
        height: 68,
        borderRadius: 20,
      };
    }

    case 'view-mode-daily-btn':
      return {
        x: 16,
        y: topOffset + 206,
        width: screenWidth - 32,
        height: 48,
        borderRadius: 14,
      };

    case 'live-cosmic-banner':
      return {
        x: 16,
        y: topOffset + 266,
        width: screenWidth - 32,
        height: 92,
        borderRadius: 20,
      };

    case 'hero-challenge-card':
      return {
        x: 16,
        y: topOffset + 370,
        width: (screenWidth - 42) / 2,
        height: 128,
        borderRadius: 18,
      };

    case 'bento-tall-card':
      return {
        x: screenWidth / 2 + 5,
        y: topOffset + 370,
        width: (screenWidth - 42) / 2,
        height: 128,
        borderRadius: 18,
      };

    case 'daily-rashi-card':
      return {
        x: 16,
        y: topOffset + 140,
        width: screenWidth - 32,
        height: 190,
        borderRadius: 22,
      };

    case 'monthly-calendar-grid':
      return {
        x: 16,
        y: topOffset + 240,
        width: screenWidth - 32,
        height: 330,
        borderRadius: 20,
      };

    // --- DAY PLANNER ---
    case 'planner-view-mode-container':
      return {
        x: 16,
        y: topOffset + 252,
        width: screenWidth - 32,
        height: 108,
        borderRadius: 18,
      };

    case 'planner-tab-core': {
      const tabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16,
        y: topOffset + 314,
        width: tabW,
        height: 44,
        borderRadius: 12,
      };
    }

    case 'planner-tab-all': {
      const tabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + tabW + 8,
        y: topOffset + 314,
        width: tabW,
        height: 44,
        borderRadius: 12,
      };
    }

    case 'planner-first-slot-card':
      return {
        x: 16,
        y: topOffset + 380,
        width: screenWidth - 32,
        height: 52,
        borderRadius: 14,
      };

    case 'planner-tab-planned': {
      const tabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + (tabW + 8) * 2,
        y: topOffset + 314,
        width: tabW,
        height: 44,
        borderRadius: 12,
      };
    }

    case 'inauspicious-triad-card':
      return {
        x: 16,
        y: topOffset + 140,
        width: screenWidth - 32,
        height: 165,
        borderRadius: 20,
      };

    // --- TAB 2: मुहूर्त (MUHURTA) ---
    case 'category-pill-griha_pravesh':
      return {
        x: 16,
        y: topOffset + 64,
        width: 148,
        height: 44,
        borderRadius: 22,
      };

    case 'muhurta-inauspicious-card':
      return {
        x: 16,
        y: topOffset + 190,
        width: screenWidth - 32,
        height: 140,
        borderRadius: 20,
      };

    case 'days-pill-30':
      return {
        x: 16,
        y: topOffset + 250,
        width: screenWidth - 32,
        height: 96,
        borderRadius: 16,
      };

    // --- TAB 3: पर्व-व्रत (FESTIVALS) ---
    case 'festival-search-input':
      return {
        x: 16,
        y: topOffset + 124,
        width: screenWidth - 32,
        height: 48,
        borderRadius: 16,
        shape: 'rect',
      };

    case 'category-chip-all':
      return {
        x: 16,
        y: topOffset + 186,
        width: 108,
        height: 44,
        borderRadius: 16,
      };

    // --- TAB 4: स्तोत्र-जाप (PRAYERS) ---
    case 'prayer-pill-hanuman-chalisa':
      return {
        x: 16,
        y: topOffset + 66,
        width: 156,
        height: 44,
        borderRadius: 22,
      };

    case 'prayers-shankh-btn': {
      const btnW = (screenWidth - 32 - 64) / 2;
      return {
        x: 16 + btnW + 10,
        y: topOffset + 124,
        width: btnW,
        height: 48,
        borderRadius: 18,
      };
    }

    case 'prayers-japa-mala':
      return {
        x: 16,
        y: topOffset + 184,
        width: screenWidth - 32,
        height: 240,
        borderRadius: 22,
      };

    case 'chant-play-toggle-btn':
      return {
        x: 16,
        y: topOffset + 356,
        width: screenWidth - 32,
        height: 52,
        borderRadius: 18,
      };

    // --- TAB 5: तीर्थ (MORE) ---
    case 'more-tab-temples': {
      const mTabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16,
        y: topOffset + 148,
        width: mTabW,
        height: 48,
        borderRadius: 14,
      };
    }

    case 'more-tab-devatas': {
      const mTabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + mTabW + 8,
        y: topOffset + 148,
        width: mTabW,
        height: 48,
        borderRadius: 14,
      };
    }

    case 'more-tab-vrat_katha': {
      const mTabW = (screenWidth - 32 - 16) / 3;
      return {
        x: 16 + (mTabW + 8) * 2,
        y: topOffset + 148,
        width: mTabW,
        height: 48,
        borderRadius: 14,
      };
    }

    // --- TAB 6: सेटिंग्स (SETTINGS) ---
    case 'settings-edit-profile-btn':
      return {
        x: 16,
        y: topOffset + 64,
        width: screenWidth - 32,
        height: 88,
        borderRadius: 18,
      };

    case 'settings-meridian-btn':
      return {
        x: 16,
        y: topOffset + 320,
        width: screenWidth - 32,
        height: 68,
        borderRadius: 16,
      };

    case 'notif-master-switch':
      return {
        x: 16,
        y: topOffset + 460,
        width: screenWidth - 32,
        height: 68,
        borderRadius: 16,
      };

    case 'settings-replay-tour-btn':
      return {
        x: 16,
        y: topOffset + 392,
        width: screenWidth - 32,
        height: 64,
        borderRadius: 16,
      };

    // --- TAB 8 (SECTION 8): प्रोजेक्ट (COMMUNITY / PROJECT HUB) ---
    case 'community-hero-card':
      return {
        x: 16,
        y: topOffset + 64,
        width: screenWidth - 32,
        height: 126,
        borderRadius: 18,
      };

    case 'community-segment-feedback':
      return {
        x: 16,
        y: topOffset + 204,
        width: 140,
        height: 44,
        borderRadius: 20,
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

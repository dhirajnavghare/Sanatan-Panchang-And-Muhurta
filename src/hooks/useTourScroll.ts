import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '../services/appTourContext';
import { SpotlightRect, TourTabRoute } from '../types/tour';

interface ScrollableContainer {
  scrollTo?: (options: { y?: number; x?: number; animated?: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
}

/**
 * Coordinates vertical ScrollView / FlatList scrolling, tab focus notification,
 * and post-scroll re-measurement with the interactive tour overlay.
 */
export function useTourScroll<T extends ScrollableContainer>(
  tabRoute: TourTabRoute,
  scrollRef: React.RefObject<T | null>
) {
  const {
    registerScrollContainer,
    requestActiveTargetMeasure,
    notifyTabFocused,
  } = useTour();
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollYRef = useRef(0);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectingPostScrollMeasureRef = useRef(false);

  const flushPostScrollMeasure = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (expectingPostScrollMeasureRef.current) {
      expectingPostScrollMeasureRef.current = false;
      requestAnimationFrame(() => {
        requestActiveTargetMeasure(tabRoute, false);
      });
    }
  }, [requestActiveTargetMeasure, tabRoute]);

  const scheduleSettleMeasure = useCallback(
    (delayMs = 90) => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = setTimeout(flushPostScrollMeasure, delayMs);
    },
    [flushPostScrollMeasure]
  );

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  // Re-measure immediately whenever tab screen gains navigation focus during active tour
  useFocusEffect(
    useCallback(() => {
      notifyTabFocused(tabRoute);
    }, [notifyTabFocused, tabRoute])
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nativeEvent = event.nativeEvent;
      scrollYRef.current = nativeEvent.contentOffset.y;
      if (nativeEvent.contentSize?.height) {
        contentHeightRef.current = nativeEvent.contentSize.height;
      }
      if (nativeEvent.layoutMeasurement?.height) {
        viewportHeightRef.current = nativeEvent.layoutMeasurement.height;
      }
      if (expectingPostScrollMeasureRef.current) {
        scheduleSettleMeasure(60);
      }
    },
    [scheduleSettleMeasure]
  );

  useEffect(() => {
    return registerScrollContainer(tabRoute, (rect: SpotlightRect) => {
      const node = scrollRef.current;
      if (!node) return false;

      const topSafe =
        tabRoute === '/(tabs)'
          ? Math.max((insets.top || 0) + 6, Platform.OS === 'ios' ? 48 : 32)
          : Math.max((insets.top || 0) + 52, 84);
      const bottomChrome = (insets.bottom || 0) + (Platform.OS === 'ios' ? 66 : 68);
      // Reserve comfortable space below or above so target & tooltip fit without colliding
      const minTooltipReserve = Math.max(220, Math.round(winHeight * 0.3));
      const safeBottom = Math.max(
        topSafe + 120,
        Math.min(winHeight - bottomChrome - minTooltipReserve, Math.round(winHeight * 0.62))
      );

      const isAlreadyVisible =
        rect.y >= topSafe &&
        (rect.y + rect.height <= safeBottom ||
          (rect.height > safeBottom - topSafe && rect.y <= topSafe + 24));

      if (isAlreadyVisible) {
        return false;
      }

      const maxScrollableHeight = Math.max(0, winHeight - bottomChrome - topSafe);
      const desiredY =
        rect.height > maxScrollableHeight * 0.45
          ? topSafe + 8
          : Math.max(topSafe + 10, Math.round(winHeight * 0.2));

      const rawOffset = Math.round(scrollYRef.current + (rect.y - desiredY));
      const maxScrollY =
        contentHeightRef.current > 0 && viewportHeightRef.current > 0
          ? Math.max(0, contentHeightRef.current - viewportHeightRef.current)
          : Number.POSITIVE_INFINITY;
      const nextOffset = Math.min(maxScrollY, Math.max(0, rawOffset));

      if (Math.abs(nextOffset - scrollYRef.current) < 4) {
        return false;
      }

      expectingPostScrollMeasureRef.current = true;

      if ('scrollTo' in node && typeof node.scrollTo === 'function') {
        node.scrollTo({ y: nextOffset, animated: true });
      } else if ('scrollToOffset' in node && typeof node.scrollToOffset === 'function') {
        node.scrollToOffset({ offset: nextOffset, animated: true });
      }
      scrollYRef.current = nextOffset;
      scheduleSettleMeasure(280);
      return true;
    });
  }, [tabRoute, scrollRef, registerScrollContainer, winHeight, insets.top, insets.bottom, scheduleSettleMeasure]);

  return {
    onScroll,
    onMomentumScrollEnd: flushPostScrollMeasure,
    onScrollEndDrag: flushPostScrollMeasure,
    scrollYRef,
  };
}

/**
 * Coordinates horizontal ScrollView / FlatList strips (e.g. category chips, segment tabs)
 * so horizontally clipped tour targets automatically scroll into full horizontal view.
 */
export function useTourHorizontalScroll<T extends ScrollableContainer>(
  tabRoute: TourTabRoute,
  scrollRef: React.RefObject<T | null>,
  targetIds?: readonly string[]
) {
  const {
    registerScrollContainer,
    requestActiveTargetMeasure,
  } = useTour();
  const { width: winWidth } = useWindowDimensions();
  const scrollXRef = useRef(0);
  const contentWidthRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectingPostScrollMeasureRef = useRef(false);
  const targetIdsRef = useRef(targetIds);

  useLayoutEffect(() => {
    targetIdsRef.current = targetIds;
  }, [targetIds]);

  const flushHorizontalMeasure = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (expectingPostScrollMeasureRef.current) {
      expectingPostScrollMeasureRef.current = false;
      requestAnimationFrame(() => requestActiveTargetMeasure(tabRoute, false));
    }
  }, [requestActiveTargetMeasure, tabRoute]);

  const scheduleHorizontalSettle = useCallback(
    (delayMs = 90) => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = setTimeout(flushHorizontalMeasure, delayMs);
    },
    [flushHorizontalMeasure]
  );

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const onHorizontalScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollXRef.current = event.nativeEvent.contentOffset.x;
      if (event.nativeEvent.contentSize?.width) {
        contentWidthRef.current = event.nativeEvent.contentSize.width;
      }
      if (expectingPostScrollMeasureRef.current) {
        scheduleHorizontalSettle(60);
      }
    },
    [scheduleHorizontalSettle]
  );

  useEffect(() => {
    return registerScrollContainer(tabRoute, (rect: SpotlightRect) => {
      const node = scrollRef.current;
      if (!node) return false;

      const allowList = targetIdsRef.current;
      if (allowList && allowList.length > 0) {
        if (!rect.targetId || !allowList.includes(rect.targetId)) {
          return false;
        }
      }

      if (rect.width >= winWidth * 0.78) {
        return false;
      }

      const margin = 8;
      const clippedLeft = rect.x < margin;
      const clippedRight = rect.x + rect.width > winWidth - margin;

      if (!clippedLeft && !clippedRight) {
        return false;
      }

      const rawX = Math.round(scrollXRef.current + (rect.x - 24));
      const maxX =
        contentWidthRef.current > winWidth
          ? Math.max(0, contentWidthRef.current - winWidth)
          : Number.POSITIVE_INFINITY;
      const nextX = Math.min(maxX, Math.max(0, rawX));

      if (Math.abs(nextX - scrollXRef.current) < 4) {
        return false;
      }

      expectingPostScrollMeasureRef.current = true;

      if ('scrollTo' in node && typeof node.scrollTo === 'function') {
        node.scrollTo({ x: nextX, animated: true });
      } else if ('scrollToOffset' in node && typeof node.scrollToOffset === 'function') {
        node.scrollToOffset({ offset: nextX, animated: true });
      }
      scrollXRef.current = nextX;
      scheduleHorizontalSettle(240);

      return true;
    });
  }, [
    tabRoute,
    scrollRef,
    registerScrollContainer,
    winWidth,
    scheduleHorizontalSettle,
  ]);

  return {
    onHorizontalScroll,
    onHorizontalMomentumScrollEnd: flushHorizontalMeasure,
    onHorizontalScrollEndDrag: flushHorizontalMeasure,
    scrollXRef,
  };
}

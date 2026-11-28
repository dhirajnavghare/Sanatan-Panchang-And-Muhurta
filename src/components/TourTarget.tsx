import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  useWindowDimensions,
} from 'react-native';
import { useTour } from '../services/appTourContext';
import {
  SpotlightRect,
  SpotlightShape,
  TooltipPlacementPreference,
  TourTabRoute,
} from '../types/tour';

interface TourTargetProps {
  targetId: string;
  tab?: TourTabRoute;
  borderRadius?: number;
  shape?: SpotlightShape;
  padding?: number;
  tooltipPlacement?: TooltipPlacementPreference;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * High-precision dynamic measurement wrapper for tour target elements.
 * - Registers live component references with TourProvider and cleans up on unmount.
 * - Zero layout/measurement overhead when tour is inactive or when target is not active.
 * - Measures window-relative coordinates via measureInWindow on mount, focus, layout,
 *   orientation/font changes, and after parent scroll settles.
 */
export const TourTarget: React.FC<TourTargetProps> = ({
  targetId,
  tab,
  borderRadius = 16,
  shape = 'rounded-rect',
  padding,
  tooltipPlacement,
  style,
  children,
}) => {
  const {
    registerTargetRect,
    unregisterTargetRect,
    registerTarget,
    hasRegisteredTarget,
    ensureTargetVisible,
    isInteractiveTourActive,
    isTryModeActive,
    currentTourStep,
  } = useTour();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const viewRef = useRef<React.ElementRef<typeof View>>(null);
  const lastRect = useRef<SpotlightRect | null>(null);
  const hasRequestedScrollRef = useRef(false);
  const isMountedRef = useRef(true);

  const isCurrentActiveTarget =
    isInteractiveTourActive &&
    !isTryModeActive &&
    (currentTourStep?.targetTestID === targetId || currentTourStep?.id === targetId);

  const activeRef = useRef(isCurrentActiveTarget);
  useEffect(() => {
    activeRef.current = isCurrentActiveTarget;
  }, [isCurrentActiveTarget]);

  const measure = useCallback(
    (allowScrollAdjust = false) => {
      if (!isMountedRef.current || !activeRef.current) return;
      const node = viewRef.current as unknown as {
        measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void;
      } | null;

      if (!node || typeof node.measureInWindow !== 'function') return;

      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (!isMountedRef.current || !activeRef.current) return;
        if (!(width > 0 && height > 0) || !Number.isFinite(x) || !Number.isFinite(y)) {
          return;
        }

        const effectiveShape = currentTourStep?.shape ?? shape;
        const resolvedRadius =
          effectiveShape === 'circle'
            ? Math.ceil(Math.max(width, height) / 2)
            : borderRadius;

        const newRect: SpotlightRect = {
          x,
          y,
          width,
          height,
          borderRadius: resolvedRadius,
          shape: effectiveShape,
          padding,
          isMeasured: true,
          targetId,
        };

        const prev = lastRect.current;
        if (
          !prev ||
          Math.abs(prev.x - x) > 0.5 ||
          Math.abs(prev.y - y) > 0.5 ||
          Math.abs(prev.width - width) > 0.5 ||
          Math.abs(prev.height - height) > 0.5 ||
          prev.borderRadius !== resolvedRadius ||
          prev.shape !== effectiveShape
        ) {
          lastRect.current = newRect;
          registerTargetRect(targetId, newRect);
        }

        const route = currentTourStep?.tab ?? tab;
        if (!allowScrollAdjust) {
          hasRequestedScrollRef.current = false;
        } else if (!hasRequestedScrollRef.current && route) {
          const didScroll = ensureTargetVisible(route, newRect);
          if (didScroll) {
            hasRequestedScrollRef.current = true;
          }
        }
      });
    },
    [
      targetId,
      tab,
      borderRadius,
      shape,
      padding,
      registerTargetRect,
      ensureTargetVisible,
      currentTourStep,
    ]
  );

  // Register target in central registry for on-demand measurement & clean unmount removal
  useEffect(() => {
    isMountedRef.current = true;
    const unregister = registerTarget({
      targetId,
      tab,
      measureNow: measure,
      shape,
      borderRadius,
      tooltipPlacement,
      isVisible: true,
    });

    return () => {
      isMountedRef.current = false;
      unregister();
      lastRect.current = null;
      if (!hasRegisteredTarget(targetId)) {
        unregisterTargetRect(targetId);
      }
    };
  }, [
    targetId,
    tab,
    measure,
    shape,
    borderRadius,
    tooltipPlacement,
    registerTarget,
    hasRegisteredTarget,
    unregisterTargetRect,
  ]);

  // Synchronized measurement when this target becomes active or viewport changes
  useEffect(() => {
    if (!isCurrentActiveTarget) {
      hasRequestedScrollRef.current = false;
      return;
    }

    lastRect.current = null;
    hasRequestedScrollRef.current = false;

    measure(true);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      measure(true);
      r2 = requestAnimationFrame(() => {
        measure(true);
      });
    });

    return () => {
      cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
    };
  }, [isCurrentActiveTarget, currentTourStep?.id, winWidth, winHeight, measure]);

  // Re-measure immediately when layout shifts on an actively spotlighted component
  const handleLayout = useCallback(() => {
    if (activeRef.current) {
      measure(true);
    }
  }, [measure]);

  return (
    <View
      ref={viewRef}
      collapsable={false}
      onLayout={handleLayout}
      style={style}
    >
      {children}
    </View>
  );
};

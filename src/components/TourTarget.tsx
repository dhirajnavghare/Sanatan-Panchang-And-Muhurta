import React, { useRef, useEffect, useCallback } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTour } from '../services/appTourContext';
import { SpotlightRect } from '../types/tour';

interface TourTargetProps {
  targetId: string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * High-precision dynamic measurement wrapper for tour target elements.
 * Measures exact device window coordinates via measureInWindow, eliminating
 * resolution, font-scaling, and status-bar offset discrepancies.
 */
export const TourTarget: React.FC<TourTargetProps> = ({
  targetId,
  borderRadius = 16,
  style,
  children,
}) => {
  const { registerTargetRect, isInteractiveTourActive, currentTourStep } = useTour();
  const viewRef = useRef<React.ElementRef<typeof View>>(null);
  const lastRect = useRef<SpotlightRect | null>(null);

  const measure = useCallback(() => {
    if (viewRef.current && typeof (viewRef.current as any).measureInWindow === 'function') {
      (viewRef.current as any).measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            const prev = lastRect.current;
            if (
              !prev ||
              Math.abs(prev.x - x) > 1 ||
              Math.abs(prev.y - y) > 1 ||
              Math.abs(prev.width - width) > 1 ||
              Math.abs(prev.height - height) > 1
            ) {
              const newRect: SpotlightRect = {
                x,
                y,
                width,
                height,
                borderRadius,
              };
              lastRect.current = newRect;
              registerTargetRect(targetId, newRect);
            }
          }
        }
      );
    }
  }, [targetId, borderRadius, registerTargetRect]);

  useEffect(() => {
    if (isInteractiveTourActive) {
      const isCurrent =
        currentTourStep?.targetTestID === targetId || currentTourStep?.id === targetId;

      if (isCurrent) {
        lastRect.current = null;
        measure();
        const r1 = requestAnimationFrame(measure);
        const t1 = setTimeout(measure, 40);
        const t2 = setTimeout(measure, 120);
        const t3 = setTimeout(measure, 240);
        const t4 = setTimeout(measure, 360);
        return () => {
          cancelAnimationFrame(r1);
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    }
  }, [isInteractiveTourActive, currentTourStep, targetId, measure]);

  return (
    <View
      ref={viewRef}
      collapsable={false}
      onLayout={measure}
      style={style}
    >
      {children}
    </View>
  );
};

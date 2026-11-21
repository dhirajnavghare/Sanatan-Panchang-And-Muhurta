import React, { useRef, useEffect, useCallback } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTour } from '../services/appTourContext';

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

  const measure = useCallback(() => {
    if (viewRef.current && 'measureInWindow' in viewRef.current) {
      (viewRef.current as any).measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            registerTargetRect(targetId, {
              x,
              y,
              width,
              height,
              borderRadius,
            });
          }
        }
      );
    }
  }, [targetId, borderRadius, registerTargetRect]);

  useEffect(() => {
    if (isInteractiveTourActive) {
      measure();
      const isCurrent =
        currentTourStep?.targetTestID === targetId || currentTourStep?.id === targetId;
      if (isCurrent) {
        const t1 = setTimeout(measure, 60);
        const t2 = setTimeout(measure, 220);
        const t3 = setTimeout(measure, 450);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      } else {
        const t = setTimeout(measure, 150);
        return () => clearTimeout(t);
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

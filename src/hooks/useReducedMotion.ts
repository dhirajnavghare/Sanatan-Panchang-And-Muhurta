import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS reduced-motion preference so interactive micro-animations degrade gracefully.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (typeof AccessibilityInfo?.isReduceMotionEnabled === 'function') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          if (mounted) setReduceMotion(Boolean(enabled));
        })
        .catch(() => {});
    }

    const sub =
      typeof AccessibilityInfo?.addEventListener === 'function'
        ? AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
            if (mounted) setReduceMotion(Boolean(enabled));
          })
        : null;

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduceMotion;
}

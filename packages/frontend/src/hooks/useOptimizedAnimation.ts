/**
 * Hook to get optimized animation props based on device performance
 */

import { useReducedMotion, useDevicePerformance } from './useReducedMotion';

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string | number[];
  repeat?: number;
  yoyo?: boolean;
}

export function useOptimizedAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const devicePerformance = useDevicePerformance();

  const getAnimationProps = (config: AnimationConfig = {}) => {
    // If user prefers reduced motion, disable animations
    if (prefersReducedMotion) {
      return {
        initial: false,
        animate: false,
        transition: { duration: 0 },
      };
    }

    // Adjust duration based on device performance
    const baseDuration = config.duration || 0.3;
    let optimizedDuration = baseDuration;

    if (devicePerformance === 'low') {
      optimizedDuration = baseDuration * 0.5; // Faster animations on low-end devices
    } else if (devicePerformance === 'medium') {
      optimizedDuration = baseDuration * 0.75;
    }

    return {
      transition: {
        duration: optimizedDuration,
        ease: config.ease || [0.16, 1, 0.3, 1],
      },
    };
  };

  const shouldAnimate = !prefersReducedMotion;

  return {
    getAnimationProps,
    shouldAnimate,
    prefersReducedMotion,
    devicePerformance,
  };
}


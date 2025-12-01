/**
 * Hook to detect if user prefers reduced motion
 * Helps optimize animations for accessibility and performance
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if media query is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect device performance
 * Uses various heuristics to determine if device is low-end
 */
export function useDevicePerformance(): 'high' | 'medium' | 'low' {
  const [performance, setPerformance] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4;
    
    // Check device memory (if available)
    const memory = (navigator as any).deviceMemory || 4;
    
    // Check connection speed (if available)
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';
    
    // Heuristic scoring
    let score = 0;
    
    // CPU cores (more is better)
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else if (cores >= 2) score += 1;
    
    // Memory (more is better)
    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else if (memory >= 2) score += 1;
    
    // Connection (faster is better)
    if (effectiveType === '4g') score += 2;
    else if (effectiveType === '3g') score += 1;
    
    // Determine performance level
    if (score >= 7) setPerformance('high');
    else if (score >= 4) setPerformance('medium');
    else setPerformance('low');
  }, []);

  return performance;
}


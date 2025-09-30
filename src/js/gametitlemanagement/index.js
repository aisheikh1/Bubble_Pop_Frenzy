// src/js/gametitlemanagement/index.js

/**
 * Main entry point for the game title management system
 * Provides a clean, simple API for initializing animated game titles
 */

import { initializeGameTitle } from './animatedTitle.js';
export { getTitleManagerDebugInfo, resetTitleManager } from './titleManager.js';

/**
 * Initialize an animated game title with a randomly selected animation
 * @param {HTMLElement|string} titleElement - DOM element or CSS selector for the title
 * @param {Object} options - Configuration options
 * @param {boolean} options.fallbackOnError - Whether to use fallback on error (default: true)
 * @param {boolean} options.respectReducedMotion - Whether to respect reduced motion preference (default: true)
 * @returns {Function|void} Cleanup function to restore original state, or void if no element found
 * 
 * @example
 * // Basic usage
 * initializeAnimatedTitle('.game-title');
 * 
 * @example
 * // With options
 * initializeAnimatedTitle('#mainTitle', {
 *   fallbackOnError: false,
 *   respectReducedMotion: true
 * });
 */
export function initializeAnimatedTitle(titleElement, options = {}) {
  const {
    fallbackOnError = true,
    respectReducedMotion = true
  } = options;

  // Resolve the title element
  const element = resolveTitleElement(titleElement);
  if (!element) {
    console.warn('Title element not found:', titleElement);
    return;
  }

  // Check for reduced motion preference
  if (respectReducedMotion && shouldReduceMotion()) {
    console.log('Respecting reduced motion preference - using simple animation');
    return applySimpleAnimation(element);
  }

  try {
    // Store original state for potential restoration
    const originalState = {
      innerHTML: element.innerHTML,
      style: element.style.cssText,
      textContent: element.textContent
    };

    // Initialize the animated title
    const cleanupFunction = initializeGameTitle(element);

    // Return enhanced cleanup function that restores original state
    return () => {
      // Call the original cleanup if provided
      if (cleanupFunction && typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
      
      // Restore original state
      restoreElementState(element, originalState);
    };

  } catch (error) {
    console.error('Failed to initialize animated title:', error);
    
    if (fallbackOnError) {
      console.log('Applying fallback animation due to error');
      return applySimpleAnimation(element);
    }
    
    // Re-throw error if fallback is disabled
    throw new Error(`Animated title initialization failed: ${error.message}`);
  }
}

/**
 * Resolve title element from various input types
 * @param {HTMLElement|string} element - Element or selector
 * @returns {HTMLElement|null} Resolved DOM element
 */
function resolveTitleElement(element) {
  if (typeof element === 'string') {
    // CSS selector
    return document.querySelector(element);
  } else if (element instanceof HTMLElement) {
    // Direct DOM element
    return element;
  } else if (element && element.element instanceof HTMLElement) {
    // jQuery-like object or similar
    return element.element;
  }
  
  return null;
}

/**
 * Check if reduced motion is preferred
 * @returns {boolean} True if reduced motion is preferred
 */
function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply a simple, accessible animation as fallback
 * @param {HTMLElement} element - Title element
 * @returns {Function} Cleanup function
 */
function applySimpleAnimation(element) {
  const originalState = {
    innerHTML: element.innerHTML,
    style: element.style.cssText
  };

  // Apply simple fade-in animation
  element.style.opacity = '0';
  element.style.transition = 'opacity 0.5s ease-in';
  
  // Trigger reflow and animate
  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });

  // Return cleanup function
  return () => {
    element.style.cssText = originalState.style;
    element.innerHTML = originalState.innerHTML;
  };
}

/**
 * Restore element to its original state
 * @param {HTMLElement} element - DOM element
 * @param {Object} originalState - Original state data
 */
function restoreElementState(element, originalState) {
  element.innerHTML = originalState.innerHTML;
  element.style.cssText = originalState.style;
  
  // Ensure text content is preserved
  if (originalState.textContent && element.textContent !== originalState.textContent) {
    element.textContent = originalState.textContent;
  }
}

/**
 * Check if the title management system is supported
 * @returns {boolean} True if the system is supported
 */
export function isTitleManagementSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    'querySelector' in document &&
    'style' in Element.prototype &&
    'matchMedia' in window
  );
}

/**
 * Preload title animations (for performance optimization)
 * This can be called during app initialization to warm up the system
 */
export function preloadTitleAnimations() {
  // This is a no-op for now, but could be extended to:
  // - Pre-create CSS stylesheets
  // - Warm up the TitleManager
  // - Preload any required assets
  console.log('Title animation system ready');
}

/**
 * Get system status and capabilities
 * @returns {Object} System status information
 */
export function getTitleSystemStatus() {
  return {
    supported: isTitleManagementSupported(),
    reducedMotion: shouldReduceMotion(),
    performanceTier: getPerformanceTier(),
    debugInfo: getTitleManagerDebugInfo()
  };
}

/**
 * Simple performance tier detection (simplified version)
 * @returns {string} Performance tier
 */
function getPerformanceTier() {
  if (shouldReduceMotion()) return 'low';
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  
  if (isMobile || cores <= 4 || memory <= 4) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'medium';
}

// Auto-initialize support check
if (typeof window !== 'undefined') {
  // Add a CSS class to the document for styling based on support
  if (isTitleManagementSupported()) {
    document.documentElement.classList.add('title-animations-supported');
  } else {
    document.documentElement.classList.add('title-animations-unsupported');
  }
}

export default {
  initializeAnimatedTitle,
  isTitleManagementSupported,
  preloadTitleAnimations,
  getTitleSystemStatus,
  getTitleManagerDebugInfo,
  resetTitleManager
};
// src/js/gametitlemanagement/index.js

/**
 * Main entry point for the game title management system
 */

import { initializeGameTitle } from './animatedTitle.js';
// Remove the problematic export and import directly
import { getTitleManagerDebugInfo as getDebugInfo, resetTitleManager } from './titleManager.js';

// Re-export the functions with proper names
export const getTitleManagerDebugInfo = getDebugInfo;
export { resetTitleManager };

/**
 * Initialize an animated game title with a randomly selected animation
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
      if (cleanupFunction && typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
      restoreElementState(element, originalState);
    };

  } catch (error) {
    console.error('Failed to initialize animated title:', error);
    
    if (fallbackOnError) {
      return applySimpleAnimation(element);
    }
    
    throw new Error(`Animated title initialization failed: ${error.message}`);
  }
}

/**
 * Resolve title element from various input types
 */
function resolveTitleElement(element) {
  if (typeof element === 'string') {
    return document.querySelector(element);
  } else if (element instanceof HTMLElement) {
    return element;
  }
  return null;
}

/**
 * Check if reduced motion is preferred
 */
function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply a simple, accessible animation as fallback
 */
function applySimpleAnimation(element) {
  const originalState = {
    innerHTML: element.innerHTML,
    style: element.style.cssText
  };

  element.style.opacity = '0';
  element.style.transition = 'opacity 0.5s ease-in';
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });

  return () => {
    element.style.cssText = originalState.style;
    element.innerHTML = originalState.innerHTML;
  };
}

/**
 * Restore element to its original state
 */
function restoreElementState(element, originalState) {
  element.innerHTML = originalState.innerHTML;
  element.style.cssText = originalState.style;
  
  if (originalState.textContent && element.textContent !== originalState.textContent) {
    element.textContent = originalState.textContent;
  }
}

/**
 * Check if the title management system is supported
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
 * Preload title animations
 */
export function preloadTitleAnimations() {
  console.log('Title animation system ready');
}

/**
 * Get system status and capabilities
 */
export function getTitleSystemStatus() {
  return {
    supported: isTitleManagementSupported(),
    reducedMotion: shouldReduceMotion(),
    debugInfo: getTitleManagerDebugInfo ? getTitleManagerDebugInfo() : null
  };
}

// Auto-initialize support check
if (typeof window !== 'undefined') {
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
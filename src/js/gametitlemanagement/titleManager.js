// src/js/gametitlemanagement/titleManager.js

/**
 * Manages the selection and persistence of title animations
 */
class TitleManager {
  constructor() {
    this.availableAnimations = [
      'floatingBubbles',
      'popIn', 
      'liquidFill',
      'bubbleGum',
      'scoreCounter',
      'arcadeMarquee',
      'bubbleFloat',
      'gelatinousBounce',
      'neonPulse',
      'waterRipple'
    ];
    
    this.animationWeights = this.calculateWeights();
    this.performanceTier = this.detectPerformanceTier();
    this.seenAnimations = this.loadSeenAnimations();
  }

  /**
   * Calculate weights for random selection based on performance and complexity
   */
  calculateWeights() {
    // Base weights - simpler animations get higher weights
    const baseWeights = {
      // Simple animations (high performance)
      popIn: 0.15,
      gelatinousBounce: 0.14,
      neonPulse: 0.13,
      bubbleFloat: 0.12,
      
      // Medium complexity
      floatingBubbles: 0.11,
      arcadeMarquee: 0.10,
      bubbleGum: 0.09,
      
      // More complex animations
      liquidFill: 0.07,
      waterRipple: 0.06,
      scoreCounter: 0.03  // Most complex - lowest weight
    };

    // Adjust weights based on performance tier
    const tierMultipliers = {
      low: {
        popIn: 1.5,
        gelatinousBounce: 1.4,
        neonPulse: 1.3,
        bubbleFloat: 1.2,
        floatingBubbles: 0.8,
        arcadeMarquee: 0.7,
        bubbleGum: 0.6,
        liquidFill: 0.3,
        waterRipple: 0.2,
        scoreCounter: 0.1
      },
      medium: {
        // Default weights - no adjustment
      },
      high: {
        // Boost complex animations on capable devices
        liquidFill: 1.3,
        waterRipple: 1.4,
        scoreCounter: 1.5,
        floatingBubbles: 1.1
      }
    };

    const multiplier = tierMultipliers[this.performanceTier] || {};
    const adjustedWeights = {};

    for (const [animation, weight] of Object.entries(baseWeights)) {
      adjustedWeights[animation] = weight * (multiplier[animation] || 1);
    }

    return this.normalizeWeights(adjustedWeights);
  }

  /**
   * Normalize weights to sum to 1
   */
  normalizeWeights(weights) {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const normalized = {};
    
    for (const [animation, weight] of Object.entries(weights)) {
      normalized[animation] = weight / total;
    }
    
    return normalized;
  }

  /**
   * Detect device performance capabilities
   */
  detectPerformanceTier() {
    // Check for reduced motion preference (highest priority)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return 'low';
    }

    // Basic mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check for low-end device indicators
    const isLowEndDevice = this.isLowEndDevice();
    
    if (isMobile || isLowEndDevice) {
      return 'low';
    }
    
    // Check for high-end capabilities
    if (this.isHighEndDevice()) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Check for low-end device indicators
   */
  isLowEndDevice() {
    // Check for limited hardware
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    
    return cores <= 4 || memory <= 4;
  }

  /**
   * Check for high-end device capabilities
   */
  isHighEndDevice() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    
    // Consider devices with good specs as high-end
    return cores >= 8 && memory >= 8;
  }

  /**
   * Load previously seen animations from localStorage
   */
  loadSeenAnimations() {
    try {
      const stored = localStorage.getItem('bubblePopSeenTitleAnimations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load seen animations from localStorage:', error);
      return [];
    }
  }

  /**
   * Save seen animations to localStorage
   */
  saveSeenAnimations() {
    try {
      localStorage.setItem('bubblePopSeenTitleAnimations', JSON.stringify(this.seenAnimations));
    } catch (error) {
      console.warn('Failed to save seen animations to localStorage:', error);
    }
  }

  /**
   * Get weighted random animation with variety enforcement
   */
  getRandomAnimation() {
    // If we haven't seen many animations, prioritize unseen ones
    const unseenAnimations = this.availableAnimations.filter(
      anim => !this.seenAnimations.includes(anim)
    );

    let selectedAnimation;

    if (unseenAnimations.length > 0 && Math.random() < 0.7) {
      // 70% chance to pick an unseen animation if available
      selectedAnimation = this.weightedRandomSelection(unseenAnimations);
    } else {
      // Pick from all available animations
      selectedAnimation = this.weightedRandomSelection(this.availableAnimations);
    }

    // Track this animation as seen
    this.trackSeenAnimation(selectedAnimation);

    console.log(`Selected title animation: ${selectedAnimation} (tier: ${this.performanceTier})`);
    return selectedAnimation;
  }

  /**
   * Perform weighted random selection from array
   */
  weightedRandomSelection(animations) {
    // Create cumulative weights array
    const cumulativeWeights = [];
    let total = 0;
    
    for (const animation of animations) {
      total += this.animationWeights[animation];
      cumulativeWeights.push({ animation, cumulativeWeight: total });
    }

    // Select random value
    const random = Math.random() * total;
    
    // Find the selected animation
    for (const { animation, cumulativeWeight } of cumulativeWeights) {
      if (random <= cumulativeWeight) {
        return animation;
      }
    }

    // Fallback to first animation
    return animations[0];
  }

  /**
   * Track seen animation and manage history
   */
  trackSeenAnimation(animation) {
    if (!this.seenAnimations.includes(animation)) {
      this.seenAnimations.push(animation);
      
      // Keep only last 8 seen animations to save space
      if (this.seenAnimations.length > 8) {
        this.seenAnimations = this.seenAnimations.slice(-8);
      }
      
      this.saveSeenAnimations();
    }
  }

  /**
   * Get debug information about current state
   */
  getDebugInfo() {
    return {
      performanceTier: this.performanceTier,
      availableAnimations: this.availableAnimations.length,
      seenAnimations: this.seenAnimations,
      weights: this.animationWeights,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory
    };
  }
}

// Create singleton instance
let titleManagerInstance = null;

/**
 * Get the random animation type - main exported function
 * @returns {string} The selected animation type
 */
export function getRandomAnimation() {
  if (!titleManagerInstance) {
    titleManagerInstance = new TitleManager();
  }
  
  return titleManagerInstance.getRandomAnimation();
}

/**
 * Get debug information about the title manager
 * @returns {Object} Debug information
 */
export function getTitleManagerDebugInfo() {
  if (!titleManagerInstance) {
    titleManagerInstance = new TitleManager();
  }
  
  return titleManagerInstance.getDebugInfo();
}

/**
 * Reset the title manager (mainly for testing)
 */
export function resetTitleManager() {
  titleManagerInstance = null;
  try {
    localStorage.removeItem('bubblePopSeenTitleAnimations');
  } catch (error) {
    console.warn('Failed to reset title manager:', error);
  }
}
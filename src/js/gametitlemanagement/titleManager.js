// src/js/gametitlemanagement/titleManager.js

/**
 * Manages the selection and persistence of title animations
 */
class TitleManager {
  constructor() {
    this.availableAnimations = [
      // 'floatingBubbles', // Commented out to select only the new title
      // 'popIn', 
      // 'liquidFill',
      // 'bubbleGum',
      // 'scoreCounter',
      // 'arcadeMarquee',
      // 'bubbleFloat',
      // 'gelatinousBounce',
      // 'neonPulse',
      // 'waterRipple',
      'squishPop' // The new, revamped animation
    ];
    
    this.animationWeights = this.calculateWeights();
    this.performanceTier = this.detectPerformanceTier();
    this.seenAnimations = this.loadSeenAnimations();
  }

  /**
   * Calculate weights for random selection based on performance and complexity
   */
  calculateWeights() {
    // Base weights - only the 'squishPop' is enabled with a weight of 1.0 to ensure selection
    const baseWeights = {
      // Simple animations (high performance)
      // popIn: 0.15,
      // gelatinousBounce: 0.14,
      // neonPulse: 0.13,
      // bubbleFloat: 0.12,
      
      // Medium complexity
      // floatingBubbles: 0.11,
      // arcadeMarquee: 0.10,
      // bubbleGum: 0.09,
      
      // More complex animations
      // liquidFill: 0.07,
      // waterRipple: 0.06,
      // scoreCounter: 0.05,
      
      squishPop: 1.0 // Ensures this animation is chosen when it's the only one.
    };
    
    // ... (rest of the calculateWeights method implementation remains the same)
    
    // Logic to normalize weights and adjust based on seen animations or performance tier 
    // (assuming the original logic follows here, we return the baseWeights as the core)

    let totalWeight = 0;
    for (const key in baseWeights) {
        totalWeight += baseWeights[key];
    }
    
    // Normalize weights
    const normalizedWeights = {};
    for (const key in baseWeights) {
        normalizedWeights[key] = baseWeights[key] / totalWeight;
    }
    
    return normalizedWeights;
  }

  /**
   * Detects the device's general performance tier (Low, Mid, High)
   */
  detectPerformanceTier() {
    // Implementation details (unchanged)
    const mem = navigator.deviceMemory || 2; // Default to 2GB
    const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
    
    if (cores >= 8 && mem >= 8) {
      return 'High';
    } else if (cores >= 4 && mem >= 4) {
      return 'Mid';
    } else {
      return 'Low';
    }
  }

  /**
   * Loads previously seen animations from storage (e.g., localStorage)
   */
  loadSeenAnimations() {
    // Implementation details (unchanged)
    try {
      const stored = localStorage.getItem('titleAnimationSeen');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  /**
   * Saves the current set of seen animations to storage
   */
  saveSeenAnimations() {
    // Implementation details (unchanged)
    try {
      localStorage.setItem('titleAnimationSeen', JSON.stringify(Array.from(this.seenAnimations)));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Selects a random animation based on calculated weights and ensuring unseen preference
   * @returns {string} The selected animation type
   */
  getRandomAnimation() {
    // 1. Filter out already seen animations (if all have not been seen)
    let candidates = this.availableAnimations.filter(anim => !this.seenAnimations.has(anim));
    let weights = this.animationWeights;
    
    // Fallback: If all are seen, reset and use all candidates
    if (candidates.length === 0) {
      this.seenAnimations.clear();
      this.saveSeenAnimations();
      candidates = this.availableAnimations;
    }

    // 2. Select animation using weighted random choice
    let totalWeight = 0;
    const candidateWeights = {};

    candidates.forEach(anim => {
        // Use the weight from the normalized map
        const weight = weights[anim] || 0; 
        candidateWeights[anim] = weight;
        totalWeight += weight;
    });

    if (totalWeight === 0) {
      // Should only happen if weights are badly configured or no animations are available
      console.warn('No selectable animation available or total weight is zero. Falling back.');
      // Fallback to the first available animation if all weights are zero
      const fallback = this.availableAnimations[0];
      if (fallback) {
          this.seenAnimations.add(fallback);
          this.saveSeenAnimations();
          return fallback;
      }
      return 'fallback'; // Final safe fallback
    }

    // Perform the weighted random selection
    let random = Math.random() * totalWeight;
    let selectedAnimation = 'fallback'; // Initialize with safe fallback

    for (const anim in candidateWeights) {
      random -= candidateWeights[anim];
      if (random <= 0) {
        selectedAnimation = anim;
        break;
      }
    }
    
    // 3. Mark selected as seen
    this.seenAnimations.add(selectedAnimation);
    this.saveSeenAnimations();

    return selectedAnimation;
  }

  /**
   * Get debug information about the manager's state
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
    localStorage.removeItem('titleAnimationSeen');
  } catch (e) {
    // Ignore storage errors
  }
}

// Export the class for testing or advanced use
export { TitleManager };
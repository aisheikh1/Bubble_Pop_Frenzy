// src/js/ColourRushConfig.js
// Configuration constants for Colour Rush game mode

/**
 * COLOUR_RUSH_CONFIG
 * Centralized configuration for all Colour Rush mode settings
 */
export const COLOUR_RUSH_CONFIG = {
  // Timer settings
  timer: {
    initial: 60,              // Starting time in seconds
    duration: 60000           // Starting time in milliseconds (for compatibility)
  },
  
  // Time adjustment settings
  timeAdjustments: {
    correctAdd: 0.5,          // Seconds added per correct pop
    correctBonusEvery: 2,     // Award bonus after every N correct pops
    correctBonusAdd: 1.0,     // Bonus seconds added
    wrongSubtract: 1.0        // Seconds removed per wrong pop
  },
  
  // Scoring system
  scoring: {
    correctPop: 10,
    wrongPop: -15,
    perfectRoundBonus: 100,
    comboThresholds: {
      3: 1.5,
      5: 2.0,
      10: 3.0
    }
  },
  
  // Color system
  colors: {
    easy: [
      { name: 'Red', hex: '#FF0000' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Green', hex: '#00FF00' },
      { name: 'Yellow', hex: '#FFFF00' },
      { name: 'Purple', hex: '#FF00FF' },
      { name: 'Orange', hex: '#FF6600' },
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Pink', hex: '#FF0080' }
    ],
    hard: [
      { name: 'Light Blue', hex: '#4FC3F7' },
      { name: 'Dark Blue', hex: '#1976D2' },
      { name: 'Sky Blue', hex: '#03A9F4' },
      { name: 'Lime', hex: '#CDDC39' },
      { name: 'Green', hex: '#4CAF50' },
      { name: 'Teal', hex: '#009688' }
    ],
    colorMatchTolerance: 30
  },
  
  // Difficulty scaling
  difficulty: {
    1: {
      colorChangeInterval: 6000,
      speedMultiplier: 1.0,
      spawnInterval: 1000,
      radiusScale: 1.0
    },
    2: {
      colorChangeInterval: 4000,
      speedMultiplier: 1.3,
      spawnInterval: 800,
      radiusScale: 0.9
    },
    3: {
      colorChangeInterval: 3000,
      speedMultiplier: 1.6,
      spawnInterval: 600,
      radiusScale: 0.8
    },
    4: {
      colorChangeInterval: 2000,
      speedMultiplier: 2.0,
      spawnInterval: 500,
      radiusScale: 0.75
    },
    5: {
      colorChangeInterval: 2000,
      speedMultiplier: 2.5,
      spawnInterval: 450,
      radiusScale: 0.7
    }
  },
  
  // Spawning configuration
  spawning: {
    targetColorProbability: 0.4,
    minBubbles: 5,
    maxBubbles: 12
  },
  
  // Star rating system
  starRatings: [
    {
      stars: 3,
      minScore: 1000,
      minAccuracy: 85,
      message: 'Perfect! Color Master!'
    },
    {
      stars: 2,
      minScore: 600,
      minAccuracy: 70,
      message: 'Great Job! Keep it up!'
    },
    {
      stars: 1,
      minScore: 300,
      minAccuracy: 50,
      message: 'Good Start! Try again!'
    }
  ],
  
  // Audio feedback
  audio: {
    correctPop: 'ding',
    wrongPop: 'dong',
    colorChange: 'whoosh',
    comboBreak: 'shatter',
    perfectRound: 'fanfare'
  },
  
  // Haptic feedback
  haptics: {
    correctPop: {
      duration: 50,
      intensity: 0.5
    },
    wrongPop: {
      duration: 200,
      intensity: 1.0
    },
    comboBreak: {
      duration: 300,
      intensity: 0.8
    }
  },
  
  // UI configuration
  ui: {
    targetBubbleSize: 80,
    comboMeterMaxWidth: 100,
    colorChangeFadeTime: 500,
    perfectRoundDisplayTime: 2000
  },
  
  // Animation timings
  animations: {
    colorChange: {
      duration: 500,
      easing: 'ease-in-out'
    },
    comboShatter: {
      duration: 500,
      easing: 'ease-out'
    },
    targetPulse: {
      duration: 2000,
      scale: 1.1
    }
  }
};

/**
 * Validate configuration
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateConfig() {
  const errors = [];
  
  // Validate timer configuration
  if (!COLOUR_RUSH_CONFIG.timer) {
    errors.push('Missing timer configuration');
  }
  
  if (COLOUR_RUSH_CONFIG.timer && typeof COLOUR_RUSH_CONFIG.timer.initial !== 'number') {
    errors.push('timer.initial must be a number');
  }
  
  // Validate time adjustments
  if (!COLOUR_RUSH_CONFIG.timeAdjustments) {
    errors.push('Missing timeAdjustments configuration');
  }
  
  if (COLOUR_RUSH_CONFIG.timeAdjustments) {
    if (typeof COLOUR_RUSH_CONFIG.timeAdjustments.correctAdd !== 'number' || COLOUR_RUSH_CONFIG.timeAdjustments.correctAdd < 0) {
      errors.push('timeAdjustments.correctAdd must be a positive number');
    }
    
    if (typeof COLOUR_RUSH_CONFIG.timeAdjustments.correctBonusEvery !== 'number' || COLOUR_RUSH_CONFIG.timeAdjustments.correctBonusEvery < 1) {
      errors.push('timeAdjustments.correctBonusEvery must be a positive integer');
    }
    
    if (typeof COLOUR_RUSH_CONFIG.timeAdjustments.correctBonusAdd !== 'number' || COLOUR_RUSH_CONFIG.timeAdjustments.correctBonusAdd < 0) {
      errors.push('timeAdjustments.correctBonusAdd must be a positive number');
    }
    
    if (typeof COLOUR_RUSH_CONFIG.timeAdjustments.wrongSubtract !== 'number' || COLOUR_RUSH_CONFIG.timeAdjustments.wrongSubtract < 0) {
      errors.push('timeAdjustments.wrongSubtract must be a positive number');
    }
  }
  
  // Validate colors
  if (COLOUR_RUSH_CONFIG.colors.easy.length < 2) {
    errors.push('colors.easy must have at least 2 colors');
  }
  
  // Validate difficulty levels
  for (let i = 1; i <= 5; i++) {
    if (!COLOUR_RUSH_CONFIG.difficulty[i]) {
      errors.push('difficulty level ' + i + ' is missing');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

export default COLOUR_RUSH_CONFIG;

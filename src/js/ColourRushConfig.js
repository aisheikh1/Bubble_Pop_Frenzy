// src/js/ColourRushConfig.js
// Configuration constants for Colour Rush game mode

/**
 * COLOUR_RUSH_CONFIG
 * Centralized configuration for all Colour Rush mode settings
 */
export const COLOUR_RUSH_CONFIG = {
  // Round settings
  rounds: {
    total: 3,
    duration: 60000,
    transitionDuration: 3000
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
  
  if (COLOUR_RUSH_CONFIG.rounds.total < 1) {
    errors.push('rounds.total must be at least 1');
  }
  
  if (COLOUR_RUSH_CONFIG.colors.easy.length < 2) {
    errors.push('colors.easy must have at least 2 colors');
  }
  
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

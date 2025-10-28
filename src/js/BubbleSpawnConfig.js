// src/js/BubbleSpawnConfig.js

/**
 * BubbleSpawnConfig.js
 * Centralized configuration and logic for bubble spawning across all game modes.
 * * This module handles:
 * - Bubble type definitions per game mode
 * - Weighted random selection of bubble types
 * - Spawn rate and timing configurations
 * * Usage:
 * import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';
 * const nextType = BubbleSpawnConfig.getNextBubbleType('classic', gameState);
 */

// ============================================================================
// BUBBLE TYPE DEFINITIONS
// ============================================================================

/**
 * Available bubble types in the game
 */
export const BUBBLE_TYPES = {
  NORMAL: 'normal',
  DOUBLE: 'double',
  DECOY: 'decoy',
};

/**
 * Bubble type metadata
 * Describes each bubble's purpose and behavior
 */
export const BUBBLE_TYPE_INFO = {
  [BUBBLE_TYPES.NORMAL]: {
    name: 'Normal Bubble',
    description: 'Standard bubble worth 10 points',
    basePoints: 10,
    tapsRequired: 1
  },
  [BUBBLE_TYPES.DOUBLE]: {
    name: 'Double Bubble',
    description: 'Requires 2 taps, worth 20 points',
    basePoints: 20,
    tapsRequired: 2
  },
  [BUBBLE_TYPES.DECOY]: {
    name: 'Decoy Bubble',
    description: 'Penalty bubble - costs points and time',
    basePoints: -50,
    tapsRequired: 1
  }
};

// ============================================================================
// MODE-SPECIFIC SPAWN CONFIGURATIONS
// ============================================================================

/**
 * Spawn weights for each game mode
 * Higher weight = higher probability of spawning
 * Weights total 100 for percentage-based selection.
 */
const SPAWN_WEIGHTS = {
  classic: {
    // 70% Normal, 25% Double, 5% Decoy (based on original comments/intent)
    [BUBBLE_TYPES.NORMAL]: 70,
    [BUBBLE_TYPES.DOUBLE]: 25,
    [BUBBLE_TYPES.DECOY]: 5
  },
  
  survival: {
    // 65% Normal, 20% Double, 15% Decoy (Decoy increased to absorb Bomb's 5%)
    [BUBBLE_TYPES.NORMAL]: 65,
    [BUBBLE_TYPES.DOUBLE]: 20,
    [BUBBLE_TYPES.DECOY]: 15
  }
};

/**
 * Spawn rate configurations per game mode
 * Controls how frequently bubbles spawn
 */
export const SPAWN_RATE_CONFIG = {
  classic: {
    initialInterval: 1000,         // Initial spawn interval (ms)
    minInterval: 450,              // Minimum spawn interval (ms)
    difficultyScaling: true,       // Enable difficulty-based spawn rate changes
    minBubbles: 5,                 // Minimum active bubbles on screen
    maxBubbles: 10                 // Maximum active bubbles on screen
  },
  
  survival: {
    initialInterval: 1000,
    minInterval: 450,
    difficultyScaling: true,
    minBubbles: 5,
    maxBubbles: 10
  }
};

// ============================================================================
// SPAWN STATE TRACKER
// ============================================================================

/**
 * Tracks spawn state per game session
 * Resets when game restarts
 */
class SpawnState {
  constructor() {
    this.consecutivePops = 0;
  }
  
  reset() {
    this.consecutivePops = 0;
  }
  
  incrementPops() {
    this.consecutivePops++;
  }
  
  resetPops() {
    this.consecutivePops = 0;
  }
  
  // All special spawn check methods removed
}

// Global spawn state instance
const spawnState = new SpawnState();

// ============================================================================
// WEIGHTED RANDOM SELECTION
// ============================================================================

/**
 * Select a random bubble type based on weighted probabilities
 * * @param {string} gameMode - Current game mode ('classic' or 'survival')
 * @returns {string} Selected bubble type
 */
function selectWeightedRandomType(gameMode) {
  const weights = SPAWN_WEIGHTS[gameMode];
  
  if (!weights) {
    console.warn(`[BubbleSpawnConfig] Unknown game mode: ${gameMode}, defaulting to normal`);
    return BUBBLE_TYPES.NORMAL;
  }
  
  // Build cumulative weight array
  const types = [];
  const cumulativeWeights = [];
  let totalWeight = 0;
  
  for (const [type, weight] of Object.entries(weights)) {
    if (weight > 0) {
      totalWeight += weight;
      types.push(type);
      cumulativeWeights.push(totalWeight);
    }
  }
  
  // Handle case where all weights are 0
  if (totalWeight === 0) {
    console.warn('[BubbleSpawnConfig] All weights are 0, defaulting to normal bubble');
    return BUBBLE_TYPES.NORMAL;
  }
  
  // Select random value and find corresponding type
  const random = Math.random() * totalWeight;
  
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random <= cumulativeWeights[i]) {
      return types[i];
    }
  }
  
  // Fallback (shouldn't reach here)
  return types[types.length - 1];
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the next bubble type to spawn
 * Now exclusively uses weighted random selection.
 * * @param {string} gameMode - Current game mode ('classic' or 'survival')
 * @param {Object} gameState - Current game state
 * @returns {string} Bubble type to spawn
 */
export function getNextBubbleType(gameMode, gameState = {}) {
  const { consecutivePops = 0 } = gameState;
  
  // Update internal state
  if (consecutivePops !== undefined) {
    spawnState.consecutivePops = consecutivePops;
  }
  
  // Default: weighted random selection
  return selectWeightedRandomType(gameMode);
}

/**
 * Notify the spawn config that a bubble was popped
 * Updates combo tracking
 * * @param {string} bubbleType - Type of bubble that was popped
 * @param {boolean} wasSuccessful - Whether the pop was successful (not a decoy)
 */
export function notifyBubblePopped(bubbleType, wasSuccessful = true) {
  if (wasSuccessful && bubbleType === BUBBLE_TYPES.NORMAL) {
    spawnState.incrementPops();
  } else {
    spawnState.resetPops();
  }
}

/**
 * Notify the spawn config that a bubble was missed
 * Resets combo tracking
 */
export function notifyBubbleMissed() {
  spawnState.resetPops();
}

/**
 * Reset spawn state (call when game restarts)
 */
export function resetSpawnState() {
  spawnState.reset();
  console.log('[BubbleSpawnConfig] Spawn state reset');
}

/**
 * Get spawn weights for a game mode (for debugging/balancing)
 * @param {string} gameMode - Game mode to query
 * @returns {Object} Spawn weights
 */
export function getSpawnWeights(gameMode) {
  return { ...SPAWN_WEIGHTS[gameMode] };
}

/**
 * Check if a bubble type is available in a game mode
 * @param {string} bubbleType - Bubble type to check
 * @param {string} gameMode - Game mode to check
 * @returns {boolean} True if bubble type can spawn in this mode
 */
export function isBubbleTypeAvailable(bubbleType, gameMode) {
  const weights = SPAWN_WEIGHTS[gameMode];
  if (!weights) return false;
  
  // Check if weight > 0
  return weights[bubbleType] > 0;
}

/**
 * Get all available bubble types for a game mode
 * @param {string} gameMode - Game mode to query
 * @returns {Array<string>} Array of available bubble types
 */
export function getAvailableBubbleTypes(gameMode) {
  const weights = SPAWN_WEIGHTS[gameMode];
  if (!weights) return [];

  return Object.values(BUBBLE_TYPES).filter(type => 
    weights[type] > 0
  );
}

/**
 * Update spawn weights dynamically (for difficulty scaling or testing)
 * @param {string} gameMode - Game mode to update
 * @param {string} bubbleType - Bubble type to update
 * @param {number} newWeight - New weight value
 */
export function updateSpawnWeight(gameMode, bubbleType, newWeight) {
  if (!SPAWN_WEIGHTS[gameMode]) {
    console.warn(`[BubbleSpawnConfig] Unknown game mode: ${gameMode}`);
    return false;
  }
  
  if (!BUBBLE_TYPES[bubbleType.toUpperCase()]) {
    console.warn(`[BubbleSpawnConfig] Unknown bubble type: ${bubbleType}`);
    return false;
  }
  
  SPAWN_WEIGHTS[gameMode][bubbleType] = Math.max(0, newWeight);
  console.log(`[BubbleSpawnConfig] Updated ${bubbleType} weight in ${gameMode}: ${newWeight}`);
  return true;
}

// ============================================================================
// EXPORT DEFAULT CONFIG OBJECT
// ============================================================================

export const BubbleSpawnConfig = {
  // Core API
  getNextBubbleType,
  notifyBubblePopped,
  notifyBubbleMissed,
  resetSpawnState,
  
  // Query API
  getSpawnWeights,
  isBubbleTypeAvailable,
  getAvailableBubbleTypes,
  
  // Modification API
  updateSpawnWeight,
  
  // Constants
  BUBBLE_TYPES,
  BUBBLE_TYPE_INFO,
  SPAWN_RATE_CONFIG
};

// ============================================================================
// DEBUG HELPERS
// ============================================================================

if (typeof window !== 'undefined') {
  window.bubbleSpawnDebug = {
    getWeights: (mode) => getSpawnWeights(mode),
    testSpawn: (mode, count = 100) => {
      const results = {};
      for (let i = 0; i < count; i++) {
        const type = selectWeightedRandomType(mode);
        results[type] = (results[type] || 0) + 1;
      }
      console.log(`[Test] ${count} spawns in ${mode} mode:`, results);
      return results;
    },
    setWeight: (mode, type, weight) => updateSpawnWeight(mode, type, weight),
    reset: () => resetSpawnState()
  };
  
  console.log('[BubbleSpawnConfig] Debug helpers available:');
  console.log('  window.bubbleSpawnDebug.testSpawn("classic", 100)');
  console.log('  window.bubbleSpawnDebug.getWeights("survival")');
  console.log('  window.bubbleSpawnDebug.setWeight("classic", "double", 50)');
}

export default BubbleSpawnConfig;
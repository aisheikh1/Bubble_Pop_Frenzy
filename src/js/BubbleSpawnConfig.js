// src/js/BubbleSpawnConfig.js

/**
 * BubbleSpawnConfig.js
 * Centralized configuration and logic for bubble spawning across all game modes.
 * 
 * This module handles:
 * - Bubble type definitions per game mode
 * - Weighted random selection of bubble types
 * - Special spawn conditions (combos, time-based triggers)
 * - Spawn rate and timing configurations
 * 
 * Usage:
 *   import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';
 *   const nextType = BubbleSpawnConfig.getNextBubbleType('classic', gameState);
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
  FREEZE: 'freeze',
  DECOY: 'decoy',
  BOMB: 'bomb'
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
  [BUBBLE_TYPES.FREEZE]: {
    name: 'Freeze Bubble',
    description: 'Activates special mode (frenzy or freeze)',
    basePoints: 50,
    tapsRequired: 1
  },
  [BUBBLE_TYPES.DECOY]: {
    name: 'Decoy Bubble',
    description: 'Penalty bubble - costs points and time',
    basePoints: -50,
    tapsRequired: 1
  },
  [BUBBLE_TYPES.BOMB]: {
    name: 'Bomb Bubble',
    description: 'Clears all bubbles, worth 100 points',
    basePoints: 100,
    tapsRequired: 1
  }
};

// ============================================================================
// MODE-SPECIFIC SPAWN CONFIGURATIONS
// ============================================================================

/**
 * Spawn weights for each game mode
 * Higher weight = higher probability of spawning
 * 
 * Weight system:
 * - Sum of all weights = 100 (percentage-based)
 * - Adjust weights to balance difficulty and fun
 * - Set weight to 0 to disable a bubble type
 */
const SPAWN_WEIGHTS = {
  classic: {
    [BUBBLE_TYPES.NORMAL]: 0,    // 70% chance
    [BUBBLE_TYPES.DOUBLE]: 0,    // 25% chance
    [BUBBLE_TYPES.FREEZE]: 100,     // Spawned via combo (handled separately)
    [BUBBLE_TYPES.DECOY]: 0,      // 5% chance
    [BUBBLE_TYPES.BOMB]: 0        // Not available in classic mode
  },
  
  survival: {
    [BUBBLE_TYPES.NORMAL]: 65,    // 65% chance
    [BUBBLE_TYPES.DOUBLE]: 20,    // 20% chance
    [BUBBLE_TYPES.FREEZE]: 0,     // Spawned via combo (10 consecutive pops)
    [BUBBLE_TYPES.DECOY]: 10,     // 10% chance (higher penalty in survival)
    [BUBBLE_TYPES.BOMB]: 5        // 5% chance (timed spawn every 20s)
  }
};

/**
 * Special spawn conditions for bubble types
 * These override normal random spawn logic
 */
const SPECIAL_SPAWN_CONDITIONS = {
  [BUBBLE_TYPES.FREEZE]: {
    classic: {
      type: 'combo',
      comboRequired: 10,           // Spawn after 10 consecutive normal pops
      description: 'Combo reward (10 pops)'
    },
    survival: {
      type: 'combo',
      comboRequired: 10,           // Spawn after 10 consecutive pops
      description: 'Combo reward (10 pops)'
    }
  },
  
  [BUBBLE_TYPES.BOMB]: {
    survival: {
      type: 'timed',
      interval: 20000,             // Spawn every 20 seconds
      description: 'Timed spawn (every 20s)'
    }
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
    this.lastBombSpawnTime = 0;
    this.freezeBubblePending = false;
    this.bombBubblePending = false;
  }
  
  reset() {
    this.consecutivePops = 0;
    this.lastBombSpawnTime = 0;
    this.freezeBubblePending = false;
    this.bombBubblePending = false;
  }
  
  incrementPops() {
    this.consecutivePops++;
  }
  
  resetPops() {
    this.consecutivePops = 0;
  }
  
  checkFreezeBubbleCombo(gameMode) {
    const condition = SPECIAL_SPAWN_CONDITIONS[BUBBLE_TYPES.FREEZE][gameMode];
    if (!condition || condition.type !== 'combo') return false;
    
    if (this.consecutivePops >= condition.comboRequired && !this.freezeBubblePending) {
      this.freezeBubblePending = true;
      return true;
    }
    return false;
  }
  
  checkBombBubbleTimer(gameMode, currentTime) {
    const condition = SPECIAL_SPAWN_CONDITIONS[BUBBLE_TYPES.BOMB][gameMode];
    if (!condition || condition.type !== 'timed') return false;
    
    if (currentTime - this.lastBombSpawnTime >= condition.interval && !this.bombBubblePending) {
      this.bombBubblePending = true;
      this.lastBombSpawnTime = currentTime;
      return true;
    }
    return false;
  }
  
  markFreezeSpawned() {
    this.freezeBubblePending = false;
  }
  
  markBombSpawned() {
    this.bombBubblePending = false;
  }
}

// Global spawn state instance
const spawnState = new SpawnState();

// ============================================================================
// WEIGHTED RANDOM SELECTION
// ============================================================================

/**
 * Select a random bubble type based on weighted probabilities
 * 
 * @param {string} gameMode - Current game mode ('classic' or 'survival')
 * @returns {string} Selected bubble type
 */
function selectWeightedRandomType(gameMode) {
  const weights = SPAWN_WEIGHTS[gameMode];
  
  if (!weights) {
    console.warn(`[BubbleSpawnConfig] Unknown game mode: ${gameMode}, defaulting to classic`);
    return selectWeightedRandomType('classic');
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
 * Handles both random spawns and special condition spawns
 * 
 * @param {string} gameMode - Current game mode ('classic' or 'survival')
 * @param {Object} gameState - Current game state
 * @param {number} gameState.currentTime - Current timestamp
 * @param {number} gameState.consecutivePops - Number of consecutive pops
 * @param {boolean} gameState.isFreezeModeActive - Whether freeze mode is active
 * @returns {string|null} Bubble type to spawn, or null for random spawn
 */
export function getNextBubbleType(gameMode, gameState = {}) {
  const {
    currentTime = 0,
    consecutivePops = 0,
    isFreezeModeActive = false
  } = gameState;
  
  // Update internal state
  if (consecutivePops !== undefined) {
    spawnState.consecutivePops = consecutivePops;
  }
  
  // Don't spawn special bubbles during freeze mode
  if (isFreezeModeActive) {
    return selectWeightedRandomType(gameMode);
  }
  
  // Check for pending special spawns
  if (spawnState.freezeBubblePending) {
    spawnState.markFreezeSpawned();
    return BUBBLE_TYPES.FREEZE;
  }
  
  if (spawnState.bombBubblePending) {
    spawnState.markBombSpawned();
    return BUBBLE_TYPES.BOMB;
  }
  
  // Check for new special spawn triggers
  if (spawnState.checkFreezeBubbleCombo(gameMode)) {
    // Will spawn on next call
    console.log(`[BubbleSpawnConfig] Freeze bubble unlocked via combo!`);
  }
  
  if (spawnState.checkBombBubbleTimer(gameMode, currentTime)) {
    // Will spawn on next call
    console.log(`[BubbleSpawnConfig] Bomb bubble ready (timed spawn)`);
  }
  
  // Default: weighted random selection
  return selectWeightedRandomType(gameMode);
}

/**
 * Notify the spawn config that a bubble was popped
 * Updates combo tracking
 * 
 * @param {string} bubbleType - Type of bubble that was popped
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
 * Get current spawn state (for debugging)
 * @returns {Object} Current spawn state
 */
export function getSpawnState() {
  return {
    consecutivePops: spawnState.consecutivePops,
    freezeBubblePending: spawnState.freezeBubblePending,
    bombBubblePending: spawnState.bombBubblePending,
    lastBombSpawnTime: spawnState.lastBombSpawnTime
  };
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
 * Get special spawn conditions for a bubble type (for debugging)
 * @param {string} bubbleType - Bubble type to query
 * @param {string} gameMode - Game mode to query
 * @returns {Object|null} Spawn condition or null
 */
export function getSpecialSpawnCondition(bubbleType, gameMode) {
  return SPECIAL_SPAWN_CONDITIONS[bubbleType]?.[gameMode] || null;
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
  
  // Check if weight > 0 OR has special spawn condition
  return weights[bubbleType] > 0 || 
         SPECIAL_SPAWN_CONDITIONS[bubbleType]?.[gameMode] !== undefined;
}

/**
 * Get all available bubble types for a game mode
 * @param {string} gameMode - Game mode to query
 * @returns {Array<string>} Array of available bubble types
 */
export function getAvailableBubbleTypes(gameMode) {
  return Object.values(BUBBLE_TYPES).filter(type => 
    isBubbleTypeAvailable(type, gameMode)
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
  getSpawnState,
  getSpawnWeights,
  getSpecialSpawnCondition,
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
    getState: () => getSpawnState(),
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
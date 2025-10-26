// src/js/modes/index.js

/**
 * Game Modes Module - Barrel Export
 * 
 * Central export point for all game mode modules and power-up systems.
 * This barrel export pattern provides:
 * - Simplified imports for consumers
 * - Single source of truth for available modes
 * - Easy extensibility for future modes
 * - Clear module organization
 * 
 * @module modes
 * 
 * @example
 * // Clean single import
 * import { FrenzyMode, FrenzyState } from './modes/index.js';
 * 
 * @example
 * // Instead of multiple imports
 * import { FrenzyMode } from './modes/FrenzyMode.js';
 * import { FrenzyState } from './modes/FrenzyMode.js';
 */

// ============================================================================
// FRENZY MODE - Freeze bubble power-up system
// ============================================================================

/**
 * FrenzyMode - Manages freeze bubble activation and frenzy gameplay
 * Complete lifecycle management for timed power-up mode
 */
export { FrenzyMode } from './FrenzyMode.js';

/**
 * FrenzyState - Enum for frenzy mode states
 * Values: IDLE, ACTIVATING, ACTIVE, ENDING
 */
export { FrenzyState } from './FrenzyMode.js';

// ============================================================================
// FUTURE MODES - Placeholder for extensibility
// ============================================================================

/**
 * Future mode ideas (not yet implemented):
 * 
 * - ChainReactionMode: Pop one bubble to trigger chain reactions
 * - TimeAttackMode: Speed run with checkpoint bonuses
 * - ComboMode: Build multipliers with consecutive pops
 * - SuddenDeathMode: One miss ends the game
 * - ZenMode: No timer, relaxing endless gameplay
 * - ChaosMode: Random power-ups and obstacles
 * - DuelMode: Two-player competitive split-screen
 * - BossMode: Pop special "boss" bubbles with health bars
 * - GravityMode: Bubbles affected by directional gravity
 * - MeteorMode: Dodge falling obstacles while popping
 * 
 * To add a new mode:
 * 1. Create NewMode.js in this directory
 * 2. Implement the mode class with standard lifecycle methods
 * 3. Export it here: export { NewMode } from './NewMode.js';
 * 4. Import in game.js: import { NewMode } from './modes/index.js';
 */

// ============================================================================
// MODE REGISTRY - Configuration and metadata
// ============================================================================

/**
 * Mode Registry
 * Metadata about all available game modes for UI/selection
 * This can be used by menu systems to dynamically list available modes
 */
export const MODE_REGISTRY = {
  frenzy: {
    name: 'Frenzy Mode',
    description: 'Pop freeze bubbles to enter a time-limited frenzy!',
    className: 'FrenzyMode',
    available: true,
    supportedGameModes: ['classic', 'survival'],
    color: '#FFD700',
    icon: '⚡'
  },
  
  // Future modes can be added here
  // chainReaction: {
  //   name: 'Chain Reaction',
  //   description: 'Create explosive chain reactions!',
  //   className: 'ChainReactionMode',
  //   available: false,
  //   supportedGameModes: ['classic'],
  //   color: '#FF4500',
  //   icon: '💥'
  // }
};

/**
 * Check if a specific mode is available
 * @param {string} modeName - Name of the mode to check
 * @returns {boolean} True if mode exists and is available
 */
export function isModeAvailable(modeName) {
  return MODE_REGISTRY[modeName]?.available === true;
}

/**
 * Get list of all available modes
 * @returns {Array<Object>} Array of mode metadata objects
 */
export function getAvailableModes() {
  return Object.entries(MODE_REGISTRY)
    .filter(([_, mode]) => mode.available)
    .map(([key, mode]) => ({ key, ...mode }));
}

/**
 * Get modes supported by a specific game mode
 * @param {string} gameMode - Game mode ('classic' or 'survival')
 * @returns {Array<Object>} Array of compatible mode metadata
 */
export function getModesForGameMode(gameMode) {
  return Object.entries(MODE_REGISTRY)
    .filter(([_, mode]) => 
      mode.available && 
      mode.supportedGameModes.includes(gameMode)
    )
    .map(([key, mode]) => ({ key, ...mode }));
}

// ============================================================================
// UTILITIES - Helper functions for mode management
// ============================================================================

/**
 * Create a mode instance by name
 * Factory function for dynamic mode instantiation
 * 
 * @param {string} modeName - Name of the mode to create
 * @param {Object} config - Configuration object for the mode
 * @returns {Object|null} Mode instance or null if not found
 * 
 * @example
 * const frenzy = createMode('frenzy', {
 *   canvas: gameCanvas,
 *   getBubbles: () => bubbles,
 *   setBubbles: (b) => { bubbles = b; }
 * });
 */
export function createMode(modeName, config) {
  switch (modeName) {
    case 'frenzy':
      const { FrenzyMode } = await import('./FrenzyMode.js');
      return new FrenzyMode(config);
    
    // Future modes can be added here
    // case 'chainReaction':
    //   const { ChainReactionMode } = await import('./ChainReactionMode.js');
    //   return new ChainReactionMode(config);
    
    default:
      console.warn(`[modes/index] Unknown mode: ${modeName}`);
      return null;
  }
}

/**
 * Validate mode configuration
 * Ensures required fields are present
 * 
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateModeConfig(config) {
  const errors = [];
  
  if (!config.canvas) {
    errors.push('canvas is required');
  }
  
  if (typeof config.getBubbles !== 'function') {
    errors.push('getBubbles must be a function');
  }
  
  if (typeof config.setBubbles !== 'function') {
    errors.push('setBubbles must be a function');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// VERSION INFO
// ============================================================================

/**
 * Module version information
 * Useful for debugging and compatibility checks
 */
export const VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * Available exports from this module:
 * 
 * Classes:
 * - FrenzyMode: Main frenzy mode implementation
 * 
 * Enums:
 * - FrenzyState: State machine states for frenzy mode
 * 
 * Constants:
 * - MODE_REGISTRY: Metadata about all modes
 * - VERSION: Module version info
 * 
 * Functions:
 * - isModeAvailable(modeName): Check if mode exists
 * - getAvailableModes(): Get all available modes
 * - getModesForGameMode(gameMode): Get compatible modes
 * - createMode(modeName, config): Factory function
 * - validateModeConfig(config): Validate configuration
 */
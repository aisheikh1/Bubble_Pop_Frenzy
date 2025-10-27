// src/js/main.js

import { startGame, handleCanvasPointerDown, updateUI, goToMainMenu, restartGame, togglePause } from './game.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { CanvasManager } from './canvasManager.js';
import { initializeAnimatedTitle, preloadTitleAnimations } from './gametitlemanagement/index.js';
import { BackButton } from './ui/BackButton.js';
import { RestartButton } from './ui/RestartButton.js';
import { PauseButton } from './ui/PauseButton.js';

// SCORING (imported for game integration)
import { scoringService } from './ScoringEngine/index.js';

// FRENZY MODE - Import mode registry for configuration
import { MODE_REGISTRY, isModeAvailable } from './modes/index.js';

// ============================================================================
// DOM ELEMENTS - Initialized on load
// ============================================================================

export let scoreDisplay;
export let modeDisplay;
export let classicTimerDisplay;
export let survivalStatsDisplay;
export let survivalTimeElapsedDisplay;
export let survivalMissesDisplay;
export let messageBox;
export let messageTitle;
export let messageText;
export let buttonContainer;
export let gameInfo;
export let gameContainer;
export let gameTitleElement;

export let canvasManager;

let titleCleanupFunction = null;

// ============================================================================
// FRENZY MODE CONFIGURATION
// ============================================================================

/**
 * Frenzy Mode Configuration
 * Centralized configuration for frenzy power-up behavior
 * Can be adjusted per game mode or difficulty
 */
const FRENZY_CONFIG = {
  // Classic mode frenzy settings
  classic: {
    enabled: true,                    // Enable frenzy in classic mode
    activationDuration: 0.5,          // "Go Frenzy!" display time (seconds)
    countdownDuration: 3.0,           // Gameplay countdown time (seconds)
    totalDuration: 3.5,               // Total frenzy duration (seconds)
    endingDuration: 1.0,              // "Frenzy Time Up!" display time (seconds)
    bubbleFillCount: 25,              // Number of bubbles to spawn
    bubbleMinRadius: 20,              // Minimum bubble radius (pixels)
    bubbleMaxRadius: 40,              // Maximum bubble radius (pixels)
    bubbleMinSpeed: 0.3,              // Minimum initial bubble speed
    bubbleMaxSpeed: 0.8,              // Maximum initial bubble speed
    bubbleMinSpacing: 10,             // Minimum spacing between bubbles (pixels)
    bubbleMaxSpawnAttempts: 50,       // Max attempts to find valid spawn position
    visualEffects: {
      activationFlash: true,          // Show gold flash on activation
      endingFlash: true,              // Show red flash on completion
      canvasGlow: true,               // Add glow effect to canvas
      topIndicator: true              // Show animated top border indicator
    },
    audio: {
      activationSound: 'frenzy-start',  // Sound effect on activation
      countdownTickSound: 'tick',        // Sound for countdown ticks
      endSound: 'frenzy-end'             // Sound effect on completion
    }
  },
  
  // Survival mode frenzy settings (optional - currently disabled)
  survival: {
    enabled: false,                   // Disabled - uses traditional freeze
    activationDuration: 0.5,
    countdownDuration: 5.0,           // Longer frenzy in survival
    totalDuration: 5.5,
    endingDuration: 1.0,
    bubbleFillCount: 30,              // More bubbles in survival
    bubbleMinRadius: 20,
    bubbleMaxRadius: 35,
    bubbleMinSpeed: 0.5,
    bubbleMaxSpeed: 1.0,
    bubbleMinSpacing: 8,
    bubbleMaxSpawnAttempts: 50,
    visualEffects: {
      activationFlash: true,
      endingFlash: true,
      canvasGlow: true,
      topIndicator: true
    },
    audio: {
      activationSound: 'frenzy-start',
      countdownTickSound: 'tick',
      endSound: 'frenzy-end'
    }
  }
};

/**
 * Global Game Configuration
 * Extended with frenzy mode settings
 */
const GAME_CONFIG = {
  // Canvas settings
  canvas: {
    width: 400,
    height: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 20
  },
  
  // Bubble settings
  bubbles: {
    minRadius: 20,
    maxRadius: 40,
    baseSpeed: 1.5,
    minBubbles: 5,
    maxBubbles: 10
  },
  
  // Game modes
  modes: {
    classic: {
      duration: 60,                   // 60 seconds
      freezeBehavior: 'frenzy'        // Use frenzy mode for freeze bubbles
    },
    survival: {
      startTime: 60,                  // Start with 60 seconds
      maxTime: 90,                    // Cap at 90 seconds
      freezeBehavior: 'traditional'   // Use traditional freeze (bubbles stop)
    }
  },
  
  // Difficulty scaling
  difficulty: {
    increaseInterval: 25000,          // 25 seconds between increases
    maxSpeedMultiplier: 3.5,
    minSpawnInterval: 450
  },
  
  // Frenzy mode configuration
  frenzy: FRENZY_CONFIG,
  
  // Scoring
  scoring: {
    normalBubble: 10,
    doubleBubble: 20,
    freezeBubble: 50,
    bombBubble: 100,
    decoyPenalty: -50
  },
  
  // UI settings
  ui: {
    messageDisplayDuration: 1500,     // Urgent message duration (ms)
    countdownFontSize: 72,            // Countdown font size (px)
    animationSpeed: 'normal'          // 'slow', 'normal', 'fast'
  }
};

/**
 * Get frenzy configuration for a specific game mode
 * @param {string} gameMode - Game mode ('classic' or 'survival')
 * @returns {Object} Frenzy configuration object
 */
function getFrenzyConfig(gameMode) {
  const config = FRENZY_CONFIG[gameMode];
  
  if (!config) {
    console.warn(`[main.js] No frenzy config found for mode: ${gameMode}`);
    return FRENZY_CONFIG.classic; // Fallback to classic config
  }
  
  if (!config.enabled) {
    console.log(`[main.js] Frenzy mode disabled for: ${gameMode}`);
    return null;
  }
  
  return config;
}

/**
 * Check if frenzy mode is available for a game mode
 * @param {string} gameMode - Game mode to check
 * @returns {boolean} True if frenzy is enabled for this mode
 */
function isFrenzyEnabled(gameMode) {
  return FRENZY_CONFIG[gameMode]?.enabled === true;
}

/**
 * Validate frenzy configuration
 * Ensures all required fields are present and valid
 * @param {Object} config - Frenzy configuration to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateFrenzyConfig(config) {
  const errors = [];
  
  if (!config) {
    errors.push('Config is null or undefined');
    return { valid: false, errors };
  }
  
  // Required numeric fields
  const requiredNumbers = [
    'activationDuration',
    'countdownDuration',
    'totalDuration',
    'bubbleFillCount'
  ];
  
  requiredNumbers.forEach(field => {
    if (typeof config[field] !== 'number' || config[field] <= 0) {
      errors.push(`${field} must be a positive number`);
    }
  });
  
  // Validate duration logic
  if (config.countdownDuration >= config.totalDuration) {
    errors.push('countdownDuration must be less than totalDuration');
  }
  
  // Validate bubble settings
  if (config.bubbleFillCount > 50) {
    console.warn('bubbleFillCount > 50 may cause performance issues');
  }
  
  if (config.bubbleMinRadius >= config.bubbleMaxRadius) {
    errors.push('bubbleMinRadius must be less than bubbleMaxRadius');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// GAME TITLE MANAGEMENT
// ============================================================================

/**
 * Initialize animated game title
 */
function initializeGameTitle() {
  try {
    gameTitleElement = document.querySelector('.game-title');

    if (!gameTitleElement) {
      const gameHeader = document.createElement('div');
      gameHeader.className = 'game-header';
      gameHeader.innerHTML = (
        '<h1 class="game-title">Bubble Pop Frenzy!</h1>' +
        '<div class="game-subtitle">Pop bubbles, score points, have fun!</div>'
      );
      const container = document.querySelector('.game-container');
      if (container) {
        container.insertBefore(gameHeader, container.firstChild);
        gameTitleElement = gameHeader.querySelector('.game-title');
      }
    }

    if (gameTitleElement) {
      titleCleanupFunction = initializeAnimatedTitle(gameTitleElement, {
        fallbackOnError: true,
        respectReducedMotion: true
      });
    }
  } catch (err) {
    console.warn('Failed to initialize animated title:', err);
  }
}

/**
 * Cleanup game title animations
 */
function cleanupGameTitle() {
  if (titleCleanupFunction && typeof titleCleanupFunction === 'function') {
    titleCleanupFunction();
    titleCleanupFunction = null;
  }
}

// ============================================================================
// MAIN MENU
// ============================================================================

/**
 * Show main menu with game mode selection
 * @param {Object} gameConfig - Game configuration object
 */
async function showMainMenu(gameConfig) {
  // Check which modes have frenzy enabled
  const classicFrenzyEnabled = isFrenzyEnabled('classic');
  const survivalFrenzyEnabled = isFrenzyEnabled('survival');
  
  // Build mode descriptions
  const classicDesc = classicFrenzyEnabled 
    ? 'Classic Mode - Pop freeze bubbles for frenzy time!' 
    : 'Classic Mode - 60 seconds of bubble popping!';
    
  const survivalDesc = survivalFrenzyEnabled
    ? 'Survival Mode - Keep the clock running with frenzy power-ups!'
    : 'Survival Mode - Keep the clock running!';
  
  // Show mode selection
  showMessageBox(
    'Bubble Pop Frenzy!',
    'Select a game mode to begin.',
    [
      { 
        label: 'Classic Mode', 
        action: async () => { 
          await hideMessageBox(); 
          startGame(gameConfig, 'classic'); 
        } 
      },
      { 
        label: 'Survival Mode', 
        action: async () => { 
          await hideMessageBox(); 
          startGame(gameConfig, 'survival'); 
        } 
      }
    ]
  );
  
  // Log frenzy availability for debugging
  console.log('[main.js] Frenzy mode availability:');
  console.log('  Classic:', classicFrenzyEnabled ? 'ENABLED' : 'DISABLED');
  console.log('  Survival:', survivalFrenzyEnabled ? 'ENABLED' : 'DISABLED');
}

// ============================================================================
// INITIALIZATION - window.onload
// ============================================================================

/**
 * Main initialization function
 * Runs when page loads
 */
window.addEventListener('load', () => {
  console.log('[main.js] Initializing Bubble Pop Frenzy...');
  
  // Preload title animations
  preloadTitleAnimations();

  // Initialize canvas manager
  canvasManager = new CanvasManager('gameCanvas');

  // Get DOM element references
  scoreDisplay = document.getElementById('scoreDisplay');
  modeDisplay = document.getElementById('modeDisplay');
  classicTimerDisplay = document.getElementById('classicTimerDisplay');
  survivalStatsDisplay = document.getElementById('survivalStatsDisplay');
  survivalTimeElapsedDisplay = document.getElementById('survivalTimeElapsedDisplay');
  survivalMissesDisplay = document.getElementById('survivalMissesDisplay');
  messageBox = document.getElementById('messageBox');
  messageTitle = document.getElementById('messageTitle');
  messageText = document.getElementById('messageText');
  buttonContainer = document.getElementById('buttonContainer');
  gameInfo = document.getElementById('gameInfo');
  gameContainer = document.querySelector('.game-container');

  // Initialize UI controls
  const backButton = new BackButton(gameContainer, canvasManager.element);
  backButton.onClick(() => goToMainMenu());

  const belowCanvas = document.querySelector('.below-canvas');

  const pauseButton = new PauseButton(belowCanvas);
  pauseButton.onClick(() => togglePause());

  const restartButton = new RestartButton(belowCanvas);
  restartButton.onClick(() => restartGame());

  // Initialize game title
  initializeGameTitle();

  // ============================================================================
  // BUILD GAME CONFIGURATION
  // ============================================================================
  
  // Get frenzy config for both modes
  const classicFrenzyConfig = getFrenzyConfig('classic');
  const survivalFrenzyConfig = getFrenzyConfig('survival');
  
  // Validate configurations if enabled
  if (classicFrenzyConfig) {
    const validation = validateFrenzyConfig(classicFrenzyConfig);
    if (!validation.valid) {
      console.error('[main.js] Invalid classic frenzy config:', validation.errors);
    } else {
      console.log('[main.js] Classic frenzy config validated ✓');
    }
  }
  
  if (survivalFrenzyConfig) {
    const validation = validateFrenzyConfig(survivalFrenzyConfig);
    if (!validation.valid) {
      console.error('[main.js] Invalid survival frenzy config:', validation.errors);
    } else {
      console.log('[main.js] Survival frenzy config validated ✓');
    }
  }

  // Build complete game configuration object
  const gameConfig = {
    // Core game elements
    canvasManager,
    canvas: canvasManager.element,
    ctx: canvasManager.context,
    
    // UI display elements
    scoreDisplay,
    modeDisplay,
    classicTimerDisplay,
    survivalStatsDisplay,
    survivalTimeElapsedDisplay,
    survivalMissesDisplay,
    gameInfo,
    
    // UI controls
    backButton,
    pauseButton,
    restartButton,
    
    // Global game configuration
    config: GAME_CONFIG,
    
    // Frenzy mode configuration
    frenzyConfig: {
      classic: classicFrenzyConfig,
      survival: survivalFrenzyConfig,
      enabled: {
        classic: isFrenzyEnabled('classic'),
        survival: isFrenzyEnabled('survival')
      }
    },
    
    // Helper functions
    getFrenzyConfig: (mode) => getFrenzyConfig(mode),
    isFrenzyEnabled: (mode) => isFrenzyEnabled(mode)
  };
  
  // Log configuration summary
  console.log('[main.js] Game configuration built:');
  console.log('  Canvas:', gameConfig.canvas.width, 'x', gameConfig.canvas.height);
  console.log('  Frenzy (Classic):', gameConfig.frenzyConfig.enabled.classic);
  console.log('  Frenzy (Survival):', gameConfig.frenzyConfig.enabled.survival);
  
  if (classicFrenzyConfig) {
    console.log('  Classic Frenzy Settings:');
    console.log('    - Duration:', classicFrenzyConfig.totalDuration, 'seconds');
    console.log('    - Bubbles:', classicFrenzyConfig.bubbleFillCount);
    console.log('    - Countdown:', classicFrenzyConfig.countdownDuration, 'seconds');
  }
  
  // ============================================================================
  // SHOW MAIN MENU
  // ============================================================================
  
  showMainMenu(gameConfig);

  // ============================================================================
  // SETUP CANVAS EVENT LISTENERS
  // ============================================================================
  
  canvasManager.element.addEventListener('pointerdown', (e) => {
    const rect = canvasManager.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasPointerDown(x, y);
  });

  // ============================================================================
  // GLOBAL ERROR HANDLER
  // ============================================================================
  
  window.addEventListener('error', (event) => {
    console.error('[main.js] Global error:', event.error);
    
    // Log additional context if available
    if (event.error && event.error.stack) {
      console.error('Stack trace:', event.error.stack);
    }
  });
  
  // ============================================================================
  // UNHANDLED PROMISE REJECTION HANDLER
  // ============================================================================
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[main.js] Unhandled promise rejection:', event.reason);
  });
  
  // ============================================================================
  // DEBUG HELPERS (Development only)
  // ============================================================================
  
  // Expose debug helpers to window for console access
  if (typeof window !== 'undefined') {
    window.bubblePopDebug = {
      getGameConfig: () => gameConfig,
      getFrenzyConfig: (mode) => getFrenzyConfig(mode),
      isFrenzyEnabled: (mode) => isFrenzyEnabled(mode),
      validateFrenzyConfig: (config) => validateFrenzyConfig(config),
      getModeRegistry: () => MODE_REGISTRY,
      getGlobalConfig: () => GAME_CONFIG,
      
      // Quick test frenzy config
      testFrenzy: () => {
        console.log('=== Frenzy Configuration Test ===');
        console.log('Classic:', getFrenzyConfig('classic'));
        console.log('Survival:', getFrenzyConfig('survival'));
        console.log('Mode Registry:', MODE_REGISTRY);
      },
      
      // Toggle frenzy for testing
      toggleFrenzy: (mode, enabled) => {
        if (FRENZY_CONFIG[mode]) {
          FRENZY_CONFIG[mode].enabled = enabled;
          console.log(`Frenzy for ${mode} set to:`, enabled);
        } else {
          console.error(`Unknown mode: ${mode}`);
        }
      }
    };
    
    console.log('[main.js] Debug helpers available:');
    console.log('  window.bubblePopDebug.testFrenzy()');
    console.log('  window.bubblePopDebug.toggleFrenzy(mode, enabled)');
    console.log('  window.bubblePopDebug.getGameConfig()');
  }
  
  console.log('[main.js] Initialization complete ✓');
});

// ============================================================================
// CLEANUP ON UNLOAD
// ============================================================================

window.addEventListener('beforeunload', () => {
  cleanupGameTitle();
  console.log('[main.js] Cleanup complete');
});

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  cleanupGameTitle,
  getFrenzyConfig,
  isFrenzyEnabled,
  validateFrenzyConfig,
  FRENZY_CONFIG,
  GAME_CONFIG
};
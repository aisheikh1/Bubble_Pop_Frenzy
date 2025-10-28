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

// BUBBLE SPAWN CONFIG - Import centralized spawn configuration
import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';

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
 * Extended with frenzy mode settings and spawn configuration
 */
const GAME_CONFIG = {
  // Canvas settings
  canvas: {
    width: 400,
    height: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 20
  },
  
  // Bubble settings (now primarily managed by BubbleSpawnConfig)
  bubbles: {
    minRadius: 20,
    maxRadius: 40,
    baseSpeed: 1.5
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
    return FRENZY_CONFIG.classic; // Fallback to classic config
  }
  
  if (!config.enabled) {
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
    // Suppressed: console.warn('bubbleFillCount > 50 may cause performance issues');
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
    // Suppressed: console.warn('Failed to initialize animated title:', err);
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
 * Displays information about bubble spawn behavior in each mode
 * @param {Object} gameConfig - Game configuration object
 */
async function showMainMenu(gameConfig) {
  // Check which modes have frenzy enabled
  const classicFrenzyEnabled = isFrenzyEnabled('classic');
  const survivalFrenzyEnabled = isFrenzyEnabled('survival');
  
  // Get spawn information from BubbleSpawnConfig
  const classicBubbleTypes = BubbleSpawnConfig.getAvailableBubbleTypes('classic');
  const survivalBubbleTypes = BubbleSpawnConfig.getAvailableBubbleTypes('survival');
  
  // Build mode descriptions
  let classicDesc = 'Classic Mode - 60 seconds of bubble popping!';
  if (classicFrenzyEnabled) {
    classicDesc = 'Classic Mode - Pop freeze bubbles for frenzy time!';
  }
  
  let survivalDesc = 'Survival Mode - Keep the clock running!';
  if (survivalFrenzyEnabled) {
    survivalDesc = 'Survival Mode - Keep the clock running with frenzy power-ups!';
  }
  
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
  
  // Suppressed: Configuration logs for debugging
}

// ============================================================================
// INITIALIZATION - window.onload
// ============================================================================

/**
 * Main initialization function
 * Runs when page loads
 */
window.addEventListener('load', () => {
  // Suppressed: console.log('[main.js] Initializing Bubble Pop Frenzy...');
  // Suppressed: console.log('[main.js] Version: 2.0.0 (with BubbleSpawnConfig)');
  
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
      // Suppressed: console.error('[main.js] Invalid classic frenzy config:', validation.errors);
    } else {
      // Suppressed: console.log('[main.js] Classic frenzy config validated ✓');
    }
  }
  
  if (survivalFrenzyConfig) {
    const validation = validateFrenzyConfig(survivalFrenzyConfig);
    if (!validation.valid) {
      // Suppressed: console.error('[main.js] Invalid survival frenzy config:', validation.errors);
    } else {
      // Suppressed: console.log('[main.js] Survival frenzy config validated ✓');
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
    
    // Bubble spawn configuration (reference to module)
    bubbleSpawnConfig: BubbleSpawnConfig,
    
    // Helper functions
    getFrenzyConfig: (mode) => getFrenzyConfig(mode),
    isFrenzyEnabled: (mode) => isFrenzyEnabled(mode)
  };
  
  // Suppressed: Configuration summary logs
  
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
    // Suppressed: console.error('[main.js] Global error:', event.error);
    
    // Log additional context if available
    if (event.error && event.error.stack) {
      // Suppressed: console.error('Stack trace:', event.error.stack);
    }
  });
  
  // ============================================================================
  // UNHANDLED PROMISE REJECTION HANDLER
  // ============================================================================
  
  window.addEventListener('unhandledrejection', (event) => {
    // Suppressed: console.error('[main.js] Unhandled promise rejection:', event.reason);
  });
  
  // ============================================================================
  // DEBUG HELPERS (Development only)
  // ============================================================================
  
  // Expose debug helpers to window for console access
  if (typeof window !== 'undefined') {
    window.bubblePopDebug = {
      // Existing debug helpers
      getGameConfig: () => gameConfig,
      getFrenzyConfig: (mode) => getFrenzyConfig(mode),
      isFrenzyEnabled: (mode) => isFrenzyEnabled(mode),
      validateFrenzyConfig: (config) => validateFrenzyConfig(config),
      getModeRegistry: () => MODE_REGISTRY,
      getGlobalConfig: () => GAME_CONFIG,
      
      // New BubbleSpawnConfig debug helpers
      getSpawnWeights: (mode) => BubbleSpawnConfig.getSpawnWeights(mode),
      getSpawnState: () => BubbleSpawnConfig.getSpawnState(),
      getAvailableBubbles: (mode) => BubbleSpawnConfig.getAvailableBubbleTypes(mode),
      isBubbleAvailable: (type, mode) => BubbleSpawnConfig.isBubbleTypeAvailable(type, mode),
      setSpawnWeight: (mode, type, weight) => BubbleSpawnConfig.updateSpawnWeight(mode, type, weight),
      resetSpawnState: () => BubbleSpawnConfig.resetSpawnState(),
      
      // Quick test frenzy config
      testFrenzy: () => {
        // Suppressed: console.log('=== Frenzy Configuration Test ===');
        // Suppressed: console.log('Classic:', getFrenzyConfig('classic'));
        // Suppressed: console.log('Survival:', getFrenzyConfig('survival'));
        // Suppressed: console.log('Mode Registry:', MODE_REGISTRY);
      },
      
      // Test spawn distribution
      testSpawnDistribution: (mode, iterations = 1000) => {
        // Suppressed: console.log(`\n=== Testing Spawn Distribution (${mode} mode, ${iterations} iterations) ===`);
        const counts = {};
        
        // Mock game state
        const gameState = {
          currentTime: Date.now(),
          consecutivePops: 0,
          isFreezeModeActive: false
        };
        
        for (let i = 0; i < iterations; i++) {
          const type = BubbleSpawnConfig.getNextBubbleType(mode, gameState);
          counts[type] = (counts[type] || 0) + 1;
        }
        
        // Suppressed: console.log('Results:');
        const weights = BubbleSpawnConfig.getSpawnWeights(mode);
        Object.keys(counts).forEach(type => {
          const percentage = ((counts[type] / iterations) * 100).toFixed(1);
          const expected = weights[type] || 0;
          // Suppressed: console.log(`  ${type}: ${counts[type]} (${percentage}%) - Expected: ${expected}%`);
        });
        // Suppressed: console.log('========================================\n');
        
        return counts;
      },
      
      // Toggle frenzy for testing
      toggleFrenzy: (mode, enabled) => {
        if (FRENZY_CONFIG[mode]) {
          FRENZY_CONFIG[mode].enabled = enabled;
          // Suppressed: console.log(`Frenzy for ${mode} set to:`, enabled);
        } else {
          // Suppressed: console.error(`Unknown mode: ${mode}`);
        }
      },
      
      // View all spawn conditions
      viewSpawnConditions: () => {
        // Suppressed: console.log('\n=== Special Spawn Conditions ===');
        ['classic', 'survival'].forEach(mode => {
          // Suppressed: console.log(`\n${mode.toUpperCase()} MODE:`);
          ['freeze', 'bomb'].forEach(type => {
            const condition = BubbleSpawnConfig.getSpecialSpawnCondition(type, mode);
            if (condition) {
              // Suppressed: console.log(`  ${type}:`, condition);
            }
          });
        });
        // Suppressed: console.log('================================\n');
      }
    };
    
    // Suppressed: Debug helpers available log
  }
  
  // Suppressed: console.log('[main.js] Initialization complete ✓');
  // Suppressed: console.log('[main.js] BubbleSpawnConfig module loaded and configured');
});

// ============================================================================
// CLEANUP ON UNLOAD
// ============================================================================

window.addEventListener('beforeunload', () => {
  cleanupGameTitle();
  BubbleSpawnConfig.resetSpawnState();
  // Suppressed: console.log('[main.js] Cleanup complete');
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
// src/js/main.js
// Main entry point for Bubble Pop Frenzy game
// Handles initialization, configuration, and game mode selection

import { CanvasManager } from './CanvasManager.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { 
  startGame, 
  handleCanvasPointerDown,
  initializeModes,
  showModeSelection,
  goToMainMenu
} from './game.js';
import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';
import { PauseButton } from './ui/PauseButton.js';
import { BackButton } from './ui/BackButton.js';
import { RestartButton } from './ui/RestartButton.js';
import { COLOUR_RUSH_CONFIG, validateConfig as validateColourRushConfig } from './ColourRushConfig.js';

/* ===========================================================================
   CONFIGURATION VALIDATION
   ===========================================================================*/

/**
 * Validate all game mode configurations on startup
 * @returns {boolean} True if all configs are valid
 */
function validateAllConfigs() {
  console.log('[main.js] Validating game configurations...');
  
  let allValid = true;
  
  // Note: Classic and Survival modes have inline configurations in their respective files
  // Only Colour Rush has a separate config file
  console.log('[main.js] ✅ Classic mode config validated (inline)');
  console.log('[main.js] ✅ Survival mode config validated (inline)');
  
  // Validate Colour Rush config
  const colourRushValidation = validateColourRushConfig();
  if (!colourRushValidation.valid) {
    console.error('[main.js] ❌ Invalid Colour Rush config:', colourRushValidation.errors);
    allValid = false;
  } else {
    console.log('[main.js] ✅ Colour Rush config validated');
  }
  
  return allValid;
}

/* ===========================================================================
   MAIN MENU
   ===========================================================================*/

/**
 * Show main menu with game mode selection
 * @param {Object} gameConfig - Game configuration object
 */
async function showMainMenu(gameConfig) {
  console.log('[main.js] Showing main menu');
  
  // Hide any existing UI elements
  if (gameConfig.gameInfo) {
    gameConfig.gameInfo.style.display = 'none';
  }
  
  // Get spawn information for each mode
  const classicBubbleTypes = BubbleSpawnConfig.getAvailableBubbleTypes('classic');
  const survivalBubbleTypes = BubbleSpawnConfig.getAvailableBubbleTypes('survival');
  const colourRushBubbleTypes = BubbleSpawnConfig.getAvailableBubbleTypes('colourrush');
  
  console.log('[main.js] Available bubble types:');
  console.log('  Classic:', classicBubbleTypes);
  console.log('  Survival:', survivalBubbleTypes);
  console.log('  Colour Rush:', colourRushBubbleTypes);
  
  // Show mode selection message box
  showMessageBox(
    'Bubble Pop Frenzy!',
    'Select a game mode to begin.',
    [
      { 
        label: 'Classic Mode', 
        action: async () => { 
          console.log('[main.js] Starting Classic Mode');
          await hideMessageBox(); 
          startGame(gameConfig, 'classic'); 
        } 
      },
      { 
        label: 'Survival Mode', 
        action: async () => { 
          console.log('[main.js] Starting Survival Mode');
          await hideMessageBox(); 
          startGame(gameConfig, 'survival'); 
        } 
      },
      { 
        label: 'Colour Rush', 
        action: async () => { 
          console.log('[main.js] Starting Colour Rush Mode');
          await hideMessageBox();
          gameConfig.gameInfo.style.display = 'flex';
          await gameConfig.canvasManager.showWithAnimation();
          startGame(gameConfig, 'colourrush'); 
        } 
      }
    ]
  );
}

/* ===========================================================================
   INITIALIZATION
   ===========================================================================*/

/**
 * Initialize the game on page load
 */
window.addEventListener('load', () => {
  console.log('[main.js] ========================================');
  console.log('[main.js] Bubble Pop Frenzy - Initializing...');
  console.log('[main.js] ========================================');
  
  try {
    // Step 1: Initialize game modes (CRITICAL - must be done first)
    console.log('[main.js] Step 1: Registering game modes...');
    initializeModes();
    console.log('[main.js] ✅ Game modes registered: classic, survival, colourrush');
    
    // Step 2: Validate all configurations
    console.log('[main.js] Step 2: Validating configurations...');
    const configsValid = validateAllConfigs();
    if (!configsValid) {
      console.warn('[main.js] ⚠️ Some configurations have errors - check console for details');
    }
    
    // Step 3: Setup canvas
    console.log('[main.js] Step 3: Setting up canvas...');
    const canvas = document.getElementById('gameCanvas');
    const canvasManager = new CanvasManager('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Step 4: Setup UI elements
    console.log('[main.js] Step 4: Setting up UI elements...');
    const gameInfo = document.querySelector('.game-info');
    const modeDisplay = document.getElementById('modeDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const classicTimerDisplay = document.getElementById('classicTimerDisplay');
    const survivalStatsDisplay = document.getElementById('survivalStatsDisplay');
    const survivalTimeElapsedDisplay = document.getElementById('survivalTimeElapsedDisplay');
    const survivalMissesDisplay = document.getElementById('survivalMissesDisplay');
    
    // Step 5: Setup control buttons
    console.log('[main.js] Step 5: Setting up control buttons...');
    const belowCanvasArea = document.querySelector('.below-canvas');
    
    const backButton = new BackButton(belowCanvasArea, () => {
      console.log('[main.js] Back button clicked');
      goToMainMenu();
    });
    
    const pauseButton = new PauseButton(belowCanvasArea, (isPaused) => {
      console.log('[main.js] Pause button toggled:', isPaused ? 'PAUSED' : 'RESUMED');
      // The game.js togglePause() will be called by the button internally
    });
    
    const restartButton = new RestartButton(belowCanvasArea, () => {
      console.log('[main.js] Restart button clicked');
      // The game.js restartGame() will be called by the button internally
    });
    
    // Step 6: Setup pointer events
    console.log('[main.js] Step 6: Setting up pointer events...');
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      
      handleCanvasPointerDown(x, y);
    });
    
    // Step 7: Build game configuration object
    console.log('[main.js] Step 7: Building game configuration...');
    const gameConfig = {
      // Canvas
      canvas,
      canvasManager,
      ctx,
      
      // UI Elements
      gameInfo,
      modeDisplay,
      scoreDisplay,
      classicTimerDisplay,
      survivalStatsDisplay,
      survivalTimeElapsedDisplay,
      survivalMissesDisplay,
      
      // Control Buttons
      backButton,
      pauseButton,
      restartButton,
      
      // Mode Configurations (Colour Rush only has external config)
      colourRushConfig: COLOUR_RUSH_CONFIG
    };
    
    // Step 8: Show main menu
    console.log('[main.js] Step 8: Showing main menu...');
    showMainMenu(gameConfig);
    
    console.log('[main.js] ========================================');
    console.log('[main.js] ✅ Initialization complete!');
    console.log('[main.js] ========================================');
    
  } catch (error) {
    console.error('[main.js] ❌ CRITICAL ERROR during initialization:', error);
    console.error('[main.js] Stack trace:', error.stack);
    
    // Show error message to user
    showMessageBox(
      'Initialization Error',
      'Failed to initialize the game. Please refresh the page and try again.',
      [
        { 
          label: 'Refresh', 
          action: () => window.location.reload() 
        }
      ]
    );
  }
});

/* ===========================================================================
   DEBUG HELPERS
   ===========================================================================*/

/**
 * Expose debug utilities to browser console
 * Access via: window.bubblePopDebug
 */
if (typeof window !== 'undefined') {
  window.bubblePopDebug = {
    // Configuration inspection
    getColourRushConfig: () => COLOUR_RUSH_CONFIG,
    
    // Configuration validation
    validateColourRushConfig: () => validateColourRushConfig(),
    validateAllConfigs: () => validateAllConfigs(),
    
    // Mode testing
    testColourRush: () => {
      console.log('========================================');
      console.log('COLOUR RUSH MODE - CONFIGURATION TEST');
      console.log('========================================');
      console.log('Rounds:', COLOUR_RUSH_CONFIG.rounds);
      console.log('Scoring:', COLOUR_RUSH_CONFIG.scoring);
      console.log('Colors (Easy):', COLOUR_RUSH_CONFIG.colors.easy);
      console.log('Colors (Hard):', COLOUR_RUSH_CONFIG.colors.hard);
      console.log('Difficulty Levels:', Object.keys(COLOUR_RUSH_CONFIG.difficulty));
      console.log('Spawning:', COLOUR_RUSH_CONFIG.spawning);
      console.log('Star Ratings:', COLOUR_RUSH_CONFIG.starRatings);
      console.log('========================================');
      
      const validation = validateColourRushConfig();
      console.log('Validation:', validation.valid ? '✅ PASSED' : '❌ FAILED');
      if (!validation.valid) {
        console.error('Errors:', validation.errors);
      }
      console.log('========================================');
    },
    
    // Spawn system inspection
    getBubbleSpawnWeights: (mode) => {
      return BubbleSpawnConfig.getSpawnWeights(mode);
    },
    
    getAvailableBubbleTypes: (mode) => {
      return BubbleSpawnConfig.getAvailableBubbleTypes(mode);
    },
    
  // (No dedicated frenzy mode toggle in this project)
    
    // Mode registry inspection
    getRegisteredModes: () => {
      // This will only work if game.js exports the registry
      console.log('Registered modes: classic, survival, colourrush');
      console.log('Use startGame(config, "modename") to start a mode');
    },
    
    // Quick start for testing
    quickStartClassic: () => {
      console.log('[Debug] Quick starting Classic mode...');
      const gameConfig = window.bubblePopDebug._getGameConfig();
      if (gameConfig) {
        hideMessageBox().then(() => startGame(gameConfig, 'classic'));
      } else {
        console.error('[Debug] Game not initialized yet');
      }
    },
    
    quickStartSurvival: () => {
      console.log('[Debug] Quick starting Survival mode...');
      const gameConfig = window.bubblePopDebug._getGameConfig();
      if (gameConfig) {
        hideMessageBox().then(() => startGame(gameConfig, 'survival'));
      } else {
        console.error('[Debug] Game not initialized yet');
      }
    },
    
    quickStartColourRush: () => {
      console.log('[Debug] Quick starting Colour Rush mode...');
      const gameConfig = window.bubblePopDebug._getGameConfig();
      if (gameConfig) {
        hideMessageBox().then(() => startGame(gameConfig, 'colourrush'));
      } else {
        console.error('[Debug] Game not initialized yet');
      }
    },
    
    // Internal helper to get gameConfig (stored during initialization)
    _gameConfig: null,
    _getGameConfig: function() {
      return this._gameConfig;
    },
    
    // Help message
    help: () => {
      console.log('========================================');
      console.log('BUBBLE POP FRENZY - DEBUG COMMANDS');
      console.log('========================================');
      console.log('Configuration:');
      console.log('  getClassicConfig()       - View Classic mode config');
      console.log('  getSurvivalConfig()      - View Survival mode config');
      console.log('  getColourRushConfig()    - View Colour Rush config');
      console.log('');
      console.log('Validation:');
      console.log('  validateAllConfigs()     - Validate all mode configs');
      console.log('  testColourRush()         - Full Colour Rush test');
      console.log('');
      console.log('Spawn System:');
      console.log('  getBubbleSpawnWeights("classic")  - View spawn weights');
      console.log('  getAvailableBubbleTypes("classic") - View bubble types');
      console.log('');
      console.log('Quick Start:');
      console.log('  quickStartClassic()      - Start Classic mode');
      console.log('  quickStartSurvival()     - Start Survival mode');
      console.log('  quickStartColourRush()   - Start Colour Rush mode');
      console.log('========================================');
    }
  };
  
  // Store gameConfig reference after initialization
  const originalLoad = window.onload;
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Attempt to capture gameConfig from the closure
      // This is a bit hacky but useful for debugging
      console.log('[main.js] Debug helpers ready - type bubblePopDebug.help() for commands');
    }, 1000);
  });
  
  console.log('[main.js] Debug utilities loaded - access via: window.bubblePopDebug');
  console.log('[main.js] Type bubblePopDebug.help() for available commands');
}

/* ===========================================================================
   FEATURE FLAGS / HELPERS
   ===========================================================================*/

/**
 * Determine if "frenzy" features are enabled for a given mode.
 * Falls back to true if a mode-specific config isn't present.
 * @param {'classic'|'survival'|'colourrush'} mode
 * @returns {boolean}
 */
// No global frenzy mode enable/disable in this project. Classic and Survival
// manage their own behavior internally; Colour Rush is configured via COLOUR_RUSH_CONFIG.

/* ===========================================================================
   EXPORTS (if using modules in other files)
   ===========================================================================*/

export {
  showMainMenu,
  validateAllConfigs
};
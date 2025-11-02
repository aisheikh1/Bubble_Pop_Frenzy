// src/js/game.js
// Parent Game Orchestrator - Manages game modes and provides shared utilities

import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { FloatingTextEffect } from './effects/FloatingTextEffect.js';
import { effects } from './effects/EffectManager.js';
import { CountdownTextEffect } from './effects/CountdownTextEffect.js';
import { scoringService } from './ScoringEngine/index.js';
import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';

// Import game mode implementations
import { ClassicMode } from './ClassicMode.js';
import { SurvivalMode } from './SurvivalMode.js';
import { ColourRushMode } from './ColourRushMode.js';

/* ---------------------------
   Compatibility shim for effects
   ---------------------------*/
if (effects && typeof effects.add !== 'function' && typeof effects.spawn === 'function') {
  effects.add = (...args) => effects.spawn(...args);
}

/* ===========================================================================
   GAME MODE REGISTRY
   ===========================================================================*/

const MODE_REGISTRY = {
  classic: null,
  survival: null,
  colourrush: null  // ✅ FIX 1: Added colourrush to registry
};

let activeMode = null;
let activeModeKey = null;

/* ===========================================================================
   SHARED GAME STATE
   ===========================================================================*/

let gameConfig = {};
let pauseOverlay = null;

/* ===========================================================================
   SHARED UTILITIES - Available to all game modes
   ===========================================================================*/

/**
 * Spawn floating points text effect
 * @param {number} points - Points to display
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} color - Text color
 */
function spawnPointsText(points, x, y, color) {
  const sign = points > 0 ? '+' : '';
  effects.spawn(new FloatingTextEffect(x, y, sign + String(points), color || '#ffffff'));
}

/**
 * Set back button visibility
 * @param {boolean} visible - Show or hide
 */
function setBackButtonVisible(visible) {
  if (gameConfig?.backButton) {
    visible ? gameConfig.backButton.show() : gameConfig.backButton.hide();
  }
}

/**
 * Set restart button visibility
 * @param {boolean} visible - Show or hide
 */
function setRestartButtonVisible(visible) {
  if (gameConfig?.restartButton) {
    visible ? gameConfig.restartButton.show() : gameConfig.restartButton.hide();
  }
}

/**
 * Set pause button visibility
 * @param {boolean} visible - Show or hide
 */
function setPauseButtonVisible(visible) {
  if (gameConfig?.pauseButton) {
    visible ? gameConfig.pauseButton.show() : gameConfig.pauseButton.hide();
  }
}

/**
 * Show pause overlay
 */
function showPauseOverlay() {
  if (!pauseOverlay) {
    pauseOverlay = document.createElement('div');
    pauseOverlay.className = 'paused-overlay';
    pauseOverlay.textContent = 'Game Paused';
    const container = document.querySelector('.game-container');
    if (container) container.appendChild(pauseOverlay);
  }
}

/**
 * Hide pause overlay
 */
function hidePauseOverlay() {
  if (pauseOverlay) {
    pauseOverlay.remove();
    pauseOverlay = null;
  }
}

/**
 * Start countdown before game begins
 * @param {Object} config - Game configuration
 * @returns {Promise} Resolves when countdown completes
 */
async function startCountdown(config) {
  const countdownValues = ['3', '2', '1', 'Pop!'];
  let countdownRunning = true;
  let last = performance.now();

  function loop(now) {
    if (!countdownRunning) return;
    const dt = (now - last) / 1000;
    last = now;
    config.canvasManager.clear();
    effects.update(dt, now);
    effects.draw(config.canvasManager.context);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  for (let i = 0; i < countdownValues.length; i++) {
    effects.spawn(new CountdownTextEffect(countdownValues[i], 500));
    await new Promise(r => setTimeout(r, 500));
  }

  countdownRunning = false;
}

/* ===========================================================================
   MODE MANAGEMENT
   ===========================================================================*/

/**
 * Register a game mode implementation
 * @param {string} key - Mode identifier (e.g., 'classic', 'survival', 'colourrush')
 * @param {Object} ModeClass - Mode class constructor
 */
function registerMode(key, ModeClass) {
  MODE_REGISTRY[key] = ModeClass;
}

/**
 * Get registered mode class
 * @param {string} key - Mode identifier
 * @returns {Object|null} Mode class or null if not found
 */
function getMode(key) {
  return MODE_REGISTRY[key] || null;
}

/**
 * Initialize game mode instances
 * Should be called once during app initialization
 */
function initializeModes() {
  registerMode('classic', ClassicMode);
  registerMode('survival', SurvivalMode);
  registerMode('colourrush', ColourRushMode);  // ✅ FIX 2: Register ColourRushMode
  
  console.log('[game.js] Registered modes:', Object.keys(MODE_REGISTRY));
}

/**
 * Create and activate a game mode
 * @param {string} modeKey - Mode identifier
 * @param {Object} config - Game configuration object
 * @returns {Object|null} Mode instance or null if failed
 */
function activateMode(modeKey, config) {
  const ModeClass = getMode(modeKey);
  
  if (!ModeClass) {
    console.error(`[game.js] Mode not found: ${modeKey}`);
    return null;
  }

  // Deactivate previous mode if any
  if (activeMode) {
    try {
      activeMode.cleanup?.();
    } catch (err) {
      console.error('[game.js] Error cleaning up previous mode:', err);
    }
  }

  // Create new mode instance
  try {
    activeMode = new ModeClass(config);
    activeModeKey = modeKey;
    console.log(`[game.js] Activated mode: ${modeKey}`);
    return activeMode;
  } catch (err) {
    console.error(`[game.js] Error creating mode ${modeKey}:`, err);
    return null;
  }
}

/* ===========================================================================
   GAME CONTROL - Public API (Called by main.js)
   ===========================================================================*/

/**
 * Prepare and start a game mode
 * @param {Object} config - Game configuration object
 * @param {string} modeKey - Mode identifier ('classic', 'survival', or 'colourrush')
 */
async function startGame(config, modeKey) {
  gameConfig = config;
  
  const mode = activateMode(modeKey, config);
  
  if (!mode) {
    showMessageBox(
      'Error',
      `Failed to load ${modeKey} mode. Please try again.`,
      [{ label: 'OK', action: () => goToMainMenu() }]
    );
    return;
  }

  try {
    await mode.prepareGame();
    
    // Show countdown
    await startCountdown(config);
    
    // Start the actual game
    mode.startGame();
  } catch (err) {
    console.error('[game.js] Error starting game:', err);
    showMessageBox(
      'Error',
      'Failed to start game. Please try again.',
      [{ label: 'OK', action: () => goToMainMenu() }]
    );
  }
}

/**
 * Handle canvas pointer down (tap/click)
 * Delegates to active mode
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function handleCanvasPointerDown(x, y) {
  if (activeMode && typeof activeMode.handlePointerDown === 'function') {
    activeMode.handlePointerDown(x, y);
  }
}

/**
 * Toggle pause state
 * Delegates to active mode
 */
function togglePause() {
  if (activeMode && typeof activeMode.pause === 'function') {
    activeMode.pause();
  }
}

/**
 * Restart current game
 * Delegates to active mode
 */
async function restartGame() {
  if (activeMode && typeof activeMode.restart === 'function') {
    await activeMode.restart();
    
    // After mode prepares, run countdown and start
    await startCountdown(gameConfig);
    activeMode.startGame();
  }
}

/**
 * Update UI displays
 * Delegates to active mode
 */
function updateUI() {
  if (activeMode && typeof activeMode.updateUI === 'function') {
    activeMode.updateUI();
  }
}

/**
 * End current game
 * Delegates to active mode
 */
function endGame() {
  if (activeMode && typeof activeMode.endGame === 'function') {
    activeMode.endGame();
  }
}

/**
 * Return to main menu
 * Cleans up active mode and shows mode selection
 */
function goToMainMenu() {
  // Cleanup active mode
  if (activeMode) {
    try {
      activeMode.cleanup?.();
    } catch (err) {
      console.error('[game.js] Error during mode cleanup:', err);
    }
    activeMode = null;
    activeModeKey = null;
  }

  // Hide canvas and reset UI
  if (gameConfig?.canvasManager) {
    gameConfig.canvasManager.hide();
  }
  
  setBackButtonVisible(false);
  setRestartButtonVisible(false);
  setPauseButtonVisible(false);
  hidePauseOverlay();

  // Reset global systems
  if (gameConfig?.pauseButton) {
    gameConfig.pauseButton.reset();
  }
  
  BubbleSpawnConfig.resetSpawnState();
  
  if (scoringService?.reset) {
    scoringService.reset();
  }

  // Show mode selection
  showModeSelection();
}

/**
 * Show mode selection menu
 */
async function showModeSelection() {
  await hideMessageBox();
  
  if (gameConfig?.gameInfo) {
    gameConfig.gameInfo.style.display = 'none';
  }
  
  setBackButtonVisible(false);
  setPauseButtonVisible(false);
  setRestartButtonVisible(false);

  showMessageBox(
    'Select Mode',
    'Choose your game mode:',
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
      },
      { 
        label: 'Colour Rush',  // ✅ FIX 3: Added Colour Rush button
        action: async () => { 
          await hideMessageBox(); 
          startGame(gameConfig, 'colourrush'); 
        } 
      }
    ]
  );
}

/* ===========================================================================
   EXPORTS
   ===========================================================================*/

export {
  // Core game control
  startGame,
  handleCanvasPointerDown,
  togglePause,
  restartGame,
  updateUI,
  endGame,
  goToMainMenu,
  
  // Mode management
  registerMode,
  getMode,
  initializeModes,
  showModeSelection,
  
  // Shared utilities
  spawnPointsText,
  setBackButtonVisible,
  setRestartButtonVisible,
  setPauseButtonVisible,
  showPauseOverlay,
  hidePauseOverlay,
  
  // Shared systems (re-export for modes)
  effects,
  scoringService,
  BubbleSpawnConfig
};
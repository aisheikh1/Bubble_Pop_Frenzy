// src/js/main.js

// Import device manager FIRST for early initialization
import { 
  initializeDevice, 
  getDeviceInfo, 
  onResize,
  getRecommendedCanvasDimensions,
  getUIScaling,
  getRecommendedGameSettings
} from './deviceManager.js';

import { startGame, handleCanvasPointerDown, updateUI } from './game.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { CanvasManager } from './canvasManager.js';
import { initializeAnimatedTitle, preloadTitleAnimations } from './gametitlemanagement/index.js';

// Declare variables to hold DOM elements
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

// Canvas manager will be initialized in the load event
export let canvasManager;

// Device info will be available after initialization
export let deviceInfo;

// Title cleanup function
let titleCleanupFunction = null;

// Resize unsubscribe function
let resizeUnsubscribe = null;

/**
 * Initialize the animated game title
 */
function initializeGameTitle() {
  try {
    // Find or create the game title element
    gameTitleElement = document.querySelector('.game-title');
    
    if (!gameTitleElement) {
      // Create the title element if it doesn't exist
      const gameHeader = document.createElement('div');
      gameHeader.className = 'game-header';
      gameHeader.innerHTML = `
        <h1 class="game-title">🎯 Bubble Pop Frenzy!</h1>
        <div class="game-subtitle">Pop bubbles, score points, have fun!</div>
      `;
      
      // Insert at the beginning of game container
      const gameContainer = document.querySelector('.game-container');
      if (gameContainer) {
        gameContainer.insertBefore(gameHeader, gameContainer.firstChild);
        gameTitleElement = gameHeader.querySelector('.game-title');
      }
    }

    // Initialize animated title if element exists
    if (gameTitleElement) {
      titleCleanupFunction = initializeAnimatedTitle(gameTitleElement, {
        fallbackOnError: true,
        respectReducedMotion: true
      });
    }
  } catch (error) {
    console.warn('Failed to initialize animated title:', error);
    // Continue without animated title - non-critical feature
  }
}

/**
 * Clean up animated title when needed
 */
function cleanupGameTitle() {
  if (titleCleanupFunction && typeof titleCleanupFunction === 'function') {
    titleCleanupFunction();
    titleCleanupFunction = null;
  }
}

/**
 * Apply device-specific UI adjustments
 */
function applyDeviceUIAdjustments(deviceInfo, uiScaling) {
  // Apply font size scaling to game info
  if (gameInfo) {
    const baseFontSize = uiScaling.baseFontSize || 16;
    gameInfo.style.fontSize = `${baseFontSize * uiScaling.text}px`;
  }

  // Adjust message box for mobile
  if (messageBox && deviceInfo.isMobile) {
    messageBox.style.maxWidth = '95%';
    messageBox.style.padding = '1.5rem';
  }

  // Add mobile-specific class for CSS targeting
  if (document.body) {
    if (deviceInfo.isMobile) {
      document.body.classList.add('mobile-device');
      document.body.classList.remove('desktop-device');
    } else {
      document.body.classList.add('desktop-device');
      document.body.classList.remove('mobile-device');
    }
    
    // Add orientation class
    document.body.classList.remove('portrait', 'landscape');
    document.body.classList.add(deviceInfo.orientation);
  }

  console.log('✅ Applied device-specific UI adjustments');
}

/**
 * Show the main menu with game mode selection
 */
function showMainMenu(gameConfig) {
  const { deviceInfo } = gameConfig;
  
  // Adjust message based on device type
  const subtitle = deviceInfo.isMobile 
    ? "Tap to select a game mode!"
    : "Click to select a game mode!";

  showMessageBox(
    "Bubble Pop Frenzy!",
    subtitle,
    [{
      label: "Classic Mode",
      action: () => {
        hideMessageBox();
        startGame(gameConfig, 'classic');
      }
    }, {
      label: "Survival Mode",
      action: () => {
        hideMessageBox();
        startGame(gameConfig, 'survival');
      }
    }]
  );
}

/**
 * Handle device changes (resize, orientation)
 */
function handleDeviceChange(gameConfig) {
  return (newDeviceInfo, changeInfo) => {
    console.log('📐 Device changed:', {
      orientation: changeInfo.orientationChanged ? 'YES' : 'NO',
      resize: changeInfo.significantResize ? 'YES' : 'NO',
      newWidth: newDeviceInfo.screenWidth,
      newOrientation: newDeviceInfo.orientation
    });
    
    // Update canvas dimensions if significant resize or orientation change
    if (changeInfo.significantResize || changeInfo.orientationChanged) {
      const newDimensions = getRecommendedCanvasDimensions();
      const newUIScaling = getUIScaling();
      
      // Update canvas manager
      if (canvasManager && canvasManager.updateDimensions) {
        canvasManager.updateDimensions(newDimensions);
        console.log('🖼️ Canvas updated to:', newDimensions);
      }
      
      // Update game config references
      Object.assign(gameConfig.deviceInfo, newDeviceInfo);
      Object.assign(gameConfig.uiScaling, newUIScaling);
      Object.assign(gameConfig.canvasDimensions, newDimensions);
      
      // Reapply UI adjustments
      applyDeviceUIAdjustments(newDeviceInfo, newUIScaling);
    }
  };
}

/**
 * Main initialization function
 */
function initializeGame() {
  try {
    // STEP 1: Initialize device manager FIRST
    deviceInfo = initializeDevice();
    console.log('📱 Detected device info:', {
      type: deviceInfo.deviceType,
      screen: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
      dpr: deviceInfo.devicePixelRatio,
      orientation: deviceInfo.orientation,
      touch: deviceInfo.isTouchDevice
    });
    
    // Get UI scaling recommendations
    const uiScaling = getUIScaling();
    console.log('🎨 UI Scaling factors:', {
      text: uiScaling.text,
      bubbles: uiScaling.bubbles,
      viewport: uiScaling.viewport
    });
    
    // Get recommended canvas dimensions
    const canvasDimensions = getRecommendedCanvasDimensions();
    console.log('🖼️ Recommended canvas:', canvasDimensions);
    
    // Get recommended game settings
    const gameSettings = getRecommendedGameSettings();
    console.log('🎮 Recommended game settings:', gameSettings);

    // STEP 2: Preload title animations for better performance
    try {
      preloadTitleAnimations();
    } catch (error) {
      console.warn('Failed to preload title animations:', error);
    }

    // STEP 3: Initialize Canvas Manager with device-aware dimensions
    canvasManager = new CanvasManager("gameCanvas", canvasDimensions
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
    canvasManager = new CanvasManager("gameCanvas", canvasDimensions);
    console.log('✅ Canvas Manager initialized');

    // STEP 4: Get DOM elements
    scoreDisplay = document.getElementById("scoreDisplay");
    modeDisplay = document.getElementById("modeDisplay");
    classicTimerDisplay = document.getElementById("classicTimerDisplay");
    survivalStatsDisplay = document.getElementById("survivalStatsDisplay");
    survivalTimeElapsedDisplay = document.getElementById("survivalTimeElapsedDisplay");
    survivalMissesDisplay = document.getElementById("survivalMissesDisplay");
    messageBox = document.getElementById("messageBox");
    messageTitle = document.getElementById("messageTitle");
    messageText = document.getElementById("messageText");
    buttonContainer = document.getElementById("buttonContainer");
    gameInfo = document.getElementById("gameInfo");
    gameContainer = document.querySelector(".game-container");

    // Verify critical DOM elements
    if (!scoreDisplay || !messageBox || !gameInfo || !gameContainer) {
      throw new Error('Critical DOM elements not found');
    }

    console.log('✅ DOM elements loaded');

    // STEP 5: Initialize animated game title
    initializeGameTitle();

    // STEP 6: Create comprehensive game configuration object
    const gameConfig = {
      // Canvas references
      canvasManager,
      canvas: canvasManager.element,  // For backward compatibility
      ctx: canvasManager.context,     // For backward compatibility
      
      // UI elements
      scoreDisplay,
      modeDisplay,
      classicTimerDisplay,
      survivalStatsDisplay,
      survivalTimeElapsedDisplay,
      survivalMissesDisplay,
      gameInfo,
      gameContainer,
      
      // Device information (NEW)
      deviceInfo: { ...deviceInfo },
      uiScaling: { ...uiScaling },
      canvasDimensions: { ...canvasDimensions },
      gameSettings: { ...gameSettings }
    };

    console.log('✅ Game config created');

    // STEP 7: Apply device-specific UI adjustments
    applyDeviceUIAdjustments(deviceInfo, uiScaling);

    // STEP 8: Register for device changes (resize/orientation)
    resizeUnsubscribe = onResize(handleDeviceChange(gameConfig));
    console.log('✅ Resize listener registered');

    // STEP 9: Show main menu
    showMainMenu(gameConfig);
    console.log('✅ Main menu displayed');

    // STEP 10: Set up pointer/touch handler using canvas manager's element
    canvasManager.element.addEventListener("pointerdown", (e) => {
      const rect = canvasManager.element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleCanvasPointerDown(x, y);
    });
    console.log('✅ Pointer handler attached');

    // STEP 11: Add touch-specific handlers for mobile
    if (deviceInfo.isTouchDevice) {
      // Prevent context menu on long press
      canvasManager.element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      
      // Prevent default touch behaviors
      canvasManager.element.addEventListener('touchstart', (e) => {
        // Allow the pointerdown event to handle the touch
        e.preventDefault();
      }, { passive: false });
      
      console.log('✅ Touch handlers configured');
    }

    console.log('🎮 Game initialization complete!');
    
  } catch (error) {
    console.error('❌ Fatal error during game initialization:', error);
    
    // Show user-friendly error message
    if (messageBox && messageTitle && messageText && buttonContainer) {
      messageTitle.innerHTML = 'Initialization Error';
      messageText.textContent = 'Failed to start the game. Please refresh the page.';
      buttonContainer.innerHTML = '<button onclick="window.location.reload()">Refresh Page</button>';
      messageBox.classList.add('show');
    } else {
      // Fallback if even the message box isn't available
      alert('Failed to initialize game. Please refresh the page.');
    }
  }
}

/**
 * Cleanup function (if needed for page unload)
 */
function cleanup() {
  console.log('🧹 Cleaning up...');
  
  // Clean up title animation
  cleanupGameTitle();
  
  // Unsubscribe from resize events
  if (resizeUnsubscribe && typeof resizeUnsubscribe === 'function') {
    resizeUnsubscribe();
    resizeUnsubscribe = null;
  }
  
  // Clean up canvas manager
  if (canvasManager && canvasManager.destroy) {
    canvasManager.destroy();
  }
  
  console.log('✅ Cleanup complete');
}

// Event listener for window load to ensure DOM is ready
window.addEventListener('load', initializeGame);

// Optional: Add cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Add global error handler for better debugging
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Export the cleanup function for potential use by other modules
export { cleanupGameTitle, cleanup };
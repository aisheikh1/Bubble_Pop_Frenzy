// src/js/main.js

import { startGame, handleCanvasPointerDown, updateUI, goToMainMenu, restartGame, togglePause } from './game.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { CanvasManager } from './canvasManager.js';
import { initializeAnimatedTitle, preloadTitleAnimations } from './gametitlemanagement/index.js';
import { BackButton } from './ui/BackButton.js';
import { RestartButton } from './ui/RestartButton.js';
import { PauseButton } from './ui/PauseButton.js';

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

// Title cleanup function
let titleCleanupFunction = null;

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
        <h1 class="game-title">Bubble Pop Frenzy!</h1>
        
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
 * Show the main menu with game mode selection
 */
async function showMainMenu(gameConfig) {
  showMessageBox(
    "Bubble Pop Frenzy!",
    "Select a game mode to begin.", [{
      label: "Classic Mode",
      action: async () => {
        await hideMessageBox();
        startGame(gameConfig, 'classic');
      }
    }, {
      label: "Survival Mode",
      action: async () => {
        await hideMessageBox();
        startGame(gameConfig, 'survival');
      }
    }]
  );
}

// Event listener for window load to ensure DOM is ready
window.addEventListener('load', () => {
  // Preload title animations for better performance
  preloadTitleAnimations();

  // Initialize Canvas Manager
  canvasManager = new CanvasManager("gameCanvas");

  // Get DOM elements
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

  // Build the Back button module (auto-inserts under canvas)
  const backButton = new BackButton(gameContainer, canvasManager.element);
  backButton.onClick(() => goToMainMenu());
  
  // Get the below-canvas container that BackButton created
  const belowCanvas = document.querySelector('.below-canvas');
  
  // Build the Pause button in the same below-canvas region
  const pauseButton = new PauseButton(belowCanvas);
  pauseButton.onClick(() => togglePause());
  
  // Build the Restart button in the same below-canvas region
  const restartButton = new RestartButton(belowCanvas);
  restartButton.onClick(() => restartGame());

  // Initialize animated game title
  initializeGameTitle();

  // Create a single config object to pass to the game logic
  const gameConfig = {
    canvasManager,
    canvas: canvasManager.element,  // For backward compatibility with existing code
    ctx: canvasManager.context,     // For backward compatibility with existing code
    scoreDisplay,
    modeDisplay,
    classicTimerDisplay,
    survivalStatsDisplay,
    survivalTimeElapsedDisplay,
    survivalMissesDisplay,
    gameInfo,
    backButton,      // adding back button
    pauseButton,     // adding pause button
    restartButton    // adding restart button
  };

  // Show main menu
  showMainMenu(gameConfig);

  // Set up pointer handler using canvas manager's element
  canvasManager.element.addEventListener("pointerdown", (e) => {
    const rect = canvasManager.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasPointerDown(x, y);
  });

  // Add global error handler for better debugging
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
});

// Export the cleanup function for potential use by other modules
export { cleanupGameTitle };
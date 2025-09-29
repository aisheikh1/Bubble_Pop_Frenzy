// src/js/main.js

import { startGame, handleCanvasPointerDown, updateUI } from './game.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { CanvasManager } from './canvasManager.js';

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

// Canvas manager will be initialized in the load event
export let canvasManager;

// Event listener for window load to ensure DOM is ready
window.addEventListener('load', () => {
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
  gameContainer = document.getElementById("game-container");

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
    gameInfo
  };

  // Initial game setup
  showMessageBox(
    "Bubble Pop Frenzy!",
    "Select a game mode to begin.", [{
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

  // Set up pointer handler using canvas manager's element
  canvasManager.element.addEventListener("pointerdown", (e) => {
    const rect = canvasManager.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasPointerDown(x, y);
  });
});
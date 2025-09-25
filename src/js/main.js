// src/js/main.js

import { startGame, handleCanvasPointerDown, updateUI } from './game.js'; // Import handleCanvasPointerDown and updateUI
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { resizeCanvas } from './utils/resizeCanvas.js';

// Declare variables to hold DOM elements, initialized later
export let canvas;
export let ctx;
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

// Event listener for window load to ensure DOM is ready
window.addEventListener('load', () => {
  // Get DOM elements here, after the document is loaded
  canvas = document.getElementById("gameCanvas");
  // Check if canvas exists before trying to get context
  if (canvas) {
    ctx = canvas.getContext("2d");
  } else {
    console.error("Error: gameCanvas element not found!");
    return; // Stop execution if canvas is not found
  }

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

  resizeCanvas(canvas);

  // Create a single config object to pass to the game logic
  const gameConfig = {
    canvas,
    ctx,
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

  // Event listener for window resize to adjust canvas
  // Pass the canvas element to resizeCanvas on resize
  window.addEventListener("resize", () => resizeCanvas(canvas));

  // The canvas pointerdown listener should be attached here, after canvas is defined
  // It now correctly calls the handleCanvasPointerDown function from game.js
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect(); // Get canvas dimensions and position
    const x = e.clientX - rect.left; // Calculate x-coordinate relative to canvas
    const y = e.clientY - rect.top; // Calculate y-coordinate relative to canvas
    handleCanvasPointerDown(x, y);
  });
});

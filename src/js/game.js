// src/js/game.js

import { Bubble, spawnBubble } from './bubbles.js';
import { showUrgentMessage } from './ui/urgentMessage.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';

// Game State Variables
let bubbles = [];
let gameActive = false;
let classicTimeLeft = 60;
let survivalTimeElapsed = 0;
let survivalGracePeriodLeft = 5;
let isGracePeriodActive = true;
let score = 0;
let lastFrameTime = 0;
let gameMode = 'classic';
let gameStartTime = 0;
let maxBubbles = 3;
let difficultyTimer = 0;
let missedBubblesCount = 0;
const MAX_MISSES = 5;

// Combo and Freeze Mode Variables
let consecutivePops = 0;
let freezeBubbleSpawnPending = false;
let isFreezeModeActive = false;
let freezeModeTimeLeft = 0;
const FREEZE_DURATION = 5; // seconds for freeze mode
const COMBO_NEEDED = 10; // Consecutive pops for freeze power-up

// Constants for bubble types and chances
const DECOY_CHANCE_MAX = 0.2;
const DOUBLE_TAP_CHANCE_MAX = 0.15;
let decoyChance = 0;
let doubleTapChance = 0;

let gameTimerInterval; // To hold the setInterval ID

// DOM elements that will be passed from main.js or obtained within the module itself
// For now, we'll assume they are passed as arguments to startGame and gameLoop.
let gameCanvas;
let gameContext; // 2D rendering context
let scoreDisplay;
let modeDisplay;
let classicTimerDisplay;
let survivalStatsDisplay;
let survivalTimeElapsedDisplay;
let survivalMissesDisplay;
let gameInfo;


/**
 * Centralized game over logic.
 */
function endGame() {
  gameActive = false;
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
  }
  let gameOverTitle = 'Game Over!';
  let gameOverText = `Your Score: ${score}`;

  if (gameMode === 'survival') {
    gameOverText = `Your Score: ${score}\nYou missed ${missedBubblesCount} bubbles!`;
  }

  showMessageBox(
    gameOverTitle,
    gameOverText,
    { label: "Play Again", action: () => startGame(gameCanvas, gameContext, scoreDisplay, modeDisplay, classicTimerDisplay, survivalStatsDisplay, survivalTimeElapsedDisplay, survivalMissesDisplay, gameInfo, gameMode) }, // Pass current mode
    { label: "Classic Mode", action: () => startGame(gameCanvas, gameContext, scoreDisplay, modeDisplay, classicTimerDisplay, survivalStatsDisplay, survivalTimeElapsedDisplay, survivalMissesDisplay, gameInfo, 'classic') },
    { label: "Survival Mode", action: () => startGame(gameCanvas, gameContext, scoreDisplay, modeDisplay, classicTimerDisplay, survivalStatsDisplay, survivalTimeElapsedDisplay, survivalMissesDisplay, gameInfo, 'survival') }
  );
  if (gameInfo) gameInfo.style.display = "none";
  if (gameCanvas) gameCanvas.style.display = "none";
}

/**
 * Increases game difficulty in survival mode based on time elapsed.
 */
function increaseDifficulty() {
  if (gameMode !== 'survival' || isFreezeModeActive) return;

  const timeSurvived = (performance.now() - gameStartTime) / 1000;

  maxBubbles = Math.min(8, 3 + Math.floor(timeSurvived / 15));

  if (timeSurvived - difficultyTimer > 10) {
    difficultyTimer = timeSurvived;
    bubbles.forEach(b => {
      b.speedX *= 1.05;
      b.speedY *= 1.05;
      b.wobbleSpeed *= 1.05;
    });
  }

  decoyChance = Math.min(DECOY_CHANCE_MAX, timeSurvived / 200);
  doubleTapChance = Math.min(DOUBLE_TAP_CHANCE_MAX, timeSurvived / 250);
}

/**
 * The main game loop, updates and draws game elements.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function gameLoop(currentTime) {
  if (!gameActive) return;

  if (!lastFrameTime) lastFrameTime = currentTime;
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  if (gameMode === 'survival') {
    increaseDifficulty();
  }

  // Filter out dead bubbles first to avoid processing them
  bubbles = bubbles.filter(b => !b.dead);

  const bubbleUpdateContext = {
    gameMode,
    isFreezeModeActive,
    isGracePeriodActive,
    MAX_MISSES, // MAX_MISSES is still passed for the urgent message
    showUrgentMessage,
    endGame,
    canvas: gameCanvas // Pass canvas to Bubble.update
  };

  for (const bubble of bubbles) {
    // Pass relevant game state and functions to bubble.update
    const wasMissed = bubble.update(deltaTime, currentTime,
      bubbleUpdateContext.gameMode,
      bubbleUpdateContext.isFreezeModeActive,
      bubbleUpdateContext.isGracePeriodActive,
      bubbleUpdateContext.MAX_MISSES,
      bubbleUpdateContext.showUrgentMessage,
      bubbleUpdateContext.endGame,
      bubbleUpdateContext.canvas
    );

    // IMPORTANT CHANGE: Check if the bubble.update signaled a miss
    if (wasMissed) {
        missedBubblesCount++; // Increment the module-level missedBubblesCount
        if (survivalMissesDisplay) survivalMissesDisplay.textContent = `Misses: ${missedBubblesCount}`;

        // Add the canvas shake effect here
        if (gameCanvas) {
          gameCanvas.style.transform = 'translateX(5px)';
          setTimeout(() => {
              gameCanvas.style.transform = 'translateX(-5px)';
              setTimeout(() => {
                  gameCanvas.style.transform = '';
              }, 50);
          }, 50);
        }
        // showUrgentMessage for missed bubble is now triggered directly by the bubble.update method itself.
        // It should still have the correct context from the parameters.

        if (missedBubblesCount >= MAX_MISSES) {
            endGame(); // Call endGame from game.js
        }
    }

    bubble.draw(gameContext); // Pass ctx to bubble.draw
  }

  const spawnContext = {
    canvas: gameCanvas,
    gameMode,
    gameStartTime,
    isFreezeModeActive,
    freezeBubbleSpawnPending,
    maxBubbles,
    decoyChance,
    doubleTapChance
  };

  if (!isFreezeModeActive && !freezeBubbleSpawnPending && bubbles.length < maxBubbles) {
      const newBubble = spawnBubble('normal', false, spawnContext);
      if (newBubble) bubbles.push(newBubble);
  } else if (freezeBubbleSpawnPending && !bubbles.some(b => b.type === 'freeze')) {
      const newBubble = spawnBubble('freeze', false, spawnContext);
      if (newBubble) bubbles.push(newBubble);
  }


  requestAnimationFrame(gameLoop);
}


/**
 * Starts a new game session.
 * @param {HTMLCanvasElement} canvasElement - The game canvas DOM element.
 * @param {CanvasRenderingContext2D} ctxElement - The 2D rendering context of the canvas.
 * @param {HTMLElement} displayScore - The score display DOM element.
 * @param {HTMLElement} displayMode - The mode display DOM element.
 * @param {HTMLElement} displayClassicTimer - The classic timer display DOM element.
 * @param {HTMLElement} displaySurvivalStats - The survival stats display DOM element.
 * @param {HTMLElement} displaySurvivalTimeElapsed - The survival time elapsed display DOM element.
 * @param {HTMLElement} displaySurvivalMisses - The survival misses display DOM element.
 * @param {HTMLElement} infoGame - The game info container DOM element.
 * @param {string} mode - The game mode ('classic' or 'survival').
 */
function startGame(canvasElement, ctxElement, displayScore, displayMode, classicTimerDisplay,
                   displaySurvivalStats, displaySurvivalTimeElapsed, displaySurvivalMisses, infoGame, mode) {

  // Assign DOM elements to module-level variables
  gameCanvas = canvasElement;
  gameContext = ctxElement;
  scoreDisplay = displayScore;
  modeDisplay = displayMode;
  classicTimerDisplay = classicTimerDisplay;
  survivalStatsDisplay = displaySurvivalStats;
  survivalTimeElapsedDisplay = displaySurvivalTimeElapsed;
  survivalMissesDisplay = displaySurvivalMisses;
  gameInfo = infoGame;

  // Clear any existing timer interval to prevent multiple timers running
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
  }

  gameMode = mode || 'classic';
  gameActive = true;
  score = 0;
  bubbles = [];
  gameStartTime = performance.now();
  lastFrameTime = 0;
  difficultyTimer = 0;
  decoyChance = 0;
  doubleTapChance = 0;
  maxBubbles = 3;

  consecutivePops = 0;
  freezeBubbleSpawnPending = false;
  isFreezeModeActive = false;
  freezeModeTimeLeft = 0;

  // Reset missed bubbles count here at the start of a new game
  missedBubblesCount = 0;

  if (gameMode === 'classic') {
    classicTimeLeft = 60;
    if (classicTimerDisplay) classicTimerDisplay.style.display = "block";
    if (survivalStatsDisplay) survivalStatsDisplay.style.display = "none";
    if (classicTimerDisplay) classicTimerDisplay.textContent = `Time: ${classicTimeLeft}s`;
  } else { // survival mode
    classicTimeLeft = 999;
    survivalTimeElapsed = 0;
    survivalGracePeriodLeft = 5;
    isGracePeriodActive = true;
    if (classicTimerDisplay) classicTimerDisplay.style.display = "none";
    if (survivalStatsDisplay) survivalStatsDisplay.style.display = "flex";
    if (survivalTimeElapsedDisplay) survivalTimeElapsedDisplay.textContent = `Time: ${survivalGracePeriodLeft}s (Grace)`;
    // Ensure this display is updated correctly on game start
    if (survivalMissesDisplay) survivalMissesDisplay.textContent = `Misses: ${missedBubblesCount}`;
  }

  hideMessageBox();
  if (gameInfo) gameInfo.style.display = "flex";
  if (modeDisplay) {
    modeDisplay.style.display = "block";
    modeDisplay.textContent = `Mode: ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}`;
  }
  if (gameCanvas) gameCanvas.style.display = "block";
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;

  const initialSpawnContext = {
    canvas: gameCanvas,
    gameMode,
    gameStartTime,
    isFreezeModeActive, // Should be false here
    freezeBubbleSpawnPending, // Should be false here
    maxBubbles,
    decoyChance,
    doubleTapChance
  };

  for (let i = 0; i < maxBubbles; i++) {
    const newBubble = spawnBubble('normal', false, initialSpawnContext);
    if (newBubble) bubbles.push(newBubble);
  }

  requestAnimationFrame(gameLoop);

  gameTimerInterval = setInterval(() => {
    if (!gameActive) {
        clearInterval(gameTimerInterval);
        return;
    }

    if (gameMode === 'classic') {
      classicTimeLeft--;
      if (classicTimerDisplay) classicTimerDisplay.textContent = `Time: ${classicTimeLeft}s`;
      if (classicTimeLeft <= 0) {
        endGame();
      }
    } else { // Survival mode
      if (isFreezeModeActive) {
        freezeModeTimeLeft--;
        if (survivalTimeElapsedDisplay) survivalTimeElapsedDisplay.textContent = `Time: ${freezeModeTimeLeft}s (FRENZY)`;
        if (survivalMissesDisplay) survivalMissesDisplay.textContent = `Misses: ${missedBubblesCount}`;
        if (freezeModeTimeLeft <= 0) {
            isFreezeModeActive = false;
            bubbles = [];
            lastFrameTime = performance.now();
            const postFreezeSpawnContext = {
              canvas: gameCanvas,
              gameMode, // current game mode
              gameStartTime,
              isFreezeModeActive: false, // frenzy is active for these spawns
              freezeBubbleSpawnPending: false,
              decoyChance: 0, // No special bubbles during frenzy
              doubleTapChance: 0 // No special bubbles during frenzy
            };
            for (let j = 0; j < maxBubbles; j++) { // Changed to maxBubbles for post-frenzy spawn
              const newBubble = spawnBubble('normal', false, postFreezeSpawnContext);
              if (newBubble) bubbles.push(newBubble);
            }
            showUrgentMessage("BACK TO NORMAL!", 1000);
            if (survivalTimeElapsedDisplay) survivalTimeElapsedDisplay.textContent = `Time: ${survivalTimeElapsed}s`;
        }
      } else if (isGracePeriodActive) {
        survivalGracePeriodLeft--;
        if (survivalGracePeriodLeft <= 0) {
          isGracePeriodActive = false;
          survivalTimeElapsed = 0;
          if (survivalTimeElapsedDisplay) survivalTimeElapsedDisplay.textContent = `Time: ${survivalTimeElapsed}s`;
          if (survivalMissesDisplay) survivalMissesDisplay.textContent = `Misses: ${missedBubblesCount}`;
        } else {
          if (survivalTimeElapsedDisplay) survivalTimeElapsedDisplay.textContent = `Time: ${survivalGracePeriodLeft}s (Grace)`;
        }
      } else { // Normal survival mode (after grace, not in frenzy)
        survivalTimeElapsed++;
        if (survivalTimeElapsedDisplay) survivalTimeElapsedDisplay.textContent = `Time: ${survivalTimeElapsed}s`;
      }
    }
  }, 1000);
}

/**
 * Handles pointer/mouse down events on the canvas.
 * This function will be called by main.js after it gets the event.
 * @param {number} x - The x-coordinate of the pointer event relative to the canvas.
 * @param {number} y - The y-coordinate of the pointer event relative to the canvas.
 */
function handleCanvasPointerDown(x, y) {
  if (!gameActive) return;

  let poppedAny = false;

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    const dist = Math.sqrt((bubble.x - x) ** 2 + (bubble.y - y) ** 2);

    if (dist < bubble.radius && !bubble.popped) {
      if (bubble.type === 'decoy') {
        score = 0;
        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        showUrgentMessage("SCORE RESET!");
        break;
      } else if (bubble.type === 'freeze') {
        if (gameMode === 'survival' && !isFreezeModeActive) {
            isFreezeModeActive = true;
            freezeBubbleSpawnPending = false;
            freezeModeTimeLeft = FREEZE_DURATION;
            bubbles = [];
            const frenzySpawnContext = {
              canvas: gameCanvas,
              gameMode, // current game mode
              gameStartTime,
              isFreezeModeActive: true, // frenzy is active for these spawns
              freezeBubbleSpawnPending: false,
              decoyChance: 0, // No special bubbles during frenzy
              doubleTapChance: 0 // No special bubbles during frenzy
            };
            for (let j = 0; j < 25; j++) {
                const newBubble = spawnBubble('normal', true, frenzySpawnContext);
                if (newBubble) bubbles.push(newBubble);
            }
            showUrgentMessage("FRENZY TIME!", 2000);
            // scoreDisplay update is handled by normal popping, not here for frenzy start
            lastFrameTime = performance.now();
        }
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        break;
      } else if (bubble.pop()) {
        score += 10;
        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
        poppedAny = true;
        consecutivePops++;
        if (gameMode === 'survival' && consecutivePops % COMBO_NEEDED === 0 && !freezeBubbleSpawnPending && !isFreezeModeActive) {
            freezeBubbleSpawnPending = true;
            showUrgentMessage("FREEZE POWER-UP READY!");
        }
        break;
      }
    }
  }
  if (!poppedAny && gameMode === 'survival' && !isFreezeModeActive) {
      consecutivePops = 0;
  }
}

export { startGame, handleCanvasPointerDown };
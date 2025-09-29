// src/js/game.js

import { Bubble, spawnBubble } from './bubbles.js';
import {
  showUrgentMessage,
  showDifficultyEaseUp,
  showFasterBubbles,
  showMoreBubbles,
  showMaximumIntensity,
  showFreezeEnded,
  showFreezeReady,
  showTimeFreeze,
  showBoom,
  showOuchPenalty,
  showDoublePop
} from './ui/urgentMessage.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { FloatingTextEffect } from './effects/FloatingTextEffect.js';
import { effects } from './effects/EffectManager.js';
import { GiftUnwrapEffect } from './effects/GiftUnwrapEffect.js';
import { BombPrimedEffect } from './effects/BombPrimedEffect.js';
import { ExplosionEffect } from './effects/ExplosionEffect.js';
import { ScreenFlashEffect } from './effects/ScreenFlashEffect.js';

// ---------------------------
// Game State Variables
// ---------------------------
let bubbles = [];
let gameActive = false;

// Time & Scoring
let score = 0;
let consecutivePops = 0;
let consecutiveNormalPops = 0;

// Game Modes
let gameMode = 'classic';
let classicTimeLeft = 60;
let classicStartTime = 0;
let survivalTimeLeft = 60;

// Difficulty Scaling
let bubbleSpeedMultiplier = 1;
let bubbleSpawnInterval = 1000;
let lastDifficultyIncreaseTime = 0;
let difficultyLevel = 1;
let lastIncreaseType = 'spawn';
let bubblesMissed = 0;
let totalBubblesSpawned = 0;
let playerMissRate = 0;

// Power-ups & Special Bubbles
let freezeBubbleSpawnPending = false;
let isFreezeModeActive = false;
let freezeModeTimeLeft = 0;
let bombBubbleSpawnPending = false;
let lastBombSpawnTime = 0;

// Visual Effects
let lastDifficultyEffectTime = 0;
let flashTriggered = false;

// Game Configuration
let gameConfig = {};
let gameCanvas;
let gameCtx;

// Animation Frame
let animFrameId = null;
let lastFrameTime = 0;

// ---------------------------
// Game Constants
// ---------------------------
const GAME_CONSTANTS = {
  // Survival Mode Penalties & Bonuses
  TIME_BONUS_PER_NORMAL_POP: 0.5,
  TIME_BONUS_PER_DOUBLE_TAP: 1,
  TIME_PENALTY_PER_DECOY: 5,
  TIME_PENALTY_PER_MISS: 2,

  // Difficulty Scaling
  DIFFICULTY_INCREASE_INTERVAL: 25000,
  MAX_SPEED_MULTIPLIER: 3.5,
  MIN_SPAWN_INTERVAL: 450,
  MAX_ALLOWED_MISS_RATE: 0.2,

  // Power-up & Bomb
  FREEZE_DURATION: 5,
  COMBO_NEEDED: 10,
  BOMB_SPAWN_INTERVAL: 20000,
};

// ---------------------------
// Game Functions
// ---------------------------

/**
 * Handles the logic for increasing the game's difficulty in Survival Mode.
 * @param {number} now - The current time.
 */
function handleDifficultyIncrease(now) {
  // Visual warning 2 seconds before difficulty increase (single flash)
  if (!flashTriggered && now - lastDifficultyIncreaseTime > GAME_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL - 2000) {
    effects.add(new ScreenFlashEffect('yellow', 0.3));
    flashTriggered = true;
  }
  
  // Actual difficulty increase
  if (now - lastDifficultyIncreaseTime > GAME_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL) {
    difficultyLevel++;
    flashTriggered = false; // Reset the flag for the next interval
    
    // Adaptive speed increase logic
    let speedIncreaseAmount = 0.4;
    let showMessage = true;

    if (lastIncreaseType === 'spawn') {
      // Check miss rate and adjust speed increase
      if (playerMissRate > GAME_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
        speedIncreaseAmount = 0.3; // Player struggling, smaller increase
        showDifficultyEaseUp(difficultyLevel);
        showMessage = false;
      } else {
        speedIncreaseAmount = 0.5; // Player doing well, larger increase
      }
      
      bubbleSpeedMultiplier = Math.min(bubbleSpeedMultiplier + speedIncreaseAmount, GAME_CONSTANTS.MAX_SPEED_MULTIPLIER);
      if (showMessage) {
        showFasterBubbles(difficultyLevel);
      }
      effects.add(new ScreenFlashEffect('lime', 0.4));
      lastIncreaseType = 'speed';
      
    } else {
      // Adaptive spawn rate increase logic
      if (playerMissRate > GAME_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
        bubbleSpawnInterval = Math.max(bubbleSpawnInterval * 0.85, GAME_CONSTANTS.MIN_SPAWN_INTERVAL); // Slower spawn increase
        showDifficultyEaseUp(difficultyLevel);
        showMessage = false;
      } else {
        bubbleSpawnInterval = Math.max(bubbleSpawnInterval * 0.7, GAME_CONSTANTS.MIN_SPAWN_INTERVAL); // Normal increase
      }
      
      // Visual feedback
      effects.add(new ScreenFlashEffect('cyan', 0.4));
      if (showMessage) {
        const spawnRate = (1000 / bubbleSpawnInterval).toFixed(1);
        showMoreBubbles(difficultyLevel);
      }
      lastIncreaseType = 'spawn';
    }
    
    lastDifficultyIncreaseTime = now;
    
    // Special effects at certain levels
    if (difficultyLevel % 3 === 0) {
      showMaximumIntensity();
      effects.add(new ScreenFlashEffect('orange', 0.6));
    }
  }
}

/**
 * Initializes and starts the game.
 * @param {object} config - Configuration object with DOM elements.
 * @param {string} mode - The game mode ('classic' or 'survival').
 */
function startGame(config, mode) {
  // Use CanvasManager for canvas visibility
  config.canvasManager.show();

  gameConfig = config;
  gameCanvas = config.canvasManager.element;
  gameCtx = config.canvasManager.context;
  gameMode = mode;

  // Reset game state
  bubbles = [];
  score = 0;
  consecutivePops = 0;
  consecutiveNormalPops = 0;
  freezeBubbleSpawnPending = false;
  isFreezeModeActive = false;
  freezeModeTimeLeft = 0;
  bombBubbleSpawnPending = false;
  lastBombSpawnTime = 0;
  bubbleSpeedMultiplier = 1;
  lastDifficultyIncreaseTime = performance.now();
  bubbleSpawnInterval = 1000;
  lastIncreaseType = 'spawn';
  difficultyLevel = 1;
  lastDifficultyEffectTime = 0;
  flashTriggered = false;
  
  // Reset adaptive difficulty variables
  bubblesMissed = 0;
  totalBubblesSpawned = 0;
  playerMissRate = 0;
  
  // Reset timers based on mode
  if (gameMode === 'classic') {
    classicTimeLeft = 60;
    classicStartTime = performance.now();
  } else if (gameMode === 'survival') {
    survivalTimeLeft = 60;
  }
  
  // Show game info bar and update UI for the first time
  updateUI();
  gameConfig.gameInfo.style.display = 'flex';
  gameConfig.modeDisplay.textContent = gameMode === 'classic' ? 'Classic Mode' : 'Survival Mode';

  // Start the game loop
  gameActive = true;
  lastFrameTime = performance.now();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Main game loop.
 * @param {number} now - The current time provided by requestAnimationFrame.
 */
function gameLoop(now) {
  animFrameId = requestAnimationFrame(gameLoop);

  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  if (!gameActive) {
    return;
  }

  // Update game timers
  if (gameMode === 'classic') {
    classicTimeLeft -= deltaTime;
    if (classicTimeLeft <= 0) {
      classicTimeLeft = 0;
      endGame();
    }
  } else if (gameMode === 'survival') {
    if (isFreezeModeActive) {
      freezeModeTimeLeft -= deltaTime;
      if (freezeModeTimeLeft <= 0) {
        isFreezeModeActive = false;
        bubbles = [];
        showFreezeEnded();
      }
    } else {
      survivalTimeLeft -= deltaTime;
      if (survivalTimeLeft <= 0) {
        survivalTimeLeft = 0;
        endGame();
      }
    }
    
    // Calculate player miss rate for adaptive difficulty
    if (totalBubblesSpawned > 0) {
      playerMissRate = bubblesMissed / totalBubblesSpawned;
    }

    // Call the new difficulty function
    if (gameMode === 'survival' && !isFreezeModeActive) {
      handleDifficultyIncrease(now);
    }
  }

  // Check for bubble spawning
  if (!isFreezeModeActive) {
    // Normal bubble spawning
    const spawned = spawnBubble(now, gameCanvas, bubbles, gameMode, null, bubbleSpeedMultiplier, bubbleSpawnInterval);
    if (spawned) {
      totalBubblesSpawned++;
    }
    
    // Bomb bubble spawning
    if (gameMode === 'survival' && now - lastBombSpawnTime > GAME_CONSTANTS.BOMB_SPAWN_INTERVAL) {
        bombBubbleSpawnPending = true;
        lastBombSpawnTime = now;
    }
  }
  
  // Spawn pending bubbles
  if (freezeBubbleSpawnPending) {
    spawnBubble(now, gameCanvas, bubbles, gameMode, 'freeze');
    freezeBubbleSpawnPending = false;
  }
  if (bombBubbleSpawnPending) {
    spawnBubble(now, gameCanvas, bubbles, gameMode, 'bomb');
    bombBubbleSpawnPending = false;
  }
  
  // Update & draw bubbles - Use CanvasManager for clearing
  gameConfig.canvasManager.clear();
  
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    
    const wasMissed = bubble.update(deltaTime, now, gameMode, isFreezeModeActive, showUrgentMessage, endGame, gameCanvas);
    
    if (wasMissed) {
      if (gameMode === 'survival') {
        survivalTimeLeft -= GAME_CONSTANTS.TIME_PENALTY_PER_MISS;
        effects.add(new FloatingTextEffect(gameCanvas.width / 2, 50, `-${GAME_CONSTANTS.TIME_PENALTY_PER_MISS}s`, '#ff5555'));
        bubblesMissed++;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
      }
    }

    if (bubble.dead) {
      bubbles.splice(i, 1);
    } else {
      bubble.draw(gameCtx, now);
    }
  }
  
  // Update & draw effects
  effects.update(deltaTime, now);
  effects.draw(gameCtx);

  // Update UI with current game info
  updateUI();
}

/**
 * Handles pointerdown events on the canvas for popping bubbles.
 * @param {number} x - The x-coordinate of the pointer.
 * @param {number} y - The y-coordinate of the pointer.
 */
function handleCanvasPointerDown(x, y) {
  if (!gameActive) return;

  let poppedAny = false;

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    const distance = Math.sqrt((x - bubble.x) ** 2 + (y - bubble.y) ** 2);

    if (distance <= bubble.radius) {
      if (bubble.type === 'decoy') {
        score -= 50;
        survivalTimeLeft -= GAME_CONSTANTS.TIME_PENALTY_PER_DECOY;
        effects.add(new ScreenFlashEffect('red'));
        showOuchPenalty();
        effects.add(new FloatingTextEffect(gameCanvas.width / 2, 50, `-${GAME_CONSTANTS.TIME_PENALTY_PER_DECOY}s`, '#ff5555'));
        
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      } else if (bubble.type === 'freeze') {
        if (!isFreezeModeActive) {
          isFreezeModeActive = true;
          freezeModeTimeLeft = GAME_CONSTANTS.FREEZE_DURATION;
          effects.add(new ScreenFlashEffect('blue'));
          showTimeFreeze();
          effects.add(new GiftUnwrapEffect(bubble.x, bubble.y, bubble.radius, bubble.color));
        }
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      } else if (bubble.type === 'bomb') {
        effects.add(new ExplosionEffect(bubble.x, bubble.y, 200, 'orange'));
        effects.add(new ScreenFlashEffect('orange'));
        showBoom();
        bubbles = [];
        
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      }
      
      if (bubble.pop(performance.now())) {
        score += 10;
        poppedAny = true;
        
        if (gameMode === 'survival') {
            if (bubble.type === 'normal') {
                consecutiveNormalPops++;
                if (consecutiveNormalPops % 2 === 0) {
                    survivalTimeLeft += 1;
                    effects.add(new FloatingTextEffect(gameCanvas.width / 2, 50, "+1s", bubble.color));
                }
            } else if (bubble.type === 'double') {
                survivalTimeLeft += GAME_CONSTANTS.TIME_BONUS_PER_DOUBLE_TAP;
                effects.add(new FloatingTextEffect(gameCanvas.width / 2, 50, "+1s", bubble.initialColor));
                consecutiveNormalPops = 0;
            } else {
                 consecutiveNormalPops = 0;
            }

            survivalTimeLeft = Math.min(survivalTimeLeft, 90); 
        }

        consecutivePops++;
        if (gameMode === 'survival' && (consecutivePops % GAME_CONSTANTS.COMBO_NEEDED === 0) && !freezeBubbleSpawnPending && !isFreezeModeActive) {
          freezeBubbleSpawnPending = true;
          showFreezeReady();
        }
        
        if (bubble.tapsNeeded === 2) {
          score += 10;
          showDoublePop();
        }

        // Vibrate on successful pop
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        break;
      }
    }
  }

  if (!poppedAny) {
    consecutivePops = 0;
    consecutiveNormalPops = 0;
  }
}

/**
 * Updates the game's UI elements with the current state.
 */
function updateUI() {
  gameConfig.scoreDisplay.textContent = `Score: ${score}`;
  
  if (gameMode === 'classic') {
    gameConfig.classicTimerDisplay.textContent = `Time: ${Math.floor(classicTimeLeft)}s`;
    gameConfig.classicTimerDisplay.style.display = 'inline';
    gameConfig.survivalStatsDisplay.style.display = 'none';
  } else if (gameMode === 'survival') {
    gameConfig.survivalStatsDisplay.style.display = 'inline';
    gameConfig.survivalTimeElapsedDisplay.textContent = `Time: ${Math.floor(survivalTimeLeft)}s`;
    gameConfig.survivalMissesDisplay.style.display = 'none';
  }
}

/**
 * Ends the current game session.
 */
function endGame() {
  gameActive = false;
  cancelAnimationFrame(animFrameId);

  // Use CanvasManager to hide the canvas
  gameConfig.canvasManager.hide();

  if (gameMode === 'classic') {
    showMessageBox(
      "Time's Up!",
      `Your final score is: ${score} points`, [{
        label: "Play Again",
        action: () => showModeSelection()
      }]
    );
  } else if (gameMode === 'survival') {
    showMessageBox(
      "Time's Up!",
      `Your final score is: ${score} points`, [{
        label: "Try Again",
        action: () => showModeSelection()
      }]
    );
  }
}

/**
 * Shows the mode selection screen.
 */
function showModeSelection() {
  hideMessageBox();
  gameConfig.gameInfo.style.display = 'none';
  showMessageBox(
    "Select Mode",
    "Choose your game mode:", [{
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

// Export functions to be used in other modules
export {
  startGame,
  gameLoop,
  handleCanvasPointerDown,
  endGame,
  updateUI
};
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
import { CountdownTextEffect } from './effects/CountdownTextEffect.js';

// ---------------------------
// Game State Variables
// ---------------------------
let bubbles = [];
let gameActive = false;
let gamePrepared = false;

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
  TIME_BONUS_PER_NORMAL_POP: 0.5,
  TIME_BONUS_PER_DOUBLE_TAP: 1,
  TIME_PENALTY_PER_DECOY: 5,
  TIME_PENALTY_PER_MISS: 2,
  DIFFICULTY_INCREASE_INTERVAL: 25000,
  MAX_SPEED_MULTIPLIER: 3.5,
  MIN_SPAWN_INTERVAL: 450,
  MAX_ALLOWED_MISS_RATE: 0.2,
  FREEZE_DURATION: 5,
  COMBO_NEEDED: 10,
  BOMB_SPAWN_INTERVAL: 20000,
};

// ---------------------------
// Game Functions
// ---------------------------

function setBackButtonVisible(visible) {
  if (gameConfig?.backButton) {
    visible ? gameConfig.backButton.show() : gameConfig.backButton.hide();
  }
}

function goToMainMenu() {
  // stop the loop if running
  gameActive = false;
  gamePrepared = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);

  // hide canvas and button
  if (gameConfig?.canvasManager) gameConfig.canvasManager.hide();
  setBackButtonVisible(false);

  // show mode selection
  showModeSelection();
}

async function startCountdown(config) {
  const countdownValues = ['3', '2', '1', 'Pop!'];
  let countdownRunning = true;
  let last = performance.now();
  
  // Temporary render loop just for the countdown effects
  function countdownLoop(now) {
    if (!countdownRunning) return;
    const dt = (now - last) / 1000;
    last = now;
    config.canvasManager.clear();
    effects.update(dt, now);
    effects.draw(config.canvasManager.context);
    requestAnimationFrame(countdownLoop);
  }
  requestAnimationFrame(countdownLoop);
  
  // Spawn each step of the countdown, letting the temp loop render them
  for (const value of countdownValues) {
    effects.spawn(new CountdownTextEffect(value, 500));
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Stop the temp loop and start the real game
  countdownRunning = false;
  actuallyStartGame();
}

function handleDifficultyIncrease(now) {
  if (!flashTriggered && now - lastDifficultyIncreaseTime > GAME_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL - 2000) {
    effects.spawn(new ScreenFlashEffect('yellow', 0.3));
    flashTriggered = true;
  }
  
  if (now - lastDifficultyIncreaseTime > GAME_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL) {
    difficultyLevel++;
    flashTriggered = false;
    
    let speedIncreaseAmount = 0.4;
    let showMessage = true;

    if (lastIncreaseType === 'spawn') {
      if (playerMissRate > GAME_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
        speedIncreaseAmount = 0.3;
        showDifficultyEaseUp(difficultyLevel);
        showMessage = false;
      } else {
        speedIncreaseAmount = 0.5;
      }
      
      bubbleSpeedMultiplier = Math.min(bubbleSpeedMultiplier + speedIncreaseAmount, GAME_CONSTANTS.MAX_SPEED_MULTIPLIER);
      if (showMessage) {
        showFasterBubbles(difficultyLevel);
      }
      effects.spawn(new ScreenFlashEffect('lime', 0.4));
      lastIncreaseType = 'speed';
      
    } else {
      if (playerMissRate > GAME_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
        bubbleSpawnInterval = Math.max(bubbleSpawnInterval * 0.85, GAME_CONSTANTS.MIN_SPAWN_INTERVAL);
        showDifficultyEaseUp(difficultyLevel);
        showMessage = false;
      } else {
        bubbleSpawnInterval = Math.max(bubbleSpawnInterval * 0.7, GAME_CONSTANTS.MIN_SPAWN_INTERVAL);
      }
      
      effects.spawn(new ScreenFlashEffect('cyan', 0.4));
      if (showMessage) {
        showMoreBubbles(difficultyLevel);
      }
      lastIncreaseType = 'spawn';
    }
    
    lastDifficultyIncreaseTime = now;
    
    if (difficultyLevel % 3 === 0) {
      showMaximumIntensity();
      effects.spawn(new ScreenFlashEffect('orange', 0.6));
    }
  }
}

async function prepareGame(config, mode) {
  gameConfig = config;
  gameCanvas = config.canvasManager.element;
  gameCtx = config.canvasManager.context;
  gameMode = mode;

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
  lastDifficultyIncreaseTime = 0;
  bubbleSpawnInterval = 1000;
  lastIncreaseType = 'spawn';
  difficultyLevel = 1;
  lastDifficultyEffectTime = 0;
  flashTriggered = false;
  bubblesMissed = 0;
  totalBubblesSpawned = 0;
  playerMissRate = 0;
  
  if (gameMode === 'classic') {
    classicTimeLeft = 60;
  } else if (gameMode === 'survival') {
    survivalTimeLeft = 60;
  }
  
  updateUI();
  gameConfig.gameInfo.style.display = 'flex';
  gameConfig.modeDisplay.textContent = gameMode === 'classic' ? 'Classic Mode' : 'Survival Mode';

  await config.canvasManager.showWithAnimation();
  setBackButtonVisible(true);        // <--- add this after the await  
  startCountdown(config);
  
  gamePrepared = true;
}

function actuallyStartGame() {
  if (!gamePrepared) {
    console.warn('Game not prepared. Call prepareGame first.');
    return;
  }
  
  if (gameMode === 'classic') {
    classicStartTime = performance.now();
  }
  
  lastDifficultyIncreaseTime = performance.now();
  
  gameActive = true;
  lastFrameTime = performance.now();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
}

async function startGame(config, mode) {
  await prepareGame(config, mode);
}

function gameLoop(now) {
  animFrameId = requestAnimationFrame(gameLoop);

  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  if (!gameActive) {
    return;
  }

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
    
    if (totalBubblesSpawned > 0) {
      playerMissRate = bubblesMissed / totalBubblesSpawned;
    }

    if (gameMode === 'survival' && !isFreezeModeActive) {
      handleDifficultyIncrease(now);
    }
  }

  if (!isFreezeModeActive) {
    const spawned = spawnBubble(now, gameCanvas, bubbles, gameMode, null, bubbleSpeedMultiplier, bubbleSpawnInterval);
    if (spawned) {
      totalBubblesSpawned++;
    }
    
    if (gameMode === 'survival' && now - lastBombSpawnTime > GAME_CONSTANTS.BOMB_SPAWN_INTERVAL) {
      bombBubbleSpawnPending = true;
      lastBombSpawnTime = now;
    }
  }
  
  if (freezeBubbleSpawnPending) {
    spawnBubble(now, gameCanvas, bubbles, gameMode, 'freeze');
    freezeBubbleSpawnPending = false;
  }
  if (bombBubbleSpawnPending) {
    spawnBubble(now, gameCanvas, bubbles, gameMode, 'bomb');
    bombBubbleSpawnPending = false;
  }
  
  gameConfig.canvasManager.clear();
  
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    
    const wasMissed = bubble.update(deltaTime, now, gameMode, isFreezeModeActive, showUrgentMessage, endGame, gameCanvas);
    
    if (wasMissed) {
      if (gameMode === 'survival') {
        survivalTimeLeft -= GAME_CONSTANTS.TIME_PENALTY_PER_MISS;
        effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, `-${GAME_CONSTANTS.TIME_PENALTY_PER_MISS}s`, '#ff5555'));
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
  
  effects.update(deltaTime, now);
  effects.draw(gameCtx);

  updateUI();
}

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
        effects.spawn(new ScreenFlashEffect('red'));
        showOuchPenalty();
        effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, `-${GAME_CONSTANTS.TIME_PENALTY_PER_DECOY}s`, '#ff5555'));
        
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      } else if (bubble.type === 'freeze') {
        if (!isFreezeModeActive) {
          isFreezeModeActive = true;
          freezeModeTimeLeft = GAME_CONSTANTS.FREEZE_DURATION;
          effects.spawn(new ScreenFlashEffect('blue'));
          showTimeFreeze();
          effects.spawn(new GiftUnwrapEffect(bubble.x, bubble.y, bubble.radius, bubble.color));
        }
        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      } else if (bubble.type === 'bomb') {
        effects.spawn(new ExplosionEffect(bubble.x, bubble.y, 200, 'orange'));
        effects.spawn(new ScreenFlashEffect('orange'));
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
              effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, "+1s", bubble.color));
            }
          } else if (bubble.type === 'double') {
            survivalTimeLeft += GAME_CONSTANTS.TIME_BONUS_PER_DOUBLE_TAP;
            effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, "+1s", bubble.initialColor));
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

function endGame() {
  gameActive = false;
  gamePrepared = false;
  cancelAnimationFrame(animFrameId);

  gameConfig.canvasManager.hide();
  setBackButtonVisible(false);   
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

async function showModeSelection() {
  await hideMessageBox();
  gameConfig.gameInfo.style.display = 'none';
  setBackButtonVisible(false);  
  showMessageBox(
    "Select Mode",
    "Choose your game mode:", [{
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

export {
  startGame,
  prepareGame,
  actuallyStartGame,
  gameLoop,
  handleCanvasPointerDown,
  endGame,
  updateUI,
  goToMainMenu     // <--- add this
};
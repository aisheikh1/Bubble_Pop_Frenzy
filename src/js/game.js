// src/js/game.js

import { Bubble, spawnBubble, handleBubbleCollision } from './bubbles.js';
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
import { ExplosionEffect } from './effects/ExplosionEffect.js';
import { ScreenFlashEffect } from './effects/ScreenFlashEffect.js';
import { CountdownTextEffect } from './effects/CountdownTextEffect.js';

// SCORING: point to your actual folder
import { scoringService } from './ScoringEngine/index.js';

// FRENZY MODE: Import the modular frenzy system
import { FrenzyMode, FrenzyState } from './modes/index.js';

/* ---------------------------
   Compatibility shim
   ---------------------------
   Some older code (e.g., bubbles.js) calls effects.add(...),
   while the current EffectManager exposes effects.spawn(...).
   This shim aliases add -> spawn to avoid TypeErrors.
*/
if (effects && typeof effects.add !== 'function' && typeof effects.spawn === 'function') {
  effects.add = (...args) => effects.spawn(...args);
}

// ---------------------------
// Game State Variables
// ---------------------------
let bubbles = [];
let gameActive = false;
let gamePrepared = false;
let gamePaused = false;

// Time & Scoring
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

// Pause Overlay
let pauseOverlay = null;

// ---------------------------
// FRENZY MODE INSTANCE
// ---------------------------
let frenzyMode = null;
let classicTimerBeforeFrenzy = 0; // Store timer value when frenzy starts

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
  MIN_BUBBLES: 5,
  MAX_BUBBLES: 10,
  
  // Frenzy mode constants
  FRENZY_ACTIVATION_DURATION: 0.5,  // "Go Frenzy!" display time
  FRENZY_COUNTDOWN_DURATION: 3.0,   // Countdown gameplay time
  FRENZY_TOTAL_DURATION: 3.5,       // Total frenzy time
  FRENZY_BUBBLE_FILL_COUNT: 25      // Bubbles to spawn during frenzy
};

// ---------------------------
// Helpers
// ---------------------------
function spawnPointsText(points, x, y, color) {
  const sign = points > 0 ? '+' : '';
  effects.spawn(new FloatingTextEffect(x, y, sign + String(points), color || '#ffffff'));
}

function setBackButtonVisible(v) {
  if (gameConfig && gameConfig.backButton) (v ? gameConfig.backButton.show() : gameConfig.backButton.hide());
}
function setRestartButtonVisible(v) {
  if (gameConfig && gameConfig.restartButton) (v ? gameConfig.restartButton.show() : gameConfig.restartButton.hide());
}
function setPauseButtonVisible(v) {
  if (gameConfig && gameConfig.pauseButton) (v ? gameConfig.pauseButton.show() : gameConfig.pauseButton.hide());
}

function showPauseOverlay() {
  if (!pauseOverlay) {
    pauseOverlay = document.createElement('div');
    pauseOverlay.className = 'paused-overlay';
    pauseOverlay.textContent = 'Game Paused';
    const container = document.querySelector('.game-container');
    if (container) container.appendChild(pauseOverlay);
  }
}
function hidePauseOverlay() {
  if (pauseOverlay) {
    pauseOverlay.remove();
    pauseOverlay = null;
  }
}
function togglePause() {
  if (!gameActive || !gamePrepared) return;
  gamePaused = !gamePaused;
  if (gameConfig && gameConfig.pauseButton) gameConfig.pauseButton.toggle();
  
  if (gamePaused) {
    showPauseOverlay();
    
    // Pause frenzy mode if active
    if (frenzyMode && frenzyMode.isActive()) {
      frenzyMode.pause({
        classicTimeLeft,
        survivalTimeLeft
      });
    }
  } else {
    hidePauseOverlay();
    lastFrameTime = performance.now();
    
    // Resume frenzy mode if it was paused
    if (frenzyMode && frenzyMode.isActive()) {
      frenzyMode.resume(performance.now());
    }
  }
}

function restartGame() {
  gameActive = false;
  gamePrepared = false;
  gamePaused = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  hidePauseOverlay();
  if (gameConfig && gameConfig.pauseButton) gameConfig.pauseButton.reset();

  bubbles = [];
  
  // Reset frenzy mode
  if (frenzyMode) {
    frenzyMode.reset();
  }

  if (gameConfig && gameMode) {
    prepareGame(gameConfig, gameMode);
  }
}

function goToMainMenu() {
  gameActive = false;
  gamePrepared = false;
  gamePaused = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  hidePauseOverlay();
  if (gameConfig && gameConfig.pauseButton) gameConfig.pauseButton.reset();

  // Reset frenzy mode
  if (frenzyMode) {
    frenzyMode.reset();
  }

  if (gameConfig && gameConfig.canvasManager) gameConfig.canvasManager.hide();
  setBackButtonVisible(false);
  setRestartButtonVisible(false);
  setPauseButtonVisible(false);

  showModeSelection();
}

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
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 500));
  }

  countdownRunning = false;
  actuallyStartGame();
}

function handleDifficultyIncrease(now) {
  if (!flashTriggered && now - lastDifficultyIncreaseTime > GAME_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL - 2000) {
    effects.spawn(new ScreenFlashEffect('yellow', 0.3));
    flashTriggered = true;
  }

  if (now - lastDifficultyIncreaseTime > GAME_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL) {
    difficultyLevel += 1;
    flashTriggered = false;

    let speedIncreaseAmount = 0.4;
    let showMsg = true;

    if (lastIncreaseType === 'spawn') {
      if (playerMissRate > GAME_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
        speedIncreaseAmount = 0.3;
        showDifficultyEaseUp(difficultyLevel);
        showMsg = false;
      } else {
        speedIncreaseAmount = 0.5;
      }
      bubbleSpeedMultiplier = Math.min(bubbleSpeedMultiplier + speedIncreaseAmount, GAME_CONSTANTS.MAX_SPEED_MULTIPLIER);
      if (showMsg) showFasterBubbles(difficultyLevel);
      effects.spawn(new ScreenFlashEffect('lime', 0.4));
      lastIncreaseType = 'speed';
    } else {
      if (playerMissRate > GAME_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
        bubbleSpawnInterval = Math.max(bubbleSpawnInterval * 0.85, GAME_CONSTANTS.MIN_SPAWN_INTERVAL);
        showDifficultyEaseUp(difficultyLevel);
        showMsg = false;
      } else {
        bubbleSpawnInterval = Math.max(bubbleSpawnInterval * 0.7, GAME_CONSTANTS.MIN_SPAWN_INTERVAL);
      }
      effects.spawn(new ScreenFlashEffect('cyan', 0.4));
      if (showMsg) showMoreBubbles(difficultyLevel);
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

  // Reset gameplay state
  bubbles = [];
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
  gamePaused = false;
  classicTimerBeforeFrenzy = 0;

  // Reset scoring
  if (scoringService && typeof scoringService.reset === 'function') {
    scoringService.reset();
  }

  if (gameConfig && gameConfig.pauseButton) gameConfig.pauseButton.reset();
  hidePauseOverlay();

  // ---------------------------
  // FRENZY MODE INITIALIZATION
  // ---------------------------
  // Create frenzy mode instance with proper configuration
  frenzyMode = new FrenzyMode({
    canvas: gameCanvas,
    getBubbles: () => bubbles,
    setBubbles: (newBubbles) => { bubbles = newBubbles; },
    gameMode: gameMode,
    constants: {
      ACTIVATION_DURATION: GAME_CONSTANTS.FRENZY_ACTIVATION_DURATION,
      COUNTDOWN_DURATION: GAME_CONSTANTS.FRENZY_COUNTDOWN_DURATION,
      TOTAL_DURATION: GAME_CONSTANTS.FRENZY_TOTAL_DURATION,
      BUBBLE_FILL_COUNT: GAME_CONSTANTS.FRENZY_BUBBLE_FILL_COUNT
    },
    
    // Callback when frenzy starts
    onStart: () => {
      console.log('[Game] Frenzy mode started - pausing game timer');
      
      // Store the current timer value
      if (gameMode === 'classic') {
        classicTimerBeforeFrenzy = classicTimeLeft;
      }
    },
    
    // Callback on each countdown tick
    onTick: (secondsRemaining) => {
      console.log(`[Game] Frenzy countdown: ${secondsRemaining}s remaining`);
    },
    
    // Callback when frenzy ends
    onEnd: () => {
      console.log('[Game] Frenzy mode ended - resuming game timer');
      
      // Restore the timer value (classic timer was paused)
      if (gameMode === 'classic') {
        classicTimeLeft = classicTimerBeforeFrenzy;
      }
      
      // Clear all bubbles
      bubbles = [];
      
      // Reset consecutive pop counters
      consecutivePops = 0;
      consecutiveNormalPops = 0;
    }
  });

  if (gameMode === 'classic') {
    classicTimeLeft = 60;
  } else {
    survivalTimeLeft = 60;
  }

  updateUI();
  config.gameInfo.style.display = 'flex';
  config.modeDisplay.textContent = gameMode === 'classic' ? 'Classic Mode' : 'Survival Mode';

  await config.canvasManager.showWithAnimation();
  setBackButtonVisible(true);
  setPauseButtonVisible(true);
  setRestartButtonVisible(true);
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
  gamePaused = false;
  lastFrameTime = performance.now();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
}

async function startGame(config, mode) {
  await prepareGame(config, mode);
}

function gameLoop(now) {
  animFrameId = requestAnimationFrame(gameLoop);

  if (gamePaused) {
    gameConfig.canvasManager.clear();
    for (let i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].draw(gameCtx, now);
    }
    effects.draw(gameCtx);
    return;
  }

  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  if (!gameActive) return;

  // ---------------------------
  // FRENZY MODE UPDATE
  // ---------------------------
  // If frenzy is active, update it and handle frenzy-specific logic
  if (frenzyMode && frenzyMode.isActive()) {
    frenzyMode.update(deltaTime, now);
    
    // During frenzy, the classic timer should NOT decrease
    // Only update bubbles and effects during frenzy
    
    // Update bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      
      // Bubbles move normally during frenzy (no freeze)
      bubble.update(
        deltaTime,
        now,
        gameMode,
        false, // isFreezeModeActive = false during frenzy
        showUrgentMessage,
        endGame,
        gameCanvas
      );

      if (bubble.dead) {
        bubbles.splice(i, 1);
      }
    }
    
    // Handle bubble collisions during frenzy
    for (let i = 0; i < bubbles.length; i++) {
      if (bubbles[i].popped) continue;
      for (let j = i + 1; j < bubbles.length; j++) {
        if (bubbles[j].popped) continue;
        handleBubbleCollision(bubbles[i], bubbles[j]);
      }
    }
    
    // Render everything
    gameConfig.canvasManager.clear();
    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].draw(gameCtx, now);
    }
    effects.update(deltaTime, now);
    effects.draw(gameCtx);
    updateUI();
    
    return; // Skip normal game loop logic during frenzy
  }

  // ---------------------------
  // NORMAL GAME LOOP (when not in frenzy)
  // ---------------------------
  
  if (gameMode === 'classic') {
    // In classic mode, timer decreases normally (unless frenzy is active)
    classicTimeLeft -= deltaTime;
    if (classicTimeLeft <= 0) {
      classicTimeLeft = 0;
      endGame();
    }
  } else {
    // Survival mode logic
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

    if (!isFreezeModeActive) {
      handleDifficultyIncrease(now);
    }
  }

  const activeBubbles = bubbles.filter(b => !b.popped).length;

  if (!isFreezeModeActive) {
    if (activeBubbles < GAME_CONSTANTS.MIN_BUBBLES) {
      const spawned = spawnBubble(now, gameCanvas, bubbles, gameMode, null, bubbleSpeedMultiplier, 0);
      if (spawned) totalBubblesSpawned += 1;
    } else if (activeBubbles < GAME_CONSTANTS.MAX_BUBBLES) {
      const spawned = spawnBubble(now, gameCanvas, bubbles, gameMode, null, bubbleSpeedMultiplier, bubbleSpawnInterval);
      if (spawned) totalBubblesSpawned += 1;
    }

    if (gameMode === 'survival' && now - lastBombSpawnTime > GAME_CONSTANTS.BOMB_SPAWN_INTERVAL) {
      if (activeBubbles < GAME_CONSTANTS.MAX_BUBBLES) {
        bombBubbleSpawnPending = true;
        lastBombSpawnTime = now;
      }
    }
  }

  if (freezeBubbleSpawnPending && activeBubbles < GAME_CONSTANTS.MAX_BUBBLES) {
    spawnBubble(now, gameCanvas, bubbles, gameMode, 'freeze');
    freezeBubbleSpawnPending = false;
  }
  if (bombBubbleSpawnPending && activeBubbles < GAME_CONSTANTS.MAX_BUBBLES) {
    spawnBubble(now, gameCanvas, bubbles, gameMode, 'bomb');
    bombBubbleSpawnPending = false;
  }

  gameConfig.canvasManager.clear();

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    const missed = bubble.update(
      deltaTime,
      now,
      gameMode,
      isFreezeModeActive,
      showUrgentMessage,
      endGame,
      gameCanvas
    );

    if (missed) {
      if (gameMode === 'survival') {
        survivalTimeLeft -= GAME_CONSTANTS.TIME_PENALTY_PER_MISS;
        effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, '-2s', '#ff5555'));
        bubblesMissed += 1;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
      }
    }

    if (bubble.dead) {
      bubbles.splice(i, 1);
    }
  }

  if (!isFreezeModeActive) {
    for (let i = 0; i < bubbles.length; i++) {
      if (bubbles[i].popped) continue;
      for (let j = i + 1; j < bubbles.length; j++) {
        if (bubbles[j].popped) continue;
        handleBubbleCollision(bubbles[i], bubbles[j]);
      }
    }
  }

  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].draw(gameCtx, now);
  }

  effects.update(deltaTime, now);
  effects.draw(gameCtx);

  updateUI();
}

function handleCanvasPointerDown(x, y) {
  if (!gameActive || gamePaused) return;

  let poppedAny = false;

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    const dx = x - bubble.x;
    const dy = y - bubble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= bubble.radius) {
      // ---------------------------
      // FRENZY MODE ACTIVATION
      // ---------------------------
      if (bubble.type === 'freeze') {
        // In CLASSIC mode: Activate frenzy mode
        if (gameMode === 'classic' && frenzyMode && frenzyMode.canActivate()) {
          frenzyMode.activate(performance.now());
          effects.spawn(new GiftUnwrapEffect(bubble.x, bubble.y, bubble.radius, bubble.color));
          
          const res = scoringService.handleBubblePop('freeze');
          spawnPointsText(res.pointsEarned, bubble.x, bubble.y, '#88ccff');
          
          bubble.popped = true;
          poppedAny = true;
          consecutivePops = 0;
          consecutiveNormalPops = 0;
          break;
        }
        // In SURVIVAL mode: Use old freeze behavior
        else if (gameMode === 'survival') {
          if (!isFreezeModeActive) {
            isFreezeModeActive = true;
            freezeModeTimeLeft = GAME_CONSTANTS.FREEZE_DURATION;
            effects.spawn(new ScreenFlashEffect('blue'));
            showTimeFreeze();
            effects.spawn(new GiftUnwrapEffect(bubble.x, bubble.y, bubble.radius, bubble.color));
          }
          const res = scoringService.handleBubblePop('freeze');
          spawnPointsText(res.pointsEarned, bubble.x, bubble.y, '#88ccff');

          bubble.popped = true;
          poppedAny = true;
          consecutivePops = 0;
          consecutiveNormalPops = 0;
          break;
        }
      }
      
      // Handle decoy bubbles
      if (bubble.type === 'decoy') {
        const res = scoringService.handleBubblePop('decoy');
        
        if (gameMode === 'survival') {
          survivalTimeLeft -= GAME_CONSTANTS.TIME_PENALTY_PER_DECOY;
          effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, '-5s', '#ff5555'));
        }
        
        effects.spawn(new ScreenFlashEffect('red'));
        showOuchPenalty();
        spawnPointsText(res.pointsEarned, bubble.x, bubble.y, '#ff7777');

        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      }
      
      // Handle bomb bubbles
      if (bubble.type === 'bomb') {
        effects.spawn(new ExplosionEffect(bubble.x, bubble.y, 200, 'orange'));
        effects.spawn(new ScreenFlashEffect('orange'));
        showBoom();
        bubbles = [];

        const res = scoringService.handleBubblePop('bomb');
        spawnPointsText(res.pointsEarned, bubble.x, bubble.y, '#ffbb33');

        bubble.popped = true;
        poppedAny = true;
        consecutivePops = 0;
        consecutiveNormalPops = 0;
        break;
      }

      // Handle normal and double bubbles
      if (bubble.pop(performance.now())) {
        const res = scoringService.handleBubblePop(bubble.type);
        spawnPointsText(res.pointsEarned, bubble.x, bubble.y, bubble.color || '#ffffff');
        poppedAny = true;

        if (gameMode === 'survival') {
          if (bubble.type === 'normal') {
            consecutiveNormalPops += 1;
            if (consecutiveNormalPops % 2 === 0) {
              survivalTimeLeft += 1;
              effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, '+1s', bubble.color));
            }
          } else if (bubble.type === 'double') {
            survivalTimeLeft += GAME_CONSTANTS.TIME_BONUS_PER_DOUBLE_TAP;
            effects.spawn(new FloatingTextEffect(gameCanvas.width / 2, 50, '+1s', bubble.initialColor || '#ffffff'));
            consecutiveNormalPops = 0;
            showDoublePop();
          } else {
            consecutiveNormalPops = 0;
          }
          survivalTimeLeft = Math.min(survivalTimeLeft, 90);
        }

        consecutivePops += 1;
        
        // Spawn freeze bubble in survival mode after combo
        if (
          gameMode === 'survival' &&
          (consecutivePops % GAME_CONSTANTS.COMBO_NEEDED === 0) &&
          !freezeBubbleSpawnPending &&
          !isFreezeModeActive
        ) {
          freezeBubbleSpawnPending = true;
          showFreezeReady();
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
  const stats = scoringService.getCurrentStats();
  const totalScore = (stats && typeof stats.totalScore === 'number') ? stats.totalScore : 0;

  gameConfig.scoreDisplay.textContent = 'Score: ' + String(totalScore);

  if (gameMode === 'classic') {
    gameConfig.classicTimerDisplay.textContent = 'Time: ' + String(Math.floor(classicTimeLeft)) + 's';
    gameConfig.classicTimerDisplay.style.display = 'inline';
    gameConfig.survivalStatsDisplay.style.display = 'none';
  } else {
    gameConfig.survivalStatsDisplay.style.display = 'inline';
    gameConfig.survivalTimeElapsedDisplay.textContent = 'Time: ' + String(Math.floor(survivalTimeLeft)) + 's';
    gameConfig.survivalMissesDisplay.style.display = 'none';
  }
}

function endGame() {
  gameActive = false;
  gamePrepared = false;
  gamePaused = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (gameConfig && gameConfig.canvasManager) gameConfig.canvasManager.hide();
  setBackButtonVisible(false);
  setPauseButtonVisible(false);
  setRestartButtonVisible(false);
  hidePauseOverlay();
  if (gameConfig && gameConfig.pauseButton) gameConfig.pauseButton.reset();
  
  // Reset frenzy mode
  if (frenzyMode) {
    frenzyMode.reset();
  }

  const stats = scoringService.getCurrentStats();
  const totalScore = (stats && typeof stats.totalScore === 'number') ? stats.totalScore : 0;

  showMessageBox(
    "Time's Up!",
    'Your final score is: ' + String(totalScore) + ' points',
    [{ label: 'Go to Main Menu', action: () => goToMainMenu() }]
  );
}

async function showModeSelection() {
  await hideMessageBox();
  gameConfig.gameInfo.style.display = 'none';
  setBackButtonVisible(false);
  setPauseButtonVisible(false);
  setRestartButtonVisible(false);

  showMessageBox(
    'Select Mode',
    'Choose your game mode:',
    [
      { label: 'Classic Mode', action: async () => { await hideMessageBox(); startGame(gameConfig, 'classic'); } },
      { label: 'Survival Mode', action: async () => { await hideMessageBox(); startGame(gameConfig, 'survival'); } }
    ]
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
  goToMainMenu,
  restartGame,
  togglePause
};
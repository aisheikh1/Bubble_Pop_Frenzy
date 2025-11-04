// src/js/SurvivalMode.js
// Survival Mode - Keep the clock running with increasing difficulty

import { Bubble, spawnBubble, handleBubbleCollision } from './bubbles.js';
import { showMessageBox } from './ui/messageBox.js';
import { FloatingTextEffect } from './effects/FloatingTextEffect.js';
import {
  effects,
  scoringService,
  BubbleSpawnConfig,
  spawnPointsText,
  setBackButtonVisible,
  setRestartButtonVisible,
  setPauseButtonVisible,
  showPauseOverlay,
  hidePauseOverlay,
  goToMainMenu
} from './game.js';

/* ===========================================================================
   SURVIVAL MODE CONSTANTS
   ===========================================================================*/

const SURVIVAL_CONSTANTS = {
  STARTING_TIME: 60,                    // Start with 60 seconds
  MAX_TIME: 90,                         // Cap at 90 seconds
  TIME_BONUS_PER_NORMAL_POP: 0.5,
  TIME_BONUS_PER_DOUBLE_TAP: 1,
  TIME_PENALTY_PER_DECOY: 5,
  TIME_PENALTY_PER_MISS: 2,
  DIFFICULTY_INCREASE_INTERVAL: 25000,  // 25 seconds
  MAX_SPEED_MULTIPLIER: 3.5,
  MIN_SPAWN_INTERVAL: 450,
  MAX_ALLOWED_MISS_RATE: 0.2,
};

/* ===========================================================================
   SURVIVAL MODE CLASS
   ===========================================================================*/

export class SurvivalMode {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvasManager.element;
    this.ctx = config.canvasManager.context;
    
    // Game state
    this.bubbles = [];
    this.gameActive = false;
    this.gamePrepared = false;
    this.gamePaused = false;
    
    // Timing
    this.timeLeft = SURVIVAL_CONSTANTS.STARTING_TIME;
    this.lastFrameTime = 0;
    this.animFrameId = null;
    
    // Scoring & Streaks
    this.consecutivePops = 0;
    this.consecutiveNormalPops = 0;
    
    // Bubble spawning & difficulty
    this.bubbleSpeedMultiplier = 1;
    this.bubbleSpawnInterval = 1000;
    this.totalBubblesSpawned = 0;
    this.bubblesMissed = 0;
    this.playerMissRate = 0;
    
    // Difficulty scaling
    this.lastDifficultyIncreaseTime = 0;
    this.difficultyLevel = 1;
    this.lastIncreaseType = 'spawn'; // 'spawn' or 'speed'
    
    // Get spawn configuration for survival mode
    this.spawnConfig = this.getSpawnConfig();
    
    // No-op function for removed urgent messages
    this.noOp = () => {};
  }

  /* =========================================================================
     CONFIGURATION
     =========================================================================*/

  /**
   * Get spawn rate configuration for survival mode
   * @returns {Object} Spawn configuration
   */
  getSpawnConfig() {
    const config = BubbleSpawnConfig.SPAWN_RATE_CONFIG.survival;
    return config || BubbleSpawnConfig.SPAWN_RATE_CONFIG.survival;
  }

  /* =========================================================================
     GAME LIFECYCLE
     =========================================================================*/

  /**
   * Prepare the game (reset state, setup UI)
   * Called before countdown starts
   */
  async prepareGame() {
    // Reset game state
    this.bubbles = [];
    this.consecutivePops = 0;
    this.consecutiveNormalPops = 0;
    this.bubbleSpeedMultiplier = 1;
    this.bubbleSpawnInterval = this.spawnConfig.initialInterval;
    this.totalBubblesSpawned = 0;
    this.bubblesMissed = 0;
    this.playerMissRate = 0;
    this.gamePaused = false;
    this.timeLeft = SURVIVAL_CONSTANTS.STARTING_TIME;
    this.difficultyLevel = 1;
    this.lastIncreaseType = 'spawn';

    // Reset systems
    if (scoringService?.reset) {
      scoringService.reset();
    }
    
    BubbleSpawnConfig.resetSpawnState();

    if (this.config?.pauseButton) {
      this.config.pauseButton.reset();
    }
    
    hidePauseOverlay();

    // Update UI
    this.updateUI();
    
    this.config.gameInfo.style.display = 'flex';
    this.config.modeDisplay.textContent = 'Survival Mode';
    this.config.modeDisplay.style.display = 'inline';

    // Show canvas with animation
    await this.config.canvasManager.showWithAnimation();
    
    // Show control buttons
    setBackButtonVisible(true);
    setPauseButtonVisible(true);
    setRestartButtonVisible(true);

    this.gamePrepared = true;
  }

  /**
   * Start the actual game (after countdown)
   * Called by parent game.js after countdown completes
   */
  startGame() {
    if (!this.gamePrepared) {
      console.warn('[SurvivalMode] Game not prepared. Call prepareGame first.');
      return;
    }

    this.lastDifficultyIncreaseTime = performance.now();
    this.gameActive = true;
    this.gamePaused = false;
    this.lastFrameTime = performance.now();
    
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    
    this.animFrameId = requestAnimationFrame((now) => this.gameLoop(now));
  }

  /**
   * Main game loop
   * @param {number} now - Current timestamp
   */
  gameLoop(now) {
    this.animFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));

    // Handle pause state
    if (this.gamePaused) {
      this.config.canvasManager.clear();
      
      // Draw bubbles (frozen)
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        this.bubbles[i].draw(this.ctx, now);
      }
      
      effects.draw(this.ctx);
      return;
    }

    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (!this.gameActive) return;

    // Update timer
    this.timeLeft -= deltaTime;
    
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endGame();
      return;
    }

    // Update player miss rate
    if (this.totalBubblesSpawned > 0) {
      this.playerMissRate = this.bubblesMissed / this.totalBubblesSpawned;
    }

    // Handle difficulty scaling
    this.handleDifficultyIncrease(now);

    // Spawn bubbles
    this.updateBubbleSpawning(now);

    // Clear canvas
    this.config.canvasManager.clear();

    // Update bubbles
    this.updateBubbles(deltaTime, now);

    // Check bubble collisions
    this.checkBubbleCollisions();

    // Draw bubbles
    for (let i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].draw(this.ctx, now);
    }

    // Update and draw effects
    effects.update(deltaTime, now);
    effects.draw(this.ctx);

    // Update UI
    this.updateUI();
  }

  /**
   * Handle difficulty progression
   * @param {number} now - Current timestamp
   */
  handleDifficultyIncrease(now) {
    if (now - this.lastDifficultyIncreaseTime > SURVIVAL_CONSTANTS.DIFFICULTY_INCREASE_INTERVAL) {
      this.difficultyLevel += 1;

      let speedIncreaseAmount = 0.4;

      if (this.lastIncreaseType === 'spawn') {
        // Increase bubble speed
        if (this.playerMissRate > SURVIVAL_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
          speedIncreaseAmount = 0.3; // Ease up if player struggling
        } else {
          speedIncreaseAmount = 0.5;
        }
        
        this.bubbleSpeedMultiplier = Math.min(
          this.bubbleSpeedMultiplier + speedIncreaseAmount,
          SURVIVAL_CONSTANTS.MAX_SPEED_MULTIPLIER
        );
        
        this.lastIncreaseType = 'speed';
      } else {
        // Increase spawn rate
        if (this.playerMissRate > SURVIVAL_CONSTANTS.MAX_ALLOWED_MISS_RATE) {
          this.bubbleSpawnInterval = Math.max(
            this.bubbleSpawnInterval * 0.85,
            SURVIVAL_CONSTANTS.MIN_SPAWN_INTERVAL
          );
        } else {
          this.bubbleSpawnInterval = Math.max(
            this.bubbleSpawnInterval * 0.7,
            SURVIVAL_CONSTANTS.MIN_SPAWN_INTERVAL
          );
        }
        
        this.lastIncreaseType = 'spawn';
      }

      this.lastDifficultyIncreaseTime = now;
    }
  }

  /**
   * Handle bubble spawning logic
   * @param {number} now - Current timestamp
   */
  updateBubbleSpawning(now) {
    const activeBubbles = this.bubbles.filter(b => !b.popped).length;

    const gameState = {
      currentTime: now,
      consecutivePops: this.consecutivePops,
      isFreezeModeActive: false
    };

    if (activeBubbles < this.spawnConfig.minBubbles) {
      const spawned = spawnBubble(
        now,
        this.canvas,
        this.bubbles,
        'survival',
        null,
        this.bubbleSpeedMultiplier,
        0,
        gameState
      );
      if (spawned) this.totalBubblesSpawned += 1;
    } else if (activeBubbles < this.spawnConfig.maxBubbles) {
      const spawned = spawnBubble(
        now,
        this.canvas,
        this.bubbles,
        'survival',
        null,
        this.bubbleSpeedMultiplier,
        this.bubbleSpawnInterval,
        gameState
      );
      if (spawned) this.totalBubblesSpawned += 1;
    }
  }

  /**
   * Update all bubbles
   * @param {number} deltaTime - Time since last frame (seconds)
   * @param {number} now - Current timestamp
   */
  updateBubbles(deltaTime, now) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      
      const missed = bubble.update(
        deltaTime,
        now,
        'survival',
        false,
        this.noOp,
        () => this.endGame(),
        this.canvas
      );

      if (missed) {
        // Apply time penalty for missed bubbles
        this.timeLeft -= SURVIVAL_CONSTANTS.TIME_PENALTY_PER_MISS;
        effects.spawn(new FloatingTextEffect(this.canvas.width / 2, 50, '-2s', '#ff5555'));
        this.bubblesMissed += 1;
        this.consecutivePops = 0;
        this.consecutiveNormalPops = 0;
        
        BubbleSpawnConfig.notifyBubbleMissed();
      }
      
      if (bubble.dead) {
        this.bubbles.splice(i, 1);
      }
    }
  }

  /**
   * Check for bubble collisions
   */
  checkBubbleCollisions() {
    for (let i = 0; i < this.bubbles.length; i++) {
      if (this.bubbles[i].popped) continue;
      
      for (let j = i + 1; j < this.bubbles.length; j++) {
        if (this.bubbles[j].popped) continue;
        handleBubbleCollision(this.bubbles[i], this.bubbles[j]);
      }
    }
  }

  /**
   * Handle pointer down (tap/click) on canvas
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  handlePointerDown(x, y) {
    if (!this.gameActive || this.gamePaused) return;

    let poppedAny = false;

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= bubble.radius) {
        
        // Handle freeze bubbles (removed mechanic, but may still spawn)
        if (bubble.type === 'freeze') {
          console.warn('[SurvivalMode] Freeze bubble popped, but mechanic removed. Ignoring.');
          bubble.popped = true;
          poppedAny = true;
          this.consecutivePops = 0;
          this.consecutiveNormalPops = 0;
          BubbleSpawnConfig.notifyBubblePopped('freeze', false);
          break;
        }
        
        // Handle decoy bubbles
        if (bubble.type === 'decoy') {
          const res = scoringService.handleBubblePop('decoy');
          
          this.timeLeft -= SURVIVAL_CONSTANTS.TIME_PENALTY_PER_DECOY;
          effects.spawn(new FloatingTextEffect(this.canvas.width / 2, 50, '-5s', '#ff5555'));
          
          spawnPointsText(res.pointsEarned, bubble.x, bubble.y, '#ff7777');

          bubble.popped = true;
          poppedAny = true;
          this.consecutivePops = 0;
          this.consecutiveNormalPops = 0;
          
          BubbleSpawnConfig.notifyBubblePopped('decoy', false);
          
          break;
        }
        
        // Handle normal and double bubbles
        if (bubble.pop(performance.now())) {
          const res = scoringService.handleBubblePop(bubble.type);
          spawnPointsText(res.pointsEarned, bubble.x, bubble.y, bubble.color || '#ffffff');
          poppedAny = true;

          // Time bonuses for survival mode
          if (bubble.type === 'normal') {
            this.consecutiveNormalPops += 1;
            
            // Every 2 consecutive normal pops gives +1s
            if (this.consecutiveNormalPops % 2 === 0) {
              this.timeLeft += 1;
              effects.spawn(new FloatingTextEffect(this.canvas.width / 2, 50, '+1s', bubble.color));
            }
          } else if (bubble.type === 'double') {
            this.timeLeft += SURVIVAL_CONSTANTS.TIME_BONUS_PER_DOUBLE_TAP;
            effects.spawn(new FloatingTextEffect(
              this.canvas.width / 2,
              50,
              '+1s',
              bubble.initialColor || '#ffffff'
            ));
            this.consecutiveNormalPops = 0;
          } else {
            this.consecutiveNormalPops = 0;
          }
          
          // Cap time at maximum
          this.timeLeft = Math.min(this.timeLeft, SURVIVAL_CONSTANTS.MAX_TIME);

          this.consecutivePops += 1;
          
          BubbleSpawnConfig.notifyBubblePopped(bubble.type, true);

          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }

          break;
        }
      }
    }

    if (!poppedAny) {
      this.consecutivePops = 0;
      this.consecutiveNormalPops = 0;
      BubbleSpawnConfig.notifyBubbleMissed();
    }
  }

  /**
   * Update UI displays
   */
  updateUI() {
    const stats = scoringService.getCurrentStats();
    const totalScore = (stats && typeof stats.totalScore === 'number') ? stats.totalScore : 0;

    this.config.scoreDisplay.textContent = 'Score: ' + String(totalScore);
    this.config.survivalStatsDisplay.style.display = 'inline';
    this.config.survivalTimeElapsedDisplay.textContent = 'Time: ' + String(Math.floor(this.timeLeft)) + 's';
    this.config.survivalMissesDisplay.style.display = 'none';
    this.config.classicTimerDisplay.style.display = 'none';
  }

  /**
   * Pause the game
   */
  pause() {
    if (!this.gameActive || !this.gamePrepared) return;
    
    this.gamePaused = !this.gamePaused;
    
    if (this.gamePaused) {
      showPauseOverlay();
    } else {
      hidePauseOverlay();
      this.lastFrameTime = performance.now();
    }
  }

  /**
   * Restart the game
   */
  async restart() {
    this.cleanup();
    
    // Re-prepare the game
    await this.prepareGame();
    
    // Note: Parent game.js will handle countdown via startCountdown()
    // and then call startGame() on this instance
  }

  /**
   * End the game and show results
   */
  endGame() {
    this.cleanup();

    const stats = scoringService.getCurrentStats();
    const totalScore = (stats && typeof stats.totalScore === 'number') ? stats.totalScore : 0;

    showMessageBox(
      "Time's Up!",
      'Your final score is: ' + String(totalScore) + ' points',
      [{ label: 'Go to Main Menu', action: () => goToMainMenu() }]
    );
  }

  /**
   * Cleanup game state
   */
  cleanup() {
    this.gameActive = false;
    this.gamePrepared = false;
    this.gamePaused = false;
    
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    
    this.bubbles = [];
    
    if (this.config?.canvasManager) {
      this.config.canvasManager.hide();
    }
    
    setBackButtonVisible(false);
    setPauseButtonVisible(false);
    setRestartButtonVisible(false);
    hidePauseOverlay();
    
    if (this.config?.pauseButton) {
      this.config.pauseButton.reset();
    }
    
    BubbleSpawnConfig.resetSpawnState();
  }
}
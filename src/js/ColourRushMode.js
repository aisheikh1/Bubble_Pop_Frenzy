// src/js/ColourRushMode.js
// Colour Rush Game Mode - Match target colors for points and combos

import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { 
  Bubble, 
  spawnBubble, 
  handleBubbleCollision,
  getActiveBubbleCount,
  resetSpawnTimer
} from './bubbles.js';
import { effects } from './effects/EffectManager.js';
import { FloatingTextEffect } from './effects/FloatingTextEffect.js';
import { 
  setBackButtonVisible, 
  setRestartButtonVisible, 
  setPauseButtonVisible,
  showPauseOverlay,
  hidePauseOverlay,
  spawnPointsText
} from './game.js';
import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';
import { COLOUR_RUSH_CONFIG } from './ColourRushConfig.js';
import { TargetColorDisplay } from './ui/TargetColorDisplay.js';
import { ComboMeter } from './ui/ComboMeter.js';

/**
 * ColourRushMode - Round-based color matching game
 * Players must pop bubbles matching the target color
 */
export class ColourRushMode {
  constructor(config) {
    this.config = config;
    
    // Game state
    this.gameState = 'idle'; // 'idle' | 'playing' | 'paused' | 'ended'
    this.isPaused = false;
    this.currentRound = 1;
    this.maxRounds = COLOUR_RUSH_CONFIG.rounds.total;
    
    // Color system
    this.targetColor = null; // { name: string, hex: string }
    this.colorChangeTimer = 0;
    this.colorChangeInterval = COLOUR_RUSH_CONFIG.difficulty[1].colorChangeInterval;
    this.lastColorChangeTime = 0;
    this.availableColors = [];
    this.usedColors = [];
    
    // Combo system
    this.consecutiveCorrect = 0;
    this.comboMultiplier = 1.0;
    this.totalTargetBubbles = 0; // Spawned in current color period
    this.poppedTargetBubbles = 0;
    
    // Round tracking
    this.roundStartTime = 0;
    this.roundDuration = COLOUR_RUSH_CONFIG.rounds.duration;
    this.totalScore = 0;
    this.totalPops = 0;
    this.correctPops = 0;
    this.wrongPops = 0;
    
    // Difficulty scaling
    this.difficultyLevel = 1;
    this.speedMultiplier = 1.0;
    this.spawnInterval = 1000;
    this.bubbleRadiusScale = 1.0;
    
    // Bubbles
    this.bubbles = [];
    this.lastSpawnTime = 0;
    
    // Animation frame
    this.animationId = null;
    this.lastFrameTime = 0;
    
    // UI components
    this.targetColorDisplay = null;
    this.comboMeter = null;
    
    // Audio/Haptic support
    this.audioEnabled = true;
    this.hapticEnabled = 'vibrate' in navigator;
  }
  
  /* ===========================================================================
     LIFECYCLE METHODS
     ===========================================================================*/
  
  /**
   * Prepare game for start - setup UI and reset state
   */
  async prepareGame() {
    console.log('[ColourRushMode] Preparing game...');
    
    // Reset state
    this.gameState = 'idle';
    this.isPaused = false;
    this.currentRound = 1;
    this.totalScore = 0;
    this.totalPops = 0;
    this.correctPops = 0;
    this.wrongPops = 0;
    this.bubbles = [];
    this.consecutiveCorrect = 0;
    this.comboMultiplier = 1.0;
    this.usedColors = [];
    
    // Initialize UI components
    const gameContainer = document.querySelector('.game-container');
    
    // Create target color display
    if (!this.targetColorDisplay) {
      this.targetColorDisplay = new TargetColorDisplay(gameContainer);
    }
    
    // Create combo meter
    const gameInfo = this.config.gameInfo;
    if (!this.comboMeter) {
      this.comboMeter = new ComboMeter(gameInfo);
    }
    
    // Setup canvas
    this.config.canvasManager.show();
    this.config.canvasManager.clear();
    
    // Setup UI displays
    if (this.config.gameInfo) {
      this.config.gameInfo.style.display = 'flex';
    }
    
    // Setup mode-specific display
    if (this.config.modeDisplay) {
      this.config.modeDisplay.textContent = 'Colour Rush';
    }
    
    // Hide classic/survival specific displays
    if (this.config.classicTimerDisplay) {
      this.config.classicTimerDisplay.style.display = 'none';
    }
    if (this.config.survivalStatsDisplay) {
      this.config.survivalStatsDisplay.style.display = 'none';
    }
    
    // Show score display
    if (this.config.scoreDisplay) {
      this.config.scoreDisplay.style.display = 'block';
      this.config.scoreDisplay.textContent = 'Score: 0';
    }
    
    // Reset spawn timer
    resetSpawnTimer();
    
    // Initialize color pool
    this.availableColors = [...COLOUR_RUSH_CONFIG.colors.easy];
    
    // Select initial target color
    this.selectNewTargetColor();
    
    // Show UI components
    this.targetColorDisplay.show();
    this.comboMeter.show();
    
    // Update UI
    this.updateUI();
    
    console.log('[ColourRushMode] Game prepared');
  }
  
  /**
   * Start the game after countdown
   */
  startGame() {
    console.log('[ColourRushMode] Starting game...');
    
    this.gameState = 'playing';
    this.roundStartTime = Date.now();
    this.lastColorChangeTime = Date.now();
    this.lastFrameTime = performance.now();
    
    // Show control buttons
    setBackButtonVisible(true);
    setPauseButtonVisible(true);
    setRestartButtonVisible(true);
    
    // Start game loop
    this.startGameLoop();
    
    console.log('[ColourRushMode] Game started - Round', this.currentRound);
  }
  
  /**
   * Toggle pause state
   */
  pause() {
    if (this.gameState !== 'playing' && !this.isPaused) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Pause game
      console.log('[ColourRushMode] Game paused');
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      showPauseOverlay();
    } else {
      // Resume game
      console.log('[ColourRushMode] Game resumed');
      hidePauseOverlay();
      this.lastFrameTime = performance.now();
      this.startGameLoop();
    }
  }
  
  /**
   * Restart current game
   */
  async restart() {
    console.log('[ColourRushMode] Restarting game...');
    
    // Stop current game
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear bubbles
    this.bubbles = [];
    
    // Reset UI
    hidePauseOverlay();
    
    // Prepare fresh game state
    await this.prepareGame();
    
    console.log('[ColourRushMode] Ready for countdown');
  }
  
  /**
   * End the game and show results
   */
  endGame() {
    console.log('[ColourRushMode] Ending game...');
    
    this.gameState = 'ended';
    
    // Stop game loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Calculate final stats
    const accuracy = this.totalPops > 0 
      ? Math.round((this.correctPops / this.totalPops) * 100)
      : 0;
    
    const stars = this.calculateStarRating();
    
    // Hide UI components
    this.targetColorDisplay.hide();
    this.comboMeter.hide();
    
    // Show results
    this.showFinalResults(stars, accuracy);
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('[ColourRushMode] Cleaning up...');
    
    // Stop game loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear bubbles
    this.bubbles = [];
    
    // Cleanup UI components
    if (this.targetColorDisplay) {
      this.targetColorDisplay.cleanup();
      this.targetColorDisplay = null;
    }
    
    if (this.comboMeter) {
      this.comboMeter.cleanup();
      this.comboMeter = null;
    }
    
    // Reset displays
    if (this.config.gameInfo) {
      this.config.gameInfo.style.display = 'none';
    }
    
    // Hide buttons
    setBackButtonVisible(false);
    setPauseButtonVisible(false);
    setRestartButtonVisible(false);
    hidePauseOverlay();
  }
  
  /* ===========================================================================
     GAME LOOP
     ===========================================================================*/
  
  /**
   * Start the game loop
   */
  startGameLoop() {
    const loop = (now) => {
      if (this.isPaused || this.gameState !== 'playing') return;
      
      const deltaTime = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      
      this.update(deltaTime, now);
      this.draw(this.config.ctx);
      
      this.animationId = requestAnimationFrame(loop);
    };
    
    this.animationId = requestAnimationFrame(loop);
  }
  
  /**
   * Update game state
   */
  update(deltaTime, now) {
    // Check round timer
    const elapsed = now - this.roundStartTime;
    if (elapsed >= this.roundDuration) {
      this.handleRoundEnd();
      return;
    }
    
    // Update difficulty
    this.applyDifficultyScaling();
    
    // Check color change timer
    const timeSinceColorChange = now - this.lastColorChangeTime;
    if (timeSinceColorChange >= this.colorChangeInterval) {
      this.handleColorChange();
    }
    
    // Spawn bubbles
    this.spawnBubbles(now);
    
    // Update bubbles
    this.updateBubbles(deltaTime, now);
    
    // Update effects
    effects.update(deltaTime, now);
    
    // Update UI
    this.updateUI();
  }
  
  /**
   * Draw game state
   */
  draw(ctx) {
    // Clear canvas
    this.config.canvasManager.clear();
    
    // Draw bubbles
    this.bubbles.forEach(bubble => {
      if (!bubble.dead) {
        bubble.draw(ctx, performance.now());
      }
    });
    
    // Draw effects
    effects.draw(ctx);
  }
  
  /* ===========================================================================
     BUBBLE MANAGEMENT
     ===========================================================================*/
  
  /**
   * Spawn bubbles based on game state
   */
  spawnBubbles(now) {
    if (now - this.lastSpawnTime < this.spawnInterval) return;
    
    const activeBubbles = getActiveBubbleCount(this.bubbles);
    const maxBubbles = COLOUR_RUSH_CONFIG.spawning.maxBubbles;
    
    if (activeBubbles >= maxBubbles) return;
    
    // Determine bubble type from spawn config
    const gameState = {
      currentTime: now,
      consecutivePops: this.consecutiveCorrect,
      isFreezeModeActive: false
    };
    
    const type = BubbleSpawnConfig.getNextBubbleType('colourrush', gameState);
    
    // Determine bubble color (target or distractor)
    const isTargetBubble = Math.random() < COLOUR_RUSH_CONFIG.spawning.targetColorProbability;
    const color = isTargetBubble 
      ? this.targetColor.hex 
      : this.getRandomDistractorColor();
    
    // Spawn bubble with color
    const spawned = this.spawnColoredBubble(now, color, type);
    
    if (spawned && isTargetBubble) {
      this.totalTargetBubbles++;
    }
    
    this.lastSpawnTime = now;
  }
  
  /**
   * Spawn a bubble with specific color
   */
  spawnColoredBubble(now, color, type) {
    const canvas = this.config.canvas;
    const baseRadius = 30 * this.bubbleRadiusScale;
    const radius = baseRadius + (Math.random() * 10 - 5);
    
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    
    const angle = Math.random() * Math.PI * 2;
    const baseSpeed = 1.5 * this.speedMultiplier;
    const speed = baseSpeed * (0.8 + Math.random() * 0.4);
    
    const speedX = Math.cos(angle) * speed;
    const speedY = Math.sin(angle) * speed;
    
    const bubble = new Bubble(x, y, radius, color, speedX, speedY, type, now);
    this.bubbles.push(bubble);
    
    return true;
  }
  
  /**
   * Update all bubbles
   */
  updateBubbles(deltaTime, now) {
    // Update each bubble
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      
      const wasMissed = bubble.update(
        deltaTime, 
        now, 
        'colourrush',
        null, // showUrgentMessage not used
        null, // endGame not used
        this.config.canvas
      );
      
      // Handle missed bubbles
      if (wasMissed && this.isColorMatch(bubble.color, this.targetColor.hex)) {
        // Missed a target bubble - reset combo
        this.updateCombo(false);
        BubbleSpawnConfig.notifyBubbleMissed();
      }
      
      // Remove dead bubbles
      if (bubble.dead) {
        this.bubbles.splice(i, 1);
      }
    }
    
    // Handle collisions
    for (let i = 0; i < this.bubbles.length; i++) {
      for (let j = i + 1; j < this.bubbles.length; j++) {
        handleBubbleCollision(this.bubbles[i], this.bubbles[j]);
      }
    }
  }
  
  /* ===========================================================================
     COLOR SYSTEM
     ===========================================================================*/
  
  /**
   * Select a new target color
   */
  selectNewTargetColor() {
    // Remove current color from available pool if it exists
    if (this.targetColor) {
      this.usedColors.push(this.targetColor);
    }
    
    // Refresh pool if exhausted
    if (this.availableColors.length === 0) {
      this.availableColors = [...COLOUR_RUSH_CONFIG.colors.easy];
      this.usedColors = [];
    }
    
    // Select random color
    const index = Math.floor(Math.random() * this.availableColors.length);
    this.targetColor = this.availableColors[index];
    this.availableColors.splice(index, 1);
    
    // Reset perfect round tracking
    this.totalTargetBubbles = 0;
    this.poppedTargetBubbles = 0;
    
    // Update display
    if (this.targetColorDisplay) {
      this.targetColorDisplay.setColor(this.targetColor.name, this.targetColor.hex);
    }
    
    console.log('[ColourRushMode] New target color:', this.targetColor.name);
  }
  
  /**
   * Get a random distractor color (not target)
   */
  getRandomDistractorColor() {
    const allColors = COLOUR_RUSH_CONFIG.colors.easy;
    const distractors = allColors.filter(c => c.hex !== this.targetColor.hex);
    
    if (distractors.length === 0) {
      // Fallback to a generic color
      return '#808080'; // Gray
    }
    
    const index = Math.floor(Math.random() * distractors.length);
    return distractors[index].hex;
  }
  
  /**
   * Check if bubble color matches target color
   */
  isColorMatch(bubbleColor, targetColor) {
    const distance = this.calculateColorDistance(bubbleColor, targetColor);
    const tolerance = COLOUR_RUSH_CONFIG.colors.colorMatchTolerance;
    return distance <= tolerance;
  }
  
  /**
   * Calculate Euclidean distance between two colors
   */
  calculateColorDistance(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  
  /**
   * Convert hex color to RGB object
   */
  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }
  
  /**
   * Handle color change event
   */
  handleColorChange() {
    console.log('[ColourRushMode] Color changing...');
    
    // Check for perfect round before changing
    if (this.checkPerfectRound()) {
      this.awardPerfectRound();
    }
    
    // Animate color change
    if (this.targetColorDisplay) {
      this.targetColorDisplay.animateChange();
    }
    
    // Play sound
    this.playSound('colorChange');
    
    // Select new color
    this.selectNewTargetColor();
    
    // Reset timer
    this.lastColorChangeTime = Date.now();
  }
  
  /* ===========================================================================
     COMBO SYSTEM
     ===========================================================================*/
  
  /**
   * Update combo state based on pop result
   */
  updateCombo(isCorrect) {
    if (isCorrect) {
      this.consecutiveCorrect++;
      
      // Update multiplier based on thresholds
      const thresholds = COLOUR_RUSH_CONFIG.scoring.comboThresholds;
      
      if (this.consecutiveCorrect >= 10) {
        this.comboMultiplier = thresholds[10];
      } else if (this.consecutiveCorrect >= 5) {
        this.comboMultiplier = thresholds[5];
      } else if (this.consecutiveCorrect >= 3) {
        this.comboMultiplier = thresholds[3];
      } else {
        this.comboMultiplier = 1.0;
      }
      
      console.log(`[ColourRushMode] Combo: ${this.consecutiveCorrect} (${this.comboMultiplier}x)`);
    } else {
      // Break combo
      if (this.consecutiveCorrect > 0) {
        console.log('[ColourRushMode] Combo broken!');
        this.playSound('comboBreak');
        this.comboMeter.shatter();
      }
      
      this.consecutiveCorrect = 0;
      this.comboMultiplier = 1.0;
    }
    
    // Update combo meter
    if (this.comboMeter) {
      this.comboMeter.update(this.consecutiveCorrect, this.comboMultiplier);
    }
  }
  
  /**
   * Check if all target bubbles in period were popped
   */
  checkPerfectRound() {
    if (this.totalTargetBubbles === 0) return false;
    return this.poppedTargetBubbles === this.totalTargetBubbles;
  }
  
  /**
   * Award perfect round bonus
   */
  awardPerfectRound() {
    const bonus = COLOUR_RUSH_CONFIG.scoring.perfectRoundBonus;
    this.totalScore += bonus;
    
    console.log('[ColourRushMode] Perfect round! +' + bonus);
    
    // Show floating text
    const canvas = this.config.canvas;
    spawnPointsText(bonus, canvas.width / 2, canvas.height / 2, '#FFD700');
    
    // Play sound
    this.playSound('perfectRound');
  }
  
  /* ===========================================================================
     EVENT HANDLERS
     ===========================================================================*/
  
  /**
   * Handle canvas pointer down (tap/click)
   */
  handlePointerDown(x, y) {
    if (this.gameState !== 'playing' || this.isPaused) return;
    
    // Check if any bubble was hit
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      
      if (bubble.popped || bubble.dead) continue;
      
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= bubble.radius) {
        this.handleBubblePop(bubble, x, y);
        return; // Only pop one bubble per tap
      }
    }
  }
  
  /**
   * Handle bubble pop
   */
  handleBubblePop(bubble, x, y) {
    const wasFullyPopped = bubble.pop(Date.now());
    
    if (!wasFullyPopped) {
      // Double-tap bubble, first tap
      return;
    }
    
    // Check if correct color
    const isCorrect = this.isColorMatch(bubble.color, this.targetColor.hex);
    
    this.totalPops++;
    
    if (isCorrect) {
      this.handleCorrectPop(bubble, x, y);
    } else {
      this.handleWrongPop(bubble, x, y);
    }
  }
  
  /**
   * Handle correct color pop
   */
  handleCorrectPop(bubble, x, y) {
    console.log('[ColourRushMode] Correct pop!');
    
    this.correctPops++;
    this.poppedTargetBubbles++;
    
    // Calculate points with multiplier
    const basePoints = COLOUR_RUSH_CONFIG.scoring.correctPop;
    const points = Math.round(basePoints * this.comboMultiplier);
    
    this.totalScore += points;
    
    // Update combo
    this.updateCombo(true);
    
    // Notify spawn config
    BubbleSpawnConfig.notifyBubblePopped(bubble.type, true);
    
    // Visual feedback
    spawnPointsText(points, x, y, '#00FF00');
    
    // Audio/haptic feedback
    this.playSound('correctPop');
    this.triggerHaptic(COLOUR_RUSH_CONFIG.haptics.correctPop);
  }
  
  /**
   * Handle wrong color pop
   */
  handleWrongPop(bubble, x, y) {
    console.log('[ColourRushMode] Wrong pop!');
    
    this.wrongPops++;
    
    const penalty = COLOUR_RUSH_CONFIG.scoring.wrongPop;
    this.totalScore += penalty; // penalty is negative
    
    // Break combo
    this.updateCombo(false);
    
    // Notify spawn config
    BubbleSpawnConfig.notifyBubblePopped(bubble.type, false);
    
    // Visual feedback
    spawnPointsText(penalty, x, y, '#FF0000');
    
    // Audio/haptic feedback
    this.playSound('wrongPop');
    this.triggerHaptic(COLOUR_RUSH_CONFIG.haptics.wrongPop);
  }
  
  /* ===========================================================================
     DIFFICULTY SCALING
     ===========================================================================*/
  
  /**
   * Calculate current difficulty level
   */
  calculateDifficultyLevel() {
    const elapsed = (Date.now() - this.roundStartTime) / 1000;
    const levelWithinRound = Math.floor(elapsed / 20); // Level up every 20s
    
    return Math.min(this.currentRound + levelWithinRound, 5);
  }
  
  /**
   * Apply difficulty scaling
   */
  applyDifficultyScaling() {
    const level = this.calculateDifficultyLevel();
    
    if (level !== this.difficultyLevel) {
      this.difficultyLevel = level;
      
      const config = COLOUR_RUSH_CONFIG.difficulty[level] || COLOUR_RUSH_CONFIG.difficulty[5];
      
      this.colorChangeInterval = config.colorChangeInterval;
      this.speedMultiplier = config.speedMultiplier;
      this.spawnInterval = config.spawnInterval;
      this.bubbleRadiusScale = config.radiusScale;
      
      console.log('[ColourRushMode] Difficulty level:', level);
    }
  }
  
  /* ===========================================================================
     ROUND MANAGEMENT
     ===========================================================================*/
  
  /**
   * Handle round end
   */
  async handleRoundEnd() {
    console.log('[ColourRushMode] Round', this.currentRound, 'ended');
    
    // Stop game loop temporarily
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.gameState = 'idle';
    
    // Check perfect round
    if (this.checkPerfectRound()) {
      this.awardPerfectRound();
    }
    
    if (this.currentRound < this.maxRounds) {
      // Show round transition
      await this.showRoundTransition();
      
      // Start next round
      this.currentRound++;
      this.roundStartTime = Date.now();
      this.lastColorChangeTime = Date.now();
      this.bubbles = [];
      this.consecutiveCorrect = 0;
      this.comboMultiplier = 1.0;
      
      // Select new color
      this.selectNewTargetColor();
      
      // Update UI
      this.updateUI();
      
      // Resume game
      this.gameState = 'playing';
      this.lastFrameTime = performance.now();
      this.startGameLoop();
      
      console.log('[ColourRushMode] Round', this.currentRound, 'started');
    } else {
      // Game over
      this.endGame();
    }
  }
  
  /**
   * Show round transition screen
   */
  async showRoundTransition() {
    return new Promise((resolve) => {
      showMessageBox(
        `Round ${this.currentRound} Complete!`,
        `Score: ${this.totalScore}\nStarting Round ${this.currentRound + 1}...`,
        []
      );
      
      setTimeout(async () => {
        await hideMessageBox();
        resolve();
      }, COLOUR_RUSH_CONFIG.rounds.transitionDuration);
    });
  }
  
  /* ===========================================================================
     RESULTS & RATINGS
     ===========================================================================*/
  
  /**
   * Calculate star rating
   */
  calculateStarRating() {
    const accuracy = this.totalPops > 0 
      ? (this.correctPops / this.totalPops) * 100
      : 0;
    
    for (const rating of COLOUR_RUSH_CONFIG.starRatings) {
      if (this.totalScore >= rating.minScore && accuracy >= rating.minAccuracy) {
        return rating.stars;
      }
    }
    
    return 0;
  }
  
  /**
   * Show final results screen
   */
  showFinalResults(stars, accuracy) {
    const starDisplay = '⭐'.repeat(stars) || 'No Stars';
    
    showMessageBox(
      'Colour Rush Complete!',
      `Final Score: ${this.totalScore}\nAccuracy: ${accuracy}%\nRating: ${starDisplay}`,
      [
        { 
          label: 'Play Again', 
          action: async () => {
            await hideMessageBox();
            await this.restart();
            // Note: Countdown will be handled by game.js after restart
          }
        },
        { 
          label: 'Main Menu', 
          action: async () => {
            await hideMessageBox();
            if (typeof goToMainMenu === 'function') {
              goToMainMenu();
            } else {
              // Fallback: Import and call from game.js
              const { goToMainMenu: menuFn } = await import('./game.js');
              menuFn();
            }
          }
        }
      ]
    );
  }
  
  /* ===========================================================================
     UI UPDATES
     ===========================================================================*/
  
  /**
   * Update UI displays
   */
  updateUI() {
    // Update score
    if (this.config.scoreDisplay) {
      this.config.scoreDisplay.textContent = `Score: ${this.totalScore}`;
    }
    
    // Calculate and display accuracy
    const accuracy = this.totalPops > 0 
      ? Math.round((this.correctPops / this.totalPops) * 100)
      : 100;
    
    // Update round timer (reuse classic timer display)
    if (this.config.classicTimerDisplay) {
      this.config.classicTimerDisplay.style.display = 'block';
      const timeRemaining = Math.ceil(
        (this.roundDuration - (Date.now() - this.roundStartTime)) / 1000
      );
      this.config.classicTimerDisplay.textContent = `Round ${this.currentRound}/${this.maxRounds} | Time: ${Math.max(0, timeRemaining)}s | Acc: ${accuracy}%`;
    }
  }
  
  /* ===========================================================================
     AUDIO & HAPTICS
     ===========================================================================*/
  
  /**
   * Play sound effect
   */
  playSound(soundKey) {
    if (!this.audioEnabled) return;
    
    // Placeholder for audio system integration
    console.log('[ColourRushMode] Play sound:', soundKey);
    
    // TODO: Integrate with AudioManager when implemented
    // Example: AudioManager.playSound(COLOUR_RUSH_CONFIG.audio[soundKey]);
  }
  
  /**
   * Trigger haptic feedback
   */
  triggerHaptic(config) {
    if (!this.hapticEnabled || !config) return;
    
    const { duration, intensity } = config;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }
}
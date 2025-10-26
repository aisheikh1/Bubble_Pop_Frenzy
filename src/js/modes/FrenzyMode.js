// src/js/modes/FrenzyMode.js

/**
 * FrenzyMode - A modular power-up system for Bubble Pop Frenzy
 * 
 * Lifecycle:
 * 1. IDLE → User pops freeze bubble → activate()
 * 2. ACTIVATING (0.5s) → Show "Go Frenzy!" + fill canvas
 * 3. ACTIVE (3.0s) → Countdown timer + frenzy gameplay
 * 4. ENDING → Show "Frenzy Time Up!" + clear canvas
 * 5. IDLE → Resume normal gameplay
 * 
 * @module FrenzyMode
 */

import { spawnBubble } from '../bubbles.js';
import { 
  showGoFrenzy, 
  showFrenzyTimeUp 
} from '../ui/urgentMessage.js';
import { effects } from '../effects/EffectManager.js';
import { FrenzyCountdownEffect } from '../effects/FrenzyCountdownEffect.js';
import { ScreenFlashEffect } from '../effects/ScreenFlashEffect.js';

/**
 * Frenzy Mode States
 * @enum {string}
 */
const FrenzyState = {
  IDLE: 'idle',           // Not active, waiting for activation
  ACTIVATING: 'activating', // Showing "Go Frenzy!" and filling canvas
  ACTIVE: 'active',        // Countdown running, player popping bubbles
  ENDING: 'ending'         // Showing end message and cleaning up
};

/**
 * FrenzyMode Class
 * Manages the complete lifecycle of frenzy power-up mode
 */
export class FrenzyMode {
  /**
   * @param {Object} config - Configuration object
   * @param {HTMLCanvasElement} config.canvas - Game canvas element
   * @param {Function} config.getBubbles - Returns current bubbles array
   * @param {Function} config.setBubbles - Sets bubbles array
   * @param {string} config.gameMode - Current game mode ('classic' or 'survival')
   * @param {Object} config.timers - Timer references for pause/resume
   * @param {Function} config.onStart - Callback when frenzy starts
   * @param {Function} config.onTick - Callback on each countdown tick
   * @param {Function} config.onEnd - Callback when frenzy ends
   * @param {Object} config.constants - Game constants override
   */
  constructor(config) {
    // Validate required config
    if (!config.canvas) throw new Error('FrenzyMode: canvas is required');
    if (!config.getBubbles) throw new Error('FrenzyMode: getBubbles is required');
    if (!config.setBubbles) throw new Error('FrenzyMode: setBubbles is required');
    
    // Core references
    this.canvas = config.canvas;
    this.getBubbles = config.getBubbles;
    this.setBubbles = config.setBubbles;
    this.gameMode = config.gameMode || 'classic';
    this.timers = config.timers || null;
    
    // Callbacks
    this.onStart = config.onStart || (() => {});
    this.onTick = config.onTick || (() => {});
    this.onEnd = config.onEnd || (() => {});
    
    // State management
    this.state = FrenzyState.IDLE;
    this.stateStartTime = 0;
    this.timeRemaining = 0;
    this.lastTickSecond = -1;
    
    // Visual effect references
    this.countdownEffect = null;
    
    // Configuration (can be overridden)
    const constants = config.constants || {};
    this.ACTIVATION_DURATION = constants.ACTIVATION_DURATION || 0.5;  // seconds
    this.COUNTDOWN_DURATION = constants.COUNTDOWN_DURATION || 3.0;     // seconds
    this.TOTAL_DURATION = constants.TOTAL_DURATION || 3.5;             // seconds
    this.ENDING_DURATION = constants.ENDING_DURATION || 1.0;           // seconds
    this.BUBBLE_FILL_COUNT = constants.BUBBLE_FILL_COUNT || 25;        // number of bubbles
    this.MIN_BUBBLE_SPACING = constants.MIN_BUBBLE_SPACING || 80;      // pixels between bubbles
    
    // Saved state (for pause/resume)
    this.pausedTime = null;
    this.pausedGameTimers = {
      classicTimeLeft: null,
      survivalTimeLeft: null
    };
  }
  
  /**
   * Activate frenzy mode
   * Transitions from IDLE to ACTIVATING state
   * @param {number} now - Current timestamp from performance.now()
   */
  activate(now = performance.now()) {
    if (this.state !== FrenzyState.IDLE) {
      console.warn('FrenzyMode: Cannot activate - already active or activating');
      return false;
    }
    
    // Transition to ACTIVATING state
    this.state = FrenzyState.ACTIVATING;
    this.stateStartTime = now;
    this.timeRemaining = this.TOTAL_DURATION;
    
    // Show activation message
    showGoFrenzy(500);
    effects.spawn(new ScreenFlashEffect('#FFD700', 0.3));
    
    // Fill canvas with bubbles after a brief delay (let message appear first)
    setTimeout(() => {
      this._fillCanvasWithBubbles(now);
    }, 100);
    
    // Notify game that frenzy started
    this.onStart();
    
    console.log('[FrenzyMode] Activated - entering ACTIVATING state');
    return true;
  }
  
  /**
   * Update frenzy mode state
   * Called every frame during gameplay
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {number} now - Current timestamp from performance.now()
   */
  update(deltaTime, now) {
    if (this.state === FrenzyState.IDLE) return;
    
    const stateElapsed = (now - this.stateStartTime) / 1000; // Convert to seconds
    
    switch (this.state) {
      case FrenzyState.ACTIVATING:
        this._updateActivating(stateElapsed, now);
        break;
        
      case FrenzyState.ACTIVE:
        this._updateActive(deltaTime, stateElapsed, now);
        break;
        
      case FrenzyState.ENDING:
        this._updateEnding(stateElapsed, now);
        break;
    }
  }
  
  /**
   * Update ACTIVATING state
   * Shows "Go Frenzy!" message and fills canvas
   * @private
   */
  _updateActivating(stateElapsed, now) {
    if (stateElapsed >= this.ACTIVATION_DURATION) {
      // Transition to ACTIVE state
      this.state = FrenzyState.ACTIVE;
      this.stateStartTime = now;
      this.timeRemaining = this.COUNTDOWN_DURATION;
      this.lastTickSecond = Math.ceil(this.timeRemaining);
      
      // Start countdown visual effect
      this._startCountdownEffect();
      
      console.log('[FrenzyMode] Entering ACTIVE state - countdown started');
    }
  }
  
  /**
   * Update ACTIVE state
   * Runs countdown timer and allows bubble popping
   * @private
   */
  _updateActive(deltaTime, stateElapsed, now) {
    // Decrement remaining time
    this.timeRemaining -= deltaTime;
    
    // Fire tick callback when second changes
    const currentSecond = Math.ceil(this.timeRemaining);
    if (currentSecond !== this.lastTickSecond && currentSecond >= 0) {
      this.lastTickSecond = currentSecond;
      this.onTick(currentSecond);
    }
    
    // Check if countdown finished
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      
      // Transition to ENDING state
      this.state = FrenzyState.ENDING;
      this.stateStartTime = now;
      
      // Show end message
      showFrenzyTimeUp(1500);
      effects.spawn(new ScreenFlashEffect('#FF6347', 0.3));
      
      // Clear all bubbles
      this._clearAllBubbles();
      
      console.log('[FrenzyMode] Entering ENDING state - frenzy complete');
    }
  }
  
  /**
   * Update ENDING state
   * Shows end message and cleans up
   * @private
   */
  _updateEnding(stateElapsed, now) {
    if (stateElapsed >= this.ENDING_DURATION) {
      // Complete deactivation
      this.deactivate();
    }
  }
  
  /**
   * Deactivate frenzy mode
   * Returns to IDLE state and notifies game
   */
  deactivate() {
    if (this.state === FrenzyState.IDLE) return;
    
    // Clean up countdown effect
    this.countdownEffect = null;
    
    // Return to IDLE state
    this.state = FrenzyState.IDLE;
    this.stateStartTime = 0;
    this.timeRemaining = 0;
    this.lastTickSecond = -1;
    
    // Notify game that frenzy ended
    this.onEnd();
    
    console.log('[FrenzyMode] Deactivated - returning to normal gameplay');
  }
  
  /**
   * Check if frenzy mode is currently active
   * @returns {boolean}
   */
  isActive() {
    return this.state !== FrenzyState.IDLE;
  }
  
  /**
   * Check if frenzy is in gameplay phase (ACTIVE state)
   * @returns {boolean}
   */
  isInGameplayPhase() {
    return this.state === FrenzyState.ACTIVE;
  }
  
  /**
   * Check if frenzy can be activated
   * @returns {boolean}
   */
  canActivate() {
    return this.state === FrenzyState.IDLE;
  }
  
  /**
   * Get current state
   * @returns {string}
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get remaining time
   * @returns {number}
   */
  getRemainingTime() {
    return Math.max(0, this.timeRemaining);
  }
  
  /**
   * Reset frenzy mode to initial state
   * Useful for game restarts
   */
  reset() {
    this.state = FrenzyState.IDLE;
    this.stateStartTime = 0;
    this.timeRemaining = 0;
    this.lastTickSecond = -1;
    this.countdownEffect = null;
    this.pausedTime = null;
    console.log('[FrenzyMode] Reset to IDLE state');
  }
  
  /**
   * Fill the canvas with normal bubbles
   * Uses smart spacing to avoid overlaps
   * @private
   */
  _fillCanvasWithBubbles(now) {
    const bubbles = this.getBubbles();
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const newBubbles = [];
    
    // Calculate grid-based positions for even distribution
    const cols = Math.ceil(Math.sqrt(this.BUBBLE_FILL_COUNT * (canvasWidth / canvasHeight)));
    const rows = Math.ceil(this.BUBBLE_FILL_COUNT / cols);
    const spacingX = canvasWidth / (cols + 1);
    const spacingY = canvasHeight / (rows + 1);
    
    let spawned = 0;
    
    for (let row = 0; row < rows && spawned < this.BUBBLE_FILL_COUNT; row++) {
      for (let col = 0; col < cols && spawned < this.BUBBLE_FILL_COUNT; col++) {
        // Calculate base position with some randomization
        const baseX = spacingX * (col + 1);
        const baseY = spacingY * (row + 1);
        
        // Add random offset (±20% of spacing)
        const offsetX = (Math.random() - 0.5) * spacingX * 0.4;
        const offsetY = (Math.random() - 0.5) * spacingY * 0.4;
        
        const x = baseX + offsetX;
        const y = baseY + offsetY;
        
        // Check if position is valid (not overlapping existing bubbles)
        const radius = Math.random() * 10 + 25; // 25-35px radius
        
        if (this._isPositionValid(x, y, radius, bubbles)) {
          // Spawn a normal bubble using the existing spawn function
          // We temporarily push to bubbles array to use spawnBubble's logic
          const originalLength = bubbles.length;
          
          // Force spawn by setting lastSpawnTime in the past
          const spawned = spawnBubble(
            now,
            this.canvas,
            bubbles,
            this.gameMode,
            'normal',  // Force normal type
            1,         // Base speed multiplier
            0          // No spawn interval
          );
          
          if (spawned) {
            // Get the newly spawned bubble
            const newBubble = bubbles[bubbles.length - 1];
            
            // Override position to our calculated position
            newBubble.x = x;
            newBubble.y = y;
            newBubble.radius = radius;
            newBubble.baseRadius = radius;
            
            // Set minimal initial velocity (bubbles start nearly stationary)
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3; // Very slow initial movement
            newBubble.speedX = Math.cos(angle) * speed;
            newBubble.speedY = Math.sin(angle) * speed;
            
            spawned++;
          }
        }
      }
    }
    
    console.log(`[FrenzyMode] Filled canvas with ${spawned} bubbles`);
  }
  
  /**
   * Check if a position is valid (no overlap with existing bubbles)
   * @private
   */
  _isPositionValid(x, y, radius, bubbles) {
    const margin = 10; // Extra spacing between bubbles
    
    // Check canvas boundaries
    if (x - radius < margin || x + radius > this.canvas.width - margin) return false;
    if (y - radius < margin || y + radius > this.canvas.height - margin) return false;
    
    // Check overlap with existing bubbles
    for (const bubble of bubbles) {
      if (bubble.popped || bubble.dead) continue;
      
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = radius + bubble.radius + margin;
      
      if (distance < minDistance) return false;
    }
    
    return true;
  }
  
  /**
   * Clear all bubbles from the canvas
   * @private
   */
  _clearAllBubbles() {
    this.setBubbles([]);
    console.log('[FrenzyMode] Cleared all bubbles from canvas');
  }
  
  /**
   * Start the countdown visual effect
   * @private
   */
  _startCountdownEffect() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height * 0.15; // Top 15% of canvas
    
    this.countdownEffect = new FrenzyCountdownEffect(
      centerX,
      centerY,
      this.COUNTDOWN_DURATION
    );
    
    effects.spawn(this.countdownEffect);
    console.log('[FrenzyMode] Started countdown effect');
  }
  
  /**
   * Pause frenzy mode (for game pause functionality)
   * @param {Object} gameTimers - Current game timer values to preserve
   */
  pause(gameTimers = {}) {
    if (!this.isActive()) return;
    
    this.pausedTime = this.timeRemaining;
    this.pausedGameTimers = { ...gameTimers };
    console.log('[FrenzyMode] Paused');
  }
  
  /**
   * Resume frenzy mode (after game unpause)
   * @param {number} now - Current timestamp
   */
  resume(now) {
    if (!this.isActive() || this.pausedTime === null) return;
    
    // Restore time and adjust state start time
    this.timeRemaining = this.pausedTime;
    this.stateStartTime = now;
    this.pausedTime = null;
    
    console.log('[FrenzyMode] Resumed');
  }
  
  /**
   * Get statistics about current frenzy session
   * @returns {Object}
   */
  getStats() {
    return {
      state: this.state,
      isActive: this.isActive(),
      timeRemaining: this.getRemainingTime(),
      activeBubbles: this.getBubbles().filter(b => !b.popped && !b.dead).length
    };
  }
}

// Export FrenzyState enum for external use
export { FrenzyState };
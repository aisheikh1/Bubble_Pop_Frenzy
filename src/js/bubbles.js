// src/js/bubbles.js

import { getRandomColor } from './utils/randomColor.js';

class Bubble {
  constructor(x, y, radius, color, speedX, speedY, type = 'normal', currentTime) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.radius = radius;
    this.color = color;
    this.speedX = speedX;
    this.speedY = speedY;
    this.popped = false;
    this.type = type;
    this.tapsNeeded = type === 'double' ? 2 : 1;
    this.tapsCount = 0;

    this.popStartTime = null;
    this.popDuration = 300; // ms
    this.opacity = 1;
    this.dead = false;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.02 + 0.01;

    // Properties for bubble lifetime (only applies when not in freeze mode or to the freeze bubble itself)
    this.creationTime = currentTime;
    this.maxLifetime = (this.type === 'freeze') ? 1500 : 1000; // 1.5s for freeze, 1s for others
    this.fadeStartTime = this.maxLifetime - 300; // Start fading 0.3s before maxLifetime

    // New properties for decoy/freeze bubble visual effect
    this.shinePhase = Math.random() * Math.PI * 2;
    this.shineSpeed = Math.random() * 0.05 + 0.03; // Speed of shine/blink animation
  }

  // ctx needs to be passed to draw, or provided globally if this module handles canvas itself.
  // For modularity, passing ctx is preferred.
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    let currentShadowBlur = 20 * this.opacity;
    let currentOpacity = this.opacity;

    // Decoy bubble specific drawing logic for shine/blink
    if (this.type === 'decoy') {
        const glowFactor = (Math.sin(this.shinePhase) * 0.5 + 0.5); // Oscillates between 0 and 1
        currentShadowBlur = 20 + (glowFactor * 30); // Dynamic shadow blur
        currentOpacity = this.opacity * (0.7 + glowFactor * 0.3); // Subtle opacity blink

        ctx.globalAlpha = currentOpacity; // Apply blinking opacity to the whole bubble

        const gradient = ctx.createRadialGradient(
            this.x + this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.1,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, `rgba(150,150,150,${currentOpacity * 0.9})`); // Lighter gray start
        gradient.addColorStop(0.2, '#555555'); // Darker gray middle
        gradient.addColorStop(1, `rgba(0,0,0,${0.4 * currentOpacity})`); // More opaque end

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.shadowColor = `rgba(255, 255, 0, ${glowFactor * 0.8})`; // Yellowish glow
        ctx.shadowBlur = currentShadowBlur;
        ctx.fill();
        ctx.closePath();

        // Gift box (a simple rectangle)
ctx.fillStyle = '#ff0000'; // Red gift box
const giftWidth = this.radius * 0.7;
const giftHeight = this.radius * 0.7;
const giftX = this.x - giftWidth / 2;
const giftY = this.y - giftHeight / 2;
ctx.fillRect(giftX, giftY, giftWidth, giftHeight);

// Ribbon
ctx.fillStyle = '#ffc0cb'; // Pink ribbon
// Vertical ribbon
ctx.fillRect(this.x - giftWidth / 8, giftY, giftWidth / 4, giftHeight);
// Horizontal ribbon
ctx.fillRect(giftX, this.y - giftHeight / 8, giftWidth, giftHeight / 4);

// "Pop Me" note
ctx.fillStyle = '#000000'; // Black text
ctx.font = `${this.radius * 0.25}px Arial`; // Smaller font for the note
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Pop Me', this.x, this.y + this.radius * 0.4);

    } else if (this.type === 'freeze') {
        const glowFactor = (Math.sin(this.shinePhase) * 0.5 + 0.5);
        currentShadowBlur = 20 + (glowFactor * 25); // Blueish dynamic shadow blur
        currentOpacity = this.opacity * (0.8 + glowFactor * 0.2); // Subtle opacity blink

        ctx.globalAlpha = currentOpacity;

        // White bubble fill
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.strokeStyle = '#000000'; // Dark black border
        ctx.lineWidth = 3; // Border thickness
        ctx.fill();
        ctx.stroke(); // Draw the border
        ctx.closePath();

        // Glow effect
        ctx.shadowColor = `rgba(0, 255, 255, ${glowFactor * 0.7})`; // Cyan glow
        ctx.shadowBlur = currentShadowBlur;

        // Draw lightning bolt
        ctx.fillStyle = '#FFD700'; // Gold color for lightning
        ctx.strokeStyle = '#FFA500'; // Orange border for lightning
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius * 0.3, this.y - this.radius * 0.4);
        ctx.lineTo(this.x + this.radius * 0.2, this.y - this.radius * 0.4);
        ctx.lineTo(this.x - this.radius * 0.1, this.y + this.radius * 0.1);
        ctx.lineTo(this.x + this.radius * 0.3, this.y + this.radius * 0.2);
        ctx.lineTo(this.x - this.radius * 0.2, this.y + this.radius * 0.4);
        ctx.lineTo(this.x - this.radius * 0.1, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    }
    else { // Normal and Double tap bubbles
      const gradient = ctx.createRadialGradient(
        this.x + this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.1,
        this.x, this.y, this.radius
      );
      gradient.addColorStop(0, `rgba(255,255,255,${this.opacity * 0.9})`);
      gradient.addColorStop(0.2, this.color);
      gradient.addColorStop(1, `rgba(0,0,0,${0.1 * this.opacity})`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = currentShadowBlur;
      ctx.fill();
      ctx.closePath();

      // Glossy highlight
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.4, this.y - this.radius * 0.4, this.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * this.opacity})`;
      ctx.fill();
      ctx.closePath();

      // Draw number 2 for double tap bubbles
      if (this.type === 'double') {
        ctx.fillStyle = '#000'; /* Number color */
        ctx.font = `${this.radius * 0.5}px Arial`; /* Adjust font size relative to bubble size */
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2', this.x, this.y);
      }
    }

    ctx.restore();
  }

  /**
   * Updates the bubble's state, position, and visual effects.
   * Returns true if the bubble was 'missed' (expired and not popped), false otherwise.
   *
   * @param {number} deltaTime - Time elapsed since the last frame in seconds.
   * @param {number} currentTime - The current time from performance.now().
   * @param {string} gameMode - The current game mode ('classic' or 'survival').
   * @param {boolean} isFreezeModeActive - Whether freeze mode is active.
   * @param {boolean} isGracePeriodActive - Whether the survival grace period is active.
   * @param {number} MAX_MISSES - The maximum allowed misses in survival mode.
   * @param {Function} showUrgentMessage - Function to display urgent messages.
   * @param {Function} endGame - Function to end the game.
   * @param {HTMLCanvasElement} canvas - The game canvas element.
   * @returns {boolean} True if the bubble was missed, false otherwise.
   */
  update(deltaTime, currentTime, gameMode, isFreezeModeActive, isGracePeriodActive, MAX_MISSES, showUrgentMessage, endGame, canvas) {
    if (this.popped) {
      if (!this.popStartTime) this.popStartTime = currentTime;

      const elapsed = currentTime - this.popStartTime;
      const progress = Math.min(elapsed / this.popDuration, 1);

      // Shrink radius and fade opacity
      this.radius = this.baseRadius * (1 - progress);
      this.opacity = 1 - progress;

      if (progress >= 1) {
        this.dead = true;
      }
      return false; // Not missed, it was popped
    }

    // Update shine phase for decoy and freeze bubbles
    if (this.type === 'decoy' || this.type === 'freeze') {
        this.shinePhase += this.shineSpeed * deltaTime;
        if (this.shinePhase > Math.PI * 2) {
            this.shinePhase -= Math.PI * 2;
        }
    }

    // Handle bubble lifetime in survival mode and freeze mode interaction
    if (gameMode === 'survival') {
      // If in freeze mode, bubbles (except the freeze bubble itself, which is already popped) do not expire
      if (isFreezeModeActive) {
        this.x += (this.speedX * 0.1) * deltaTime; // Drifts at 10% normal speed
        this.y += (this.speedY * 0.1) * deltaTime; // Drifts at 10% normal speed
        // Skip lifetime check, they will be cleared when freeze mode ends
      } else { // Normal survival mode (not in freeze mode)
        const elapsedLifetime = currentTime - this.creationTime;
        if (elapsedLifetime >= this.maxLifetime) {
            // Bubble missed (expired)
            if (!this.popped) { // Only count as missed if not popped
                // Only mark as missed if grace period is over AND it's not a freeze bubble
                if (!isGracePeriodActive && this.type !== 'freeze') {
                    this.dead = true; // Mark as dead
                    return true; // Signal that a bubble was missed
                }
            }
            this.dead = true; // Mark as dead even if during grace period or freeze bubble
            return false; // Not counted as a miss for counter purposes
        } else if (elapsedLifetime > this.fadeStartTime) {
            // Start fading out
            const fadeProgress = (elapsedLifetime - this.fadeStartTime) / (this.maxLifetime - this.fadeStartTime);
            this.opacity = 1 - fadeProgress;
            this.radius = this.baseRadius * (1 - fadeProgress * 0.5);
        }

        // Wobble movement in normal survival mode
        this.wobbleOffset += this.wobbleSpeed * deltaTime;
        const wobbleAmount = Math.sin(this.wobbleOffset) * 0.5;
        this.x += (this.speedX + wobbleAmount) * deltaTime;
        this.y += (this.speedY + wobbleAmount) * deltaTime;
      }
    } else { // Classic mode movement
      this.x += this.speedX * deltaTime;
      this.y += this.speedY * deltaTime;
    }

    // Pulsing effect (scaled by time for smoother animation)
    // Only apply if not actively fading out in survival mode and not in freeze mode (where movement is minimal)
    // Note: isFreezeModeActive check ensures bubbles don't pulse when movement is essentially frozen.
    if (!(gameMode === 'survival' && ((currentTime - this.creationTime) > this.fadeStartTime || isFreezeModeActive))) {
        this.radius = this.baseRadius + Math.sin(currentTime / 100) * 0.05 * this.baseRadius;
    }

    // Bounce off walls - requires canvas dimensions (canvas.width, canvas.height)
    // These should ideally be passed in or accessed from a canvas context object.
    if (canvas) { // Ensure canvas is available
      if (this.x + this.radius > canvas.width) {
        this.x = canvas.width - this.radius;
        this.speedX *= -1;
      }
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.speedX *= -1;
      }
      if (this.y + this.radius > canvas.height) {
        this.y = canvas.height - this.radius;
        this.speedY *= -1;
      }
      if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.speedY *= -1;
      }
    }
    return false; // Not missed in this update cycle
  }

  pop() {
    if (this.type === 'decoy' || this.type === 'freeze') {
      return false; // Decoy and Freeze bubbles are 'popped' but don't return true for scoring/combo
    }

    this.tapsCount++;
    if (this.tapsCount >= this.tapsNeeded) {
      this.popped = true;
      return true;
    }
    return false;
  }
}

/**
 * Spawns a new bubble with random properties.
 *
 * @param {string} [requestedType='normal'] - The type of bubble to spawn ('normal', 'decoy', 'double', 'freeze').
 * @param {boolean} [isForceSpawn=false] - If true, ignores maxBubbles limit for specific spawns (e.g., frenzy).
 *
 * @param {Object} context - An object containing necessary game state and dependencies.
 * @param {HTMLCanvasElement} context.canvas - The game canvas element.
 * @param {string} context.gameMode - The current game mode.
 * @param {number} context.gameStartTime - The time the game started.
 * @param {boolean} context.isFreezeModeActive - Whether freeze mode is active.
 * @param {boolean} context.freezeBubbleSpawnPending - Whether a freeze bubble is pending.
 * @param {number} context.maxBubbles - The maximum number of bubbles allowed.
 * @param {number} context.decoyChance - The current chance of spawning a decoy bubble.
 * @param {number} context.doubleTapChance - The current chance of spawning a double tap bubble.
 */
function spawnBubble(requestedType = 'normal', isForceSpawn = false, context) {
  const {
    canvas,
    gameMode,
    gameStartTime,
    isFreezeModeActive,
    freezeBubbleSpawnPending,
    maxBubbles,
    decoyChance,
    doubleTapChance
  } = context;

  const currentTime = performance.now();
  let type = requestedType;
  let radius;
  let speed;

  // Define a map of modes to bubble probabilities
  const modeConfigs = {
    'classic': {
      decoyAvailable: false,
      doubleTapAvailable: false,
      speed: 50
    },
    'survival': {
      decoyAvailable: true,
      doubleTapAvailable: true,
      speed: 50
    },
    // Add other modes here as needed
    'newMode': {
      decoyAvailable: true,
      doubleTapAvailable: true,
      speed: 70
    }
  };
  
  const currentConfig = modeConfigs[gameMode] || modeConfigs['classic']; // Default to classic if mode not found
  
  // Update speeds and chances based on the mode config
  speed = currentConfig.speed;
  
  if (requestedType === 'normal' && !isForceSpawn) {
    const rand = Math.random();
    if (currentConfig.decoyAvailable && rand < decoyChance) {
      type = 'decoy';
    } else if (currentConfig.doubleTapAvailable && rand < decoyChance + doubleTapChance) {
      type = 'double';
    }
  }

  // Old logic for survival and freeze mode
  if (gameMode === 'survival') {
    if (isFreezeModeActive && !isForceSpawn) return;
    const timeSurvived = (performance.now() - gameStartTime) / 1000;
    const baseSize = Math.max(10, 40 - (timeSurvived / 10));
    radius = Math.random() * 10 + baseSize;
    speed = 50 + (timeSurvived * 2);
  } else {
    radius = Math.random() * 20 + 20;
    // Set a consistent bubble size for new modes
    if (gameMode === 'newMode') {
      radius = Math.random() * 15 + 25;
    }
  }
  
  if (type === 'freeze') {
    radius = Math.random() * 10 + 30;
    speed = 40;
  } else if (isForceSpawn) {
    radius = Math.random() * 15 + 20;
    speed = 10;
  }
  
  const x = Math.random() * (canvas.width - 2 * radius) + radius;
  const y = Math.random() * (canvas.height - 2 * radius) + radius;
  const angle = Math.random() * Math.PI * 2;
  const speedX = Math.cos(angle) * speed;
  const speedY = Math.sin(angle) * speed;

  return new Bubble(x, y, radius, type === 'decoy' ? '#333333' : (type === 'freeze' ? '#FFFFFF' : getRandomColor()), speedX, speedY, type, currentTime);
}

export { Bubble, spawnBubble };
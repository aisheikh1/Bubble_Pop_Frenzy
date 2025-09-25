// src/js/bubbles.js

import { getRandomColor } from './utils/randomColor.js';
import { effects } from './effects/EffectManager.js';
import { PopEffect } from './effects/PopEffect.js';
import { BubbleSplatEffect } from './effects/BubbleSplatEffect.js';

// Helper function to convert a hex color to an RGBA string with opacity
const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

class Bubble {
  constructor(x, y, radius, color, speedX, speedY, type = 'normal', currentTime) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.radius = radius;
    this.color = color;
    this.initialColor = color; // Store the original color for effects
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
    this.wobbleSpeed = Math.random() * 0.005 + 0.005; // ms
    this.creationTime = currentTime;
    this.maxLifetime = type === 'decoy' ? 3000 : 7000; // Decoys last for 3s, others 7s
  }

  draw(ctx, now) {
    if (this.popped) {
      this.opacity = 1 - (now - this.popStartTime) / this.popDuration;
      this.radius = this.baseRadius + 10 * ((now - this.popStartTime) / this.popDuration);
    }

    if (this.opacity <= 0) {
      this.dead = true;
      return;
    }

    ctx.save();
    
    // Create a radial gradient for a more spherical look
    const gradient = ctx.createRadialGradient(
      this.x - this.radius / 4, this.y - this.radius / 4, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, hexToRgba(this.color, this.opacity));
    gradient.addColorStop(1, hexToRgba(this.color, this.opacity * 0.5));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Add a glowing shadow
    ctx.shadowBlur = 10;
    ctx.shadowColor = hexToRgba(this.color, this.opacity * 0.8);

    ctx.restore(); // Restore the previous state, resetting shadow properties
  }

  update(deltaTime, now, gameMode, isFreezeModeActive, showUrgentMessage, endGame, gameCanvas) {
    // Check if the bubble is at the end of its life
    if (now - this.creationTime > this.maxLifetime) {
        if (!this.popped) {
            // This bubble was missed
            this.dead = true;
            return true; // Return true to indicate a bubble was missed
        }
      this.dead = true;
      return false;
    }

    if (this.popped) return false;
    
    if (isFreezeModeActive) return false; // Bubbles don't move in freeze mode

    this.x += this.speedX * deltaTime * 60;
    this.y += this.speedY * deltaTime * 60;
    
    // Wobble effect
    this.x += Math.sin(now * this.wobbleSpeed + this.wobbleOffset);
    this.y += Math.cos(now * this.wobbleSpeed + this.wobbleOffset);
    
    // Boundary checks to bounce
    if (this.x - this.radius < 0 || this.x + this.radius > gameCanvas.width) {
      this.speedX *= -1;
    }
    if (this.y - this.radius < 0 || this.y + this.radius > gameCanvas.height) {
      this.speedY *= -1;
    }

    return false; // Return false if the bubble was not missed
  }

  pop(currentTime) {
    this.tapsCount++;
    if (this.tapsCount === this.tapsNeeded) {
      this.popped = true;
      this.popStartTime = currentTime;
      effects.add(new PopEffect(this.x, this.y, this.baseRadius, this.color));
      effects.add(new BubbleSplatEffect(this.x, this.y, this.color));
      return true;
    } else {
      // Return false to indicate the bubble was not fully popped yet
      return false;
    }
  }
}

/**
 * Spawns a new bubble at a random location on the canvas.
 * @param {number} now - Current timestamp.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 * @param {Array<Bubble>} bubbles - The array to add the new bubble to.
 * @param {string} gameMode - The current game mode.
 * @param {string} type - The type of bubble to spawn ('normal', 'double', 'freeze', 'decoy', 'bomb').
 * @param {number} speedMultiplier - Multiplier to increase bubble speed.
 * @param {number} spawnInterval - The interval between spawns.
 */
let lastSpawnTime = 0;
function spawnBubble(now, canvas, bubbles, gameMode, type = null, speedMultiplier = 1, spawnInterval = 1000) {
    if (now - lastSpawnTime > spawnInterval) {
        const radius = Math.random() * (40 - 20) + 20;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;
        const color = getRandomColor();
        const baseSpeed = 0.5;
        const speedX = (Math.random() - 0.5) * baseSpeed * speedMultiplier;
        const speedY = (Math.random() - 0.5) * baseSpeed * speedMultiplier;

        if (!type) {
            // Determine random type for new bubbles
            const rand = Math.random();
            if (gameMode === 'survival') {
                if (rand < 0.05) type = 'decoy';
                else if (rand < 0.25) type = 'double';
                else type = 'normal';
            } else {
                if (rand < 0.2) type = 'double';
                else type = 'normal';
            }
        }

        const newBubble = new Bubble(x, y, radius, color, speedX, speedY, type, now);
        bubbles.push(newBubble);

        lastSpawnTime = now;
        return true; // A bubble was successfully spawned
    }
    return false; // No bubble was spawned this frame
}

export { Bubble, spawnBubble };
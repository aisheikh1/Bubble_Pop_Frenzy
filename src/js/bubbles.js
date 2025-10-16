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
    this.wobbleSpeed = Math.random() * 0.003 + 0.003; // Reduced wobble for cleaner movement
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

    // Apply movement with deltaTime normalization
    this.x += this.speedX * deltaTime * 60;
    this.y += this.speedY * deltaTime * 60;
    
    // Subtle wobble effect (reduced for cleaner directional movement)
    const wobbleAmount = 0.3; // Reduced wobble intensity
    this.x += Math.sin(now * this.wobbleSpeed + this.wobbleOffset) * wobbleAmount;
    this.y += Math.cos(now * this.wobbleSpeed + this.wobbleOffset) * wobbleAmount;
    
    // Boundary checks with intelligent bounce direction
    if (this.x - this.radius < 0) {
      this.x = this.radius; // Prevent sticking
      this.speedX = Math.abs(this.speedX); // Bounce right
      this.intelligentBounce(gameCanvas);
    } else if (this.x + this.radius > gameCanvas.width) {
      this.x = gameCanvas.width - this.radius; // Prevent sticking
      this.speedX = -Math.abs(this.speedX); // Bounce left
      this.intelligentBounce(gameCanvas);
    }
    
    if (this.y - this.radius < 0) {
      this.y = this.radius; // Prevent sticking
      this.speedY = Math.abs(this.speedY); // Bounce down
      this.intelligentBounce(gameCanvas);
    } else if (this.y + this.radius > gameCanvas.height) {
      this.y = gameCanvas.height - this.radius; // Prevent sticking
      this.speedY = -Math.abs(this.speedY); // Bounce up
      this.intelligentBounce(gameCanvas);
    }

    return false; // Return false if the bubble was not missed
  }

  // Intelligent bounce that adds variation and ensures movement toward open space
  intelligentBounce(gameCanvas) {
    // Add significant random angle variation (±45 degrees)
    const angleVariation = (Math.random() - 0.5) * Math.PI / 2;
    const currentAngle = Math.atan2(this.speedY, this.speedX);
    const newAngle = currentAngle + angleVariation;
    const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
    
    // Apply new direction
    this.speedX = Math.cos(newAngle) * speed;
    this.speedY = Math.sin(newAngle) * speed;
    
    // Add a slight speed boost on bounce (10-20% increase)
    const boostFactor = 1.1 + Math.random() * 0.1;
    this.speedX *= boostFactor;
    this.speedY *= boostFactor;
    
    // Cap maximum speed to prevent extreme velocities
    const maxSpeed = 4;
    const currentSpeed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
    if (currentSpeed > maxSpeed) {
      this.speedX = (this.speedX / currentSpeed) * maxSpeed;
      this.speedY = (this.speedY / currentSpeed) * maxSpeed;
    }
  }

  // Add random variation to direction after collision
  randomizeDirection() {
    const angleVariation = (Math.random() - 0.5) * Math.PI / 1.5; // ±60 degrees
    const currentAngle = Math.atan2(this.speedY, this.speedX);
    const newAngle = currentAngle + angleVariation;
    const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
    
    this.speedX = Math.cos(newAngle) * speed;
    this.speedY = Math.sin(newAngle) * speed;
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
 * Check collision between two bubbles and handle bounce with improved physics
 */
function handleBubbleCollision(bubble1, bubble2) {
  const dx = bubble2.x - bubble1.x;
  const dy = bubble2.y - bubble1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = bubble1.radius + bubble2.radius;

  // Check if bubbles are colliding
  if (distance < minDistance && distance > 0) {
    // Calculate collision normal (unit vector from bubble1 to bubble2)
    const nx = dx / distance;
    const ny = dy / distance;

    // Separate bubbles to prevent overlap
    const overlap = minDistance - distance;
    const separationX = nx * overlap * 0.5;
    const separationY = ny * overlap * 0.5;
    
    bubble1.x -= separationX;
    bubble1.y -= separationY;
    bubble2.x += separationX;
    bubble2.y += separationY;

    // Calculate relative velocity
    const dvx = bubble2.speedX - bubble1.speedX;
    const dvy = bubble2.speedY - bubble1.speedY;

    // Calculate relative velocity in collision normal direction
    const dvn = dvx * nx + dvy * ny;

    // Only bounce if bubbles are moving toward each other
    if (dvn < 0) {
      // Enhanced elastic collision with energy boost
      const restitution = 1.15; // Slightly more than perfectly elastic (adds energy)
      const bounceX = nx * dvn * restitution;
      const bounceY = ny * dvn * restitution;

      bubble1.speedX += bounceX;
      bubble1.speedY += bounceY;
      bubble2.speedX -= bounceX;
      bubble2.speedY -= bounceY;

      // Add random variation to make bounces more dynamic
      bubble1.randomizeDirection();
      bubble2.randomizeDirection();
      
      // Ensure minimum speed after collision
      const minSpeed = 0.8;
      const speed1 = Math.sqrt(bubble1.speedX ** 2 + bubble1.speedY ** 2);
      const speed2 = Math.sqrt(bubble2.speedX ** 2 + bubble2.speedY ** 2);
      
      if (speed1 < minSpeed) {
        const factor = minSpeed / speed1;
        bubble1.speedX *= factor;
        bubble1.speedY *= factor;
      }
      
      if (speed2 < minSpeed) {
        const factor = minSpeed / speed2;
        bubble2.speedX *= factor;
        bubble2.speedY *= factor;
      }
    }
  }
}

/**
 * Spawns a new bubble at a random location on the canvas with increased speed.
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
        
        // Increased base speed from 0.5 to 1.5 (3x faster)
        const baseSpeed = 1.5;
        
        // Generate random angle for initial direction
        const angle = Math.random() * Math.PI * 2;
        const speed = baseSpeed * (0.8 + Math.random() * 0.4); // Vary speed by ±20%
        
        const speedX = Math.cos(angle) * speed * speedMultiplier;
        const speedY = Math.sin(angle) * speed * speedMultiplier;

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

export { Bubble, spawnBubble, handleBubbleCollision };
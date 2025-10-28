// src/js/bubbles.js

import { getRandomColor } from './utils/randomColor.js';
import { effects } from './effects/EffectManager.js';
import { PopEffect } from './effects/PopEffect.js';
import { BubbleSplatEffect } from './effects/BubbleSplatEffect.js';
import { BubbleSpawnConfig } from './BubbleSpawnConfig.js';

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

  update(deltaTime, now, gameMode, showUrgentMessage, endGame, gameCanvas) {
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
 * Now uses BubbleSpawnConfig for type determination.
 * * @param {number} now - Current timestamp.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 * @param {Array<Bubble>} bubbles - The array to add the new bubble to.
 * @param {string} gameMode - The current game mode.
 * @param {string} type - The type of bubble to spawn (null for auto-determination).
 * @param {number} speedMultiplier - Multiplier to increase bubble speed.
 * @param {number} spawnInterval - The interval between spawns.
 * @param {Object} gameState - Current game state for spawn config
 * @returns {boolean} True if a bubble was spawned, false otherwise.
 */
let lastSpawnTime = 0;
function spawnBubble(now, canvas, bubbles, gameMode, type = null, speedMultiplier = 1, spawnInterval = 1000, gameState = {}) {
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

        // Use BubbleSpawnConfig to determine bubble type if not specified
        if (!type) {
            type = BubbleSpawnConfig.getNextBubbleType(gameMode, gameState);
        }

        const newBubble = new Bubble(x, y, radius, color, speedX, speedY, type, now);
        bubbles.push(newBubble);

        lastSpawnTime = now;
        return true; // A bubble was successfully spawned
    }
    return false; // No bubble was spawned this frame
}

// ============================================================================
// UTILITY FUNCTIONS - For frenzy mode and advanced bubble management
// ============================================================================

/**
 * Spawn multiple bubbles instantly without timing constraints
 * Used by frenzy mode to fill the canvas quickly
 * * @param {number} count - Number of bubbles to spawn
 * @param {HTMLCanvasElement} canvas - The game canvas
 * @param {Array<Bubble>} bubbles - Existing bubbles array
 * @param {string} type - Bubble type to spawn (default: 'normal')
 * @param {number} now - Current timestamp
 * @param {Object} options - Optional configuration
 * @param {number} options.minRadius - Minimum bubble radius (default: 20)
 * @param {number} options.maxRadius - Maximum bubble radius (default: 40)
 * @param {number} options.minSpeed - Minimum initial speed (default: 0.3)
 * @param {number} options.maxSpeed - Maximum initial speed (default: 0.8)
 * @param {number} options.minSpacing - Minimum spacing between bubbles (default: 10)
 * @param {number} options.maxAttempts - Max spawn attempts per bubble (default: 50)
 * @returns {Array<Bubble>} Array of newly spawned bubbles
 */
function spawnMultipleBubbles(count, canvas, bubbles, type = 'normal', now, options = {}) {
  const {
    minRadius = 20,
    maxRadius = 40,
    minSpeed = 0.3,
    maxSpeed = 0.8,
    minSpacing = 10,
    maxAttempts = 50
  } = options;

  const spawned = [];
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    let x, y, radius;
    
    // Try to find a valid position
    while (!validPosition && attempts < maxAttempts) {
      radius = Math.random() * (maxRadius - minRadius) + minRadius;
      x = Math.random() * (canvas.width - radius * 2) + radius;
      y = Math.random() * (canvas.height - radius * 2) + radius;
      
      // Check if position is valid (no overlap with existing bubbles)
      validPosition = isPositionValid(x, y, radius, bubbles, minSpacing);
      attempts++;
    }
    
    // If we couldn't find a valid position, skip this bubble
    if (!validPosition) {
      console.warn(`[spawnMultipleBubbles] Could not find valid position for bubble ${i + 1}/${count}`);
      continue;
    }
    
    // Generate random direction and speed
    const angle = Math.random() * Math.PI * 2;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const speedX = Math.cos(angle) * speed;
    const speedY = Math.sin(angle) * speed;
    
    const color = getRandomColor();
    const newBubble = new Bubble(x, y, radius, color, speedX, speedY, type, now);
    
    bubbles.push(newBubble);
    spawned.push(newBubble);
  }
  
  console.log(`[spawnMultipleBubbles] Successfully spawned ${spawned.length}/${count} bubbles`);
  return spawned;
}

/**
 * Check if a position is valid for spawning a bubble
 * Ensures no overlap with existing bubbles and stays within canvas bounds
 * * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} radius - Bubble radius
 * @param {Array<Bubble>} bubbles - Existing bubbles
 * @param {number} spacing - Minimum spacing between bubbles (default: 10)
 * @returns {boolean} True if position is valid
 */
function isPositionValid(x, y, radius, bubbles, spacing = 10) {
  // Check canvas boundaries
  if (x - radius < spacing) return false;
  if (y - radius < spacing) return false;
  // Note: We can't check canvas.width/height here without passing canvas
  // The caller should ensure x, y are within bounds
  
  // Check overlap with existing bubbles
  for (const bubble of bubbles) {
    if (bubble.popped || bubble.dead) continue;
    
    const dx = x - bubble.x;
    const dy = y - bubble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = radius + bubble.radius + spacing;
    
    if (distance < minDistance) return false;
  }
  
  return true;
}

/**
 * Get count of active (not popped, not dead) bubbles
 * * @param {Array<Bubble>} bubbles - Bubbles array
 * @returns {number} Count of active bubbles
 */
function getActiveBubbleCount(bubbles) {
  return bubbles.filter(b => !b.popped && !b.dead).length;
}

/**
 * Get count of bubbles by type
 * * @param {Array<Bubble>} bubbles - Bubbles array
 * @param {string} type - Bubble type ('normal', 'double', 'decoy')
 * @param {boolean} activeOnly - Only count active bubbles (default: true)
 * @returns {number} Count of matching bubbles
 */
function getBubbleCountByType(bubbles, type, activeOnly = true) {
  return bubbles.filter(b => {
    if (activeOnly && (b.popped || b.dead)) return false;
    return b.type === type;
  }).length;
}

/**
 * Clear all bubbles of a specific type
 * Useful for power-ups or special events
 * * @param {Array<Bubble>} bubbles - Bubbles array (modified in place)
 * @param {string} type - Bubble type to clear (or 'all' for all bubbles)
 * @returns {number} Number of bubbles cleared
 */
function clearBubblesByType(bubbles, type = 'all') {
  if (type === 'all') {
    const count = bubbles.length;
    bubbles.length = 0; // Clear array
    return count;
  }
  
  const initialLength = bubbles.length;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (bubbles[i].type === type) {
      bubbles.splice(i, 1);
    }
  }
  return initialLength - bubbles.length;
}

/**
 * Get all bubbles within a radius of a point
 * Useful for area-of-effect mechanics
 * * @param {Array<Bubble>} bubbles - Bubbles array
 * @param {number} x - Center X coordinate
 * @param {number} y - Center Y coordinate
 * @param {number} radius - Search radius
 * @param {boolean} activeOnly - Only include active bubbles (default: true)
 * @returns {Array<Bubble>} Bubbles within radius
 */
function getBubblesInRadius(bubbles, x, y, radius, activeOnly = true) {
  return bubbles.filter(b => {
    if (activeOnly && (b.popped || b.dead)) return false;
    
    const dx = b.x - x;
    const dy = b.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= radius;
  });
}

/**
 * Set velocity for all bubbles (or specific types)
 * Useful for freeze effects or speed changes
 * * @param {Array<Bubble>} bubbles - Bubbles array
 * @param {number} speedX - New X velocity
 * @param {number} speedY - New Y velocity
 * @param {string} type - Bubble type filter (null for all types)
 */
function setBubbleVelocity(bubbles, speedX, speedY, type = null) {
  bubbles.forEach(b => {
    if (b.popped || b.dead) return;
    if (type && b.type !== type) return;
    
    b.speedX = speedX;
    b.speedY = speedY;
  });
}

/**
 * Scale bubble velocities by a multiplier
 * Useful for slow-motion or speed-up effects
 * * @param {Array<Bubble>} bubbles - Bubbles array
 * @param {number} multiplier - Speed multiplier
 * @param {string} type - Bubble type filter (null for all types)
 */
function scaleBubbleVelocity(bubbles, multiplier, type = null) {
  bubbles.forEach(b => {
    if (b.popped || b.dead) return;
    if (type && b.type !== type) return;
    
    b.speedX *= multiplier;
    b.speedY *= multiplier;
  });
}

/**
 * Get statistics about current bubbles
 * Useful for debugging and game balance
 * * @param {Array<Bubble>} bubbles - Bubbles array
 * @returns {Object} Statistics object
 */
function getBubbleStats(bubbles) {
  const stats = {
    total: bubbles.length,
    active: 0,
    popped: 0,
    dead: 0,
    byType: {
      normal: 0,
      double: 0,
      decoy: 0
    },
    avgSpeed: 0,
    avgRadius: 0
  };
  
  let totalSpeed = 0;
  let totalRadius = 0;
  
  bubbles.forEach(b => {
    if (b.popped) stats.popped++;
    if (b.dead) stats.dead++;
    if (!b.popped && !b.dead) stats.active++;
    
    stats.byType[b.type] = (stats.byType[b.type] || 0) + 1;
    
    const speed = Math.sqrt(b.speedX ** 2 + b.speedY ** 2);
    totalSpeed += speed;
    totalRadius += b.radius;
  });
  
  if (bubbles.length > 0) {
    stats.avgSpeed = totalSpeed / bubbles.length;
    stats.avgRadius = totalRadius / bubbles.length;
  }
  
  return stats;
}

/**
 * Reset the spawn timer
 * Useful when changing game modes or after special events
 */
function resetSpawnTimer() {
  lastSpawnTime = 0;
}

export { 
  Bubble, 
  spawnBubble, 
  handleBubbleCollision,
  
  // Utility functions
  spawnMultipleBubbles,
  isPositionValid,
  getActiveBubbleCount,
  getBubbleCountByType,
  clearBubblesByType,
  getBubblesInRadius,
  setBubbleVelocity,
  scaleBubbleVelocity,
  getBubbleStats,
  resetSpawnTimer
};
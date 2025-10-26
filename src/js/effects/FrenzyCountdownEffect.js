// src/js/effects/FrenzyCountdownEffect.js

/**
 * FrenzyCountdownEffect - Visual countdown timer for frenzy mode
 * 
 * Displays a large countdown number during frenzy mode gameplay.
 * Features:
 * - Smooth pulsing animation
 * - Color changes as time runs out
 * - Glow effect for visibility
 * - Fade in/out transitions
 * - Number change animations
 * 
 * @module FrenzyCountdownEffect
 */

/**
 * FrenzyCountdownEffect Class
 * Renders an animated countdown timer on the canvas
 */
export class FrenzyCountdownEffect {
  /**
   * @param {number} x - X position (typically canvas center)
   * @param {number} y - Y position (typically upper portion of canvas)
   * @param {number} initialTime - Starting countdown time in seconds
   */
  constructor(x, y, initialTime) {
    this.x = x;
    this.y = y;
    this.initialTime = initialTime;
    this.timeRemaining = initialTime;
    this.startTime = performance.now();
    
    // Visual properties
    this.opacity = 0;
    this.scale = 1;
    this.pulsePhase = 0;
    this.glowIntensity = 1;
    
    // Animation states
    this.fadeInComplete = false;
    this.fadeOutStarted = false;
    this.lastDisplayedSecond = Math.ceil(initialTime);
    this.numberChangeTime = 0;
    
    // Animation configuration
    this.FADE_IN_DURATION = 0.3;      // seconds
    this.FADE_OUT_DURATION = 0.5;     // seconds
    this.PULSE_SPEED = 2;             // cycles per second
    this.PULSE_SCALE_MIN = 0.95;      // minimum scale during pulse
    this.PULSE_SCALE_MAX = 1.05;      // maximum scale during pulse
    this.NUMBER_CHANGE_ANIM_DURATION = 0.2; // seconds
    
    // Color scheme (changes based on time remaining)
    this.colors = {
      high: { main: '#FFD700', glow: '#FFA500' },    // Gold when time is plenty
      medium: { main: '#FFA500', glow: '#FF8C00' },  // Orange when getting low
      low: { main: '#FF4500', glow: '#FF0000' },     // Red when almost done
      critical: { main: '#FF0000', glow: '#8B0000' } // Deep red when critical
    };
  }
  
  /**
   * Update the countdown effect
   * @param {number} dtSec - Delta time in seconds
   * @param {number} nowMs - Current timestamp from performance.now()
   * @returns {boolean} True when effect is complete and should be removed
   */
  update(dtSec, nowMs) {
    const elapsed = (nowMs - this.startTime) / 1000;
    
    // Update time remaining
    this.timeRemaining = Math.max(0, this.initialTime - elapsed);
    
    // Handle fade in
    if (!this.fadeInComplete) {
      this.opacity = Math.min(1, elapsed / this.FADE_IN_DURATION);
      if (this.opacity >= 1) {
        this.fadeInComplete = true;
      }
    }
    
    // Handle fade out when time is up
    if (this.timeRemaining <= 0 && !this.fadeOutStarted) {
      this.fadeOutStarted = true;
      this.fadeOutStartTime = nowMs;
    }
    
    if (this.fadeOutStarted) {
      const fadeOutElapsed = (nowMs - this.fadeOutStartTime) / 1000;
      this.opacity = Math.max(0, 1 - (fadeOutElapsed / this.FADE_OUT_DURATION));
      
      // Effect is complete when fully faded out
      if (this.opacity <= 0) {
        return true;
      }
    }
    
    // Pulse animation (continuous heartbeat effect)
    this.pulsePhase += dtSec * this.PULSE_SPEED * Math.PI * 2;
    const pulseValue = Math.sin(this.pulsePhase);
    this.scale = this.PULSE_SCALE_MIN + 
                 (this.PULSE_SCALE_MAX - this.PULSE_SCALE_MIN) * 
                 ((pulseValue + 1) / 2);
    
    // Increase pulse intensity when time is running out
    if (this.timeRemaining <= 1) {
      this.scale *= 1.1; // Extra emphasis in final second
    }
    
    // Glow intensity pulsing
    this.glowIntensity = 0.6 + 0.4 * ((pulseValue + 1) / 2);
    
    // Detect number change for special animation
    const currentSecond = Math.ceil(this.timeRemaining);
    if (currentSecond !== this.lastDisplayedSecond) {
      this.lastDisplayedSecond = currentSecond;
      this.numberChangeTime = nowMs;
      
      // Trigger a brief scale pop on number change
      this.scale *= 1.2;
    }
    
    // Number change animation (pop effect)
    if (nowMs - this.numberChangeTime < this.NUMBER_CHANGE_ANIM_DURATION * 1000) {
      const changeProgress = (nowMs - this.numberChangeTime) / 
                            (this.NUMBER_CHANGE_ANIM_DURATION * 1000);
      const popScale = 1 + (0.2 * (1 - changeProgress));
      this.scale *= popScale;
    }
    
    return false; // Effect continues
  }
  
  /**
   * Draw the countdown effect
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    if (this.opacity <= 0) return;
    
    const displayNumber = Math.ceil(this.timeRemaining);
    
    // Don't display negative or zero
    if (displayNumber <= 0) return;
    
    // Get color based on remaining time
    const colorScheme = this._getColorScheme();
    
    ctx.save();
    
    // Apply global opacity
    ctx.globalAlpha = this.opacity;
    
    // Position and scale
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    
    // Draw glow layers (multiple for intensity)
    this._drawGlow(ctx, displayNumber, colorScheme.glow);
    
    // Draw outline (for contrast)
    this._drawOutline(ctx, displayNumber);
    
    // Draw main number
    this._drawMainNumber(ctx, displayNumber, colorScheme.main);
    
    ctx.restore();
  }
  
  /**
   * Draw glow effect behind the number
   * @private
   */
  _drawGlow(ctx, number, glowColor) {
    const fontSize = this._getFontSize();
    
    // Multiple glow layers for depth
    const glowLayers = [
      { blur: 40, alpha: 0.3 },
      { blur: 25, alpha: 0.4 },
      { blur: 15, alpha: 0.5 }
    ];
    
    ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    glowLayers.forEach(layer => {
      ctx.save();
      ctx.shadowBlur = layer.blur;
      ctx.shadowColor = glowColor;
      ctx.globalAlpha = layer.alpha * this.glowIntensity;
      ctx.fillStyle = glowColor;
      ctx.fillText(number, 0, 0);
      ctx.restore();
    });
  }
  
  /**
   * Draw outline for better contrast
   * @private
   */
  _drawOutline(ctx, number) {
    const fontSize = this._getFontSize();
    
    ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    ctx.strokeText(number, 0, 0);
  }
  
  /**
   * Draw main number text
   * @private
   */
  _drawMainNumber(ctx, number, mainColor) {
    const fontSize = this._getFontSize();
    
    ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Create gradient fill for depth
    const gradient = ctx.createLinearGradient(0, -fontSize/2, 0, fontSize/2);
    gradient.addColorStop(0, mainColor);
    gradient.addColorStop(0.5, this._lightenColor(mainColor, 20));
    gradient.addColorStop(1, this._darkenColor(mainColor, 20));
    
    ctx.fillStyle = gradient;
    ctx.fillText(number, 0, 0);
  }
  
  /**
   * Get appropriate color scheme based on time remaining
   * @private
   * @returns {Object} Color scheme with main and glow colors
   */
  _getColorScheme() {
    const timePercent = this.timeRemaining / this.initialTime;
    
    if (timePercent > 0.6) {
      return this.colors.high;      // More than 60% time left
    } else if (timePercent > 0.3) {
      return this.colors.medium;    // 30-60% time left
    } else if (timePercent > 0.15) {
      return this.colors.low;       // 15-30% time left
    } else {
      return this.colors.critical;  // Less than 15% time left
    }
  }
  
  /**
   * Get font size based on remaining time (larger when urgent)
   * @private
   * @returns {number} Font size in pixels
   */
  _getFontSize() {
    const baseSize = 72;
    
    // Increase size in final seconds for urgency
    if (this.timeRemaining <= 1) {
      return baseSize * 1.3;
    } else if (this.timeRemaining <= 2) {
      return baseSize * 1.15;
    }
    
    return baseSize;
  }
  
  /**
   * Lighten a hex color
   * @private
   * @param {string} color - Hex color string
   * @param {number} percent - Percentage to lighten (0-100)
   * @returns {string} Lightened hex color
   */
  _lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (
      (R << 16) | (G << 8) | B
    ).toString(16).padStart(6, '0');
  }
  
  /**
   * Darken a hex color
   * @private
   * @param {string} color - Hex color string
   * @param {number} percent - Percentage to darken (0-100)
   * @returns {string} Darkened hex color
   */
  _darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (
      (R << 16) | (G << 8) | B
    ).toString(16).padStart(6, '0');
  }
  
  /**
   * Get current countdown value
   * @returns {number} Seconds remaining (ceiled to nearest whole number)
   */
  getCurrentValue() {
    return Math.ceil(this.timeRemaining);
  }
  
  /**
   * Check if countdown is in final seconds
   * @returns {boolean} True if 2 or fewer seconds remain
   */
  isCritical() {
    return this.timeRemaining <= 2;
  }
  
  /**
   * Force immediate completion (useful for testing)
   */
  forceComplete() {
    this.timeRemaining = 0;
    this.fadeOutStarted = true;
    this.fadeOutStartTime = performance.now();
  }
}
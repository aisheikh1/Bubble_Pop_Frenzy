// src/js/effects/CountdownTextEffect.js

export class CountdownTextEffect {
  constructor(text, duration = 500) {
    this.text = text;
    this.duration = duration;
    this.elapsed = 0;
    this.dead = false;
  }

  /**
   * Update the effect. Returns true when the effect is finished.
   * @param {number} dtSec - Delta time in seconds
   * @param {number} nowMs - High-resolution timestamp from performance.now()
   * @returns {boolean} - True if the effect is complete and should be removed
   */
  update(dtSec, nowMs) {
    this.elapsed += dtSec * 1000; // Convert to milliseconds
    
    if (this.elapsed >= this.duration) {
      this.dead = true;
      return true; // Signal that this effect is done
    }
    
    return false; // Effect is still active
  }

  /**
   * Draw the countdown text effect
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    if (this.dead) return;

    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Calculate animation progress (0 to 1)
    const progress = this.elapsed / this.duration;
    
    // Scale animation: start small (0.5), grow to large (1.8 at middle), shrink back (0.5)
    let scale;
    if (progress < 0.5) {
      // Growing phase (0 to 0.5): 0.5 -> 1.8
      scale = 0.5 + (progress * 2) * 1.3;
    } else {
      // Shrinking phase (0.5 to 1): 1.8 -> 0.5
      scale = 1.8 - ((progress - 0.5) * 2) * 1.3;
    }

    // Opacity animation: fade in quickly, stay bright, fade out at end
    let opacity;
    if (progress < 0.15) {
      opacity = progress / 0.15; // Fade in over first 15%
    } else if (progress < 0.85) {
      opacity = 1; // Stay bright for middle 70%
    } else {
      opacity = (1 - progress) / 0.15; // Fade out over last 15%
    }

    // Ensure opacity is clamped
    opacity = Math.max(0, Math.min(1, opacity));

    ctx.save();
    
    // Set font with dynamic size based on scale
    const baseFontSize = this.text === 'Pop!' ? 80 : 140;
    const fontSize = baseFontSize * scale;
    ctx.font = `bold ${fontSize}px 'Fredoka One', 'Bangers', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Different color schemes for numbers vs "Pop!"
    if (this.text === 'Pop!') {
      // Color intensity - more vibrant in the middle
      const vibrancy = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
      const hue = 200 + vibrancy * 60; // Shift from blue to orange
      const saturation = 80 + vibrancy * 20;
      const lightness = 50 + vibrancy * 10;
      
      // Draw text shadow for depth
      ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness - 30}%, ${opacity * 0.6})`;
      ctx.shadowBlur = 20 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5 * scale;

      // Draw main text with gradient
      const gradient = ctx.createLinearGradient(
        centerX - fontSize,
        centerY - fontSize / 2,
        centerX + fontSize,
        centerY + fontSize / 2
      );
      gradient.addColorStop(0, `hsla(${hue - 20}, ${saturation}%, ${lightness + 10}%, ${opacity})`);
      gradient.addColorStop(0.5, `hsla(${hue}, ${saturation + 10}%, ${lightness}%, ${opacity})`);
      gradient.addColorStop(1, `hsla(${hue + 20}, ${saturation}%, ${lightness + 10}%, ${opacity})`);
      
      ctx.fillStyle = gradient;
      ctx.fillText(this.text, centerX, centerY);

      // Add outline for better visibility
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness - 20}%, ${opacity * 0.8})`;
      ctx.lineWidth = 3 * scale;
      ctx.strokeText(this.text, centerX, centerY);
    } else {
      // Neon red for countdown numbers (3, 2, 1)
      const glowIntensity = Math.sin(progress * Math.PI * 2) * 0.3 + 0.7; // Pulsing glow
      
      // Multiple layers of glow for neon effect
      ctx.shadowColor = `rgba(255, 0, 0, ${opacity * 0.8})`;
      ctx.shadowBlur = 40 * scale * glowIntensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Outer glow
      ctx.strokeStyle = `rgba(255, 0, 0, ${opacity * 0.6})`;
      ctx.lineWidth = 12 * scale;
      ctx.strokeText(this.text, centerX, centerY);
      
      // Middle glow
      ctx.strokeStyle = `rgba(255, 50, 50, ${opacity * 0.8})`;
      ctx.lineWidth = 8 * scale;
      ctx.strokeText(this.text, centerX, centerY);
      
      // Inner bright core with gradient
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, fontSize
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`); // Bright white center
      gradient.addColorStop(0.3, `rgba(255, 100, 100, ${opacity})`); // Light red
      gradient.addColorStop(0.7, `rgba(255, 0, 0, ${opacity})`); // Pure red
      gradient.addColorStop(1, `rgba(200, 0, 0, ${opacity * 0.8})`); // Dark red edge
      
      ctx.fillStyle = gradient;
      ctx.fillText(this.text, centerX, centerY);
      
      // Add sharp inner outline
      ctx.strokeStyle = `rgba(255, 200, 200, ${opacity * 0.9})`;
      ctx.lineWidth = 2 * scale;
      ctx.strokeText(this.text, centerX, centerY);
    }

    ctx.restore();
  }
}
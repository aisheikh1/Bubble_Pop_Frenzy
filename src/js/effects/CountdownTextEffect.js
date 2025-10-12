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
    
    // Scale animation: start small (0.3), grow to large (1.5 at middle), shrink back (0.3)
    let scale;
    if (progress < 0.5) {
      // Growing phase (0 to 0.5): 0.3 -> 1.5
      scale = 0.3 + (progress * 2) * 1.2;
    } else {
      // Shrinking phase (0.5 to 1): 1.5 -> 0.3
      scale = 1.5 - ((progress - 0.5) * 2) * 1.2;
    }

    // Opacity animation: fade in quickly, stay bright, fade out at end
    let opacity;
    if (progress < 0.2) {
      opacity = progress * 5; // Fade in over first 20%
    } else if (progress < 0.8) {
      opacity = 1; // Stay bright for middle 60%
    } else {
      opacity = (1 - progress) * 5; // Fade out over last 20%
    }

    // Color intensity - more vibrant in the middle
    const vibrancy = Math.sin(progress * Math.PI); // 0 -> 1 -> 0

    ctx.save();
    
    // Set font with dynamic size based on scale
    const baseFontSize = this.text === 'Pop!' ? 80 : 120;
    const fontSize = baseFontSize * scale;
    ctx.font = `bold ${fontSize}px 'Fredoka One', 'Bangers', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Color: vibrant gradient effect
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

    ctx.restore();
  }
}
// src/js/effects/BombPrimedEffect.js

export class BombPrimedEffect {
  /**
   * A short bomb "prime" animation: pulsing body and blinking spark on the fuse.
   * @param {number} x - center x
   * @param {number} y - center y
   * @param {number} r - reference radius
   * @param {number} durMs - duration in milliseconds (default 600ms)
   */
  constructor(x, y, r, durMs = 600) {
    this.x = x; this.y = y; this.r = r; this.durMs = durMs;
    this.t0 = performance.now();
    this.ageMs = 0;
  }

  /**
   * Update the effect. Return true when done so the manager removes it.
   * @param {number} dtSec - delta time in seconds
   * @param {number} nowMs - performance.now() timestamp in ms
   */
  update(_dtSec, nowMs) {
    this.ageMs = nowMs - this.t0;
    return this.ageMs >= this.durMs;
  }

  /**
   * Draw the pulsing bomb with a simple fuse and blinking spark.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const p = Math.min(1, (this.ageMs || 0) / this.durMs);
    const scale = 1 + 0.06 * Math.sin(p * 12);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);

    // Bomb body
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Fuse
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.r * 0.2, -this.r * 0.2);
    ctx.quadraticCurveTo(this.r * 0.45, -this.r * 0.45, this.r * 0.6, -this.r * 0.6);
    ctx.stroke();

    // Spark (blink)
    const blink = (Math.sin(p * 30) > 0) ? 1 : 0.4;
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(this.r * 0.6, -this.r * 0.6, this.r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

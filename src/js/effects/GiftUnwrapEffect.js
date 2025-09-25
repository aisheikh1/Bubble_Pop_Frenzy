// src/js/effects/GiftUnwrapEffect.js

export class GiftUnwrapEffect {
  /**
   * A short "gift wobble + ribbon fly-off" animation that plays before the bomb reveal.
   * @param {number} x - center x
   * @param {number} y - center y
   * @param {number} r - reference radius (from the bubble)
   * @param {number} durMs - duration in milliseconds (default 400ms)
   * @param {Function} [onComplete=()=>{}] - A callback function to run when the effect is finished.
   */
  constructor(x, y, r, durMs = 400, onComplete = () => {}) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.durMs = durMs;
    this.t0 = performance.now();
    this.ageMs = 0;
    this.onComplete = onComplete;
  }

  /**
   * Advance the effect. Return true when finished so the EffectManager removes it.
   * @param {number} dtSec - delta time in seconds (not used here, but kept for consistency)
   * @param {number} nowMs - performance.now() timestamp in ms
   * @returns {boolean}
   */
  update(_dtSec, nowMs) {
    this.ageMs = nowMs - this.t0;
    const done = this.ageMs >= this.durMs;
    if (done && this.onComplete) {
      this.onComplete();
      this.onComplete = null; // Ensure the callback is only called once
    }
    return done;
  }

  /**
   * Draw the gift and a subtle luminous halo. Late in the animation the ribbon flies off.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const p = Math.min(1, (this.ageMs || 0) / this.durMs); // 0..1 progress
    const wobble = Math.sin(p * 10) * (Math.PI / 30); // ±6°

    ctx.save();
    ctx.translate(this.x, this.y);

    // Luminous halo pulse
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.22 * Math.sin(p * 8);
    ctx.fillStyle = '#ffff66';
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Gift box with a slight wobble
    ctx.rotate(wobble);
    const g = this.r * 0.7; // gift size relative to bubble radius

    // Box
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-g / 2, -g / 2, g, g);

    // Ribbon (vertical + horizontal)
    ctx.fillStyle = '#ffc0cb';
    ctx.fillRect(-g / 8, -g / 2, g / 4, g);
    ctx.fillRect(-g / 2, -g / 8, g, g / 4);

    // Ribbon bow
    const rScale = (1 - Math.max(0, p * 2 - 1)); // 1->0 over second half of anim
    ctx.fillStyle = '#ffc0cb';
    ctx.beginPath();
    ctx.ellipse(0, -g / 4, g / 4 * rScale, g / 6 * rScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, g / 4, g / 4 * rScale, g / 6 * rScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // "Pop Me" note - flies off as ribbon unwraps
    ctx.restore(); // Restore after wobble
    ctx.save();
    ctx.translate(this.x, this.y + this.r * 0.4 - p * 150);
    ctx.globalAlpha = 1 - p;

    ctx.fillStyle = '#000000'; // Black text
    ctx.font = `${this.r * 0.25}px Arial`; // Smaller font for the note
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pop Me', 0, 0);
    ctx.restore();
  }
}
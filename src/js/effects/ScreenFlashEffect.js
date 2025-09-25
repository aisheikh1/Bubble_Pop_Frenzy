// src/js/effects/ScreenFlashEffect.js

export class ScreenFlashEffect {
  constructor(durMs = 200) {
    this.durMs = durMs;
    this.t0 = performance.now();
    this.ageMs = 0;
  }
  update(_dtSec, nowMs) {
    this.ageMs = nowMs - this.t0;
    return this.ageMs >= this.durMs;
  }
  draw(ctx) {
    const p = Math.min(1, (this.ageMs ?? 0) / this.durMs);
    ctx.save();
    ctx.globalAlpha = 0.35 * (1 - p);
    ctx.fillStyle = '#aa0000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
}

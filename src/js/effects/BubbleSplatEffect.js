// Minimal “splat” fade effect to satisfy imports
export class BubbleSplatEffect {
  constructor(x, y, radius = 24, color = '#ffffff') {
    this.x = x; this.y = y;
    this.radius = radius;
    this.color = color;
    this.life = 220; // ms
    this.elapsed = 0;
  }
  update(dtMs /* number */, /* nowMs */) {
    this.elapsed += dtMs;
    return this.elapsed >= this.life;
  }
  draw(ctx) {
    const t = Math.min(1, this.elapsed / this.life);
    const r = this.radius * (1 + t * 0.8);
    ctx.save();
    ctx.globalAlpha = 0.65 * (1 - t);
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, r * 1.2, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

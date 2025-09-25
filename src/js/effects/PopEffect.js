// Minimal “pop” sparkle effect to satisfy imports and look decent
export class PopEffect {
  constructor(x, y, radius = 20, color = '#ffffff') {
    this.x = x; this.y = y;
    this.radius = radius;
    this.color = color;
    this.life = 180; // ms
    this.elapsed = 0;
  }
  update(dtMs /* number */, /* nowMs */) {
    this.elapsed += dtMs;
    return this.elapsed >= this.life; // true => finished
  }
  draw(ctx) {
    const t = Math.min(1, this.elapsed / this.life);
    const r = this.radius * (1 + t * 0.6);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

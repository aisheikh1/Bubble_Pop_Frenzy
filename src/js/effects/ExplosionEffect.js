// src/js/effects/ExplosionEffect.js

class Particle {
  constructor(x, y, speedPxSec, angRad, lifeSec) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angRad) * speedPxSec;
    this.vy = Math.sin(angRad) * speedPxSec;
    this.lifeSec = lifeSec;
    this.tSec = 0;
  }
  update(dtSec) {
    this.tSec += dtSec;
    this.x += this.vx * dtSec;
    this.y += this.vy * dtSec;
    return this.tSec >= this.lifeSec;
  }
  draw(ctx) {
    const a = Math.max(0, 1 - this.tSec / this.lifeSec);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(this.x, this.y, 2, 2);
    ctx.restore();
  }
}

export class ExplosionEffect {
  constructor(x, y, r, durMs = 900) {
    this.x = x; this.y = y; this.r = r; this.durMs = durMs;
    this.t0 = performance.now();
    this.ageMs = 0;
    this.particles = [];
    const N = 100;
    for (let i = 0; i < N; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = r * 90 + Math.random() * r * 70; // px/sec
      const lifeSec = 0.25 + Math.random() * 0.5;
      this.particles.push(new Particle(x, y, speed, ang, lifeSec));
    }
  }
  update(dtSec, nowMs) {
    this.ageMs = nowMs - this.t0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (this.particles[i].update(dtSec)) this.particles.splice(i, 1);
    }
    return this.ageMs >= this.durMs && this.particles.length === 0;
  }
  draw(ctx) {
    const p = Math.min(1, (this.ageMs ?? 0) / this.durMs);

    // expanding luminous ring
    ctx.save();
    ctx.globalAlpha = 0.6 * (1 - p);
    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = 8 * (1 - p);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * (0.6 + 0.8 * p), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // particles
    for (const prt of this.particles) prt.draw(ctx);
  }
}

// src/js/effects/FloatingTextEffect.js

/**
 * A simple effect to show floating text animations (e.g., '+1s', '-5s').
 */
class FloatingTextEffect {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.opacity = 1;
    this.lifespan = 1500; // Milliseconds
    this.creationTime = performance.now();
    this.speedY = 0.2; // Pixels per frame
    this.dead = false;
  }

  update(deltaTime) {
    const timeElapsed = performance.now() - this.creationTime;
    
    // Move upwards
    this.y -= this.speedY * deltaTime * 60;

    // Fade out
    this.opacity = 1 - timeElapsed / this.lifespan;

    if (this.opacity <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.dead) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 5;

    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
  }
}

export { FloatingTextEffect };

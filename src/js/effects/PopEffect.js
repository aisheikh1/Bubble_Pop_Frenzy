// src/js/effects/PopEffect.js
// -----------------------------------------------------------------------------
// This is a no-op replacement for the PopEffect animation.
// It prevents errors or broken imports in Bubble.pop(), but disables
// the visual pop animation entirely.
// -----------------------------------------------------------------------------

export class PopEffect {
  /**
   * @param {number} [x] - X position of the bubble pop.
   * @param {number} [y] - Y position of the bubble pop.
   * @param {number} [radius] - Bubble radius.
   * @param {string} [color] - Bubble color.
   */
  constructor(x = 0, y = 0, radius = 0, color = '#ffffff') {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.finished = true; // instantly finished
  }

  /**
   * Update the effect. Normally handles lifespan and fade timing.
   * Here it returns true immediately, signalling completion.
   * @param {number} dt - delta time in seconds
   * @param {number} now - current timestamp
   * @returns {boolean} true = finished
   */
  update(dt, now) {
    return true;
  }

  /**
   * Draw the effect. Does nothing (no animation).
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // intentionally blank — no visual output
  }
}

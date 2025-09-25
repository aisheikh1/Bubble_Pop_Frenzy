// src/js/effects/EffectManager.js

class EffectManager {
  constructor() {
    /** @type {Array<{update: (dtSec:number, nowMs:number)=>boolean, draw: (ctx:CanvasRenderingContext2D)=>void}>} */
    this._live = [];
  }

  /**
   * Add a new effect instance. The effect must implement:
   *  - update(dtSec, nowMs): return true when the effect is finished (to be removed)
   *  - draw(ctx): draw itself each frame
   */
  spawn(effect) {
    if (effect && typeof effect.update === 'function' && typeof effect.draw === 'function') {
      this._live.push(effect);
    } else {
      // Silently ignore invalid effect objects to avoid hard crashes in production
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[EffectManager] Ignored invalid effect:', effect);
      }
    }
  }

  /**
   * Update all effects. Removes any that report completion.
   * @param {number} dtSec - Delta time in seconds
   * @param {number} nowMs - High-resolution timestamp from performance.now()
   */
  update(dtSec, nowMs) {
    // Iterate backwards so we can splice without index issues
    for (let i = this._live.length - 1; i >= 0; i--) {
      const e = this._live[i];
      try {
        const done = e.update(dtSec, nowMs);
        if (done) this._live.splice(i, 1);
      } catch (err) {
        // If an effect throws, drop it so it doesn't break the render loop
        if (typeof console !== 'undefined' && console.error) {
          console.error('[EffectManager] Effect update error, removing effect:', err);
        }
        this._live.splice(i, 1);
      }
    }
  }

  /**
   * Draw all active effects in insertion order (painter's algorithm over the game scene).
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (let i = 0; i < this._live.length; i++) {
      const e = this._live[i];
      try {
        e.draw(ctx);
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[EffectManager] Effect draw error (skipped):', err);
        }
      }
    }
  }
}

export const effects = new EffectManager();

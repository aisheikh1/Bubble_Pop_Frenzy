// src/js/ui/ComboMeter.js
// Visual combo tracking meter for Colour Rush mode

import { COLOUR_RUSH_CONFIG } from '../ColourRushConfig.js';

/**
 * ComboMeter
 * Displays combo progress and multiplier with visual feedback
 */
export class ComboMeter {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.labelElement = null;
    this.fillElement = null;
    this.maxCombo = 10; // For 3x multiplier
    this.currentCombo = 0;
    this.currentMultiplier = 1.0;
    
    this.createMeter();
  }
  
  /**
   * Create the meter elements
   */
  createMeter() {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'combo-meter';
    
    // Create label
    this.labelElement = document.createElement('div');
    this.labelElement.className = 'combo-label';
    this.labelElement.textContent = 'Combo: 1.0x';
    this.element.appendChild(this.labelElement);
    
    // Create bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'combo-bar';
    
    // Create fill element
    this.fillElement = document.createElement('div');
    this.fillElement.className = 'combo-fill';
    barContainer.appendChild(this.fillElement);
    
    this.element.appendChild(barContainer);
    
    // Insert at the top of the game info container
    this.container.insertBefore(this.element, this.container.firstChild);
    
    console.log('[ComboMeter] Created');
  }
  
  /**
   * Update combo display
   * @param {number} consecutiveCorrect - Number of consecutive correct pops
   * @param {number} multiplier - Current score multiplier
   */
  update(consecutiveCorrect, multiplier) {
    this.currentCombo = consecutiveCorrect;
    this.currentMultiplier = multiplier;
    
    // Calculate fill percentage (max at 10 combo for visual clarity)
    const percentage = Math.min((consecutiveCorrect / this.maxCombo) * 100, 100);
    
    // Update fill width with smooth transition
    this.fillElement.style.width = `${percentage}%`;
    
    // Update label text
    this.labelElement.textContent = `Combo: ${multiplier.toFixed(1)}x`;
    
    // Update color based on multiplier tier
    this.updateColor(multiplier);
    
    // Add pulse effect when reaching new tier
    if (consecutiveCorrect === 3 || consecutiveCorrect === 5 || consecutiveCorrect === 10) {
      this.pulse();
    }
  }
  
  /**
   * Update fill color based on multiplier
   * @param {number} multiplier - Current multiplier
   */
  updateColor(multiplier) {
    // Remove existing tier classes
    this.fillElement.classList.remove('tier-1', 'tier-2', 'tier-3');
    
    // Add appropriate tier class
    if (multiplier >= 3.0) {
      this.fillElement.classList.add('tier-3'); // 10+ combo - Rainbow/Epic
    } else if (multiplier >= 2.0) {
      this.fillElement.classList.add('tier-2'); // 5+ combo - Orange/Gold
    } else if (multiplier >= 1.5) {
      this.fillElement.classList.add('tier-1'); // 3+ combo - Yellow
    }
    // Default: Green gradient (no class needed)
  }
  
  /**
   * Pulse animation when reaching milestone
   */
  pulse() {
    this.element.classList.remove('pulse');
    void this.element.offsetWidth; // Force reflow
    this.element.classList.add('pulse');
    
    setTimeout(() => {
      this.element.classList.remove('pulse');
    }, 300);
  }
  
  /**
   * Reset combo to zero
   */
  reset() {
    this.currentCombo = 0;
    this.currentMultiplier = 1.0;
    
    this.fillElement.style.width = '0%';
    this.fillElement.classList.remove('tier-1', 'tier-2', 'tier-3');
    
    this.labelElement.textContent = 'Combo: 1.0x';
  }
  
  /**
   * Shatter animation when combo breaks
   */
  shatter() {
    console.log('[ComboMeter] Combo shattered!');
    
    // Add shatter class
    this.element.classList.add('shatter');
    
    // Remove class and reset after animation
    setTimeout(() => {
      this.element.classList.remove('shatter');
      this.reset();
    }, COLOUR_RUSH_CONFIG.animations.comboShatter.duration);
  }
  
  /**
   * Show the meter
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }
  
  /**
   * Hide the meter
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
  
  /**
   * Get current combo count
   * @returns {number}
   */
  getCurrentCombo() {
    return this.currentCombo;
  }
  
  /**
   * Get current multiplier
   * @returns {number}
   */
  getCurrentMultiplier() {
    return this.currentMultiplier;
  }
  
  /**
   * Cleanup and remove elements
   */
  cleanup() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.labelElement = null;
    this.fillElement = null;
    
    console.log('[ComboMeter] Cleaned up');
  }
}
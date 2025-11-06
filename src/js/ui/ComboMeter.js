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
    this.element.style.display = 'none'; // Hidden by default
    
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
    this.fillElement.style.width = '0%';
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
    
    // Animate reset
    this.fillElement.style.transition = 'width 0.2s ease-out, background 0.2s ease-out';
    this.fillElement.style.width = '0%';
    this.fillElement.classList.remove('tier-1', 'tier-2', 'tier-3');
    
    this.labelElement.textContent = 'Combo: 1.0x';
    
    // Reset transition after animation
    setTimeout(() => {
      this.fillElement.style.transition = 'width 0.3s ease, background 0.3s ease';
    }, 200);
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

/**
 * Add required CSS styles dynamically if not in stylesheet
 */
export function injectComboMeterStyles() {
  const styleId = 'combo-meter-styles';
  
  // Check if styles already injected
  if (document.getElementById(styleId)) return;
  
  const styles = `
    .combo-meter {
      width: 100%;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      backdrop-filter: blur(5px);
    }
    
    .combo-label {
      text-align: left;
      font-weight: bold;
      font-size: 1rem;
      margin-bottom: 0.25rem;
      color: #222;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
      transition: transform 0.2s ease;
    }
    
    .combo-meter.pulse .combo-label {
      animation: labelPulse 0.3s ease-out;
    }
    
    @keyframes labelPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    
    .combo-bar {
      width: 100%;
      height: 24px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .combo-fill {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.3s ease, background 0.3s ease;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
      position: relative;
    }
    
    /* Tier 1: 3+ combo - Yellow/Lime */
    .combo-fill.tier-1 {
      background: linear-gradient(90deg, #CDDC39, #FFEB3B);
      box-shadow: 0 0 15px rgba(205, 220, 57, 0.8);
    }
    
    /* Tier 2: 5+ combo - Orange/Gold */
    .combo-fill.tier-2 {
      background: linear-gradient(90deg, #FF9800, #FFC107);
      box-shadow: 0 0 20px rgba(255, 152, 0, 0.9);
    }
    
    /* Tier 3: 10+ combo - Rainbow/Epic */
    .combo-fill.tier-3 {
      background: linear-gradient(90deg, 
        #FF0080, #FF00FF, #8000FF, #0080FF, 
        #00FF80, #FFFF00, #FF8000, #FF0080
      );
      background-size: 200% 100%;
      animation: rainbowFlow 2s linear infinite;
      box-shadow: 0 0 25px rgba(255, 0, 128, 1);
    }
    
    @keyframes rainbowFlow {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    
    /* Shatter animation */
    .combo-meter.shatter .combo-fill {
      animation: shatterEffect 0.5s ease-out;
    }
    
    @keyframes shatterEffect {
      0% { 
        transform: scale(1) rotate(0deg); 
        opacity: 1; 
      }
      25% { 
        transform: scale(1.1) rotate(5deg); 
        opacity: 0.8; 
      }
      50% { 
        transform: scale(0.9) rotate(-5deg); 
        opacity: 0.5; 
      }
      75% { 
        transform: scale(1.05) rotate(3deg); 
        opacity: 0.3; 
      }
      100% { 
        transform: scale(0) rotate(0deg); 
        opacity: 0; 
      }
    }
    
    /* Glow effect when active */
    .combo-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.4), 
        transparent
      );
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      50%, 100% { left: 200%; }
    }
    
    /* Responsive sizing */
    @media screen and (max-width: 400px) {
      .combo-label {
        font-size: 0.9rem;
      }
      
      .combo-bar {
        height: 20px;
      }
    }
  `;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// Auto-inject styles when module loads
if (typeof document !== 'undefined') {
  injectComboMeterStyles();
}
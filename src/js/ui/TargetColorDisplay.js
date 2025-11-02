// src/js/ui/TargetColorDisplay.js
// Visual indicator showing the current target color for Colour Rush mode

import { COLOUR_RUSH_CONFIG } from '../ColourRushConfig.js';

/**
 * TargetColorDisplay
 * Displays a large colored bubble above the game canvas showing the target color
 */
export class TargetColorDisplay {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.bubbleElement = null;
    this.nameElement = null;
    this.currentColor = null;
    
    this.createDisplay();
  }
  
  /**
   * Create the display elements
   */
  createDisplay() {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'target-color-display';
    this.element.style.display = 'none'; // Hidden by default
    
    // Create label
    const label = document.createElement('div');
    label.className = 'target-color-label';
    label.textContent = 'Target Color:';
    this.element.appendChild(label);
    
    // Create bubble
    this.bubbleElement = document.createElement('div');
    this.bubbleElement.className = 'target-bubble';
    this.element.appendChild(this.bubbleElement);
    
    // Create color name
    this.nameElement = document.createElement('div');
    this.nameElement.className = 'color-name';
    this.element.appendChild(this.nameElement);
    
    // Insert at the top of the container
    this.container.insertBefore(this.element, this.container.firstChild);
    
    console.log('[TargetColorDisplay] Created');
  }
  
  /**
   * Set the target color
   * @param {string} colorName - Name of the color (e.g., "Red")
   * @param {string} colorHex - Hex color code (e.g., "#FF0000")
   */
  setColor(colorName, colorHex) {
    this.currentColor = { name: colorName, hex: colorHex };
    
    // Update bubble background color
    this.bubbleElement.style.backgroundColor = colorHex;
    this.bubbleElement.style.boxShadow = `0 0 20px ${colorHex}, 0 0 40px ${colorHex}80`;
    
    // Update color name text
    this.nameElement.textContent = colorName;
    
    console.log('[TargetColorDisplay] Color set to:', colorName, colorHex);
  }
  
  /**
   * Animate color change
   * Plays a transition animation when the target color changes
   */
  animateChange() {
    // Remove any existing animation class
    this.bubbleElement.classList.remove('color-changing');
    
    // Force reflow to restart animation
    void this.bubbleElement.offsetWidth;
    
    // Add animation class
    this.bubbleElement.classList.add('color-changing');
    
    // Remove class after animation completes
    setTimeout(() => {
      this.bubbleElement.classList.remove('color-changing');
    }, COLOUR_RUSH_CONFIG.animations.colorChange.duration);
  }
  
  /**
   * Show the display
   */
  show() {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }
  
  /**
   * Hide the display
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
  
  /**
   * Get current color
   * @returns {Object|null} { name: string, hex: string }
   */
  getCurrentColor() {
    return this.currentColor;
  }
  
  /**
   * Cleanup and remove elements
   */
  cleanup() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.bubbleElement = null;
    this.nameElement = null;
    this.currentColor = null;
    
    console.log('[TargetColorDisplay] Cleaned up');
  }
}

/**
 * Add required CSS styles dynamically if not in stylesheet
 * This ensures the component works even if CSS isn't loaded
 */
export function injectTargetColorDisplayStyles() {
  const styleId = 'target-color-display-styles';
  
  // Check if styles already injected
  if (document.getElementById(styleId)) return;
  
  const styles = `
    .target-color-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      backdrop-filter: blur(5px);
    }
    
    .target-color-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .target-bubble {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 20px currentColor;
      transition: background-color 0.5s ease, box-shadow 0.5s ease;
      animation: targetPulse 2s infinite ease-in-out;
    }
    
    .target-bubble.color-changing {
      animation: colorChangeFlash 0.5s ease-out;
    }
    
    @keyframes targetPulse {
      0%, 100% { 
        transform: scale(1); 
        opacity: 1;
      }
      50% { 
        transform: scale(1.1); 
        opacity: 0.9;
      }
    }
    
    @keyframes colorChangeFlash {
      0% { 
        transform: scale(1); 
        opacity: 1;
      }
      25% { 
        transform: scale(1.3) rotate(10deg); 
        opacity: 0.5;
      }
      50% { 
        transform: scale(0.8) rotate(-10deg); 
        opacity: 0.8;
      }
      75% { 
        transform: scale(1.2); 
        opacity: 0.6;
      }
      100% { 
        transform: scale(1) rotate(0deg); 
        opacity: 1;
      }
    }
    
    .color-name {
      font-size: 1.2rem;
      font-weight: bold;
      color: #222;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    /* Responsive sizing */
    @media screen and (max-width: 400px) {
      .target-bubble {
        width: 60px;
        height: 60px;
      }
      
      .color-name {
        font-size: 1rem;
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
  injectTargetColorDisplayStyles();
}
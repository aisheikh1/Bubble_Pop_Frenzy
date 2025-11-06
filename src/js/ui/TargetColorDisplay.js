// src/js/ui/TargetColorDisplay.js
// Visual indicator showing the current target color for Colour Rush mode
// REVAMPED: Compact text-based design with small circle indicator

import { COLOUR_RUSH_CONFIG } from '../ColourRushConfig.js';

/**
 * TargetColorDisplay
 * Displays a compact target color indicator with colored text and small circle
 * Format: "Target: [ColorName] ⚫" where ColorName is colored and ⚫ is a small colored circle
 */
export class TargetColorDisplay {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.circleElement = null;  // Small circle indicator (NEW)
    this.nameElement = null;
    this.currentColor = null;
    
    this.createDisplay();
  }
  
  /**
   * Create the display elements
   * NEW STRUCTURE: Horizontal layout with label, colored text, and small circle
   */
  createDisplay() {
    // Create main container (now horizontal flex layout)
    this.element = document.createElement('div');
    this.element.className = 'target-color-display';
    this.element.style.display = 'none'; // Hidden by default
    
    // Create label - UPDATED TEXT
    const label = document.createElement('div');
    label.className = 'target-color-label';
    label.textContent = 'Target:';  // Changed from "Target Color:"
    this.element.appendChild(label);
    
    // Create color name (text will be colored inline)
    this.nameElement = document.createElement('div');
    this.nameElement.className = 'color-name';
    this.element.appendChild(this.nameElement);
    
    // Create small circle indicator - NEW ELEMENT (replaces large bubble)
    this.circleElement = document.createElement('div');
    this.circleElement.className = 'target-circle';
    this.element.appendChild(this.circleElement);
    
    // Insert at the top of the container
    this.container.insertBefore(this.element, this.container.firstChild);
    
    console.log('[TargetColorDisplay] Created - Compact design with circle indicator');
  }
  
  /**
   * Set the target color
   * UPDATED: Colors both the text and the small circle
   * @param {string} colorName - Name of the color (e.g., "Red")
   * @param {string} colorHex - Hex color code (e.g., "#FF0000")
   */
  setColor(colorName, colorHex) {
    this.currentColor = { name: colorName, hex: colorHex };
    
    // Apply color to the small circle indicator
    this.circleElement.style.backgroundColor = colorHex;
    this.circleElement.style.boxShadow = `0 0 8px ${colorHex}`;
    
    // Apply color to the text name (NEW FEATURE)
    this.nameElement.style.color = colorHex;
    
    // Update color name text
    this.nameElement.textContent = colorName;
    
    console.log('[TargetColorDisplay] Color set to:', colorName, colorHex);
  }
  
  /**
   * Animate color change
   * UPDATED: Animates the small circle instead of large bubble
   * Plays a transition animation when the target color changes
   */
  animateChange() {
    // Remove any existing animation class
    this.circleElement.classList.remove('color-changing');
    
    // Force reflow to restart animation
    void this.circleElement.offsetWidth;
    
    // Add animation class
    this.circleElement.classList.add('color-changing');
    
    // Remove class after animation completes
    setTimeout(() => {
      this.circleElement.classList.remove('color-changing');
    }, COLOUR_RUSH_CONFIG.animations.colorChange.duration);
  }
  
  /**
   * Show the display
   */
  show() {
    if (this.element) {
      this.element.style.display = 'flex';  // flex for horizontal layout
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
   * UPDATED: Includes circleElement cleanup
   */
  cleanup() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.circleElement = null;  // Clean up circle element
    this.nameElement = null;
    this.currentColor = null;
    
    console.log('[TargetColorDisplay] Cleaned up');
  }
}

/**
 * Add required CSS styles dynamically if not in stylesheet
 * UPDATED: New compact horizontal layout styles with small circle
 * This ensures the component works even if CSS isn't loaded
 */
export function injectTargetColorDisplayStyles() {
  const styleId = 'target-color-display-styles';
  
  // Check if styles already injected
  if (document.getElementById(styleId)) return;
  
  const styles = `
    /* REVAMPED: Compact horizontal layout */
    .target-color-display {
      display: flex;
      flex-direction: row;  /* Changed from column to row */
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      backdrop-filter: blur(5px);
    }
    
    /* Updated label styling */
    .target-color-label {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
    }
    
    /* Color name with inline color styling */
    .color-name {
      font-size: 1.2rem;
      font-weight: bold;
      /* Color will be set inline via JavaScript */
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      transition: color 0.5s ease;
      white-space: nowrap;
    }
    
    /* NEW: Small circle indicator (replaces large bubble) */
    .target-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 8px currentColor;
      transition: background-color 0.5s ease, box-shadow 0.5s ease;
      flex-shrink: 0;  /* Prevent circle from shrinking */
    }
    
    /* Circle flash animation on color change */
    .target-circle.color-changing {
      animation: circleFlash 0.5s ease-out;
    }
    
    /* NEW: Compact flash animation for small circle */
    @keyframes circleFlash {
      0% { 
        transform: scale(1); 
        opacity: 1;
      }
      50% { 
        transform: scale(1.5); 
        opacity: 0.6;
      }
      100% { 
        transform: scale(1); 
        opacity: 1;
      }
    }
    
    /* Responsive sizing for small screens */
    @media screen and (max-width: 400px) {
      .target-color-display {
        padding: 0.4rem 0.8rem;
        gap: 0.4rem;
      }
      
      .target-color-label {
        font-size: 0.9rem;
      }
      
      .color-name {
        font-size: 1rem;
      }
      
      .target-circle {
        width: 14px;
        height: 14px;
        border-width: 1.5px;
      }
    }
  `;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  
  console.log('[TargetColorDisplay] Injected compact display styles');
}

// Auto-inject styles when module loads
if (typeof document !== 'undefined') {
  injectTargetColorDisplayStyles();
}
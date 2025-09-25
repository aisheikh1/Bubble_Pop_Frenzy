// src/js/ui/urgentMessage.js

// Toggle to suppress urgent messages globally if needed.
const DISABLE_URGENT_MESSAGE = false;

// Keep a single live element + timer so messages don't pile up.
let _urgentEl = null;
let _hideTimer = null;
let _removeTimer = null; // ADDED: New timer for the final DOM removal

// WCAG 2.1 Success Criterion 1.4.3: Contrast (Minimum)
// Requires a contrast ratio of at least 4.5:1 for normal text.
// This ensures text is readable for users with visual impairments.

/**
 * Ensure we have a container to place the message in.
 * Prefers an element with class "game-container", falls back to document.body.
 */
function getContainer() {
  const el = document.querySelector('.game-container');
  return el || document.body;
}

/**
 * Validates if a CSS color string is valid
 * @param {string} colorStr - The CSS color string to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidColor(colorStr) {
  // Handle empty or undefined values
  if (!colorStr || typeof colorStr !== 'string' || colorStr.trim() === '') {
    return false;
  }
  
  try {
    const tempEl = document.createElement('div');
    tempEl.style.color = 'rgba(0,0,0,0)'; // Set an initial non-empty value
    tempEl.style.color = colorStr;
    // Valid colors will be computed to a non-empty string
    // A more robust check might compare against a known invalid state.
    // However, the computed style check is generally reliable.
    return tempEl.style.color !== '';
  } catch (e) {
    console.warn('Error validating color:', colorStr, e);
    return false;
  }
}

/**
 * Helper to convert CSS color string to an RGB array.
 * Supports named colors, hex, and rgb/rgba formats.
 * @param {string} colorStr - The CSS color string.
 * @returns {number[]} An array [R, G, B] with values 0-255.
 */
function getRgbFromColorString(colorStr) {
  try {
    const tempEl = document.createElement('div');
    tempEl.style.color = colorStr;
    document.body.appendChild(tempEl);
    const color = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    
    const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    }
  } catch (e) {
    console.warn('Failed to parse color:', colorStr, e);
  }
  return [255, 255, 255]; // Default to white
}

/**
 * Calculate the relative luminance of an RGB color.
 * Formula from WCAG 2.1. Values are normalized 0-1.
 * @param {number} r - Red value (0-255).
 * @param {number} g - Green value (0-255).
 * @param {number} b - Blue value (0-255).
 * @returns {number} The luminance value (0-1).
 */
function calculateLuminance(r, g, b) {
  const [R, G, B] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two RGB colors
 * Formula from WCAG 2.1: (L1 + 0.05) / (L2 + 0.05)
 * @param {number[]} rgb1 - First color as [R, G, B]
 * @param {number[]} rgb2 - Second color as [R, G, B]
 * @returns {number} Contrast ratio
 */
function calculateContrastRatio(rgb1, rgb2) {
  const lum1 = calculateLuminance(...rgb1);
  const lum2 = calculateLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Show a temporary urgent message overlayed above the game.
 * @param {string} message  - Text to display.
 * @param {number} duration - Milliseconds to keep it visible (default 1500ms).
 * @param {string} color    - Optional CSS color string for the message text.
 */
export function showUrgentMessage(message, duration = 1500, color = '#fff') {
  if (DISABLE_URGENT_MESSAGE) return;

  const container = getContainer();

  // Create or reuse the single overlay node
  if (!_urgentEl) {
    _urgentEl = document.createElement('div');
    _urgentEl.setAttribute('role', 'status');
    _urgentEl.setAttribute('aria-live', 'polite');
    _urgentEl.className = 'urgent-message';

    // Minimal inline styling so it works even without CSS
    Object.assign(_urgentEl.style, {
      position: container === document.body ? 'fixed' : 'absolute',
      left: '50%',
      top: '12%',
      transform: 'translateX(-50%) scale(0.98)',
      padding: '10px 16px',
      borderRadius: '12px',
      fontWeight: '700',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      fontSize: '18px',
      letterSpacing: '0.2px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      zIndex: '1000',
      opacity: '0',
      transition: 'opacity 140ms ease, transform 140ms ease',
      willChange: 'opacity, transform',
      textAlign: 'center',
      maxWidth: '80vw',
      whiteSpace: 'pre-wrap',
    });

    container.appendChild(_urgentEl);
  }

  // --- MEMORY LEAK FIX START ---
  //
  // A new message should clear any existing timers to prevent a memory leak.
  // The nested `setTimeout` for removal must also be cleared.
  if (_hideTimer) {
    clearTimeout(_hideTimer);
    _hideTimer = null;
  }
  if (_removeTimer) {
    clearTimeout(_removeTimer);
    _removeTimer = null;
  }
  // --- MEMORY LEAK FIX END ---
  
  // --- INVALID COLOR FIX START ---
  // Validate the provided color and use a fallback if it's invalid.
  // This handles null, undefined, empty strings, and malformed values.
  const validColor = isValidColor(color) ? color : '#fff';
  if (color !== validColor) {
    console.warn(`Invalid color '${color}' provided. Using fallback color '${validColor}'.`);
  }
  // --- INVALID COLOR FIX END ---

  // --- ACCESSIBILITY FIX: PROPER CONTRAST CHECK ---
  // We calculate the contrast ratio against a dark and light background
  // and choose the one that provides the best contrast while meeting
  // the WCAG 4.5:1 minimum.
  const textRgb = getRgbFromColorString(validColor);
  const darkBgRgb = [0, 0, 0]; // Black background
  const lightBgRgb = [255, 255, 255]; // White background

  const contrastWithDark = calculateContrastRatio(textRgb, darkBgRgb);
  const contrastWithLight = calculateContrastRatio(textRgb, lightBgRgb);

  // Choose the background that provides better contrast while meeting WCAG 4.5:1 minimum
  if (contrastWithDark >= 4.5 && contrastWithDark >= contrastWithLight) {
    _urgentEl.style.background = 'rgba(0, 0, 0, 0.70)';
    _urgentEl.style.color = validColor;
  } else if (contrastWithLight >= 4.5) {
    _urgentEl.style.background = 'rgba(255, 255, 255, 0.90)';
    _urgentEl.style.color = validColor;
  } else {
    // Fallback: if neither meets minimum, force white text on black background
    _urgentEl.style.background = 'rgba(0, 0, 0, 0.70)';
    _urgentEl.style.color = '#fff';
  }
  // --- END ACCESSIBILITY FIX ---

  _urgentEl.textContent = message;

  // Force reflow so transition applies even when reusing the node
  // eslint-disable-next-line no-unused-expressions
  _urgentEl.offsetHeight;

  // Pulse in
  _urgentEl.style.opacity = '1';
  _urgentEl.style.transform = 'translateX(-50%) scale(1.03)';

  // Settle to 1.0 scale after the initial pulse
  setTimeout(() => {
    if (_urgentEl) {
      _urgentEl.style.transform = 'translateX(-50%) scale(1)';
    }
  }, 140);

  // Schedule fade-out and removal
  _hideTimer = setTimeout(() => {
    if (!_urgentEl) return;
    _urgentEl.style.opacity = '0';
    _urgentEl.style.transform = 'translateX(-50%) scale(0.98)';

    // Remove after transition ends (keep a small buffer)
    _removeTimer = setTimeout(() => {
      if (_urgentEl && _urgentEl.parentNode) {
        _urgentEl.parentNode.removeChild(_urgentEl);
      }
      _urgentEl = null;
      _hideTimer = null;
      _removeTimer = null; // ADDED: Clear this timer's reference
    }, 200);
  }, Math.max(0, duration));
}

// Add these exports at the end of urgentMessage.js

export function showDifficultyEaseUp(level, duration = 2000) {
  showUrgentMessage(`LEVEL ${level}: EASE UP!`, duration, 'cyan');
}

export function showFasterBubbles(level, duration = 2000) {
  showUrgentMessage(`LEVEL ${level}: FASTER BUBBLES!`, duration, 'lime');
}

export function showMoreBubbles(level, duration = 2000) {
  showUrgentMessage(`LEVEL ${level}: MORE BUBBLES!`, duration, 'cyan');
}

// Updated with WCAG-compliant colors
export function showMaximumIntensity(duration = 2500) {
  showUrgentMessage("⚡ WARNING: MAXIMUM INTENSITY! ⚡", duration, '#ff8c00'); // Darker orange
}

export function showFreezeEnded(duration = 2000) {
  showUrgentMessage("FREEZE ENDED", duration);
}

export function showFreezeReady(duration = 2000) {
  showUrgentMessage("FREEZE POWER-UP READY!", duration);
}

// Updated with WCAG-compliant colors
export function showTimeFreeze(duration = 2000) {
  showUrgentMessage("TIME FREEZE!", duration, '#1e90ff'); // Brighter blue
}

// Updated with WCAG-compliant colors
export function showBoom(duration = 1500) {
  showUrgentMessage("BOOM!", duration, '#ff4500'); // Brighter red-orange
}

// Updated with WCAG-compliant colors
export function showOuchPenalty(duration = 1500) {
  showUrgentMessage("OUCH! -50", duration, '#ff6b6b'); // Brighter red
}

export function showDoublePop(duration = 1000) {
  showUrgentMessage("DOUBLE POP! +10", duration);
}

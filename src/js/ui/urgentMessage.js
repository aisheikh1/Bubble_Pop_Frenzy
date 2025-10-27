// src/js/ui/urgentMessage.js

// Toggle to suppress urgent messages globally if needed.
const DISABLE_URGENT_MESSAGE = false;

// Keep a single live element + timer so messages don't pile up.
let _urgentEl = null;
let _hideTimer = null;
let _removeTimer = null;

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

  // Clear any existing timers to prevent memory leaks
  if (_hideTimer) {
    clearTimeout(_hideTimer);
    _hideTimer = null;
  }
  if (_removeTimer) {
    clearTimeout(_removeTimer);
    _removeTimer = null;
  }
  
  // Validate the provided color and use a fallback if it's invalid
  const validColor = isValidColor(color) ? color : '#fff';
  if (color !== validColor) {
    console.warn(`Invalid color '${color}' provided. Using fallback color '${validColor}'.`);
  }

  // Calculate contrast ratio and choose appropriate background
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
      _removeTimer = null;
    }, 200);
  }, Math.max(0, duration));
}

// ============================================================================
// DIFFICULTY & INTENSITY MESSAGES
// ============================================================================

/**
 * Show "LEVEL X: EASE UP!" message
 * Displayed when difficulty increases but player is struggling (high miss rate)
 * @param {number} level - Current difficulty level
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showDifficultyEaseUp(level, duration = 2000) {
  showUrgentMessage(`LEVEL ${level}: EASE UP!`, duration, '#00CED1'); // Dark turquoise
}

/**
 * Show "LEVEL X: FASTER BUBBLES!" message
 * Displayed when bubble speed increases
 * @param {number} level - Current difficulty level
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showFasterBubbles(level, duration = 2000) {
  showUrgentMessage(`LEVEL ${level}: FASTER BUBBLES!`, duration, '#32CD32'); // Lime green
}

/**
 * Show "LEVEL X: MORE BUBBLES!" message
 * Displayed when spawn rate increases
 * @param {number} level - Current difficulty level
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showMoreBubbles(level, duration = 2000) {
  showUrgentMessage(`LEVEL ${level}: MORE BUBBLES!`, duration, '#00CED1'); // Dark turquoise
}

/**
 * Show "⚡ WARNING: MAXIMUM INTENSITY! ⚡" message
 * Displayed when difficulty reaches critical levels
 * @param {number} duration - Display duration in milliseconds (default: 2500ms)
 */
export function showMaximumIntensity(duration = 2500) {
  showUrgentMessage("⚡ WARNING: MAXIMUM INTENSITY! ⚡", duration, '#ff8c00'); // Dark orange
}

// ============================================================================
// FREEZE BUBBLE MESSAGES (Survival Mode)
// ============================================================================

/**
 * Show "FREEZE ENDED" message
 * Displayed when freeze time expires in survival mode
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showFreezeEnded(duration = 2000) {
  showUrgentMessage("FREEZE ENDED", duration, '#fff');
}

/**
 * Show "FREEZE POWER-UP READY!" message
 * Displayed when player earns a freeze bubble in survival mode
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showFreezeReady(duration = 2000) {
  showUrgentMessage("FREEZE POWER-UP READY!", duration, '#1E90FF'); // Dodger blue
}

/**
 * Show "TIME FREEZE!" message
 * Displayed when freeze bubble is activated in survival mode
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showTimeFreeze(duration = 2000) {
  showUrgentMessage("TIME FREEZE!", duration, '#1E90FF'); // Dodger blue
}

// ============================================================================
// FRENZY MODE MESSAGES (Classic Mode) - NEW
// ============================================================================

/**
 * Show "Go Frenzy!" message
 * Displayed when frenzy mode is activated in classic mode
 * Brief display (0.5s) before countdown starts
 * @param {number} duration - Display duration in milliseconds (default: 500ms)
 */
export function showGoFrenzy(duration = 500) {
  showUrgentMessage("Go Frenzy!", duration, '#FFD700'); // Gold
}

/**
 * Show "Frenzy Time Up!" message
 * Displayed when frenzy mode countdown reaches zero
 * @param {number} duration - Display duration in milliseconds (default: 1500ms)
 */
export function showFrenzyTimeUp(duration = 1500) {
  showUrgentMessage("Frenzy Time Up!", duration, '#FF6347'); // Tomato red
}

/**
 * Show "Get Ready!" message (optional enhancement)
 * Can be displayed before frenzy activation to build anticipation
 * @param {number} duration - Display duration in milliseconds (default: 1000ms)
 */
export function showFrenzyGetReady(duration = 1000) {
  showUrgentMessage("Get Ready!", duration, '#FFA500'); // Orange
}

/**
 * Show frenzy countdown number (alternative to visual effect)
 * Can be used as fallback if FrenzyCountdownEffect has issues
 * @param {number} seconds - Number to display (3, 2, 1)
 * @param {number} duration - Display duration in milliseconds (default: 1000ms)
 */
export function showFrenzyCountdown(seconds, duration = 1000) {
  const colors = {
    3: '#FFD700', // Gold
    2: '#FFA500', // Orange
    1: '#FF4500'  // Red-orange
  };
  showUrgentMessage(String(seconds), duration, colors[seconds] || '#FFD700');
}

// ============================================================================
// BOMB & SPECIAL BUBBLE MESSAGES
// ============================================================================

/**
 * Show "BOOM!" message
 * Displayed when bomb bubble explodes
 * @param {number} duration - Display duration in milliseconds (default: 1500ms)
 */
export function showBoom(duration = 1500) {
  showUrgentMessage("BOOM!", duration, '#FF4500'); // Red-orange
}

/**
 * Show "OUCH! -50" message
 * Displayed when player pops a decoy bubble
 * @param {number} duration - Display duration in milliseconds (default: 1500ms)
 */
export function showOuchPenalty(duration = 1500) {
  showUrgentMessage("OUCH! -50", duration, '#ff6b6b'); // Light red
}

/**
 * Show "DOUBLE POP! +10" message
 * Displayed when player completes a double-tap bubble
 * @param {number} duration - Display duration in milliseconds (default: 1000ms)
 */
export function showDoublePop(duration = 1000) {
  showUrgentMessage("DOUBLE POP! +10", duration, '#fff');
}

// ============================================================================
// COMBO & STREAK MESSAGES
// ============================================================================

/**
 * Show combo message with count
 * Displayed when player achieves pop combos
 * @param {number} count - Number of consecutive pops
 * @param {number} duration - Display duration in milliseconds (default: 1000ms)
 */
export function showCombo(count, duration = 1000) {
  let message = `${count}x COMBO!`;
  let color = '#FFD700'; // Gold
  
  // Special messages for milestone combos
  if (count >= 50) {
    message = `🔥 ${count}x LEGENDARY! 🔥`;
    color = '#FF1493'; // Deep pink
  } else if (count >= 30) {
    message = `⚡ ${count}x AMAZING! ⚡`;
    color = '#FF4500'; // Red-orange
  } else if (count >= 20) {
    message = `✨ ${count}x SUPER! ✨`;
    color = '#FFA500'; // Orange
  } else if (count >= 10) {
    message = `🌟 ${count}x GREAT! 🌟`;
    color = '#FFD700'; // Gold
  }
  
  showUrgentMessage(message, duration, color);
}

/**
 * Show "COMBO BROKEN!" message
 * Displayed when player's combo streak is interrupted
 * @param {number} duration - Display duration in milliseconds (default: 1000ms)
 */
export function showComboBroken(duration = 1000) {
  showUrgentMessage("COMBO BROKEN!", duration, '#ff6b6b'); // Light red
}

// ============================================================================
// ACHIEVEMENT & MILESTONE MESSAGES
// ============================================================================

/**
 * Show custom achievement message
 * Generic function for displaying achievement notifications
 * @param {string} title - Achievement title
 * @param {string} color - Text color (default: gold)
 * @param {number} duration - Display duration in milliseconds (default: 2500ms)
 */
export function showAchievement(title, color = '#FFD700', duration = 2500) {
  showUrgentMessage(`🏆 ${title} 🏆`, duration, color);
}

/**
 * Show score milestone message
 * Displayed when player reaches significant score thresholds
 * @param {number} score - Score milestone reached
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showScoreMilestone(score, duration = 2000) {
  showUrgentMessage(`${score} POINTS!`, duration, '#FFD700');
}

// ============================================================================
// GAME STATE MESSAGES
// ============================================================================

/**
 * Show "PAUSED" message
 * Alternative to overlay, can be used for brief pause notifications
 * @param {number} duration - Display duration in milliseconds (default: 1000ms)
 */
export function showPaused(duration = 1000) {
  showUrgentMessage("PAUSED", duration, '#fff');
}

/**
 * Show "RESUMED" message
 * Displayed when game is unpaused
 * @param {number} duration - Display duration in milliseconds (default: 800ms)
 */
export function showResumed(duration = 800) {
  showUrgentMessage("RESUMED", duration, '#32CD32'); // Lime green
}

/**
 * Show warning message
 * Generic function for displaying warnings
 * @param {string} message - Warning text
 * @param {number} duration - Display duration in milliseconds (default: 2000ms)
 */
export function showWarning(message, duration = 2000) {
  showUrgentMessage(`⚠️ ${message} ⚠️`, duration, '#FFA500'); // Orange
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear the current urgent message immediately
 * Useful for forcing message changes or clearing stale messages
 */
export function clearUrgentMessage() {
  if (_hideTimer) {
    clearTimeout(_hideTimer);
    _hideTimer = null;
  }
  if (_removeTimer) {
    clearTimeout(_removeTimer);
    _removeTimer = null;
  }
  if (_urgentEl && _urgentEl.parentNode) {
    _urgentEl.parentNode.removeChild(_urgentEl);
  }
  _urgentEl = null;
}

/**
 * Check if an urgent message is currently displayed
 * @returns {boolean} True if message is visible
 */
export function isUrgentMessageVisible() {
  return _urgentEl !== null && _urgentEl.parentNode !== null;
}

/**
 * Get the current message text (if any)
 * @returns {string|null} Current message text or null
 */
export function getCurrentUrgentMessage() {
  return _urgentEl ? _urgentEl.textContent : null;
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * Complete list of exported functions:
 * 
 * Core:
 * - showUrgentMessage(message, duration, color)
 * - clearUrgentMessage()
 * - isUrgentMessageVisible()
 * - getCurrentUrgentMessage()
 * 
 * Difficulty:
 * - showDifficultyEaseUp(level, duration)
 * - showFasterBubbles(level, duration)
 * - showMoreBubbles(level, duration)
 * - showMaximumIntensity(duration)
 * 
 * Freeze (Survival):
 * - showFreezeEnded(duration)
 * - showFreezeReady(duration)
 * - showTimeFreeze(duration)
 * 
 * Frenzy (Classic) - NEW:
 * - showGoFrenzy(duration)
 * - showFrenzyTimeUp(duration)
 * - showFrenzyGetReady(duration)
 * - showFrenzyCountdown(seconds, duration)
 * 
 * Special Bubbles:
 * - showBoom(duration)
 * - showOuchPenalty(duration)
 * - showDoublePop(duration)
 * 
 * Combos:
 * - showCombo(count, duration)
 * - showComboBroken(duration)
 * 
 * Achievements:
 * - showAchievement(title, color, duration)
 * - showScoreMilestone(score, duration)
 * 
 * Game State:
 * - showPaused(duration)
 * - showResumed(duration)
 * - showWarning(message, duration)
 */
// src/js/gametitlemanagement/animatedTitle.js

import { getRandomAnimation } from './titleManager.js';

/**
 * Main exported function - initializes a random animated game title
 * NOTE: Since titleManager is configured to only return 'squishPop', 
 * this will always select the revamped animation.
 * @param {HTMLElement} titleElement - The DOM element to animate
 * @returns {Function|void} Cleanup function (if needed)
 */
export function initializeGameTitle(titleElement) {
  if (!titleElement) {
    console.warn('No title element provided for animation');
    return;
  }

  try {
    // Ensure the title element has the correct text content
    if (!titleElement.textContent || titleElement.textContent.trim() === '') {
      titleElement.textContent = "BUBBLE POP FRENZY!";
    }

    // Get random animation type from titleManager (will be 'squishPop')
    const animationType = getRandomAnimation();
    
    // Apply the selected animation
    return animateTitle(titleElement, animationType);
  } catch (error) {
    console.warn('Game title animation failed, using fallback:', error);
    return fallbackAnimation(titleElement);
  }
}

/**
 * Internal function that applies specific animation types
 * @param {HTMLElement} element - The title element
 * @param {string} animationType - Type of animation to apply
 * @returns {Function|void} Cleanup function
 */
function animateTitle(element, animationType) {
  // Store original text content for cleanup
  const originalContent = element.textContent || "BUBBLE POP FRENZY!";
  const originalHTML = element.innerHTML;
  
  // Clear existing content and apply animation
  element.innerHTML = '';
  element.textContent = originalContent; // Reset to plain text
  
  const animations = {
    // Only the new animation is mapped
    squishPop: () => squishPopAnimation(element), 
    fallback: () => fallbackAnimation(element)
  };

  // Select the animation or fallback if an unknown type is returned
  const selectedAnimation = animations[animationType] || animations.fallback;
  const cleanup = selectedAnimation();
  
  // Return cleanup function that restores original state
  return () => {
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
    }
    element.innerHTML = originalHTML;
    element.style.cssText = ''; // Reset all styles
  };
}

// ============================================================================
// ANIMATION IMPLEMENTATIONS
// ============================================================================

/**
 * The Revamped Squish Pop Animation (2D/3D Illusion of the requested PoP cycle)
 * NOTE: Keyframes are loaded from title-animations.css
 * @param {HTMLElement} element - The title element
 * @returns {Function} Cleanup function
 */
function squishPopAnimation(element) {
  const targetText = "BUBBLE PoP FRENZY!";
  const text = (element.textContent || targetText).trim().replace(/POP/gi, 'PoP');
  element.innerHTML = '';
  
  // Set up container for word layout and base style with enhanced 3D
  element.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    font-family: 'Bangers', cursive;
    font-size: 2.5rem;
    color: white;
    perspective: 1000px;
    transform-style: preserve-3d;
  `;
  
  // Split the text around the word "PoP" and clean up whitespace
  const parts = text.split(/PoP/i).map(part => part.trim());
  
  // Enhanced 3D layered text shadow for depth
  const create3DTextShadow = (color1 = '#ff6b6b', color2 = '#000') => {
    let shadow = '';
    for (let i = 1; i <= 8; i++) {
      const alpha = 1 - (i * 0.1);
      shadow += `${i}px ${i}px 0 ${color2}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}, `;
    }
    shadow += `0 0 20px ${color1}80, 0 0 40px ${color1}40`;
    return shadow;
  };
  
  // Function to create a word span with enhanced 3D effect
  const setupWord = (word) => {
    const wordSpan = document.createElement('span');
    wordSpan.textContent = word;
    wordSpan.style.cssText = `
      display: inline-block;
      transform-style: preserve-3d;
      animation: word3DFloat 4s ease-in-out infinite;
      animation-delay: ${Math.random() * 0.5}s;
      text-shadow: ${create3DTextShadow('#4ecdc4', '#000')};
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    `;
    element.appendChild(wordSpan);
  };
  
  // 1. Setup BUBBLE (part 0)
  if (parts[0]) {
    setupWord(parts[0]);
  }
  
  // --- Dynamic 'PoP' Container Setup ---
  const popContainer = document.createElement('span');
  popContainer.style.cssText = `
    display: flex;
    align-items: center;
    margin: 0; 
    transform-style: preserve-3d; /* Key for internal 3D transforms */
  `;
  element.appendChild(popContainer);
  
  // 2. Setup P1
  const P1 = document.createElement('span');
  P1.textContent = 'P';
  P1.style.cssText = `
    display: inline-block;
    color: #4ecdc4; 
    text-shadow: 0 0 10px rgba(78, 205, 196, 0.8);
    transform-origin: right center; /* Set origin for the rotational transform */
    animation: squishPopP1 3s infinite ease-in-out;
  `;
  popContainer.appendChild(P1);
  
  // 3. Setup Bubble 'o'
  const bubbleO = document.createElement('span');
  bubbleO.style.cssText = `
    display: inline-block;
    width: 0.8em;
    height: 0.8em;
    min-width: 25px; 
    min-height: 25px;
    margin: 0 4px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #fff, #ff6b6b);
    border: 3px solid #fff;
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
    position: relative;
    /* Apply initial state and animation */
    transform: scale(0.6, 1.2); 
    animation: bubbleSquishPop 3s infinite ease-in-out;
  `;
  popContainer.appendChild(bubbleO);
  
  // 4. Setup P2
  const P2 = document.createElement('span');
  P2.textContent = 'P';
  P2.style.cssText = `
    display: inline-block;
    color: #4ecdc4; 
    text-shadow: 0 0 10px rgba(78, 205, 196, 0.8);
    transform-origin: left center; /* Set origin for the rotational transform */
    animation: squishPopP2 3s infinite ease-in-out;
  `;
  popContainer.appendChild(P2);
  // --- End Dynamic 'PoP' Container Setup ---

  // 5. Setup FRENZY! (part 1)
  if (parts[1]) {
    setupWord(parts[1]);
  }

  // No specific cleanup needed as all persistent styles are applied inline or via CSS classes
  return () => {};
}

/**
 * Fallback Animation - Simple fade in
 * @param {HTMLElement} element - The title element
 * @returns {Function} Cleanup function
 */
function fallbackAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    opacity: 0;
    animation: fadeIn 1s ease-in forwards;
    ${originalStyle}
  `;

  // Dynamically add keyframes for the simple fallback fade in
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Return a cleanup function to remove the injected style
  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}
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
    perspective: 1200px;
    transform-style: preserve-3d;
    position: relative;
  `;
  
  // Create animated background particles
  const particleContainer = document.createElement('div');
  particleContainer.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200%;
    height: 200%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: -1;
  `;
  
  // Add floating particles for atmosphere
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(78,205,196,0.3));
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: floatParticle ${8 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 3}s;
      opacity: 0.6;
      box-shadow: 0 0 10px rgba(78,205,196,0.5);
    `;
    particleContainer.appendChild(particle);
  }
  element.appendChild(particleContainer);
  
  // Split the text around the word "PoP" and clean up whitespace
  const parts = text.split(/PoP/i).map(part => part.trim());
  
  // Enhanced 3D layered text shadow for depth with chromatic aberration
  const create3DTextShadow = (color1 = '#ff6b6b', color2 = '#000') => {
    let shadow = '';
    for (let i = 1; i <= 8; i++) {
      const alpha = 1 - (i * 0.1);
      shadow += `${i}px ${i}px 0 ${color2}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}, `;
    }
    // Add chromatic aberration effect
    shadow += `0 0 20px ${color1}80, 0 0 40px ${color1}40, `;
    shadow += `2px 0 3px rgba(255,0,0,0.3), -2px 0 3px rgba(0,255,255,0.3)`;
    return shadow;
  };
  
  // Function to create a word span with enhanced 3D effect
  const setupWord = (word, index) => {
    const wordSpan = document.createElement('span');
    wordSpan.textContent = word;
    
    // Split word into individual letters for staggered animation
    const letters = word.split('');
    wordSpan.textContent = '';
    
    letters.forEach((letter, letterIndex) => {
      const letterSpan = document.createElement('span');
      letterSpan.textContent = letter;
      letterSpan.style.cssText = `
        display: inline-block;
        transform-style: preserve-3d;
        animation: letterBounce 2s ease-in-out infinite;
        animation-delay: ${(letterIndex * 0.1) + (index * 0.3)}s;
      `;
      wordSpan.appendChild(letterSpan);
    });
    
    wordSpan.style.cssText = `
      display: inline-block;
      transform-style: preserve-3d;
      animation: word3DFloat 4s ease-in-out infinite;
      animation-delay: ${index * 0.2}s;
      text-shadow: ${create3DTextShadow('#4ecdc4', '#000')};
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
      position: relative;
    `;
    element.appendChild(wordSpan);
  };
  
  // 1. Setup BUBBLE (part 0)
  if (parts[0]) {
    setupWord(parts[0], 0);
  }
  
  // --- Dynamic 'PoP' Container Setup with Enhanced 3D ---
  const popContainer = document.createElement('span');
  popContainer.style.cssText = `
    display: flex;
    align-items: center;
    margin: 0; 
    transform-style: preserve-3d;
    perspective: 500px;
    position: relative;
  `;
  element.appendChild(popContainer);
  
  // 2. Setup P1 with enhanced 3D effects and magnetic pull effect
  const P1 = document.createElement('span');
  P1.textContent = 'P';
  P1.style.cssText = `
    display: inline-block;
    color: #4ecdc4; 
    text-shadow: ${create3DTextShadow('#4ecdc4', '#0a3d3d')};
    transform-origin: right center;
    transform-style: preserve-3d;
    animation: squishPopP1Enhanced 3s infinite ease-in-out;
    filter: drop-shadow(0 8px 16px rgba(78, 205, 196, 0.5));
    will-change: transform;
    position: relative;
  `;
  popContainer.appendChild(P1);
  
  // 3. Setup Bubble 'o' with enhanced 3D depth and pressure waves
  const bubbleO = document.createElement('span');
  bubbleO.style.cssText = `
    display: inline-block;
    width: 0.8em;
    height: 0.8em;
    min-width: 25px; 
    min-height: 25px;
    margin: 0 4px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #fff 0%, #ffb3b3 40%, #ff6b6b 100%);
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 
      inset -4px -4px 8px rgba(0, 0, 0, 0.3),
      inset 4px 4px 8px rgba(255, 255, 255, 0.7),
      0 0 20px rgba(255, 107, 107, 0.8),
      0 8px 16px rgba(255, 107, 107, 0.4);
    position: relative;
    transform: scale(0.6, 1.2) translateZ(20px);
    transform-style: preserve-3d;
    animation: bubbleSquishPopEnhanced 3s infinite ease-in-out;
    will-change: transform, opacity;
  `;
  
  // Add a highlight spot for more realistic 3D bubble effect
  const highlight = document.createElement('span');
  highlight.style.cssText = `
    position: absolute;
    top: 15%;
    left: 25%;
    width: 35%;
    height: 35%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.9), transparent);
    pointer-events: none;
    animation: highlightShimmer 2s ease-in-out infinite;
  `;
  bubbleO.appendChild(highlight);
  
  // Add pressure wave rings that appear during collision
  const pressureWave = document.createElement('span');
  pressureWave.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(255, 107, 107, 0.6);
    transform: translate(-50%, -50%) scale(0);
    animation: pressureRipple 3s infinite ease-out;
    pointer-events: none;
  `;
  bubbleO.appendChild(pressureWave);
  
  popContainer.appendChild(bubbleO);
  
  // 4. Setup P2 with enhanced 3D effects and magnetic pull effect
  const P2 = document.createElement('span');
  P2.textContent = 'P';
  P2.style.cssText = `
    display: inline-block;
    color: #4ecdc4; 
    text-shadow: ${create3DTextShadow('#4ecdc4', '#0a3d3d')};
    transform-origin: left center;
    transform-style: preserve-3d;
    animation: squishPopP2Enhanced 3s infinite ease-in-out;
    filter: drop-shadow(0 8px 16px rgba(78, 205, 196, 0.5));
    will-change: transform;
    position: relative;
  `;
  popContainer.appendChild(P2);
  // --- End Dynamic 'PoP' Container Setup ---

  // 5. Setup FRENZY! (part 1)
  if (parts[1]) {
    setupWord(parts[1], 1);
  }

  // Add enhanced CSS animations for 3D effects
  const style = document.createElement('style');
  style.textContent = `
    @keyframes word3DFloat {
      0%, 100% { 
        transform: translateZ(0px) rotateX(0deg) rotateY(0deg);
      }
      25% { 
        transform: translateZ(15px) rotateX(-3deg) rotateY(2deg);
      }
      50% { 
        transform: translateZ(25px) rotateX(2deg) rotateY(-2deg);
      }
      75% { 
        transform: translateZ(10px) rotateX(-1deg) rotateY(1deg);
      }
    }
    
    @keyframes letterBounce {
      0%, 100% {
        transform: translateY(0px) rotateZ(0deg);
      }
      50% {
        transform: translateY(-4px) rotateZ(2deg);
      }
    }
    
    @keyframes floatParticle {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.3;
      }
      25% {
        transform: translate(10px, -20px) scale(1.2);
        opacity: 0.6;
      }
      50% {
        transform: translate(-5px, -35px) scale(0.8);
        opacity: 0.8;
      }
      75% {
        transform: translate(15px, -25px) scale(1.1);
        opacity: 0.5;
      }
    }
    
    @keyframes highlightShimmer {
      0%, 100% {
        opacity: 0.8;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }
    
    @keyframes pressureRipple {
      0%, 39% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }
      40% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0.8;
      }
      50% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }
    
    @keyframes squishPopP1Enhanced {
      0%, 100% { 
        transform: translateX(0) rotateY(0deg) scale(1) translateZ(0); 
      }
      35% { 
        transform: translateX(0) rotateY(0deg) scale(1.05) translateZ(5px);
      }
      40% { 
        transform: translateX(0) rotateY(0deg) scale(1.02, 1) translateZ(10px);
      } 
      45% { 
        transform: translateX(12px) rotateY(-5deg) scale(1, 1) translateZ(15px);
      } 
      50% { 
        transform: translateX(12px) rotateY(-20deg) scale(1.25, 0.95) translateZ(20px);
        color: #ff4757;
        filter: drop-shadow(0 0 20px rgba(255, 71, 87, 0.8)) brightness(1.3);
      } 
      55% { 
        transform: translateX(12px) rotateY(-8deg) scale(1.08, 1) translateZ(15px);
      } 
      75% { 
        transform: translateX(0) rotateY(0deg) scale(1) translateZ(0);
        color: #4ecdc4;
      } 
    }
    
    @keyframes squishPopP2Enhanced {
      0%, 100% { 
        transform: translateX(0) rotateY(0deg) scale(1) translateZ(0); 
      }
      35% { 
        transform: translateX(0) rotateY(0deg) scale(1.05) translateZ(5px);
      }
      40% { 
        transform: translateX(0) rotateY(0deg) scale(1.02, 1) translateZ(10px);
      } 
      45% { 
        transform: translateX(-12px) rotateY(5deg) scale(1, 1) translateZ(15px);
      } 
      50% { 
        transform: translateX(-12px) rotateY(20deg) scale(1.25, 0.95) translateZ(20px);
        color: #ff4757;
        filter: drop-shadow(0 0 20px rgba(255, 71, 87, 0.8)) brightness(1.3);
      } 
      55% { 
        transform: translateX(-12px) rotateY(8deg) scale(1.08, 1) translateZ(15px);
      } 
      75% { 
        transform: translateX(0) rotateY(0deg) scale(1) translateZ(0);
        color: #4ecdc4;
      }
    }
    
    @keyframes bubbleSquishPopEnhanced {
      0%, 39% { 
        opacity: 1; 
        transform: scale(0.6, 1.2) translateZ(20px) rotateZ(0deg);
        filter: brightness(1);
      }
      40% { 
        opacity: 1; 
        transform: scale(1.6, 0.4) translateZ(25px) rotateZ(3deg);
        filter: brightness(1.2);
      }
      41% { 
        opacity: 0.8; 
        transform: scale(2.5) translateZ(30px) rotateZ(5deg);
        background: radial-gradient(circle at 50% 50%, #fff, #ff6b6b);
        box-shadow: 
          0 0 15px 7.5px rgba(255, 107, 107, 0.225), 
          0 0 30px 10px rgba(255, 255, 255, 0.15);
        filter: brightness(1.25);
      }
      42% { 
        opacity: 0; 
        transform: scale(0) translateZ(0);
        box-shadow: none;
      }
      75% { 
        opacity: 0; 
        transform: scale(0) translateZ(0);
      }
      85% { 
        opacity: 0;
        transform: scale(0.1, 0.1) translateZ(5px);
      }
      95% {
        opacity: 0.5;
        transform: scale(0.4, 0.8) translateZ(15px);
      }
      100% { 
        opacity: 1; 
        transform: scale(0.6, 1.2) translateZ(20px) rotateZ(0deg);
        filter: brightness(1);
      }
    }
  `;
  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    if (style.parentNode) {
      document.head.removeChild(style);
    }
  };
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
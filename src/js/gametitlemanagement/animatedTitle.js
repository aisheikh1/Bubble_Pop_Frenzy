// src/js/gametitlemanagement/animatedTitle.js

import { getRandomAnimation } from './titleManager.js';

/**
 * Main exported function - initializes a random animated game title
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

    // Get random animation type from titleManager
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
    floatingBubbles: () => floatingBubblesAnimation(element),
    popIn: () => popInAnimation(element),
    liquidFill: () => liquidFillAnimation(element),
    bubbleGum: () => bubbleGumAnimation(element),
    scoreCounter: () => scoreCounterAnimation(element),
    arcadeMarquee: () => arcadeMarqueeAnimation(element),
    bubbleFloat: () => bubbleFloatAnimation(element),
    gelatinousBounce: () => gelatinousBounceAnimation(element),
    neonPulse: () => neonPulseAnimation(element),
    waterRipple: () => waterRippleAnimation(element),
    fallback: () => fallbackAnimation(element)
  };

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
 * 1. Floating Bubbles Animation - REVISED
 * Letters appear in bubbles that float gently, safe for Unicode and layout
 */
function floatingBubblesAnimation(element) {
  // 1. Unicode-safe text acquisition
  const text = (element.textContent || "BUBBLE POP FRENZY!").trim();
  element.innerHTML = '';
  
  // Set up the container for flex layout
  element.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px; /* Space between words/bubbles */
    flex-wrap: wrap;
    font-size: 2.5rem; /* 3. Set an appropriate base font size */
    font-family: 'Bangers', cursive; /* 2. Explicitly ensure title font is applied */
  `;
  
  // 4. Split text into words, then process each word
  const words = text.split(/\s+/);
  const cleanups = [];
  let totalIndex = 0;

  words.forEach((word, wordIndex) => {
    // Create a container for the word to prevent splitting characters across lines
    const wordContainer = document.createElement('span');
    wordContainer.style.cssText = `
      display: flex;
      gap: 4px; /* Smaller gap between characters within a word */
      margin: 0 4px; /* Space between words */
    `;
    element.appendChild(wordContainer);

    // 1. Use Array.from for Unicode/Emoji safe splitting
    const letters = Array.from(word);

    letters.forEach((letter) => {
      const bubble = document.createElement('span');
      bubble.textContent = letter;
      
      bubble.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #fff, #ff6b6b);
        border: 2px solid #fff;
        
        /* 2. Font settings inherited from the main element styles */
        font-family: inherit;
        font-size: 1em; /* Use relative size to inherit from parent */
        font-weight: bold;
        color: #333;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        animation: floatBubble 3s ease-in-out infinite;
        animation-delay: ${totalIndex * 0.2}s;
        opacity: 0;
        animation-fill-mode: forwards;
      `;
      
      wordContainer.appendChild(bubble);
      totalIndex++;
    });
    
    // Add a small space (or a dedicated element) between words if needed, 
    // but the margin on wordContainer handles this.
  });

  // Dynamically add keyframes (only once)
  if (element.querySelector('span')) {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatBubble {
        0% { opacity: 0; transform: translateY(20px) scale(0.8); }
        20% { opacity: 1; transform: translateY(0) scale(1.1); }
        40% { transform: translateY(-8px) scale(1); }
        60% { transform: translateY(-4px) scale(1.05); }
        80% { transform: translateY(-2px) scale(1); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
    cleanups.push(() => document.head.removeChild(style));
  }

  return () => cleanups.forEach(cleanup => cleanup());
}

/**
 * 2. Pop-In Sequence Animation
 * Letters pop in one by one with bounce effect
 */
function popInAnimation(element) {
  const text = element.textContent || "Bubble Pop Frenzy!";
  element.innerHTML = '';
  element.style.display = 'flex';
  element.style.justifyContent = 'center';
  element.style.gap = '2px';

  const letters = text.split('');
  
  letters.forEach((letter, index) => {
    const span = document.createElement('span');
    span.textContent = letter;
    span.style.cssText = `
      display: inline-block;
      opacity: 0;
      transform: scale(0);
      animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      animation-delay: ${index * 0.1}s;
       /* Apply font styles to span as well for robustness */
      font-family: inherit; 
      font-weight: bold;
    `;
    element.appendChild(span);
  });

  // Add keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popIn {
      0% { 
        opacity: 0; 
        transform: scale(0); 
      }
      70% { 
        opacity: 1; 
        transform: scale(1.2); 
      }
      100% { 
        opacity: 1; 
        transform: scale(1); 
      }
    }
  `;
  document.head.appendChild(style);

  return () => document.head.removeChild(style);
}

/**
 * 3. Liquid Fill Animation
 * Text fills up like rising liquid
 */
function liquidFillAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    background: linear-gradient(to top, #ff6b6b 0%, transparent 0%);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-size: 100% 200%;
    animation: liquidFill 2s ease-in-out forwards;
    ${originalStyle}
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes liquidFill {
      0% { 
        background-position: 0% 100%;
      }
      100% { 
        background-position: 0% 0%;
      }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}

/**
 * 4. Bubble Gum Animation
 * Text has a stretchy, bouncy effect
 */
function bubbleGumAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    display: inline-block;
    animation: bubbleGum 2s ease-in-out;
    ${originalStyle}
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes bubbleGum {
      0% { 
        transform: scaleX(0.8) scaleY(1.2); 
      }
      25% { 
        transform: scaleX(1.3) scaleY(0.9); 
      }
      50% { 
        transform: scaleX(0.95) scaleY(1.1); 
      }
      75% { 
        transform: scaleX(1.1) scaleY(0.95); 
      }
      100% { 
        transform: scaleX(1) scaleY(1); 
      }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}

/**
 * 5. Score Counter Animation
 * Numbers count up rapidly before settling
 */
function scoreCounterAnimation(element) {
  const finalText = element.textContent || "BUBBLE POP FRENZY!";
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ! '; // Removed ? symbol
  let iterations = 0;
  const maxIterations = 20;
  
  element.style.fontFamily = "'Courier New', monospace";
  element.style.fontWeight = 'bold';

  const interval = setInterval(() => {
    element.textContent = finalText
      .split('')
      .map((char, index) => {
        if (index < iterations) {
          return finalText[index];
        }
        if (char === ' ') return ' ';
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');
    
    iterations += 1 / 3;
    
    if (iterations >= finalText.length) {
      clearInterval(interval);
      element.textContent = finalText;
    }
  }, 80);

  return () => {
    clearInterval(interval);
    element.textContent = finalText;
  };
}

/**
 * 6. Arcade Marquee Animation
 * Neon sign with glowing, pulsing effect
 */
function arcadeMarqueeAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    color: #fff;
    text-shadow: 
      0 0 5px #fff,
      0 0 10px #fff,
      0 0 20px #ff0080,
      0 0 30px #ff0080,
      0 0 40px #ff0080;
    animation: neonPulse 1.5s ease-in-out infinite alternate;
    ${originalStyle}
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes neonPulse {
      from {
        text-shadow: 
          0 0 5px #fff,
          0 0 10px #fff,
          0 0 20px #ff0080,
          0 0 30px #ff0080,
          0 0 40px #ff0080;
      }
      to {
        text-shadow: 
          0 0 10px #fff,
          0 0 20px #ff0080,
          0 0 30px #ff0080,
          0 0 40px #ff0080,
          0 0 50px #ff0080,
          0 0 60px #ff0080;
      }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}

/**
 * 7. Bubble Float Animation - REVISED
 * Bubbles float up from bottom and pop into position, with improved stability
 */
function bubbleFloatAnimation(element) {
  const text = (element.textContent || "BUBBLE POP FRENZY!").trim();
  element.innerHTML = '';
  
  // 3. Load font/Set Size/Set Layout on Parent
  element.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px; /* Gap between words */
    flex-wrap: wrap; /* Allow wrapping of words */
    font-family: 'Bangers', cursive; /* 3. Explicitly ensure title font is applied */
    font-size: 2.5rem; /* Set base font size for the title */
  `;

  // 2. Split text into words, then process each word to prevent splitting
  const words = text.split(/\s+/);
  const cleanups = [];
  let totalIndex = 0;

  words.forEach((word) => {
    // Create a container for the word to prevent characters from wrapping
    const wordContainer = document.createElement('span');
    wordContainer.style.cssText = `
      display: flex;
      gap: 4px; /* Smaller gap between characters within a word */
    `;
    element.appendChild(wordContainer);

    // Use Array.from for Unicode/Emoji safe splitting (good practice)
    const letters = Array.from(word);

    letters.forEach((letter) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.style.cssText = `
        display: inline-block;
        opacity: 0;
        transform: translateY(100px) scale(0.5);
        animation: bubbleFloat 1.5s ease-out forwards;
        animation-delay: ${totalIndex * 0.15}s;

        /* 1. Change font colour to darker/deeper contrasting colours */
        color: #1A237E; /* Deep Ocean Blue */
        
        font-family: inherit; 
        font-size: 1em; /* Inherit size from parent */
        font-weight: bold;
      `;
      wordContainer.appendChild(span);
      totalIndex++;
    });
  });

  // Keyframes section (unchanged)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bubbleFloat {
      0% { 
        opacity: 0; 
        transform: translateY(100px) scale(0.5); 
      }
      70% { 
        opacity: 1; 
        transform: translateY(-10px) scale(1.1); 
      }
      85% { 
        transform: translateY(5px) scale(0.95); 
      }
      100% { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }
  `;
  document.head.appendChild(style);

  return () => document.head.removeChild(style);
}

/**
 * 8. Gelatinous Bounce Animation
 * Jiggly, wobbly text like Jell-O
 */
function gelatinousBounceAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    display: inline-block;
    animation: gelatinous 2s ease-in-out;
    transform-origin: center;
    ${originalStyle}
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes gelatinous {
      0%, 100% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.1) rotate(1deg); }
      50% { transform: scale(0.95) rotate(-1deg); }
      75% { transform: scale(1.05) rotate(0.5deg); }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}

/**
 * 9. Neon Pulse Animation
 * Bright colors with pulsing glow
 */
function neonPulseAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
    background-size: 400% 400%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: neonShift 3s ease-in-out infinite, neonPulseStatic 2s ease-in-out infinite;
    ${originalStyle}
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes neonShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes neonPulseStatic {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}

/**
 * 10. Water Ripple Animation
 * Text appears as if viewed through water
 */
function waterRippleAnimation(element) {
  const originalStyle = element.style.cssText;
  const text = element.textContent || "BUBBLE POP FRENZY!";
  element.textContent = text; // Ensure text content
  
  element.style.cssText = `
    display: inline-block;
    animation: waterRipple 3s ease-in-out;
    ${originalStyle}
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes waterRipple {
      0% { 
        transform: scale(1) translateY(0);
        opacity: 0;
      }
      20% { 
        transform: scale(1.05) translateY(-2px);
        opacity: 1;
      }
      40% { 
        transform: scale(0.98) translateY(1px);
      }
      60% { 
        transform: scale(1.02) translateY(-1px);
      }
      80% { 
        transform: scale(0.99) translateY(0.5px);
      }
      100% { 
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}

/**
 * Fallback Animation - Simple fade in
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

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
    element.style.cssText = originalStyle;
  };
}
// src/js/ui/startButton.js

let startButtonOverlay = null;
let startButtonElement = null;

/**
 * Creates and shows the start button overlay
 * @param {Function} onStartCallback - Function to call when start button is clicked
 * @returns {Promise} - Resolves when button is shown
 */
function showStartButton(onStartCallback) {
  return new Promise((resolve) => {
    // Create overlay if it doesn't exist
    if (!startButtonOverlay) {
      startButtonOverlay = document.createElement('div');
      startButtonOverlay.className = 'start-button-overlay';
      
      startButtonElement = document.createElement('button');
      startButtonElement.textContent = 'Start Popping!';
      startButtonElement.innerHTML = '🎯 Start Popping!';
      
      startButtonOverlay.appendChild(startButtonElement);
      
      // Find game container and append overlay
      const gameContainer = document.querySelector('.game-container');
      if (gameContainer) {
        gameContainer.appendChild(startButtonOverlay);
      }
    }
    
    // Set up click handler
    startButtonElement.onclick = () => {
      hideStartButton().then(() => {
        if (onStartCallback) {
          onStartCallback();
        }
      });
    };
    
    // Small delay before showing to ensure canvas animation is visible
    setTimeout(() => {
      startButtonOverlay.classList.add('show');
      resolve();
    }, 300);
  });
}

/**
 * Hides the start button overlay
 * @returns {Promise} - Resolves when button is hidden
 */
function hideStartButton() {
  return new Promise((resolve) => {
    if (startButtonOverlay) {
      startButtonOverlay.classList.remove('show');
      
      setTimeout(() => {
        resolve();
      }, 400); // Match CSS transition duration
    } else {
      resolve();
    }
  });
}

/**
 * Removes the start button overlay from DOM
 */
function removeStartButton() {
  if (startButtonOverlay && startButtonOverlay.parentElement) {
    startButtonOverlay.parentElement.removeChild(startButtonOverlay);
    startButtonOverlay = null;
    startButtonElement = null;
  }
}

export { showStartButton, hideStartButton, removeStartButton };
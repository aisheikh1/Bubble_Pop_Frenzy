// Toggle flag: set to true to disable urgent messages, false to enable them
const DISABLE_URGENT_MESSAGE = true;

/**
 * Displays a temporary, urgent message over the game canvas.
 * @param {string} message - The message to display.
 * @param {number} duration - How long the message should be visible in milliseconds.
 */
function showUrgentMessage(message, duration = 1500) {
  // If messages are disabled, do nothing
  if (DISABLE_URGENT_MESSAGE) return;

  const gameContainer = document.querySelector('.game-container'); // Moved from main script block

  const urgentMsgDiv = document.createElement('div');
  urgentMsgDiv.className = 'urgent-message';
  urgentMsgDiv.textContent = message;
  gameContainer.appendChild(urgentMsgDiv); // Append to game-container for correct positioning

  // Remove the message after the duration
  setTimeout(() => {
    urgentMsgDiv.remove();
  }, duration);
}

export { showUrgentMessage };

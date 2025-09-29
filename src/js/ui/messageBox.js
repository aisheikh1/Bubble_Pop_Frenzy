// src/js/ui/messageBox.js

const messageBox = document.getElementById("messageBox");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const buttonContainer = document.getElementById("buttonContainer");

/**
 * Displays a customizable message box.
 * @param {string} title - The title of the message.
 * @param {string} text - The main text content.
 * @param {Array} buttons - Array of button objects {label: string, action: Function}.
 *                          Example: [{label: "OK", action: () => console.log("clicked")}]
 */
function showMessageBox(title, text, buttons = []) {
  messageTitle.innerHTML = title;
  messageText.textContent = text;

  // Clear any existing buttons
  buttonContainer.innerHTML = '';

  // Helper function to create a button
  const createButton = (label, action, index) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    
    // Add optional classes based on button position for styling
    if (index === 1) {
      btn.className = 'secondary';
    } else if (index === 2) {
      btn.className = 'tertiary';
    }
    
    btn.onclick = action;
    return btn;
  };

  // Create and append all buttons from the array
  buttons.forEach((button, index) => {
    if (button && button.label && button.action) {
      buttonContainer.appendChild(createButton(button.label, button.action, index));
    } else {
      console.warn('Invalid button object at index', index, button);
    }
  });

  // Show the message box
  messageBox.classList.add("show");
}

/**
 * Hides the message box.
 */
function hideMessageBox() {
  messageBox.classList.remove("show");
}

export { showMessageBox, hideMessageBox };
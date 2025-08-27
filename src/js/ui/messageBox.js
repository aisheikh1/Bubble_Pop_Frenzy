/**
 * Displays a customizable message box.
 * @param {string} title - The title of the message.
 * @param {string} text - The main text content.
 * @param {Object} primaryButton - Object {label: string, action: Function}.
 * @param {Object} [secondaryButton=null] - Optional secondary button {label: string, action: Function}.
 * @param {Object} [tertiaryButton=null] - Optional tertiary button {label: string, action: Function}.
 */
// These constants will need to be defined/imported where this module is used,
// or passed as arguments, or selected directly within the module.
// For now, we'll include their selection here assuming the HTML elements exist
// in the document where this script runs.
const messageBox = document.getElementById("messageBox");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const buttonContainer = document.getElementById("buttonContainer");


function showMessageBox(title, text, primaryButton, secondaryButton = null, tertiaryButton = null) {
  messageTitle.innerHTML = title;
  messageText.textContent = text;

  // Clear any existing buttons
  buttonContainer.innerHTML = '';

  // Helper function to create a button
  const createButton = (label, action, className = '') => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (className) {
      btn.className = className;
    }
    btn.onclick = action; // Assign the provided action directly
    return btn;
  };

  // Create and append primary button
  buttonContainer.appendChild(createButton(primaryButton.label, primaryButton.action));

  // Create and append secondary button if provided
  if (secondaryButton) {
    buttonContainer.appendChild(createButton(secondaryButton.label, secondaryButton.action, "secondary"));
  }

  // Create and append tertiary button if provided
  if (tertiaryButton) {
    buttonContainer.appendChild(createButton(tertiaryButton.label, tertiaryButton.action, "tertiary"));
  }

  messageBox.classList.add("show");
}

/**
 * Hides the message box.
 */
function hideMessageBox() {
  messageBox.classList.remove("show");
}

export { showMessageBox, hideMessageBox };
// src/js/ui/BackButton.js
export class BackButton {
  /**
   * @param {HTMLElement} belowCanvas  The .below-canvas element (shared container)
   */
  constructor(belowCanvas) {
    this.belowCanvas = belowCanvas;

    // Create the button itself
    this.button = document.createElement('button');
    this.button.className = 'back-btn hidden';
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8l-4 4 4 4" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    this.button.setAttribute('aria-label', 'Back to menu');

    // Append to the below-canvas container
    this.belowCanvas.appendChild(this.button);

    // Default no-op
    this._handler = () => {};
    
    // Handle button clicks
    this.button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._handler();
    });
    
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this._handler();
    });
  }

  /**
   * Set click handler
   * @param {Function} handler
   */
  onClick(handler) {
    this._handler = typeof handler === 'function' ? handler : () => {};
  }

  /**
   * Show the button
   */
  show() {
    this.button.classList.remove('hidden');
  }

  /**
   * Hide the button
   */
  hide() {
    this.button.classList.add('hidden');
  }
}
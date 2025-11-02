// src/js/ui/PauseButton.js
export class PauseButton {
  /**
   * @param {HTMLElement} belowCanvas  The .below-canvas element (shared container)
   */
  constructor(belowCanvas) {
    this.belowCanvas = belowCanvas;
    this.isPaused = false;

    // Create the button itself
    this.button = document.createElement('button');
    this.button.className = 'pause-btn hidden';
    
    // Set initial pause icon
    this._updateIcon();

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
   * Update the button icon based on pause state
   * @private
   */
  _updateIcon() {
    if (this.isPaused) {
      // Show play icon when paused
      this.button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
      `;
      this.button.setAttribute('aria-label', 'Resume game');
    } else {
      // Show pause icon when playing
      this.button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
          <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
        </svg>
      `;
      this.button.setAttribute('aria-label', 'Pause game');
    }
  }

  /**
   * Toggle pause state and update icon
   */
  toggle() {
    this.isPaused = !this.isPaused;
    this._updateIcon();
  }

  /**
   * Set pause state explicitly
   * @param {boolean} paused
   */
  setPaused(paused) {
    this.isPaused = paused;
    this._updateIcon();
  }

  /**
   * Get current pause state
   * @returns {boolean}
   */
  getPaused() {
    return this.isPaused;
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

  /**
   * Reset button to initial state
   */
  reset() {
    this.isPaused = false;
    this._updateIcon();
  }
}
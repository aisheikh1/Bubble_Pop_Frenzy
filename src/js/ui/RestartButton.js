// src/js/ui/RestartButton.js
export class RestartButton {
  /**
   * @param {HTMLElement} belowCanvas  The .below-canvas element (shared with BackButton)
   */
  constructor(belowCanvas) {
    this.belowCanvas = belowCanvas;

    // Create the button itself
    this.button = document.createElement('button');
    this.button.className = 'restart-btn hidden';
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.77 1.03 6.4 2.7" 
              fill="none" stroke="currentColor" stroke-width="2" 
              stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 3v6h-6" fill="none" stroke="currentColor" 
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Append to the below-canvas container
    this.belowCanvas.appendChild(this.button);

    // Default no-op
    this._handler = () => {};
    this.button.addEventListener('pointerdown', () => this._handler());
    this.button.addEventListener('click', () => this._handler()); // fallback
  }

  onClick(handler) {
    this._handler = typeof handler === 'function' ? handler : () => {};
  }

  show() { this.button.classList.remove('hidden'); }
  hide() { this.button.classList.add('hidden'); }
}
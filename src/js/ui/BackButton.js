// src/js/ui/BackButton.js
export class BackButton {
  /**
   * @param {HTMLElement} gameContainer  The .game-container element
   * @param {HTMLCanvasElement} canvasEl  The game canvas element
   */
  constructor(gameContainer, canvasEl) {
    this.container = gameContainer;
    this.canvas = canvasEl;

    // Create the flexible "below-canvas" area
    this.below = document.createElement('div');
    this.below.className = 'below-canvas';

    // Create the button itself
    this.button = document.createElement('button');
    this.button.className = 'back-btn hidden';
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8l-4 4 4 4" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Insert after the canvas (so it is "under" the canvas)
    this.container.insertBefore(this.below, this.canvas.nextSibling);
    this.below.appendChild(this.button);

    // Default no-op
    this._handler = () => {};
    this.button.addEventListener('pointerdown', () => this._handler()),
    this.button.addEventListener('click', () => this._handler()); //fallback

  }

  onClick(handler) {
    this._handler = typeof handler === 'function' ? handler : () => {};
  }

  show()  { this.button.classList.remove('hidden'); }
  hide()  { this.button.classList.add('hidden');  }
}
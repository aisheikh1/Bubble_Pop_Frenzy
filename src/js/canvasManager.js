// src/js/CanvasManager.js
export class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas with id '${canvasId}' not found`);
    }
    
    this.ctx = this.canvas.getContext("2d");
    this.isVisible = false;
    this.isGameActive = false;
    
    // Set up resize handling
    this.setupResizeHandler();
    
    // Initial resize
    this.resize();
    
    // Initialize as hidden
    this.hide();
  }
  
  show() {
    this.canvas.style.display = 'block';
    this.isVisible = true;
  }
  
  /**
   * Show canvas with smooth animation
   * @returns {Promise} - Resolves when animation is complete
   */
  showWithAnimation() {
    return new Promise((resolve) => {
      // First make it visible but still invisible (opacity 0)
      this.canvas.style.display = 'block';
      this.isVisible = true;
      
      // Small delay to ensure display:block is applied before animation
      setTimeout(() => {
        this.canvas.classList.add('canvas-appearing');
        
        // Wait for animation to complete
        setTimeout(() => {
          resolve();
        }, 600); // Match CSS transition duration
      }, 50);
    });
  }
  
  hide() {
    this.canvas.classList.remove('canvas-appearing');
    this.canvas.style.display = 'none';
    this.isVisible = false;
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    // Canvas width should be 95% of container width
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    this.canvas.width = containerWidth * 0.95;
    // Canvas height should be 70% of container height
    this.canvas.height = containerHeight * 0.70;
  }
  
  setupResizeHandler() {
    window.addEventListener("resize", () => this.resize());
  }
  
  setupPointerHandler(handler) {
    // Remove existing listeners to prevent duplicates
    this.canvas.removeEventListener("pointerdown", this.boundHandler);
    
    // Create new bound handler
    this.boundHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handler(x, y);
    };
    
    this.canvas.addEventListener("pointerdown", this.boundHandler);
  }
  
  setGameActive(active) {
    this.isGameActive = active;
  }
  
  // Getters for compatibility with existing code
  get element() {
    return this.canvas;
  }
  
  get context() {
    return this.ctx;
  }
  
  get width() {
    return this.canvas.width;
  }
  
  get height() {
    return this.canvas.height;
  }
  
  // Cleanup method
  destroy() {
    window.removeEventListener("resize", () => this.resize());
    if (this.boundHandler) {
      this.canvas.removeEventListener("pointerdown", this.boundHandler);
    }
  }
}
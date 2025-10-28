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
    
    // Set background color (default white)
    this.backgroundColor = '#FFFFFF';
    
    // Set up resize handling
    this.setupResizeHandler();
    
    // Initial resize
    this.resize();
    
    // Initialize as hidden
    this.hide();
    
    console.log('[CanvasManager] Initialized:', {
      width: this.canvas.width,
      height: this.canvas.height,
      backgroundColor: this.backgroundColor
    });
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
  
  /**
   * Clear canvas and fill with background color
   * CRITICAL: This must be called BEFORE drawing each frame
   */
  clear() {
    // Clear all pixels
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill with white background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Reset any transforms that might affect drawing
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  
  /**
   * Set background color for canvas clearing
   * @param {string} color - CSS color string (e.g., '#FFFFFF', 'white', 'rgb(255,255,255)')
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
    console.log('[CanvasManager] Background color set to:', color);
  }
  
  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    // Canvas width should be 90% of container width
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    this.canvas.width = containerWidth * 0.90;
    // Canvas height should be 55% of container height
    this.canvas.height = containerHeight * 0.55;
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
  
  /**
   * Debug: Draw a test pattern to verify canvas is working
   */
  debugTest() {
    console.log('[CanvasManager] Running debug test...');
    
    // Clear canvas
    this.clear();
    
    // Draw test pattern
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(10, 10, 50, 50);
    
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(70, 10, 50, 50);
    
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillRect(130, 10, 50, 50);
    
    console.log('[CanvasManager] Debug test complete. You should see 3 colored squares.');
  }
  
  // Cleanup method
  destroy() {
    window.removeEventListener("resize", () => this.resize());
    if (this.boundHandler) {
      this.canvas.removeEventListener("pointerdown", this.boundHandler);
    }
  }
}

// Add window debug helper
if (typeof window !== 'undefined') {
  window.debugCanvas = {
    test: () => {
      const canvas = document.getElementById('gameCanvas');
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }
      
      const ctx = canvas.getContext('2d');
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw test
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(50, 50, 100, 100);
      
      console.log('Canvas test drawn. You should see a green square.');
    },
    
    checkColor: () => {
      const canvas = document.getElementById('gameCanvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, 1, 1);
      console.log('Top-left pixel RGBA:', imageData.data);
      console.log('Is white?', imageData.data[0] === 255 && imageData.data[1] === 255 && imageData.data[2] === 255);
    },
    
    forceWhite: () => {
      const canvas = document.getElementById('gameCanvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('Canvas forced to white');
    }
  };
  
  console.log('[CanvasManager] Debug helpers available:');
  console.log('  window.debugCanvas.test() - Draw test pattern');
  console.log('  window.debugCanvas.checkColor() - Check pixel color');
  console.log('  window.debugCanvas.forceWhite() - Force white canvas');
}
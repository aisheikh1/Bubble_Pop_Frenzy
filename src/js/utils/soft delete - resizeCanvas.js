/**
 * Resizes the canvas to fit the container while maintaining aspect ratio and max width.
 * @param {HTMLCanvasElement} canvas The canvas element to resize.
 */
function resizeCanvas(canvas) { // Accept canvas as an argument
  const container = canvas.parentElement;
  // Canvas width should be up to 95% of container, but no more than 500px, responsive
  canvas.width = Math.min(container.clientWidth * 0.95, 500);
  // Maintain aspect ratio, height is 80% of width for better mobile optimization
  canvas.height = canvas.width * 0.8;
}

export { resizeCanvas };

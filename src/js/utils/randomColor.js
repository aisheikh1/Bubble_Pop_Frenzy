// src/utils/randomColor.js

/**
 * Gets a random bright neon color from a predefined list.
 * These colors are highly visible, vibrant, and perfect for a dynamic bubble popping game.
 * @returns {string} A hex color string.
 */
function getRandomColor() {
  const colors = [
    '#FF0080', // Electric Pink/Magenta
    '#00FFFF', // Cyan/Aqua
    '#FF00FF', // Magenta/Fuchsia
    '#00FF00', // Lime Green
    '#FFFF00', // Yellow
    '#FF6600', // Neon Orange
    '#00FF80', // Spring Green
    '#FF0040', // Neon Red
    '#8000FF', // Electric Purple
    '#00D9FF', // Bright Sky Blue
    '#FF69B4', // Hot Pink
    '#39FF14', // Neon Green
    '#FE019A', // Bright Magenta
    '#FFD300', // Cyber Yellow
    '#00FFC8', // Bright Turquoise
    '#FF3864', // Radical Red
    '#BCFF00', // Electric Lime
    '#FF10F0'  // Psychedelic Purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export { getRandomColor };
/**
 * Gets a random color from a predefined list.
 * @returns {string} A hex color string.
 */
function getRandomColor() {
  const colors = ['#FF69B4', '#FFB6C1', '#FFD700', '#87CEFA', '#98FB98', '#FFA07A'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export { getRandomColor };
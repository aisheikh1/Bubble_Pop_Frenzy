// src/js/main.js

import { startGame, handleCanvasPointerDown, updateUI, goToMainMenu, restartGame, togglePause } from './game.js';
import { showMessageBox, hideMessageBox } from './ui/messageBox.js';
import { CanvasManager } from './canvasManager.js';
import { initializeAnimatedTitle, preloadTitleAnimations } from './gametitlemanagement/index.js';
import { BackButton } from './ui/BackButton.js';
import { RestartButton } from './ui/RestartButton.js';
import { PauseButton } from './ui/PauseButton.js';

// SCORING: point to your actual folder
import { scoringService } from './ScoringEngine/index.js';

// DOM elements (filled on load)
export let scoreDisplay;
export let modeDisplay;
export let classicTimerDisplay;
export let survivalStatsDisplay;
export let survivalTimeElapsedDisplay;
export let survivalMissesDisplay;
export let messageBox;
export let messageTitle;
export let messageText;
export let buttonContainer;
export let gameInfo;
export let gameContainer;
export let gameTitleElement;

export let canvasManager;

let titleCleanupFunction = null;

function initializeGameTitle() {
  try {
    gameTitleElement = document.querySelector('.game-title');

    if (!gameTitleElement) {
      const gameHeader = document.createElement('div');
      gameHeader.className = 'game-header';
      gameHeader.innerHTML = (
        '<h1 class="game-title">Bubble Pop Frenzy!</h1>' +
        '<div class="game-subtitle">Pop bubbles, score points, have fun!</div>'
      );
      const container = document.querySelector('.game-container');
      if (container) {
        container.insertBefore(gameHeader, container.firstChild);
        gameTitleElement = gameHeader.querySelector('.game-title');
      }
    }

    if (gameTitleElement) {
      titleCleanupFunction = initializeAnimatedTitle(gameTitleElement, {
        fallbackOnError: true,
        respectReducedMotion: true
      });
    }
  } catch (err) {
    console.warn('Failed to initialize animated title:', err);
  }
}

function cleanupGameTitle() {
  if (titleCleanupFunction && typeof titleCleanupFunction === 'function') {
    titleCleanupFunction();
    titleCleanupFunction = null;
  }
}

async function showMainMenu(gameConfig) {
  showMessageBox(
    'Bubble Pop Frenzy!',
    'Select a game mode to begin.',
    [
      { label: 'Classic Mode', action: async () => { await hideMessageBox(); startGame(gameConfig, 'classic'); } },
      { label: 'Survival Mode', action: async () => { await hideMessageBox(); startGame(gameConfig, 'survival'); } }
    ]
  );
}

// Safe DOM build of the Points Legend (no template literals with user content)
function buildPointsLegend(parentEl) {
  try {
    const pv = scoringService.getPointValues();

    const legend = document.createElement('div');
    legend.id = 'pointsLegend';
    legend.setAttribute('aria-live', 'polite');
    legend.style.marginLeft = '1rem';
    legend.style.fontSize = '0.9rem';
    legend.style.opacity = '0.9';

    const strong = document.createElement('strong');
    strong.textContent = 'Points:';
    legend.appendChild(strong);

    const items = [
      ['Normal', pv.NORMAL],
      ['Double', pv.DOUBLE],
      ['Decoy', pv.DECOY],
      ['Freeze', pv.FREEZE],
      ['Bomb', pv.BOMB]
    ];

    for (let i = 0; i < items.length; i++) {
      const span = document.createElement('span');
      span.style.marginLeft = '.5rem';
      const name = String(items[i][0]);
      const val = Number(items[i][1] || 0);
      const sign = val > 0 ? '+' : '';
      span.textContent = name + ' ' + sign + String(val);
      legend.appendChild(span);
    }

    parentEl.appendChild(legend);
  } catch (e) {
    console.warn('Could not create points legend:', e);
  }
}

window.addEventListener('load', () => {
  preloadTitleAnimations();

  canvasManager = new CanvasManager('gameCanvas');

  scoreDisplay = document.getElementById('scoreDisplay');
  modeDisplay = document.getElementById('modeDisplay');
  classicTimerDisplay = document.getElementById('classicTimerDisplay');
  survivalStatsDisplay = document.getElementById('survivalStatsDisplay');
  survivalTimeElapsedDisplay = document.getElementById('survivalTimeElapsedDisplay');
  survivalMissesDisplay = document.getElementById('survivalMissesDisplay');
  messageBox = document.getElementById('messageBox');
  messageTitle = document.getElementById('messageTitle');
  messageText = document.getElementById('messageText');
  buttonContainer = document.getElementById('buttonContainer');
  gameInfo = document.getElementById('gameInfo');
  gameContainer = document.querySelector('.game-container');

  const backButton = new BackButton(gameContainer, canvasManager.element);
  backButton.onClick(() => goToMainMenu());

  const belowCanvas = document.querySelector('.below-canvas');

  const pauseButton = new PauseButton(belowCanvas);
  pauseButton.onClick(() => togglePause());

  const restartButton = new RestartButton(belowCanvas);
  restartButton.onClick(() => restartGame());

  initializeGameTitle();

  const gameConfig = {
    canvasManager,
    canvas: canvasManager.element,
    ctx: canvasManager.context,
    scoreDisplay,
    modeDisplay,
    classicTimerDisplay,
    survivalStatsDisplay,
    survivalTimeElapsedDisplay,
    survivalMissesDisplay,
    gameInfo,
    backButton,
    pauseButton,
    restartButton
  };

  if (gameInfo) {
    buildPointsLegend(gameInfo);
  }

  showMainMenu(gameConfig);

  canvasManager.element.addEventListener('pointerdown', (e) => {
    const rect = canvasManager.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasPointerDown(x, y);
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
});

export { cleanupGameTitle };

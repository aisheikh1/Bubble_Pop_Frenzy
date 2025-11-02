## Bubble Pop Frenzy - AI Agent Instructions

This document provides instructions for AI coding agents to effectively contribute to the Bubble Pop Frenzy codebase.

### Big Picture Architecture

The game is a vanilla JavaScript application built with Vite. The architecture is modular, centered around a main game orchestrator (`src/js/game.js`) that manages different game modes.

- **Entry Point**: `src/js/main.js` initializes the application, sets up the main menu, and loads the initial configuration.
- **Game Orchestrator**: `src/js/game.js` is the core of the game. It manages the game state, switches between game modes (Classic, Survival, Colour Rush), and provides shared utilities for UI, effects, and game controls.
- **Game Modes**: Each game mode is a class in its own file (e.g., `src/js/ClassicMode.js`). These classes encapsulate the logic and rules for their specific mode. They are registered with and managed by the `game.js` orchestrator.
- **Canvas Management**: `src/js/canvasManager.js` handles all interactions with the HTML5 canvas, including rendering, resizing, and user input.
- **Bubbles**: `src/js/bubbles.js` defines the `Bubble` class, bubble spawning logic, collision detection, and other bubble-related behaviors.
- **Scoring**: The `src/js/ScoringEngine/` directory contains the scoring logic. `ScoreCalculator.js` and `ScoreConfig.js` are the key files.
- **UI Components**: Reusable UI components like buttons and message boxes are located in `src/js/ui/`.
- **Visual Effects**: The `src/js/effects/` directory contains classes for visual effects like bubble pops and floating text.

### Developer Workflows

**Running the Game:**
- To start the development server, run: `npm run dev`
- To build the game for production, run: `npm run build`
- To preview the production build, run: `npm run preview`

**Testing:**
The project uses Puppeteer for end-to-end testing. The test files are in the `tests/` directory. To run the tests, you will need to execute the test scripts with Node.js. For example:
`node tests/puppeteer-test-tc101.js`

### Project-Specific Conventions

- **Modularity**: The codebase is highly modular. When adding new features, try to follow the existing modular structure. For example, a new game mode should be a new class in its own file.
- **Game Mode Registration**: New game modes must be registered in `src/js/game.js` in the `MODE_REGISTRY` and initialized in the `initializeModes` function.
- **Shared Utilities**: `src/js/game.js` exports a set of shared utilities (e.g., `spawnPointsText`, `setBackButtonVisible`). Use these utilities when possible to maintain consistency.
- **Configuration-Driven**: Game parameters like bubble spawn rates and scoring are defined in configuration files (e.g., `src/js/BubbleSpawnConfig.js`, `src/js/ScoringEngine/ScoreConfig.js`). When balancing the game, these are the files you should modify.
- **State Management**: The main game state is managed by `game.js` and the active game mode. Avoid creating global state variables.

### Key Files and Directories

- `src/js/main.js`: Application entry point.
- `src/js/game.js`: The central game orchestrator.
- `src/js/canvasManager.js`: Manages the HTML5 canvas.
- `src/js/bubbles.js`: Defines the `Bubble` class and related logic.
- `src/js/ClassicMode.js`, `src/js/SurvivalMode.js`, `src/js/ColourRushMode.js`: Game mode implementations.
- `src/js/ScoringEngine/`: Scoring logic.
- `src/js/ui/`: UI components.
- `src/js/effects/`: Visual effects.
- `vite.config.js`: Vite configuration.
- `package.json`: Project dependencies and scripts.
- `tests/`: End-to-end tests.

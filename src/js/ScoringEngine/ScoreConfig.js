// src/js/scoring/ScoreConfig.js

/**
 * Configuration for scoring system - all point values and settings
 */
export const ScoreConfig = {
    // Base points for each bubble type
    BASE_POINTS: {
        NORMAL: 10,
        DOUBLE: 25,
        DECOY: -30,
        FREEZE: 50,
        BOMB: 75
    },
    
    // Bubble type identifiers (must match game.js usage)
    BUBBLE_TYPES: {
        NORMAL: 'normal',
        DOUBLE: 'double', 
        DECOY: 'decoy',
        FREEZE: 'freeze',
        BOMB: 'bomb'
    },
    
    // Initial game state values
    INITIAL_STATE: {
        totalScore: 0,
        totalBubblesPopped: 0,
        bubblesByType: {
            normal: 0,
            double: 0,
            decoy: 0,
            freeze: 0,
            bomb: 0
        }
    }
};

export default ScoreConfig;
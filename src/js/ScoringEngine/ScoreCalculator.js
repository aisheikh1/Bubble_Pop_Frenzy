// src/js/scoring/ScoreCalculator.js

import { ScoreConfig } from './ScoreConfig.js';

/**
 * Core scoring calculation engine - pure functions only
 */
export class ScoreCalculator {
    
    /**
     * Calculate score for popping a specific bubble type
     * @param {string} bubbleType - Type of bubble popped
     * @param {number} currentScore - Current total score
     * @returns {number} Points to add (can be negative for penalties)
     */
    static calculateBubbleScore(bubbleType) {
        const pointsConfig = ScoreConfig.BASE_POINTS;
        
        switch (bubbleType) {
            case ScoreConfig.BUBBLE_TYPES.NORMAL:
                return pointsConfig.NORMAL;
                
            case ScoreConfig.BUBBLE_TYPES.DOUBLE:
                return pointsConfig.DOUBLE;
                
            case ScoreConfig.BUBBLE_TYPES.DECOY:
                return pointsConfig.DECOY;
                
            case ScoreConfig.BUBBLE_TYPES.FREEZE:
                return pointsConfig.FREEZE;
                
            case ScoreConfig.BUBBLE_TYPES.BOMB:
                return pointsConfig.BOMB;
                
            default:
                console.warn(`Unknown bubble type: ${bubbleType}, using normal points`);
                return pointsConfig.NORMAL;
        }
    }
    
    /**
     * Calculate new total score after popping a bubble
     * @param {string} bubbleType - Type of bubble popped
     * @param {number} currentScore - Current total score
     * @returns {number} New total score
     */
    static calculateNewTotalScore(bubbleType, currentScore) {
        const points = this.calculateBubbleScore(bubbleType);
        return Math.max(0, currentScore + points); // Prevent negative total score
    }
    
    /**
     * Validate bubble type against known types
     * @param {string} bubbleType - Type to validate
     * @returns {boolean} True if valid bubble type
     */
    static isValidBubbleType(bubbleType) {
        return Object.values(ScoreConfig.BUBBLE_TYPES).includes(bubbleType);
    }
    
    /**
     * Get point value for a bubble type (for display purposes)
     * @param {string} bubbleType - Bubble type to check
     * @returns {number} Point value
     */
    static getPointValue(bubbleType) {
        return this.calculateBubbleScore(bubbleType);
    }
}

/**
 * Main Scoring Service that tracks game state
 */
export class ScoringService {
    constructor() {
        this.reset();
    }
    
    /**
     * Reset all scoring statistics to initial state
     */
    reset() {
        this.totalScore = ScoreConfig.INITIAL_STATE.totalScore;
        this.totalBubblesPopped = ScoreConfig.INITIAL_STATE.totalBubblesPopped;
        this.bubblesByType = { ...ScoreConfig.INITIAL_STATE.bubblesByType };
    }
    
    /**
     * Handle a bubble pop event and update scoring statistics
     * @param {string} bubbleType - Type of bubble popped
     * @returns {Object} Score update result
     */
    handleBubblePop(bubbleType) {
        if (!ScoreCalculator.isValidBubbleType(bubbleType)) {
            console.error(`Invalid bubble type: ${bubbleType}`);
            return this.getCurrentStats();
        }
        
        // Calculate points for this pop
        const pointsEarned = ScoreCalculator.calculateBubbleScore(bubbleType);
        
        // Update statistics
        this.totalScore = ScoreCalculator.calculateNewTotalScore(bubbleType, this.totalScore);
        this.totalBubblesPopped++;
        this.bubblesByType[bubbleType]++;
        
        // Return comprehensive result
        return {
            pointsEarned,
            newTotalScore: this.totalScore,
            bubbleType: bubbleType,
            totalBubblesPopped: this.totalBubblesPopped,
            bubblesByType: { ...this.bubblesByType },
            timestamp: Date.now()
        };
    }
    
    /**
     * Get current scoring statistics
     * @returns {Object} Current game statistics
     */
    getCurrentStats() {
        return {
            totalScore: this.totalScore,
            totalBubblesPopped: this.totalBubblesPopped,
            bubblesByType: { ...this.bubblesByType },
            
            // Derived statistics
            normalBubbles: this.bubblesByType.normal,
            doubleBubbles: this.bubblesByType.double,
            decoyBubbles: this.bubblesByType.decoy,
            freezeBubbles: this.bubblesByType.freeze,
            bombBubbles: this.bubblesByType.bomb,
            
            // Percentage calculations
            normalPercentage: this._calculatePercentage('normal'),
            doublePercentage: this._calculatePercentage('double'),
            decoyPercentage: this._calculatePercentage('decoy')
        };
    }
    
    /**
     * Calculate percentage of specific bubble type from total pops
     * @param {string} bubbleType - Type to calculate percentage for
     * @returns {number} Percentage (0-100)
     */
    _calculatePercentage(bubbleType) {
        if (this.totalBubblesPopped === 0) return 0;
        return Math.round((this.bubblesByType[bubbleType] / this.totalBubblesPopped) * 100);
    }
    
    /**
     * Get point values configuration (for UI display)
     * @returns {Object} Point values for all bubble types
     */
    getPointValues() {
        return { ...ScoreConfig.BASE_POINTS };
    }
    
    /**
     * Get available bubble types (for validation/UI)
     * @returns {Array} List of valid bubble types
     */
    getBubbleTypes() {
        return Object.values(ScoreConfig.BUBBLE_TYPES);
    }
}

// Create and export a default instance for easy importing
export const scoringService = new ScoringService();
export default scoringService;
// src/js/deviceManager.js

/**
 * DeviceManager - Handles device detection and screen information
 * Provides adaptive scaling information for UI and canvas elements
 */

// Private device information object
let deviceInfo = {
  deviceType: 'desktop',
  screenWidth: 0,
  screenHeight: 0,
  devicePixelRatio: 1,
  orientation: 'landscape',
  isTouchDevice: false,
  // Additional useful properties
  isRetina: false,
  viewportScale: 1,
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
};

// Resize callback listeners
let resizeCallbacks = [];

/**
 * Detects if the device is mobile based on multiple criteria
 * @returns {boolean} True if mobile device
 */
function isMobileDevice() {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check touch support
  const hasTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   navigator.msMaxTouchPoints > 0;
  
  // Check screen size (under 768px is typically mobile)
  const isSmallScreen = window.innerWidth < 768;
  
  // Check for mobile-specific APIs
  const hasMobileAPIs = 'orientation' in window || 'orientation' in screen;
  
  // Return true if user agent matches OR (has touch AND small screen) OR has mobile APIs
  return mobileRegex.test(userAgent) || (hasTouch && isSmallScreen) || hasMobileAPIs;
}

/**
 * Detects the current orientation
 * @returns {string} 'portrait' or 'landscape'
 */
function getOrientation() {
  // Try screen.orientation API first (most reliable)
  if (screen.orientation && screen.orientation.type) {
    return screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
  }
  
  // Fallback to window dimensions
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Detects safe area insets for devices with notches/rounded corners
 * @returns {object} Inset values in pixels
 */
function getSafeAreaInsets() {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  
  // Try to get CSS environment variables (for iOS notch, etc.)
  if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    const computed = getComputedStyle(document.documentElement);
    
    insets.top = parseInt(computed.getPropertyValue('env(safe-area-inset-top)')) || 0;
    insets.right = parseInt(computed.getPropertyValue('env(safe-area-inset-right)')) || 0;
    insets.bottom = parseInt(computed.getPropertyValue('env(safe-area-inset-bottom)')) || 0;
    insets.left = parseInt(computed.getPropertyValue('env(safe-area-inset-left)')) || 0;
  }
  
  return insets;
}

/**
 * Calculates an optimal viewport scale factor based on device characteristics
 * @returns {number} Scale factor (typically 0.8 - 1.2)
 */
function calculateViewportScale() {
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  
  // Base scale on screen width
  let scale = 1;
  
  if (width < 375) {
    // Very small phones
    scale = 0.85;
  } else if (width < 414) {
    // Standard phones
    scale = 0.9;
  } else if (width < 768) {
    // Large phones / small tablets
    scale = 0.95;
  } else if (width >= 1920) {
    // Large desktop screens
    scale = 1.1;
  }
  
  // Adjust for high DPI displays
  if (dpr > 2) {
    scale *= 1.05; // Slightly larger on retina displays
  }
  
  return scale;
}

/**
 * Updates the device information object
 */
function updateDeviceInfo() {
  deviceInfo.deviceType = isMobileDevice() ? 'mobile' : 'desktop';
  deviceInfo.screenWidth = window.innerWidth;
  deviceInfo.screenHeight = window.innerHeight;
  deviceInfo.devicePixelRatio = window.devicePixelRatio || 1;
  deviceInfo.orientation = getOrientation();
  deviceInfo.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  deviceInfo.isRetina = deviceInfo.devicePixelRatio >= 2;
  deviceInfo.viewportScale = calculateViewportScale();
  deviceInfo.safeAreaInsets = getSafeAreaInsets();
  
  // Add some useful computed properties
  deviceInfo.isPortrait = deviceInfo.orientation === 'portrait';
  deviceInfo.isLandscape = deviceInfo.orientation === 'landscape';
  deviceInfo.isMobile = deviceInfo.deviceType === 'mobile';
  deviceInfo.isDesktop = deviceInfo.deviceType === 'desktop';
}

/**
 * Handles window resize events
 */
function handleResize() {
  const oldOrientation = deviceInfo.orientation;
  const oldWidth = deviceInfo.screenWidth;
  
  updateDeviceInfo();
  
  // Detect orientation change
  const orientationChanged = oldOrientation !== deviceInfo.orientation;
  const significantResize = Math.abs(oldWidth - deviceInfo.screenWidth) > 50;
  
  // Call all registered callbacks
  resizeCallbacks.forEach(callback => {
    try {
      callback(deviceInfo, { orientationChanged, significantResize });
    } catch (error) {
      console.error('Error in resize callback:', error);
    }
  });
}

/**
 * Initializes the device manager and performs initial detection
 * Should be called early in application lifecycle
 * @returns {object} Initial device information
 */
export function initializeDevice() {
  // Perform initial detection
  updateDeviceInfo();
  
  // Set up resize listener with debouncing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
  });
  
  // Set up orientation change listener (for mobile)
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', handleResize);
  } else {
    // Fallback for older browsers
    window.addEventListener('orientationchange', handleResize);
  }
  
  // Log initialization (can be removed in production)
  console.log('🎮 Device Manager Initialized:', {
    type: deviceInfo.deviceType,
    screen: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
    dpr: deviceInfo.devicePixelRatio,
    orientation: deviceInfo.orientation,
    touch: deviceInfo.isTouchDevice
  });
  
  return { ...deviceInfo }; // Return a copy
}

/**
 * Gets the current device information
 * @returns {object} Current device information (copy)
 */
export function getDeviceInfo() {
  return { ...deviceInfo }; // Return a copy to prevent external mutations
}

/**
 * Registers a callback to be called when device info changes (resize/orientation)
 * @param {Function} callback - Function to call with (deviceInfo, changeInfo)
 * @returns {Function} Unsubscribe function
 */
export function onResize(callback) {
  if (typeof callback !== 'function') {
    console.warn('onResize: callback must be a function');
    return () => {};
  }
  
  resizeCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = resizeCallbacks.indexOf(callback);
    if (index > -1) {
      resizeCallbacks.splice(index, 1);
    }
  };
}

/**
 * Gets recommended canvas dimensions based on device
 * @returns {object} { width, height, maxWidth, maxHeight }
 */
export function getRecommendedCanvasDimensions() {
  const { screenWidth, screenHeight, isMobile, orientation, viewportScale } = deviceInfo;
  
  let maxWidth, maxHeight;
  
  if (isMobile) {
    if (orientation === 'portrait') {
      maxWidth = Math.min(screenWidth * 0.95, 500);
      maxHeight = maxWidth * 1; // Square-ish for portrait
    } else {
      // Landscape mobile
      maxWidth = Math.min(screenWidth * 0.6, 600);
      maxHeight = maxWidth * 0.7; // Wider aspect ratio
    }
  } else {
    // Desktop
    maxWidth = Math.min(screenWidth * 0.5, 600);
    maxHeight = maxWidth * 0.8;
  }
  
  // Apply viewport scaling
  maxWidth *= viewportScale;
  maxHeight *= viewportScale;
  
  return {
    width: Math.floor(maxWidth),
    height: Math.floor(maxHeight),
    maxWidth: Math.floor(maxWidth),
    maxHeight: Math.floor(maxHeight),
    aspectRatio: maxWidth / maxHeight
  };
}

/**
 * Gets recommended UI scaling factors
 * @returns {object} Scale factors for various UI elements
 */
export function getUIScaling() {
  const { isMobile, screenWidth, devicePixelRatio, viewportScale } = deviceInfo;
  
  return {
    // Text size multiplier
    text: isMobile ? 0.9 : 1,
    
    // Button size multiplier
    buttons: isMobile ? 1.1 : 1, // Larger touch targets on mobile
    
    // Bubble size multiplier
    bubbles: screenWidth < 375 ? 0.85 : 1,
    
    // UI spacing multiplier
    spacing: viewportScale,
    
    // Font size base (in rem)
    baseFontSize: isMobile ? 14 : 16,
    
    // Touch target minimum size (in px)
    minTouchTarget: isMobile ? 44 : 32,
    
    // Overall viewport scale
    viewport: viewportScale,
    
    // DPI-aware scaling for canvas rendering
    renderScale: Math.min(devicePixelRatio, 2) // Cap at 2x for performance
  };
}

/**
 * Checks if the device prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Gets recommended game settings based on device capabilities
 * @returns {object} Recommended game configuration
 */
export function getRecommendedGameSettings() {
  const { isMobile, devicePixelRatio, screenWidth } = deviceInfo;
  const reducedMotion = prefersReducedMotion();
  
  return {
    // Particle effects density
    particleDensity: isMobile ? 0.6 : 1,
    
    // Animation smoothness
    targetFPS: isMobile ? 30 : 60,
    
    // Enable advanced effects
    advancedEffects: !isMobile && devicePixelRatio >= 2,
    
    // Reduced motion mode
    reducedMotion: reducedMotion,
    
    // Bubble spawn rate modifier
    spawnRateModifier: screenWidth < 375 ? 1.2 : 1, // Slower on small screens
    
    // Touch-specific settings
    hapticFeedback: isMobile && 'vibrate' in navigator
  };
}

// Export the main interface
export default {
  initializeDevice,
  getDeviceInfo,
  onResize,
  getRecommendedCanvasDimensions,
  getUIScaling,
  prefersReducedMotion,
  getRecommendedGameSettings
};
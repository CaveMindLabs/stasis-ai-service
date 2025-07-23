// frontend/src/config/settings.ts

/**
 * Centralized configuration for the Stasis AI frontend application.
 */
export const AppConfig = {
  video: {
    /**
     * The target frame rate for camera capture.
     * High-FPS cameras will be constrained to this value.
     * Note: The browser and hardware will attempt to match this, but it's not guaranteed.
     */
    FRAME_RATE: 60,

    /**
     * The desired resolution for video capture.
     * Using common aspect ratios like 16:9 is recommended.
     */
    RESOLUTION: {
      width: 1280,
      height: 720,
    },
  },
  recording: {
    /**
     * The duration of the pre-trigger circular buffer in milliseconds.
     * This captures action that happens right before the start trigger.
     */
    PRE_TRIGGER_BUFFER_MS: 5000,
  },
  ai: {
    PREDICTION_INTERVAL_MS: 100,
    models: {
      'lite': { name: 'Lite', path: '/models/pose_landmarker_lite.task' },
      'full': { name: 'Full', path: '/models/pose_landmarker_full.task' },
      'heavy': { name: 'Heavy', path: '/models/pose_landmarker_heavy.task' },
    },
    // Add the new configuration value
    POSE_HOLD_DURATION_MS: 500,
  }
};

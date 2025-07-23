// frontend/src/hooks/usePoseDetection.ts
'use client';

import { AppConfig } from '@/config/settings';
import { PoseLandmarker, FilesetResolver, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { useState, useCallback, useRef } from 'react';

type EngineState = "cleared" | "initializing" | "ready" | "error";

export function usePoseDetection(onResults: (results: PoseLandmarkerResult) => void) {
  const [engineState, setEngineState] = useState<EngineState>("cleared");
  // Use a ref to hold the landmarker instance to prevent re-renders from affecting it
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  
  const initialize = useCallback(async (model: 'lite' | 'full' | 'heavy') => {
    setEngineState("initializing");
    try {
      // If a model is already loaded, close it first
      if (landmarkerRef.current) {
        await landmarkerRef.current.close();
        landmarkerRef.current = null;
      }

      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
      
      const newLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: AppConfig.ai.models[model].path,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      landmarkerRef.current = newLandmarker;
      setEngineState("ready");
    } catch (e) {
      console.error("Failed to initialize pose landmarker", e);
      setEngineState("error");
      // Throw a more descriptive error that the UI can catch
      throw new Error(`Failed to initialize model: ${model}`);
    }
  }, []);

  const clearEngine = useCallback(() => {
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
    setEngineState("cleared");
    console.log("Pose engine cleared and resources released.");
  }, []);

  const predict = (video: HTMLVideoElement) => {
    if (!landmarkerRef.current || engineState !== "ready") return;

    const startTimeMs = performance.now();
    const results = landmarkerRef.current.detectForVideo(video, startTimeMs);
    
    if (results) {
        onResults(results);
    }
  };

  return { engineState, predict, initialize, clearEngine };
}

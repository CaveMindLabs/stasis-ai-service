// frontend/src/components/vision/SkeletonOverlay.tsx
'use client';

import { PoseLandmarkerResult, Landmark, PoseLandmarker } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useCallback } from 'react';

// Get the connections for the body parts from MediaPipe's constants. We only need POSE_CONNECTIONS.
const { POSE_CONNECTIONS } = PoseLandmarker;

interface SkeletonOverlayProps {
  poseResult: PoseLandmarkerResult | null;
  videoWidth: number;
  videoHeight: number;
  isFlipped: boolean;
}

// Helper function to draw lines between keypoints. Moved outside the component.
const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: Landmark[], connections: { start: number, end: number }[], options: { color: string, lineWidth: number }) => {
  for (const connection of connections) {
    const start = landmarks[connection.start];
    const end = landmarks[connection.end];
    if (start && end) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = options.color;
      ctx.lineWidth = options.lineWidth;
      ctx.stroke();
    }
  }
};

// Helper function to draw dots for each keypoint. Moved outside the component.
const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: Landmark[], options: { color: string, radius: number }) => {
  for (const landmark of landmarks) {
    if (landmark) {
      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, options.radius, 0, 2 * Math.PI); // Use normalized coordinates
      ctx.fillStyle = options.color;
      ctx.fill();
    }
  }
};

export const SkeletonOverlay = ({ poseResult, videoWidth, videoHeight, isFlipped }: SkeletonOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !poseResult || poseResult.landmarks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const landmarks = poseResult.landmarks[0];
    
    // Scale the canvas to match the video dimensions
    ctx.save();
    ctx.scale(videoWidth, videoHeight);

    // --- Flip logic for the entire canvas ---
    if (isFlipped) {
      ctx.translate(1, 0);
      ctx.scale(-1, 1);
    }
    // ---------------------------------------

    drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 2 / videoWidth }); // Scale line width
    drawLandmarks(ctx, landmarks, { color: '#FF0000', radius: 4 / videoWidth }); // Scale radius

    ctx.restore();
  }, [poseResult, videoWidth, videoHeight, isFlipped]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      className="absolute top-0 left-0 w-full h-full"
    />
  );
};

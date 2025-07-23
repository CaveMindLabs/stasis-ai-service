// frontend/src/components/video/VideoPlayer.tsx
'use client';

import { AppConfig } from '@/config/settings';
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  onStreamReady: (stream: MediaStream, videoElement: HTMLVideoElement) => void;
  onStreamError: (error: string) => void;
  isFlipped: boolean;
  isActive: boolean;
}

export const VideoPlayer = ({ onStreamReady, onStreamError, isFlipped, isActive }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // This ref holds the latest callbacks, preventing the main effect from re-running.
  const callbackRef = useRef({ onStreamReady, onStreamError });

  // This small effect updates the ref whenever the callback props change. It's cheap and safe.
  useEffect(() => {
    callbackRef.current = { onStreamReady, onStreamError };
  }, [onStreamReady, onStreamError]);

  // This is the main effect for managing the camera lifecycle.
  // Its ONLY dependency is `isActive`, making it extremely stable.
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let stream: MediaStream | null = null;
    let isCancelled = false; // Prevents race conditions during cleanup

    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: AppConfig.video.RESOLUTION.width },
            height: { ideal: AppConfig.video.RESOLUTION.height },
            frameRate: { ideal: AppConfig.video.FRAME_RATE },
          },
          audio: false,
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (isCancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            if (!isCancelled) {
                videoElement.play().catch(console.error); // Play and log any minor errors
                if (stream) { // This check satisfies TypeScript
                  callbackRef.current.onStreamReady(stream, videoElement);
                }
            }
          };
        }
      } catch (err) {
        if (isCancelled) return;
        
        let errorMessage = 'Failed to start camera.';
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Camera access was denied.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "No camera was found.";
            } else {
                errorMessage = `Failed to start camera: ${err.message}`;
            }
        }
        callbackRef.current.onStreamError(errorMessage);
      }
    };
    
    const stopCamera = () => {
      if (videoElement.srcObject) {
        const currentStream = videoElement.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    };

    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isActive]); // The key is that this is the ONLY dependency.

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover transition-transform duration-300 ${isFlipped ? 'transform -scale-x-100' : 'transform-none'}`}
    />
  );
};

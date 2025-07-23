// frontend/src/app/page.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react'; // Add useEffect
import dynamic from 'next/dynamic';
import { FiCamera, FiCameraOff, FiRefreshCw, FiDownload, FiTrash2 } from 'react-icons/fi';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { SkeletonOverlay } from '@/components/vision/SkeletonOverlay';
import { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { AppConfig } from '@/config/settings';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { analyzePose, DetectedPose } from '@/lib/poseAnalysis';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { IconButton } from '@/components/ui/IconButton';
import { StasisRecorder } from '@/lib/recorder';

const DynamicVideoPlayer = dynamic(
  () => import('@/components/video/VideoPlayer').then(mod => mod.VideoPlayer),
  { ssr: false }
);

export default function HomePage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLabel, setCameraLabel] = useState('');
  const [isFlipped, setIsFlipped] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [poseResult, setPoseResult] = useState<PoseLandmarkerResult | null>(null);
  const [model, setModel] = useState<'lite' | 'full' | 'heavy'>('lite');
  const [detectedPose, setDetectedPose] = useState<DetectedPose>('NO_POSE');
  // --- Recording State ---
  const [recordingState, setRecordingState] = useState<"IDLE" | "WAITING" | "RECORDING" | "SAVING" | "REVIEWING">("IDLE");
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<StasisRecorder | null>(null);
  const poseHeldTimestamp = useRef<number>(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameId = useRef<number>(0);
  // Refs to hold the latest state for use inside the animation loop
  const recordingStateRef = useRef(recordingState);
  const detectedPoseRef = useRef(detectedPose);

  useEffect(() => {
    recordingStateRef.current = recordingState;
    detectedPoseRef.current = detectedPose;
  }, [recordingState, detectedPose]);

  // --- The hook now returns control functions ---
  const { predict, initialize, clearEngine } = usePoseDetection((results) => {
    setPoseResult(results);
    if (results.landmarks) {
      const pose = analyzePose(results.landmarks[0]);
      setDetectedPose(pose);
    }
  });
  // ---------------------------------------------

  const stopPredictionLoop = useCallback(() => {
    cancelAnimationFrame(animationFrameId.current);
  }, []);

  const startPredictionLoop = useCallback(() => {
    const loop = () => {
      // Run prediction
      if (videoRef.current?.readyState && videoRef.current.readyState >= 2) {
        predict(videoRef.current);
      }

      // --- New, Robust Trigger Logic ---
      const now = performance.now();
      const currentRecordingState = recordingStateRef.current; // Read from ref
      const currentDetectedPose = detectedPoseRef.current; // Read from ref

      if (currentRecordingState === "WAITING" && currentDetectedPose === "START_POSE") {
        if (poseHeldTimestamp.current === 0) {
          poseHeldTimestamp.current = now;
        } else if (now - poseHeldTimestamp.current > AppConfig.ai.POSE_HOLD_DURATION_MS) {
          recorderRef.current?.start();
          setRecordingState("RECORDING");
          poseHeldTimestamp.current = 0;
        }
      } else if (currentRecordingState === "RECORDING" && currentDetectedPose === "STOP_POSE") {
        if (poseHeldTimestamp.current === 0) {
          poseHeldTimestamp.current = now;
        } else if (now - poseHeldTimestamp.current > AppConfig.ai.POSE_HOLD_DURATION_MS) {
          setRecordingState("SAVING");
          recorderRef.current?.stop().then(blob => {
            stopPredictionLoop(); // Stop predictions
            setIsCameraActive(false); // Stop the camera feed
            clearEngine(); // Unload the model
            setLastVideoBlob(blob);
            setRecordingState("REVIEWING");
          });
          poseHeldTimestamp.current = 0;
        }
      } else {
        // If the correct pose is not being held, reset the timer.
        poseHeldTimestamp.current = 0;
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);
  }, [predict, stopPredictionLoop, clearEngine]); // Add missing dependencies

  const handleStreamReady = useCallback((stream: MediaStream, videoElement: HTMLVideoElement) => {
    setError(null);
    videoRef.current = videoElement;
    recorderRef.current = new StasisRecorder(stream); // Initialize recorder
    setRecordingState("WAITING"); // We are now ready to detect triggers
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) setCameraLabel(videoTrack.label);
    startPredictionLoop();
  }, [startPredictionLoop]);
  
  const handleStreamError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsCameraActive(false);
    stopPredictionLoop();
    clearEngine(); // Also clear the engine on error
  }, [stopPredictionLoop, clearEngine]);

  const toggleCamera = async () => {
    if (isCameraActive) {
      // --- Turning camera OFF ---
      setIsCameraActive(false);
      stopPredictionLoop();
      clearEngine();
      setRecordingState("IDLE"); // Reset recording state
      setLastVideoBlob(null); // Clear any saved video
      setCameraLabel('');
      setPoseResult(null);
      videoRef.current = null;
    } else {
      // --- Turning camera ON ---
      try {
        await initialize(model); // Load the selected model
        setIsCameraActive(true); // Then activate the camera
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message); // Display the specific error from the hook
        } else {
          setError("An unknown error occurred while loading the model.");
        }
      }
    }
  };

  const handleDownload = () => {
    if (lastVideoBlob) {
      const url = URL.createObjectURL(lastVideoBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `stasis-ai-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      // Clear the blob and re-arm the trigger
      handleDiscard();
    }
  };

  const handleDiscard = () => {
    setLastVideoBlob(null);
    setPoseResult(null); // Clear the last detected skeleton
    setRecordingState("IDLE"); // Go to the fully inactive state
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-4">Stasis AI</h1>
        <p className="text-lg text-center text-gray-400 mb-2">
          {`Status: ${recordingState} (${model}) | Detected: ${detectedPose}`}
        </p>
        
        <div className="relative aspect-video w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          {/* Visual indicator for recording */}
          {recordingState === "RECORDING" && (
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-white font-bold">REC</span>
            </div>
          )}
          <DynamicVideoPlayer onStreamReady={handleStreamReady} onStreamError={handleStreamError} isFlipped={isFlipped} isActive={isCameraActive}/>
          {isCameraActive && showSkeleton && poseResult && (<SkeletonOverlay poseResult={poseResult} videoWidth={AppConfig.video.RESOLUTION.width} videoHeight={AppConfig.video.RESOLUTION.height} isFlipped={isFlipped}/>)}
          {!isCameraActive && !error && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-xl text-gray-400">Camera is off</p></div>)}
          {error && (<div className="absolute inset-0 flex items-center justify-center bg-red-900/50 p-4"><p className="text-xl text-center font-semibold text-red-200">{error}</p></div>)}
        </div>
        
        <div className="mt-4 flex justify-between items-center px-2">
            <p className="text-sm text-gray-400 truncate pr-4">
              {isCameraActive ? (cameraLabel ? `Active: ${cameraLabel}` : 'Initializing...') : (recordingState === "REVIEWING" ? 'Reviewing Recording' : 'Inactive')}
            </p>

            <div className="flex items-center gap-4">
                {/* --- In-Session Controls (Camera is ON) --- */}
                {isCameraActive && (
                  <>
                    <ToggleSwitch label="Skeleton" enabled={showSkeleton} setEnabled={setShowSkeleton}/>
                    <IconButton onClick={() => setIsFlipped(!isFlipped)} title="Flip Video Horizontally" className="bg-gray-700 hover:bg-gray-600">
                      <FiRefreshCw className={`transition-transform duration-300 ${isFlipped ? 'rotate-0' : 'rotate-180'}`} />
                      Flip
                    </IconButton>
                  </>
                )}

                {/* --- Post-Recording Controls (REVIEWING state) --- */}
                {recordingState === "REVIEWING" && lastVideoBlob && (
                  <>
                    <IconButton onClick={handleDownload} title="Download Recording" className="bg-purple-600 hover:bg-purple-500">
                      <FiDownload /> Download
                    </IconButton>
                    <IconButton onClick={handleDiscard} title="Discard Recording" className="bg-gray-700 hover:bg-gray-600">
                      <FiTrash2 /> Discard
                    </IconButton>
                  </>
                )}

                {/* --- Pre-Session Controls (Camera is OFF and not REVIEWING) --- */}
                {!isCameraActive && recordingState !== "REVIEWING" && (
                  <ModelSelector selectedModel={model} setSelectedModel={setModel}/>
                )}
                
                {/* --- Master Start/Stop Button --- */}
                {/* The Stop button is only shown when the camera is active. */}
                {isCameraActive ? (
                  <IconButton onClick={toggleCamera} title="Stop Camera Session" className="bg-red-600 hover:bg-red-500">
                    <FiCameraOff/> Stop
                  </IconButton>
                ) : (
                  // The Start button is shown when inactive, but disabled during review.
                  <IconButton
                    onClick={toggleCamera}
                    title={recordingState === "REVIEWING" ? 'Download or discard before starting' : 'Start Camera Session'}
                    className={`bg-green-600 ${recordingState === "REVIEWING" ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500'}`}
                    disabled={recordingState === "REVIEWING"}
                  >
                    <FiCamera/> Start
                  </IconButton>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}

// frontend/src/lib/poseAnalysis.ts

import { Landmark } from "@mediapipe/tasks-vision";

export type DetectedPose = "NO_POSE" | "START_POSE" | "STOP_POSE";

// Keypoint indices from the MediaPipe model
const L_WRIST = 15;
const R_WRIST = 16;
const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;

const WRIST_PROXIMITY_THRESHOLD = 0.4; // 40% of shoulder width
const VERTICAL_ALIGNMENT_THRESHOLD = 0.5; // 10% of shoulder width for vertical alignment

/**
 * Analyzes the pose landmarks to detect specific trigger poses
 * based on the vertical position of the wrists.
 * @param landmarks - An array of 33 pose landmarks.
 * @returns The detected pose as a string.
 */
export function analyzePose(landmarks: Landmark[]): DetectedPose {
  if (!landmarks || landmarks.length < 33) {
    return "NO_POSE";
  }

  // Get all necessary keypoints
  const keypoints = {
    leftWrist: landmarks[L_WRIST],
    rightWrist: landmarks[R_WRIST],
    nose: landmarks[NOSE],
    leftShoulder: landmarks[L_SHOULDER],
    rightShoulder: landmarks[R_SHOULDER],
    leftElbow: landmarks[L_ELBOW],
    rightElbow: landmarks[R_ELBOW],
  };

  // Check if all essential keypoints are detected
  if (Object.values(keypoints).some(p => !p)) {
    return "NO_POSE";
  }

  // --- Primary Condition: Wrists must be close together ---
  const shoulderWidth = Math.hypot(keypoints.leftShoulder.x - keypoints.rightShoulder.x, keypoints.leftShoulder.y - keypoints.rightShoulder.y);
  const wristDistance = Math.hypot(keypoints.leftWrist.x - keypoints.rightWrist.x, keypoints.leftWrist.y - keypoints.rightWrist.y);

  if (wristDistance > (shoulderWidth * WRIST_PROXIMITY_THRESHOLD)) {
    return "NO_POSE"; // Not a prayer pose, so we can stop here.
  }

  // --- Secondary Condition: Vertical Position of Wrists ---
  // Calculate the vertical center of the wrists
  const wristCenterY = (keypoints.leftWrist.y + keypoints.rightWrist.y) / 2;

  // Calculate vertical center of the elbows
  const elbowCenterY = (keypoints.leftElbow.y + keypoints.rightElbow.y) / 2;
  
  // The vertical alignment threshold is a fraction of the shoulder width
  const alignmentMargin = shoulderWidth * VERTICAL_ALIGNMENT_THRESHOLD;

  // --- START POSE CHECK (Your Logic) ---
  // "if the y of when the palms are together is between a certain small margin range of the y of the centerpoint of the elbows"
  const isAlignedWithElbows = Math.abs(wristCenterY - elbowCenterY) < alignmentMargin;

  if (isAlignedWithElbows) {
    return "START_POSE";
  }

  // --- STOP POSE CHECK (Your Logic) ---
  // "if it is similarly in a small margin close to the y of the nose"
  const isAlignedWithNose = Math.abs(wristCenterY - keypoints.nose.y) < alignmentMargin;

  if (isAlignedWithNose) {
    return "STOP_POSE";
  }

  // If wrists are together but not aligned with either target, it's not a trigger pose.
  return "NO_POSE";
}

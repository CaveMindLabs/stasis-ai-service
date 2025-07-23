#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# The directory to save models to, passed as the first argument to the script
MODELS_DIR=$1
LITE_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
FULL_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
HEAVY_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"

# Create the directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# Function to download a file if it doesn't exist
download_if_not_exists() {
  URL=$1
  FILE_PATH=$2
  FILENAME=$(basename "$FILE_PATH")

  if [ -f "$FILE_PATH" ]; then
    echo "Model '$FILENAME' already exists. Skipping download."
  else
    echo "Downloading model '$FILENAME'..."
    # Use curl to download the file. -L follows redirects, -o specifies output.
    curl -L -o "$FILE_PATH" "$URL"
    echo "Download of '$FILENAME' complete."
  fi
}

# Download all models
download_if_not_exists "$LITE_URL" "$MODELS_DIR/pose_landmarker_lite.task"
download_if_not_exists "$FULL_URL" "$MODELS_DIR/pose_landmarker_full.task"
download_if_not_exists "$HEAVY_URL" "$MODELS_DIR/pose_landmarker_heavy.task"

echo "All models are checked and ready."

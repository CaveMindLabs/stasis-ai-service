# Stasis AI - 3D Sports Motion Analysis (Phase 1)

This repository contains the Phase 1 standalone prototype for the Stasis AI project. It is a fully client-side web application that performs real-time pose estimation and features automatic recording triggers.

## Features

-   **Real-time Video Feed:** Accesses the user's webcam for live video.
-   **On-Device Pose Estimation:** Uses MediaPipe to draw a real-time skeleton overlay on the video feed.
-   **Dynamic Model Selection:** Allows users to choose between `lite`, `full`, and `heavy` AI models to balance performance and accuracy for their device.
-   **Automatic Recording Triggers:** Starts and stops video recording automatically based on user-defined "Zen" poses (prayer pose and bowing pose).
-   **Post-Recording Review:** A clear workflow to Download or Discard the last recorded clip before starting a new session.
-   **Fully Containerized:** The entire application is packaged with Docker for a simple, one-command setup.

## Prerequisites

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Installation & Running the Application

The entire setup process is automated using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CaveMindLabs/stasis-ai-service.git
    cd stasis-ai-service
    ```

2.  **Build and run the container:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    -   Build the Docker image from the `Dockerfile`.
    -   During the build, it will download the required AI model files.
    -   Start the container and the application server.

3.  **Access the application:**
    Open your web browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

## How to Test

1.  The application will load with the camera off.
2.  Use the "Model" dropdown to select an AI model (`lite` is fastest, `heavy` is most accurate).
3.  Click the "Start" button and grant camera permissions.
4.  You should see your live video feed with a skeleton overlay. You can toggle the skeleton's visibility with the "Skeleton" switch.
5.  To trigger a recording, hold a `"prayer pose" (wrists together near your elbows level, height-wise) for half a second`. A "REC" indicator will appear.
6.  To stop the recording, hold a `"prayer pose" near your face (wrists together near your nose) for half a second`.
7.  The application will enter the "Reviewing" state. The camera will stop, and "Download" and "Discard" buttons will appear.
8.  Click "Download" to save the `.webm` video file, or "Discard" to clear it.
9.  You can now start a new session.

## Stopping the Application

To stop the running container, press `Ctrl + C` in the terminal where `docker-compose` is running, then run:
```bash
docker-compose down
```
This will cleanly stop and remove the container.

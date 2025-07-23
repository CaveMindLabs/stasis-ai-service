// frontend/src/lib/recorder.ts

export class StasisRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor(stream: MediaStream) {
    this.stream = stream;
    const options = { mimeType: 'video/webm; codecs=vp9' };
    try {
        this.mediaRecorder = new MediaRecorder(stream, options);
    } catch {
        console.warn("VP9 codec not supported, falling back.");
        this.mediaRecorder = new MediaRecorder(stream);
    }
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
  }

  start() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.recordedChunks = []; // Clear previous recording
      this.mediaRecorder.start();
      console.log("Recording started.");
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType });
          console.log("Recording stopped. Blob size:", blob.size);
          resolve(blob);
        };
        this.mediaRecorder.stop();
      } else {
        // Resolve with an empty blob if not recording
        resolve(new Blob());
      }
    });
  }
}

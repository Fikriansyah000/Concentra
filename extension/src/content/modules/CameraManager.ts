export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isRunning: boolean = false;

  async startCamera(width: number = 640, height: number = 480): Promise<HTMLVideoElement> {
    if (this.isRunning && this.videoElement) {
      return this.videoElement;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.display = 'none'; // Hidden by default, mirrored on canvas
        document.body.appendChild(this.videoElement);
      }

      this.videoElement.srcObject = this.stream;

      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play();
          resolve();
        };
      });

      this.isRunning = true;
      console.log('[Concentra CameraManager] Webcam started successfully');
      return this.videoElement;
    } catch (error: any) {
      console.error('[Concentra CameraManager] Failed to access webcam:', error);
      throw new Error(`Gagal membuka kamera: ${error?.message || 'Izin kamera ditolak'}`);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }

    this.isRunning = false;
    console.log('[Concentra CameraManager] Webcam stopped');
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  isCameraActive(): boolean {
    return this.isRunning;
  }
}

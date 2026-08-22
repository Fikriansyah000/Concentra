import { FocusMetrics } from '../modules/FocusCalculator';
import { Landmark3D } from '../modules/HeadPoseEstimator';

export class FocusOverlay {
  private container: HTMLElement | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private scoreEl: HTMLElement | null = null;
  private directionEl: HTMLElement | null = null;
  private cardEl: HTMLElement | null = null;
  private miniPillEl: HTMLElement | null = null;
  private isMinimized: boolean = false;

  constructor() {
    this.createDOM();
  }

  private createDOM() {
    if (document.getElementById('concentra-hud-container')) return;

    this.container = document.createElement('div');
    this.container.id = 'concentra-hud-container';

    this.container.innerHTML = `
      <div id="concentra-card" class="concentra-hud-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 16px; height: 16px; border-radius: 4px; background: linear-gradient(135deg, #6366f1, #818cf8); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: white;">C</div>
            <span style="font-size: 11px; font-weight: 700; color: #f8fafc;">Concentra AI HUD</span>
          </div>
          <button id="concentra-minimize-btn" class="concentra-min-btn" title="Kecilkan">_</button>
        </div>

        <div class="concentra-video-wrapper" style="position: relative; width: 100%; height: 120px; border-radius: 10px; overflow: hidden; background: #020617; margin-bottom: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <video id="concentra-hud-video" playsinline muted autoplay style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); position: absolute; inset: 0;"></video>
          <canvas id="concentra-preview-canvas" class="concentra-canvas" width="220" height="120" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); pointer-events: none;"></canvas>
          <div id="concentra-status-dot" style="position: absolute; top: 6px; left: 6px; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981; z-index: 10;"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div id="concentra-score-badge" class="concentra-badge-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
            <span id="concentra-score-text">100%</span>
          </div>
          <span id="concentra-direction-text" style="font-size: 10px; color: #94a3b8; font-weight: 500;">Menatap Layar</span>
        </div>
      </div>

      <!-- Minimized Floating Pill -->
      <div id="concentra-mini-pill" style="display: none; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 9999px; padding: 6px 14px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); cursor: pointer; align-items: center; gap: 8px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
        <span id="concentra-mini-score" style="font-size: 11px; font-weight: 800; color: #f8fafc;">100% Fokus</span>
      </div>
    `;

    document.body.appendChild(this.container);

    this.cardEl = document.getElementById('concentra-card');
    this.miniPillEl = document.getElementById('concentra-mini-pill');
    this.videoEl = document.getElementById('concentra-hud-video') as HTMLVideoElement;
    this.canvas = document.getElementById('concentra-preview-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') || null;
    this.scoreEl = document.getElementById('concentra-score-text');
    this.directionEl = document.getElementById('concentra-direction-text');

    const minBtn = document.getElementById('concentra-minimize-btn');
    minBtn?.addEventListener('click', () => this.toggleMinimize());
    this.miniPillEl?.addEventListener('click', () => this.toggleMinimize());

    // Inject styles
    this.injectStyles();
  }

  private injectStyles() {
    if (document.getElementById('concentra-hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'concentra-hud-styles';
    style.textContent = `
      #concentra-hud-container {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        user-select: none !important;
      }
      .concentra-hud-card {
        background: rgba(15, 23, 42, 0.94) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(99, 102, 241, 0.35) !important;
        border-radius: 16px !important;
        padding: 12px !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6) !important;
        color: #f8fafc !important;
        width: 220px !important;
      }
      .concentra-badge-pill {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 3px 8px !important;
        border-radius: 9999px !important;
        font-size: 11px !important;
        font-weight: 700 !important;
      }
      .concentra-min-btn {
        background: transparent !important;
        border: none !important;
        color: #94a3b8 !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: bold !important;
        line-height: 1 !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
      }
      .concentra-min-btn:hover {
        color: #f8fafc !important;
        background: rgba(255, 255, 255, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  attachStream(stream: MediaStream) {
    if (this.videoEl && !this.videoEl.srcObject) {
      this.videoEl.srcObject = stream;
      this.videoEl.play().catch(() => {});
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      if (this.cardEl) this.cardEl.style.display = 'none';
      if (this.miniPillEl) this.miniPillEl.style.display = 'flex';
    } else {
      if (this.cardEl) this.cardEl.style.display = 'block';
      if (this.miniPillEl) this.miniPillEl.style.display = 'none';
    }
  }

  updateMetrics(metrics: FocusMetrics, landmarks?: Landmark3D[] | null) {
    if (!this.container) return;

    // Draw landmark points on overlay canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (landmarks && landmarks.length > 0) {
        this.ctx.fillStyle = metrics.isDistracted ? '#ef4444' : '#818cf8';
        [1, 33, 263, 61, 291, 152].forEach(idx => {
          const pt = landmarks[idx];
          if (pt) {
            const px = pt.x * this.canvas!.width;
            const py = pt.y * this.canvas!.height;
            this.ctx!.beginPath();
            this.ctx!.arc(px, py, 2.5, 0, 2 * Math.PI);
            this.ctx!.fill();
          }
        });
      }
    }

    // Update Scores & Colors
    if (this.scoreEl) {
      this.scoreEl.textContent = `${metrics.smoothedScore}%`;
    }

    const miniScore = document.getElementById('concentra-mini-score');
    if (miniScore) {
      miniScore.textContent = `${metrics.smoothedScore}% Fokus`;
    }

    const badge = document.getElementById('concentra-score-badge');
    const statusDot = document.getElementById('concentra-status-dot');

    if (badge) {
      if (metrics.smoothedScore >= 80) {
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.color = '#34d399';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        if (statusDot) statusDot.style.background = '#10b981';
      } else if (metrics.smoothedScore >= 50) {
        badge.style.background = 'rgba(245, 158, 11, 0.15)';
        badge.style.color = '#fbbf24';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        if (statusDot) statusDot.style.background = '#f59e0b';
      } else {
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.color = '#f87171';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        if (statusDot) statusDot.style.background = '#ef4444';
      }
    }

    // Direction label
    if (this.directionEl) {
      if (!metrics.faceDetected) {
        this.directionEl.textContent = 'Wajah Hilang';
        this.directionEl.style.color = '#f87171';
      } else {
        const labels: Record<string, string> = {
          front: 'Menatap Layar',
          left: 'Menoleh Kiri',
          right: 'Menoleh Kanan',
          down: 'Menunduk',
          up: 'Mendongak',
        };
        this.directionEl.textContent = labels[metrics.headPose.direction] || 'Fokus';
        this.directionEl.style.color = metrics.isDistracted ? '#f87171' : '#94a3b8';
      }
    }
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

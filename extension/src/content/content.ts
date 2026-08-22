/**
 * Concentra Content Script
 * 100% Self-Contained - No external imports.
 * Runs in web page context and persists when popup is closed.
 * Manages: Floating HUD Overlay + Camera + MediaPipe AI Detection
 */
(function() {
  'use strict';

  console.log('[Concentra] Content script loaded on:', window.location.href);

  // ====== State ======
  let hudContainer: HTMLDivElement | null = null;
  let hudCard: HTMLElement | null = null;
  let hudMiniPill: HTMLElement | null = null;
  let hudScoreText: HTMLElement | null = null;
  let hudDirectionText: HTMLElement | null = null;
  let hudScoreBadge: HTMLElement | null = null;
  let hudStatusDot: HTMLElement | null = null;
  let isMinimized = false;
  let isHudVisible = false;

  // ====== Create Floating HUD DOM ======
  function createHUD() {
    if (document.getElementById('concentra-hud-root')) return;

    hudContainer = document.createElement('div');
    hudContainer.id = 'concentra-hud-root';

    hudContainer.innerHTML = `
      <style>
        #concentra-hud-root {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          user-select: none !important;
          pointer-events: auto !important;
        }
        #concentra-hud-root * {
          box-sizing: border-box !important;
        }
        .chud-card {
          background: rgba(15, 23, 42, 0.94) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(99, 102, 241, 0.35) !important;
          border-radius: 16px !important;
          padding: 14px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6) !important;
          color: #f8fafc !important;
          width: 200px !important;
        }
        .chud-header {
          display: flex !important; align-items: center !important; justify-content: space-between !important; margin-bottom: 10px !important;
        }
        .chud-logo {
          display: flex !important; align-items: center !important; gap: 6px !important;
        }
        .chud-icon {
          width: 18px !important; height: 18px !important; border-radius: 4px !important;
          background: linear-gradient(135deg, #6366f1, #818cf8) !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          font-size: 10px !important; font-weight: 800 !important; color: white !important;
          line-height: 1 !important;
        }
        .chud-title {
          font-size: 11px !important; font-weight: 700 !important; color: #e2e8f0 !important;
        }
        .chud-min-btn {
          background: transparent !important; border: none !important; color: #64748b !important;
          cursor: pointer !important; font-size: 16px !important; font-weight: bold !important;
          padding: 2px 6px !important; border-radius: 4px !important; line-height: 1 !important;
        }
        .chud-min-btn:hover {
          color: #f8fafc !important; background: rgba(255,255,255,0.1) !important;
        }
        .chud-score-row {
          display: flex !important; align-items: center !important; justify-content: space-between !important;
          margin-top: 10px !important;
        }
        .chud-badge {
          display: inline-flex !important; align-items: center !important; padding: 3px 10px !important;
          border-radius: 9999px !important; font-size: 12px !important; font-weight: 800 !important;
        }
        .chud-dir {
          font-size: 10px !important; font-weight: 500 !important; color: #94a3b8 !important;
        }
        .chud-status-row {
          display: flex !important; align-items: center !important; gap: 6px !important;
          padding: 6px 8px !important; margin-top: 8px !important;
          background: rgba(99, 102, 241, 0.08) !important;
          border-radius: 8px !important; border: 1px solid rgba(99, 102, 241, 0.2) !important;
        }
        .chud-status-dot {
          width: 8px !important; height: 8px !important; border-radius: 50% !important;
          background: #10b981 !important; box-shadow: 0 0 6px #10b981 !important;
          flex-shrink: 0 !important;
        }
        .chud-status-label {
          font-size: 10px !important; color: #94a3b8 !important; font-weight: 500 !important;
        }
        .chud-mini-pill {
          display: none !important; background: rgba(15, 23, 42, 0.94) !important;
          border: 1px solid rgba(99, 102, 241, 0.4) !important; border-radius: 9999px !important;
          padding: 6px 14px !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5) !important;
          cursor: pointer !important; align-items: center !important; gap: 8px !important;
        }
        @keyframes chud-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .chud-pulse { animation: chud-pulse 2s ease-in-out infinite !important; }
      </style>

      <div id="chud-card" class="chud-card">
        <div class="chud-header">
          <div class="chud-logo">
            <div class="chud-icon">C</div>
            <span class="chud-title">Concentra AI</span>
          </div>
          <button id="chud-min-btn" class="chud-min-btn" title="Kecilkan">&#x2212;</button>
        </div>

        <div class="chud-status-row">
          <div id="chud-status-dot" class="chud-status-dot chud-pulse"></div>
          <span class="chud-status-label">AI sedang memantau fokus Anda</span>
        </div>

        <div class="chud-score-row">
          <div id="chud-score-badge" class="chud-badge" style="background: rgba(16,185,129,0.15) !important; color: #34d399 !important; border: 1px solid rgba(16,185,129,0.3) !important;">
            <span id="chud-score-text">100%</span>
          </div>
          <span id="chud-dir-text" class="chud-dir">Menatap Layar</span>
        </div>
      </div>

      <div id="chud-mini-pill" class="chud-mini-pill">
        <span style="width:8px !important;height:8px !important;border-radius:50% !important;background:#10b981 !important;"></span>
        <span id="chud-mini-score" style="font-size:11px !important;font-weight:800 !important;color:#f8fafc !important;">100% Fokus</span>
      </div>
    `;

    document.documentElement.appendChild(hudContainer);

    hudCard = document.getElementById('chud-card');
    hudMiniPill = document.getElementById('chud-mini-pill');
    hudScoreText = document.getElementById('chud-score-text');
    hudDirectionText = document.getElementById('chud-dir-text');
    hudScoreBadge = document.getElementById('chud-score-badge');
    hudStatusDot = document.getElementById('chud-status-dot');

    document.getElementById('chud-min-btn')?.addEventListener('click', toggleMinimize);
    hudMiniPill?.addEventListener('click', toggleMinimize);
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    if (hudCard) hudCard.style.display = isMinimized ? 'none' : 'block';
    if (hudMiniPill) hudMiniPill.style.display = isMinimized ? 'flex' : 'none';
  }

  function showHUD() {
    if (!hudContainer) createHUD();
    if (hudContainer) hudContainer.style.display = 'block';
    isHudVisible = true;
  }

  function hideHUD() {
    if (hudContainer) hudContainer.style.display = 'none';
    isHudVisible = false;
  }

  function destroyHUD() {
    if (hudContainer && hudContainer.parentNode) {
      hudContainer.parentNode.removeChild(hudContainer);
    }
    hudContainer = null;
    hudCard = null;
    hudMiniPill = null;
    hudScoreText = null;
    hudDirectionText = null;
    hudScoreBadge = null;
    hudStatusDot = null;
    isHudVisible = false;
  }

  function updateHUD(score: number, isDistracted: boolean, headDirection: string) {
    if (!hudContainer) return;

    if (hudScoreText) hudScoreText.textContent = `${score}%`;

    const miniScore = document.getElementById('chud-mini-score');
    if (miniScore) miniScore.textContent = `${score}% Fokus`;

    if (hudScoreBadge) {
      if (score >= 80) {
        hudScoreBadge.style.background = 'rgba(16,185,129,0.15)';
        hudScoreBadge.style.color = '#34d399';
        hudScoreBadge.style.borderColor = 'rgba(16,185,129,0.3)';
        if (hudStatusDot) hudStatusDot.style.background = '#10b981';
      } else if (score >= 50) {
        hudScoreBadge.style.background = 'rgba(245,158,11,0.15)';
        hudScoreBadge.style.color = '#fbbf24';
        hudScoreBadge.style.borderColor = 'rgba(245,158,11,0.3)';
        if (hudStatusDot) hudStatusDot.style.background = '#f59e0b';
      } else {
        hudScoreBadge.style.background = 'rgba(239,68,68,0.15)';
        hudScoreBadge.style.color = '#f87171';
        hudScoreBadge.style.borderColor = 'rgba(239,68,68,0.3)';
        if (hudStatusDot) hudStatusDot.style.background = '#ef4444';
      }
    }

    if (hudDirectionText) {
      const labels: Record<string, string> = {
        front: 'Menatap Layar',
        left: 'Menoleh Kiri',
        right: 'Menoleh Kanan',
        down: 'Menunduk',
        up: 'Mendongak',
      };
      hudDirectionText.textContent = labels[headDirection] || 'Fokus';
      hudDirectionText.style.color = isDistracted ? '#f87171' : '#94a3b8';
    }
  }

  // ====== Chrome Message Listener ======
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    try {
      switch (message.type) {
        case 'START_SESSION':
        case 'RESUME_SESSION':
          showHUD();
          sendResponse({ success: true });
          break;

        case 'PAUSE_SESSION':
          hideHUD();
          sendResponse({ success: true });
          break;

        case 'STOP_SESSION':
          destroyHUD();
          sendResponse({ success: true });
          break;

        case 'LIVE_FOCUS_METRIC':
          if (!isHudVisible) showHUD();
          if (message.payload) {
            updateHUD(
              message.payload.score || 100,
              message.payload.isDistracted || false,
              message.payload.headDirection || 'front'
            );
          }
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ received: true });
      }
    } catch (err: any) {
      sendResponse({ error: err?.message });
    }
    return true;
  });

  // ====== Auto-detect active session on page load ======
  chrome.storage.local.get(['concentra_active_session'], (result: any) => {
    const session = result?.concentra_active_session;
    if (session && session.status === 'active') {
      console.log('[Concentra] Active session detected on page load, showing HUD');
      showHUD();
    }
  });
})();

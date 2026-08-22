import { BaseExtensionMessage } from '../shared/types';

console.log('[Concentra Content Script] Injected on:', window.location.href);

// Detect learning platform
function detectPlatform(): string {
  const url = window.location.href;
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('meet.google.com')) return 'google_meet';
  if (url.includes('zoom.us')) return 'zoom';
  if (url.includes('coursera.org')) return 'coursera';
  if (url.includes('udemy.com')) return 'udemy';
  return 'other';
}

// Minimal placeholder overlay container for Week 6 AI & HUD indicator
function setupOverlayContainer() {
  const existing = document.getElementById('concentra-overlay-root');
  if (existing) return existing;

  const overlayRoot = document.createElement('div');
  overlayRoot.id = 'concentra-overlay-root';
  overlayRoot.style.position = 'fixed';
  overlayRoot.style.top = '20px';
  overlayRoot.style.right = '20px';
  overlayRoot.style.zIndex = '2147483647'; // Max z-index
  overlayRoot.style.pointerEvents = 'none';

  document.body.appendChild(overlayRoot);
  return overlayRoot;
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message: BaseExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'SESSION_STATE_CHANGED') {
    const status = message.payload?.status;
    console.log('[Concentra Content Script] Session status updated:', status);
    setupOverlayContainer();
    sendResponse({ received: true, platform: detectPlatform() });
  }
  return true;
});

// Notify background that content script is ready
setupOverlayContainer();

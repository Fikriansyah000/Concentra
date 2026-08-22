import { SessionManager } from './SessionManager';
import { BaseExtensionMessage, StartSessionMessage } from '../shared/types';
import { extensionStorage } from '../shared/storage';

console.log('[Concentra Background SW] Initialized');

SessionManager.init();

// Listen for messages from popup, offscreen, and content scripts
chrome.runtime.onMessage.addListener((message: BaseExtensionMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'START_SESSION': {
          const startMsg = message as StartSessionMessage;
          const session = await SessionManager.startSession(
            startMsg.payload?.title,
            startMsg.payload?.sourceUrl,
            startMsg.payload?.sourceType
          );
          sendResponse({ success: true, session });
          break;
        }

        case 'PAUSE_SESSION': {
          const session = await SessionManager.pauseSession();
          sendResponse({ success: true, session });
          break;
        }

        case 'RESUME_SESSION': {
          const session = await SessionManager.resumeSession();
          sendResponse({ success: true, session });
          break;
        }

        case 'STOP_SESSION': {
          const session = await SessionManager.stopSession();
          sendResponse({ success: true, session });
          break;
        }

        case 'GET_SESSION_STATE': {
          const session = await extensionStorage.getActiveSession();
          const auth = await extensionStorage.getAuthInfo();
          sendResponse({ success: true, session, auth });
          break;
        }

        case 'FOCUS_UPDATE': {
          if (message.payload) {
            await SessionManager.handleFocusUpdate(
              message.payload.focusScore,
              message.payload.isDistracted,
              message.payload.headDirection
            );
          }
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error: any) {
      console.error('[Concentra SW Error]', error);
      sendResponse({ success: false, error: error?.message || 'Internal error' });
    }
  })();

  return true;
});

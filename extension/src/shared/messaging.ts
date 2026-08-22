import { BaseExtensionMessage } from './types';

export const extensionMessaging = {
  sendToBackground: async <T = any>(message: BaseExtensionMessage): Promise<T> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          // Silently handle disconnected background script
          resolve({ error: chrome.runtime.lastError.message } as any);
        } else {
          resolve(response);
        }
      });
    });
  },

  sendToActiveTab: async <T = any>(message: BaseExtensionMessage): Promise<T> => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) {
          resolve({ error: 'No active tab found' } as any);
          return;
        }
        chrome.tabs.sendMessage(activeTab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message } as any);
          } else {
            resolve(response);
          }
        });
      });
    });
  },
};

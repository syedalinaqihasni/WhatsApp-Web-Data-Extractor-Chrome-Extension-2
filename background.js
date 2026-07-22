class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // Handle installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.log('WhatsApp Data Extractor installed');
        this.openWelcomePage();
      }
    });

    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.url.includes('web.whatsapp.com')) {
        this.injectContentScript(tabId);
      }
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'downloadFile':
          await this.downloadFile(request.data);
          sendResponse({ success: true });
          break;
          
        case 'getStorageData':
          const data = await chrome.storage.local.get(request.keys);
          sendResponse({ success: true, data });
          break;
          
        case 'setStorageData':
          await chrome.storage.local.set(request.data);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({ error: error.message });
    }
  }

  async downloadFile(fileData) {
    const { content, filename, mimeType } = fileData;
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    try {
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.warn('Failed to inject content script:', error);
    }
  }

  openWelcomePage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
}

// Initialize the background service
new BackgroundService();
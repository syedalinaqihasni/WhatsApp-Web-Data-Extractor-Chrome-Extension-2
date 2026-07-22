class WhatsAppExtractor {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkWhatsAppStatus();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Extract buttons
    document.getElementById('extractChats').addEventListener('click', () => {
      this.extractChats();
    });

    document.getElementById('extractContacts').addEventListener('click', () => {
      this.extractContacts();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
  }

  async checkWhatsAppStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
        this.updateStatus('Not on WhatsApp Web', false);
        return;
      }

      // Check if WhatsApp is loaded
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'checkWhatsAppStatus' });
      
      if (results && results.isLoaded) {
        this.updateStatus('Connected to WhatsApp Web', true);
      } else {
        this.updateStatus('WhatsApp Web loading...', false);
        setTimeout(() => this.checkWhatsAppStatus(), 2000);
      }
    } catch (error) {
      this.updateStatus('Unable to connect', false);
    }
  }

  updateStatus(text, connected) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    
    statusText.textContent = text;
    
    if (connected) {
      statusDot.classList.add('connected');
    } else {
      statusDot.classList.remove('connected');
    }
  }

  async extractChats() {
    try {
      this.showProgress('Starting chat extraction...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
        alert('Please navigate to WhatsApp Web first');
        this.hideProgress();
        return;
      }

      const options = this.getChatExtractionOptions();
      
      const result = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractChats',
        options: options
      });

      if (result && result.success) {
        this.updateProgress(50, 'Processing chat data...');
        
        // Generate and download files
        if (options.formats.html) {
          this.downloadFile(result.data.html, 'whatsapp-chats.html', 'text/html');
        }
        
        if (options.formats.text) {
          this.downloadFile(result.data.text, 'whatsapp-chats.txt', 'text/plain');
        }

        this.updateProgress(100, 'Extraction complete!');
        setTimeout(() => this.hideProgress(), 2000);
      } else {
        throw new Error(result?.error || 'Failed to extract chats');
      }
    } catch (error) {
      console.error('Chat extraction error:', error);
      alert('Failed to extract chats: ' + error.message);
      this.hideProgress();
    }
  }

  async extractContacts() {
    try {
      this.showProgress('Starting contact extraction...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
        alert('Please navigate to WhatsApp Web first');
        this.hideProgress();
        return;
      }

      const options = this.getContactExtractionOptions();
      
      const result = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractContacts',
        options: options
      });

      if (result && result.success) {
        this.updateProgress(50, 'Processing contact data...');
        
        // Generate and download files
        if (options.formats.csv) {
          this.downloadFile(result.data.csv, 'whatsapp-contacts.csv', 'text/csv');
        }
        
        if (options.formats.vcf) {
          this.downloadFile(result.data.vcf, 'whatsapp-contacts.vcf', 'text/vcard');
        }

        this.updateProgress(100, 'Extraction complete!');
        setTimeout(() => this.hideProgress(), 2000);
      } else {
        throw new Error(result?.error || 'Failed to extract contacts');
      }
    } catch (error) {
      console.error('Contact extraction error:', error);
      alert('Failed to extract contacts: ' + error.message);
      this.hideProgress();
    }
  }

  getChatExtractionOptions() {
    const selectionType = document.querySelector('input[name="chatSelection"]:checked').value;
    const includeIndividual = document.getElementById('includeIndividual').checked;
    const includeGroups = document.getElementById('includeGroups').checked;
    const includeCommunities = document.getElementById('includeCommunities').checked;
    const exportHTML = document.getElementById('exportHTML').checked;
    const exportText = document.getElementById('exportText').checked;

    return {
      selection: selectionType,
      types: {
        individual: includeIndividual,
        groups: includeGroups,
        communities: includeCommunities
      },
      formats: {
        html: exportHTML,
        text: exportText
      }
    };
  }

  getContactExtractionOptions() {
    const selectionType = document.querySelector('input[name="contactSelection"]:checked').value;
    const exportCSV = document.getElementById('exportCSV').checked;
    const exportVCF = document.getElementById('exportVCF').checked;

    return {
      selection: selectionType,
      formats: {
        csv: exportCSV,
        vcf: exportVCF
      }
    };
  }

  showProgress(text) {
    const progressSection = document.getElementById('progressSection');
    const progressText = document.getElementById('progressText');
    
    progressSection.classList.remove('hidden');
    progressText.textContent = text;
    this.updateProgress(10, text);
  }

  updateProgress(percentage, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = percentage + '%';
    if (text) {
      progressText.textContent = text;
    }
  }

  hideProgress() {
    const progressSection = document.getElementById('progressSection');
    progressSection.classList.add('hidden');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, () => {
      URL.revokeObjectURL(url);
    });
  }
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  new WhatsAppExtractor();
});
class WhatsAppDataExtractor {
  constructor() {
    this.isWhatsAppLoaded = false;
    this.init();
  }

  init() {
    this.checkWhatsAppStatus();
    this.setupMessageListener();
  }

  checkWhatsAppStatus() {
    // Check if WhatsApp is fully loaded
    const checkInterval = setInterval(() => {
      const chatList = document.querySelector('[data-testid="chat-list"]');
      const searchInput = document.querySelector('[data-testid="chat-list-search"]');
      
      if (chatList || searchInput) {
        this.isWhatsAppLoaded = true;
        clearInterval(checkInterval);
      }
    }, 1000);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'checkWhatsAppStatus':
          sendResponse({ isLoaded: this.isWhatsAppLoaded });
          break;
          
        case 'extractChats':
          this.extractChats(request.options).then(sendResponse);
          return true; // Keep message channel open for async response
          
        case 'extractContacts':
          this.extractContacts(request.options).then(sendResponse);
          return true; // Keep message channel open for async response
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    });
  }

  async extractChats(options) {
    try {
      const chats = await this.getAllChats(options);
      const processedData = this.processChatsData(chats, options);
      
      return {
        success: true,
        data: processedData
      };
    } catch (error) {
      console.error('Chat extraction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllChats(options) {
    const chats = [];
    
    if (options.selection === 'current') {
      const currentChat = await this.getCurrentChatData();
      if (currentChat) {
        chats.push(currentChat);
      }
    } else {
      const chatElements = this.getChatElements(options);
      
      for (const chatElement of chatElements) {
        try {
          // Click on chat to load it
          chatElement.click();
          await this.wait(1000); // Wait for chat to load
          
          const chatData = await this.getCurrentChatData();
          if (chatData) {
            chats.push(chatData);
          }
        } catch (error) {
          console.warn('Failed to extract chat:', error);
        }
      }
    }
    
    return chats;
  }

  getChatElements(options) {
    const chatList = document.querySelector('[data-testid="chat-list"]');
    if (!chatList) return [];
    
    const allChats = Array.from(chatList.querySelectorAll('[data-testid="chat-list-item"]'));
    
    return allChats.filter(chat => {
      const chatName = this.getChatName(chat);
      const isGroup = this.isGroupChat(chat);
      const isCommunity = this.isCommunityChat(chat);
      
      if (isGroup && !options.types.groups) return false;
      if (isCommunity && !options.types.communities) return false;
      if (!isGroup && !isCommunity && !options.types.individual) return false;
      
      return true;
    });
  }

  async getCurrentChatData() {
    const chatHeader = document.querySelector('[data-testid="conversation-header"]');
    if (!chatHeader) return null;
    
    const chatName = this.getChatNameFromHeader(chatHeader);
    const isGroup = this.isCurrentChatGroup();
    const messages = await this.getMessagesFromCurrentChat();
    
    return {
      name: chatName,
      type: isGroup ? 'group' : 'individual',
      messages: messages,
      extractedAt: new Date().toISOString()
    };
  }

  async getMessagesFromCurrentChat() {
    const messages = [];
    const messageContainer = document.querySelector('[data-testid="conversation-panel-messages"]');
    
    if (!messageContainer) return messages;
    
    // Scroll to load more messages
    await this.scrollToLoadAllMessages(messageContainer);
    
    const messageElements = messageContainer.querySelectorAll('[data-testid="msg-container"]');
    
    messageElements.forEach(msgElement => {
      try {
        const message = this.parseMessageElement(msgElement);
        if (message) {
          messages.push(message);
        }
      } catch (error) {
        console.warn('Failed to parse message:', error);
      }
    });
    
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  parseMessageElement(msgElement) {
    const messageContent = msgElement.querySelector('[data-testid="msg-text"]');
    const senderElement = msgElement.querySelector('[data-testid="msg-meta"]');
    const timeElement = msgElement.querySelector('[data-testid="msg-time"]');
    
    // Determine if message is from user or contact
    const isFromMe = msgElement.classList.contains('message-out') || 
                     msgElement.querySelector('.message-out') !== null;
    
    const message = {
      text: messageContent ? messageContent.innerText.trim() : '',
      sender: isFromMe ? 'You' : this.getSenderName(msgElement),
      timestamp: this.parseTimestamp(timeElement),
      type: this.getMessageType(msgElement),
      isFromMe: isFromMe
    };
    
    // Handle media messages
    if (message.type !== 'text') {
      message.mediaInfo = this.getMediaInfo(msgElement);
    }
    
    return message;
  }

  processChatsData(chats, options) {
    const result = {};
    
    if (options.formats.html) {
      result.html = this.generateHTMLExport(chats);
    }
    
    if (options.formats.text) {
      result.text = this.generateTextExport(chats);
    }
    
    return result;
  }

  generateHTMLExport(chats) {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat Export</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .chat { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .chat-header { background: #25D366; color: white; padding: 15px; font-weight: bold; }
        .message { padding: 10px 15px; border-bottom: 1px solid #eee; }
        .message.from-me { background: #dcf8c6; }
        .message.from-contact { background: white; }
        .message-meta { font-size: 12px; color: #666; margin-bottom: 5px; }
        .message-text { line-height: 1.4; }
        .export-info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="export-info">
        <h1>WhatsApp Chat Export</h1>
        <p>Exported on: ${new Date().toLocaleString()}</p>
        <p>Total chats: ${chats.length}</p>
    </div>
`;

    chats.forEach(chat => {
      html += `
    <div class="chat">
        <div class="chat-header">
            ${chat.name} (${chat.type}) - ${chat.messages.length} messages
        </div>
`;

      chat.messages.forEach(message => {
        const messageClass = message.isFromMe ? 'from-me' : 'from-contact';
        html += `
        <div class="message ${messageClass}">
            <div class="message-meta">
                ${message.sender} • ${new Date(message.timestamp).toLocaleString()}
            </div>
            <div class="message-text">${this.escapeHtml(message.text)}</div>
        </div>
`;
      });

      html += `    </div>\n`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  generateTextExport(chats) {
    let text = `WhatsApp Chat Export\nExported on: ${new Date().toLocaleString()}\nTotal chats: ${chats.length}\n\n`;
    text += '=' .repeat(50) + '\n\n';
    
    chats.forEach(chat => {
      text += `CHAT: ${chat.name} (${chat.type})\n`;
      text += `Messages: ${chat.messages.length}\n`;
      text += '-'.repeat(30) + '\n\n';
      
      chat.messages.forEach(message => {
        const timestamp = new Date(message.timestamp).toLocaleString();
        text += `[${timestamp}] ${message.sender}: ${message.text}\n`;
      });
      
      text += '\n' + '='.repeat(50) + '\n\n';
    });
    
    return text;
  }

  async extractContacts(options) {
    try {
      const contacts = await this.getAllContacts(options);
      const processedData = this.processContactsData(contacts, options);
      
      return {
        success: true,
        data: processedData
      };
    } catch (error) {
      console.error('Contact extraction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllContacts(options) {
    const contacts = new Set();
    
    // Get contacts from chat list
    const chatElements = document.querySelectorAll('[data-testid="chat-list-item"]');
    
    chatElements.forEach(chatElement => {
      const contactInfo = this.extractContactFromChatElement(chatElement);
      if (contactInfo) {
        contacts.add(JSON.stringify(contactInfo));
      }
    });
    
    // If extracting group members, get additional contacts from groups
    if (options.selection === 'groups' || options.selection === 'all') {
      const groupContacts = await this.getGroupMemberContacts();
      groupContacts.forEach(contact => {
        contacts.add(JSON.stringify(contact));
      });
    }
    
    return Array.from(contacts).map(contact => JSON.parse(contact));
  }

  processContactsData(contacts, options) {
    const result = {};
    
    if (options.formats.csv) {
      result.csv = this.generateCSVExport(contacts);
    }
    
    if (options.formats.vcf) {
      result.vcf = this.generateVCFExport(contacts);
    }
    
    return result;
  }

  generateCSVExport(contacts) {
    let csv = 'Name,Phone,Type,Last Seen\n';
    
    contacts.forEach(contact => {
      const name = this.escapeCSV(contact.name || '');
      const phone = this.escapeCSV(contact.phone || '');
      const type = this.escapeCSV(contact.type || '');
      const lastSeen = this.escapeCSV(contact.lastSeen || '');
      
      csv += `${name},${phone},${type},${lastSeen}\n`;
    });
    
    return csv;
  }

  generateVCFExport(contacts) {
    let vcf = '';
    
    contacts.forEach(contact => {
      vcf += 'BEGIN:VCARD\n';
      vcf += 'VERSION:3.0\n';
      vcf += `FN:${contact.name || 'Unknown'}\n`;
      if (contact.phone) {
        vcf += `TEL:${contact.phone}\n`;
      }
      vcf += 'END:VCARD\n';
    });
    
    return vcf;
  }

  // Utility methods
  getChatName(chatElement) {
    const nameElement = chatElement.querySelector('[data-testid="chat-list-item-title"]');
    return nameElement ? nameElement.innerText.trim() : 'Unknown';
  }

  getChatNameFromHeader(headerElement) {
    const nameElement = headerElement.querySelector('[data-testid="conversation-info-header-chat-title"]');
    return nameElement ? nameElement.innerText.trim() : 'Unknown';
  }

  isGroupChat(chatElement) {
    const groupIcon = chatElement.querySelector('[data-testid="default-group"]');
    return groupIcon !== null;
  }

  isCommunityChat(chatElement) {
    // Community detection logic - may need adjustment based on WhatsApp updates
    const communityIcon = chatElement.querySelector('[data-testid="community"]');
    return communityIcon !== null;
  }

  isCurrentChatGroup() {
    const groupInfo = document.querySelector('[data-testid="group-info"]');
    return groupInfo !== null;
  }

  getSenderName(msgElement) {
    const senderElement = msgElement.querySelector('[data-testid="msg-author"]');
    return senderElement ? senderElement.innerText.trim() : 'Unknown';
  }

  parseTimestamp(timeElement) {
    if (!timeElement) return new Date().toISOString();
    
    const timeText = timeElement.innerText.trim();
    // Parse WhatsApp time format (may need adjustment)
    return new Date().toISOString(); // Simplified for now
  }

  getMessageType(msgElement) {
    if (msgElement.querySelector('[data-testid="audio-msg"]')) return 'audio';
    if (msgElement.querySelector('[data-testid="image-msg"]')) return 'image';
    if (msgElement.querySelector('[data-testid="video-msg"]')) return 'video';
    if (msgElement.querySelector('[data-testid="document-msg"]')) return 'document';
    return 'text';
  }

  getMediaInfo(msgElement) {
    // Extract media information if needed
    return {};
  }

  extractContactFromChatElement(chatElement) {
    const name = this.getChatName(chatElement);
    const isGroup = this.isGroupChat(chatElement);
    
    return {
      name: name,
      phone: '', // WhatsApp Web doesn't easily expose phone numbers
      type: isGroup ? 'group' : 'individual',
      lastSeen: ''
    };
  }

  async getGroupMemberContacts() {
    // This would require opening each group and extracting member info
    // Simplified implementation
    return [];
  }

  async scrollToLoadAllMessages(container) {
    let lastHeight = 0;
    let currentHeight = container.scrollHeight;
    
    while (lastHeight !== currentHeight) {
      lastHeight = currentHeight;
      container.scrollTop = 0; // Scroll to top to load older messages
      await this.wait(1000);
      currentHeight = container.scrollHeight;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeCSV(text) {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the content script
new WhatsAppDataExtractor();
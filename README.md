# WhatsApp Web Data Extractor

A powerful Chrome extension for extracting chats and contacts from WhatsApp Web in multiple formats.

## Features

### Chat Extraction
- **Multiple Selection Modes**: Extract current chat, selected chats, or all chats
- **Chat Type Support**: Individual chats, group chats, and communities
- **Export Formats**: HTML (styled) and plain text
- **Bulk Operations**: Extract multiple chats at once

### Contact Extraction
- **Comprehensive Contact Lists**: Extract all contacts or group members only
- **Export Formats**: CSV and VCF (vCard) formats
- **Easy Import**: Compatible with most contact management apps

### User Experience
- **Clean Interface**: Modern, WhatsApp-inspired design
- **Real-time Status**: Live connection status indicator
- **Progress Tracking**: Visual progress bar during extraction
- **Error Handling**: Robust error handling and user feedback

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will appear in your Chrome toolbar

## Usage

1. **Navigate to WhatsApp Web**: Open [web.whatsapp.com](https://web.whatsapp.com) and log in
2. **Open Extension**: Click the extension icon in your Chrome toolbar
3. **Select Options**: Choose what to extract and in which format
4. **Extract Data**: Click the extract button and wait for completion
5. **Download Files**: Your data will be automatically downloaded

## Extraction Options

### For Chats:
- **Selection**: Current chat, selected chats, or all chats
- **Types**: Individual chats, groups, communities
- **Formats**: HTML (with styling) or plain text

### For Contacts:
- **Selection**: All contacts or group members only  
- **Formats**: CSV or VCF (vCard)

## File Formats

### HTML Export
- Styled chat export with sender names, timestamps, and message content
- WhatsApp-like visual styling
- Responsive design for easy viewing

### Text Export
- Plain text format with timestamps and sender information
- Easy to search and process
- Compatible with all text editors

### CSV Export
- Spreadsheet-compatible contact list
- Includes name, phone, type, and last seen information
- Easy to import into contact management systems

### VCF Export
- Standard vCard format
- Compatible with most contact applications
- Preserves contact information structure

## Privacy & Security

- **Local Processing**: All data processing happens locally in your browser
- **No Data Collection**: The extension doesn't collect or transmit your data
- **Secure Access**: Only accesses WhatsApp Web content when explicitly requested
- **Permissions**: Minimal required permissions for functionality

## Technical Requirements

- **Browser**: Chrome 88+ (Manifest V3 support)
- **WhatsApp Web**: Must be logged in and loaded
- **Permissions**: Active tab access and downloads permission

## Troubleshooting

### Extension Not Working
- Ensure you're on WhatsApp Web (web.whatsapp.com)
- Check that WhatsApp Web is fully loaded
- Refresh the page and try again

### Extraction Fails
- Make sure the chat/contact list is visible
- Wait for WhatsApp Web to fully load before extracting
- Check browser console for error messages

### Files Not Downloading
- Check Chrome's download settings
- Ensure downloads are not blocked for this site
- Verify sufficient storage space

## Limitations

- **WhatsApp Web Dependency**: Requires active WhatsApp Web session
- **Rate Limiting**: Large extractions may take time to avoid overwhelming WhatsApp
- **Media Content**: Currently extracts text content only (media references included)
- **Phone Numbers**: WhatsApp Web doesn't always expose phone numbers

## Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension is not affiliated with WhatsApp or Meta. Use responsibly and respect others' privacy. Make sure you have permission to export chat data that includes other people's messages.
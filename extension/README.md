# USwift Chrome Extension

A comprehensive career management extension with AI-powered features.

## Setup Instructions

### 1. Configure Mistral AI API Key

**This is required for AI chat features to work!**

1. Get your API key from [Mistral AI](https://mistral.ai/)
2. Open `src/config.js`
3. Replace `"your-mistral-api-key-here"` with your actual API key:

```javascript
mistral: {
  apiKey: "your-actual-api-key-here", // ← Replace this
  baseUrl: "https://api.mistral.ai",
}
```

### 2. Build the Extension

```bash
npm install
npm run build
```

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from your extension directory

## Features

- 🤖 **AI Career Assistant** - Chat with AI for career advice
- 📄 **Resume Enhancement** - AI-powered resume optimization
- ✍️ **Cover Letter Generator** - Personalized cover letters
- 📁 **File Manager** - Document upload and AI analysis
- 🔍 **Job Analysis** - Smart job description analysis
- 🎤 **Interview Prep** - AI-generated interview questions
- ⚡ **Auto-Apply** - Smart job application automation
- 📊 **Job Tracker** - Application progress tracking

## Troubleshooting

### AI Chat Errors

If you're seeing "Sorry, I encountered an error while processing your request":

1. **Check API Key**: Verify your Mistral API key is correctly set in `src/config.js`
2. **Console Logs**: Open DevTools (F12) → Console tab to see detailed error messages
3. **Network Tab**: Check if API requests are being made and their responses

### Common Issues

- **"Mistral API key not configured"**: Update `src/config.js` with your actual API key
- **"Network error"**: Check your internet connection and Mistral API status
- **"HTTP 401"**: Invalid API key - verify it's correct and active
- **"HTTP 429"**: Rate limit exceeded - wait a few minutes before trying again

## Development

### Environment Variables (Alternative)

You can also use environment variables instead of hardcoding the API key:

```bash
# Create .env file in extension root
VITE_MISTRAL_API_KEY=your-actual-api-key-here
VITE_MISTRAL_BASE_URL=https://api.mistral.ai
```

### Building for Development

```bash
npm run dev  # Development build with hot reload
npm run build  # Production build
```

## Support

For issues or questions:

1. Check the console for error messages
2. Verify your Mistral API key configuration
3. Ensure you have a stable internet connection

## License

This project is for educational and personal use.

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

### Auto-Apply Errors

#### "Unsupported job board" Error

**What it means**: The extension couldn't detect a supported job application form on the current page.

**How to diagnose**:

1. Open browser console (F12 → Console tab)
2. Run: `testJobBoard()` (this will analyze the current page)
3. Check the detection results

**Possible causes & solutions**:

**Cause 1: Not on a job application page**

```
❌ This page is not recognized as a job application page.
```

**Solution**: Make sure you're on a job application page with a visible form. Look for:

- Email input fields
- Name input fields
- Apply/Submit buttons
- File upload areas for resumes

**Cause 2: New/Unknown job board**

```
⚠️ This platform has basic support.
Confidence: 65%
```

**Solution**: The extension now supports many more platforms! Try again - we've expanded support to include:

- LinkedIn Easy Apply
- Indeed
- Glassdoor
- ZipRecruiter
- And many more ATS platforms

**Cause 3: Low confidence detection**

```
❓ This page might be a job application but needs verification.
Confidence: 55%
```

**Solution**: Try auto-apply anyway - it might work with the generic form detection.

#### How to Test Current Page Support

1. **Open browser console**: Press F12 → Console tab
2. **Run the test**: Type `testJobBoard()` and press Enter
3. **Check results**: Look for confidence level and platform detection

Example output:

```
🔍 USwift Job Board Detection Test
=====================================
📍 Current URL: jobs.company.com
🎯 Detected Platform: greenhouse
📊 Confidence: 98.0%
📝 Notes: None
✅ This platform is well supported!
🚀 Auto-apply should work reliably here.
=====================================
```

### Supported Job Boards

#### Full Support (98%+ confidence)

- **Greenhouse** (greenhouse.io, boards.greenhouse.io)
- **Lever** (lever.co)
- **Workday** (myworkday.com, workday.com)

#### High Support (95%+ confidence)

- **LinkedIn** (linkedin.com)
- **Indeed** (indeed.com)
- **Glassdoor** (glassdoor.com)
- **ZipRecruiter** (ziprecruiter.com)
- **SmartRecruiters** (smartrecruiters.com)

#### Medium Support (85%+ confidence)

- **SuccessFactors** (successfactors.com, sapsf.com)
- **Oracle HCM** (oracle.com/recruitment)
- **UltiPro** (ultipro.com)
- **Taleo** (taleo.net)
- **iCIMS** (icims.com)
- **BambooHR** (bamboohr.com)
- **Jobvite** (jobvite.com)

#### Generic Support (55%+ confidence)

- **Any job application page** with standard form elements

### Common Issues

- **"Mistral API key not configured"**: Update `src/config.js` with your actual API key
- **"Network error"**: Check your internet connection and Mistral API status
- **"HTTP 401"**: Invalid API key - verify it's correct and active
- **"HTTP 429"**: Rate limit exceeded - wait a few minutes before trying again
- **"Form not ready"**: Wait for the page to fully load before trying auto-apply
- **"No apply button found"**: Some forms might need manual submission after filling

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

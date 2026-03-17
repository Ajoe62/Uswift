# Mistral AI API Configuration Guide

This guide will help you configure the Mistral AI API key for the Uswift Chrome Extension to enable AI-powered features.

## Why Do I Need This?

The Uswift extension uses Mistral AI to power several intelligent features:
- **AI Chat Assistant** - Get career advice and job search guidance
- **Resume Enhancement** - Optimize your resume with AI suggestions
- **Cover Letter Generation** - Create personalized cover letters
- **Interview Preparation** - Get AI-powered interview practice
- **Job Description Analysis** - Understand job requirements better

## Getting Your Mistral API Key

1. **Sign up for Mistral AI**
   - Go to [https://console.mistral.ai/](https://console.mistral.ai/)
   - Create a free account

2. **Get Your API Key**
   - Navigate to "API Keys" section
   - Click "Create new key"
   - Copy your API key (it starts with something like `7VOMtyR...`)

3. **Keep It Safe**
   - Your API key is like a password - don't share it publicly
   - Don't commit it to version control if contributing to the project

## Configuration Methods

### Method 1: Using config.js (Recommended for Development)

1. Open `extension/public/config.js`
2. Find line 17:
   ```javascript
   apiKey: "your-api-key-here",
   ```
3. Replace `"your-api-key-here"` with your actual API key:
   ```javascript
   apiKey: "your-mistral-api-key-here",
   ```
4. Save the file
5. Rebuild the extension:
   ```bash
   cd extension
   npm run build
   ```
6. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Click the reload icon on the Uswift extension

### Method 2: Using .env File (Recommended for Production)

1. Copy `.env.example` to `.env` in the extension folder:
   ```bash
   cd extension
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```bash
   VITE_MISTRAL_API_KEY=your-actual-api-key-here
   ```

3. Rebuild the extension:
   ```bash
   npm run build
   ```

4. Reload the extension in Chrome

### Method 3: Direct Edit in Built Extension (Quick Fix)

If the extension is already built and loaded:

1. Navigate to `extension/dist/config.js`
2. Edit line 17 to add your API key
3. Go to `chrome://extensions/`
4. Click reload on the Uswift extension

> **Note:** This method is temporary - changes will be overwritten on next build

## Verifying Configuration

1. Open the extension popup
2. Open Chrome DevTools (right-click popup → Inspect)
3. Check the Console tab
4. You should see: `✅ Initializing Mistral client with config:`
5. If you see `🚨 Mistral API Key not configured!`, the setup isn't complete

## Troubleshooting

### Error: "Mistral API key not configured"

**Solution:**
1. Verify your API key is correctly set in `public/config.js` or `.env`
2. Make sure there are no extra spaces or quotes
3. Rebuild the extension: `npm run build`
4. Reload the extension in Chrome

### Error: "HTTP 401: Unauthorized"

**Possible causes:**
- API key is invalid or expired
- API key has extra characters or is truncated

**Solution:**
- Generate a new API key from Mistral console
- Double-check the entire key is copied correctly

### Error: "Network error" or "CORS error"

**Possible causes:**
- Mistral API is down (rare)
- Internet connection issues

**Solution:**
- Check your internet connection
- Try again in a few minutes
- Verify Mistral API status at [https://status.mistral.ai/](https://status.mistral.ai/)

### Features Still Not Working After Setup

**Checklist:**
1. ✅ API key is set in config.js or .env
2. ✅ Extension was rebuilt: `npm run build`
3. ✅ Extension was reloaded in chrome://extensions/
4. ✅ No console errors visible in DevTools
5. ✅ API key is valid (test at Mistral console)

## API Key Best Practices

### For Development
- Use `.env` file and add it to `.gitignore`
- Never commit API keys to version control
- Use separate API keys for development and production

### For Distribution
- Don't include API keys in published extensions
- Consider using a backend proxy for API calls
- Implement rate limiting to prevent abuse

### For Users
- Each user should get their own API key
- Provide clear instructions on how to configure it
- Consider a settings page in the extension for easy configuration

## Free Tier Limits

Mistral AI offers a generous free tier:
- **Free Credits:** New accounts get free credits to start
- **Rate Limits:** Reasonable limits for personal use
- **Models:** Access to mistral-tiny, mistral-small, and mistral-medium

Monitor your usage at: [https://console.mistral.ai/usage](https://console.mistral.ai/usage)

## Need Help?

- **Mistral Documentation:** [https://docs.mistral.ai/](https://docs.mistral.ai/)
- **Uswift Issues:** [https://github.com/your-repo/issues](https://github.com/your-repo/issues)
- **Extension Logs:** Check browser console in DevTools

## Alternative: Using Dashboard API Proxy

If you prefer not to use API keys in the extension, you can route AI requests through the Next.js dashboard:

1. Configure Mistral API key in dashboard environment variables
2. Update extension to call dashboard API endpoints
3. Dashboard acts as a secure proxy

See `dashboard/app/api/mistral/` for proxy implementation examples.

# 🚀 Uswift Chrome Extension - Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- Chrome browser (or any Chromium-based browser)
- Mistral AI API key ([Get one here](https://console.mistral.ai/))
- Supabase project ([Create one here](https://app.supabase.com/))

---

## ⚙️ Installation Steps

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your actual credentials:

```env
# REQUIRED: Mistral AI Configuration
VITE_MISTRAL_API_KEY=your-actual-mistral-api-key
VITE_MISTRAL_BASE_URL=https://api.mistral.ai

# REQUIRED: Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
```

#### 🔑 Getting Your API Keys

**Mistral AI API Key:**
1. Go to [console.mistral.ai](https://console.mistral.ai/)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy and paste into `.env` file

**Supabase Configuration:**
1. Go to [app.supabase.com](https://app.supabase.com/)
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy "Project URL" → paste as `VITE_SUPABASE_URL`
5. Copy "anon public" key → paste as `VITE_SUPABASE_ANON_KEY`

### 3. Build the Extension

For development (with hot reload):

```bash
npm run dev
```

For production build:

```bash
npm run build
```

This will create a `dist/` folder with the compiled extension.

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `extension/dist/` folder
5. The Uswift extension should now appear in your extensions list! 🎉

---

## 🔧 Configuration Options

### Feature Flags

Enable or disable specific features in `.env`:

```env
# Feature Flags (true/false)
VITE_ENABLE_AUTO_APPLY=true          # Enable auto-apply functionality
VITE_ENABLE_AI_FEATURES=true         # Enable AI tools (chat, resume, etc.)
VITE_ENABLE_FILE_UPLOADS=true        # Enable file manager
VITE_ENABLE_CLOUD_SYNC=true          # Enable Supabase cloud sync
```

### Rate Limiting

Prevent excessive API usage:

```env
# Rate Limits (calls per time period)
VITE_AI_RATE_LIMIT=10                # Max AI calls per minute
VITE_AUTO_APPLY_RATE_LIMIT=20        # Max auto-applies per hour
```

### Debug Mode

Enable detailed logging for development:

```env
VITE_DEBUG_MODE=true
NODE_ENV=development
```

---

## 📁 Project Structure

```
extension/
├── src/
│   ├── Popup.tsx                 # Main popup UI
│   ├── content.ts                # Content script (auto-apply engine)
│   ├── background.ts             # Background service worker
│   ├── Auth.tsx                  # Authentication component
│   ├── ChatInterface.tsx         # AI chat assistant
│   ├── ResumeEnhancement.tsx     # Resume AI tool
│   ├── CoverLetterGenerator.tsx  # Cover letter AI tool
│   ├── JobAnalysis.tsx           # Job analysis tool
│   ├── InterviewPrep.tsx         # Interview preparation tool
│   ├── JobTracker.tsx            # Application tracker
│   ├── FileManager.tsx           # File upload manager
│   ├── ProfileVault.tsx          # User profile manager
│   ├── api/
│   │   └── mistral.ts            # Mistral AI client
│   ├── config/
│   │   └── validateEnv.ts        # Environment validation
│   ├── hooks/
│   │   └── useAuth.ts            # Authentication hook
│   └── supabaseClient.ts         # Supabase client
├── public/
│   └── manifest.json             # Chrome extension manifest
├── dist/                         # Build output (generated)
├── .env                          # Your local environment variables (DO NOT COMMIT)
├── .env.example                  # Example environment file
├── package.json
├── vite.config.ts
└── SETUP.md                      # This file
```

---

## 🧪 Testing the Extension

### 1. Test Authentication

1. Click the extension icon in Chrome toolbar
2. Sign up with a new account
3. Check your email for verification (if enabled)
4. Sign in with your credentials

### 2. Test Auto-Apply

1. Navigate to a job board (LinkedIn, Indeed, Greenhouse, etc.)
2. Go to a job posting page
3. Click the extension icon
4. Click "Auto Apply" button
5. Watch as the extension fills the form automatically! ✨

### 3. Test AI Features

**AI Chat:**
- Click extension icon → "AI Assistant"
- Try quick prompts or ask custom questions

**Resume Enhancement:**
- Click extension icon → "Resume Enhancement"
- Paste your resume content
- Click "Enhance My Resume"

**Cover Letter Generator:**
- Click extension icon → "Cover Letter"
- Enter job details and resume
- Generate tailored cover letter

---

## 🐛 Troubleshooting

### "Invalid extension configuration" Error

**Cause:** Missing or invalid environment variables

**Fix:**
1. Open `.env` file
2. Verify all required variables are set
3. Make sure API keys don't contain placeholder text like "your-key-here"
4. Rebuild the extension: `npm run build`
5. Reload extension in Chrome

### "Mistral API key not configured" Error

**Cause:** Mistral API key is missing or invalid

**Fix:**
1. Get a valid API key from [console.mistral.ai](https://console.mistral.ai/)
2. Update `VITE_MISTRAL_API_KEY` in `.env`
3. Rebuild: `npm run build`

### "Supabase configuration missing" Warning

**Cause:** Supabase URL or anon key not configured

**Fix:**
1. Get credentials from [app.supabase.com](https://app.supabase.com/)
2. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Rebuild: `npm run build`

### Extension Not Loading

**Fix:**
1. Make sure you built the extension: `npm run build`
2. Check that `dist/` folder exists and contains files
3. In Chrome extensions, click "Reload" button under Uswift
4. Check browser console (F12) for errors

### Auto-Apply Not Working

**Fix:**
1. Check if the job board is supported (see content.ts for list)
2. Open browser console (F12) on the job page
3. Look for Uswift debug logs
4. Make sure profile is complete (name, email, resume, etc.)

---

## 🔒 Security Notes

- **Never commit `.env` file** to version control (already in .gitignore)
- **Keep API keys secure** - don't share them publicly
- **Use environment-specific keys** for development vs. production
- **Rotate keys regularly** for security best practices
- **Monitor API usage** to prevent unexpected charges

---

## 📚 Additional Resources

- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Supabase Documentation](https://supabase.com/docs)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Vite Documentation](https://vitejs.dev/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check this SETUP.md file
2. Review the error messages in browser console
3. Verify your `.env` configuration
4. Check that all dependencies are installed: `npm install`
5. Try a clean rebuild: `rm -rf dist && npm run build`

---

## 🎉 Success!

If you've completed all steps, your Uswift extension should be fully functional:

✅ Authentication working
✅ Auto-apply detecting and filling forms
✅ AI features responding to queries
✅ Cloud sync saving your data
✅ File uploads working

Happy job hunting! 🚀

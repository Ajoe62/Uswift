# 🚀 Uswift Extension - Quick Start Guide

## ⚡ 60-Second Setup

### Step 1: Get Your API Key
Visit [https://console.mistral.ai/](https://console.mistral.ai/) and create a free account to get your API key.

### Step 2: Configure
Open `extension/public/config.js` and update line 17:
```javascript
apiKey: "YOUR_ACTUAL_API_KEY_HERE",
```

### Step 3: Build
```bash
cd extension
npm install
npm run build
```

### Step 4: Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist/` folder

### Step 5: Test
Click the extension icon and try the AI Chat tab!

---

## ✅ Verify Your Setup

Run this command to check everything:
```bash
npm run verify
```

You should see:
```
✅ CONFIGURATION COMPLETE
🚀 Ready to use!
```

---

## 🎯 Features to Try

### 1. AI Career Assistant (Chat Tab)
- Click the extension icon
- Go to "Chat" tab
- Ask: "Help me prepare for a technical interview"

### 2. Resume Enhancement
- Go to "Resume" tab
- Paste your resume
- Paste a job description
- Click "Enhance Resume"

### 3. Auto-Apply to Jobs
- Navigate to any job posting (LinkedIn, Indeed, etc.)
- Click extension icon
- Go to "Auto-Apply" tab
- Fill in your profile
- Click "Start Auto-Apply"

### 4. Job Tracker
- Go to "Job Tracker" tab
- Add applications manually
- Or sync from auto-apply

---

## 🐛 Common Issues

### "API key not configured" error
**Fix:**
```bash
# 1. Check your config
npm run verify

# 2. Update API key in public/config.js

# 3. Rebuild
npm run build

# 4. Reload extension in chrome://extensions/
```

### "Unsupported job board" error
**Fix:**
- Make sure you're on a job application page
- Open browser console and run: `testJobBoard()`
- Check the platform detection results

### Features not working after update
**Fix:**
```bash
# 1. Clean rebuild
npm run clean
npm run build

# 2. Hard reload extension
# Go to chrome://extensions/
# Click reload icon on Uswift extension
```

---

## 📚 Full Documentation

- **Setup Guide:** [MISTRAL_API_SETUP.md](./MISTRAL_API_SETUP.md)
- **Auto-Apply Guide:** [AUTO_APPLY_GUIDE.md](./AUTO_APPLY_GUIDE.md)
- **Build Guide:** [BUILD.md](./BUILD.md)
- **Main README:** [README.md](./README.md)

---

## 🆘 Need Help?

1. **Check Console:** Right-click extension → Inspect → Console tab
2. **Verify Config:** Run `npm run verify`
3. **Read Docs:** See [MISTRAL_API_SETUP.md](./MISTRAL_API_SETUP.md)
4. **Browser Logs:** Open DevTools on any job page and check for errors

---

## 🎉 You're All Set!

The extension is now ready to help you:
- ✨ Auto-apply to hundreds of jobs
- 🤖 Get AI-powered career advice
- 📄 Optimize your resume
- ✍️ Generate cover letters
- 📊 Track all your applications

Happy job hunting! 🚀

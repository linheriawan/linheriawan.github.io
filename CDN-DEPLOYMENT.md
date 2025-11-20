# 📡 CDN Deployment & Usage Guide

## 🎯 Goal
Test device connections on your production PHP app without modifying any PHP code.

---

## 📦 Option 1: CDN Hosting (Recommended)

### Step 1: Upload to CDN
Upload `device-tester-cdn.html` to any of these services:

**Free CDN Options:**
- **GitHub Pages** (Recommended)
  - Create repo → Upload file → Enable Pages
  - URL: `https://YOUR_USERNAME.github.io/repo-name/device-tester-cdn.html`

- **jsDelivr** (GitHub-based CDN)
  - Upload to GitHub repo
  - Access via: `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/REPO@main/device-tester-cdn.html`

- **Cloudflare Pages** (Free)
  - Deploy via Git or direct upload
  - Custom domain support

- **Netlify** (Free)
  - Drag & drop deployment
  - HTTPS enabled automatically

### Step 2: Load in Production App

**Method A: Console Injection** (Quick Test)
```javascript
// Open production PHP app
// Press F12 → Console → Paste this:

fetch('https://YOUR_CDN_URL/device-tester-cdn.html')
  .then(r => r.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const script = doc.querySelector('script').textContent;
    eval(script);
  });
```

**Method B: Bookmarklet** (One-Click Loading)
```javascript
javascript:(function(){fetch('https://YOUR_CDN_URL/device-tester-cdn.html').then(r=>r.text()).then(html=>{const parser=new DOMParser();const doc=parser.parseFromString(html,'text/html');const script=doc.querySelector('script').textContent;eval(script);});})();
```

**How to create bookmarklet:**
1. Create new bookmark in browser
2. Name it: "Device Tester"
3. URL: Paste the bookmarklet code above (replace YOUR_CDN_URL)
4. To use: Open production app → Click bookmark → Tester appears!

---

## 🚀 Option 2: Direct Script Injection (No CDN Needed)

### Simple Console Injection

Open production app → F12 → Console → Paste this entire block:

```javascript
(function(){if(window.DeviceTesterLoaded){console.log('Already loaded!');return;}window.DeviceTesterLoaded=true;const overlay=document.createElement('div');overlay.id='device-tester-overlay';/* PASTE ENTIRE device-tester-cdn.html SCRIPT HERE */document.body.appendChild(overlay);})();
```

**To get the script:**
```bash
# Extract just the JavaScript from device-tester-cdn.html
cat device-tester-cdn.html | grep -oP '(?<=<script>)[\s\S]*(?=</script>)'
```

---

## 🔧 Option 3: Chrome DevTools Snippets (Best for Frequent Testing)

### Setup Once:
1. Open Chrome DevTools (F12)
2. Go to **Sources** tab
3. Click **Snippets** (left sidebar)
4. Click **+ New snippet**
5. Name it: "Device Tester"
6. Paste the script from `device-tester-cdn.html`
7. Save (Ctrl+S)

### To Use:
1. Open production PHP app
2. F12 → Sources → Snippets
3. Right-click "Device Tester" → **Run**
4. Modal appears!

**Bonus:** Create keyboard shortcut:
- Right-click snippet → "Add to workspace"
- Assign shortcut in DevTools settings

---

## ⚠️ Important Requirements

### 1. **HTTPS Required**
Web Serial/HID/Bluetooth APIs **ONLY work on HTTPS**.

❌ `http://myapp.com` → Won't work
✅ `https://myapp.com` → Will work
✅ `http://localhost` → Will work

**If your production is HTTP:**
- Use ngrok to create HTTPS tunnel
- Or use browser flags (NOT recommended for production)

### 2. **CORS (Cross-Origin Resource Sharing)**
CDN must have proper headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```

**If you control CDN:** Add these headers
**If using GitHub Pages/jsDelivr:** Already configured ✅

### 3. **CSP (Content Security Policy)**
Your PHP app might block external scripts.

**Check console for errors like:**
```
Refused to load script from 'https://cdn...' because it violates CSP
```

**Solutions:**
- Use **bookmarklet** (bypasses CSP)
- Use **DevTools snippets** (bypasses CSP)
- Temporarily disable CSP in browser (F12 → Network → Disable cache)

---

## 📋 Testing Workflow

### For Your Use Case (EDC, Printer, Scale):

1. **Upload to GitHub Pages**
   ```bash
   # Create repo: device-tester
   # Upload: device-tester-cdn.html
   # Enable Pages
   # URL: https://YOUR_USERNAME.github.io/device-tester/device-tester-cdn.html
   ```

2. **Create Bookmarklet**
   ```javascript
   javascript:(function(){fetch('https://YOUR_USERNAME.github.io/device-tester/device-tester-cdn.html').then(r=>r.text()).then(html=>{const d=new DOMParser().parseFromString(html,'text/html');eval(d.querySelector('script').textContent);});})();
   ```

3. **Test on Production**
   - Open PHP app
   - Connect EDC/Printer/Scale via USB
   - Click bookmarklet
   - Modal appears
   - Select device profile
   - Click Connect
   - Test communication!

4. **Debug Any Issues**
   - Check console for errors
   - Verify HTTPS enabled
   - Check if device is USB connected
   - Try different baud rates

---

## 🎯 Quick Setup (5 Minutes)

**Fastest way to test RIGHT NOW:**

1. Open production PHP app in Chrome/Edge
2. Press F12 → Console
3. Paste this (replace URL):

```javascript
fetch('http://localhost:8000/device-tester-cdn.html')
  .then(r => r.text())
  .then(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    eval(doc.querySelector('script').textContent);
  })
  .catch(err => console.error('Load failed:', err));
```

4. Tester appears as modal overlay!
5. Connect your device and test!

---

## 🐛 Troubleshooting

### "Web Serial API not supported"
- Use Chrome or Edge (not Firefox/Safari)
- Ensure HTTPS or localhost

### "Cannot read property of undefined"
- CDN might be blocked by CORS
- Try bookmarklet method instead

### "User gesture required"
- Web Serial needs user interaction
- Can't auto-connect on page load
- Must click "Connect" button

### "Failed to execute 'open' on 'SerialPort'"
- Device already in use by another app
- Close other serial connections
- Unplug/replug device

### Modal doesn't appear
- Check console for errors
- CSP might be blocking
- Try DevTools snippets method

---

## 💡 Pro Tips

1. **Save as Chrome Snippet** for fastest access
2. **Use Bookmarklet** for one-click testing
3. **Host on GitHub Pages** for team access
4. **Check HTTPS** first (most common issue)
5. **Test locally first** before CDN deployment

---

## 🔗 Recommended Setup

For your use case (production PHP + device testing):

1. ✅ Upload to **GitHub Pages** (free, HTTPS, no CORS issues)
2. ✅ Create **Bookmarklet** for easy access
3. ✅ Keep **DevTools Snippet** as backup
4. ✅ Test **locally first** with localhost:8000

This way you can test devices anytime without touching production code!

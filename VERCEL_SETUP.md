# FPL Analyzer - Vercel Proxy Setup Guide

## Problem
The FPL API doesn't have CORS headers enabled for browser requests, which blocks the app from running on GitHub Pages.

## Solution
We've created a serverless proxy function hosted on Vercel that:
- Sits between the browser and the FPL API
- Adds proper CORS headers to responses
- Caches responses to reduce API calls
- Works seamlessly with GitHub Pages

## Setup Instructions

### Step 1: Deploy to Vercel

1. **Sign up for Vercel** (if you haven't already)
   - Go to https://vercel.com/signup
   - Connect your GitHub account

2. **Deploy the FPL Analyzer project**
   ```bash
   # Install Vercel CLI (optional, can also do via web UI)
   npm install -g vercel
   
   # Deploy from the fpl-analyzer directory
   cd /Users/srki/projects/fpl-analyzer
   vercel
   ```
   
   Or via the web UI:
   - Go to https://vercel.com/import
   - Select your GitHub repository (fpl-analyzer)
   - Click "Deploy"
   - Vercel will automatically detect the serverless function in `/api/proxy.js`

3. **Get your Vercel URL**
   - After deployment, Vercel will show you the URL (e.g., `https://fpl-analyzer-xyz.vercel.app`)

### Step 2: Update the Proxy URL

1. Open [fpl-api.js](fpl-api.js)

2. Find this line (around line 4):
   ```javascript
   VERCEL_PROXY: 'https://fpl-analyzer-proxy.vercel.app/api/proxy?url=',
   ```

3. Replace with your actual Vercel URL:
   ```javascript
   VERCEL_PROXY: 'https://your-vercel-url.vercel.app/api/proxy?url=',
   ```

### Step 3: Commit and Push

```bash
cd /Users/srki/projects/fpl-analyzer
git add fpl-api.js vercel.json api/proxy.js
git commit -m "Add Vercel CORS proxy for browser support"
git push origin main
```

### Step 4: GitHub Pages will Auto-Update

GitHub Pages automatically updates when you push changes to the main branch.

## How It Works

### Request Flow:
```
Browser (GitHub Pages)
    ↓
Vercel Proxy (/api/proxy.js)
    ↓
FPL API
    ↓
Vercel Proxy (adds CORS headers)
    ↓
Browser ✅
```

### Proxy Priority (in browser):
1. **Vercel Proxy** (primary - most reliable) ✅
2. Direct FPL API (fallback if Vercel down)
3. Other CORS proxies (as backup)

### Proxy Priority (in Node.js):
1. Direct FPL API (works without proxy)
2. Other CORS proxies (fallback only)

## Verification

After deployment:
1. Go to https://skojic.github.io/fpl-analyzer/
2. Enter your FPL Team ID
3. Click "Continue →"
4. The app should now load your team data! ✅

## Troubleshooting

**Still getting CORS errors?**
- Check the browser console (F12) for the actual error
- Verify the Vercel URL in fpl-api.js matches your deployment
- Test the proxy directly: `https://your-url.vercel.app/api/proxy?url=https%3A%2F%2Ffantasy.premierleague.com%2Fapi%2Fbootstrap-static%2F`

**Proxy URL not found (404)?**
- Ensure you deployed the `/api/proxy.js` file
- Check Vercel dashboard to see deployment logs
- Try redeploying with `vercel --prod`

**Slow loading?**
- First load might be slow (Vercel cold start)
- Subsequent loads are cached (5 min TTL)
- Consider using Vercel's Pro plan for better performance

## Cost
✅ **FREE** - Vercel offers 100 GB-hours of serverless function execution per month, more than enough for this use case.

## Security Notes
- The proxy only allows requests to `fantasy.premierleague.com`
- Returns 400 error for any other domains
- All requests are logged in Vercel dashboard
- No sensitive data stored

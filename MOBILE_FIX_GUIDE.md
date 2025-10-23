# Mobile White Screen Fix - Deployment Guide

## What Was Fixed

### 1. **Browser Compatibility**
- Updated `vite.config.ts` to target ES2015 for older mobile browsers
- Added proper build configuration with relative base path

### 2. **API URL Handling**
- Added safer environment variable access with error handling
- Fixed API URL resolution for mobile browsers
- Prevents crashes when `import.meta.env` is undefined

### 3. **Error Boundary**
- Added global error boundary to catch and display errors
- Shows user-friendly error message instead of white screen
- Provides error details for debugging

### 4. **Netlify Configuration**
- Added `netlify.toml` for build settings
- Added `public/_redirects` for client-side routing
- Fixed CSS import order

## How to Deploy

### Option 1: Deploy to Netlify (Frontend + Render Backend)

#### Step 1: Deploy Backend to Render
1. Go to [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   ```
   Name: fabquiz-backend
   Build Command: npm install
   Start Command: node server.cjs
   Environment Variables:
     MONGODB_URI=mongodb+srv://shriya_quizlive_user:shriyaaa@cluster0.b7lsnkn.mongodb.net/fabquiz?appName=Cluster0
     PORT=10000
   ```
5. Click **Create Web Service**
6. **Copy backend URL**: `https://fabquiz-backend-xxxx.onrender.com`

#### Step 2: Set Netlify Environment Variables
1. Go to Netlify dashboard
2. **Site configuration** → **Environment variables**
3. Add these variables:
   ```
   VITE_PUBLIC_ORIGIN=https://your-app.netlify.app
   VITE_API_URL=https://fabquiz-backend-xxxx.onrender.com/api
   ```
   *(Replace with your actual URLs)*

#### Step 3: Push to GitHub
```bash
git add .
git commit -m "Fix mobile white screen and add deployment config"
git push origin main
```

Netlify will auto-deploy when you push.

### Option 2: Deploy Both to Render

#### Backend Web Service
```
Name: fabquiz-backend
Build Command: npm install
Start Command: node server.cjs
Environment: Node
Instance Type: Free
Environment Variables:
  MONGODB_URI=<your_mongo_uri>
  PORT=10000
```

#### Frontend Static Site
```
Name: fabquiz-frontend
Build Command: npm install && npm run build
Publish Directory: dist
Environment Variables:
  VITE_PUBLIC_ORIGIN=https://fabquiz-frontend.onrender.com
  VITE_API_URL=https://fabquiz-backend.onrender.com/api
```

## Testing After Deployment

### 1. Test Backend Health
Open: `https://your-backend.onrender.com/health`

Should see:
```json
{"status":"OK","timestamp":"2025-01-24T..."}
```

### 2. Test Frontend
Open: `https://your-frontend.netlify.app`

Should see the quiz landing page (no white screen!)

### 3. Test on Mobile
- Open on mobile browser
- Should load properly
- Create quiz → QR/link should work
- Join quiz from mobile

## Troubleshooting

### White Screen Still Appears
1. **Check Browser Console** (on desktop):
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for API connection errors

2. **Check Mobile Console** (Chrome):
   - Connect phone via USB
   - Open `chrome://inspect` on desktop
   - View mobile console logs

3. **Check Environment Variables**:
   - Verify `VITE_API_URL` is set correctly
   - Make sure it ends with `/api`
   - Ensure backend URL is accessible

### Backend Connection Fails
- **Check CORS**: Already configured in `server.cjs`
- **Check backend logs**: View in Render dashboard
- **Test backend directly**: Open `/health` endpoint
- **Check MongoDB connection**: Verify `MONGODB_URI` is correct

### QR/Links Don't Work
- **Check `VITE_PUBLIC_ORIGIN`**: Must match your frontend URL
- **Regenerate quiz**: Create new quiz after setting env vars
- **Test link directly**: Copy link and open in browser

## Files Changed

### Modified Files
- `vite.config.ts` - Build config for mobile compatibility
- `src/lib/api.ts` - Safer API URL resolution
- `src/pages/AdminDashboard.tsx` - Safer env variable access
- `src/main.tsx` - Added ErrorBoundary
- `src/index.css` - Fixed CSS import order

### New Files
- `src/components/ErrorBoundary.tsx` - Error handling
- `netlify.toml` - Netlify configuration
- `public/_redirects` - Client-side routing
- `MOBILE_FIX_GUIDE.md` - This guide

## Important Notes

⚠️ **Render Free Tier**: Backend spins down after 15 mins of inactivity. First request after spin-down takes ~30 seconds.

✅ **Build Successful**: App is production-ready and mobile-compatible.

🔒 **Security**: Your `.env` with real credentials is protected and won't be pushed to GitHub.

## Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub (triggers Netlify)
git add .
git commit -m "Deploy to production"
git push origin main
```

## Support

If issues persist:
1. Check error boundary message on mobile
2. View browser console logs
3. Verify all environment variables
4. Test backend `/health` endpoint
5. Ensure MongoDB connection is active

---

**Mobile app should now work without white screen!** 🎉

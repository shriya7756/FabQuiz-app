# Image Display Troubleshooting Guide

## ✅ All Fixes Applied

The following changes have been made to fix image display:

1. ✅ Added `image_url` to quiz retrieval endpoints
2. ✅ Created `getImageUrl()` helper function
3. ✅ Improved CORS configuration
4. ✅ Added comprehensive logging
5. ✅ Added error handling for images

## 🔧 CRITICAL: You MUST Restart Both Servers!

### Step 1: Stop Everything
- Press `Ctrl+C` in BOTH command windows (server and frontend)

### Step 2: Restart Backend Server
```bash
cd c:\Users\HP\Downloads\Fabquiz-app\FabQuiz-app-main
node server.cjs
```

**Expected Output:**
```
Server running on port 3001
Connected to MongoDB (or "No MONGODB_URI found...")
```

### Step 3: Restart Frontend (in a NEW CMD window)
```bash
cd c:\Users\HP\Downloads\Fabquiz-app\FabQuiz-app-main
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

## 🧪 Testing Steps

### Test 1: Verify Uploads Directory
1. Check if `uploads` folder exists in your project root
2. If not, the server will create it automatically when you upload an image

### Test 2: Create Quiz with Image
1. Go to `http://localhost:5173/`
2. Login/authenticate
3. Go to Admin Dashboard
4. Create a new question
5. **Upload an image** (JPG, PNG, GIF, or WebP, max 5MB)
6. You should see the image preview immediately
7. Add the question
8. Generate quiz code

**Check Server Console:**
You should see:
```
Image uploaded successfully: /uploads/question-xxxxx.jpg
File saved to: C:\Users\HP\Downloads\Fabquiz-app\FabQuiz-app-main\uploads\question-xxxxx.jpg
Creating questions with images: [{ text: '...', hasImage: true, imageUrl: '/uploads/...' }]
```

### Test 3: Join Quiz as Participant
1. Copy the quiz code
2. Open a new browser tab (or use incognito mode)
3. Go to `http://localhost:5173/join/YOURCODE`
4. Fill in participant details
5. Join the quiz

**Check Server Console:**
You should see:
```
Returning quiz by code: YOURCODE
Questions with images: [{ text: '...', hasImage: true, imageUrl: '/uploads/...' }]
```

### Test 4: Verify Image Display
1. When the quiz starts, you should see the image
2. Open browser console (F12)
3. Look for these logs:
   ```
   Quiz data loaded: {...}
   Questions with images: [...]
   Current question has image: { questionText: '...', imageUrl: '/uploads/...', fullImageUrl: 'http://localhost:3001/uploads/...' }
   ```

**Check Server Console:**
You should see:
```
Image request: /question-xxxxx.jpg
```

## 🔍 Debugging

### If Images Still Don't Show:

#### Check 1: Browser Console (F12)
Look for errors like:
- `Failed to load resource` → Image file doesn't exist
- `CORS error` → Server not running or CORS issue
- `404 Not Found` → Wrong URL

#### Check 2: Network Tab (F12 → Network)
1. Filter by "Img"
2. Look for requests to `/uploads/...`
3. Check the status:
   - **200 OK** = Image loaded successfully ✅
   - **404 Not Found** = Image file missing ❌
   - **Failed** = Server not running ❌

#### Check 3: Direct Image URL Test
1. Find the image URL in console (e.g., `http://localhost:3001/uploads/question-xxxxx.jpg`)
2. Copy and paste it directly in browser
3. If you see the image → Server is working correctly
4. If you get 404 → Image file is missing

#### Check 4: Verify Image File Exists
```bash
cd c:\Users\HP\Downloads\Fabquiz-app\FabQuiz-app-main\uploads
dir
```
You should see files like `question-1234567890-123456789.jpg`

#### Check 5: Test Uploads List Endpoint
Open in browser: `http://localhost:3001/api/uploads/list`

You should see:
```json
{
  "uploadsDir": "C:\\Users\\HP\\Downloads\\Fabquiz-app\\FabQuiz-app-main\\uploads",
  "files": ["question-xxxxx.jpg", ...],
  "count": 1
}
```

## 🐛 Common Issues & Solutions

### Issue: "Image uploaded successfully" but preview doesn't show
**Solution:** The image URL helper might have an issue. Check browser console for the actual URL being used.

### Issue: Image shows in admin but not for participants
**Solution:** 
1. Make sure you restarted the server after the fixes
2. Check that the quiz was created AFTER restarting
3. Old quizzes won't have image URLs

### Issue: 404 error on image
**Solution:**
1. Verify file exists in `uploads/` folder
2. Check file permissions
3. Make sure server is running on port 3001

### Issue: CORS error
**Solution:** Server must be restarted to apply new CORS settings

### Issue: Image URL is null or undefined
**Solution:** 
1. Check server console when creating quiz
2. Verify `image_url` is in the formatted questions
3. Make sure you uploaded an image before adding the question

## 📝 Important Notes

1. **Always restart BOTH servers** after code changes
2. **Create NEW quizzes** after fixes - old quizzes won't have images
3. **Check server console** for detailed logging
4. **Use browser DevTools** (F12) to debug
5. Images are stored in `uploads/` directory (not in database)
6. Image URLs are relative paths like `/uploads/question-xxxxx.jpg`

## ✨ Expected Behavior

When everything works correctly:

1. **Upload**: Image appears in preview immediately
2. **Create**: Server logs show image URL being saved
3. **Join**: Server logs show image URL being returned
4. **Play**: Image displays in quiz, browser console shows full URL
5. **Network**: Image request returns 200 OK

If ANY step fails, check the corresponding section above!

# 🚀 Quick Start - Image Upload Fix

## ⚠️ IMPORTANT: Follow These Steps EXACTLY

### Step 1: Restart Backend Server ⚡

**Stop the current server** (press `Ctrl+C` in the server window)

Then run:
```bash
cd c:\Users\HP\Downloads\Fabquiz-app\FabQuiz-app-main
node server.cjs
```

✅ **You should see:**
```
Server running on port 3001
Connected to MongoDB
```

---

### Step 2: Restart Frontend ⚡

**Stop the current dev server** (press `Ctrl+C` in the frontend window)

Then run:
```bash
cd c:\Users\HP\Downloads\Fabquiz-app\FabQuiz-app-main
npm run dev
```

✅ **You should see:**
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### Step 3: Test Image Upload 🧪

**Option A: Use Test Page (Recommended)**
1. Open in browser: `file:///c:/Users/HP/Downloads/Fabquiz-app/FabQuiz-app-main/test-image.html`
2. Click "Test Server" - should show ✅
3. Click "List Uploads" - shows uploaded files
4. Select an image and click "Upload Image"
5. If successful, you'll see the image preview

**Option B: Use Main App**
1. Go to `http://localhost:5173/`
2. Login and go to Admin Dashboard
3. Create a question
4. Upload an image (you'll see preview)
5. Add the question
6. Generate quiz code

---

### Step 4: Test as Participant 👥

1. Copy the quiz code
2. Open new browser tab (or incognito)
3. Go to `http://localhost:5173/join/YOURCODE`
4. Fill in details and join
5. **Images should now display!** 🎉

---

## 🔍 Quick Debugging

### Images Not Showing?

**Check 1: Browser Console (Press F12)**
```
Should see:
✅ Quiz data loaded: {...}
✅ Questions with images: [...]
✅ Current question has image: {...}

Should NOT see:
❌ Failed to load image
❌ 404 Not Found
❌ CORS error
```

**Check 2: Server Console**
```
Should see when creating quiz:
✅ Image uploaded successfully: /uploads/question-xxxxx.jpg
✅ Creating questions with images: [...]

Should see when joining quiz:
✅ Returning quiz by code: XXXXX
✅ Questions with images: [...]

Should see when viewing question:
✅ Image request: /question-xxxxx.jpg
```

**Check 3: Network Tab (F12 → Network → Img)**
- Look for requests to `/uploads/...`
- Status should be **200 OK** ✅
- If **404** → Image file missing ❌
- If **Failed** → Server not running ❌

---

## ✅ What Was Fixed

1. **Server**: Added `image_url` to quiz retrieval endpoints
2. **Server**: Improved CORS for image serving
3. **Server**: Added comprehensive logging
4. **Frontend**: Created `getImageUrl()` helper
5. **Frontend**: Updated ParticipantQuiz to display images
6. **Frontend**: Added error handling

---

## 📋 Checklist

Before testing, make sure:
- [ ] Both servers are **restarted** (not just refreshed!)
- [ ] Server is running on port **3001**
- [ ] Frontend is running on port **5173**
- [ ] You're creating a **NEW quiz** (old quizzes won't have images)
- [ ] Image file is **less than 5MB**
- [ ] Image format is **JPG, PNG, GIF, or WebP**

---

## 🆘 Still Not Working?

1. **Read**: `IMAGE_TROUBLESHOOTING.md` for detailed debugging
2. **Test**: Open `test-image.html` in browser to verify server
3. **Check**: Browser console (F12) for errors
4. **Verify**: Server console for logs
5. **Confirm**: Image file exists in `uploads/` folder

---

## 💡 Pro Tips

- Use **browser DevTools** (F12) to see what's happening
- Check **both** browser console AND server console
- Create **new quizzes** after restarting servers
- Test with **small images** first (< 1MB)
- Use the **test page** to verify upload works

---

## 🎯 Expected Flow

1. **Upload** → See preview immediately
2. **Create Quiz** → Server logs image URL
3. **Join Quiz** → Server returns image URL
4. **Play Quiz** → Image displays in question
5. **Browser** → Shows image loaded (200 OK)

If ANY step fails, something is wrong! Check the troubleshooting guide.

---

**Good luck! The images should work now! 🚀**

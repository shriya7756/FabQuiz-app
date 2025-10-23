# FabQuiz - Real-time Quiz Platform

Create engaging quizzes with real-time leaderboards, QR code sharing, and instant feedback.

## Features

- 🎯 Real-time quiz sessions
- 📊 Live leaderboards
- 📱 QR code sharing
- 🔐 User authentication
- 📈 Results analytics
- 💬 Feedback system

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + Node.js
- **Database**: MongoDB
- **UI**: TailwindCSS + shadcn/ui

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

⚠️ **IMPORTANT: Never commit your `.env` file to Git!**

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual credentials
# Use a text editor to add your MongoDB URI and other keys
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
node server.cjs
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit: `http://localhost:8080`

## Environment Variables

Your `.env` file should contain:

- `MONGODB_URI` - Your MongoDB connection string
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)
- Other optional keys for Supabase, EmailJS, etc.

**🔒 Security Note**: The `.env` file is already in `.gitignore` and will NOT be pushed to GitHub. Only `.env.example` (with placeholder values) is committed.

## Deployment

When deploying, set environment variables in your hosting platform:
- Vercel/Netlify: Add in dashboard settings
- Heroku: Use `heroku config:set`
- Docker: Pass via docker-compose or runtime

## Project Structure

```
fabquiz-app/
├── src/              # Frontend React code
├── server.cjs        # Express backend
├── models/           # MongoDB models
├── .env             # Your secrets (NOT in Git)
├── .env.example     # Template (safe to commit)
└── ...
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

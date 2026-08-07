const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import models
const User = require('./models/User.cjs');
const Quiz = require('./models/Quiz.cjs');
const Question = require('./models/Question.cjs');
const Participant = require('./models/Participant.cjs');
const Response = require('./models/Response.cjs');
const Feedback = require('./models/Feedback.cjs');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ============= SOCKET.IO SETUP =============
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track active quiz rooms: quizId -> Set of socket IDs
const quizRooms = new Map();

// Helper: compute leaderboard for a quiz
async function computeLeaderboard(quizId) {
  const participants = await Participant.find({ quizId });
  const leaderboard = await Promise.all(
    participants.map(async (p) => {
      const responses = await Response.find({ participantId: p._id }).populate('questionId');
      const score = responses.reduce((sum, r) => {
        return sum + (r.isCorrect && r.questionId ? r.questionId.marks : 0);
      }, 0);
      const correct = responses.filter(r => r.isCorrect).length;
      const accuracy = responses.length > 0 ? (correct / responses.length) * 100 : 0;
      return {
        participantId: p._id,
        name: p.name,
        score,
        accuracy: Math.round(accuracy * 10) / 10,
        correctAnswers: correct,
        totalAnswers: responses.length,
      };
    })
  );
  leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.accuracy - a.accuracy;
  });
  return leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

// Helper: broadcast leaderboard update to quiz room
async function broadcastLeaderboard(quizId) {
  try {
    const leaderboard = await computeLeaderboard(quizId);
    io.to(`quiz:${quizId}`).emit('leaderboard_update', { quizId, leaderboard, timestamp: Date.now() });
    console.log(`📡 Broadcast leaderboard for quiz ${quizId} to ${io.sockets.adapter.rooms.get(`quiz:${quizId}`)?.size || 0} clients`);
    return leaderboard;
  } catch (err) {
    console.error('Failed to broadcast leaderboard:', err);
    return [];
  }
}

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Participant/admin joins a quiz room
  socket.on('join_quiz_room', async ({ quizId, participantId, name }) => {
    const room = `quiz:${quizId}`;
    socket.join(room);
    console.log(`👥 ${name || socket.id} joined room ${room}`);

    // Track room membership
    if (!quizRooms.has(quizId)) quizRooms.set(quizId, new Set());
    quizRooms.get(quizId).add(socket.id);

    const participantCount = quizRooms.get(quizId).size;

    // Notify room about new participant
    io.to(room).emit('participant_joined', {
      participantId,
      name,
      participantCount,
      timestamp: Date.now(),
    });

    // Send current leaderboard to the newly joined client
    if (mongoose.connection.readyState === 1) {
      try {
        const leaderboard = await computeLeaderboard(quizId);
        socket.emit('leaderboard_update', { quizId, leaderboard, timestamp: Date.now() });
      } catch (e) { /* ignore */ }
    }
  });

  // Answer submitted event (can also be triggered from REST route)
  socket.on('answer_submitted', async ({ quizId, participantId, questionId, optionId, isCorrect }) => {
    console.log(`✅ Answer submitted via socket: participant=${participantId}, correct=${isCorrect}`);
    // Broadcast updated leaderboard to all in room
    if (mongoose.connection.readyState === 1 && quizId) {
      await broadcastLeaderboard(quizId);
    }
  });

  // Admin triggers quiz complete
  socket.on('quiz_complete', ({ quizId }) => {
    io.to(`quiz:${quizId}`).emit('quiz_completed', { quizId, timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    // Clean up room tracking
    quizRooms.forEach((socketIds, quizId) => {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) quizRooms.delete(quizId);
      }
    });
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// ============= MIDDLEWARE =============
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
  console.log('Image request:', req.url);
  next();
}, express.static(uploadsDir, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000');
  },
}));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============= MONGODB CONNECTION =============
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️  No MONGODB_URI found — running without MongoDB (all DB calls will fail)');
}

// ============= AUTH ROUTES =============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: 'user',
      });
    }
    res.status(200).json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= IMAGE UPLOAD ROUTE =============
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('✅ Image uploaded:', imageUrl);
    res.status(200).json({ imageUrl, filename: req.file.filename, size: req.file.size });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
});

// List uploads
app.get('/api/uploads/list', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.status(200).json({ uploadsDir, files, count: files.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list uploads' });
  }
});

// ============= QUIZ ROUTES =============
app.post('/api/quizzes/create', async (req, res) => {
  try {
    const { title, questions, adminId } = req.body;
    if (!title || !questions || !adminId) return res.status(400).json({ message: 'Missing required fields' });
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ message: 'At least one question is required' });

    const quizCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const quiz = await Quiz.create({ code: quizCode, title, adminId, status: 'active' });

    const questionData = questions.map((q, index) => ({
      quizId: quiz._id,
      questionText: q.question_text,
      imageUrl: q.image_url || null,
      options: q.options.map(opt => ({ optionText: opt.option_text, isCorrect: opt.is_correct })),
      marks: q.marks || 1,
      timeLimit: q.time_limit || 30,
      order: index,
    }));

    const questionDocs = await Question.insertMany(questionData);

    res.status(201).json({
      quiz: {
        _id: quiz._id,
        code: quiz.code,
        title: quiz.title,
        adminId: quiz.adminId,
        questions: questionDocs.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          imageUrl: q.imageUrl,
          options: q.options,
          marks: q.marks,
          timeLimit: q.timeLimit,
        })),
      },
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get quiz by code
app.get('/api/quizzes/code/:code', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ code: req.params.code.toUpperCase() });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    res.status(200).json({
      quiz: {
        _id: quiz._id,
        code: quiz.code,
        title: quiz.title,
        status: quiz.status,
        questions: questions.map(q => ({
          _id: q._id,
          question_text: q.questionText,
          image_url: q.imageUrl,
          marks: q.marks,
          time_limit: q.timeLimit,
          options: q.options.map(o => ({ _id: o._id, option_text: o.optionText, is_correct: o.isCorrect })),
        })),
      },
    });
  } catch (error) {
    console.error('Get quiz by code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quiz by ID
app.get('/api/quizzes/id/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    res.status(200).json({
      quiz: {
        _id: quiz._id,
        code: quiz.code,
        title: quiz.title,
        status: quiz.status,
        questions: questions.map(q => ({
          _id: q._id,
          question_text: q.questionText,
          image_url: q.imageUrl,
          marks: q.marks,
          time_limit: q.timeLimit,
          options: q.options.map(o => ({ _id: o._id, option_text: o.optionText, is_correct: o.isCorrect })),
        })),
      },
    });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.status(200).json({ quizzes });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= PARTICIPANT ROUTES =============
app.post('/api/participants/join', async (req, res) => {
  try {
    const { quizCode, name, email, phoneNumber, college, branch, year } = req.body;
    if (!quizCode || !name || !email || !phoneNumber || !college || !branch || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (phoneNumber.length < 10) return res.status(400).json({ message: 'Invalid phone number' });

    const quiz = await Quiz.findOne({ code: quizCode.toUpperCase() });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const existingParticipant = await Participant.findOne({ quizId: quiz._id, email: email.toLowerCase() });
    if (existingParticipant) {
      return res.status(409).json({ message: 'You have already joined this quiz', participantId: existingParticipant._id });
    }

    const participant = await Participant.create({
      quizId: quiz._id, name, email: email.toLowerCase(), phoneNumber, college, branch, year,
    });

    // Broadcast to quiz room via Socket.IO
    io.to(`quiz:${quiz._id}`).emit('participant_joined', {
      participantId: participant._id,
      name: participant.name,
      timestamp: Date.now(),
    });

    res.status(200).json({
      participant: { _id: participant._id, name: participant.name, email: participant.email, quizId: quiz._id },
    });
  } catch (error) {
    console.error('Join quiz error:', error);
    if (error.code === 11000) return res.status(409).json({ message: 'You have already joined this quiz' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/participants/:id', async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });
    res.status(200).json({ participant });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= RESPONSE ROUTES =============
app.post('/api/responses/submit', async (req, res) => {
  try {
    const { participantId, questionId, selectedOptionId } = req.body;
    if (!participantId || !questionId) return res.status(400).json({ message: 'Missing required fields' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const selectedOption = question.options.id(selectedOptionId);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;

    const response = await Response.create({ participantId, questionId, selectedOptionId, isCorrect });

    // Find the quiz for this question and broadcast real-time leaderboard update
    const participant = await Participant.findById(participantId);
    if (participant) {
      const quizId = participant.quizId.toString();
      // Broadcast updated leaderboard to all clients in this quiz's room
      await broadcastLeaderboard(quizId);
    }

    res.status(200).json({ response: { id: response._id, isCorrect } });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/responses/participant/:participantId', async (req, res) => {
  try {
    const responses = await Response.find({ participantId: req.params.participantId }).populate('questionId');
    res.status(200).json({ responses });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= RESULTS & LEADERBOARD ROUTES =============
app.get('/api/results/:quizId/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const participant = await Participant.findById(participantId);
    const responses = await Response.find({ participantId }).populate('questionId');

    const score = responses.reduce((sum, r) => sum + (r.isCorrect && r.questionId ? r.questionId.marks : 0), 0);
    const accuracy = responses.length > 0 ? (responses.filter(r => r.isCorrect).length / responses.length) * 100 : 0;

    res.status(200).json({
      participant: { name: participant ? participant.name : 'Unknown' },
      score,
      totalQuestions: responses.length,
      accuracy,
      responses: responses.map(r => ({
        questionText: r.questionId ? r.questionId.questionText : '',
        selectedOptionId: r.selectedOptionId,
        isCorrect: r.isCorrect,
        options: r.questionId ? r.questionId.options : [],
      })),
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/leaderboard/:quizId', async (req, res) => {
  try {
    const leaderboard = await computeLeaderboard(req.params.quizId);
    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= FEEDBACK ROUTES =============
app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating) return res.status(400).json({ message: 'Rating is required' });
    await Feedback.create({ rating, comment });
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  const roomStats = {};
  quizRooms.forEach((sockets, quizId) => { roomStats[quizId] = sockets.size; });
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uploadsDir: fs.existsSync(uploadsDir) ? 'exists' : 'missing',
    websockets: {
      totalConnections: io.engine.clientsCount,
      activeRooms: Object.keys(roomStats).length,
      roomParticipants: roomStats,
    },
  });
});

// ============= STATIC FILES =============
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build files not found. Run npm run build first.');
    }
  } else {
    next();
  }
});

// ============= START SERVER =============
server.listen(PORT, () => {
  console.log(`🚀 FabQuiz server running on port ${PORT}`);
  console.log(`🔌 WebSocket (Socket.IO) ready`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

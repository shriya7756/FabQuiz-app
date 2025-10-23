const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User.cjs');
const Quiz = require('./models/Quiz.cjs');
const Question = require('./models/Question.cjs');
const Participant = require('./models/Participant.cjs');
const Response = require('./models/Response.cjs');
const Feedback = require('./models/Feedback.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGODB_URI found, running without MongoDB');
}

// ============= AUTH ROUTES =============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: 'user',
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= QUIZ ROUTES =============
app.post('/api/quizzes/create', async (req, res) => {
  try {
    const { title, questions, adminId } = req.body;

    if (!title || !questions || !adminId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate unique quiz code
    const quizCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const quiz = await Quiz.create({
      code: quizCode,
      title,
      adminId,
      status: 'active',
    });

    // Create questions
    const questionDocs = await Promise.all(
      questions.map((q, index) =>
        Question.create({
          quizId: quiz._id,
          questionText: q.question_text,
          options: q.options.map((opt) => ({
            optionText: opt.option_text,
            isCorrect: opt.is_correct,
          })),
          marks: q.marks || 1,
          timeLimit: q.time_limit || 30,
          order: index,
        })
      )
    );

    res.status(201).json({
      quiz: {
        _id: quiz._id,
        code: quiz.code,
        title: quiz.title,
        adminId: quiz.adminId,
        questions: questionDocs.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
          timeLimit: q.timeLimit,
        })),
      }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quiz by code
app.get('/api/quizzes/code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const quiz = await Quiz.findOne({ code: code.toUpperCase() });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

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
          marks: q.marks,
          time_limit: q.timeLimit,
          options: q.options.map(o => ({ 
            _id: o._id, 
            option_text: o.optionText,
            is_correct: o.isCorrect
          })),
        })),
      }
    });
  } catch (error) {
    console.error('Get quiz by code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quiz by ID
app.get('/api/quizzes/id/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

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
          marks: q.marks,
          time_limit: q.timeLimit,
          options: q.options.map(o => ({ 
            _id: o._id, 
            option_text: o.optionText,
            is_correct: o.isCorrect
          })),
        })),
      }
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
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= PARTICIPANT ROUTES =============
app.post('/api/participants/join', async (req, res) => {
  try {
    const { quizCode, name, email, phoneNumber, college, branch, year } = req.body;

    // Validate required fields
    if (!quizCode || !name || !email || !phoneNumber || !college || !branch || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone number (basic validation)
    if (phoneNumber.length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const quiz = await Quiz.findOne({ code: quizCode.toUpperCase() });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if participant already joined this quiz
    const existingParticipant = await Participant.findOne({ 
      quizId: quiz._id, 
      email: email.toLowerCase() 
    });

    if (existingParticipant) {
      return res.status(409).json({ 
        message: 'You have already joined this quiz',
        participantId: existingParticipant._id 
      });
    }

    // Create new participant
    const participant = await Participant.create({
      quizId: quiz._id,
      name,
      email: email.toLowerCase(),
      phoneNumber,
      college,
      branch,
      year,
    });

    res.status(200).json({
      participant: {
        _id: participant._id,
        name: participant.name,
        email: participant.email,
        quizId: quiz._id,
      }
    });
  } catch (error) {
    console.error('Join quiz error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already joined this quiz' });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/participants/:id', async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.status(200).json({ participant });
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= RESPONSE ROUTES =============
app.post('/api/responses/submit', async (req, res) => {
  try {
    const { participantId, questionId, selectedOptionId } = req.body;

    if (!participantId || !questionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const selectedOption = question.options.id(selectedOptionId);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;

    const response = await Response.create({
      participantId,
      questionId,
      selectedOptionId,
      isCorrect,
    });

    res.status(200).json({
      response: {
        id: response._id,
        isCorrect,
      }
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/responses/participant/:participantId', async (req, res) => {
  try {
    const responses = await Response.find({
      participantId: req.params.participantId,
    }).populate('questionId');

    res.status(200).json({ responses });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ============= RESULTS & LEADERBOARD ROUTES =============
app.get('/api/results/:quizId/:participantId', async (req, res) => {
  try {
    const { quizId, participantId } = req.params;

    const participant = await Participant.findById(participantId);
    const responses = await Response.find({ participantId }).populate('questionId');

    const score = responses.reduce((sum, r) => {
      return sum + (r.isCorrect ? r.questionId.marks : 0);
    }, 0);

    const accuracy = responses.length > 0
      ? (responses.filter(r => r.isCorrect).length / responses.length) * 100
      : 0;

    res.status(200).json({
      participant: {
        name: participant.name,
      },
      score,
      totalQuestions: responses.length,
      accuracy,
      responses: responses.map(r => ({
        questionText: r.questionId.questionText,
        selectedOptionId: r.selectedOptionId,
        isCorrect: r.isCorrect,
        options: r.questionId.options,
      })),
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/leaderboard/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    const participants = await Participant.find({ quizId });
    
    const leaderboard = await Promise.all(
      participants.map(async (p) => {
        const responses = await Response.find({
          participantId: p._id,
        }).populate('questionId');

        const score = responses.reduce((sum, r) => {
          return sum + (r.isCorrect ? r.questionId.marks : 0);
        }, 0);

        const correctCount = responses.filter(r => r.isCorrect).length;
        const accuracy = responses.length > 0 ? (correctCount / responses.length) * 100 : 0;

        return {
          participantId: p._id,
          name: p.name,
          score,
          accuracy,
        };
      })
    );

    // Sort by score, then accuracy
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.accuracy - a.accuracy;
    });

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

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    await Feedback.create({ rating, comment });

    res.status(201).json({
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch all handler: send back index.html for client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Serving index.html from:', indexPath);
    try {
      if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error('index.html not found at:', indexPath);
        res.status(404).send('Build files not found. Please run npm run build first.');
      }
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(500).send('Internal server error');
    }
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

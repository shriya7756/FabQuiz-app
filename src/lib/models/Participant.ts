import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  timeTaken: {
    type: Number, // in seconds
  },
});

const ParticipantSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  responses: [ResponseSchema],
  score: {
    type: Number,
    default: 0,
  },
  totalPossibleScore: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);

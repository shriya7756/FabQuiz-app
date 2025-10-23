import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  orderIndex: {
    type: Number,
    required: true,
  },
});

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 10,
  },
  orderIndex: {
    type: Number,
    required: true,
  },
  options: [OptionSchema],
});

const QuizSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  title: {
    type: String,
    default: 'Untitled Quiz',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft',
  },
  questions: [QuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
});

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

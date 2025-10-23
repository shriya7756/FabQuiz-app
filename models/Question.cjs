const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  options: [optionSchema],
  marks: {
    type: Number,
    default: 1,
  },
  timeLimit: {
    type: Number,
    default: 30, // in seconds
  },
  order: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Question', questionSchema);

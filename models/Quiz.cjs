const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  title: {
    type: String,
    required: true,
  },
  adminId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'draft'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Quiz', quizSchema);

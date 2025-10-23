import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Participant from '@/lib/models/Participant';
import Quiz from '@/lib/models/Quiz';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await clientPromise;
    await mongoose.connect(process.env.MONGODB_URI!);

    const { participantId, responses } = req.body;

    if (!participantId || !responses) {
      return res.status(400).json({ message: 'Participant ID and responses are required' });
    }

    const participant = await Participant.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Get quiz to calculate score
    const quiz = await Quiz.findById(participant.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let totalScore = 0;
    let totalPossibleScore = 0;

    // Process responses and calculate score
    const processedResponses = responses.map((response: any) => {
      const question = quiz.questions.id(response.questionId);
      if (!question) return null;

      totalPossibleScore += question.marks;

      const selectedOption = question.options.id(response.selectedOptionId);
      const isCorrect = selectedOption ? selectedOption.isCorrect : false;

      if (isCorrect) {
        totalScore += question.marks;
      }

      return {
        questionId: response.questionId,
        selectedOptionId: response.selectedOptionId,
        isCorrect,
        timeTaken: response.timeTaken || 0,
      };
    }).filter(Boolean);

    // Update participant
    participant.responses = processedResponses;
    participant.score = totalScore;
    participant.totalPossibleScore = totalPossibleScore;
    participant.completedAt = new Date();
    await participant.save();

    res.status(200).json({
      score: totalScore,
      totalPossibleScore,
      percentage: totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0,
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

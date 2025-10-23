import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Quiz from '@/lib/models/Quiz';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await clientPromise;
    await mongoose.connect(process.env.MONGODB_URI!);

    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Quiz code is required' });
    }

    const quiz = await Quiz.findOne({ code: code.toUpperCase() });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Return quiz data for participants (without correct answers)
    const quizData = {
      id: quiz._id.toString(),
      code: quiz.code,
      title: quiz.title,
      status: quiz.status,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        questionText: q.questionText,
        marks: q.marks,
        timeLimit: q.timeLimit,
        orderIndex: q.orderIndex,
        options: q.options.map(opt => ({
          id: opt._id.toString(),
          text: opt.text,
          orderIndex: opt.orderIndex,
        })),
      })),
    };

    res.status(200).json({ quiz: quizData });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

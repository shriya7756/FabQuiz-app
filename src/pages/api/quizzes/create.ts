import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Quiz from '@/lib/models/Quiz';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await clientPromise;
    await mongoose.connect(process.env.MONGODB_URI!);

    const { adminId, questions, title } = req.body;

    if (!adminId || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Admin ID and questions are required' });
    }

    // Generate unique quiz code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const quiz = new Quiz({
      adminId,
      code,
      title: title || 'Untitled Quiz',
      status: 'draft',
      questions,
    });

    await quiz.save();

    res.status(201).json({
      quiz: {
        id: quiz._id.toString(),
        code: quiz.code,
        title: quiz.title,
        status: quiz.status,
        questionsCount: quiz.questions.length,
      }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

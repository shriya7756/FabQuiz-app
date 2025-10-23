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

    const { quizId, name, email, sessionId } = req.body;

    if (!quizId || !name || !sessionId) {
      return res.status(400).json({ message: 'Quiz ID, name, and session ID are required' });
    }

    // Verify quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if participant already exists
    let participant = await Participant.findOne({ quizId, sessionId });

    if (!participant) {
      participant = new Participant({
        quizId,
        name,
        email: email || null,
        sessionId,
      });
      await participant.save();
    }

    res.status(200).json({
      participant: {
        id: participant._id.toString(),
        name: participant.name,
        email: participant.email,
        sessionId: participant.sessionId,
      }
    });
  } catch (error) {
    console.error('Join quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

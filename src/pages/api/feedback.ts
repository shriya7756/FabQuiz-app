import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Feedback from '@/lib/models/Feedback';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await clientPromise;
      await mongoose.connect(process.env.MONGODB_URI!);

      const { name, email, message, rating } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      const feedback = new Feedback({
        name: name || null,
        email: email || null,
        message,
        rating: rating || null,
      });

      await feedback.save();

      res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      await clientPromise;
      await mongoose.connect(process.env.MONGODB_URI!);

      const feedbacks = await Feedback.find({})
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({ feedbacks });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

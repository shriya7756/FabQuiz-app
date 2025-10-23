import { z } from 'zod';

export const participantSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores"),
});

export const questionSchema = z.object({
  question_text: z.string()
    .trim()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must be less than 500 characters"),
  marks: z.number()
    .int("Marks must be a whole number")
    .min(1, "Marks must be at least 1")
    .max(100, "Marks cannot exceed 100"),
  time_limit: z.number()
    .int("Time limit must be a whole number")
    .min(10, "Time limit must be at least 10 seconds")
    .max(300, "Time limit cannot exceed 300 seconds (5 minutes)"),
});

export const optionSchema = z.object({
  option_text: z.string()
    .trim()
    .min(1, "Option text is required")
    .max(200, "Option text must be less than 200 characters"),
});

export const quizCodeSchema = z.string()
  .length(6, "Quiz code must be exactly 6 characters")
  .regex(/^[A-Z0-9]+$/, "Quiz code must contain only uppercase letters and numbers");

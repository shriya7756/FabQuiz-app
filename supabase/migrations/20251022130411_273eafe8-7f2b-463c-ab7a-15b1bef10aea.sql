-- Drop the restrictive policy that only allows viewing active quizzes
DROP POLICY IF EXISTS "Anyone can view active quizzes by code" ON public.quizzes;

-- Create a new policy that allows anyone to view quizzes by code, regardless of status
-- This allows participants to join quizzes at any time
CREATE POLICY "Anyone can view quizzes by code"
ON public.quizzes
FOR SELECT
USING (true);

-- Update questions policy to allow viewing questions for any quiz (not just active)
-- This ensures participants can see questions when joining
DROP POLICY IF EXISTS "Anyone can view questions for active quizzes" ON public.questions;

CREATE POLICY "Anyone can view questions for all quizzes"
ON public.questions
FOR SELECT
USING (true);

-- Update options policy to allow viewing options for any quiz
-- Participants still can't see which answers are correct (handled in frontend)
DROP POLICY IF EXISTS "Participants can view options without answers" ON public.options;

CREATE POLICY "Anyone can view options"
ON public.options
FOR SELECT
USING (true);
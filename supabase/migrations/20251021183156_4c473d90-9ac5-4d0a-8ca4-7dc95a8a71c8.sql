-- Comprehensive data cleanup and security fixes

-- Step 1: Clean up all invalid data
-- Delete questions with text shorter than 5 characters
DELETE FROM public.questions WHERE char_length(question_text) < 5;

-- Delete questions with text longer than 500 characters
DELETE FROM public.questions WHERE char_length(question_text) > 500;

-- Update questions with invalid time limits
UPDATE public.questions SET time_limit = 10 WHERE time_limit < 10;
UPDATE public.questions SET time_limit = 300 WHERE time_limit > 300;

-- Update questions with invalid marks
UPDATE public.questions SET marks = 1 WHERE marks < 1;
UPDATE public.questions SET marks = 100 WHERE marks > 100;

-- Delete options with empty or excessively long text
DELETE FROM public.options WHERE char_length(option_text) < 1 OR char_length(option_text) > 200;

-- Step 2: Fix RLS policies for options table
DROP POLICY IF EXISTS "Anyone can view options for active quizzes" ON public.options;

CREATE POLICY "Participants can view options without answers"
ON public.options
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.questions q
    JOIN public.quizzes qz ON qz.id = q.quiz_id
    WHERE q.id = options.question_id
    AND (
      qz.admin_id = auth.uid()
      OR qz.status = 'active'
    )
  )
);

-- Step 3: Fix RLS policies for responses table
DROP POLICY IF EXISTS "Anyone can view responses" ON public.responses;

CREATE POLICY "Admins can view quiz responses"
ON public.responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.participants p
    JOIN public.quizzes q ON q.id = p.quiz_id
    WHERE p.id = responses.participant_id
    AND q.admin_id = auth.uid()
  )
);

-- Step 4: Add database constraints for input validation
ALTER TABLE public.participants
ADD CONSTRAINT participants_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50);

ALTER TABLE public.questions
ADD CONSTRAINT questions_text_length CHECK (char_length(question_text) >= 5 AND char_length(question_text) <= 500),
ADD CONSTRAINT questions_marks_range CHECK (marks >= 1 AND marks <= 100),
ADD CONSTRAINT questions_time_range CHECK (time_limit >= 10 AND time_limit <= 300);

ALTER TABLE public.options
ADD CONSTRAINT options_text_length CHECK (char_length(option_text) >= 1 AND char_length(option_text) <= 200);

ALTER TABLE public.quizzes
ADD CONSTRAINT quizzes_code_length CHECK (char_length(code) = 6);

-- Step 5: Update the database function with proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
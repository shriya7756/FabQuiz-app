-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  code TEXT UNIQUE NOT NULL,
  qr_code_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  time_limit INTEGER NOT NULL DEFAULT 30,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create options table
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Admins can create their own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can view their own quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Admins can update their own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = admin_id);

CREATE POLICY "Anyone can view active quizzes by code"
  ON public.quizzes FOR SELECT
  USING (status = 'active');

-- RLS Policies for questions
CREATE POLICY "Admins can manage questions for their quizzes"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.admin_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view questions for active quizzes"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.status = 'active'
    )
  );

-- RLS Policies for options
CREATE POLICY "Admins can manage options for their questions"
  ON public.options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id
      AND quizzes.admin_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view options for active quizzes"
  ON public.options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id
      AND quizzes.status = 'active'
    )
  );

-- RLS Policies for participants
CREATE POLICY "Anyone can join as a participant"
  ON public.participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view participants"
  ON public.participants FOR SELECT
  USING (true);

-- RLS Policies for responses
CREATE POLICY "Participants can submit their own responses"
  ON public.responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.participants
      WHERE participants.id = responses.participant_id
    )
  );

CREATE POLICY "Anyone can view responses"
  ON public.responses FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_quizzes_code ON public.quizzes(code);
CREATE INDEX idx_quizzes_admin_id ON public.quizzes(admin_id);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_options_question_id ON public.options(question_id);
CREATE INDEX idx_participants_quiz_id ON public.participants(quiz_id);
CREATE INDEX idx_responses_participant_id ON public.responses(participant_id);
CREATE INDEX idx_responses_question_id ON public.responses(question_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quizzes
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
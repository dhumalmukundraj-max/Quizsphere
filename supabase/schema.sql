-- ==============================================================================
-- QUIZSPHERE DATABASE SCHEMA & RLS POLICIES
-- PostgreSQL / Supabase
-- ==============================================================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT NULL CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
    question_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Question Options Table
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL DEFAULT 0
);

-- 5. Correct Answers Table (Confidential - Only Host and Server Evaluation)
CREATE TABLE IF NOT EXISTS public.correct_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL UNIQUE REFERENCES public.questions(id) ON DELETE CASCADE,
    correct_option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Attempts Table
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    participant_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'timed_out'))
);

-- 7. Attempt Answers Table
CREATE TABLE IF NOT EXISTS public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.question_options(id) ON DELETE CASCADE
);

-- 8. Results Table
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL UNIQUE REFERENCES public.attempts(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    obtained_marks INTEGER NOT NULL DEFAULT 0,
    total_marks INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    evaluated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_quizzes_host_id ON public.quizzes(host_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_title_trgm ON public.quizzes USING btree (title);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_correct_answers_question_id ON public.correct_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON public.attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_participant_user_id ON public.attempts(participant_user_id);
CREATE INDEX IF NOT EXISTS idx_results_quiz_id ON public.results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_results_host_id ON public.results(host_id);

-- ==============================================================================
-- AUTO-SYNC USER PROFILE ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER trigger_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correct_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. QUIZZES POLICIES
CREATE POLICY "Published quizzes are viewable by everyone or owned by host"
    ON public.quizzes FOR SELECT
    USING (status = 'published' OR (auth.uid() IS NOT NULL AND auth.uid() = host_id));

CREATE POLICY "Users can create their own quizzes"
    ON public.quizzes FOR INSERT
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own quizzes"
    ON public.quizzes FOR UPDATE
    USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own quizzes"
    ON public.quizzes FOR DELETE
    USING (auth.uid() = host_id);

-- 3. QUESTIONS POLICIES
CREATE POLICY "Questions viewable if quiz is published or owned by host"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = questions.quiz_id
            AND (q.status = 'published' OR q.host_id = auth.uid())
        )
    );

CREATE POLICY "Hosts can manage questions for their quizzes"
    ON public.questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = questions.quiz_id
            AND q.host_id = auth.uid()
        )
    );

-- 4. QUESTION OPTIONS POLICIES
CREATE POLICY "Options viewable if question belongs to viewable quiz"
    ON public.question_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes z ON z.id = q.quiz_id
            WHERE q.id = question_options.question_id
            AND (z.status = 'published' OR z.host_id = auth.uid())
        )
    );

CREATE POLICY "Hosts can manage options for their questions"
    ON public.question_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes z ON z.id = q.quiz_id
            WHERE q.id = question_options.question_id
            AND z.host_id = auth.uid()
        )
    );

-- 5. CORRECT ANSWERS POLICIES (STRICT: Host only! Never participants)
CREATE POLICY "Only quiz hosts can view correct answers"
    ON public.correct_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes z ON z.id = q.quiz_id
            WHERE q.id = correct_answers.question_id
            AND z.host_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage correct answers for their questions"
    ON public.correct_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.quizzes z ON z.id = q.quiz_id
            WHERE q.id = correct_answers.question_id
            AND z.host_id = auth.uid()
        )
    );

-- 6. ATTEMPTS POLICIES
CREATE POLICY "Participants can view their own attempts or hosts can view quiz attempts"
    ON public.attempts FOR SELECT
    USING (
        (participant_user_id IS NOT NULL AND auth.uid() = participant_user_id)
        OR EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = attempts.quiz_id
            AND q.host_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create an attempt"
    ON public.attempts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Participants can update their in_progress attempt"
    ON public.attempts FOR UPDATE
    USING (
        (participant_user_id IS NOT NULL AND auth.uid() = participant_user_id)
        OR EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = attempts.quiz_id
            AND q.host_id = auth.uid()
        )
    );

-- 7. ATTEMPT ANSWERS POLICIES
CREATE POLICY "Attempt answers viewable by participant or quiz host"
    ON public.attempt_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.attempts a
            JOIN public.quizzes q ON q.id = a.quiz_id
            WHERE a.id = attempt_answers.attempt_id
            AND (a.participant_user_id = auth.uid() OR q.host_id = auth.uid())
        )
    );

CREATE POLICY "Attempt answers insertable during attempt"
    ON public.attempt_answers FOR INSERT
    WITH CHECK (true);

-- 8. RESULTS POLICIES
CREATE POLICY "Results viewable by participant or quiz host"
    ON public.results FOR SELECT
    USING (
        host_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.attempts a
            WHERE a.id = results.attempt_id
            AND a.participant_user_id = auth.uid()
        )
    );

CREATE POLICY "Results insertable by host or service role"
    ON public.results FOR INSERT
    WITH CHECK (
        host_id = auth.uid() OR auth.role() = 'service_role'
    );


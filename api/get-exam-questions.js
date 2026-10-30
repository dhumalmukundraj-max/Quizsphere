import { getSupabaseServerClient } from './_supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const quizId = req.query?.quizId || req.body?.quizId;

    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    const supabase = getSupabaseServerClient();

    // 1. Fetch quiz info (exclude password_hash!)
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, description, instructions, duration_minutes, status, host_id, created_at')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status !== 'published') {
      return res.status(403).json({ error: `Quiz is ${quiz.status} and cannot be taken.` });
    }

    // 2. Fetch questions for this quiz
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, question_text, marks, question_order')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (qError) {
      return res.status(500).json({ error: 'Failed to load questions' });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'This quiz has no questions yet.' });
    }

    // 3. Fetch options for these questions
    const questionIds = questions.map(q => q.id);
    const { data: options, error: optError } = await supabase
      .from('question_options')
      .select('id, question_id, option_text, option_order')
      .in('question_id', questionIds)
      .order('option_order', { ascending: true });

    if (optError) {
      return res.status(500).json({ error: 'Failed to load question options' });
    }

    // Map options into respective questions
    const optionsByQuestion = {};
    (options || []).forEach(opt => {
      if (!optionsByQuestion[opt.question_id]) {
        optionsByQuestion[opt.question_id] = [];
      }
      optionsByQuestion[opt.question_id].push({
        id: opt.id,
        option_text: opt.option_text,
        option_order: opt.option_order
      });
    });

    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      marks: q.marks,
      question_order: q.question_order,
      options: optionsByQuestion[q.id] || []
    }));

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    return res.status(200).json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        duration_minutes: quiz.duration_minutes,
        total_questions: sanitizedQuestions.length,
        total_marks: totalMarks
      },
      questions: sanitizedQuestions
    });
  } catch (err) {
    console.error('get-exam-questions error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

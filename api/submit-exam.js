import { getSupabaseServerClient } from './_supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      quizId,
      participantName,
      participantEmail,
      participantUserId,
      answers = [], // array of { questionId, selectedOptionId }
    } = req.body || {};

    if (!quizId || !participantName || !participantEmail) {
      return res.status(400).json({ error: 'Missing required submission fields (quizId, participantName, participantEmail)' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participantEmail.trim())) {
      return res.status(400).json({ error: 'Invalid participant email address' });
    }

    const supabase = getSupabaseServerClient();

    // 1. Verify quiz exists and is published
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, host_id, status')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status !== 'published') {
      return res.status(403).json({ error: `This quiz is currently ${quiz.status} and cannot be submitted.` });
    }

    // 2. Prevent duplicate submission if the participant already submitted this quiz
    let duplicateCheckQuery = supabase
      .from('attempts')
      .select('id, status, submitted_at')
      .eq('quiz_id', quizId)
      .eq('status', 'submitted');

    if (participantUserId) {
      duplicateCheckQuery = duplicateCheckQuery.eq('participant_user_id', participantUserId);
    } else {
      duplicateCheckQuery = duplicateCheckQuery.eq('participant_email', participantEmail.trim().toLowerCase());
    }

    const { data: existingAttempts } = await duplicateCheckQuery;
    if (existingAttempts && existingAttempts.length > 0) {
      return res.status(409).json({
        error: 'You have already submitted an examination for this quiz. Duplicate submissions are not allowed.'
      });
    }

    // 3. Fetch questions and their assigned marks
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, marks')
      .eq('quiz_id', quizId);

    if (questionsError || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz has no questions configured for evaluation.' });
    }

    const questionIds = questions.map(q => q.id);

    // 4. Fetch the true correct answers strictly from correct_answers table on the server
    const { data: correctAnswersList, error: caError } = await supabase
      .from('correct_answers')
      .select('question_id, correct_option_id')
      .in('question_id', questionIds);

    if (caError) {
      return res.status(500).json({ error: 'Failed to retrieve answer key for evaluation' });
    }

    const correctMap = new Map();
    (correctAnswersList || []).forEach(ca => {
      correctMap.set(ca.question_id, ca.correct_option_id);
    });

    const marksMap = new Map();
    let totalMarks = 0;
    questions.forEach(q => {
      marksMap.set(q.id, q.marks || 1);
      totalMarks += (q.marks || 1);
    });

    // 5. Evaluate answers server-side
    const answersMap = new Map();
    (answers || []).forEach(a => {
      if (a.questionId) {
        answersMap.set(a.questionId, a.selectedOptionId);
      }
    });

    let obtainedMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach(q => {
      const selectedOptionId = answersMap.get(q.id);
      const correctOptionId = correctMap.get(q.id);
      const qMarks = marksMap.get(q.id) || 1;

      if (selectedOptionId && correctOptionId && selectedOptionId === correctOptionId) {
        obtainedMarks += qMarks;
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    });

    const percentage = totalMarks > 0
      ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2))
      : 0.00;

    // 6. Record Attempt
    const now = new Date().toISOString();
    const { data: attemptRecord, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        quiz_id: quizId,
        participant_user_id: participantUserId || null,
        participant_name: participantName.trim(),
        participant_email: participantEmail.trim().toLowerCase(),
        started_at: now,
        submitted_at: now,
        status: 'submitted'
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Failed to insert attempt:', attemptError);
      return res.status(500).json({ error: 'Failed to store examination attempt' });
    }

    // 7. Record individual attempt answers
    if (answers && answers.length > 0) {
      const attemptAnswersToInsert = answers
        .filter(a => a.questionId)
        .map(a => ({
          attempt_id: attemptRecord.id,
          question_id: a.questionId,
          selected_option_id: a.selectedOptionId || null
        }));

      if (attemptAnswersToInsert.length > 0) {
        await supabase.from('attempt_answers').insert(attemptAnswersToInsert);
      }
    }

    // 8. Record Final Result
    const { data: resultRecord, error: resultError } = await supabase
      .from('results')
      .insert({
        attempt_id: attemptRecord.id,
        quiz_id: quizId,
        host_id: quiz.host_id,
        obtained_marks: obtainedMarks,
        total_marks: totalMarks,
        percentage: percentage,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        evaluated_at: now
      })
      .select()
      .single();

    if (resultError) {
      console.error('Failed to insert result:', resultError);
      return res.status(500).json({ error: 'Failed to record examination results' });
    }

    return res.status(200).json({
      success: true,
      message: 'Examination submitted and evaluated successfully',
      result: {
        id: resultRecord.id,
        attemptId: attemptRecord.id,
        quizTitle: quiz.title,
        participantName: participantName.trim(),
        participantEmail: participantEmail.trim().toLowerCase(),
        obtainedMarks,
        totalMarks,
        percentage,
        correctCount,
        incorrectCount,
        submittedAt: now
      }
    });

  } catch (err) {
    console.error('submit-exam error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}


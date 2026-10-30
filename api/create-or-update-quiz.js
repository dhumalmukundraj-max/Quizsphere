import bcrypt from 'bcryptjs';
import { getSupabaseServerClient } from './_supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      id: quizId,
      hostId,
      title,
      description = '',
      instructions = '',
      password, // Plaintext password entered by host (required on create, optional on update)
      durationMinutes = null,
      status = 'draft',
      questions = []
    } = req.body || {};

    if (!hostId) {
      return res.status(401).json({ error: 'Unauthorized: host ID is missing' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }

    if (!quizId && (!password || password.trim().length < 4)) {
      return res.status(400).json({ error: 'Quiz password is required and must be at least 4 characters long' });
    }

    if (status === 'published') {
      if (!questions || questions.length === 0) {
        return res.status(400).json({ error: 'A published quiz must contain at least one question' });
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text || !q.question_text.trim()) {
          return res.status(400).json({ error: `Question #${i + 1} text cannot be empty` });
        }
        if (!q.options || q.options.length < 2) {
          return res.status(400).json({ error: `Question #${i + 1} must have at least 2 options` });
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].option_text || !q.options[j].option_text.trim()) {
            return res.status(400).json({ error: `Option #${j + 1} in Question #${i + 1} cannot be empty` });
          }
        }
        if (q.correct_option_index === undefined || q.correct_option_index === null || q.correct_option_index < 0 || q.correct_option_index >= q.options.length) {
          return res.status(400).json({ error: `Question #${i + 1} must have exactly one correct answer selected` });
        }
        if (!q.marks || Number(q.marks) <= 0) {
          return res.status(400).json({ error: `Question #${i + 1} marks must be a positive number` });
        }
      }
    }

    const supabase = getSupabaseServerClient();

    // Determine password hash
    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    let currentQuizId = quizId;

    if (quizId) {
      // Check ownership
      const { data: existing, error: checkError } = await supabase
        .from('quizzes')
        .select('id, host_id, password_hash')
        .eq('id', quizId)
        .single();

      if (checkError || !existing) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      if (existing.host_id !== hostId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this quiz' });
      }

      const updateData = {
        title: title.trim(),
        description: description?.trim() || '',
        instructions: instructions?.trim() || '',
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        status: status || 'draft',
        updated_at: new Date().toISOString()
      };

      if (passwordHash) {
        updateData.password_hash = passwordHash;
      }

      const { error: updateError } = await supabase
        .from('quizzes')
        .update(updateData)
        .eq('id', quizId);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update quiz details: ' + updateError.message });
      }

      // Delete old questions (cascade will remove question_options & correct_answers)
      await supabase.from('questions').delete().eq('quiz_id', quizId);

    } else {
      // Create new quiz
      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert({
          host_id: hostId,
          title: title.trim(),
          description: description?.trim() || '',
          instructions: instructions?.trim() || '',
          password_hash: passwordHash,
          duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
          status: status || 'draft'
        })
        .select()
        .single();

      if (createError || !newQuiz) {
        return res.status(500).json({ error: 'Failed to create quiz: ' + createError?.message });
      }

      currentQuizId = newQuiz.id;
    }

    // Insert questions, options, and correct answers
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // 1. Insert question
        const { data: insertedQ, error: qErr } = await supabase
          .from('questions')
          .insert({
            quiz_id: currentQuizId,
            question_text: q.question_text.trim(),
            marks: parseInt(q.marks, 10) || 1,
            question_order: i
          })
          .select()
          .single();

        if (qErr || !insertedQ) {
          console.error('Error inserting question:', qErr);
          continue;
        }

        // 2. Insert options for this question
        const optionsToInsert = (q.options || []).map((opt, optIdx) => ({
          question_id: insertedQ.id,
          option_text: opt.option_text.trim(),
          option_order: optIdx
        }));

        const { data: insertedOptions, error: optErr } = await supabase
          .from('question_options')
          .insert(optionsToInsert)
          .select();

        if (optErr || !insertedOptions) {
          console.error('Error inserting options:', optErr);
          continue;
        }

        // 3. Insert correct answer
        const correctIndex = q.correct_option_index !== undefined ? q.correct_option_index : 0;
        const correctOption = insertedOptions.find(o => o.option_order === correctIndex) || insertedOptions[0];

        if (correctOption) {
          await supabase.from('correct_answers').insert({
            question_id: insertedQ.id,
            correct_option_id: correctOption.id
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: quizId ? 'Quiz updated successfully' : 'Quiz created successfully',
      quizId: currentQuizId
    });

  } catch (err) {
    console.error('create-or-update-quiz error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * Frontend client wrapper for QuizSphere serverless API endpoints
 */

export async function verifyQuizPassword(quizId, password) {
  const response = await fetch('/api/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify password');
  }
  return data;
}

export async function getExamQuestions(quizId, token) {
  const response = await fetch('/api/get-exam-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to retrieve quiz questions');
  }
  return data;
}

export async function submitExam({
  quizId,
  participantName,
  participantEmail,
  participantUserId,
  answers,
}) {
  const response = await fetch('/api/submit-exam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quizId,
      participantName,
      participantEmail,
      participantUserId,
      answers,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit examination');
  }
  return data;
}

export async function saveQuiz(quizData) {
  const response = await fetch('/api/create-or-update-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to save quiz');
  }
  return data;
}

import bcrypt from 'bcryptjs';
import { getSupabaseServerClient } from './_supabaseServer.js';

// In-memory rate limiting map for incorrect password attempts
const attemptTracker = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes

function checkRateLimit(key) {
  const now = Date.now();
  const record = attemptTracker.get(key);
  if (!record) return { allowed: true };

  if (record.count >= MAX_ATTEMPTS) {
    const elapsed = now - record.lastAttempt;
    if (elapsed < LOCKOUT_MS) {
      const waitSec = Math.ceil((LOCKOUT_MS - elapsed) / 1000);
      return { allowed: false, error: `Too many incorrect attempts. Please wait ${waitSec} seconds.` };
    } else {
      attemptTracker.delete(key);
      return { allowed: true };
    }
  }
  return { allowed: true };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = attemptTracker.get(key) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;
  attemptTracker.set(key, record);
}

function resetAttempts(key) {
  attemptTracker.delete(key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quizId, password } = req.body || {};

    if (!quizId || !password) {
      return res.status(400).json({ error: 'Quiz ID and password are required' });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : (req.socket?.remoteAddress || 'client');
    const rateLimitKey = `${clientIp}_${quizId}`;

    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
    }

    const supabase = getSupabaseServerClient();

    // Query quiz
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('id, title, password_hash, status, duration_minutes, host_id')
      .eq('id', quizId)
      .single();

    if (error || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status !== 'published') {
      return res.status(403).json({ error: `This quiz is currently ${quiz.status} and not accepting participants.` });
    }

    // Verify password against hash
    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(password, quiz.password_hash);
    } catch (e) {
      isMatch = false;
    }

    if (!isMatch) {
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({ error: 'Incorrect quiz password. Please verify and try again.' });
    }

    // Clear failed attempts on success
    resetAttempts(rateLimitKey);

    // Create an ephemeral token for exam verification
    const tokenPayload = {
      quizId: quiz.id,
      verifiedAt: Date.now(),
      salt: Math.random().toString(36).substring(2, 15),
    };
    const verificationToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Password verified successfully',
      quiz: {
        id: quiz.id,
        title: quiz.title,
        duration_minutes: quiz.duration_minutes,
      },
      verificationToken,
    });
  } catch (err) {
    console.error('Password verification error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

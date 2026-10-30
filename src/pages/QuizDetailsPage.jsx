import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Clock,
  Award,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Layers,
  FileText
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConfigBanner from '../components/common/ConfigBanner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { verifyQuizPassword } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function QuizDetailsPage() {
  const { id: quizId } = useParams();
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({ questionsCount: 0, totalMarks: 0 });

  useEffect(() => {
    async function loadQuizDetails() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch quiz details (publicly viewable if published)
        const { data: quizData, error: qErr } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            instructions,
            duration_minutes,
            status,
            created_at,
            host_id,
            profiles (full_name)
          `)
          .eq('id', quizId)
          .single();

        if (qErr || !quizData) {
          setError('Quiz not found or is no longer available.');
          setLoading(false);
          return;
        }

        if (quizData.status !== 'published') {
          setError(`This quiz is currently ${quizData.status} and cannot be taken.`);
          setLoading(false);
          return;
        }

        setQuiz(quizData);

        // Fetch question counts and marks
        const { data: qList } = await supabase
          .from('questions')
          .select('id, marks')
          .eq('quiz_id', quizId);

        const count = qList?.length || 0;
        const marks = (qList || []).reduce((sum, item) => sum + (item.marks || 1), 0);
        setMetrics({ questionsCount: count, totalMarks: marks });

      } catch (err) {
        console.error('Error fetching quiz details:', err);
        setError('Failed to load quiz details.');
      } finally {
        setLoading(false);
      }
    }

    loadQuizDetails();
  }, [quizId]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter the quiz password.');
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyQuizPassword(quizId, password.trim());
      if (response?.success && response?.verificationToken) {
        // Save the verification token in sessionStorage
        sessionStorage.setItem(`quiz_auth_${quizId}`, response.verificationToken);
        toast.success('Password verified! Proceeding to examination.');
        navigate(`/exam/${quizId}`);
      } else {
        setError(response.error || 'Failed to verify quiz password.');
      }
    } catch (err) {
      console.error('Password verify failed:', err);
      setError(err.message || 'Incorrect password or server error');
      toast.error(err.message || 'Incorrect password.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ConfigBanner />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Quizzes</span>
        </Link>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading quiz...</p>
          </div>
        ) : error && !quiz ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-subtle max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Quiz Unavailable</h2>
            <p className="text-sm text-slate-600 mt-1 mb-6">{error}</p>
            <Link
              to="/explore"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700"
            >
              Browse other quizzes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Quiz Overview & Instructions */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Examination
                  </span>
                  <span className="text-xs text-slate-400">
                    Hosted by <strong className="text-slate-700">{quiz.profiles?.full_name || 'Verified Educator'}</strong>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {quiz.title}
                </h1>

                {quiz.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {quiz.description}
                  </p>
                )}

                {/* KPI Strip */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                    <span className="text-base font-extrabold text-slate-900">{metrics.questionsCount}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                    <span className="text-base font-extrabold text-brand-600">{metrics.totalMarks} pts</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {quiz.duration_minutes ? `${quiz.duration_minutes}m` : 'Untimed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Examination Guidelines
                </h3>
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    {quiz.instructions || 'Review each question carefully and select one best option. You may navigate back and forth before final submission.'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 pt-1">
                    <li>Once final submission is clicked, answers cannot be edited.</li>
                    <li>If a timer is enabled, the test will submit automatically when time runs out.</li>
                    <li>Duplicate attempts from the same email are prohibited.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Col: Password Entry Card */}
            <div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card sticky top-24 space-y-5">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Enter Quiz Password</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This quiz is password-protected by the host. Please enter the passcode to access the exam.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Quiz Passcode
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter quiz password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all disabled:opacity-60"
                  >
                    {verifying ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <>
                        <span>Unlock & Proceed</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  Protected with server-side bcrypt verification and rate limiting.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}


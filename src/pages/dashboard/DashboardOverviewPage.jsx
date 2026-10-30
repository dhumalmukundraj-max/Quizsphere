import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  CheckSquare,
  GraduationCap,
  PlusCircle,
  Compass,
  ArrowRight,
  Clock,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzesCreated: 0,
    totalParticipants: 0,
    totalAttemptsReceived: 0,
    totalQuizzesAttempted: 0,
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Quizzes created by current user
        const { data: myQuizzes, error: qErr } = await supabase
          .from('quizzes')
          .select('id, title, status, duration_minutes, created_at')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false });

        const totalCreated = myQuizzes?.length || 0;
        setRecentQuizzes(myQuizzes?.slice(0, 5) || []);

        // 2. Results received for quizzes hosted by current user
        const { data: hostResults, error: rErr } = await supabase
          .from('results')
          .select(`
            id,
            obtained_marks,
            total_marks,
            percentage,
            evaluated_at,
            quizzes (id, title),
            attempts (participant_name, participant_email)
          `)
          .eq('host_id', user.id)
          .order('evaluated_at', { ascending: false });

        const totalAttemptsReceived = hostResults?.length || 0;
        const uniqueParticipants = new Set(
          (hostResults || []).map((r) => r.attempts?.participant_email).filter(Boolean)
        ).size;

        setRecentResults(hostResults?.slice(0, 5) || []);

        // 3. Quizzes attempted by current user as a participant
        const { count: attemptedCount, error: aErr } = await supabase
          .from('attempts')
          .select('id', { count: 'exact', head: true })
          .eq('participant_user_id', user.id)
          .eq('status', 'submitted');

        setStats({
          totalQuizzesCreated: totalCreated,
          totalParticipants: uniqueParticipants,
          totalAttemptsReceived: totalAttemptsReceived,
          totalQuizzesAttempted: attemptedCount || 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1 block">
            Dashboard Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {profile?.full_name || 'Educator'}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor quiz activity, examine participant scores, or launch a new examination.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/dashboard/create-quiz"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Quiz</span>
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            <span>Explore</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistics Cards (Real Database Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Quizzes Created */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quizzes Created
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '-' : stats.totalQuizzesCreated}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Hosted by your account</span>
          </p>
        </div>

        {/* Total Unique Participants */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Participants
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '-' : stats.totalParticipants}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Unique candidates examined</span>
          </p>
        </div>

        {/* Total Attempts Received */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attempts Received
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '-' : stats.totalAttemptsReceived}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Submissions automatically evaluated</span>
          </p>
        </div>

        {/* Total Quizzes Attempted by user */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quizzes Attempted
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '-' : stats.totalQuizzesAttempted}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Your examination completions</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Recently Created Quizzes & Recent Examination Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Created Quizzes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-brand-600" />
              <h2 className="font-bold text-slate-900 text-lg">Recently Created Quizzes</h2>
            </div>
            <Link
              to="/dashboard/my-quizzes"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading your quizzes...</div>
            ) : recentQuizzes.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No quizzes created yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Start drafting your first multiple choice quiz and set custom marks.
                </p>
                <Link
                  to="/dashboard/create-quiz"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Quiz Now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/dashboard/edit-quiz/${quiz.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600 truncate block transition-colors"
                      >
                        {quiz.title}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {quiz.duration_minutes ? `${quiz.duration_minutes} mins` : 'No limit'}
                        </span>
                        <span>•</span>
                        <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          quiz.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : quiz.status === 'closed'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {quiz.status}
                      </span>
                      <Link
                        to={`/dashboard/quizzes/${quiz.id}/results`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="View Results"
                      >
                        <Award className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Examination Results */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-lg">Recent Examination Results</h2>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading results...</div>
            ) : recentResults.length === 0 ? (
              <div className="py-12 text-center">
                <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No examination attempts yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Once participants enter your quiz password and complete an exam, their evaluated scores will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentResults.map((result) => (
                  <div key={result.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {result.attempts?.participant_name || 'Participant'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Quiz: <strong className="font-medium text-slate-700">{result.quizzes?.title || 'Quiz'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(result.evaluated_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
                        <span>{result.obtained_marks} / {result.total_marks}</span>
                        <span className="text-[11px] font-medium text-slate-500">({result.percentage}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-card">
        <div>
          <h3 className="text-lg font-bold">Ready to manage or explore more quizzes?</h3>
          <p className="text-sm text-slate-400 mt-1">
            Explore community quizzes, review your past exam attempts, or refine your profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Explore Quizzes</span>
          </Link>
          <Link
            to="/dashboard/my-attempts"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-all"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>My Attempt History</span>
          </Link>
          <Link
            to="/dashboard/my-quizzes"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-all"
          >
            <FolderKanban className="w-4 h-4 text-blue-400" />
            <span>Manage My Quizzes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


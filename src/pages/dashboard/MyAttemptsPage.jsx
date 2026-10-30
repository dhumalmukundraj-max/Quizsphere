import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Award,
  Calendar,
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function MyAttemptsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyAttempts() {
      if (!user || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch attempts belonging to logged-in user
        const { data: attemptsData, error: aErr } = await supabase
          .from('attempts')
          .select(`
            id,
            quiz_id,
            started_at,
            submitted_at,
            status,
            quizzes (id, title, duration_minutes),
            results (obtained_marks, total_marks, percentage, correct_count, incorrect_count)
          `)
          .eq('participant_user_id', user.id)
          .order('submitted_at', { ascending: false });

        if (aErr) throw aErr;

        setAttempts(attemptsData || []);
      } catch (err) {
        console.error('Failed to load user attempts:', err);
        toast.error('Failed to load your attempts history');
      } finally {
        setLoading(false);
      }
    }

    fetchMyAttempts();
  }, [user]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block">
          History
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Examination Attempts
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track all assessments you have participated in and monitor your performance.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading your examination history...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-subtle max-w-md mx-auto">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-900">No attempts yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            You haven't attempted any quizzes yet. Explore our published quizzes and test your knowledge!
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Quizzes</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th className="py-3.5 px-4">Quiz Title</th>
                  <th className="py-3.5 px-4">Attempt Date</th>
                  <th className="py-3.5 px-4 text-center">Obtained Marks</th>
                  <th className="py-3.5 px-4 text-center">Total Marks</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attempts.map((attempt, idx) => {
                  const res = Array.isArray(attempt.results) ? attempt.results[0] : attempt.results;
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">
                        {attempt.quizzes?.title || 'Examination'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(attempt.submitted_at || attempt.started_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-brand-600 text-sm">
                        {res ? res.obtained_marks : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {res ? res.total_marks : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {res ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                              res.percentage >= 70
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : res.percentage >= 50
                                ? 'bg-blue-50 text-brand-700 border border-brand-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {res.percentage}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{attempt.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


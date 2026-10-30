import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Users,
  TrendingUp,
  Download,
  Search,
  ArrowUpDown,
  ArrowLeft,
  ChevronRight,
  Clock,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function HostQuizResultsPage() {
  const { id: quizId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'marks_desc' | 'marks_asc'

  // Modal inspection of individual result
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    async function fetchQuizAndResults() {
      if (!user || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch Quiz details and verify host ownership
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title, duration_minutes, status, host_id, created_at')
          .eq('id', quizId)
          .single();

        if (quizError || !quizData) {
          toast.error('Quiz not found');
          navigate('/dashboard/my-quizzes');
          return;
        }

        if (quizData.host_id !== user.id) {
          toast.error('Forbidden: You can only view results of quizzes you host.');
          navigate('/dashboard/my-quizzes');
          return;
        }

        setQuiz(quizData);

        // 2. Fetch results for this quiz (Host RLS allows this)
        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select(`
            id,
            attempt_id,
            obtained_marks,
            total_marks,
            percentage,
            correct_count,
            incorrect_count,
            evaluated_at,
            attempts (participant_name, participant_email, started_at, submitted_at)
          `)
          .eq('quiz_id', quizId)
          .order('evaluated_at', { ascending: false });

        if (resultsError) throw resultsError;

        setResults(resultsData || []);
      } catch (err) {
        console.error('Failed to load results:', err);
        toast.error('Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    }

    fetchQuizAndResults();
  }, [quizId, user]);

  // Aggregate Metrics
  const totalParticipants = results.length;
  const marksList = results.map((r) => r.obtained_marks);
  const highestMarks = marksList.length > 0 ? Math.max(...marksList) : 0;
  const lowestMarks = marksList.length > 0 ? Math.min(...marksList) : 0;
  const totalMarksEarned = marksList.reduce((a, b) => a + b, 0);
  const averageMarks =
    totalParticipants > 0 ? (totalMarksEarned / totalParticipants).toFixed(1) : 0;
  const averagePercentage =
    totalParticipants > 0
      ? (
          results.reduce((a, b) => a + parseFloat(b.percentage || 0), 0) /
          totalParticipants
        ).toFixed(1)
      : 0;

  // Search and Sort Filtering
  const filteredResults = results
    .filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = r.attempts?.participant_name?.toLowerCase() || '';
      const email = r.attempts?.participant_email?.toLowerCase() || '';
      return name.includes(q) || email.includes(q);
    })
    .sort((a, b) => {
      if (sortOption === 'marks_desc') return b.obtained_marks - a.obtained_marks;
      if (sortOption === 'marks_asc') return a.obtained_marks - b.obtained_marks;
      if (sortOption === 'date_asc')
        return new Date(a.evaluated_at) - new Date(b.evaluated_at);
      return new Date(b.evaluated_at) - new Date(a.evaluated_at);
    });

  // Export to CSV
  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.warning('No results to export.');
      return;
    }

    const headers = [
      'Serial No',
      'Participant Name',
      'Participant Email',
      'Obtained Marks',
      'Total Marks',
      'Percentage (%)',
      'Correct Count',
      'Incorrect Count',
      'Submission Date UTC',
    ];

    const rows = filteredResults.map((r, idx) => [
      idx + 1,
      `"${(r.attempts?.participant_name || '').replace(/"/g, '""')}"`,
      `"${(r.attempts?.participant_email || '').replace(/"/g, '""')}"`,
      r.obtained_marks,
      r.total_marks,
      r.percentage,
      r.correct_count,
      r.incorrect_count,
      `"${r.evaluated_at}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTitle = (quiz?.title || 'quiz').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${safeTitle}_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Results exported to CSV successfully!');
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading quiz examination results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/my-quizzes"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block">
              Examination Analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {quiz?.title}
            </h1>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={results.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Results to CSV</span>
        </button>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Participants */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Total Participants
          </span>
          <div className="text-2xl font-black text-slate-900">{totalParticipants}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Submissions</span>
        </div>

        {/* Highest Marks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Highest Marks
          </span>
          <div className="text-2xl font-black text-emerald-600">{highestMarks}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Best score</span>
        </div>

        {/* Average Marks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Average Marks
          </span>
          <div className="text-2xl font-black text-brand-600">{averageMarks}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Mean score</span>
        </div>

        {/* Lowest Marks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Lowest Marks
          </span>
          <div className="text-2xl font-black text-amber-600">{lowestMarks}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Lowest record</span>
        </div>

        {/* Average Percentage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Avg. Percentage
          </span>
          <div className="text-2xl font-black text-slate-900">{averagePercentage}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cohort mean</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate by name or email..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Sort By:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="date_desc">Submission: Newest First</option>
            <option value="date_asc">Submission: Oldest First</option>
            <option value="marks_desc">Marks: Highest First</option>
            <option value="marks_asc">Marks: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No examination attempts found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {results.length === 0
                ? 'Share your quiz password with participants to start receiving results.'
                : 'No candidates matched your search filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th className="py-3.5 px-4">Candidate Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4 text-center">Obtained Marks</th>
                  <th className="py-3.5 px-4 text-center">Total Marks</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResults.map((result, idx) => (
                  <tr key={result.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      {result.attempts?.participant_name || 'Anonymous Candidate'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {result.attempts?.participant_email}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-brand-600 text-sm">
                      {result.obtained_marks}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {result.total_marks}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                          result.percentage >= 70
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : result.percentage >= 50
                            ? 'bg-blue-50 text-brand-700 border border-brand-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {result.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(result.evaluated_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 p-1 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Result Inspection Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Candidate Result Details</h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Candidate Name:</span>
                <span className="font-bold text-slate-900">{selectedResult.attempts?.participant_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-medium text-slate-800">{selectedResult.attempts?.participant_email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Marks Obtained:</span>
                <span className="font-bold text-brand-600 text-sm">{selectedResult.obtained_marks} / {selectedResult.total_marks}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Percentage:</span>
                <span className="font-bold text-emerald-600">{selectedResult.percentage}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Correct Answers:</span>
                <span className="font-bold text-emerald-700">{selectedResult.correct_count}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Incorrect Answers:</span>
                <span className="font-bold text-rose-700">{selectedResult.incorrect_count}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Submission Date:</span>
                <span className="text-slate-700">{new Date(selectedResult.evaluated_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


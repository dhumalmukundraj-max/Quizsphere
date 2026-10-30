import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  PlusCircle,
  Clock,
  Award,
  Edit,
  Trash2,
  Copy,
  Share2,
  Check,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Search,
  Filter,
  AlertTriangle,
  Play
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function MyQuizzesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyQuizzes = async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch host's quizzes
      const { data: quizzesData, error: qErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;

      if (!quizzesData || quizzesData.length === 0) {
        setQuizzes([]);
        setLoading(false);
        return;
      }

      const quizIds = quizzesData.map((q) => q.id);

      // Fetch questions to count questions & calculate total marks
      const { data: questionsData } = await supabase
        .from('questions')
        .select('id, quiz_id, marks')
        .in('quiz_id', quizIds);

      // Fetch results/attempts to count participants
      const { data: attemptsData } = await supabase
        .from('attempts')
        .select('id, quiz_id, status')
        .in('quiz_id', quizIds);

      const questionsCountMap = {};
      const totalMarksMap = {};
      (questionsData || []).forEach((q) => {
        questionsCountMap[q.quiz_id] = (questionsCountMap[q.quiz_id] || 0) + 1;
        totalMarksMap[q.quiz_id] = (totalMarksMap[q.quiz_id] || 0) + (q.marks || 1);
      });

      const attemptsCountMap = {};
      (attemptsData || []).forEach((a) => {
        if (a.status === 'submitted') {
          attemptsCountMap[a.quiz_id] = (attemptsCountMap[a.quiz_id] || 0) + 1;
        }
      });

      const enrichedQuizzes = quizzesData.map((quiz) => ({
        ...quiz,
        questionCount: questionsCountMap[quiz.id] || 0,
        totalMarks: totalMarksMap[quiz.id] || 0,
        participantCount: attemptsCountMap[quiz.id] || 0,
      }));

      setQuizzes(enrichedQuizzes);
    } catch (err) {
      console.error('Failed to fetch host quizzes:', err);
      toast.error('Could not load your quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuizzes();
  }, [user]);

  // Actions
  const handleUpdateStatus = async (quizId, newStatus) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', quizId)
        .eq('host_id', user.id);

      if (error) throw error;

      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status: newStatus } : q))
      );
      toast.success(`Quiz status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update quiz status');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All questions, attempts, and results will be permanently removed.')) {
      return;
    }

    setDeletingId(quizId);
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('host_id', user.id);

      if (error) throw error;

      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      toast.success('Quiz deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete quiz');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyQuizName = (name, id) => {
    navigator.clipboard.writeText(name);
    setCopiedId(`name_${id}`);
    toast.info(`Quiz name copied: "${name}"`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyShareLink = (id) => {
    const url = `${window.location.origin}/quiz/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(`link_${id}`);
    toast.success('Quiz sharing link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : quiz.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block">
            Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Quizzes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, publish, monitor results, and share password-protected examinations.
          </p>
        </div>

        <Link
          to="/dashboard/create-quiz"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Quiz</span>
        </Link>
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
            placeholder="Search your quizzes by title..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Quizzes</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Quiz Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading your quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-subtle max-w-lg mx-auto">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No quizzes match your filter</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {quizzes.length === 0
              ? 'You have not created any quizzes yet. Get started now!'
              : 'Try adjusting your search query or status filter.'}
          </p>
          <Link
            to="/dashboard/create-quiz"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your First Quiz</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header & Body */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      quiz.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : quiz.status === 'closed'
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {quiz.status}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-snug">
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {quiz.description}
                  </p>
                )}

                {/* Key Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center my-4 bg-slate-50/50 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                    <span className="text-sm font-extrabold text-slate-800">{quiz.questionCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Marks</span>
                    <span className="text-sm font-extrabold text-brand-600">{quiz.totalMarks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Attempts</span>
                    <span className="text-sm font-extrabold text-slate-800">{quiz.participantCount}</span>
                  </div>
                </div>

                {/* Share and Copy Quick Buttons */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <button
                    onClick={() => handleCopyQuizName(quiz.title, quiz.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    title="Copy Title"
                  >
                    {copiedId === `name_${quiz.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Copy Name</span>
                  </button>

                  <button
                    onClick={() => handleCopyShareLink(quiz.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    title="Copy Share Link"
                  >
                    {copiedId === `link_${quiz.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Share Link</span>
                  </button>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Link
                    to={`/dashboard/edit-quiz/${quiz.id}`}
                    className="p-2 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white transition-colors"
                    title="Edit Quiz"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/dashboard/quizzes/${quiz.id}/results`}
                    className="p-2 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-white transition-colors"
                    title="View Participant Results"
                  >
                    <Award className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    disabled={deletingId === quiz.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors disabled:opacity-50"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Toggle Buttons */}
                <div>
                  {quiz.status === 'draft' && (
                    <button
                      onClick={() => handleUpdateStatus(quiz.id, 'published')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </button>
                  )}
                  {quiz.status === 'published' && (
                    <button
                      onClick={() => handleUpdateStatus(quiz.id, 'closed')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Close Quiz</span>
                    </button>
                  )}
                  {quiz.status === 'closed' && (
                    <button
                      onClick={() => handleUpdateStatus(quiz.id, 'published')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100"
                    >
                      <span>Re-open</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Clock,
  Award,
  User,
  ArrowRight,
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConfigBanner from '../components/common/ConfigBanner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ExploreQuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchPublishedQuizzes() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch only published quizzes
        const { data: quizzesData, error: qErr } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            duration_minutes,
            status,
            created_at,
            host_id,
            profiles (full_name)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (qErr) throw qErr;

        if (!quizzesData || quizzesData.length === 0) {
          setQuizzes([]);
          setLoading(false);
          return;
        }

        const quizIds = quizzesData.map((q) => q.id);

        // Fetch questions count & total marks
        const { data: questionsData } = await supabase
          .from('questions')
          .select('id, quiz_id, marks')
          .in('quiz_id', quizIds);

        const countMap = {};
        const marksMap = {};
        (questionsData || []).forEach((q) => {
          countMap[q.quiz_id] = (countMap[q.quiz_id] || 0) + 1;
          marksMap[q.quiz_id] = (marksMap[q.quiz_id] || 0) + (q.marks || 1);
        });

        const enriched = quizzesData.map((q) => ({
          ...q,
          hostName: q.profiles?.full_name || 'Verified Host',
          questionCount: countMap[q.id] || 0,
          totalMarks: marksMap[q.id] || 0,
        }));

        setQuizzes(enriched);
      } catch (err) {
        console.error('Error fetching published quizzes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPublishedQuizzes();
  }, []);

  // Filter quizzes by search term (case-insensitive, full or partial)
  const filteredQuizzes = quizzes.filter((quiz) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      quiz.title.toLowerCase().includes(term) ||
      (quiz.description && quiz.description.toLowerCase().includes(term)) ||
      (quiz.hostName && quiz.hostName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ConfigBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            <span>Public Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Published Quizzes
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Find tests, certifications, and assessments created by educators and instructors. Enter the quiz passcode to begin.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by full or partial quiz title or topic..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">
          <span>
            {filteredQuizzes.length} {filteredQuizzes.length === 1 ? 'Quiz' : 'Quizzes'} Available
          </span>
          {searchTerm && (
            <span>Matching "{searchTerm}"</span>
          )}
        </div>

        {/* Grid of Quizzes */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading catalog...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-subtle max-w-md mx-auto my-8">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">No quizzes found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              {searchTerm
                ? `No published quizzes matched "${searchTerm}". Try checking your spelling or search terms.`
                : 'There are currently no published quizzes available.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
              >
                Clear Search Filter
              </button>
            ) : (
              <Link
                to={user ? "/dashboard/create-quiz" : "/login"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs"
              >
                Be the first to publish a quiz
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/quiz/${quiz.id}`}
                className="group bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-brand-300 transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Published
                    </span>

                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.duration_minutes ? `${quiz.duration_minutes} mins` : 'Untimed'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug mb-2">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                      {quiz.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[150px]">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {quiz.hostName}
                    </span>

                    <span className="font-semibold text-slate-700">
                      {quiz.questionCount} {quiz.questionCount === 1 ? 'Question' : 'Questions'} • {quiz.totalMarks} Marks
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
                    <span className="flex items-center gap-1 text-slate-500 font-normal">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Password Required
                    </span>
                    <span className="flex items-center gap-1">
                      Start Exam <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

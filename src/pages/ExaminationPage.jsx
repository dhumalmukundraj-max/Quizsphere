import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  User,
  Mail,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Award,
  RotateCcw,
  ListOrdered,
  Eye,
  Check,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getExamQuestions, submitExam } from '../lib/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function ExaminationPage() {
  const { id: quizId } = useParams();
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Verification & Loading state
  const [token, setToken] = useState(() => sessionStorage.getItem(`quiz_auth_${quizId}`) || '');
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examState, setExamState] = useState('registration'); // 'registration' | 'active' | 'submitted'

  // Participant Registration State
  const [participantName, setParticipantName] = useState(profile?.full_name || '');
  const [participantEmail, setParticipantEmail] = useState(user?.email || '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Active Exam State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: selectedOptionId }
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Result state
  const [result, setResult] = useState(null);

  // Sync profile details into state if they load after mount
  useEffect(() => {
    if (profile?.full_name && !participantName) {
      setParticipantName(profile.full_name);
    }
    if (user?.email && !participantEmail) {
      setParticipantEmail(user.email);
    }
  }, [profile, user]);

  // Load questions and quiz details securely from server
  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        // If no token exists, the user must enter the password on Quiz Details
        if (!token) {
          toast.warning('Please enter the quiz password first.');
          navigate(`/quiz/${quizId}`);
          return;
        }

        const data = await getExamQuestions(quizId, token);
        setQuizData(data.quiz);
        setQuestions(data.questions || []);

        if (data.quiz?.duration_minutes) {
          setTimeLeft(data.quiz.duration_minutes * 60);
        }
      } catch (err) {
        console.error('Failed to load exam:', err);
        toast.error(err.message || 'Failed to load quiz');
        navigate(`/quiz/${quizId}`);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId, token]);

  // Countdown timer effect
  useEffect(() => {
    if (examState !== 'active' || timeLeft === null) return;

    if (timeLeft <= 0) {
      toast.warning('Time has expired! Submitting your examination automatically...');
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Exam Handler
  const handleStartExam = (e) => {
    e.preventDefault();
    if (!participantName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participantEmail.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Please confirm that you have read and accepted the examination instructions.');
      return;
    }

    setExamState('active');
    toast.success('Examination started! Good luck.');
  };

  // Select Option
  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (submitting || examState === 'submitted') return;

    setSubmitting(true);
    setShowConfirmSubmit(false);
    setShowReviewModal(false);

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] || null,
      }));

      const res = await submitExam({
        quizId,
        participantName: participantName.trim(),
        participantEmail: participantEmail.trim().toLowerCase(),
        participantUserId: user?.id || null,
        answers: answersPayload,
      });

      setResult(res.result);
      setExamState('submitted');
      // Clear token
      sessionStorage.removeItem(`quiz_auth_${quizId}`);

      // Confetti celebration if scored well
      if (res.result?.percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      toast.success('Examination submitted successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit examination');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation metrics
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = questions.length;
  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Preparing examination environment...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 1: REGISTRATION & PRE-EXAM INSTRUCTIONS SCREEN
  // -------------------------------------------------------------
  if (examState === 'registration') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Examination Registration
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {quizData?.title}
              </h1>
              {quizData?.description && (
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {quizData.description}
                </p>
              )}
            </div>

            {/* Assessment Parameters */}
            <div className="grid grid-cols-3 gap-3 text-center py-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                <span className="text-base font-extrabold text-slate-900">{quizData?.total_questions}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                <span className="text-base font-extrabold text-brand-600">{quizData?.total_marks} pts</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Allocated Time</span>
                <span className="text-base font-extrabold text-slate-900">
                  {quizData?.duration_minutes ? `${quizData.duration_minutes} minutes` : 'Untimed'}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Important Rules & Instructions</span>
              </div>
              <p>
                {quizData?.instructions ||
                  'Please answer all questions to the best of your ability. Only one option is correct for each question.'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800/90 pl-1">
                <li>You can move freely between questions before final submission.</li>
                <li>Ensure you do not refresh or close the tab while the timer is running.</li>
                <li>Your submission will be evaluated securely on the server against verified answer keys.</li>
              </ul>
            </div>

            {/* Candidate Information Form */}
            <form onSubmit={handleStartExam} className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Candidate Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Your full legal name"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Confirmation checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    I confirm that the details provided are correct and I am ready to begin the examination without external assistance.
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition-all"
                >
                  <span>Start Examination</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: EXAMINATION COMPLETED & RESULT SUMMARY VIEW
  // -------------------------------------------------------------
  if (examState === 'submitted' && result) {
    const isPassing = result.percentage >= 60;

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card text-center space-y-6">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md ${
                isPassing ? 'bg-emerald-600' : 'bg-brand-600'
              }`}
            >
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Examination Concluded
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {result.quizTitle || quizData?.title}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Candidate: <strong className="text-slate-800">{result.participantName}</strong> ({result.participantEmail})
              </p>
            </div>

            {/* Big Score Card */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-md mx-auto space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Evaluation Score
              </div>
              <div className="text-5xl font-black text-slate-900 tracking-tight">
                {result.obtainedMarks}{' '}
                <span className="text-2xl font-bold text-slate-400">/ {result.totalMarks}</span>
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                  result.percentage >= 70
                    ? 'bg-emerald-100 text-emerald-800'
                    : result.percentage >= 50
                    ? 'bg-blue-100 text-brand-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {result.percentage}% Achieved
              </div>
            </div>

            {/* Breakdown stats */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-center">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-700 block">Correct Answers</span>
                <span className="text-xl font-extrabold text-emerald-900">{result.correctCount}</span>
              </div>
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-xs font-semibold text-rose-700 block">Incorrect Answers</span>
                <span className="text-xl font-extrabold text-rose-900">{result.incorrectCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Submitted at: {new Date(result.submittedAt).toLocaleString()}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
              {user && (
                <Link
                  to="/dashboard/my-attempts"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs"
                >
                  <History className="w-4 h-4" />
                  <span>View in My Attempts</span>
                </Link>
              )}
              <Link
                to="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span>Browse More Quizzes</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: ACTIVE EXAMINATION INTERFACE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-brand-100 selection:text-brand-900">
      {/* Top Sticky Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Quiz & Candidate Info */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {quizData?.title}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Candidate: <strong className="text-slate-700">{participantName}</strong>
            </p>
          </div>

          {/* Center/Right: Timer & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs border ${
                  timeLeft <= 300
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <Clock className={`w-4 h-4 ${timeLeft <= 300 ? 'text-rose-600' : 'text-brand-600'}`} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Review Answers</span>
              <span className="text-[11px] font-bold text-brand-600 sm:ml-1">
                ({answeredCount}/{totalCount})
              </span>
            </button>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Examination Question Body */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Question Box Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600">
                Question {currentIndex + 1} of {totalCount}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {currentQuestion?.marks || 1} Marks
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion?.question_text}
            </h2>

            {/* Options list */}
            <div className="space-y-3 pt-2">
              {currentQuestion?.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-blue-50/70 ring-2 ring-brand-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {letter}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {opt.option_text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Navigation Numbers Panel */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500">
                Question Navigator
              </span>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Answered ({answeredCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Not Answered ({totalCount - answeredCount})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(selectedAnswers[q.id]);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      isCurrent
                        ? 'ring-2 ring-brand-600 ring-offset-2 bg-slate-900 text-white'
                        : isAnswered
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Question</span>
          </button>

          {currentIndex < totalCount - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((c) => Math.min(totalCount - 1, c + 1))}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Submit Examination</span>
            </button>
          )}
        </div>
      </main>

      {/* Review Answers Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Examination Progress Review</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowReviewModal(false);
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-brand-400 flex items-center justify-between cursor-pointer transition-all bg-slate-50/50 hover:bg-white"
                  >
                    <span className="text-xs font-semibold text-slate-800">
                      Question #{idx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isAnswered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isAnswered ? 'Answered' : 'Not Answered'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100"
              >
                Continue Test
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setShowConfirmSubmit(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600"
              >
                Proceed to Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Confirm Final Submission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <strong>{answeredCount}</strong> of <strong>{totalCount}</strong> questions.
              {answeredCount < totalCount && (
                <span className="block text-rose-600 font-semibold mt-1">
                  Warning: You have {totalCount - answeredCount} unanswered questions!
                </span>
              )}
              Once submitted, you cannot modify your answers.
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                disabled={submitting}
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

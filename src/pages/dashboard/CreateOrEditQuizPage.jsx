import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Eye,
  Save,
  Send,
  HelpCircle,
  Clock,
  Lock,
  FileText,
  AlertCircle,
  ArrowLeft,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { saveQuiz } from '../../lib/api';

export default function CreateOrEditQuizPage() {
  const { id: quizId } = useParams();
  const isEditing = Boolean(quizId);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Basic Info State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [password, setPassword] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [status, setStatus] = useState('draft');

  // Questions State
  const [questions, setQuestions] = useState([
    {
      id: 'q_' + Date.now(),
      question_text: '',
      marks: 1,
      options: [
        { id: 'opt_1', option_text: '' },
        { id: 'opt_2', option_text: '' },
        { id: 'opt_3', option_text: '' },
        { id: 'opt_4', option_text: '' },
      ],
      correct_option_index: 0,
    },
  ]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewActiveQ, setPreviewActiveQ] = useState(0);

  // Load existing quiz if in edit mode
  useEffect(() => {
    async function fetchQuizData() {
      if (!isEditing || !user || !isSupabaseConfigured()) return;

      try {
        setLoading(true);
        // Fetch quiz
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError || !quiz) {
          toast.error('Quiz not found or you do not have permission to edit it.');
          navigate('/dashboard/my-quizzes');
          return;
        }

        if (quiz.host_id !== user.id) {
          toast.error('You do not have permission to edit this quiz.');
          navigate('/dashboard/my-quizzes');
          return;
        }

        setTitle(quiz.title || '');
        setDescription(quiz.description || '');
        setInstructions(quiz.instructions || '');
        setDurationMinutes(quiz.duration_minutes ? quiz.duration_minutes.toString() : '');
        setStatus(quiz.status || 'draft');

        // Fetch questions
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_order', { ascending: true });

        if (qErr) throw qErr;

        if (qData && qData.length > 0) {
          const qIds = qData.map((q) => q.id);

          // Fetch options
          const { data: optData } = await supabase
            .from('question_options')
            .select('*')
            .in('question_id', qIds)
            .order('option_order', { ascending: true });

          // Fetch correct answers (host RLS allows this!)
          const { data: caData } = await supabase
            .from('correct_answers')
            .select('*')
            .in('question_id', qIds);

          const caMap = new Map();
          (caData || []).forEach((ca) => {
            caMap.set(ca.question_id, ca.correct_option_id);
          });

          const optMap = new Map();
          (optData || []).forEach((opt) => {
            if (!optMap.has(opt.question_id)) optMap.set(opt.question_id, []);
            optMap.get(opt.question_id).push(opt);
          });

          const formattedQuestions = qData.map((q, idx) => {
            const rawOpts = optMap.get(q.id) || [];
            const correctOptId = caMap.get(q.id);
            const correctIdx = rawOpts.findIndex((o) => o.id === correctOptId);

            return {
              id: q.id,
              question_text: q.question_text,
              marks: q.marks || 1,
              options: rawOpts.map((o) => ({
                id: o.id,
                option_text: o.option_text,
              })),
              correct_option_index: correctIdx >= 0 ? correctIdx : 0,
            };
          });

          setQuestions(formattedQuestions);
        }
      } catch (err) {
        console.error('Failed to load quiz for editing:', err);
        toast.error('Failed to load quiz details');
      } finally {
        setLoading(false);
      }
    }

    fetchQuizData();
  }, [quizId, isEditing, user]);

  // Derived calculations
  const totalQuestions = questions.length;
  const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks, 10) || 1), 0);

  // Question manipulation handlers
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 5),
        question_text: '',
        marks: 1,
        options: [
          { id: 'opt_' + Date.now() + '_1', option_text: '' },
          { id: 'opt_' + Date.now() + '_2', option_text: '' },
          { id: 'opt_' + Date.now() + '_3', option_text: '' },
          { id: 'opt_' + Date.now() + '_4', option_text: '' },
        ],
        correct_option_index: 0,
      },
    ]);
  };

  const handleDeleteQuestion = (qIndex) => {
    if (questions.length <= 1) {
      toast.warning('A quiz must have at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleDuplicateQuestion = (qIndex) => {
    const target = questions[qIndex];
    const duplicated = {
      ...target,
      id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 5),
      options: target.options.map((opt) => ({
        ...opt,
        id: 'opt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      })),
    };
    const updated = [...questions];
    updated.splice(qIndex + 1, 0, duplicated);
    setQuestions(updated);
    toast.info('Question duplicated');
  };

  const handleMoveQuestion = (qIndex, direction) => {
    if (direction === 'up' && qIndex === 0) return;
    if (direction === 'down' && qIndex === questions.length - 1) return;

    const newIndex = direction === 'up' ? qIndex - 1 : qIndex + 1;
    const updated = [...questions];
    const [moved] = updated.splice(qIndex, 1);
    updated.splice(newIndex, 0, moved);
    setQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex, text) => {
    const updated = [...questions];
    updated[qIndex].question_text = text;
    setQuestions(updated);
  };

  const handleMarksChange = (qIndex, val) => {
    const marks = Math.max(1, parseInt(val, 10) || 1);
    const updated = [...questions];
    updated[qIndex].marks = marks;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const target = questions[qIndex];
    if (target.options.length >= 6) {
      toast.warning('Maximum 6 options allowed per question.');
      return;
    }
    const updated = [...questions];
    updated[qIndex].options.push({
      id: 'opt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      option_text: '',
    });
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const target = questions[qIndex];
    if (target.options.length <= 2) {
      toast.warning('A question must have at least 2 options.');
      return;
    }
    const updated = [...questions];
    updated[qIndex].options = target.options.filter((_, idx) => idx !== optIndex);
    // If the removed option was the selected correct answer, reset to 0
    if (updated[qIndex].correct_option_index >= updated[qIndex].options.length) {
      updated[qIndex].correct_option_index = 0;
    }
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].option_text = text;
    setQuestions(updated);
  };

  const handleSelectCorrectOption = (qIndex, optIndex) => {
    const updated = [...questions];
    updated[qIndex].correct_option_index = optIndex;
    setQuestions(updated);
  };

  // Validation function
  const validateQuiz = (targetStatus) => {
    if (!title.trim()) {
      return 'Quiz Name is required.';
    }

    if (!isEditing && (!password || password.trim().length < 4)) {
      return 'Quiz Password is required and must be at least 4 characters long.';
    }

    if (durationMinutes && (isNaN(durationMinutes) || parseInt(durationMinutes, 10) <= 0)) {
      return 'Duration must be a positive number of minutes.';
    }

    if (targetStatus === 'published') {
      if (questions.length === 0) {
        return 'Cannot publish an empty quiz. Please add at least one question.';
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) {
          return `Question #${i + 1} text cannot be empty.`;
        }
        if (q.options.length < 2) {
          return `Question #${i + 1} must have at least 2 options.`;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].option_text.trim()) {
            return `Option #${j + 1} for Question #${i + 1} is empty.`;
          }
        }
        if (
          q.correct_option_index === undefined ||
          q.correct_option_index === null ||
          q.correct_option_index < 0 ||
          q.correct_option_index >= q.options.length
        ) {
          return `Please select a valid correct answer for Question #${i + 1}.`;
        }
      }
    }

    return null;
  };

  // Save / Publish submit handler
  const handleSaveQuiz = async (targetStatus) => {
    const errorMsg = validateQuiz(targetStatus);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: quizId || undefined,
        hostId: user.id,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        password: password.trim() ? password.trim() : undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        status: targetStatus,
        questions: questions.map((q, idx) => ({
          question_text: q.question_text.trim(),
          marks: parseInt(q.marks, 10) || 1,
          question_order: idx,
          correct_option_index: q.correct_option_index,
          options: q.options.map((opt, optIdx) => ({
            option_text: opt.option_text.trim(),
            option_order: optIdx,
          })),
        })),
      };

      const result = await saveQuiz(payload);
      toast.success(
        targetStatus === 'published'
          ? 'Quiz published successfully!'
          : 'Quiz saved as draft successfully!'
      );
      navigate('/dashboard/my-quizzes');
    } catch (err) {
      console.error('Save quiz error:', err);
      toast.error(err.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading quiz editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header / Actions Bar */}
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
              {isEditing ? 'Edit Quiz' : 'Quiz Builder'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {title || 'Untitled Quiz'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveQuiz('draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveQuiz('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Publish Quiz</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle flex items-center justify-around text-center divide-x divide-slate-100">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Total Questions</span>
          <span className="text-xl font-bold text-slate-900">{totalQuestions}</span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Total Marks</span>
          <span className="text-xl font-bold text-brand-600">{totalMarks} pts</span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Duration</span>
          <span className="text-xl font-bold text-slate-900">
            {durationMinutes ? `${durationMinutes} mins` : 'Untimed'}
          </span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Status</span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mt-1 ${
            status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Preview Mode Modal/Drawer */}
      {previewMode && (
        <div className="bg-white rounded-2xl p-8 border-2 border-brand-500 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
              <Eye className="w-4 h-4" />
              <span>Participant Preview Mode</span>
            </div>
            <button
              onClick={() => setPreviewMode(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">{title || 'Untitled Quiz'}</h2>
            {description && <p className="text-sm text-slate-600">{description}</p>}
            {instructions && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl text-xs text-blue-900 border border-blue-100">
                <strong>Instructions:</strong> {instructions}
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">
                Question {previewActiveQ + 1} of {questions.length} ({questions[previewActiveQ]?.marks} Marks)
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {questions[previewActiveQ]?.question_text || 'Empty Question Text'}
              </h3>

              <div className="space-y-2.5">
                {questions[previewActiveQ]?.options.map((opt, oIdx) => (
                  <div
                    key={opt.id}
                    className="p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 bg-slate-50 text-sm text-slate-700"
                  >
                    <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center font-bold text-xs bg-white">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt.option_text || `Option ${String.fromCharCode(65 + oIdx)}`}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                <button
                  disabled={previewActiveQ === 0}
                  onClick={() => setPreviewActiveQ((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={previewActiveQ === questions.length - 1}
                  onClick={() => setPreviewActiveQ((p) => Math.min(questions.length - 1, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Basic Information Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">1. Basic Quiz Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set the title, instructions, and access credentials for candidates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Quiz Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Quiz Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Computer Science 101: Midterm Examination"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of covered topics and curriculum chapters..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all resize-y"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Candidate Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Choose the best answer for each question. Once submitted, answers cannot be modified."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Quiz Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required={!isEditing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? 'Leave blank to retain existing password' : 'Enter quiz password'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Participants must enter this password to attempt the exam. Hashed securely with bcrypt.
              </p>
            </div>

            {/* Duration (optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Duration in Minutes (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="e.g. 30 (Leave blank for untimed)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                If configured, a countdown timer is enforced with automatic submission on timeout.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Questions Builder */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">2. Examination Questions</h2>
            <p className="text-xs text-slate-500">
              Add multiple choice questions, set marks, and pick the one correct answer per question.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={q.id || qIndex}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-subtle space-y-5 relative transition-all"
          >
            {/* Question Top Row: Order, Marks, Move/Duplicate/Delete Actions */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center">
                  #{qIndex + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Multiple Choice Question
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Marks input */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Marks:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={q.marks}
                    onChange={(e) => handleMarksChange(qIndex, e.target.value)}
                    className="w-12 text-center text-xs font-bold text-brand-700 bg-white border border-slate-300 rounded py-0.5"
                  />
                </div>

                {/* Reorder Buttons */}
                <button
                  type="button"
                  title="Move Up"
                  disabled={qIndex === 0}
                  onClick={() => handleMoveQuestion(qIndex, 'up')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Move Down"
                  disabled={qIndex === questions.length - 1}
                  onClick={() => handleMoveQuestion(qIndex, 'down')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  title="Duplicate Question"
                  onClick={() => handleDuplicateQuestion(qIndex)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  title="Delete Question"
                  onClick={() => handleDeleteQuestion(qIndex)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Question Statement <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={q.question_text}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                placeholder="Type your question statement here..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Options & Correct Answer <span className="text-slate-400 font-normal">(Click radio to select correct answer)</span>
              </label>

              {q.options.map((opt, optIndex) => {
                const isCorrect = q.correct_option_index === optIndex;
                const letter = String.fromCharCode(65 + optIndex);

                return (
                  <div
                    key={opt.id || optIndex}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Radio button to mark correct */}
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(qIndex, optIndex)}
                      title={`Mark Option ${letter} as Correct`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isCorrect ? <CheckCircle className="w-4 h-4" /> : letter}
                    </button>

                    {/* Option Text Input */}
                    <input
                      type="text"
                      required
                      value={opt.option_text}
                      onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                      placeholder={`Option ${letter}`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />

                    {isCorrect && (
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 shrink-0">
                        Correct Answer
                      </span>
                    )}

                    {/* Remove option button */}
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qIndex, optIndex)}
                        title="Remove option"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {q.options.length < 6 && (
                <button
                  type="button"
                  onClick={() => handleAddOption(qIndex)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 py-1 px-2 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another option</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Bottom Add Question Button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Question</span>
          </button>
        </div>
      </div>

      {/* Floating or Bottom Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">Quiz Ready to Save?</p>
          <p className="text-xs text-slate-500">
            Publishing makes the quiz visible in Explore Quizzes for password-authenticated candidates.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveQuiz('draft')}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveQuiz('published')}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Publish Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}


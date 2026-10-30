import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  ShieldCheck,
  Zap,
  BarChart3,
  Clock,
  Lock,
  ArrowRight,
  HelpCircle,
  FileCheck,
  Sliders,
  Users,
  Search,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConfigBanner from '../components/common/ConfigBanner';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ConfigBanner />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-8 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Modern Online Examination Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
            Create. Conduct. <span className="text-brand-600">Evaluate.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            One platform to create online quizzes, conduct examinations and evaluate participants effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to={user ? "/dashboard/create-quiz" : "/register"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-lg transition-all"
            >
              <span>Create Your Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:border-slate-400 transition-all"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Explore Quizzes</span>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-14 pt-8 border-t border-slate-200/70 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Encrypted Passwords</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Server Evaluation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Timed Assessments</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Instant CSV Reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Workflow</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">How QuizSphere Works</h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              A streamlined, three-step lifecycle for authors and participants with absolute academic integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col relative group hover:border-brand-300 transition-all shadow-subtle hover:shadow-card">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg mb-6 shadow-xs">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Build & Password-Protect</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Author unlimited multiple-choice questions with customized point values, instructions, and optional time limits. Secure the assessment with a hashed password.
              </p>
              <div className="mt-auto pt-4 border-t border-slate-200 text-xs font-semibold text-brand-700 flex items-center gap-1">
                <span>Google Forms-like flexibility</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col relative group hover:border-brand-300 transition-all shadow-subtle hover:shadow-card">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg mb-6 shadow-xs">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Conduct Fair Examinations</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Participants discover your quiz, unlock it using the official password, and take the examination under clean, distraction-free conditions with live countdown timers.
              </p>
              <div className="mt-auto pt-4 border-t border-slate-200 text-xs font-semibold text-brand-700 flex items-center gap-1">
                <span>Hidden answer keys & tamper-proof</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col relative group hover:border-brand-300 transition-all shadow-subtle hover:shadow-card">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg mb-6 shadow-xs">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Automatic Server Evaluation</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Upon submission, answers are verified against database answer keys on the server. Detailed percentages, points, and participant rosters appear in real time on the host dashboard.
              </p>
              <div className="mt-auto pt-4 border-t border-slate-200 text-xs font-semibold text-brand-700 flex items-center gap-1">
                <span>Zero manual grading required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Capabilities</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Engineered for Examination Excellence</h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Built from scratch with modern standards, strict Row Level Security, and enterprise-grade reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Intuitive Question Builder</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Add, duplicate, edit, reorder questions, and define variable marks. Google Forms simplicity meets examination rigor.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Secure Server-Side Grading</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Answer keys are never transmitted to participant browsers. Evaluation occurs entirely within authenticated serverless functions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Access Key Protection</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Control test attendance with hashed quiz passcodes. Rate-limiting safeguards against unauthorized brute-force attempts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Precision Examination Timers</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Configure duration windows with automatic auto-submission upon expiration, ensuring all candidates have identical test lengths.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Live Analytics & CSV Export</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Monitor average scores, highest achievements, and student rosters with instant one-click CSV export for gradebook sync.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Dual Host & Participant Role</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every account can seamlessly create quizzes as a host and attempt quizzes as a participant without needing disconnected accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why QuizSphere Section */}
      <section className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Why QuizSphere?</h2>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-6">
                The Missing Link Between Simple Forms and Overcomplicated LMS Platforms
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Most web forms expose correct answers in their network payloads, leaving assessments vulnerable to DevTools inspection. On the other hand, enterprise LMS suites are clunky, expensive, and require administrative setup.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-slate-700"><strong>Bulletproof Evaluation:</strong> Correct answer keys never cross over to the student’s device.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-slate-700"><strong>Duplicate Prevention:</strong> Prevents multiple submissions from the same student or email.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-slate-700"><strong>Instant Deployment:</strong> Publish a quiz in 60 seconds with a clean shareable link.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-card">
              <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Security & Data Integrity Guarantees
              </h4>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block">Row Level Security (RLS)</span>
                  Quiz authors have strict, exclusive ownership over their private quizzes and participant evaluations.
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block">Bcrypt Password Hashing</span>
                  Quiz passcodes are securely hashed before reaching the database, ensuring zero plaintext exposure.
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block">PostgreSQL Foreign Keys</span>
                  Full relational consistency across profiles, quizzes, questions, options, attempts, and results.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Hosts & Participants */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Host Benefits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-4">
                For Quiz Hosts & Teachers
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Complete Assessment Control</h3>
              <ul className="space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                  <span>Draft and refine exams privately before public release.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                  <span>Assign customizable marks per question to weight difficult topics.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                  <span>Close quizzes at any moment to halt further submissions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                  <span>Real-time score tables with searching, sorting, and CSV export.</span>
                </li>
              </ul>
            </div>

            {/* Participant Benefits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
                For Students & Participants
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Smooth, Transparent Testing</h3>
              <ul className="space-y-3.5 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Clean question-by-question layout with clear answered indicators.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Accurate countdown timer with persistent progress awareness.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Review and revise answers seamlessly prior to final submission.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Historical track record under "My Attempts" to monitor progress.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to host your next online examination?
          </h2>
          <p className="text-blue-100 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Get started in minutes with Supabase-backed authentication, automated grading, and comprehensive analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-brand-700 bg-white hover:bg-blue-50 shadow-md transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-white bg-brand-700 hover:bg-brand-800 border border-brand-500 transition-all"
            >
              <span>Browse Public Quizzes</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

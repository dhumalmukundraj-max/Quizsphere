import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, Database, Lock, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                QuizSphere
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Modern, secure online quiz creation, examination hosting, and automated evaluation platform for educators, organizations, and students.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Server Evaluated
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-brand-400" /> Password Protected
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/explore" className="hover:text-white transition-colors">Explore Quizzes</Link></li>
              <li><Link to="/dashboard/create-quiz" className="hover:text-white transition-colors">Create a Quiz</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Host Dashboard</Link></li>
              <li><Link to="/dashboard/my-attempts" className="hover:text-white transition-colors">My Attempts</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Features</h4>
            <ul className="space-y-2.5 text-sm">
              <li>Google Forms-style Builder</li>
              <li>Server-Side Mark Evaluation</li>
              <li>Encrypted Password Access</li>
              <li>Real-time Countdown Timers</li>
              <li>Instant CSV Export</li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Technology</h4>
            <p className="text-sm text-slate-400 mb-3">
              Powered by React, Vite, Supabase PostgreSQL, and Serverless API functions with Row Level Security.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-brand-400" />
              <span>PostgreSQL + RLS Enabled</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} QuizSphere. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with high security, privacy & responsiveness.
          </p>
        </div>
      </div>
    </footer>
  );
}


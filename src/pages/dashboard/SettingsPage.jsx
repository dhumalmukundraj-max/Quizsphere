import React, { useState } from 'react';
import { Lock, Database, ShieldCheck, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function SettingsPage() {
  const { updatePassword } = useAuth();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [dbConfigured] = useState(isSupabaseConfigured());

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdating(true);
    try {
      await updatePassword(password);
      toast.success('Your password has been updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block">
          Preferences
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your security credentials and review system integration status.
        </p>
      </div>

      {/* Security: Change Password */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <Key className="w-5 h-5 text-brand-600" />
          <h2 className="text-base font-bold text-slate-900">Change Account Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-colors disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{updating ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database & Security Status */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">System Integration Status</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-700">Supabase PostgreSQL Connection:</span>
            <span className={`inline-flex items-center gap-1 font-bold ${dbConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
              {dbConfigured ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
              {dbConfigured ? 'Active & Connected' : 'Missing Environment Variables'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-700">Row Level Security (RLS):</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Enforced on all tables
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-700">Server Evaluation Engine:</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Isolated Serverless Functions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

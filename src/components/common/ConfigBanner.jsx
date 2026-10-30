import React, { useState } from 'react';
import { AlertTriangle, Database, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function ConfigBanner() {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const configured = isSupabaseConfigured();

  if (configured) return null;

  const handleCopyEnv = () => {
    const template = `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`;
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="font-semibold">Supabase Credentials Required:</span>
          <span>Please configure your Supabase URL and Keys in your <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white/70"
          >
            {showDetails ? 'Hide Setup Guide' : 'View Setup Guide'}
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopyEnv}
            className="flex items-center gap-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Template!' : 'Copy .env Template'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-amber-200 text-xs text-amber-800 space-y-2">
          <p className="font-medium">To connect your database:</p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-semibold text-amber-900">supabase.com</a>.</li>
            <li>Go to <strong>Project Settings &rarr; API</strong> and copy your Project URL, Anon Key, and Service Role Key.</li>
            <li>Paste them into your local <code className="font-mono bg-amber-100 px-1">.env</code> file (see <code className="font-mono bg-amber-100 px-1">.env.example</code>).</li>
            <li>Go to the <strong>SQL Editor</strong> in Supabase, copy the contents of <code className="font-mono bg-amber-100 px-1">supabase/schema.sql</code>, and click <strong>Run</strong>.</li>
            <li>Restart your dev server: <code className="font-mono bg-amber-100 px-1">npm run dev</code>.</li>
          </ol>
        </div>
      )}
    </div>
  );
}

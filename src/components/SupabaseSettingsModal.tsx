import React, { useState } from 'react';
import {
    Database,
    CheckCircle2,
    X,
    Copy,
    Check,
    Zap,
    AlertCircle,
    Server,
    Trash2
} from 'lucide-react';
import {
    getSavedSupabaseConfig,
    saveSupabaseConfig,
    clearSupabaseConfig,
    getSupabaseClient
} from '../lib/supabase';

interface SupabaseSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectedStatusChange: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
    isOpen,
    onClose,
    onConnectedStatusChange
}) => {
    const currentConfig = getSavedSupabaseConfig();
    const [url, setUrl] = useState(currentConfig.url);
    const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [copiedSql, setCopiedSql] = useState(false);

    if (!isOpen) return null;

    const handleSaveAndTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !anonKey) {
            setStatus('error');
            setStatusMsg('Please enter both Supabase URL and Anon Key.');
            return;
        }

        setStatus('testing');
        setStatusMsg('Connecting to Supabase...');

        try {
            saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
            const client = getSupabaseClient();
            if (!client) {
                throw new Error('Invalid Supabase configuration');
            }

            // Test query
            const { error } = await client.from('leads').select('count', { count: 'exact', head: true });
            if (error) {
                // If table doesn't exist yet, it's still connected!
                if (error.code === '42P01') {
                    setStatus('success');
                    setStatusMsg('Connected to Supabase! (Note: Please run the SQL schema script to create the "leads" table).');
                } else {
                    setStatus('error');
                    setStatusMsg(`Supabase Error (${error.code}): ${error.message}`);
                }
            } else {
                setStatus('success');
                setStatusMsg('Successfully connected to Supabase Database!');
            }
            onConnectedStatusChange();
        } catch (err: any) {
            setStatus('error');
            setStatusMsg(err?.message || 'Failed to connect to Supabase.');
        }
    };

    const handleDisconnect = () => {
        clearSupabaseConfig();
        setUrl('');
        setAnonKey('');
        setStatus('idle');
        setStatusMsg('Supabase credentials cleared.');
        onConnectedStatusChange();
    };

    const copySqlScript = () => {
        const sql = `-- BECRUZ CAPITAL CRM - SUPABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    role TEXT,
    value NUMERIC DEFAULT 0,
    purchase_price NUMERIC DEFAULT 0,
    target_rate TEXT,
    loan_type TEXT DEFAULT 'Conventional',
    va_disability_rating INT DEFAULT 0,
    property_address TEXT,
    referral_partner TEXT,
    disclosures_status TEXT DEFAULT 'Not Sent',
    document_checklist JSONB DEFAULT '{"w2s": false, "paystubs": false, "bankStatements": false, "taxReturns": false, "photoId": false}'::jsonb,
    stage TEXT DEFAULT 'new_lead',
    priority TEXT DEFAULT 'medium',
    tags JSONB DEFAULT '[]'::jsonb,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    next_follow_up_date TEXT,
    notes TEXT DEFAULT '',
    activities JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    owner TEXT DEFAULT 'Unassigned',
    source TEXT DEFAULT 'Manual Input',
    has_co_borrower BOOLEAN DEFAULT FALSE,
    co_borrower_name TEXT,
    co_borrower_email TEXT,
    co_borrower_phone TEXT,
    co_borrower_employer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.leads FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;`;

        navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                                Connect Supabase Database
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Save all borrowers, loan files, and tasks permanently in the cloud.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status Message */}
                {statusMsg && (
                    <div
                        className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 ${status === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : status === 'error'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            }`}
                    >
                        {status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {status === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                        {status === 'testing' && <Zap className="w-4 h-4 shrink-0 animate-pulse" />}
                        <span>{statusMsg}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSaveAndTest} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                            Supabase Project URL *
                        </label>
                        <div className="relative">
                            <Server className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="https://your-project.supabase.co"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                            Supabase Anon API Key *
                        </label>
                        <textarea
                            rows={3}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={anonKey}
                            onChange={(e) => setAnonKey(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* SQL Setup Script Helper */}
                    <div className="p-3.5 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                📜 Database Schema SQL Script
                            </span>
                            <button
                                type="button"
                                onClick={copySqlScript}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Need tables created? Paste the schema into your <b>Supabase SQL Editor</b> to create the <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">leads</code> table and enable real-time updates.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        {currentConfig.url ? (
                            <button
                                type="button"
                                onClick={handleDisconnect}
                                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear Credentials</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                disabled={status === 'testing'}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                            >
                                <Zap className="w-4 h-4" />
                                <span>{status === 'testing' ? 'Testing...' : 'Save & Connect'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

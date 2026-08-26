import React, { useState, useEffect } from 'react';
import {
    X,
    Phone,
    Mail,
    Calendar,
    Send,
    Mic,
    MicOff,
    PhoneOff,
    FileCheck,
    ShieldCheck
} from 'lucide-react';
import type { Lead, ActivityType } from '../types/crm';
import { formatDateDisplay, formatCurrency } from '../utils/crmHelpers';

interface QuickOutreachModalProps {
    isOpen: boolean;
    lead: Lead | null;
    mode: 'call' | 'email' | 'meeting';
    onClose: () => void;
    onLogOutreach: (leadId: string, activityType: ActivityType, title: string, description: string) => void;
}

export const QuickOutreachModal: React.FC<QuickOutreachModalProps> = ({
    isOpen,
    lead,
    mode,
    onClose,
    onLogOutreach,
}) => {
    if (!isOpen || !lead) return null;

    const [activeMode, setActiveMode] = useState<'call' | 'email' | 'meeting'>(mode);

    const [callActive, setCallActive] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);
    const [callNotes, setCallNotes] = useState('');
    const [isMuted, setIsMuted] = useState(false);

    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const [meetingTitle, setMeetingTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
    const [meetingTime, setMeetingTime] = useState('14:00');

    useEffect(() => {
        setActiveMode(mode);
        if (lead) {
            setEmailSubject(`Initial Disclosures Package & Next Steps - ${lead.name}`);
            setEmailBody(
                `Hi ${lead.name.split(' ')[0]},\n\nYour Initial Disclosures (Discos) package for your ${lead.loanType} loan (${formatCurrency(lead.value)}) is ready for electronic signature!\n\nPlease review the attached Loan Estimate (LE) and sign when convenient.\n\nBest regards,\nYour Name | Senior Loan Officer`
            );
            setMeetingTitle(`Loan Pitch & Pre-Approval Review with ${lead.name}`);
        }
    }, [mode, lead]);

    useEffect(() => {
        let interval: any;
        if (callActive) {
            interval = setInterval(() => {
                setCallSeconds((s) => s + 1);
            }, 1000);
        } else {
            setCallSeconds(0);
        }
        return () => clearInterval(interval);
    }, [callActive]);

    const applyMortgageTemplate = (templateType: 'discos' | 'docs' | 'preapproval' | 'pitch') => {
        if (!lead) return;
        const firstName = lead.name.split(' ')[0];

        if (templateType === 'discos') {
            setEmailSubject(`ACTION REQUIRED: Initial Disclosures (Discos) Ready for E-Sign`);
            setEmailBody(
                `Hi ${firstName},\n\nYour Initial Disclosures package for ${lead.propertyAddress || 'your upcoming purchase'} has been generated.\n\nPlease log into our secure portal to e-sign your Loan Estimate (LE) and Intent to Proceed so we can lock your rate and order the appraisal.\n\nBest regards,\nYour Name | Loan Officer`
            );
        } else if (templateType === 'docs') {
            setEmailSubject(`Document Checklist Request for ${lead.name} (${lead.loanType} Loan)`);
            setEmailBody(
                `Hi ${firstName},\n\nTo move your ${lead.loanType} loan application into Underwriting, please upload the following missing items:\n\n• W-2 Statements (Last 2 Years)\n• Paystubs (Last 30 Days)\n• Bank Statements (Last 2 Months - All Pages)\n• 1040 Tax Returns (Last 2 Years)\n\nFeel free to reply directly to this email with PDF attachments!\n\nBest,\nYour Name | Loan Officer`
            );
        } else if (templateType === 'preapproval') {
            setEmailSubject(`Pre-Approval Letter Issued: ${formatCurrency(lead.value)} ${lead.loanType}`);
            setEmailBody(
                `Hi ${firstName},\n\nCongratulations! Attached is your official Pre-Approval Letter for up to ${formatCurrency(lead.value)} (${lead.loanType}).\n\nI have also cc'd your realtor (${lead.referralPartner || 'Partner Agent'}) so they can attach this letter to your purchase offers!\n\nBest,\nYour Name | Loan Officer`
            );
        } else if (templateType === 'pitch') {
            setEmailSubject(`Mortgage Option Pitch: Rate Quote & Fee Breakdown`);
            setEmailBody(
                `Hi ${firstName},\n\nHere is the customized loan comparison for ${lead.propertyAddress || 'your home purchase'}:\n\n• Program: ${lead.loanType}\n• Loan Amount: ${formatCurrency(lead.value)}\n• Target Rate: ${lead.targetRate || '6.50% 30-Yr Fixed'}\n\nLet's connect today to lock in your rate!\n\nBest,\nYour Name | Loan Officer`
            );
        }
    };

    const handleStartCall = () => {
        setCallActive(true);
    };

    const handleEndCall = () => {
        setCallActive(false);
        const durationStr = `${Math.floor(callSeconds / 60)}m ${callSeconds % 60}s`;
        onLogOutreach(
            lead.id,
            'call',
            `Borrower Call (${durationStr})`,
            callNotes.trim() ? `Call notes: ${callNotes.trim()}` : `Completed call with borrower ${lead.name} (${lead.phone}). Duration: ${durationStr}`
        );
        setCallNotes('');
        onClose();
    };

    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        onLogOutreach(
            lead.id,
            'email',
            `Sent Email: "${emailSubject}"`,
            `Email content:\n${emailBody}`
        );
        onClose();
    };

    const handleScheduleMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        onLogOutreach(
            lead.id,
            'meeting',
            `Scheduled Meeting: ${meetingTitle}`,
            `Scheduled for ${formatDateDisplay(meetingDate)} at ${meetingTime}`
        );
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Loan Officer Outreach Hub
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                            Borrower: {lead.name}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 p-1">
                    <button
                        onClick={() => setActiveMode('call')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${activeMode === 'call'
                                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Phone Dialer</span>
                    </button>

                    <button
                        onClick={() => setActiveMode('email')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${activeMode === 'email'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Mortgage Emailer</span>
                    </button>

                    <button
                        onClick={() => setActiveMode('meeting')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${activeMode === 'meeting'
                                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Pitch Meeting</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6">

                    {/* PHONE DIALER MODE */}
                    {activeMode === 'call' && (
                        <div className="space-y-5 text-center">

                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                    {lead.name[0]}
                                </div>
                                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                                    {lead.phone}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {lead.loanType} • {formatCurrency(lead.value)} Loan
                                </p>

                                {callActive && (
                                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                        <span>In Call: {Math.floor(callSeconds / 60)}:{(callSeconds % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                )}
                            </div>

                            {!callActive ? (
                                <button
                                    onClick={handleStartCall}
                                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>Start Borrower Phone Call</span>
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <textarea
                                        rows={3}
                                        placeholder="Log call notes (income, rate lock preferences, docs)..."
                                        value={callNotes}
                                        onChange={(e) => setCallNotes(e.target.value)}
                                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 text-left"
                                    />

                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => setIsMuted(!isMuted)}
                                            className={`p-3 rounded-2xl border text-xs font-bold flex-1 flex items-center justify-center space-x-1 ${isMuted
                                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600'
                                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                            <span>{isMuted ? 'Muted' : 'Mute'}</span>
                                        </button>

                                        <button
                                            onClick={handleEndCall}
                                            className="py-3 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/25 flex-1 flex items-center justify-center space-x-2 transition-all"
                                        >
                                            <PhoneOff className="w-4 h-4" />
                                            <span>End & Save Call Log</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* EMAIL COMPOSER MODE */}
                    {activeMode === 'email' && (
                        <form onSubmit={handleSendEmail} className="space-y-4">

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                                    Loan Officer Quick Templates:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => applyMortgageTemplate('discos')}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center space-x-1"
                                    >
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Send Discos E-Sign</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyMortgageTemplate('docs')}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center space-x-1"
                                    >
                                        <FileCheck className="w-3 h-3" />
                                        <span>Doc Checklist Request</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyMortgageTemplate('preapproval')}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                    >
                                        Pre-Approval Letter
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyMortgageTemplate('pitch')}
                                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-700 hover:bg-amber-100"
                                    >
                                        Rate Pitch Quote
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Recipient
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={`${lead.name} <${lead.email}>`}
                                    className="w-full p-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Subject Line
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Email Message
                                </label>
                                <textarea
                                    rows={5}
                                    required
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all"
                            >
                                <Send className="w-4 h-4" />
                                <span>Send Email & Log to Borrower File</span>
                            </button>

                        </form>
                    )}

                    {/* MEETING SCHEDULER MODE */}
                    {activeMode === 'meeting' && (
                        <form onSubmit={handleScheduleMeeting} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Meeting Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={meetingDate}
                                        onChange={(e) => setMeetingDate(e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={meetingTime}
                                        onChange={(e) => setMeetingTime(e.target.value)}
                                        className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all"
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Confirm & Send Calendar Invite</span>
                            </button>

                        </form>
                    )}

                </div>

            </div>
        </div>
    );
};

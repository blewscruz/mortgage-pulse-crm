import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Bell, FileText, CheckCircle } from 'lucide-react';
import type { Lead, Priority, Task } from '../types/crm';
import { getTodayString } from '../utils/crmHelpers';

interface ScheduleReachOutModalProps {
    isOpen: boolean;
    leads: Lead[];
    preselectedLead?: Lead | null;
    defaultDate?: string;
    onClose: () => void;
    onSchedule: (newTask: Task, notes: string) => void;
}

export const ScheduleReachOutModal: React.FC<ScheduleReachOutModalProps> = ({
    isOpen,
    leads,
    preselectedLead,
    defaultDate,
    onClose,
    onSchedule,
}) => {
    if (!isOpen) return null;

    const [selectedLeadId, setSelectedLeadId] = useState<string>(
        preselectedLead ? preselectedLead.id : leads.length > 0 ? leads[0].id : ''
    );
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState(defaultDate || getTodayString());
    const [dueTime, setDueTime] = useState('14:00');
    const [type, setType] = useState<'call' | 'meeting' | 'email' | 'followup' | 'proposal'>('call');
    const [priority, setPriority] = useState<Priority>('high');
    const [notes, setNotes] = useState('');
    const [reminderMinutes, setReminderMinutes] = useState<number>(15);

    useEffect(() => {
        if (preselectedLead) {
            setSelectedLeadId(preselectedLead.id);
            setTitle(`Scheduled Call with ${preselectedLead.name}`);
        } else if (leads.length > 0) {
            const first = leads[0];
            setSelectedLeadId(first.id);
            setTitle(`Scheduled Reach-Out with ${first.name}`);
        }
    }, [preselectedLead, leads]);

    const activeLead = leads.find((l) => l.id === selectedLeadId) || preselectedLead;

    const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedLeadId(id);
        const l = leads.find((lead) => lead.id === id);
        if (l) {
            setTitle(`Scheduled Call with ${l.name}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeLead) return;

        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            leadId: activeLead.id,
            leadName: activeLead.name,
            company: activeLead.company || 'Borrower',
            title: title.trim() || `Reach out to ${activeLead.name}`,
            description: notes.trim(),
            dueDate: dueDate,
            dueTime: dueTime,
            completed: false,
            type: type,
            priority: priority,
            reminderMinutes: reminderMinutes,
            reminderDismissed: false,
        };

        onSchedule(newTask, notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-slate-900 dark:to-slate-900 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Loan Officer Calendar Scheduler
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                Schedule Borrower Reach-Out
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Borrower Selection */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                            Select Borrower File
                        </label>
                        {leads.length > 0 ? (
                            <select
                                value={selectedLeadId}
                                onChange={handleLeadChange}
                                className="w-full p-3 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            >
                                {leads.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} ({l.loanType} Loan • ${l.value.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                disabled
                                value={activeLead ? activeLead.name : 'No active borrowers'}
                                className="w-full p-3 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500"
                            />
                        )}
                    </div>

                    {/* Reach-Out Title */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                            Reach-Out Title / Subject
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Call to Pitch 5.75% VA Rate & Review COE"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-bold"
                        />
                    </div>

                    {/* Reach-Out Type & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                Activity Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            >
                                <option value="call">📞 Phone Call</option>
                                <option value="meeting">🎥 Pitch Meeting</option>
                                <option value="email">✉️ Follow-up Email</option>
                                <option value="followup">📋 Docs Review</option>
                                <option value="proposal">📄 Disclosures E-Sign</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                Priority Level
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            >
                                <option value="high">🔴 High Priority</option>
                                <option value="medium">🟡 Medium Priority</option>
                                <option value="low">🟢 Low Priority</option>
                            </select>
                        </div>
                    </div>

                    {/* Date and Time Picker */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Reach-Out Date</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-extrabold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Appointment Time</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-extrabold"
                            />
                        </div>
                    </div>

                    {/* Reach-Out Topics & Notes */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                <span>What is this reach-out about? (Notes & Agenda)</span>
                            </span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Shows on Calendar</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="e.g. Discuss VA Disability fee exemption, confirm W2s uploaded, pitch 5.75% rate quote..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                        />
                    </div>

                    {/* 15-Minute Alert Checkbox */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-indigo-600 text-white">
                                <Bell className="w-4 h-4 animate-bounce" />
                            </div>
                            <div>
                                <span className="font-black text-xs text-indigo-900 dark:text-indigo-200 block">
                                    15-Minute Pre-Notification Alert
                                </span>
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-400">
                                    Sound chime + pop-up notification 15 mins prior
                                </span>
                            </div>
                        </div>

                        <input
                            type="checkbox"
                            checked={reminderMinutes === 15}
                            onChange={(e) => setReminderMinutes(e.target.checked ? 15 : 0)}
                            className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span>Schedule Reach-Out & Add to Calendar</span>
                    </button>

                </form>

            </div>
        </div>
    );
};

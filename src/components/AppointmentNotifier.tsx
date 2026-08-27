import React, { useState, useEffect } from 'react';
import { Bell, Phone, Calendar, X, Volume2, Shield } from 'lucide-react';
import type { Lead, Task } from '../types/crm';
import { formatCurrency } from '../utils/crmHelpers';

interface ActiveAlert {
    task: Task;
    lead: Lead;
    minutesLeft: number;
}

interface AppointmentNotifierProps {
    leads: Lead[];
    onSelectLead: (lead: Lead) => void;
    onStartCall: (lead: Lead) => void;
    onDismissAlert: (taskId: string) => void;
}

// Web Audio API synthesizer for instant pleasant chime without external files
function playNotificationChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        // Note 1 (E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.5);

        // Note 2 (B5)
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(987.77, ctx.currentTime);
            gain2.gain.setValueAtTime(0.2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.8);
        }, 180);
    } catch {
        // ignore audio block
    }
}

export const AppointmentNotifier: React.FC<AppointmentNotifierProps> = ({
    leads,
    onSelectLead,
    onStartCall,
    onDismissAlert,
}) => {
    const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);

    // Request desktop notification permission on mount
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const checkAppointments = () => {
            const now = new Date();
            const alerts: ActiveAlert[] = [];

            leads.forEach((lead) => {
                lead.tasks.forEach((task) => {
                    if (task.completed || task.reminderDismissed) return;
                    if (!task.dueDate || !task.dueTime) return;

                    // Parse dueDate and dueTime into a Date object
                    // Format: YYYY-MM-DD and HH:MM or 02:30 PM
                    const dateParts = task.dueDate.split('-');
                    if (dateParts.length !== 3) return;

                    let hours = 9;
                    let minutes = 0;

                    if (task.dueTime.includes(':')) {
                        const isPM = task.dueTime.toLowerCase().includes('pm');
                        const isAM = task.dueTime.toLowerCase().includes('am');
                        const cleanTime = task.dueTime.replace(/(am|pm|\s)/gi, '');
                        const [hStr, mStr] = cleanTime.split(':');
                        let parsedH = parseInt(hStr, 10);
                        if (isPM && parsedH < 12) parsedH += 12;
                        if (isAM && parsedH === 12) parsedH = 0;
                        hours = parsedH;
                        minutes = parseInt(mStr, 10) || 0;
                    }

                    const targetDate = new Date(
                        parseInt(dateParts[0], 10),
                        parseInt(dateParts[1], 10) - 1,
                        parseInt(dateParts[2], 10),
                        hours,
                        minutes
                    );

                    const diffMs = targetDate.getTime() - now.getTime();
                    const diffMins = Math.round(diffMs / 60000);

                    // If task is within 15 minutes before due time (and up to 30 mins overdue)
                    if (diffMins >= -30 && diffMins <= 15) {
                        alerts.push({
                            task,
                            lead,
                            minutesLeft: diffMins,
                        });
                    }
                });
            });

            // Trigger sound & desktop notification if a new alert arrives
            if (alerts.length > activeAlerts.length) {
                playNotificationChime();

                const newest = alerts[0];
                if (newest && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    new Notification(`⏰ Reach Out in ${newest.minutesLeft} Mins: ${newest.lead.name}`, {
                        body: newest.task.description || newest.task.title,
                        icon: '/favicon.ico',
                    });
                }
            }

            setActiveAlerts(alerts);
        };

        checkAppointments();
        const interval = setInterval(checkAppointments, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [leads, activeAlerts.length]);

    if (activeAlerts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full space-y-3 pointer-events-auto animate-in slide-in-from-top-5 duration-300">
            {activeAlerts.map(({ task, lead, minutesLeft }) => {
                const isOverdue = minutesLeft < 0;

                return (
                    <div
                        key={task.id}
                        className={`p-5 rounded-3xl border shadow-2xl backdrop-blur-md transition-all space-y-3 ${isOverdue
                                ? 'bg-red-900/90 text-white border-red-500 shadow-red-900/40 animate-pulse'
                                : 'bg-slate-900/95 text-white border-indigo-500/80 shadow-indigo-900/40 ring-2 ring-indigo-500/40'
                            }`}
                    >
                        {/* Top Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className={`p-2 rounded-xl ${isOverdue ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                    <Bell className="w-4 h-4 animate-bounce" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center space-x-1">
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>
                                        {isOverdue
                                            ? `OVERDUE BY ${Math.abs(minutesLeft)} MINS!`
                                            : `UPCOMING REACH-OUT (${minutesLeft === 0 ? 'DUE NOW' : `IN ${minutesLeft} MINS`})`}
                                    </span>
                                </span>
                            </div>

                            <button
                                onClick={() => onDismissAlert(task.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Dismiss Alert"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Borrower & Agenda Notes */}
                        <div>
                            <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-base text-white">{lead.name}</h4>
                                <span className="text-xs font-bold text-slate-300">
                                    {lead.loanType} • {formatCurrency(lead.value)}
                                </span>
                            </div>

                            <p className="text-xs font-semibold text-indigo-200 mt-1">
                                {task.title} ({task.dueTime})
                            </p>

                            {/* Scheduled Notes */}
                            {task.description && (
                                <div className="mt-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-medium">
                                    <strong className="text-indigo-400 block mb-0.5">Reach-Out Agenda / Notes:</strong>
                                    "{task.description}"
                                </div>
                            )}

                            {lead.loanType === 'VA' && (
                                <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                    <Shield className="w-3 h-3 text-blue-400" />
                                    <span>VA Rating: <strong>{lead.vaDisabilityRating ?? 0}%</strong></span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 pt-1">
                            <button
                                onClick={() => {
                                    onStartCall(lead);
                                    onDismissAlert(task.id);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Start Call Now</span>
                            </button>

                            <button
                                onClick={() => {
                                    onSelectLead(lead);
                                    onDismissAlert(task.id);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs border border-slate-700 flex items-center justify-center space-x-1.5 transition-all"
                            >
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                <span>View Borrower File</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

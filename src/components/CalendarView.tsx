import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Phone,
    Mail,
    User,
    Plus,
    Shield,
    Video
} from 'lucide-react';
import type { Lead, Task } from '../types/crm';
import { formatDateDisplay, formatCurrency, getTodayString, getVADisabilityInfo } from '../utils/crmHelpers';

interface CalendarViewProps {
    leads: Lead[];
    onSelectLead: (lead: Lead) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    onOpenScheduleModal?: (lead?: Lead, date?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    leads,
    onSelectLead,
    onQuickOutreach,
    onOpenScheduleModal,
}) => {
    const todayStr = getTodayString();

    // Parse current date info (August 2026 default based on project context)
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
    const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDayStr(getTodayString());
    };

    // Gather all appointments and tasks across leads
    interface CalendarEvent {
        id: string;
        lead: Lead;
        task?: Task;
        title: string;
        date: string; // YYYY-MM-DD
        timeDisplay: string;
        type: 'call' | 'meeting' | 'email' | 'followup' | 'proposal';
        completed: boolean;
        isOverdue: boolean;
    }

    const events: CalendarEvent[] = [];

    leads.forEach((lead) => {
        // Tasks mapped as calendar events
        lead.tasks.forEach((task) => {
            events.push({
                id: `evt-task-${task.id}`,
                lead,
                task,
                title: task.title,
                date: task.dueDate,
                timeDisplay: task.dueTime || (task.type === 'call' ? '10:00 AM' : task.type === 'meeting' ? '02:00 PM' : '09:00 AM'),
                type: task.type,
                completed: task.completed,
                isOverdue: !task.completed && task.dueDate < todayStr,
            });
        });

        // Next follow up dates mapped if no explicit task exists for that date
        if (lead.nextFollowUpDate && !lead.tasks.some((t) => t.dueDate === lead.nextFollowUpDate)) {
            events.push({
                id: `evt-followup-${lead.id}`,
                lead,
                title: `Scheduled Follow-up with ${lead.name}`,
                date: lead.nextFollowUpDate,
                timeDisplay: '11:00 AM',
                type: 'call',
                completed: false,
                isOverdue: lead.nextFollowUpDate < todayStr,
            });
        }
    });

    // Events grouped by date string (YYYY-MM-DD)
    const eventsByDate: Record<string, CalendarEvent[]> = {};
    events.forEach((evt) => {
        if (!eventsByDate[evt.date]) {
            eventsByDate[evt.date] = [];
        }
        eventsByDate[evt.date].push(evt);
    });

    const selectedDayEvents = eventsByDate[selectedDayStr] || [];

    // Stats
    const totalCalls = events.filter((e) => e.type === 'call').length;
    const totalMeetings = events.filter((e) => e.type === 'meeting' || e.type === 'proposal').length;
    const overdueAppointments = events.filter((e) => e.isOverdue).length;

    // Generate calendar days grid
    const daysGrid = [];
    // Padding for previous month days
    for (let i = 0; i < firstDayIndex; i++) {
        daysGrid.push(null);
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        daysGrid.push(dayStr);
    }

    const getEventBadgeStyle = (type: CalendarEvent['type'], isOverdue: boolean) => {
        if (isOverdue) return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800';
        switch (type) {
            case 'call':
                return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            case 'meeting':
            case 'proposal':
                return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
            case 'email':
                return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
            default:
                return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
        }
    };

    return (
        <div className="space-y-6">

            {/* Top Control Bar & Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Borrower Appointment & Call Hub
                        </span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center">
                            <span>{monthNames[month]} {year}</span>
                        </h2>
                    </div>
                </div>

                {/* Stat Badges */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{totalCalls} Calls Scheduled</span>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center space-x-1.5">
                        <Video className="w-3.5 h-3.5 text-amber-500" />
                        <span>{totalMeetings} Pitch Meetings</span>
                    </div>

                    {overdueAppointments > 0 && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">
                            ⚠️ {overdueAppointments} Overdue
                        </div>
                    )}
                </div>

                {/* Calendar Month Controls */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all"
                        title="Previous Month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-sm hover:bg-indigo-500 transition-all"
                    >
                        Today
                    </button>

                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all"
                        title="Next Month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Calendar Layout Grid: 7-Column Calendar + Side Appointment Agenda */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Calendar Grid (2 Cols on Large) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">

                    {/* Day Headers (Sun - Sat) */}
                    <div className="grid grid-cols-7 text-center border-b border-slate-200 dark:border-slate-700 pb-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <span key={day} className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                {day}
                            </span>
                        ))}
                    </div>

                    {/* Calendar Days Box Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {daysGrid.map((dateStr, idx) => {
                            if (!dateStr) {
                                return (
                                    <div
                                        key={`empty-${idx}`}
                                        className="h-28 bg-slate-50/40 dark:bg-slate-900/20 rounded-2xl border border-transparent"
                                    />
                                );
                            }

                            const dayNumber = parseInt(dateStr.split('-')[2], 10);
                            const isToday = dateStr === todayStr;
                            const isSelected = dateStr === selectedDayStr;
                            const dayEvents = eventsByDate[dateStr] || [];

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => setSelectedDayStr(dateStr)}
                                    className={`h-28 p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${isSelected
                                        ? 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                                        : isToday
                                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                                            : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-400'
                                        }`}
                                >
                                    {/* Date Number Header */}
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`w-6 h-6 text-xs flex items-center justify-center font-black rounded-lg ${isToday
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : isSelected
                                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                                                    : 'text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {dayNumber}
                                        </span>

                                        {dayEvents.length > 0 && (
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Event Badges Preview */}
                                    <div className="space-y-1 overflow-hidden my-1 flex-1">
                                        {dayEvents.slice(0, 2).map((evt) => (
                                            <div
                                                key={evt.id}
                                                className={`px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold truncate flex items-center space-x-1 ${getEventBadgeStyle(
                                                    evt.type,
                                                    evt.isOverdue
                                                )}`}
                                            >
                                                {evt.type === 'call' ? (
                                                    <Phone className="w-2.5 h-2.5 shrink-0" />
                                                ) : (
                                                    <Video className="w-2.5 h-2.5 shrink-0" />
                                                )}
                                                <span className="truncate">{evt.lead.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[9px] font-bold text-slate-400 px-1">
                                                +{dayEvents.length - 2} more...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Day Agenda Side Panel */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 flex flex-col justify-between">

                    <div className="space-y-4">
                        {/* Day Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Selected Schedule
                                </span>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                                    <span>{formatDateDisplay(selectedDayStr)}</span>
                                    {selectedDayStr === todayStr && (
                                        <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500 text-white rounded-md">
                                            Today
                                        </span>
                                    )}
                                </h3>
                            </div>

                            <span className="text-xs font-bold text-slate-500">
                                {selectedDayEvents.length} Appt{selectedDayEvents.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        {/* List of Appointments for Selected Day */}
                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                            {selectedDayEvents.length === 0 ? (
                                <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                                        No calls or pitch meetings scheduled for this date.
                                    </p>
                                </div>
                            ) : (
                                selectedDayEvents.map((evt) => {
                                    const vaInfo = getVADisabilityInfo(evt.lead.vaDisabilityRating);

                                    return (
                                        <div
                                            key={evt.id}
                                            className={`p-4 rounded-2xl border transition-all space-y-3 ${evt.isOverdue
                                                ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
                                                : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                                                }`}
                                        >
                                            {/* Top Time & Type Badge */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span>{evt.timeDisplay}</span>
                                                </div>

                                                <span
                                                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${getEventBadgeStyle(
                                                        evt.type,
                                                        evt.isOverdue
                                                    )}`}
                                                >
                                                    {evt.type.toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Borrower Info & VA Loan Badge */}
                                            <div>
                                                <div
                                                    onClick={() => onSelectLead(evt.lead)}
                                                    className="font-black text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                                >
                                                    {evt.title}
                                                </div>

                                                <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    <span>{evt.lead.name} • {formatCurrency(evt.lead.value)}</span>
                                                </div>

                                                {/* Reach-Out Agenda & Notes */}
                                                {evt.task?.description && (
                                                    <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200 font-medium">
                                                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-[10px] uppercase">
                                                            Reach-Out Agenda:
                                                        </span>
                                                        "{evt.task.description}"
                                                    </div>
                                                )}

                                                {/* VA Disability Rating Banner if VA Loan */}
                                                {evt.lead.loanType === 'VA' && (
                                                    <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        <Shield className="w-3 h-3 text-blue-500" />
                                                        <span>
                                                            VA Rating: <strong>{evt.lead.vaDisabilityRating ?? 0}%</strong>
                                                            {vaInfo.isExempt && ' • Fee Exempt ✓'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                                <button
                                                    onClick={() => onSelectLead(evt.lead)}
                                                    className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    Open Borrower File →
                                                </button>

                                                <div className="flex items-center space-x-1.5">
                                                    <button
                                                        onClick={() => onQuickOutreach(evt.lead, 'call')}
                                                        className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                                                        title="Start Call"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onQuickOutreach(evt.lead, 'email')}
                                                        className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                                                        title="Send Email"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Quick Call Scheduler Action */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => {
                                if (onOpenScheduleModal) {
                                    onOpenScheduleModal(undefined, selectedDayStr);
                                } else if (leads.length > 0) {
                                    onQuickOutreach(leads[0], 'meeting');
                                }
                            }}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Schedule Reach-Out & Set 15-Min Alert</span>
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
};

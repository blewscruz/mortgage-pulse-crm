import React from 'react';
import {
    Check,
    Clock,
    AlertCircle,
    Phone,
    Mail,
    CheckCircle2,
    User,
    CheckCircle,
    Edit3,
    Trash2
} from 'lucide-react';
import type { Lead, Task } from '../types/crm';
import { formatDateDisplay, getTodayString } from '../utils/crmHelpers';

interface TaskViewProps {
    leads: Lead[];
    onToggleTaskComplete: (leadId: string, taskId: string) => void;
    onSelectLead: (lead: Lead) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (leadId: string, taskId: string) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({
    leads,
    onToggleTaskComplete,
    onSelectLead,
    onQuickOutreach,
    onEditTask,
    onDeleteTask,
}) => {
    const todayStr = getTodayString();

    const allTasksWithLeads: { task: Task; lead: Lead }[] = [];
    leads.forEach((lead) => {
        lead.tasks.forEach((task) => {
            allTasksWithLeads.push({ task, lead });
        });
    });

    const overdueItems = allTasksWithLeads.filter(
        (item) => !item.task.completed && item.task.dueDate < todayStr
    );

    const dueTodayItems = allTasksWithLeads.filter(
        (item) => !item.task.completed && item.task.dueDate === todayStr
    );

    const upcomingItems = allTasksWithLeads.filter(
        (item) => !item.task.completed && item.task.dueDate > todayStr
    );

    const completedItems = allTasksWithLeads.filter((item) => item.task.completed);

    const renderTaskRow = (item: { task: Task; lead: Lead }, isOverdue = false) => {
        const { task, lead } = item;

        return (
            <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${task.completed
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : isOverdue
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/60 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-indigo-400'
                    }`}
            >
                <div className="flex items-start space-x-3">
                    <button
                        onClick={() => onToggleTaskComplete(lead.id, task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                            }`}
                    >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <span
                                onClick={() => onSelectLead(lead)}
                                className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                            >
                                {task.title}
                            </span>

                            {isOverdue && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-md border border-red-300 dark:border-red-800">
                                    Overdue
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span
                                onClick={() => onSelectLead(lead)}
                                className="font-medium text-slate-700 dark:text-slate-300 flex items-center hover:underline cursor-pointer"
                            >
                                <User className="w-3 h-3 mr-1 text-slate-400" />
                                {lead.name} ({lead.company})
                            </span>

                            <span className="flex items-center text-slate-400">
                                <Clock className="w-3 h-3 mr-1" />
                                Due {formatDateDisplay(task.dueDate)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Action triggers */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                        onClick={() => onQuickOutreach(lead, 'call')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center space-x-1 transition-all"
                    >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                    </button>

                    <button
                        onClick={() => onQuickOutreach(lead, 'email')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold flex items-center space-x-1 transition-all"
                    >
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                    </button>

                    {onEditTask && (
                        <button
                            onClick={() => onEditTask(task)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
                            title="Edit Task / Schedule"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}

                    {onDeleteTask && (
                        <button
                            onClick={() => {
                                if (window.confirm(`Delete task "${task.title}"?`)) {
                                    onDeleteTask(lead.id, task.id);
                                }
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-all"
                            title="Delete Task"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Top Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                        Outreach Task Command Center
                    </span>
                    <h2 className="text-xl font-black mt-1">
                        Task Prioritization & Schedule
                    </h2>
                    <p className="text-xs text-indigo-200 mt-1">
                        Complete high-priority tasks to keep deals moving smoothly through your pipeline.
                    </p>
                </div>

                <div className="hidden sm:flex items-center space-x-4">
                    <div className="text-center px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md">
                        <span className="text-[10px] font-bold uppercase text-slate-300">Overdue</span>
                        <p className="text-xl font-black text-rose-400">{overdueItems.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md">
                        <span className="text-[10px] font-bold uppercase text-slate-300">Due Today</span>
                        <p className="text-xl font-black text-amber-300">{dueTodayItems.length}</p>
                    </div>
                </div>
            </div>

            {/* OVERDUE SECTION */}
            {overdueItems.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1.5 animate-bounce" />
                        Urgent: Overdue Tasks ({overdueItems.length})
                    </h3>

                    <div className="space-y-2">
                        {overdueItems.map((item) => renderTaskRow(item, true))}
                    </div>
                </div>
            )}

            {/* DUE TODAY SECTION */}
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Scheduled For Today ({dueTodayItems.length})
                </h3>

                {dueTodayItems.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        No pending tasks scheduled for today.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {dueTodayItems.map((item) => renderTaskRow(item))}
                    </div>
                )}
            </div>

            {/* UPCOMING SECTION */}
            {upcomingItems.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Upcoming Follow-ups ({upcomingItems.length})
                    </h3>

                    <div className="space-y-2">
                        {upcomingItems.map((item) => renderTaskRow(item))}
                    </div>
                </div>
            )}

            {/* COMPLETED SECTION */}
            {completedItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Recently Completed ({completedItems.length})
                    </h3>

                    <div className="space-y-2">
                        {completedItems.map((item) => renderTaskRow(item))}
                    </div>
                </div>
            )}

        </div>
    );
};

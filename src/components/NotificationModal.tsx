import React from 'react';
import {
    X,
    Bell,
    AlertCircle,
    Clock,
    Phone,
    Mail,
    Calendar,
    Flame,
    ArrowRight
} from 'lucide-react';
import type { NotificationItem, Lead } from '../types/crm';
import { formatDateDisplay } from '../utils/crmHelpers';

interface NotificationModalProps {
    isOpen: boolean;
    notifications: NotificationItem[];
    leads: Lead[];
    onClose: () => void;
    onSelectLead: (lead: Lead) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    notifications,
    leads,
    onClose,
    onSelectLead,
    onQuickOutreach,
    onMarkAllRead,
}) => {
    if (!isOpen) return null;

    const overdueNotifications = notifications.filter((n) => n.type === 'overdue');
    const dueTodayNotifications = notifications.filter((n) => n.type === 'due_today');
    const coldLeadNotifications = notifications.filter((n) => n.type === 'cold_lead');

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                Outreach Reminders & Alerts
                            </h3>
                            <p className="text-xs text-slate-400">
                                {notifications.length} item{notifications.length === 1 ? '' : 's'} needing your attention
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {notifications.length > 0 && (
                            <button
                                onClick={onMarkAllRead}
                                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                            >
                                Mark Read
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Notifications List Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                All caught up! 🎉
                            </h4>
                            <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                No overdue tasks or pending follow-ups today. Keep up the good work!
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Overdue Section */}
                            {overdueNotifications.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                        Overdue Actions ({overdueNotifications.length})
                                    </h4>

                                    {overdueNotifications.map((notif) => {
                                        const lead = leads.find((l) => l.id === notif.leadId);

                                        return (
                                            <div
                                                key={notif.id}
                                                className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 space-y-3"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                                            {notif.leadName} ({notif.company})
                                                        </span>
                                                        <p className="text-xs text-red-700 dark:text-red-300 font-medium mt-0.5">
                                                            {notif.message}
                                                        </p>
                                                    </div>

                                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-md">
                                                        {formatDateDisplay(notif.dueDate)}
                                                    </span>
                                                </div>

                                                {lead && (
                                                    <div className="flex items-center justify-between pt-2 border-t border-red-200/60 dark:border-red-900/50">
                                                        <button
                                                            onClick={() => {
                                                                onSelectLead(lead);
                                                                onClose();
                                                            }}
                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center"
                                                        >
                                                            <span>View Lead</span>
                                                            <ArrowRight className="w-3 h-3 ml-1" />
                                                        </button>

                                                        <div className="flex items-center space-x-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    onQuickOutreach(lead, 'call');
                                                                    onClose();
                                                                }}
                                                                className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow flex items-center space-x-1"
                                                            >
                                                                <Phone className="w-3 h-3" />
                                                                <span>Call</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    onQuickOutreach(lead, 'email');
                                                                    onClose();
                                                                }}
                                                                className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow flex items-center space-x-1"
                                                            >
                                                                <Mail className="w-3 h-3" />
                                                                <span>Email</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Due Today Section */}
                            {dueTodayNotifications.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        Reach Out Today ({dueTodayNotifications.length})
                                    </h4>

                                    {dueTodayNotifications.map((notif) => {
                                        const lead = leads.find((l) => l.id === notif.leadId);

                                        return (
                                            <div
                                                key={notif.id}
                                                className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/60 space-y-3"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                                            {notif.leadName} ({notif.company})
                                                        </span>
                                                        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mt-0.5">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                {lead && (
                                                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-900/50">
                                                        <button
                                                            onClick={() => {
                                                                onSelectLead(lead);
                                                                onClose();
                                                            }}
                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center"
                                                        >
                                                            <span>View Lead</span>
                                                            <ArrowRight className="w-3 h-3 ml-1" />
                                                        </button>

                                                        <div className="flex items-center space-x-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    onQuickOutreach(lead, 'call');
                                                                    onClose();
                                                                }}
                                                                className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow flex items-center space-x-1"
                                                            >
                                                                <Phone className="w-3 h-3" />
                                                                <span>Call</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    onQuickOutreach(lead, 'email');
                                                                    onClose();
                                                                }}
                                                                className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow flex items-center space-x-1"
                                                            >
                                                                <Mail className="w-3 h-3" />
                                                                <span>Email</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    onQuickOutreach(lead, 'meeting');
                                                                    onClose();
                                                                }}
                                                                className="px-2.5 py-1 rounded-xl bg-amber-600 text-white text-xs font-bold shadow flex items-center space-x-1"
                                                            >
                                                                <Calendar className="w-3 h-3" />
                                                                <span>Meet</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Cold Lead Section */}
                            {coldLeadNotifications.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center">
                                        <Flame className="w-3.5 h-3.5 mr-1" />
                                        Cold Lead Warnings ({coldLeadNotifications.length})
                                    </h4>

                                    {coldLeadNotifications.map((notif) => {
                                        const lead = leads.find((l) => l.id === notif.leadId);

                                        return (
                                            <div
                                                key={notif.id}
                                                className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3"
                                            >
                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                    {notif.message}
                                                </p>

                                                {lead && (
                                                    <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-900/50">
                                                        <button
                                                            onClick={() => {
                                                                onSelectLead(lead);
                                                                onClose();
                                                            }}
                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center"
                                                        >
                                                            <span>Re-engage Lead</span>
                                                            <ArrowRight className="w-3 h-3 ml-1" />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                onQuickOutreach(lead, 'email');
                                                                onClose();
                                                            }}
                                                            className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow flex items-center space-x-1"
                                                        >
                                                            <Mail className="w-3 h-3" />
                                                            <span>Send Re-engagement Email</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

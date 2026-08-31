import type { Lead, NotificationItem, FilterState, Priority, DisclosureStatus, LoanType, DocumentChecklist } from '../types/crm';

export const getTodayString = (dateInput?: Date): string => {
    const d = dateInput || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDateDisplay = (dateString?: string): string => {
    if (!dateString) return 'No date';
    const isoDateString = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return dateString;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(isoDateString);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export interface FollowUpStatus {
    status: 'overdue' | 'due_today' | 'upcoming' | 'no_task';
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    dueDate?: string;
    pendingTaskCount: number;
}

export const getLeadFollowUpStatus = (lead: Lead): FollowUpStatus => {
    const pendingTasks = lead.tasks.filter((t) => !t.completed);

    if (pendingTasks.length === 0 && !lead.nextFollowUpDate) {
        return {
            status: 'no_task',
            label: 'No follow-up set',
            badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
            badgeText: 'text-slate-600 dark:text-slate-400',
            badgeBorder: 'border-slate-200 dark:border-slate-700',
            dotColor: 'bg-slate-400',
            pendingTaskCount: 0,
        };
    }

    const todayStr = getTodayString();
    const taskDates = pendingTasks.map((t) => t.dueDate);
    if (lead.nextFollowUpDate) taskDates.push(lead.nextFollowUpDate);

    taskDates.sort();
    const earliestDate = taskDates[0];

    if (!earliestDate) {
        return {
            status: 'no_task',
            label: 'No active tasks',
            badgeBg: 'bg-slate-100 dark:bg-slate-800',
            badgeText: 'text-slate-500 dark:text-slate-400',
            badgeBorder: 'border-slate-200 dark:border-slate-700',
            dotColor: 'bg-slate-400',
            pendingTaskCount: pendingTasks.length,
        };
    }

    if (earliestDate < todayStr) {
        return {
            status: 'overdue',
            label: `Overdue (${formatDateDisplay(earliestDate)})`,
            badgeBg: 'bg-red-500/10 dark:bg-red-950/40',
            badgeText: 'text-red-600 dark:text-red-400',
            badgeBorder: 'border-red-300 dark:border-red-800/60',
            dotColor: 'bg-red-500 animate-ping',
            dueDate: earliestDate,
            pendingTaskCount: pendingTasks.length,
        };
    }

    if (earliestDate === todayStr) {
        return {
            status: 'due_today',
            label: 'Reach out today! ⏰',
            badgeBg: 'bg-amber-500/15 dark:bg-amber-950/40',
            badgeText: 'text-amber-600 dark:text-amber-400 font-bold',
            badgeBorder: 'border-amber-300 dark:border-amber-800/60',
            dotColor: 'bg-amber-500 animate-ping',
            dueDate: earliestDate,
            pendingTaskCount: pendingTasks.length,
        };
    }

    return {
        status: 'upcoming',
        label: `Follow-up ${formatDateDisplay(earliestDate)}`,
        badgeBg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
        badgeText: 'text-indigo-600 dark:text-indigo-400',
        badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
        dotColor: 'bg-indigo-500',
        dueDate: earliestDate,
        pendingTaskCount: pendingTasks.length,
    };
};

export const getLoanTypeBadge = (loanType: LoanType) => {
    switch (loanType) {
        case 'VA':
            return { label: 'VA Loan', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
        case 'FHA':
            return { label: 'FHA Loan', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
        case 'Jumbo':
            return { label: 'Jumbo', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' };
        case 'Refinance':
            return { label: 'Refinance', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800' };
        case 'USDA':
            return { label: 'USDA Rural', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
        case 'HELOC':
            return { label: 'HELOC', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' };
        case 'Conventional':
        default:
            return { label: 'Conventional', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
    }
};

export const getVADisabilityInfo = (rating?: number) => {
    if (rating === undefined || rating === null) {
        return {
            ratingText: '0% (Standard)',
            isExempt: false,
            badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
            feeStatusText: 'Standard VA Funding Fee applies',
        };
    }
    const isExempt = rating >= 10;
    return {
        ratingText: `${rating}% VA Disability`,
        isExempt,
        badgeColor: isExempt
            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/70 font-extrabold'
            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold',
        feeStatusText: isExempt ? '✨ VA Funding Fee EXEMPT (10%+ Disability)' : 'Standard VA Funding Fee applies',
    };
};

export const getDisclosureStatusBadge = (status: DisclosureStatus) => {
    switch (status) {
        case 'Disclosures Signed':
            return { label: 'Discos Signed ✓', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
        case 'Sent for E-Sign':
            return { label: 'Sent for E-Sign ⏳', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
        case 'Not Sent':
        default:
            return { label: 'Discos Pending', color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
    }
};

export const calculateChecklistProgress = (checklist: DocumentChecklist) => {
    const total = 5;
    const items = [checklist.w2s, checklist.paystubs, checklist.bankStatements, checklist.taxReturns, checklist.photoId];
    const completed = items.filter(Boolean).length;
    return {
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
    };
};

export const generateNotifications = (leads: Lead[]): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    const todayStr = getTodayString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    leads.forEach((lead) => {
        // 1. Overdue tasks
        lead.tasks.forEach((task) => {
            if (!task.completed && task.dueDate < todayStr) {
                notifications.push({
                    id: `notif-overdue-${task.id}`,
                    leadId: lead.id,
                    leadName: lead.name,
                    company: lead.company || 'Borrower',
                    type: 'overdue',
                    message: `Overdue task: "${task.title}" was due ${formatDateDisplay(task.dueDate)}`,
                    dueDate: task.dueDate,
                    timestamp: new Date().toISOString(),
                    read: false,
                    priority: 'high',
                });
            } else if (!task.completed && task.dueDate === todayStr) {
                notifications.push({
                    id: `notif-today-${task.id}`,
                    leadId: lead.id,
                    leadName: lead.name,
                    company: lead.company || 'Borrower',
                    type: 'due_today',
                    message: `Task scheduled for today: "${task.title}"`,
                    dueDate: task.dueDate,
                    timestamp: new Date().toISOString(),
                    read: false,
                    priority: 'medium',
                });
            }
        });

        // 2. Cold Lead Warning (no contact in 7+ days)
        if (lead.lastContactedAt && lead.lastContactedAt < sevenDaysAgo && lead.stage !== 'funded_closed') {
            notifications.push({
                id: `notif-cold-${lead.id}`,
                leadId: lead.id,
                leadName: lead.name,
                company: lead.company || 'Borrower',
                type: 'cold_lead',
                message: `No contact with ${lead.name} in over 7 days. Re-engage to keep active!`,
                timestamp: lead.lastContactedAt,
                read: false,
                priority: 'medium',
            });
        }
    });

    return notifications;
};

export const filterLeads = (leads: Lead[], filters: FilterState): Lead[] => {
    return leads.filter((lead) => {
        if (filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            const matchName = lead.name.toLowerCase().includes(q);
            const matchCompany = lead.company.toLowerCase().includes(q);
            const matchEmail = lead.email.toLowerCase().includes(q);
            const matchRole = lead.role.toLowerCase().includes(q);
            const matchLoanType = lead.loanType.toLowerCase().includes(q);
            const matchProperty = (lead.propertyAddress || '').toLowerCase().includes(q);
            const matchRealtor = (lead.referralPartner || '').toLowerCase().includes(q);
            const matchTags = lead.tags.some((tag) => tag.toLowerCase().includes(q));

            if (!matchName && !matchCompany && !matchEmail && !matchRole && !matchLoanType && !matchProperty && !matchRealtor && !matchTags) {
                return false;
            }
        }

        if (filters.stageFilter !== 'all' && lead.stage !== filters.stageFilter) {
            return false;
        }

        if (filters.priorityFilter !== 'all' && lead.priority !== filters.priorityFilter) {
            return false;
        }

        if (filters.minDealValue > 0 && lead.value < filters.minDealValue) {
            return false;
        }

        if (filters.reachOutStatus !== 'all') {
            const statusInfo = getLeadFollowUpStatus(lead);
            if (statusInfo.status !== filters.reachOutStatus) {
                return false;
            }
        }

        return true;
    }).sort((a, b) => {
        if (filters.sortBy === 'value_desc') {
            return b.value - a.value;
        }
        if (filters.sortBy === 'created_desc') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'name_asc') {
            return a.name.localeCompare(b.name);
        }
        if (filters.sortBy === 'due_date_asc') {
            const statusA = getLeadFollowUpStatus(a);
            const statusB = getLeadFollowUpStatus(b);
            const dateA = statusA.dueDate || '9999-99-99';
            const dateB = statusB.dueDate || '9999-99-99';
            return dateA.localeCompare(dateB);
        }
        return 0;
    });
};

export const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
        case 'high':
            return { label: 'High Priority', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' };
        case 'medium':
            return { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
        case 'low':
        default:
            return { label: 'Standard', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
    }
};

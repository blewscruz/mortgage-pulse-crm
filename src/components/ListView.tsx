import React from 'react';
import {
    Phone,
    Mail,
    Calendar,
    Download,
    Search,
    ArrowUpDown,
    Home
} from 'lucide-react';
import type { Lead, Stage, StageId, FilterState } from '../types/crm';
import {
    formatCurrency,
    getDisclosureStatusBadge,
    getLoanTypeBadge,
    calculateChecklistProgress,
    getPriorityBadge
} from '../utils/crmHelpers';

interface ListViewProps {
    leads: Lead[];
    stages: Stage[];
    onSelectLead: (lead: Lead) => void;
    onMoveStage: (leadId: string, newStage: StageId) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onUpdateLead?: (updatedLead: Lead) => void;
}

export const ListView: React.FC<ListViewProps> = ({
    leads,
    stages,
    onSelectLead,
    onMoveStage,
    onQuickOutreach,
    filters,
    onFilterChange,
    onUpdateLead,
}) => {
    const exportToCSV = () => {
        const headers = [
            'Borrower Name',
            'Email',
            'Phone',
            'Loan Amount',
            'Purchase Price',
            'Loan Program',
            'Property Address',
            'Disclosures Status',
            'Doc Progress',
            'Stage',
        ];

        const rows = leads.map((l) => [
            `"${l.name}"`,
            `"${l.email}"`,
            `"${l.phone}"`,
            l.value,
            l.purchasePrice || '',
            `"${l.loanType || ''}"`,
            `"${l.propertyAddress || ''}"`,
            `"${l.disclosuresStatus || ''}"`,
            `"${calculateChecklistProgress(l.documentChecklist).completed}/5"`,
            `"${l.stage}"`,
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `mortgage_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">

            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">

                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by borrower, address, loan program..."
                        value={filters.searchQuery}
                        onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">

                    {/* Sort */}
                    <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={filters.sortBy}
                            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                            className="text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none font-medium"
                        >
                            <option value="due_date_asc">Earliest Action Due</option>
                            <option value="value_desc">Highest Loan Amount</option>
                            <option value="created_desc">Most Recent</option>
                            <option value="name_asc">Borrower A-Z</option>
                        </select>
                    </div>

                    {/* CSV Export */}
                    <button
                        onClick={exportToCSV}
                        className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center space-x-1.5 transition-all"
                    >
                        <Download className="w-4 h-4 text-indigo-500" />
                        <span>Export CSV</span>
                    </button>
                </div>

            </div>

            {/* Pipeline Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Borrower & File</th>
                                <th className="py-3.5 px-4">Priority</th>
                                <th className="py-3.5 px-4">Loan Program & Amount</th>
                                <th className="py-3.5 px-4">Property & Realtor</th>
                                <th className="py-3.5 px-4">Disclosures (Discos)</th>
                                <th className="py-3.5 px-4">Doc Progress</th>
                                <th className="py-3.5 px-4">Pipeline Stage</th>
                                <th className="py-3.5 px-4 text-right">Quick Reach Out</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No borrower files match your current filters.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => {
                                    const loanBadge = getLoanTypeBadge(lead.loanType);
                                    const discoBadge = getDisclosureStatusBadge(lead.disclosuresStatus);
                                    const docProgress = calculateChecklistProgress(lead.documentChecklist);
                                    const priorityBadge = getPriorityBadge(lead.priority);

                                    return (
                                        <tr
                                            key={lead.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer"
                                        >
                                            {/* Borrower */}
                                            <td className="py-3.5 px-4" onClick={() => onSelectLead(lead)}>
                                                <div className="flex items-center space-x-3">
                                                    {lead.avatar ? (
                                                        <img
                                                            src={lead.avatar}
                                                            alt={lead.name}
                                                            className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/20">
                                                            {lead.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <span className="font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                                {lead.name}
                                                            </span>
                                                            {(lead.hasCoBorrower || lead.coBorrowerName) && (
                                                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                                                    👥 Joint
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-medium">
                                                            {lead.company || 'Borrower'} • {lead.phone}
                                                            {(lead.hasCoBorrower || lead.coBorrowerName) && (
                                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                                                                    (Spouse: {lead.coBorrowerName || 'Co-Borrower'})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Priority Selector */}
                                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={lead.priority}
                                                    onChange={(e) => {
                                                        if (onUpdateLead) {
                                                            onUpdateLead({ ...lead, priority: e.target.value as any });
                                                        }
                                                    }}
                                                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border cursor-pointer focus:outline-none ${priorityBadge.color}`}
                                                >
                                                    <option value="high">High Priority</option>
                                                    <option value="medium">Medium Priority</option>
                                                    <option value="low">Standard</option>
                                                </select>
                                            </td>

                                            {/* Loan Amount */}
                                            <td className="py-3.5 px-4" onClick={() => onSelectLead(lead)}>
                                                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(lead.value)}
                                                </div>
                                                <div className="flex items-center space-x-1 mt-0.5">
                                                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${loanBadge.color}`}>
                                                        {loanBadge.label}
                                                    </span>
                                                    {lead.loanType === 'VA' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                                            VA {lead.vaDisabilityRating ?? 0}% {(lead.vaDisabilityRating ?? 0) >= 10 ? '✓' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Property */}
                                            <td className="py-3.5 px-4 max-w-[200px]" onClick={() => onSelectLead(lead)}>
                                                <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium truncate">
                                                    <Home className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                                                    <span className="truncate">{lead.propertyAddress || 'TBD'}</span>
                                                </div>
                                                {lead.referralPartner && (
                                                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                                                        Ref: {lead.referralPartner}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Disclosures Status */}
                                            <td className="py-3.5 px-4" onClick={() => onSelectLead(lead)}>
                                                <span className={`px-2 py-1 text-[11px] font-bold rounded-lg border ${discoBadge.color}`}>
                                                    {discoBadge.label}
                                                </span>
                                            </td>

                                            {/* Doc Progress */}
                                            <td className="py-3.5 px-4" onClick={() => onSelectLead(lead)}>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-indigo-600 h-full rounded-full"
                                                            style={{ width: `${docProgress.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                        {docProgress.completed}/5
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Stage Selector */}
                                            <td className="py-3.5 px-4">
                                                <select
                                                    value={lead.stage}
                                                    onChange={(e) => onMoveStage(lead.id, e.target.value as StageId)}
                                                    className="py-1 px-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-indigo-600 dark:text-indigo-300 focus:outline-none"
                                                >
                                                    {stages.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Quick Reach Out Suite */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <button
                                                        onClick={() => onQuickOutreach(lead, 'call')}
                                                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white transition-all"
                                                        title="Call Borrower"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onQuickOutreach(lead, 'email')}
                                                        className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all"
                                                        title="Email Borrower"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onQuickOutreach(lead, 'meeting')}
                                                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white transition-all"
                                                        title="Schedule Meeting"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

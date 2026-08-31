import React from 'react';
import {
    Phone,
    Mail,
    Calendar,
    Clock,
    DollarSign,
    Home,
    FileCheck,
    Shield
} from 'lucide-react';
import type { Lead, StageId } from '../types/crm';
import {
    getLeadFollowUpStatus,
    formatCurrency,
    getPriorityBadge,
    getDisclosureStatusBadge,
    getLoanTypeBadge,
    calculateChecklistProgress,
    getVADisabilityInfo
} from '../utils/crmHelpers';

interface LeadCardProps {
    lead: Lead;
    onSelectLead: (lead: Lead) => void;
    onMoveStage: (leadId: string, newStage: StageId) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    onUpdateLead?: (updatedLead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
    lead,
    onSelectLead,
    onQuickOutreach,
    onUpdateLead,
}) => {
    const statusInfo = getLeadFollowUpStatus(lead);
    const priorityBadge = getPriorityBadge(lead.priority);
    const loanBadge = getLoanTypeBadge(lead.loanType);
    const discoBadge = getDisclosureStatusBadge(lead.disclosuresStatus);
    const docProgress = calculateChecklistProgress(lead.documentChecklist);
    const vaInfo = getVADisabilityInfo(lead.vaDisabilityRating);

    return (
        <div className="group relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-0.5">

            {/* Header Info */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectLead(lead)}>
                    <div className="relative">
                        {lead.avatar ? (
                            <img
                                src={lead.avatar}
                                alt={lead.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-indigo-500/20">
                                {lead.name.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${statusInfo.dotColor}`} />
                    </div>

                    <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {lead.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {lead.company || 'Borrower'} • {lead.role || 'Primary'}
                        </p>
                        {(lead.hasCoBorrower || lead.coBorrowerName) && (
                            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center mt-0.5">
                                <span className="mr-1">👥</span>
                                <span>Co-Borrower: {lead.coBorrowerName || 'Spouse'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Interactive Priority Selector Badge */}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={lead.priority}
                        onChange={(e) => {
                            if (onUpdateLead) {
                                onUpdateLead({ ...lead, priority: e.target.value as any });
                            }
                        }}
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border cursor-pointer focus:outline-none appearance-none pr-4.5 ${priorityBadge.color}`}
                        title="Click to change Lead Priority"
                    >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Standard Priority</option>
                    </select>
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none opacity-60">▼</span>
                </div>
            </div>

            {/* Loan Deal Highlights */}
            <div className="my-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                        <span>{formatCurrency(lead.value)}</span>
                        <span className="text-[10px] font-normal text-slate-400 ml-1">Loan</span>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${loanBadge.color}`}>
                        {loanBadge.label}
                    </span>
                </div>

                {lead.propertyAddress && (
                    <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <Home className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.propertyAddress}</span>
                    </div>
                )}

                {/* Dedicated VA Disability Rating Badge */}
                {lead.loanType === 'VA' && (
                    <div className="mt-1 flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                        <span className="font-extrabold flex items-center">
                            <Shield className="w-3 h-3 mr-1 text-blue-500 shrink-0" />
                            VA Rating: {lead.vaDisabilityRating ?? 0}%
                        </span>
                        <span className="text-[10px] font-bold">
                            {vaInfo.isExempt ? 'Fee Exempt ✓' : 'Standard Fee'}
                        </span>
                    </div>
                )}

                {/* Initial Disclosures & Docs Progress */}
                <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-slate-200/60 dark:border-slate-700/50">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${discoBadge.color}`}>
                        {discoBadge.label}
                    </span>

                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <FileCheck className="w-3 h-3 text-indigo-500" />
                        <span>Docs {docProgress.completed}/5</span>
                    </div>
                </div>

            </div>

            {/* Tags preview */}
            {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {lead.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md"
                        >
                            #{tag}
                        </span>
                    ))}
                    {lead.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                            +{lead.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Action Bar Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">

                {/* Next Follow Up status indicator */}
                <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{statusInfo.label}</span>
                </div>

                {/* Quick Outreach Buttons */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => onQuickOutreach(lead, 'call')}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white transition-colors"
                        title="Call Borrower"
                    >
                        <Phone className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={() => onQuickOutreach(lead, 'email')}
                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-colors"
                        title="Email Disclosures/Docs"
                    >
                        <Mail className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={() => onQuickOutreach(lead, 'meeting')}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white transition-colors"
                        title="Schedule Pitch Meeting"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                    </button>
                </div>

            </div>

        </div>
    );
};

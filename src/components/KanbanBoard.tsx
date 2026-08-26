import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Filter, ArrowUpDown, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import type { Lead, Stage, StageId, FilterState } from '../types/crm';
import { LeadCard } from './LeadCard';
import { formatCurrency } from '../utils/crmHelpers';

interface KanbanBoardProps {
    stages: Stage[];
    leads: Lead[];
    onSelectLead: (lead: Lead) => void;
    onMoveStage: (leadId: string, newStage: StageId) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    onOpenAddLeadWithStage?: (stageId: StageId) => void;
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    stages,
    leads,
    onSelectLead,
    onMoveStage,
    onQuickOutreach,
    onOpenAddLeadWithStage,
    filters,
    onFilterChange,
}) => {
    const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);

    const handleDragOver = (e: React.DragEvent, stageId: StageId) => {
        e.preventDefault();
        setDragOverStage(stageId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverStage(null);
    };

    const handleDrop = (e: React.DragEvent, newStageId: StageId) => {
        e.preventDefault();
        setDragOverStage(null);
        const leadId = e.dataTransfer.getData('text/plain');
        if (leadId) {
            if (newStageId === 'funded_closed') {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 },
                });
            }
            onMoveStage(leadId, newStageId);
        }
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('text/plain', leadId);
    };

    return (
        <div className="space-y-4">
            {/* Board Controls & Reach Out Quick Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">

                {/* Reach Out Urgency Filter Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                    <span className="text-xs font-medium text-slate-400 mr-1 flex items-center">
                        <Filter className="w-3.5 h-3.5 mr-1" />
                        Reminders:
                    </span>

                    <button
                        onClick={() => onFilterChange({ ...filters, reachOutStatus: 'all' })}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${filters.reachOutStatus === 'all'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                    >
                        All Loans ({leads.length})
                    </button>

                    <button
                        onClick={() => onFilterChange({ ...filters, reachOutStatus: 'overdue' })}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${filters.reachOutStatus === 'overdue'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                            }`}
                    >
                        <AlertCircle className="w-3 h-3" />
                        <span>Overdue Action</span>
                    </button>

                    <button
                        onClick={() => onFilterChange({ ...filters, reachOutStatus: 'due_today' })}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${filters.reachOutStatus === 'due_today'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60'
                            }`}
                    >
                        <Clock className="w-3 h-3" />
                        <span>Reach Out Today</span>
                    </button>

                    <button
                        onClick={() => onFilterChange({ ...filters, reachOutStatus: 'upcoming' })}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${filters.reachOutStatus === 'upcoming'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            }`}
                    >
                        <CheckCircle className="w-3 h-3" />
                        <span>Upcoming</span>
                    </button>
                </div>

                {/* Sorting Dropdown */}
                <div className="flex items-center space-x-2">
                    <label className="text-xs text-slate-400 flex items-center">
                        <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                        Sort:
                    </label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                        className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="due_date_asc">Earliest Action Due</option>
                        <option value="value_desc">Highest Loan Amount</option>
                        <option value="created_desc">Most Recent Leads</option>
                        <option value="name_asc">Borrower (A-Z)</option>
                    </select>
                </div>

            </div>

            {/* Kanban Pipeline Stage Columns Grid */}
            <div className="flex space-x-4 overflow-x-auto pb-6 pt-1 custom-scrollbar min-h-[calc(100vh-210px)] items-start">
                {stages.map((stage) => {
                    const stageLeads = leads.filter((l) => l.stage === stage.id);
                    const stageTotalValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
                    const isDraggingOver = dragOverStage === stage.id;

                    return (
                        <div
                            key={stage.id}
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            className={`w-80 shrink-0 flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border transition-all duration-200 ${isDraggingOver
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
                                    : 'border-slate-200/80 dark:border-slate-800'
                                }`}
                        >
                            {/* Column Header */}
                            <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-2xl z-10">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full shadow-sm"
                                        style={{ backgroundColor: stage.accentHex }}
                                    />
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                        {stage.name}
                                    </h3>
                                    <span className="px-2 py-0.5 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                                        {stageLeads.length}
                                    </span>
                                </div>

                                <div className="text-right">
                                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                        {formatCurrency(stageTotalValue)}
                                    </span>
                                </div>
                            </div>

                            {/* Column Cards Area */}
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar min-h-[150px]">
                                {stageLeads.length === 0 ? (
                                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            No files in {stage.name}
                                        </p>
                                        <p className="text-[11px] text-slate-400/80 mt-1">
                                            Drag borrower cards here
                                        </p>
                                    </div>
                                ) : (
                                    stageLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead.id)}
                                        >
                                            <LeadCard
                                                lead={lead}
                                                onSelectLead={onSelectLead}
                                                onQuickOutreach={onQuickOutreach}
                                                onMoveStage={onMoveStage}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Lead to Stage Button */}
                            {onOpenAddLeadWithStage && (
                                <div className="p-2 border-t border-slate-200/50 dark:border-slate-800/80">
                                    <button
                                        onClick={() => onOpenAddLeadWithStage(stage.id)}
                                        className="w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add to {stage.name}</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
        </div>
    );
};

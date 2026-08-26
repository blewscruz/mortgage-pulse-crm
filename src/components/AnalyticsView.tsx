import React from 'react';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Award,
    PieChart,
    Target,
    ShieldCheck
} from 'lucide-react';
import type { Lead, Stage } from '../types/crm';
import { formatCurrency } from '../utils/crmHelpers';

interface AnalyticsViewProps {
    leads: Lead[];
    stages: Stage[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, stages }) => {
    const totalLeads = leads.length;
    const totalPipeline = leads.reduce((sum, l) => sum + l.value, 0);

    const fundedLeads = leads.filter((l) => l.stage === 'funded_closed');
    const fundedValue = fundedLeads.reduce((sum, l) => sum + l.value, 0);

    const underwritingLeads = leads.filter((l) => l.stage === 'underwriting_clear_to_close');
    const underwritingValue = underwritingLeads.reduce((sum, l) => sum + l.value, 0);

    const avgLoanSize = totalLeads > 0 ? Math.round(totalPipeline / totalLeads) : 0;

    const discosPending = leads.filter((l) => l.disclosuresStatus === 'Sent for E-Sign').length;

    const loanTypeBreakdown = leads.reduce((acc, lead) => {
        const type = lead.loanType || 'Conventional';
        acc[type] = (acc[type] || 0) + lead.value;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* Top 4 Loan Officer KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Total Loan Pipeline */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Total Loan Pipeline
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                        {formatCurrency(totalPipeline)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">Across {totalLeads} active borrower files</span>
                </div>

                {/* Underwriting / Clear-to-Close Volume */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            In Underwriting / CTC
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                        {formatCurrency(underwritingValue)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">{underwritingLeads.length} loans near funding</span>
                </div>

                {/* Funded & Closed */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Funded & Closed
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                        {formatCurrency(fundedValue)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">{fundedLeads.length} closed loans</span>
                </div>

                {/* Average Loan Size */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Average Loan Size
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                        {formatCurrency(avgLoanSize)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">Average per borrower file</span>
                </div>

            </div>

            {/* Stage Breakdown & Loan Type Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Stage Value Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" />
                        Mortgage Pipeline Distribution by Stage
                    </h3>

                    <div className="space-y-3">
                        {stages.map((stage) => {
                            const stageLeads = leads.filter((l) => l.stage === stage.id);
                            const val = stageLeads.reduce((sum, l) => sum + l.value, 0);
                            const percentage = totalPipeline > 0 ? Math.round((val / totalPipeline) * 100) : 0;

                            return (
                                <div key={stage.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-700 dark:text-slate-300 flex items-center">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full mr-2"
                                                style={{ backgroundColor: stage.accentHex }}
                                            />
                                            {stage.name} ({stageLeads.length})
                                        </span>
                                        <span className="text-slate-900 dark:text-slate-100">
                                            {formatCurrency(val)} ({percentage}%)
                                        </span>
                                    </div>

                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: stage.accentHex,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Loan Program Volume & Disclosures Insights */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                        <PieChart className="w-4 h-4 mr-2 text-indigo-600" />
                        Loan Program Breakdown & Disclosures Status
                    </h3>

                    {/* Program breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(loanTypeBreakdown).map(([program, volume]) => (
                            <div key={program} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{program}</span>
                                <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
                                    {formatCurrency(volume)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Initial Disclosures banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-indigo-50 dark:from-rose-950/40 dark:to-indigo-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <ShieldCheck className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                    Initial Disclosures (Discos) Awaiting E-Sign
                                </h4>
                                <p className="text-xs text-rose-600 dark:text-rose-300 font-bold mt-0.5">
                                    {discosPending} borrower file(s) currently out for electronic signature
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};

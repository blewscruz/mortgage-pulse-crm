import React, { useState, useMemo } from 'react';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Award,
    PieChart,
    Target,
    ShieldCheck,
    Calendar,
    Coins,
    CheckCircle2
} from 'lucide-react';
import type { Lead, Stage } from '../types/crm';
import { formatCurrency } from '../utils/crmHelpers';

interface AnalyticsViewProps {
    leads: Lead[];
    stages: Stage[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, stages }) => {
    // 150 BPS = 1.50% default LO Commission Rate
    const [commissionBps, setCommissionBps] = useState<number>(150);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    // Helper: Extract YYYY-MM and formatted Month Name from ISO date string
    const getMonthKeyAndLabel = (dateStr?: string) => {
        if (!dateStr) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
            return { key: `${year}-${month}`, label };
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
            return { key: `${year}-${month}`, label };
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        return { key: `${year}-${month}`, label };
    };

    // Calculate all unique months available in leads data
    const { availableMonths, monthlyDataMap } = useMemo(() => {
        const map: Record<string, {
            label: string;
            fundedLeads: Lead[];
            fundedVolume: number;
            inProcessLeads: Lead[];
            inProcessVolume: number;
        }> = {};

        // Always include current month
        const currentMonthInfo = getMonthKeyAndLabel();
        map[currentMonthInfo.key] = {
            label: currentMonthInfo.label,
            fundedLeads: [],
            fundedVolume: 0,
            inProcessLeads: [],
            inProcessVolume: 0,
        };

        leads.forEach((lead) => {
            const isFunded = lead.stage === 'funded_closed';
            const dateToUse = isFunded
                ? (lead.fundedDate || lead.lastContactedAt || lead.createdAt)
                : lead.createdAt;

            const { key, label } = getMonthKeyAndLabel(dateToUse);

            if (!map[key]) {
                map[key] = {
                    label,
                    fundedLeads: [],
                    fundedVolume: 0,
                    inProcessLeads: [],
                    inProcessVolume: 0,
                };
            }

            if (isFunded) {
                map[key].fundedLeads.push(lead);
                map[key].fundedVolume += lead.value;
            } else if (lead.stage !== 'lost') {
                map[key].inProcessLeads.push(lead);
                map[key].inProcessVolume += lead.value;
            }
        });

        const sortedKeys = Object.keys(map).sort().reverse();
        const sortedMonths = sortedKeys.map((key) => ({
            key,
            label: map[key].label,
        }));

        return { availableMonths: sortedMonths, monthlyDataMap: map };
    }, [leads]);

    // Filter leads based on selected month
    const filteredLeads = useMemo(() => {
        if (selectedMonth === 'all') return leads;

        return leads.filter((lead) => {
            const isFunded = lead.stage === 'funded_closed';
            const dateToUse = isFunded
                ? (lead.fundedDate || lead.lastContactedAt || lead.createdAt)
                : lead.createdAt;

            const { key } = getMonthKeyAndLabel(dateToUse);
            return key === selectedMonth;
        });
    }, [leads, selectedMonth]);

    // Overall & Filtered Calculations
    const totalLeads = filteredLeads.length;
    const totalPipeline = filteredLeads.reduce((sum, l) => sum + l.value, 0);

    const fundedLeads = filteredLeads.filter((l) => l.stage === 'funded_closed');
    const fundedValue = fundedLeads.reduce((sum, l) => sum + l.value, 0);

    const inProcessLeads = filteredLeads.filter((l) => l.stage !== 'funded_closed' && l.stage !== 'lost');
    const inProcessValue = inProcessLeads.reduce((sum, l) => sum + l.value, 0);

    const underwritingLeads = filteredLeads.filter((l) => l.stage === 'underwriting_clear_to_close');
    const underwritingValue = underwritingLeads.reduce((sum, l) => sum + l.value, 0);

    const avgLoanSize = totalLeads > 0 ? Math.round(totalPipeline / totalLeads) : 0;
    const estimatedCommission = Math.round(fundedValue * (commissionBps / 10000));

    const discosPending = filteredLeads.filter((l) => l.disclosuresStatus === 'Sent for E-Sign').length;

    const loanTypeBreakdown = filteredLeads.reduce((acc, lead) => {
        const type = lead.loanType || 'Conventional';
        acc[type] = (acc[type] || 0) + lead.value;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">

            {/* Header Control Bar: Month Selector & Commission Rate Calculator */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                            Monthly Volume Analytics
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Track closed funded loan volume & active in-process pipeline month over month.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Month Selector */}
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Period:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-xs font-black text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                        >
                            <option value="all">📅 All-Time Production</option>
                            {availableMonths.map((m) => (
                                <option key={m.key} value={m.key}>
                                    📆 {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* LO Commission Rate Bps Calculator */}
                    <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">LO Rate:</span>
                        <select
                            value={commissionBps}
                            onChange={(e) => setCommissionBps(Number(e.target.value))}
                            className="bg-transparent text-xs font-black text-emerald-700 dark:text-emerald-300 focus:outline-none cursor-pointer"
                        >
                            <option value={100}>1.00% (100 bps)</option>
                            <option value={125}>1.25% (125 bps)</option>
                            <option value={150}>1.50% (150 bps)</option>
                            <option value={175}>1.75% (175 bps)</option>
                            <option value={200}>2.00% (200 bps)</option>
                            <option value={250}>2.50% (250 bps)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Hero KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Funded & Closed Volume (The Revenue Generator) */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                            {selectedMonth === 'all' ? 'Total Funded Volume' : 'Monthly Funded Volume'}
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black mt-2">
                        {formatCurrency(fundedValue)}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs">
                        <span className="font-medium text-emerald-100">{fundedLeads.length} closed loans</span>
                        <span className="font-black bg-white/20 px-2 py-0.5 rounded-lg text-[11px] backdrop-blur-sm">
                            Est. {formatCurrency(estimatedCommission)}
                        </span>
                    </div>
                </div>

                {/* Active In-Process Volume */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            In-Process Pipeline
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                        {formatCurrency(inProcessValue)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                        {inProcessLeads.length} active borrower files in workflow
                    </span>
                </div>

                {/* In Underwriting / CTC Volume */}
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
                    <span className="text-[11px] text-slate-400 mt-1 block">
                        {underwritingLeads.length} loans near funding stage
                    </span>
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
                    <span className="text-[11px] text-slate-400 mt-1 block">
                        Average deal volume per borrower
                    </span>
                </div>

            </div>

            {/* Monthly Production Breakdown Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" />
                            Month-by-Month Production & Commission Summary
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Loans automatically calculate into monthly funded volume once moved to "Funded & Closed".
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Month</th>
                                <th className="py-3 px-4">Funded Volume</th>
                                <th className="py-3 px-4">Closed Deals</th>
                                <th className="py-3 px-4">In-Process Volume</th>
                                <th className="py-3 px-4">Est. LO Revenue ({commissionBps / 100}%)</th>
                                <th className="py-3 px-4 text-right">Filter</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                            {availableMonths.map((m) => {
                                const mData = monthlyDataMap[m.key];
                                const mEstRev = Math.round(mData.fundedVolume * (commissionBps / 10000));
                                const isCurrent = getMonthKeyAndLabel().key === m.key;

                                return (
                                    <tr
                                        key={m.key}
                                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${selectedMonth === m.key ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : ''
                                            }`}
                                    >
                                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                                            <span>{m.label}</span>
                                            {isCurrent && (
                                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                                    Current Month
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(mData.fundedVolume)}
                                        </td>

                                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                                            {mData.fundedLeads.length} funded
                                        </td>

                                        <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(mData.inProcessVolume)} ({mData.inProcessLeads.length} active)
                                        </td>

                                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">
                                            {formatCurrency(mEstRev)}
                                        </td>

                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => setSelectedMonth(m.key)}
                                                className={`px-3 py-1 text-[11px] font-extrabold rounded-xl transition-all ${selectedMonth === m.key
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {selectedMonth === m.key ? 'Active View' : 'View Month'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Funded Borrower Files List for Selected Period */}
            {fundedLeads.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                            Funded & Closed Borrower Deals ({fundedLeads.length})
                        </h3>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            Total: {formatCurrency(fundedValue)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fundedLeads.map((lead) => {
                            const dealRev = Math.round(lead.value * (commissionBps / 10000));
                            return (
                                <div
                                    key={lead.id}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                                            {lead.name}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                            Funded
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">{lead.loanType} Loan</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(lead.value)}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                        <span>Est. LO Comm: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(dealRev)}</strong></span>
                                        <span>{lead.fundedDate || lead.createdAt.slice(0, 10)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
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

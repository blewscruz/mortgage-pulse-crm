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
    CheckCircle2,
    Zap,
    Sparkles
} from 'lucide-react';
import type { Lead, Stage } from '../types/crm';
import { formatCurrency } from '../utils/crmHelpers';

interface AnalyticsViewProps {
    leads: Lead[];
    stages: Stage[];
}

/**
 * Company Lead Tier Rate Rule:
 * - 1-5 loans: 10%
 * - 6-11 loans: 15%
 * - 12-20 loans: 20%
 * - 21+ loans: 30%
 * - Self-Generated: 70%
 */
export function getCompanyLeadTierRate(fundedCount: number): {
    rate: number;
    ratePercent: string;
    label: string;
    nextTierLabel: string;
    remainingForNextTier: number;
} {
    if (fundedCount >= 21) {
        return {
            rate: 0.30,
            ratePercent: '30%',
            label: '30% Tier (21+ Loans)',
            nextTierLabel: 'Max Tier Unlocked!',
            remainingForNextTier: 0,
        };
    } else if (fundedCount >= 12) {
        return {
            rate: 0.20,
            ratePercent: '20%',
            label: '20% Tier (12-20 Loans)',
            nextTierLabel: '30% Tier (21+ Loans)',
            remainingForNextTier: 21 - fundedCount,
        };
    } else if (fundedCount >= 6) {
        return {
            rate: 0.15,
            ratePercent: '15%',
            label: '15% Tier (6-11 Loans)',
            nextTierLabel: '20% Tier (12-20 Loans)',
            remainingForNextTier: 12 - fundedCount,
        };
    } else {
        return {
            rate: 0.10,
            ratePercent: '10%',
            label: '10% Tier (1-5 Loans)',
            nextTierLabel: '15% Tier (6-11 Loans)',
            remainingForNextTier: Math.max(1, 6 - fundedCount),
        };
    }
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, stages }) => {
    // Default Section A % of Loan Amount (e.g. 1.50%)
    const [sectionAPercent, setSectionAPercent] = useState<number>(1.50);
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

    // Helper: Compute deal commission based on Section A and Lead Origin
    const computeLeadCommission = (lead: Lead, monthlyFundedCount: number) => {
        const sectionA = lead.sectionAAmount ?? Math.round(lead.value * (sectionAPercent / 100));
        const isSelfGen = lead.isSelfGenerated ?? (lead.source?.toLowerCase().includes('self') || false);
        const tier = getCompanyLeadTierRate(monthlyFundedCount);
        const rate = isSelfGen ? 0.70 : tier.rate;
        const commission = Math.round(sectionA * rate);

        return {
            sectionA,
            isSelfGen,
            rate,
            rateLabel: isSelfGen ? '70% (Self-Gen)' : `${tier.ratePercent} (Company)`,
            commission,
        };
    };

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

    const avgLoanSize = totalLeads > 0 ? Math.round(totalPipeline / totalLeads) : 0;

    // Monthly Tier Info for selected month
    const currentMonthKey = getMonthKeyAndLabel().key;
    const targetMonthKey = selectedMonth === 'all' ? currentMonthKey : selectedMonth;
    const targetMonthFundedCount = (monthlyDataMap[targetMonthKey]?.fundedLeads || []).length;
    const activeTierInfo = getCompanyLeadTierRate(targetMonthFundedCount);

    // Calculate total commissions & Section A totals for filtered selection
    const { totalCommission, totalSectionA, selfGenCount, companyLeadCount } = useMemo(() => {
        let commSum = 0;
        let secASum = 0;
        let selfGenC = 0;
        let compC = 0;

        fundedLeads.forEach((l) => {
            const dateToUse = l.fundedDate || l.lastContactedAt || l.createdAt;
            const { key } = getMonthKeyAndLabel(dateToUse);
            const mFundedCount = (monthlyDataMap[key]?.fundedLeads || []).length;

            const info = computeLeadCommission(l, mFundedCount);
            commSum += info.commission;
            secASum += info.sectionA;
            if (info.isSelfGen) selfGenC++;
            else compC++;
        });

        return {
            totalCommission: commSum,
            totalSectionA: secASum,
            selfGenCount: selfGenC,
            companyLeadCount: compC,
        };
    }, [fundedLeads, monthlyDataMap, sectionAPercent]);

    const discosPending = filteredLeads.filter((l) => l.disclosuresStatus === 'Sent for E-Sign').length;

    const loanTypeBreakdown = filteredLeads.reduce((acc, lead) => {
        const type = lead.loanType || 'Conventional';
        acc[type] = (acc[type] || 0) + lead.value;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">

            {/* Header Control Bar: Month Selector & Section A Configurator */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Monthly Volume & Tiered Commission Analytics</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                Section A Rules
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Commission calculated on Section A closing costs: <strong>70% Self-Generated</strong> | <strong>10%-30% Company Lead Tiers</strong>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Selector */}
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

                    {/* Section A % Rate Configurator */}
                    <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                        <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Section A Fee %:</span>
                        <select
                            value={sectionAPercent}
                            onChange={(e) => setSectionAPercent(Number(e.target.value))}
                            className="bg-transparent text-xs font-black text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer"
                        >
                            <option value={1.00}>1.00% of Loan</option>
                            <option value={1.25}>1.25% of Loan</option>
                            <option value={1.50}>1.50% of Loan (Standard)</option>
                            <option value={1.75}>1.75% of Loan</option>
                            <option value={2.00}>2.00% of Loan</option>
                            <option value={2.50}>2.50% of Loan</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Compensation Tier Structure Progress Bar Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-500/20 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                            Monthly Company Lead Tier Status ({targetMonthFundedCount} Funded Loans)
                        </span>
                    </div>

                    <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 self-start sm:self-auto">
                        Current Tier: {activeTierInfo.label}
                    </span>
                </div>

                {/* Visual Tiers Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {/* Tier 1 */}
                    <div className={`p-2.5 rounded-2xl border text-center transition-all ${targetMonthFundedCount >= 1 && targetMonthFundedCount <= 5
                        ? 'bg-indigo-600 text-white border-white shadow-md font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                        <span className="text-[10px] uppercase font-bold block">1-5 Loans</span>
                        <span className="text-sm font-black block text-amber-300">10%</span>
                        <span className="text-[9px] opacity-80 block">Company Rate</span>
                    </div>

                    {/* Tier 2 */}
                    <div className={`p-2.5 rounded-2xl border text-center transition-all ${targetMonthFundedCount >= 6 && targetMonthFundedCount <= 11
                        ? 'bg-indigo-600 text-white border-white shadow-md font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                        <span className="text-[10px] uppercase font-bold block">6-11 Loans</span>
                        <span className="text-sm font-black block text-amber-300">15%</span>
                        <span className="text-[9px] opacity-80 block">Company Rate</span>
                    </div>

                    {/* Tier 3 */}
                    <div className={`p-2.5 rounded-2xl border text-center transition-all ${targetMonthFundedCount >= 12 && targetMonthFundedCount <= 20
                        ? 'bg-indigo-600 text-white border-white shadow-md font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                        <span className="text-[10px] uppercase font-bold block">12-20 Loans</span>
                        <span className="text-sm font-black block text-amber-300">20%</span>
                        <span className="text-[9px] opacity-80 block">Company Rate</span>
                    </div>

                    {/* Tier 4 */}
                    <div className={`p-2.5 rounded-2xl border text-center transition-all ${targetMonthFundedCount >= 21
                        ? 'bg-indigo-600 text-white border-white shadow-md font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                        <span className="text-[10px] uppercase font-bold block">21+ Loans</span>
                        <span className="text-sm font-black block text-amber-300">30%</span>
                        <span className="text-[9px] opacity-80 block">Company Rate</span>
                    </div>

                    {/* Self Generated Fixed Tier */}
                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-emerald-400/40 text-center col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-300 block">Self Generated</span>
                        <span className="text-sm font-black block text-emerald-300">70%</span>
                        <span className="text-[9px] text-emerald-200 opacity-90 block">Always Fixed</span>
                    </div>
                </div>

                {/* Motivation Goal Bar */}
                {activeTierInfo.remainingForNextTier > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                        <span className="flex items-center space-x-1.5 font-medium">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                                Next Goal: <strong>Fund {activeTierInfo.remainingForNextTier} more loan(s)</strong> to unlock the <strong>{activeTierInfo.nextTierLabel}</strong>!
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* Hero KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Total LO Payout Commission */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                            Est. LO Payout Commission
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black mt-2">
                        {formatCurrency(totalCommission)}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs">
                        <span className="font-medium text-emerald-100">{fundedLeads.length} funded deals</span>
                        <span className="font-black bg-white/20 px-2 py-0.5 rounded-lg text-[11px] backdrop-blur-sm">
                            Sec A: {formatCurrency(totalSectionA)}
                        </span>
                    </div>
                </div>

                {/* Monthly Funded Volume */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Funded Loan Volume
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                        {formatCurrency(fundedValue)}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                        {selfGenCount} Self-Gen (70%) • {companyLeadCount} Company Deals
                    </span>
                </div>

                {/* Active In-Process Volume */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
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
                            Month-by-Month Production & Tiered Payout Summary
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Company lead tier percentage scales automatically based on total funded loans in that month.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Month</th>
                                <th className="py-3 px-4">Funded Volume</th>
                                <th className="py-3 px-4">Funded Deals</th>
                                <th className="py-3 px-4">Company Tier</th>
                                <th className="py-3 px-4">In-Process Volume</th>
                                <th className="py-3 px-4">Est. LO Payout ($)</th>
                                <th className="py-3 px-4 text-right">Filter</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                            {availableMonths.map((m) => {
                                const mData = monthlyDataMap[m.key];
                                const mFundedCount = mData.fundedLeads.length;
                                const mTier = getCompanyLeadTierRate(mFundedCount);

                                let mCommissionSum = 0;
                                mData.fundedLeads.forEach((l) => {
                                    mCommissionSum += computeLeadCommission(l, mFundedCount).commission;
                                });

                                const isCurrent = currentMonthKey === m.key;

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
                                            {mFundedCount} loans
                                        </td>

                                        <td className="py-3.5 px-4 font-extrabold text-amber-600 dark:text-amber-400">
                                            {mTier.ratePercent} Rate
                                        </td>

                                        <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(mData.inProcessVolume)} ({mData.inProcessLeads.length} active)
                                        </td>

                                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">
                                            {formatCurrency(mCommissionSum)}
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

            {/* Detailed Funded Deals Payout Breakdown */}
            {fundedLeads.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                            Funded Deals Commission Breakdown ({fundedLeads.length})
                        </h3>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            Total Payout: {formatCurrency(totalCommission)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fundedLeads.map((lead) => {
                            const dateToUse = lead.fundedDate || lead.lastContactedAt || lead.createdAt;
                            const { key } = getMonthKeyAndLabel(dateToUse);
                            const mFundedCount = (monthlyDataMap[key]?.fundedLeads || []).length;
                            const dealInfo = computeLeadCommission(lead, mFundedCount);

                            return (
                                <div
                                    key={lead.id}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                                            {lead.name}
                                        </span>
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${dealInfo.isSelfGen
                                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                                            }`}>
                                            {dealInfo.isSelfGen ? '⭐ Self-Gen (70%)' : `🏢 Company (${dealInfo.rateLabel})`}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">{lead.loanType} Loan</span>
                                        <span className="font-black text-slate-900 dark:text-slate-100">
                                            {formatCurrency(lead.value)}
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 text-[11px]">
                                            Sec A ({sectionAPercent}%): <strong>{formatCurrency(dealInfo.sectionA)}</strong>
                                        </span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                            Payout: {formatCurrency(dealInfo.commission)}
                                        </span>
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

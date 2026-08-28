import React, { useState } from 'react';
import { X, Plus, Shield } from 'lucide-react';
import type { Lead, Stage, StageId, Priority, LoanType } from '../types/crm';
import { getTodayString } from '../utils/crmHelpers';

interface AddLeadModalProps {
    isOpen: boolean;
    stages: Stage[];
    defaultStage?: StageId;
    onClose: () => void;
    onAddLead: (newLead: Lead) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
    isOpen,
    stages,
    defaultStage = 'new_lead',
    onClose,
    onAddLead,
}) => {
    if (!isOpen) return null;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [loanAmount, setLoanAmount] = useState<number>(450000);
    const [purchasePrice, setPurchasePrice] = useState<number>(550000);
    const [loanType, setLoanType] = useState<LoanType>('VA');
    const [vaDisabilityRating, setVaDisabilityRating] = useState<number>(0);
    const [propertyAddress, setPropertyAddress] = useState('');
    const [referralPartner, setReferralPartner] = useState('');
    const [stage, setStage] = useState<StageId>(defaultStage);
    const [priority, setPriority] = useState<Priority>('high');
    const [notes, setNotes] = useState('');

    // Spouse / Co-Borrower State
    const [hasCoBorrower, setHasCoBorrower] = useState(false);
    const [coBorrowerName, setCoBorrowerName] = useState('');
    const [coBorrowerPhone, setCoBorrowerPhone] = useState('');
    const [coBorrowerEmail, setCoBorrowerEmail] = useState('');
    const [coBorrowerEmployer, setCoBorrowerEmployer] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const tags = ['Pre-Approval', loanType];
        if (loanType === 'VA') {
            tags.push(vaDisabilityRating >= 10 ? 'VA Fee Exempt' : 'VA Loan');
        }

        const newLead: Lead = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}`,
            name,
            email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: phone || '(555) 000-0000',
            company: company || 'Self / Veteran',
            role: 'Borrower',
            value: Number(loanAmount) || 0,
            purchasePrice: Number(purchasePrice) || 0,
            loanType,
            vaDisabilityRating: loanType === 'VA' ? Number(vaDisabilityRating) : undefined,
            propertyAddress: propertyAddress || undefined,
            referralPartner: referralPartner || undefined,
            targetRate: loanType === 'VA' ? '5.75% 30-Yr VA' : '6.50% 30-Yr Fixed',
            disclosuresStatus: stage === 'initial_disclosures' ? 'Sent for E-Sign' : 'Not Sent',
            hasCoBorrower,
            coBorrowerName: hasCoBorrower ? coBorrowerName : undefined,
            coBorrowerPhone: hasCoBorrower ? coBorrowerPhone : undefined,
            coBorrowerEmail: hasCoBorrower ? coBorrowerEmail : undefined,
            coBorrowerEmployer: hasCoBorrower ? coBorrowerEmployer : undefined,
            documentChecklist: {
                w2s: false,
                paystubs: false,
                bankStatements: false,
                taxReturns: false,
                photoId: false,
            },
            stage,
            priority,
            tags,
            createdAt: new Date().toISOString(),
            lastContactedAt: new Date().toISOString(),
            nextFollowUpDate: getTodayString(),
            notes,
            owner: 'You',
            source: referralPartner ? `Partner: ${referralPartner}` : 'Direct Lead',
            activities: [
                {
                    id: `act-${Date.now()}`,
                    type: 'note',
                    title: 'Borrower Lead Created',
                    description: `Created loan file for ${name}${hasCoBorrower && coBorrowerName ? ` & ${coBorrowerName}` : ''} (${loanType} - $${loanAmount.toLocaleString()}).`,
                    timestamp: new Date().toISOString(),
                    author: 'You',
                },
            ],
            tasks: [],
        };

        onAddLead(newLead);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                Add New Borrower / Loan Lead
                            </h3>
                            <p className="text-xs text-slate-400">
                                Enter primary borrower, spouse/co-borrower, and loan details
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* Borrower Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Primary Borrower Name *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Sgt. Marcus Vance"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Primary Phone Number
                            </label>
                            <input
                                type="text"
                                placeholder="(555) 234-8901"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Email & Employer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Primary Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="marcus@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Primary Employer / Branch
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. US Air Force / DoD Civilian"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Spouse / Co-Borrower Toggle */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-xs font-extrabold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasCoBorrower}
                                    onChange={(e) => setHasCoBorrower(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300"
                                />
                                <span>👥 Include Spouse / Co-Borrower on Loan</span>
                            </label>
                            {hasCoBorrower && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                                    Joint Application
                                </span>
                            )}
                        </div>

                        {hasCoBorrower && (
                            <div className="pt-2 border-t border-indigo-200/80 dark:border-indigo-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                        Spouse / Co-Borrower Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Elena Vance"
                                        value={coBorrowerName}
                                        onChange={(e) => setCoBorrowerName(e.target.value)}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                        Co-Borrower Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="(555) 234-8902"
                                        value={coBorrowerPhone}
                                        onChange={(e) => setCoBorrowerPhone(e.target.value)}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                        Co-Borrower Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="elena.vance@example.com"
                                        value={coBorrowerEmail}
                                        onChange={(e) => setCoBorrowerEmail(e.target.value)}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                        Co-Borrower Employer
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. BioTech Health Inc"
                                        value={coBorrowerEmployer}
                                        onChange={(e) => setCoBorrowerEmployer(e.target.value)}
                                        className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loan Amount, Purchase Price & Loan Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Loan Amount ($)
                            </label>
                            <input
                                type="number"
                                required
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Purchase Price ($)
                            </label>
                            <input
                                type="number"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Loan Program
                            </label>
                            <select
                                value={loanType}
                                onChange={(e) => setLoanType(e.target.value as LoanType)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-semibold"
                            >
                                <option value="VA">VA Loan (0% Down)</option>
                                <option value="Conventional">Conventional</option>
                                <option value="FHA">FHA Loan</option>
                                <option value="Jumbo">Jumbo Loan</option>
                                <option value="Refinance">Refinance</option>
                                <option value="USDA">USDA Rural</option>
                                <option value="HELOC">HELOC</option>
                            </select>
                        </div>
                    </div>

                    {/* VA Disability Rating Highlight Input Box if Loan Type is VA */}
                    {loanType === 'VA' && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold text-blue-900 dark:text-blue-200 flex items-center">
                                    <Shield className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                                    VA Disability Rating (%)
                                </label>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${vaDisabilityRating >= 10
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                    }`}>
                                    {vaDisabilityRating >= 10 ? '✨ VA Funding Fee EXEMPT' : 'Standard VA Funding Fee'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={vaDisabilityRating}
                                    onChange={(e) => setVaDisabilityRating(Math.min(100, Math.max(0, Number(e.target.value))))}
                                    className="w-28 p-2 text-xs font-black bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl text-blue-900 dark:text-blue-100 text-center"
                                />
                                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                    Veterans with <strong>10%+ disability rating</strong> are exempt from the VA Funding Fee.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Property Address & Realtor Partner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Property Address (or TBD)
                            </label>
                            <input
                                type="text"
                                placeholder="742 Evergreen Terrace, Austin, TX"
                                value={propertyAddress}
                                onChange={(e) => setPropertyAddress(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Realtor / Partner Agent
                            </label>
                            <input
                                type="text"
                                placeholder="Sarah Jenkins (RE/MAX)"
                                value={referralPartner}
                                onChange={(e) => setReferralPartner(e.target.value)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Stage & Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Pipeline Stage
                            </label>
                            <select
                                value={stage}
                                onChange={(e) => setStage(e.target.value as StageId)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-medium"
                            >
                                {stages.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Lead Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-medium"
                            >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Standard</option>
                            </select>
                        </div>
                    </div>

                    {/* Initial Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Loan Notes & Conversation Summary
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Add initial notes on borrower situation, target rate, COE status, or timeline..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all"
                        >
                            Save Borrower File
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
};

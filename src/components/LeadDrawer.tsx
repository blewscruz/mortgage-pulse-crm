import React, { useState, useEffect } from 'react';
import {
    X,
    Phone,
    Mail,
    Calendar,
    Trash2,
    Plus,
    Check,
    Send,
    Home,
    FileCheck,
    UserCheck,
    ShieldCheck,
    Sparkles,
    Edit3,
    Users,
    Save
} from 'lucide-react';
import type { Lead, Stage, StageId, Task, Activity, DisclosureStatus, DocumentChecklist, LoanType } from '../types/crm';
import {
    formatCurrency,
    formatDateDisplay,
    getDisclosureStatusBadge,
    getLoanTypeBadge,
    calculateChecklistProgress
} from '../utils/crmHelpers';

interface LeadDrawerProps {
    lead: Lead | null;
    stages: Stage[];
    onClose: () => void;
    onUpdateLead: (updatedLead: Lead) => void;
    onDeleteLead: (leadId: string) => void;
    onQuickOutreach: (lead: Lead, mode: 'call' | 'email' | 'meeting') => void;
    onOpenScheduleModal?: (lead: Lead) => void;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (leadId: string, taskId: string) => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
    lead,
    stages,
    onClose,
    onUpdateLead,
    onDeleteLead,
    onQuickOutreach,
    onOpenScheduleModal,
    onEditTask,
    onDeleteTask,
}) => {
    if (!lead) return null;

    const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'tasks' | 'activity' | 'notes'>('overview');

    const [newNoteText, setNewNoteText] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(lead.name);
    const [editEmail, setEditEmail] = useState(lead.email);
    const [editPhone, setEditPhone] = useState(lead.phone);
    const [editCompany, setEditCompany] = useState(lead.company);
    const [editValue, setEditValue] = useState(lead.value);
    const [editPurchasePrice, setEditPurchasePrice] = useState(lead.purchasePrice || 0);
    const [editTargetRate, setEditTargetRate] = useState(lead.targetRate || '6.50% 30-Yr Fixed');
    const [editLoanType, setEditLoanType] = useState<LoanType>(lead.loanType);
    const [editVaRating, setEditVaRating] = useState(lead.vaDisabilityRating || 0);
    const [editPropertyAddress, setEditPropertyAddress] = useState(lead.propertyAddress || '');
    const [editReferralPartner, setEditReferralPartner] = useState(lead.referralPartner || '');

    // Spouse / Co-Borrower State
    const [editHasCoBorrower, setEditHasCoBorrower] = useState(lead.hasCoBorrower || !!lead.coBorrowerName);
    const [editCoBorrowerName, setEditCoBorrowerName] = useState(lead.coBorrowerName || '');
    const [editCoBorrowerPhone, setEditCoBorrowerPhone] = useState(lead.coBorrowerPhone || '');
    const [editCoBorrowerEmail, setEditCoBorrowerEmail] = useState(lead.coBorrowerEmail || '');
    const [editCoBorrowerEmployer, setEditCoBorrowerEmployer] = useState(lead.coBorrowerEmployer || '');

    // Commission / Lead Origin State
    const [editIsSelfGenerated, setEditIsSelfGenerated] = useState<boolean>(
        lead.isSelfGenerated ?? (lead.source?.toLowerCase().includes('self') || false)
    );
    const [editSectionAAmount, setEditSectionAAmount] = useState<string>(
        lead.sectionAAmount ? String(lead.sectionAAmount) : ''
    );

    useEffect(() => {
        setEditName(lead.name);
        setEditEmail(lead.email);
        setEditPhone(lead.phone);
        setEditCompany(lead.company);
        setEditValue(lead.value);
        setEditPurchasePrice(lead.purchasePrice || 0);
        setEditTargetRate(lead.targetRate || '6.50% 30-Yr Fixed');
        setEditLoanType(lead.loanType);
        setEditVaRating(lead.vaDisabilityRating || 0);
        setEditPropertyAddress(lead.propertyAddress || '');
        setEditReferralPartner(lead.referralPartner || '');
        setEditHasCoBorrower(lead.hasCoBorrower || !!lead.coBorrowerName);
        setEditCoBorrowerName(lead.coBorrowerName || '');
        setEditCoBorrowerPhone(lead.coBorrowerPhone || '');
        setEditCoBorrowerEmail(lead.coBorrowerEmail || '');
        setEditCoBorrowerEmployer(lead.coBorrowerEmployer || '');
        setEditIsSelfGenerated(lead.isSelfGenerated ?? (lead.source?.toLowerCase().includes('self') || false));
        setEditSectionAAmount(lead.sectionAAmount ? String(lead.sectionAAmount) : '');
        setIsEditing(false);
    }, [lead.id]);

    const docProgress = calculateChecklistProgress(lead.documentChecklist);
    const discoBadge = getDisclosureStatusBadge(lead.disclosuresStatus);
    const loanBadge = getLoanTypeBadge(lead.loanType);

    const handleSaveEdit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: 'note',
            title: 'Updated Borrower & Loan File Information',
            description: `Updated loan amount to ${formatCurrency(Number(editValue))}. Commission origin: ${editIsSelfGenerated ? 'Self-Generated (70%)' : 'Company Provided Tier'}.`,
            timestamp: new Date().toISOString(),
            author: 'You',
        };

        onUpdateLead({
            ...lead,
            name: editName,
            email: editEmail,
            phone: editPhone,
            company: editCompany,
            value: Number(editValue) || 0,
            purchasePrice: Number(editPurchasePrice) || 0,
            targetRate: editTargetRate,
            loanType: editLoanType,
            vaDisabilityRating: editLoanType === 'VA' ? Number(editVaRating) : undefined,
            propertyAddress: editPropertyAddress || undefined,
            referralPartner: editReferralPartner || undefined,
            hasCoBorrower: editHasCoBorrower,
            coBorrowerName: editHasCoBorrower ? editCoBorrowerName : undefined,
            coBorrowerPhone: editHasCoBorrower ? editCoBorrowerPhone : undefined,
            coBorrowerEmail: editHasCoBorrower ? editCoBorrowerEmail : undefined,
            coBorrowerEmployer: editHasCoBorrower ? editCoBorrowerEmployer : undefined,
            isSelfGenerated: editIsSelfGenerated,
            sectionAAmount: editSectionAAmount ? Number(editSectionAAmount) : undefined,
            activities: [newActivity, ...lead.activities],
        });

        setIsEditing(false);
    };

    const handleStageChange = (newStage: StageId) => {
        const stageObj = stages.find((s) => s.id === newStage);
        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: 'stage_change',
            title: `Moved to ${stageObj ? stageObj.name : newStage}`,
            timestamp: new Date().toISOString(),
            author: 'You',
        };

        onUpdateLead({
            ...lead,
            stage: newStage,
            activities: [newActivity, ...lead.activities],
        });
    };

    const handleToggleDocChecklist = (key: keyof DocumentChecklist) => {
        const updatedChecklist = {
            ...lead.documentChecklist,
            [key]: !lead.documentChecklist[key],
        };

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: 'docs_uploaded',
            title: `Updated Document Checklist (${key.toUpperCase()}: ${updatedChecklist[key] ? 'Received' : 'Pending'})`,
            timestamp: new Date().toISOString(),
            author: 'You',
        };

        onUpdateLead({
            ...lead,
            documentChecklist: updatedChecklist,
            activities: [newActivity, ...lead.activities],
        });
    };

    const handleUpdateDisclosureStatus = (status: DisclosureStatus) => {
        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: 'disclosures_sent',
            title: `Disclosures Status Updated: ${status}`,
            description: status === 'Sent for E-Sign' ? 'Initial Disclosures (Discos) sent out for electronic signature.' : `Disclosures marked as ${status}.`,
            timestamp: new Date().toISOString(),
            author: 'You',
        };

        onUpdateLead({
            ...lead,
            disclosuresStatus: status,
            activities: [newActivity, ...lead.activities],
        });
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim()) return;

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: 'note',
            title: 'Added Note',
            description: newNoteText.trim(),
            timestamp: new Date().toISOString(),
            author: 'You',
        };

        onUpdateLead({
            ...lead,
            activities: [newActivity, ...lead.activities],
        });

        setNewNoteText('');
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            leadId: lead.id,
            leadName: lead.name,
            company: lead.company,
            title: newTaskTitle.trim(),
            dueDate: newTaskDueDate,
            completed: false,
            type: 'call',
            priority: 'high',
        };

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: 'task_created',
            title: `Task Created: "${newTaskTitle.trim()}"`,
            timestamp: new Date().toISOString(),
            author: 'You',
        };

        onUpdateLead({
            ...lead,
            tasks: [...lead.tasks, newTask],
            activities: [newActivity, ...lead.activities],
        });

        setNewTaskTitle('');
    };

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header Bar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    {lead.avatar ? (
                        <img src={lead.avatar} alt={lead.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20" />
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                            {lead.name.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{lead.name}</h2>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${loanBadge.color}`}>
                                {loanBadge.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {lead.company} • {lead.role}
                            {(lead.hasCoBorrower || lead.coBorrowerName) && (
                                <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">
                                    • Joint with {lead.coBorrowerName || 'Spouse'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all ${isEditing
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        title="Edit Loan & Borrower Details"
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>{isEditing ? 'Cancel Edit' : 'Edit Info'}</span>
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm(`Delete borrower file for ${lead.name}?`)) {
                                onDeleteLead(lead.id);
                            }
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete File"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onQuickOutreach(lead, 'call')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow flex items-center space-x-1.5"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Borrower</span>
                    </button>

                    <button
                        onClick={() => onQuickOutreach(lead, 'email')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow flex items-center space-x-1.5"
                    >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                    </button>

                    <button
                        onClick={() => {
                            if (onOpenScheduleModal) {
                                onOpenScheduleModal(lead);
                            } else {
                                onQuickOutreach(lead, 'meeting');
                            }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow flex items-center space-x-1.5"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Reach-Out</span>
                    </button>
                </div>

                {/* Priority & Stage Selectors */}
                <div className="flex items-center space-x-2">
                    <select
                        value={lead.priority}
                        onChange={(e) => onUpdateLead({ ...lead, priority: e.target.value as any })}
                        className="p-1.5 text-xs font-extrabold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none"
                        title="Change Lead Priority"
                    >
                        <option value="high">🔴 High Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="low">🟢 Standard Priority</option>
                    </select>

                    <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(e.target.value as StageId)}
                        className="p-1.5 text-xs font-extrabold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-indigo-600 dark:text-indigo-300 focus:outline-none"
                    >
                        {stages.map((s) => (
                            <option key={s.id} value={s.id}>
                                Stage: {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all ${activeTab === 'overview'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    Loan Overview
                </button>

                <button
                    onClick={() => setActiveTab('docs')}
                    className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 ${activeTab === 'docs'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Docs & Discos ({docProgress.completed}/5)</span>
                </button>

                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all ${activeTab === 'tasks'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    Tasks ({lead.tasks.filter((t) => !t.completed).length})
                </button>

                <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all ${activeTab === 'activity'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    Loan Log
                </button>

                <button
                    onClick={() => setActiveTab('notes')}
                    className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all ${activeTab === 'notes'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    Notes
                </button>
            </div>

            {/* Main Drawer Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                {/* EDIT MODE FORM */}
                {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/80 space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-3">
                            <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200 flex items-center">
                                <Edit3 className="w-4 h-4 mr-1.5 text-amber-600" />
                                Edit Borrower File & Loan Amount
                            </h3>
                            <button
                                type="submit"
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center space-x-1"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                            </button>
                        </div>

                        {/* Financial Amounts Editing */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Loan Amount ($)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={editValue}
                                    onChange={(e) => setEditValue(Number(e.target.value))}
                                    className="w-full p-2 text-xs font-black bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-emerald-600 dark:text-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Purchase Price ($)
                                </label>
                                <input
                                    type="number"
                                    value={editPurchasePrice}
                                    onChange={(e) => setEditPurchasePrice(Number(e.target.value))}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Target Interest Rate
                                </label>
                                <input
                                    type="text"
                                    value={editTargetRate}
                                    onChange={(e) => setEditTargetRate(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-indigo-600 dark:text-indigo-300 font-bold"
                                />
                            </div>
                        </div>

                        {/* Loan Program & VA Disability */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Loan Program
                                </label>
                                <select
                                    value={editLoanType}
                                    onChange={(e) => setEditLoanType(e.target.value as LoanType)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-900 dark:text-slate-100"
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

                            {editLoanType === 'VA' && (
                                <div>
                                    <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                        VA Disability Rating (%)
                                    </label>
                                    <select
                                        value={editVaRating}
                                        onChange={(e) => setEditVaRating(Number(e.target.value))}
                                        className="w-full p-2 text-xs font-black bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-blue-600 dark:text-blue-300"
                                    >
                                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((r) => (
                                            <option key={r} value={r}>
                                                {r}% Disability {r >= 10 ? '(Exempt)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Commission Origin & Section A Fee */}
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                            <label className="block text-xs font-black text-amber-900 dark:text-amber-200">
                                💰 Commission Structure & Lead Origin
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="editLeadOrigin"
                                        checked={editIsSelfGenerated}
                                        onChange={() => setEditIsSelfGenerated(true)}
                                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span>⭐ Self-Generated (70% Sec A)</span>
                                </label>

                                <label className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="editLeadOrigin"
                                        checked={!editIsSelfGenerated}
                                        onChange={() => setEditIsSelfGenerated(false)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>🏢 Company Provided Tier</span>
                                </label>
                            </div>

                            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-2">
                                <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                    Custom Section A Fee ($):
                                </label>
                                <input
                                    type="number"
                                    placeholder="Default 1.50%"
                                    value={editSectionAAmount}
                                    onChange={(e) => setEditSectionAAmount(e.target.value)}
                                    className="p-1.5 text-xs bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold w-36"
                                />
                            </div>
                        </div>

                        {/* Primary Borrower Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Primary Borrower Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Employer / Business
                                </label>
                                <input
                                    type="text"
                                    value={editCompany}
                                    onChange={(e) => setEditCompany(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Spouse / Co-Borrower Edit Toggle & Fields */}
                        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                            <label className="flex items-center space-x-2 text-xs font-extrabold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editHasCoBorrower}
                                    onChange={(e) => setEditHasCoBorrower(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300"
                                />
                                <span>👥 Include Spouse / Co-Borrower on Loan</span>
                            </label>

                            {editHasCoBorrower && (
                                <div className="pt-2 border-t border-indigo-200/80 dark:border-indigo-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                            Spouse / Co-Borrower Full Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Elena Vance"
                                            value={editCoBorrowerName}
                                            onChange={(e) => setEditCoBorrowerName(e.target.value)}
                                            className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                            Co-Borrower Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="(555) 234-8902"
                                            value={editCoBorrowerPhone}
                                            onChange={(e) => setEditCoBorrowerPhone(e.target.value)}
                                            className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                            Co-Borrower Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="elena.vance@example.com"
                                            value={editCoBorrowerEmail}
                                            onChange={(e) => setEditCoBorrowerEmail(e.target.value)}
                                            className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                                            Co-Borrower Employer
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. BioTech Health Inc"
                                            value={editCoBorrowerEmployer}
                                            onChange={(e) => setEditCoBorrowerEmployer(e.target.value)}
                                            className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Property & Realtor Partner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Property Address (or TBD)
                                </label>
                                <input
                                    type="text"
                                    value={editPropertyAddress}
                                    onChange={(e) => setEditPropertyAddress(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    Realtor / Referral Partner
                                </label>
                                <input
                                    type="text"
                                    value={editReferralPartner}
                                    onChange={(e) => setEditReferralPartner(e.target.value)}
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center space-x-1"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                ) : null}

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && !isEditing && (
                    <div className="space-y-6">

                        {/* Key Loan Financial Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 relative group">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Loan Amount</span>
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                    {formatCurrency(lead.value)}
                                </p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit Loan Amount"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Purchase Price</span>
                                <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                                    {lead.purchasePrice ? formatCurrency(lead.purchasePrice) : 'N/A'}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Rate</span>
                                <p className="text-base font-black text-indigo-600 dark:text-indigo-300 mt-1">
                                    {lead.targetRate || '6.50% 30-Yr'}
                                </p>
                            </div>
                        </div>

                        {/* Initial Disclosures Status Banner */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                        Initial Disclosures (Discos) Status
                                    </h4>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold mt-0.5">
                                        {discoBadge.label}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleUpdateDisclosureStatus('Sent for E-Sign')}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow transition-all flex items-center space-x-1"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Discos Out</span>
                            </button>
                        </div>

                        {/* Dedicated VA Disability Rating Banner & Control (if VA Loan) */}
                        {lead.loanType === 'VA' && (
                            <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 rounded-xl bg-blue-600 text-white shadow">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-xs text-blue-950 dark:text-blue-100">
                                                VA Disability Rating & Funding Fee Exemption
                                            </h4>
                                            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                                                {(lead.vaDisabilityRating ?? 0) >= 10
                                                    ? '✨ VA Funding Fee EXEMPT (10%+ Disability Rating)'
                                                    : 'Standard VA Funding Fee applies (0% Rating)'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <label className="text-[11px] font-extrabold text-blue-950 dark:text-blue-200">
                                            Rating:
                                        </label>
                                        <select
                                            value={lead.vaDisabilityRating ?? 0}
                                            onChange={(e) => {
                                                const newRating = Number(e.target.value);
                                                onUpdateLead({
                                                    ...lead,
                                                    vaDisabilityRating: newRating,
                                                    activities: [
                                                        {
                                                            id: `act-${Date.now()}`,
                                                            type: 'note',
                                                            title: `Updated VA Disability Rating to ${newRating}%`,
                                                            description: newRating >= 10 ? 'Marked as VA Funding Fee Exempt.' : 'Standard VA Funding Fee applied.',
                                                            timestamp: new Date().toISOString(),
                                                            author: 'You',
                                                        },
                                                        ...lead.activities,
                                                    ],
                                                });
                                            }}
                                            className="p-1.5 text-xs font-black bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl text-blue-900 dark:text-blue-100"
                                        >
                                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((r) => (
                                                <option key={r} value={r}>
                                                    {r}% VA Disability
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dedicated Spouse / Co-Borrower Card (if present) */}
                        {(lead.hasCoBorrower || lead.coBorrowerName) && (
                            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center">
                                        <Users className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                                        Spouse / Co-Borrower Details
                                    </h4>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                                        Co-Applicant
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Co-Borrower Name:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {lead.coBorrowerName || 'N/A'}
                                        </span>
                                    </div>

                                    {lead.coBorrowerPhone && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Co-Borrower Phone:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {lead.coBorrowerPhone}
                                            </span>
                                        </div>
                                    )}

                                    {lead.coBorrowerEmail && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Co-Borrower Email:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {lead.coBorrowerEmail}
                                            </span>
                                        </div>
                                    )}

                                    {lead.coBorrowerEmployer && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Employer / Business:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {lead.coBorrowerEmployer}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Property & Realtor Partner Info */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                                    Property & Referral Details
                                </h4>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                                >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Edit Details
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center">
                                        <Home className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        Property Address:
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {lead.propertyAddress || 'TBD'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center">
                                        <UserCheck className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        Realtor / Partner Agent:
                                    </span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                        {lead.referralPartner || 'Direct Lead'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center">
                                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        Primary Phone:
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {lead.phone}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 flex items-center">
                                        <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        Primary Email:
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {lead.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* DOCUMENTS & DISCLOSURES TAB */}
                {activeTab === 'docs' && (
                    <div className="space-y-6">

                        {/* Disclosures Workflow Card */}
                        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-4">
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center">
                                    <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" />
                                    Initial Disclosures (Discos) Electronic Signature Suite
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Send, track, and verify required TRID Loan Estimate (LE) and initial disclosure package.
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${discoBadge.color}`}>
                                    Status: {discoBadge.label}
                                </span>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleUpdateDisclosureStatus('Not Sent')}
                                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => handleUpdateDisclosureStatus('Sent for E-Sign')}
                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow"
                                    >
                                        Send LE Package
                                    </button>
                                    <button
                                        onClick={() => handleUpdateDisclosureStatus('Disclosures Signed')}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow flex items-center space-x-1"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Mark Signed</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Document Verification Checklist */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                                    Required Borrower Verification Documents ({docProgress.completed}/5)
                                </h4>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                    {docProgress.percentage}% Complete
                                </span>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { key: 'w2s', label: '2 Years W2 Statements (Primary & Co-Borrower)' },
                                    { key: 'paystubs', label: 'Recent 30 Days Paystubs' },
                                    { key: 'bankStatements', label: '60 Days Bank & Asset Statements' },
                                    { key: 'taxReturns', label: '2 Years 1040 Tax Returns' },
                                    { key: 'photoId', label: 'Government Photo ID / Driver License' },
                                ].map((item) => {
                                    const key = item.key as keyof DocumentChecklist;
                                    const isChecked = lead.documentChecklist[key];

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => handleToggleDocChecklist(key)}
                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isChecked
                                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {isChecked && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className="text-xs font-extrabold">{item.label}</span>
                                            </div>

                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isChecked ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                {isChecked ? 'Verified ✓' : 'Pending'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                )}

                {/* TASKS & CALENDAR REACH-OUTS TAB */}
                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        {/* Schedule Reach-Out CTA Banner */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-lg">
                            <div>
                                <h4 className="font-black text-sm">
                                    Schedule Call / Meeting / Follow-up
                                </h4>
                                <p className="text-[11px] text-indigo-100 mt-0.5">
                                    Set date, time, notes & 15-min alert. Syncs directly to Calendar.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onOpenScheduleModal) {
                                        onOpenScheduleModal(lead);
                                    }
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs shadow flex items-center space-x-1.5 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Schedule Reach-Out</span>
                            </button>
                        </div>

                        {/* Create Quick Task Form */}
                        <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                Quick Add Task for {lead.name}
                            </h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Task title or call topic..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="flex-1 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-medium"
                                />
                                <input
                                    type="date"
                                    value={newTaskDueDate}
                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                    className="p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-bold"
                                />
                                <button
                                    type="submit"
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center space-x-1 shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add</span>
                                </button>
                            </div>
                        </form>

                        {/* Scheduled Events & Task List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                                    Calendar Events & Tasks ({lead.tasks.length})
                                </h4>
                                <span className="text-[11px] text-slate-500 font-semibold">
                                    {lead.tasks.filter(t => !t.completed).length} Pending
                                </span>
                            </div>

                            {lead.tasks.length === 0 ? (
                                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-bold">No tasks or calls scheduled for this borrower.</p>
                                    <button
                                        onClick={() => onOpenScheduleModal && onOpenScheduleModal(lead)}
                                        className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-black hover:underline"
                                    >
                                        + Schedule First Reach-Out
                                    </button>
                                </div>
                            ) : (
                                lead.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`p-4 rounded-2xl border transition-all ${task.completed
                                            ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() => {
                                                        const updatedTasks = lead.tasks.map((t) =>
                                                            t.id === task.id ? { ...t, completed: !t.completed } : t
                                                        );
                                                        onUpdateLead({ ...lead, tasks: updatedTasks });
                                                    }}
                                                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                                />
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${task.type === 'call' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                                            task.type === 'meeting' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                                                                task.type === 'proposal' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                                                                    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                            }`}>
                                                            {task.type === 'call' ? '📞 Call' : task.type === 'meeting' ? '🎥 Meeting' : task.type === 'proposal' ? '✍️ Disclosures' : '📋 Task'}
                                                        </span>

                                                        <span className="text-[10px] text-slate-400 font-extrabold flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                                            {formatDateDisplay(task.dueDate)} {task.dueTime && `@ ${task.dueTime}`}
                                                        </span>
                                                    </div>

                                                    <p className={`text-xs font-black mt-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                        {task.title}
                                                    </p>

                                                    {task.description && (
                                                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                            "{task.description}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons for Task */}
                                            <div className="flex items-center space-x-1 shrink-0">
                                                {onEditTask && (
                                                    <button
                                                        onClick={() => onEditTask(task)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
                                                        title="Edit Task / Change Date & Time"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {onDeleteTask && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Delete task "${task.title}"?`)) {
                                                                onDeleteTask(lead.id, task.id);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* LOAN LOG / ACTIVITY TAB */}
                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                            Complete Audit & Outreach History
                        </h4>

                        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                            {lead.activities.map((act) => (
                                <div key={act.id} className="relative flex items-start space-x-3 pl-8">
                                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-black text-xs text-slate-900 dark:text-slate-100">
                                                {act.title}
                                            </h5>
                                            <span className="text-[10px] text-slate-400 font-semibold">
                                                {formatDateDisplay(act.timestamp)}
                                            </span>
                                        </div>
                                        {act.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                {act.description}
                                            </p>
                                        )}
                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">
                                            By {act.author}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="space-y-6">
                        <form onSubmit={handleAddNote} className="space-y-3">
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                Add Loan Officer Note
                            </h4>
                            <textarea
                                rows={3}
                                placeholder="Type conversation summary, rate lock notes, or underwriting notes..."
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow flex items-center space-x-1 ml-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Save Note</span>
                            </button>
                        </form>

                        <div className="space-y-3">
                            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                                Borrower Notes
                            </h4>
                            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                                {lead.notes || 'No notes added yet.'}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

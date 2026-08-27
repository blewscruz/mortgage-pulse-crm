export type StageId =
    | 'new_lead'
    | 'full_application'
    | 'pitching'
    | 'docs_collection'
    | 'initial_disclosures'
    | 'underwriting_clear_to_close'
    | 'funded_closed'
    | 'lost';

export type Priority = 'low' | 'medium' | 'high';

export type LoanType = 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Jumbo' | 'Refinance' | 'HELOC';

export type DisclosureStatus = 'Not Sent' | 'Sent for E-Sign' | 'Disclosures Signed';

export interface DocumentChecklist {
    w2s: boolean;
    paystubs: boolean;
    bankStatements: boolean;
    taxReturns: boolean;
    photoId: boolean;
}

export interface Stage {
    id: StageId;
    name: string;
    color: string; // Tailwind color name
    accentHex: string;
    order: number;
    description: string;
}

export type ActivityType =
    | 'call'
    | 'email'
    | 'meeting'
    | 'note'
    | 'stage_change'
    | 'task_completed'
    | 'task_created'
    | 'app_submitted'
    | 'docs_uploaded'
    | 'disclosures_sent';

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    timestamp: string; // ISO date string
    author: string;
}

export interface Task {
    id: string;
    leadId: string;
    leadName: string;
    company: string;
    title: string;
    description?: string; // Notes detailing what the reach-out or appointment call is about
    dueDate: string; // ISO date string YYYY-MM-DD
    dueTime?: string; // e.g. "14:30" or "02:30 PM"
    completed: boolean;
    type: 'call' | 'email' | 'meeting' | 'followup' | 'proposal';
    priority: Priority;
    reminderMinutes?: number; // e.g. 15 (notify 15 mins before due time)
    reminderDismissed?: boolean;
}

export interface Lead {
    id: string;
    name: string; // Borrower Name
    email: string;
    phone: string;
    company: string; // Employer or Business
    role: string; // Borrower Job Title
    value: number; // Estimated Loan Amount in USD
    purchasePrice?: number; // Target Purchase Price
    loanType: LoanType;
    vaDisabilityRating?: number; // 0% to 100% (>= 10% exempts VA Funding Fee)
    propertyAddress?: string;
    referralPartner?: string; // Realtor / Partner Agent
    targetRate?: string; // e.g. "6.50% 30-Yr Fixed"
    disclosuresStatus: DisclosureStatus;
    documentChecklist: DocumentChecklist;
    stage: StageId;
    priority: Priority;
    tags: string[];
    avatar?: string;
    createdAt: string; // ISO date string
    lastContactedAt?: string; // ISO date string
    nextFollowUpDate?: string; // ISO date YYYY-MM-DD
    notes: string;
    activities: Activity[];
    tasks: Task[];
    owner: string;
    source: string; // e.g. "Zillow Referral", "Realtor Partner", "Website"
    hasCoBorrower?: boolean;
    coBorrowerName?: string;
    coBorrowerEmail?: string;
    coBorrowerPhone?: string;
    coBorrowerEmployer?: string;
}

export interface NotificationItem {
    id: string;
    leadId: string;
    leadName: string;
    company: string;
    type: 'overdue' | 'due_today' | 'cold_lead' | 'high_value_stale';
    message: string;
    dueDate?: string;
    timestamp: string;
    read: boolean;
    priority: Priority;
}

export type ViewMode = 'kanban' | 'list' | 'tasks' | 'analytics' | 'calendar';

export interface FilterState {
    searchQuery: string;
    stageFilter: StageId | 'all';
    priorityFilter: Priority | 'all';
    reachOutStatus: 'all' | 'overdue' | 'due_today' | 'upcoming' | 'no_task';
    minDealValue: number;
    sortBy: 'value_desc' | 'due_date_asc' | 'created_desc' | 'name_asc';
}

import type { Lead } from '../types/crm';
import { INITIAL_LEADS } from '../data/initialData';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'pulse_crm_leads_v2';

// Utility to read local cache
export function getLocalLeads(): Lead[] {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return INITIAL_LEADS;
    try {
        return JSON.parse(saved);
    } catch {
        return INITIAL_LEADS;
    }
}

// Utility to update local cache
export function saveLocalLeads(leads: Lead[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
}

// Map database row (snake_case) to Lead object (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToLead(row: any): Lead {
    return {
        id: row.id,
        name: row.name || '',
        email: row.email || '',
        phone: row.phone || '',
        company: row.company || '',
        role: row.role || '',
        value: Number(row.value || 0),
        purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
        targetRate: row.target_rate || undefined,
        loanType: row.loan_type || 'Conventional',
        vaDisabilityRating: row.va_disability_rating !== undefined ? Number(row.va_disability_rating) : undefined,
        propertyAddress: row.property_address || undefined,
        referralPartner: row.referral_partner || undefined,
        disclosuresStatus: row.disclosures_status || 'Not Sent',
        documentChecklist: row.document_checklist || {
            w2s: false,
            paystubs: false,
            bankStatements: false,
            taxReturns: false,
            photoId: false
        },
        stage: row.stage || 'new_lead',
        priority: row.priority || 'medium',
        tags: Array.isArray(row.tags) ? row.tags : [],
        avatar: row.avatar || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        lastContactedAt: row.last_contacted_at || undefined,
        nextFollowUpDate: row.next_follow_up_date || undefined,
        notes: row.notes || '',
        activities: Array.isArray(row.activities) ? row.activities : [],
        tasks: Array.isArray(row.tasks) ? row.tasks : [],
        owner: row.owner || 'Unassigned',
        source: row.source || 'Manual Input',
        hasCoBorrower: Boolean(row.has_co_borrower),
        coBorrowerName: row.co_borrower_name || undefined,
        coBorrowerEmail: row.co_borrower_email || undefined,
        coBorrowerPhone: row.co_borrower_phone || undefined,
        coBorrowerEmployer: row.co_borrower_employer || undefined,
    };
}

// Map Lead object (camelCase) to database row (snake_case)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLeadToRow(lead: Lead): Record<string, any> {
    const row: Record<string, any> = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        role: lead.role,
        value: lead.value,
        purchase_price: lead.purchasePrice || 0,
        target_rate: lead.targetRate || null,
        loan_type: lead.loanType,
        va_disability_rating: lead.vaDisabilityRating ?? 0,
        property_address: lead.propertyAddress || null,
        referral_partner: lead.referralPartner || null,
        disclosures_status: lead.disclosuresStatus,
        document_checklist: lead.documentChecklist,
        stage: lead.stage,
        priority: lead.priority,
        tags: lead.tags || [],
        avatar: lead.avatar || null,
        created_at: lead.createdAt || new Date().toISOString(),
        last_contacted_at: lead.lastContactedAt || null,
        next_follow_up_date: lead.nextFollowUpDate || null,
        notes: lead.notes || '',
        activities: lead.activities || [],
        tasks: lead.tasks || [],
        owner: lead.owner || 'Unassigned',
        source: lead.source || 'Manual Input',
        has_co_borrower: Boolean(lead.hasCoBorrower),
        co_borrower_name: lead.coBorrowerName || null,
        co_borrower_email: lead.coBorrowerEmail || null,
        co_borrower_phone: lead.coBorrowerPhone || null,
        co_borrower_employer: lead.coBorrowerEmployer || null,
    };

    // If ID looks like a valid UUID, pass it; otherwise let Supabase generate UUID
    if (lead.id && lead.id.includes('-')) {
        row.id = lead.id;
    }

    return row;
}

/**
 * Fetch all leads from Supabase (or fallback to local cache)
 */
export async function fetchLeadsService(): Promise<{ leads: Lead[]; isSupabase: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
        return { leads: getLocalLeads(), isSupabase: false };
    }

    try {
        const { data, error } = await client
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Supabase fetch error, using local leads:', error.message);
            return { leads: getLocalLeads(), isSupabase: true, error: error.message };
        }

        if (!data || data.length === 0) {
            // Seed initial data to Supabase if table is empty
            console.log('Supabase table is empty. Seeding initial leads...');
            await seedInitialLeadsToSupabase(client);
            return { leads: getLocalLeads(), isSupabase: true };
        }

        const leads = data.map(mapRowToLead);
        saveLocalLeads(leads); // Sync local cache
        return { leads, isSupabase: true };
    } catch (err: any) {
        console.error('Failed to fetch from Supabase:', err);
        return { leads: getLocalLeads(), isSupabase: false, error: err?.message || 'Connection error' };
    }
}

/**
 * Save or update a single lead
 */
export async function upsertLeadService(lead: Lead): Promise<Lead> {
    const client = getSupabaseClient();

    // Always update local cache immediately for snappy UI
    const local = getLocalLeads();
    const existingIdx = local.findIndex((l) => l.id === lead.id);
    let updatedLocal: Lead[];
    if (existingIdx >= 0) {
        updatedLocal = [...local];
        updatedLocal[existingIdx] = lead;
    } else {
        updatedLocal = [lead, ...local];
    }
    saveLocalLeads(updatedLocal);

    if (client && isSupabaseConfigured()) {
        try {
            const row = mapLeadToRow(lead);
            const { data, error } = await client
                .from('leads')
                .upsert(row)
                .select('*')
                .single();

            if (error) {
                console.error('Supabase upsert error:', error.message);
            } else if (data) {
                return mapRowToLead(data);
            }
        } catch (err) {
            console.error('Failed to upsert to Supabase:', err);
        }
    }

    return lead;
}

/**
 * Delete a lead
 */
export async function deleteLeadService(leadId: string): Promise<boolean> {
    // Remove from local cache
    const local = getLocalLeads();
    const updated = local.filter((l) => l.id !== leadId);
    saveLocalLeads(updated);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
        try {
            const { error } = await client.from('leads').delete().eq('id', leadId);
            if (error) {
                console.error('Supabase delete error:', error.message);
                return false;
            }
        } catch (err) {
            console.error('Failed to delete from Supabase:', err);
            return false;
        }
    }
    return true;
}

/**
 * Seed initial leads to Supabase
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedInitialLeadsToSupabase(client: any): Promise<void> {
    const rows = INITIAL_LEADS.map((l) => {
        const row = mapLeadToRow(l);
        delete row.id; // Let Supabase assign clean UUIDs
        return row;
    });

    const { error } = await client.from('leads').insert(rows);
    if (error) {
        console.error('Failed to seed initial leads to Supabase:', error.message);
    } else {
        console.log('Successfully seeded initial leads to Supabase!');
    }
}

/**
 * Realtime subscription to live database updates across tabs/devices
 */
export function subscribeToRealtimeLeads(onUpdate: (leads: Lead[]) => void) {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return () => { };

    const channel = client
        .channel('public:leads')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'leads' },
            async () => {
                const res = await fetchLeadsService();
                if (res.leads) {
                    onUpdate(res.leads);
                }
            }
        )
        .subscribe();

    return () => {
        client.removeChannel(channel);
    };
}

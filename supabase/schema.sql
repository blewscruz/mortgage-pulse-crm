-- ================================================
-- MORTGAGE PULSE CRM - SUPABASE DATABASE SCHEMA
-- ================================================
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query)

-- 1. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    role TEXT,
    value NUMERIC DEFAULT 0,
    purchase_price NUMERIC DEFAULT 0,
    target_rate TEXT,
    loan_type TEXT DEFAULT 'Conventional',
    va_disability_rating INT DEFAULT 0,
    property_address TEXT,
    referral_partner TEXT,
    disclosures_status TEXT DEFAULT 'Not Sent',
    document_checklist JSONB DEFAULT '{"w2s": false, "paystubs": false, "bankStatements": false, "taxReturns": false, "photoId": false}'::jsonb,
    stage TEXT DEFAULT 'new_lead',
    priority TEXT DEFAULT 'medium',
    tags JSONB DEFAULT '[]'::jsonb,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    next_follow_up_date TEXT,
    notes TEXT DEFAULT '',
    activities JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    owner TEXT DEFAULT 'Unassigned',
    source TEXT DEFAULT 'Manual Input',
    has_co_borrower BOOLEAN DEFAULT FALSE,
    co_borrower_name TEXT,
    co_borrower_email TEXT,
    co_borrower_phone TEXT,
    co_borrower_employer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Allow public read/write for anon key, adjust for auth if needed)
DROP POLICY IF EXISTS "Allow anon read access" ON public.leads;
CREATE POLICY "Allow anon read access" ON public.leads
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert access" ON public.leads;
CREATE POLICY "Allow anon insert access" ON public.leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access" ON public.leads;
CREATE POLICY "Allow anon update access" ON public.leads
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete access" ON public.leads;
CREATE POLICY "Allow anon delete access" ON public.leads
    FOR DELETE USING (true);

-- 4. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- 5. Auto Update updated_at Trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_modtime ON public.leads;
CREATE TRIGGER update_leads_modtime
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Done! Your database is ready for Mortgage Pulse CRM.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'pulse_crm_supabase_config';

export interface SupabaseConfig {
    url: string;
    anonKey: string;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (envUrl && envKey) {
        return { url: envUrl, anonKey: envKey };
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.url && parsed.anonKey) {
                return parsed;
            }
        }
    } catch {
        // ignore parse error
    }

    // Default fallback to configured active Supabase project
    return {
        url: 'https://shduhslhaoqbkmqhdrjq.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZHVoc2xoYW9xYmttcWhkcmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTU4MjcsImV4cCI6MjEwMzM3MTgyN30.dOu4P58dC1Sw4egtXcqkUafeiQc302MyBglcXLwtFrk'
    };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reset instance to re-initialize
    supabaseInstance = null;
}

export function clearSupabaseConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
    supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (supabaseInstance) return supabaseInstance;

    const config = getSavedSupabaseConfig();
    if (config.url && config.anonKey) {
        try {
            supabaseInstance = createClient(config.url, config.anonKey, {
                auth: { persistSession: true }
            });
            return supabaseInstance;
        } catch (err) {
            console.error('Failed to initialize Supabase client:', err);
            return null;
        }
    }
    return null;
}

export function isSupabaseConfigured(): boolean {
    const config = getSavedSupabaseConfig();
    return Boolean(config.url && config.anonKey);
}

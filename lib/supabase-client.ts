'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase';

// Singleton instance for client-side Supabase client
let supabaseClient: SupabaseClient | null = null;

// Client-side Supabase client (respects RLS)
// Use this in client components
// Returns a singleton instance to ensure session is shared
export function createClientClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase client environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Return existing client if it exists
  if (supabaseClient) {
    return supabaseClient;
  }

  // Create new client with session persistence
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}


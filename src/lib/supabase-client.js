import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase URL is missing or malformed. Falling back to local mode.');
    return null;
  }
  
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to instantiate browser Supabase client:', e);
    return null;
  }
}

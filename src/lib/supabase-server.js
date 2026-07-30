import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase URL is missing or malformed on server.');
    return null;
  }
  
  const cookieStore = await cookies();

  try {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Can be safely ignored if session refresh middleware is active
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Can be safely ignored if session refresh middleware is active
          }
        }
      }
    });
  } catch (e) {
    console.error('Failed to instantiate server Supabase client:', e);
    return null;
  }
}

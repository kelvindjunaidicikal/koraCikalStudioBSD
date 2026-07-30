import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = getSupabaseServerClient();
    
    // Exchange callback code for a secure cookie session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication session error: ' + sessionError.message)}`
      );
    }

    // Retrieve user metadata details
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Failed to retrieve user profile details.')}`
      );
    }

    const email = user.email || '';

    // Enforce email domain restriction to @cikal.co.id
    if (!email.toLowerCase().endsWith('@cikal.co.id')) {
      // Immediately sign them out to clear cookies
      await supabase.auth.signOut();
      
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Access denied. Only school accounts with @cikal.co.id email domain are allowed.')}`
      );
    }

    // Decide user role based on email patterns (e.g. if email contains teacher or admin, or metadata is set)
    const isTeacher = email.toLowerCase().includes('admin') || 
                      email.toLowerCase().includes('teacher') || 
                      user.user_metadata?.role === 'admin';
                      
    const targetRoute = isTeacher ? '/admin' : '/dashboard';
    
    return NextResponse.redirect(`${requestUrl.origin}${targetRoute}`);
  }

  // Redirect to login if no code parameter is present
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}

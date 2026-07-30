import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, studentName, gradeLevel } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Detect if Supabase variables are set up
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        mode: 'local', 
        error: 'Supabase configuration environment variables are missing.' 
      });
    }

    // Initialize Supabase admin client using the private service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the user programmatically with auto-confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        studentName,
        gradeLevel,
        role: 'user'
      }
    });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        mode: 'supabase', 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      mode: 'supabase', 
      user: data.user 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected server error occurred: ' + error.message 
    }, { status: 500 });
  }
}

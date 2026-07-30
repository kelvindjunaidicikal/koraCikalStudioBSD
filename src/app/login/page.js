'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser, validateLogin } from '@/lib/db';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // URL Error & Google Mock States
  const [urlError, setUrlError] = useState('');
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [mockGoogleEmail, setMockGoogleEmail] = useState('');
  const [mockGoogleError, setMockGoogleError] = useState('');

  useEffect(() => {
    // Extract error query parameter safely from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setUrlError(err);
      }
    }

    // If already logged in, redirect straight to their respective view
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    // Simulate short network delay
    setTimeout(() => {
      setLoading(false);
      
      const userProfile = validateLogin(email, password);
      
      if (userProfile) {
        setCurrentUser(userProfile.email, userProfile.role);
        if (userProfile.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Invalid email or password. Try student@vibespace.com / password or admin@vibespace.com / admin123.');
      }
    }, 800);
  };

  const handleQuickLogin = (role) => {
    setLoading(true);
    setTimeout(() => {
      const demoEmail = role === 'admin' ? 'admin@vibespace.com' : 'student@vibespace.com';
      const demoPass = role === 'admin' ? 'admin123' : 'password';
      
      const userProfile = validateLogin(demoEmail, demoPass);
      if (userProfile) {
        setCurrentUser(userProfile.email, userProfile.role);
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    }, 500);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setUrlError('');
    
    const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (hasSupabaseUrl && hasSupabaseAnon) {
      // 1. Live Google OAuth using Supabase
      const { getSupabaseBrowserClient } = await import('@/lib/supabase-client');
      const supabase = getSupabaseBrowserClient();
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        setLoading(false);
        setError('Google Login failed: ' + error.message);
      }
    } else {
      // 2. Open Local Google Simulation Dialog
      setMockGoogleEmail('');
      setMockGoogleError('');
      setShowMockGoogleModal(true);
    }
  };

  const handleMockGoogleSubmit = (e) => {
    e.preventDefault();
    setMockGoogleError('');

    const formattedEmail = mockGoogleEmail.trim().toLowerCase();

    if (!formattedEmail) {
      setMockGoogleError('Please enter your school email.');
      return;
    }

    // Verify school email domain requirement
    if (!formattedEmail.endsWith('@cikal.co.id')) {
      setMockGoogleError('Access denied. Only school accounts with @cikal.co.id email domain are allowed.');
      return;
    }

    setLoading(true);
    setShowMockGoogleModal(false);

    setTimeout(() => {
      setLoading(false);
      const isTeacher = formattedEmail.includes('admin') || formattedEmail.includes('teacher');
      const role = isTeacher ? 'admin' : 'user';
      
      // Update session locally
      setCurrentUser(formattedEmail, role);
      
      if (isTeacher) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }, 800);
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '90vh',
      padding: '2rem'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '3rem 2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Element */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'var(--neon-red-glow)',
          filter: 'blur(50px)',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo Title */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-outfit)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--neon-red)',
              textTransform: 'uppercase',
              letterSpacing: '0.25em'
            }}>
              Welcome to
            </span>
            <h1 className="gradient-text" style={{
              fontSize: '1.8rem',
              marginTop: '0.5rem',
              fontWeight: 800,
              lineHeight: '1.25'
            }}>
              Cikal Campus B Studio Reservation
            </h1>
          </div>

          {/* Form */}
          {/* Error Message */}
          {(error || urlError) && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--color-error)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: '1.4',
              marginBottom: '1.5rem'
            }}>
              {error || urlError}
            </div>
          )}

          {/* Instructions and Google Login Only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{
              width: '100%',
              padding: '1.25rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 51, 102, 0.05)',
              border: '1px solid rgba(255, 51, 102, 0.15)',
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-outfit)',
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--neon-red)',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.35rem'
              }}>
                📢 USE YOUR CIKAL EMAIL
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Only school accounts ending in @cikal.co.id can access the scheduler.
              </span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }} 
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Redirecting to Google...' : 'Sign In with Google'}
            </button>

            {/* KORA Branding Footer below the button */}
            <div style={{
              width: '100%',
              textAlign: 'center',
              marginTop: '2rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.25rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-outfit)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
                display: 'block'
              }}>
                KORA
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                display: 'block',
                marginTop: '0.15rem'
              }}>
                Kelvin Orchestrated Reservation Application
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MOCK GOOGLE LOGIN DIALOG (FALLBACK) */}
      {showMockGoogleModal && (
        <div className="modal-overlay" onClick={() => setShowMockGoogleModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--neon-blue)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-outfit)', margin: 0 }}>
                Google Sign-In Simulation
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Supabase env keys are not set up. Enter your <strong>@cikal.co.id</strong> school Google account to test Google Auth locally.
            </p>

            <form onSubmit={handleMockGoogleSubmit}>
              {mockGoogleError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--color-error)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 500,
                  lineHeight: '1.4'
                }}>
                  {mockGoogleError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">School Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="name@cikal.co.id"
                  value={mockGoogleEmail}
                  onChange={(e) => setMockGoogleEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMockGoogleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--neon-blue)' }}>
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

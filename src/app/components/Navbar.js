'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logoutUser, setCurrentUser } from '@/lib/db';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Poll or check current user on mount / route changes
    setUser(getCurrentUser());
  }, [pathname]);

  // Handle manual sign out
  const handleLogout = async () => {
    logoutUser();
    
    const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (hasSupabase) {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase-client');
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Supabase logout error:", e);
      }
    }
    
    setUser(null);
    router.push('/login');
  };

  // Easily switch between User/Admin view for user testing convenience
  const handleToggleRole = () => {
    if (!user) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const newEmail = newRole === 'admin' ? 'admin@vibespace.com' : 'user@vibespace.com';
    
    setCurrentUser(newEmail, newRole);
    setUser({ email: newEmail, role: newRole });
    
    if (newRole === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  // Hide navigation bar on the login page
  if (pathname === '/login' || !user) {
    return null;
  }

  return (
    <nav className="glass" style={{
      margin: '1.5rem 1.5rem 0 1.5rem',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => router.push(user.role === 'admin' ? '/admin' : '/dashboard')}>
        {/* Sleek SVG Waveform Logo */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12V16M8 8V20M12 4V24M16 8V20M20 12V16" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="logo-grad" x1="4" y1="4" x2="20" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff3366" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
          <span style={{
            fontFamily: 'var(--font-outfit)',
            fontSize: '1.35rem',
            fontWeight: 800,
            background: 'var(--grad-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em'
          }}>
            KORA
          </span>
          <span style={{
            fontSize: '0.6rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            letterSpacing: '0.02em'
          }}>
            Kelvin Orchestrated Reservation Application
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* User Role & Email */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`badge ${user.role === 'admin' ? 'badge-confirmed' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
              {user.role === 'admin' ? 'Admin Role' : 'User Role'}
            </span>
          </div>
        </div>

        {/* Tab switcher style role toggler */}
        <button 
          onClick={handleToggleRole}
          className="btn btn-secondary"
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            background: 'rgba(255, 51, 102, 0.05)',
            color: 'var(--neon-red)',
            boxShadow: '0 0 10px rgba(255, 51, 102, 0.1)'
          }}
        >
          Switch to {user.role === 'admin' ? 'User Tab' : 'Admin Tab'}
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

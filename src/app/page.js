'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/db';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'admin') {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Sleek SVG Waveform loader */}
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pulse-svg">
        <path d="M4 12V16M8 8V20M12 4V24M16 8V20M20 12V16" stroke="url(#loader-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="loader-grad" x1="4" y1="4" x2="20" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a855f7" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <p style={{
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-outfit)',
        fontWeight: 500,
        letterSpacing: '0.15em',
        fontSize: '0.85rem'
      }}>
        LOADING VIBESPACE...
      </p>

      <style jsx>{`
        .pulse-svg {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

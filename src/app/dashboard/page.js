'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStudios, 
  getBookings, 
  addBooking, 
  deleteBooking, 
  getCurrentUser 
} from '@/lib/db';

export default function StudentCalendarDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [studios, setStudios] = useState([]);
  const [selectedStudioId, setSelectedStudioId] = useState('room-101');
  const [weekOffset, setWeekOffset] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 10');
  const [purpose, setPurpose] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const HOURS = [
    '07:20', '08:00', '08:40', '09:20', '10:00', '10:40', 
    '11:20', '12:00', '12:40', '13:20', '14:00', '14:40', '15:20'
  ];

  useEffect(() => {
    async function initSession() {
      const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      let sessionUser = getCurrentUser();

      if (hasSupabase) {
        try {
          const { getSupabaseBrowserClient } = await import('@/lib/supabase-client');
          const supabase = getSupabaseBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const email = session.user.email;
            const isTeacher = email.toLowerCase().includes('admin') || 
                              email.toLowerCase().includes('teacher') || 
                              session.user.user_metadata?.role === 'admin';
            
            const syncedUser = { email, role: isTeacher ? 'admin' : 'user' };
            localStorage.setItem('school_user', JSON.stringify(syncedUser));
            sessionUser = syncedUser;
          }
        } catch (e) {
          console.error("Supabase session sync error:", e);
        }
      }

      if (!sessionUser) {
        router.replace('/login');
        return;
      }

      setUser(sessionUser);
      const fetchedBookings = await getBookings();
      setBookings(fetchedBookings);
      
      const loadedStudios = getStudios();
      setStudios(loadedStudios);
      if (loadedStudios.length > 0) {
        setSelectedStudioId(loadedStudios[0].id);
      }
    }

    initSession();
  }, [router]);

  if (!user || studios.length === 0) {
    return null; // Wait for initial loading
  }

  const getTodayDate = () => {
    const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    return hasSupabase ? new Date() : new Date('2026-07-29');
  };

  // Calculate Monday to Friday dates dynamically based on weekOffset
  const getWeekDays = (offset) => {
    const today = getTodayDate();
    // Calculate new date based on offset weeks
    const targetDay = new Date(today.getTime() + offset * 7 * 24 * 60 * 60 * 1000);
    const day = targetDay.getDay();
    // Monday offset
    const diff = targetDay.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(targetDay.setDate(diff));

    const days = [];
    for (let i = 0; i < 5; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      days.push({
        name: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i],
        dateString: currentDay.toISOString().split('T')[0],
        formattedDate: currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  };

  const weekDays = getWeekDays(weekOffset);
  const currentStudio = studios.find(s => s.id === selectedStudioId) || studios[0];

  // Helper to check if slot is booked
  const getBookingForSlot = (dateString, timeString) => {
    return bookings.find(
      b => b.studioId === selectedStudioId && b.date === dateString && b.time === timeString
    );
  };

  // Open booking trigger
  const handleOpenBookingModal = (dateString, timeString) => {
    setErrorMsg('');
    setModalDate(dateString);
    setModalTime(timeString);
    setStudentName('');
    setPurpose('');
    setIsModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentName.trim()) {
      setErrorMsg('Please enter student name(s).');
      return;
    }
    if (!purpose.trim()) {
      setErrorMsg('Please enter the practice purpose.');
      return;
    }

    const newBooking = {
      userEmail: user.email,
      studioId: selectedStudioId,
      studioName: currentStudio.name,
      date: modalDate,
      time: modalTime,
      studentName: studentName.trim(),
      gradeLevel: gradeLevel,
      purpose: purpose.trim()
    };

    try {
      await addBooking(newBooking);
      const updated = await getBookings();
      setBookings(updated);
      setIsModalOpen(false);
      alert('Booking request sent! Awaiting teacher approval.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to request booking. Please try again.');
    }
  };

  const handleCancelMyBooking = async (id) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this rehearsal booking?');
    if (confirmCancel) {
      try {
        const updated = await deleteBooking(id);
        setBookings(updated);
      } catch (err) {
        console.error(err);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  // Personal user bookings display
  const myBookings = bookings.filter(b => b.userEmail === user.email);

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Teacher View Banner */}
      {user.role === 'admin' && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: 'var(--neon-blue)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 500,
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👀</span> You are viewing this calendar in <strong>Student View</strong> (Teacher mode active).
          </span>
          <button 
            onClick={() => router.push('/admin')} 
            className="btn btn-primary"
            style={{ 
              padding: '0.35rem 0.75rem', 
              fontSize: '0.75rem', 
              margin: 0,
              backgroundColor: 'var(--neon-blue)',
              borderColor: 'var(--neon-blue)'
            }}
          >
            Back to Teacher Admin Control
          </button>
        </div>
      )}

      {/* Welcome Title */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-outfit)', marginBottom: '0.25rem' }}>
            KORA <span style={{ color: 'var(--neon-blue)' }}>Scheduler</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Select a studio, check week calendar openings, and click any free slot to reserve.
          </p>
        </div>
      </div>

      {/* Studio Room Switch Tabs */}
      <div className="room-tabs">
        {studios.map(studio => {
          const isActive = selectedStudioId === studio.id;
          return (
            <button
              key={studio.id}
              onClick={() => setSelectedStudioId(studio.id)}
              className={`room-tab ${isActive ? 'active' : ''}`}
              style={{
                '--active-bg': studio.color,
                '--active-glow': `${studio.color}35`
              }}
            >
              {studio.name.split(' - ')[0]}
            </button>
          );
        })}
      </div>

      {/* Week Navigator */}
      <div className="week-navigator">
        <button className="btn btn-secondary" onClick={() => setWeekOffset(weekOffset - 1)} style={{ padding: '0.5rem 1rem' }}>
          &larr; Previous Week
        </button>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem' }}>
          Schedule for Week of {weekDays[0].formattedDate} – {weekDays[4].formattedDate}, 2026
          {weekOffset === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--neon-blue)', marginLeft: '0.75rem', fontWeight: 'bold' }}>(CURRENT WEEK)</span>}
        </h3>
        <button className="btn btn-secondary" onClick={() => setWeekOffset(weekOffset + 1)} style={{ padding: '0.5rem 1rem' }}>
          Next Week &rarr;
        </button>
      </div>

      {/* Studio description banner */}
      <div className="glass" style={{ padding: '1.25rem', marginBottom: '2rem', borderLeft: `4px solid ${currentStudio.color}` }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem' }}>{currentStudio.name}</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>{currentStudio.description}</p>
      </div>

      {/* WEEKLY CALENDAR GRID */}
      <div className="glass" style={{ padding: '1rem', overflowX: 'auto' }}>
        <div className="calendar-grid" style={{ minWidth: '750px' }}>
          
          {/* Header Rows */}
          <div className="calendar-header-time"></div>
          {weekDays.map(day => (
            <div key={day.dateString} className="calendar-header">
              <div style={{ color: 'var(--text-primary)' }}>{day.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '0.2rem' }}>{day.formattedDate}</div>
            </div>
          ))}

          {/* Time & Availability Slots */}
          {HOURS.map(hour => {
            return (
              <div key={hour} style={{ display: 'contents' }}>
                {/* Vertical time block */}
                <div className="calendar-time-label">
                  {hour}
                </div>
                
                {/* Horizontal day cells */}
                {weekDays.map(day => {
                  const bk = getBookingForSlot(day.dateString, hour);
                  if (bk) {
                    return (
                      <div 
                        key={`${day.dateString}_${hour}`} 
                        className={`calendar-cell booked ${bk.status === 'Requested' ? 'requested' : ''}`}
                        style={{
                          '--room-color': currentStudio.color,
                          '--room-color-bg': `${currentStudio.color}15`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.2rem', gap: '0.25rem' }}>
                          <span className="booked-student" title={bk.studentName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {bk.studentName}
                          </span>
                          {bk.status === 'Requested' && (
                            <span style={{ 
                              fontSize: '0.55rem', 
                              padding: '0.05rem 0.25rem', 
                              borderRadius: '3px', 
                              background: 'rgba(245, 158, 11, 0.12)', 
                              color: '#f59e0b', 
                              border: '1px solid rgba(245, 158, 11, 0.25)', 
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>
                              Pending
                            </span>
                          )}
                        </div>
                        <span className="booked-grade">{bk.gradeLevel}</span>
                        <span className="booked-purpose" title={bk.purpose}>{bk.purpose}</span>
                      </div>
                    );
                  } else {
                    const today = getTodayDate();
                    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const target = new Date(day.dateString);
                    const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
                    
                    const diffTime = targetStart - todayStart;
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    
                    const isLocked = diffDays > 7 || diffDays < 1;

                    const handleCellClick = () => {
                      if (diffDays > 7) {
                        const openDate = new Date(targetStart.getTime() - 7 * 24 * 60 * 60 * 1000);
                        alert(`Booking opens 7 days in advance. You can reserve this slot starting on ${openDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`);
                        return;
                      }
                      if (diffDays < 1) {
                        alert(`Booking closes 1 day before the rehearsal date. It is too late to reserve this slot.`);
                        return;
                      }
                      handleOpenBookingModal(day.dateString, hour);
                    };

                    return (
                      <div 
                        key={`${day.dateString}_${hour}`} 
                        className={`calendar-cell ${isLocked ? 'locked-window' : 'available'}`}
                        onClick={handleCellClick}
                      >
                        <button className="cell-btn">{isLocked ? '🔒 Locked' : '+ Book'}</button>
                      </div>
                    );
                  }
                })}
              </div>
            );
          })}

        </div>
      </div>

      {/* My Bookings History List */}
      <div className="glass" style={{ marginTop: '2.5rem', padding: '1.5rem 2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-outfit)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          My Booked Sessions
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
            Bookings Made: {myBookings.length}
          </span>
        </h2>

        {myBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You haven't reserved any studio slots yet. Click any "+" cell on the calendar to book!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>ROOM</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>TIME SLOT</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>STUDENT NAME</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>PURPOSE</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((bk) => (
                  <tr key={bk.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{bk.studioName.split(' - ')[0]}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{bk.date}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--neon-blue)' }}>{bk.time}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{bk.studentName} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({bk.gradeLevel})</span></td>
                    <td style={{ padding: '0.85rem 1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{bk.purpose}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${bk.status === 'Requested' ? 'badge-pending' : 'badge-confirmed'}`} style={{ fontSize: '0.7rem' }}>
                        {bk.status || 'Requested'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleCancelMyBooking(bk.id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          borderColor: 'rgba(239, 68, 68, 0.25)',
                          color: 'var(--color-error)'
                        }}
                      >
                        Cancel Slot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOOKING RESERVATION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-outfit)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Reserve Studio Slot
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Confirm booking for <strong>{currentStudio.name.split(' - ')[0]}</strong> on <strong>{modalDate}</strong> at <strong>{modalTime}</strong>.
            </p>

            <form onSubmit={handleBookingSubmit}>
              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--color-error)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 500
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Student Name */}
              <div className="form-group">
                <label className="form-label">Student Name(s)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Alex Green & Sam Smith"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Grade select */}
              <div className="form-group">
                <label className="form-label">Grade / Group</label>
                <select 
                  className="input-field" 
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Club">School Music Club</option>
                  <option value="Teacher">Teacher / Staff</option>
                </select>
              </div>

              {/* Practice Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose of Booking</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Violin exam prep, Podcast podcast Ep 1"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: currentStudio.color }}>
                  Book Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

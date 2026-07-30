'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStudios, 
  getBookings, 
  addBooking, 
  deleteBooking, 
  getStats, 
  resetDatabase, 
  getCurrentUser 
} from '@/lib/db';

export default function TeacherAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [studios, setStudios] = useState([]);
  const [stats, setStats] = useState({ totalBookings: 0, roomCount: 0, activeThisWeek: 0 });
  
  // States
  const [selectedStudioId, setSelectedStudioId] = useState('room-101');
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Booking Modal State (Teacher booking on behalf of students)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 10');
  const [purpose, setPurpose] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Student Account Registration State
  const [newStudentName, setNewStudentName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('Grade 10');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');

  const HOURS = [
    '07:20', '08:00', '08:40', '09:20', '10:00', '10:40', 
    '11:20', '12:00', '12:40', '13:20', '14:00', '14:40', '15:20'
  ];

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (!sessionUser) {
      router.replace('/login');
    } else if (sessionUser.role !== 'admin') {
      router.replace('/dashboard');
    } else {
      setUser(sessionUser);
      loadAllData();
    }
  }, [router]);

  const loadAllData = () => {
    setBookings(getBookings());
    setStudios(getStudios());
    setStats(getStats());
  };

  if (!user || studios.length === 0) {
    return null; // Wait for initial loading
  }

  // Calculate Monday to Friday dates dynamically based on weekOffset
  const getWeekDays = (offset) => {
    const today = new Date('2026-07-29'); // Use fixed local reference date
    const targetDay = new Date(today.getTime() + offset * 7 * 24 * 60 * 60 * 1000);
    const day = targetDay.getDay();
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

  const getBookingForSlot = (dateString, timeString) => {
    return bookings.find(
      b => b.studioId === selectedStudioId && b.date === dateString && b.time === timeString
    );
  };

  // Delete booking slot from calendar view directly
  const handleDeleteBookingClick = (id, studentName, timeSlot, date) => {
    const confirmCancel = window.confirm(`Remove booking for ${studentName} on ${date} at ${timeSlot}?`);
    if (confirmCancel) {
      deleteBooking(id);
      loadAllData();
    }
  };

  // Create booking slot from calendar view directly
  const handleOpenBookingModal = (dateString, timeString) => {
    setErrorMsg('');
    setModalDate(dateString);
    setModalTime(timeString);
    setStudentName('');
    setPurpose('');
    setIsModalOpen(true);
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentName.trim()) {
      setErrorMsg('Please enter student name.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMsg('Please enter booking purpose.');
      return;
    }

    const newBooking = {
      userEmail: 'admin@vibespace.com', // Admin booking
      studioId: selectedStudioId,
      studioName: currentStudio.name,
      date: modalDate,
      time: modalTime,
      studentName: studentName.trim(),
      gradeLevel: gradeLevel,
      purpose: purpose.trim()
    };

    addBooking(newBooking);
    loadAllData();
    setIsModalOpen(false);
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setRegisterSuccess('');
    setRegisterError('');

    if (newPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          studentName: newStudentName,
          gradeLevel: newGradeLevel
        })
      });

      const data = await res.json();

      if (data.success) {
        setRegisterSuccess(`Account created online on Supabase for ${newStudentName}!`);
        setNewStudentName('');
        setNewEmail('');
        setNewPassword('');
      } else if (data.mode === 'local') {
        const { addAccount } = await import('@/lib/db');
        try {
          addAccount({
            email: newEmail,
            password: newPassword,
            studentName: newStudentName,
            gradeLevel: newGradeLevel
          });
          setRegisterSuccess(`Account registered locally for ${newStudentName}! (Supabase not configured)`);
          setNewStudentName('');
          setNewEmail('');
          setNewPassword('');
        } catch (err) {
          setRegisterError(err.message || 'Failed to save account locally.');
        }
      } else {
        setRegisterError(data.error || 'Failed to create account.');
      }
    } catch (err) {
      setRegisterError(err.message || 'An error occurred during account creation.');
    }
  };

  const handleResetData = () => {
    const confirmReset = window.confirm('Reset the database back to default school practice rooms and sample schedules?');
    if (confirmReset) {
      resetDatabase();
      loadAllData();
      alert('School schedule database reset.');
    }
  };

  // Filter bookings list based on search term
  const filteredBookingsList = bookings.filter(b => 
    b.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.studioName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Welcome Title */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-outfit)', marginBottom: '0.25rem' }}>
            KORA <span style={{ color: 'var(--neon-red)' }}>Scheduler Control</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Overview scheduling grids, delete conflicting student slots, or register school events.
          </p>
        </div>

        <button 
          onClick={handleResetData}
          className="btn btn-secondary"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.25)',
            color: 'var(--color-error)',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem'
          }}
        >
          Reset School Database
        </button>
      </div>

      {/* School Scheduling Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Booked Slots
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', color: 'var(--neon-red)' }}>
            {stats.totalBookings}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered bookings in system</span>
        </div>

        <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Music Practice Rooms
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>
            {stats.roomCount}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Available school locations</span>
        </div>

        <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--neon-blue)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bookings This Week
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', color: 'var(--neon-blue)' }}>
            {stats.activeThisWeek}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sessions within +/- 7 days</span>
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
          Admin View: Week of {weekDays[0].formattedDate} – {weekDays[4].formattedDate}, 2026
          {weekOffset === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--neon-red)', marginLeft: '0.75rem', fontWeight: 'bold' }}>(CURRENT WEEK)</span>}
        </h3>
        <button className="btn btn-secondary" onClick={() => setWeekOffset(weekOffset + 1)} style={{ padding: '0.5rem 1rem' }}>
          Next Week &rarr;
        </button>
      </div>

      {/* WEEKLY CALENDAR GRID FOR ADMIIN */}
      <div className="glass" style={{ padding: '1rem', overflowX: 'auto', marginBottom: '3rem' }}>
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
                <div className="calendar-time-label">
                  {hour}
                </div>
                
                {weekDays.map(day => {
                  const bk = getBookingForSlot(day.dateString, hour);
                  if (bk) {
                    return (
                      <div 
                        key={`${day.dateString}_${hour}`} 
                        className="calendar-cell booked"
                        style={{
                          '--room-color': currentStudio.color,
                          '--room-color-bg': `${currentStudio.color}15`,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDeleteBookingClick(bk.id, bk.studentName, hour, day.dateString)}
                        title="Click to remove student slot"
                      >
                        {/* Hovering helper cross */}
                        <div style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 'bold',
                        }}>
                          ✕
                        </div>

                        <span className="booked-student" style={{ paddingRight: '12px' }} title={bk.studentName}>{bk.studentName}</span>
                        <span className="booked-grade">{bk.gradeLevel}</span>
                        <span className="booked-purpose" title={bk.purpose}>{bk.purpose}</span>
                      </div>
                    );
                  } else {
                    return (
                      <div 
                        key={`${day.dateString}_${hour}`} 
                        className="calendar-cell available"
                        onClick={() => handleOpenBookingModal(day.dateString, hour)}
                      >
                        <button className="cell-btn">+ Add Rehearsal</button>
                      </div>
                    );
                  }
                })}
              </div>
            );
          })}

        </div>
      </div>

      {/* FULL BOOKINGS MANAGEMENT LIST */}
      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-outfit)' }}>
            All Scheduled Rehearsals
          </h2>
          
          {/* Search bar */}
          <input 
            type="text"
            placeholder="Search by student, group, or room..."
            className="input-field"
            style={{ width: '100%', maxWidth: '300px', margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredBookingsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
            No matching bookings found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>ROOM</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>TIME SLOT</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>STUDENT NAME</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>PURPOSE</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>REMOVE</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookingsList.map((bk) => (
                  <tr key={bk.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{bk.studioName.split(' - ')[0]}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{bk.date}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--neon-red)' }}>{bk.time}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{bk.studentName} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({bk.gradeLevel})</span></td>
                    <td style={{ padding: '0.85rem 1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{bk.purpose}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteBookingClick(bk.id, bk.studentName, bk.time, bk.date)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          borderColor: 'rgba(239, 68, 68, 0.25)',
                          color: 'var(--color-error)'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TEACHER BOOKING ON BEHALF MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-outfit)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Teacher Slot Reservation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Register rehearsal block for <strong>{currentStudio.name.split(' - ')[0]}</strong> on <strong>{modalDate}</strong> at <strong>{modalTime}</strong>.
            </p>

            <form onSubmit={handleCreateBooking}>
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
                <label className="form-label">Student Name / Group</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Choir practice / Jazz band"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Grade select */}
              <div className="form-group">
                <label className="form-label">Grade / Group Type</label>
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

              {/* Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose / Class Event</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Midterm exam prep / Band session"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>

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

      {/* STUDENT REGISTRATION PANEL */}
      <div className="glass" style={{ marginTop: '2.5rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-outfit)', marginBottom: '0.25rem' }}>
          Create Student Account
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Register a new student login account programmatically. Saves online to Supabase or falls back to local storage database.
        </p>

        <form onSubmit={handleRegisterStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="responsive-register-grid">
          {registerSuccess && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: 'var(--color-success)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              {registerSuccess}
            </div>
          )}

          {registerError && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--color-error)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              {registerError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Student Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Harry Potter"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Grade Level</label>
            <select 
              className="input-field" 
              value={newGradeLevel}
              onChange={(e) => setNewGradeLevel(e.target.value)}
            >
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="Club">School Music Club</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="student@school.edu"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Create Account
            </button>
          </div>
        </form>
      </div>

      {/* Responsive layout media queries */}
      <style jsx>{`
        @media (max-width: 600px) {
          .responsive-register-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}

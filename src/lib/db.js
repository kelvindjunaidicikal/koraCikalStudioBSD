// Mock database helper using localStorage for school studio booking calendar
import { getSupabaseBrowserClient } from './supabase-client';

const getSupabase = () => {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    return getSupabaseBrowserClient();
  }
  return null;
};

export const DEFAULT_STUDIOS = [
  {
    id: 'room-101',
    name: 'Music Room',
    description: 'Equipped with musical instruments, sound systems, and a staging area for practices.',
    color: '#ff3366', // Reddish Neon
    bgGradient: 'rgba(255, 51, 102, 0.15)'
  },
  {
    id: 'room-202',
    name: 'Recording Room',
    description: 'Equipped with vocal microphones, podcast interfaces, monitors, and studio software.',
    color: '#3b82f6', // Blue Ornament
    bgGradient: 'rgba(59, 130, 246, 0.15)'
  }
];

// Set default dates based on July 2026 current week (Monday 27th to Friday 31st)
const DEFAULT_BOOKINGS = [
  {
    id: 'bk-1',
    userEmail: 'user@vibespace.com',
    studioId: 'room-101',
    studioName: 'Music Room',
    date: '2026-07-27',
    time: '14:40',
    studentName: 'Sarah Jenkins',
    gradeLevel: 'Grade 11',
    purpose: 'Drum Practice',
    status: 'Requested'
  },
  {
    id: 'bk-2',
    userEmail: 'student@vibespace.com',
    studioId: 'room-101',
    studioName: 'Music Room',
    date: '2026-07-28',
    time: '08:00',
    studentName: 'Jazz Club Ensemble',
    gradeLevel: 'Club',
    purpose: 'Weekly Band Session',
    status: 'Confirmed'
  },
  {
    id: 'bk-3',
    userEmail: 'student@vibespace.com',
    studioId: 'room-202',
    studioName: 'Recording Room',
    date: '2026-07-29',
    time: '10:40',
    studentName: 'Michael Chen',
    gradeLevel: 'Grade 9',
    purpose: 'Piano Assessment prep',
    status: 'Requested'
  },
  {
    id: 'bk-4',
    userEmail: 'student@vibespace.com',
    studioId: 'room-202',
    studioName: 'Recording Room',
    date: '2026-07-30',
    time: '14:00',
    studentName: 'School Podcast Club',
    gradeLevel: 'Club',
    purpose: 'Recording Episode #12',
    status: 'Confirmed'
  },
  {
    id: 'bk-5',
    userEmail: 'student@vibespace.com',
    studioId: 'room-202',
    studioName: 'Recording Room',
    date: '2026-07-31',
    time: '10:00',
    studentName: 'Emily & Chloe',
    gradeLevel: 'Grade 12',
    purpose: 'Duet practice',
    status: 'Requested'
  }
];

const isBrowser = () => typeof window !== 'undefined';

export async function getBookings() {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
      
    if (error) {
      console.error('Error fetching bookings from Supabase:', error);
      return [];
    }
    // Map snake_case columns back to camelCase for the frontend UI logic
    return (data || []).map(b => ({
      id: b.id,
      userEmail: b.user_email,
      studioId: b.studio_id,
      studioName: b.studio_name,
      date: b.date,
      time: b.time,
      studentName: b.student_name,
      gradeLevel: b.grade_level,
      purpose: b.purpose,
      status: b.status
    }));
  }

  // Fallback to local storage
  if (!isBrowser()) return DEFAULT_BOOKINGS;
  
  try {
    const bookings = localStorage.getItem('school_bookings');
    if (!bookings) {
      localStorage.setItem('school_bookings', JSON.stringify(DEFAULT_BOOKINGS));
      return DEFAULT_BOOKINGS;
    }
    return JSON.parse(bookings);
  } catch (e) {
    console.error("Local storage bookings parse error, resetting...", e);
    localStorage.setItem('school_bookings', JSON.stringify(DEFAULT_BOOKINGS));
    return DEFAULT_BOOKINGS;
  }
}

export function saveBookings(bookings) {
  if (!isBrowser()) return;
  localStorage.setItem('school_bookings', JSON.stringify(bookings));
}

export async function addBooking(bookingData) {
  const supabase = getSupabase();
  const newBooking = {
    id: `bk-${Math.floor(1000 + Math.random() * 9000)}`,
    status: bookingData.status || 'Requested', // Default to requested for student workflow
    ...bookingData
  };

  if (supabase) {
    // Map camelCase fields to snake_case database columns to match Supabase SQL table structure
    const dbRecord = {
      id: newBooking.id,
      user_email: newBooking.userEmail,
      studio_id: newBooking.studioId,
      studio_name: newBooking.studioName,
      date: newBooking.date,
      time: newBooking.time,
      student_name: newBooking.studentName,
      grade_level: newBooking.gradeLevel,
      purpose: newBooking.purpose,
      status: newBooking.status
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([dbRecord])
      .select();
      
    if (error) {
      console.error('Error adding booking to Supabase:', error);
      throw error;
    }

    const inserted = data?.[0];
    return inserted ? {
      id: inserted.id,
      userEmail: inserted.user_email,
      studioId: inserted.studio_id,
      studioName: inserted.studio_name,
      date: inserted.date,
      time: inserted.time,
      studentName: inserted.student_name,
      gradeLevel: inserted.grade_level,
      purpose: inserted.purpose,
      status: inserted.status
    } : newBooking;
  }

  // Fallback to local storage
  const bookings = await getBookings();
  bookings.push(newBooking);
  saveBookings(bookings);
  return newBooking;
}

export async function approveBooking(id) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'Confirmed' })
      .eq('id', id);
      
    if (error) {
      console.error('Error approving booking in Supabase:', error);
      throw error;
    }
    return getBookings();
  }

  // Fallback to local storage
  const bookings = await getBookings();
  const updated = bookings.map(b => {
    if (b.id === id) {
      return { ...b, status: 'Confirmed' };
    }
    return b;
  });
  saveBookings(updated);
  return updated;
}

export async function deleteBooking(id) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting booking from Supabase:', error);
      throw error;
    }
    return getBookings();
  }

  // Fallback to local storage
  const bookings = await getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  saveBookings(filtered);
  return filtered;
}

export function getCurrentUser() {
  if (!isBrowser()) return null;
  try {
    const user = localStorage.getItem('school_user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Local storage user parse error:", e);
    return null;
  }
}

export function setCurrentUser(email, role) {
  if (!isBrowser()) return;
  localStorage.setItem('school_user', JSON.stringify({ email, role }));
}

export function logoutUser() {
  if (!isBrowser()) return;
  localStorage.removeItem('school_user');
}

export function getStudios() {
  if (!isBrowser()) return DEFAULT_STUDIOS;
  
  try {
    const studios = localStorage.getItem('school_studios');
    if (!studios) {
      localStorage.setItem('school_studios', JSON.stringify(DEFAULT_STUDIOS));
      return DEFAULT_STUDIOS;
    }
    return JSON.parse(studios);
  } catch (e) {
    console.error("Local storage studios parse error, resetting...", e);
    localStorage.setItem('school_studios', JSON.stringify(DEFAULT_STUDIOS));
    return DEFAULT_STUDIOS;
  }
}

export function saveStudios(studios) {
  if (!isBrowser()) return;
  localStorage.setItem('school_studios', JSON.stringify(studios));
}

export const DEFAULT_ACCOUNTS = [
  {
    email: 'student@vibespace.com',
    password: 'password',
    role: 'user',
    studentName: 'Default Student',
    gradeLevel: 'Grade 10'
  },
  {
    email: 'admin@vibespace.com',
    password: 'admin123',
    role: 'admin',
    studentName: 'Music Teacher',
    gradeLevel: 'Teacher'
  }
];

export function getAccounts() {
  if (!isBrowser()) return DEFAULT_ACCOUNTS;
  
  try {
    const accounts = localStorage.getItem('school_accounts');
    if (!accounts) {
      localStorage.setItem('school_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(accounts);
  } catch (e) {
    console.error("Local storage accounts parse error, resetting...", e);
    localStorage.setItem('school_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts) {
  if (!isBrowser()) return;
  localStorage.setItem('school_accounts', JSON.stringify(accounts));
}

export function addAccount(accountData) {
  const accounts = getAccounts();
  const exists = accounts.some(a => a.email.toLowerCase() === accountData.email.toLowerCase());
  if (exists) {
    throw new Error('An account with this email already exists.');
  }
  
  const newAccount = {
    role: 'user', // Default role for created accounts
    ...accountData
  };
  accounts.push(newAccount);
  saveAccounts(accounts);
  return newAccount;
}

export function validateLogin(email, password) {
  const accounts = getAccounts();
  const user = accounts.find(
    a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  return user || null;
}

export function resetDatabase() {
  if (!isBrowser()) return;
  localStorage.setItem('school_bookings', JSON.stringify(DEFAULT_BOOKINGS));
  localStorage.setItem('school_studios', JSON.stringify(DEFAULT_STUDIOS));
  localStorage.setItem('school_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
}

export async function getStats() {
  const bookings = await getBookings();
  const studios = getStudios();
  
  const totalBookings = bookings.length;
  const totalConfirmed = bookings.filter(b => b.status === 'Confirmed').length;
  const totalPending = bookings.filter(b => b.status === 'Requested').length;
  
  // Find popular room
  const roomCounts = bookings.reduce((acc, curr) => {
    acc[curr.studioName] = (acc[curr.studioName] || 0) + 1;
    return acc;
  }, {});
  
  let popularRoom = 'None';
  let maxCount = 0;
  Object.entries(roomCounts).forEach(([room, count]) => {
    if (count > maxCount) {
      maxCount = count;
      popularRoom = room.split(' - ')[0];
    }
  });

  const activeThisWeek = bookings.filter(b => {
    const bDate = new Date(b.date);
    const today = new Date('2026-07-29'); // Local test time reference
    const diffTime = Math.abs(today - bDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  
  return {
    totalBookings,
    totalConfirmed,
    totalPending,
    popularRoom,
    roomCount: studios.length,
    activeThisWeek
  };
}

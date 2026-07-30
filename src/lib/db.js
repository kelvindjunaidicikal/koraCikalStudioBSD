// Mock database helper using localStorage for school studio booking calendar

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

export function getBookings() {
  if (!isBrowser()) return DEFAULT_BOOKINGS;
  
  const bookings = localStorage.getItem('school_bookings');
  if (!bookings) {
    localStorage.setItem('school_bookings', JSON.stringify(DEFAULT_BOOKINGS));
    return DEFAULT_BOOKINGS;
  }
  return JSON.parse(bookings);
}

export function saveBookings(bookings) {
  if (!isBrowser()) return;
  localStorage.setItem('school_bookings', JSON.stringify(bookings));
}

export function addBooking(bookingData) {
  const bookings = getBookings();
  const newBooking = {
    id: `bk-${Math.floor(1000 + Math.random() * 9000)}`,
    status: bookingData.status || 'Requested', // Default to requested for student workflow
    ...bookingData
  };
  bookings.push(newBooking);
  saveBookings(bookings);
  return newBooking;
}

export function approveBooking(id) {
  const bookings = getBookings();
  const updated = bookings.map(b => {
    if (b.id === id) {
      return { ...b, status: 'Confirmed' };
    }
    return b;
  });
  saveBookings(updated);
  return updated;
}

export function deleteBooking(id) {
  const bookings = getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  saveBookings(filtered);
  return filtered;
}

export function getCurrentUser() {
  if (!isBrowser()) return null;
  const user = localStorage.getItem('school_user');
  return user ? JSON.parse(user) : null;
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
  
  const studios = localStorage.getItem('school_studios');
  if (!studios) {
    localStorage.setItem('school_studios', JSON.stringify(DEFAULT_STUDIOS));
    return DEFAULT_STUDIOS;
  }
  return JSON.parse(studios);
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
  
  const accounts = localStorage.getItem('school_accounts');
  if (!accounts) {
    localStorage.setItem('school_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  return JSON.parse(accounts);
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

export function getStats() {
  const bookings = getBookings();
  const studios = getStudios();
  
  return {
    totalBookings: bookings.length,
    roomCount: studios.length,
    activeThisWeek: bookings.filter(b => {
      const bDate = new Date(b.date);
      const today = new Date('2026-07-29'); // Local test time reference
      const diffTime = Math.abs(today - bDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length
  };
}

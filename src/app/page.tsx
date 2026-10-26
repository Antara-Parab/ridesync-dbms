'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, MapPin, Clock, Users, CheckCircle, 
  AlertCircle, Search, PlusCircle, Check, X, 
  ArrowRight, ShieldCheck, Tag, Sparkles, Phone,
  TrendingDown, CheckSquare, Square, LogIn, UserPlus,
  LogOut, User, Lock, ChevronRight, Zap, Trash2
} from 'lucide-react';

interface Ride {
  ride_id: number;
  driver_name: string;
  driver_phone: string;
  vehicle_model: string;
  vehicle_number: string;
  source: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  cost_per_seat: number;
}

interface Booking {
  booking_id: number;
  ride_id: number;
  driver_name?: string;
  passenger_name: string;
  passenger_phone: string;
  source: string;
  destination: string;
  departure_time: string;
  seats_requested: number;
  has_student_discount: boolean;
  total_fare: number;
  discounted_fare: number;
  booking_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  booked_at: string;
}

interface AuthUser {
  user_id: number;
  username: string;
  full_name: string;
}

export default function CampusPoolApp() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // App tabs: 'find' | 'offer' | 'bookings'
  const [activeTab, setActiveTab] = useState<'find' | 'offer' | 'bookings'>('find');
  const [myRidesSubTab, setMyRidesSubTab] = useState<'passenger' | 'driver'>('passenger');
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Search state
  const [searchSource, setSearchSource] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const sourceInputRef = useRef<HTMLInputElement>(null);

  // Booking Modal state
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [passengerNameInput, setPassengerNameInput] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('9820445566');
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [applyStudentDiscount, setApplyStudentDiscount] = useState(true);

  // Offer Ride Form state
  const [newRideForm, setNewRideForm] = useState<{
    driver_name: string;
    driver_phone: string;
    vehicle_model: string;
    vehicle_number: string;
    source: string;
    destination: string;
    departure_time: string;
    available_seats: number | string;
    cost_per_seat: number | string;
  }>({
    driver_name: '',
    driver_phone: '9820112233',
    vehicle_model: 'Hyundai i20',
    vehicle_number: '',
    source: '',
    destination: 'VESIT Campus',
    departure_time: '',
    available_seats: 3,
    cost_per_seat: 40,
  });

  // Automatically format Indian Vehicle Number Plate: e.g. MH-01-AB-1234
  const formatVehicleNumber = (val: string): string => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (!clean) return '';

    let res = '';
    // Part 1: State code (up to 2 letters, e.g. MH, DL, KA)
    let i = 0;
    while (i < clean.length && i < 2 && /[A-Z]/.test(clean[i])) {
      res += clean[i];
      i++;
    }
    if (i >= clean.length) return res;

    res += '-';
    // Part 2: RTO digits (up to 2 digits, e.g. 01, 02)
    let rtoCount = 0;
    while (i < clean.length && rtoCount < 2 && /[0-9]/.test(clean[i])) {
      res += clean[i];
      i++;
      rtoCount++;
    }
    if (i >= clean.length) return res;

    res += '-';
    // Part 3: Series letters (up to 2 letters, e.g. AB, TS, AP)
    let seriesCount = 0;
    while (i < clean.length && seriesCount < 2 && /[A-Z]/.test(clean[i])) {
      res += clean[i];
      i++;
      seriesCount++;
    }
    if (i >= clean.length) return res;

    res += '-';
    // Part 4: 4 digits (e.g. 1234)
    let numCount = 0;
    while (i < clean.length && numCount < 4 && /[0-9]/.test(clean[i])) {
      res += clean[i];
      i++;
      numCount++;
    }

    return res;
  };

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    let raw = inputVal;
    if (newRideForm.vehicle_number.endsWith('-') && inputVal === newRideForm.vehicle_number.slice(0, -1)) {
      raw = inputVal.slice(0, -1);
    }
    const formatted = formatVehicleNumber(raw);
    setNewRideForm(prev => ({ ...prev, vehicle_number: formatted }));
  };

  // Automatically format 24-hour clock time: e.g. 08:30, 14:15, 23:59
  const format24HourTime = (val: string): string => {
    // If input already has a colon
    if (val.includes(':')) {
      const parts = val.split(':');
      let h = parts[0].replace(/[^0-9]/g, '').slice(0, 2);
      let m = parts[1].replace(/[^0-9]/g, '').slice(0, 2);
      if (!h && !m) return '';
      if (h) {
        const hNum = Math.min(23, parseInt(h, 10));
        h = String(hNum).padStart(2, '0');
      }
      if (m) {
        let mNum = parseInt(m, 10);
        if (m.length === 1 && mNum > 5) mNum = 5;
        else if (m.length === 2 && mNum > 59) mNum = 59;
        m = String(mNum);
      }
      return h ? (m !== '' ? h + ':' + m : h + ':') : '';
    }

    // Pure digits
    const digits = val.replace(/[^0-9]/g, '').slice(0, 4);
    if (!digits) return '';

    if (digits.length === 1) {
      const d = parseInt(digits, 10);
      if (d >= 3) return '0' + d + ':';
      return digits;
    }

    if (digits.length === 2) {
      const hours = Math.min(23, parseInt(digits, 10));
      return String(hours).padStart(2, '0') + ':';
    }

    // 3 or 4 digits
    const hours = Math.min(23, parseInt(digits.slice(0, 2), 10));
    const hStr = String(hours).padStart(2, '0');
    let m1 = parseInt(digits[2], 10);
    if (m1 > 5) m1 = 5;
    if (digits.length === 3) {
      return hStr + ':' + m1;
    }
    const m2 = parseInt(digits[3], 10);
    return hStr + ':' + m1 + m2;
  };

  const handleDepartureTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    let raw = inputVal;
    if (newRideForm.departure_time.endsWith(':') && inputVal === newRideForm.departure_time.slice(0, -1)) {
      raw = inputVal.slice(0, -1);
    }
    const formatted = format24HourTime(raw);
    setNewRideForm(prev => ({ ...prev, departure_time: formatted }));
  };

  // Seat change & blur handlers (Never allow 0 seats, auto-clear 0 on focus)
  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setNewRideForm(prev => ({ ...prev, available_seats: '' }));
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num <= 0) {
        // Do not allow 0 seats
        setNewRideForm(prev => ({ ...prev, available_seats: '' }));
      } else {
        setNewRideForm(prev => ({ ...prev, available_seats: Math.min(6, num) }));
      }
    }
  };

  const handleSeatsFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (newRideForm.available_seats === 0 || newRideForm.available_seats === '0') {
      setNewRideForm(prev => ({ ...prev, available_seats: '' }));
    } else {
      e.target.select();
    }
  };

  const handleSeatsBlur = () => {
    if (newRideForm.available_seats === '' || Number(newRideForm.available_seats) < 1) {
      setNewRideForm(prev => ({ ...prev, available_seats: 1 }));
    }
  };

  // Rent change & blur handlers (Auto-clear 0 on focus, default 0 on blur if empty)
  const handleRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setNewRideForm(prev => ({ ...prev, cost_per_seat: '' }));
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setNewRideForm(prev => ({ ...prev, cost_per_seat: val }));
    }
  };

  const handleRentFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (newRideForm.cost_per_seat === 0 || newRideForm.cost_per_seat === '0') {
      setNewRideForm(prev => ({ ...prev, cost_per_seat: '' }));
    } else {
      e.target.select();
    }
  };

  const handleRentBlur = () => {
    if (newRideForm.cost_per_seat === '') {
      setNewRideForm(prev => ({ ...prev, cost_per_seat: 0 }));
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Check saved session & fetch initial data
  useEffect(() => {
    const savedUser = localStorage.getItem('campuspool_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setPassengerNameInput(parsed.username);
        setNewRideForm(prev => ({ ...prev, driver_name: parsed.username }));
      } catch {
        localStorage.removeItem('campuspool_user');
      }
    } else {
      // Default to guest name
      setPassengerNameInput('Tanmay');
    }
    fetchRides();
    fetchBookings();
  }, []);

  const fetchRides = async () => {
    try {
      let url = '/api/rides';
      const params = new URLSearchParams();
      if (searchSource) params.append('source', searchSource);
      if (searchDest) params.append('destination', searchDest);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRides(data.rides);
      }
    } catch {
      console.error('Failed to load rides');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch {
      console.error('Failed to load bookings');
    }
  };

  // Regular Auth Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setAuthLoading(true);
    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setPassengerNameInput(data.user.username);
        setNewRideForm(prev => ({ ...prev, driver_name: data.user.username }));
        localStorage.setItem('campuspool_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        showToast(data.message, 'success');
        setAuthUsername('');
        setAuthPassword('');
      } else {
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch {
      showToast('Connection error, please try again', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('campuspool_user');
    showToast('Logged out successfully', 'info');
  };

  // Open Booking Modal for Any User
  const handleOpenBookingModal = (ride: Ride) => {
    if (currentUser && ride.driver_name?.toLowerCase() === currentUser.username.toLowerCase()) {
      showToast('⚠️ You cannot book a seat on your own ride! You are the driver.', 'error');
      return;
    }
    setSelectedRide(ride);
    setRequestedSeats(1);
    if (currentUser) {
      setPassengerNameInput(currentUser.username);
    } else if (!passengerNameInput) {
      setPassengerNameInput('');
    }
  };

  // Student Books a Seat
  const handleConfirmBooking = async () => {
    if (!selectedRide) return;

    if (currentUser && selectedRide.driver_name?.toLowerCase() === currentUser.username.toLowerCase()) {
      showToast('⚠️ You cannot book a seat on your own ride! You are the driver.', 'error');
      setSelectedRide(null);
      return;
    }

    const bookerName = currentUser?.username || passengerNameInput.trim() || 'Student Passenger';

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: selectedRide.ride_id,
          passenger_name: bookerName,
          passenger_phone: passengerPhone,
          seats_requested: requestedSeats,
          apply_student_discount: applyStudentDiscount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setSelectedRide(null);
        fetchBookings();
        fetchRides();
        setMyRidesSubTab('passenger');
        setActiveTab('bookings');
      } else {
        showToast(data.error || 'Failed to submit booking', 'error');
      }
    } catch {
      showToast('Network error, please try again.', 'error');
    }
  };

  // Driver Offers a New Ride
  const handleOfferRide = async (e: React.FormEvent) => {
    e.preventDefault();
    const driverName = newRideForm.driver_name.trim() || currentUser?.username;

    if (!driverName) {
      showToast('Please enter your name or log in first!', 'error');
      return;
    }

    if (!newRideForm.source.trim() || !newRideForm.destination.trim()) {
      showToast('Please fill in pickup and drop locations', 'error');
      return;
    }

    if (!newRideForm.departure_time.trim() || newRideForm.departure_time.length < 4) {
      showToast('Please enter a valid 24-hour departure time (e.g. 08:30 or 14:15)', 'error');
      return;
    }

    const seatsNum = Number(newRideForm.available_seats);
    if (!seatsNum || seatsNum < 1) {
      showToast('⚠️ Seats available must be at least 1! You cannot offer 0 seats.', 'error');
      return;
    }

    const fareNum = newRideForm.cost_per_seat === '' ? 0 : Number(newRideForm.cost_per_seat);

    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRideForm,
          available_seats: seatsNum,
          cost_per_seat: fareNum,
          driver_name: driverName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('🎉 Your carpool ride has been published to the database!', 'success');
        setNewRideForm({
          driver_name: currentUser?.username || '',
          driver_phone: '9820112233',
          vehicle_model: 'Hyundai i20',
          vehicle_number: '',
          source: '',
          destination: 'VESIT Campus',
          departure_time: '',
          available_seats: 3,
          cost_per_seat: 40,
        });
        fetchRides();
        setActiveTab('find');
      } else {
        showToast(data.error || 'Failed to offer ride', 'error');
      }
    } catch {
      showToast('Failed to post ride. Please check network.', 'error');
    }
  };

  // Driver Accepts Booking Request
  const handleAcceptRequest = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchBookings();
        fetchRides();
      } else {
        showToast(data.error || 'Could not accept booking', 'error');
      }
    } catch {
      showToast('Action failed', 'error');
    }
  };

  // Driver Declines Booking Request
  const handleRejectRequest = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Booking request declined.', 'info');
        fetchBookings();
      } else {
        showToast(data.error || 'Could not decline booking', 'error');
      }
    } catch {
      showToast('Action failed', 'error');
    }
  };

  // Clear All Bookings (Admin / Demo Reset)
  const handleClearAllBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Cleaned! All test bookings cleared from database.', 'success');
        fetchBookings();
        fetchRides();
      } else {
        showToast(data.error || 'Failed to clear bookings', 'error');
      }
    } catch {
      showToast('Network error while clearing bookings', 'error');
    }
  };

  // Arithmetic Calculation for Selected Ride
  const unitPrice = selectedRide ? selectedRide.cost_per_seat : 40;
  const baseFare = requestedSeats * unitPrice;
  const discountAmount = applyStudentDiscount ? baseFare * 0.10 : 0;
  const finalFare = baseFare - discountAmount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-bounce-short">
          <div className={`p-4 rounded-xl shadow-xl border flex items-start space-x-3 ${
            toast.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
            toast.type === 'error' ? 'bg-rose-900 text-rose-100 border-rose-700' :
            'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
            <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('find')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CampusPool</span>
              </div>
              <p className="text-[11px] text-slate-500">Student Carpool & Seat Sharing</p>
            </div>
          </div>

          {/* Navigation Bar (Always Clickable) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('find')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'find' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Ride</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'offer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Offer Ride</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'bookings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>My Rides</span>
                {bookings.filter(b => b.booking_status === 'PENDING').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </nav>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentUser.username}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center space-x-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: FIND RIDES (PASSENGER) */}
        {/* ========================================================================= */}
        {activeTab === 'find' && (
          <div className="space-y-6">
            {/* Hero / Route Search Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center space-x-1 bg-emerald-700/60 text-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>College Verified Student Carpools</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                  Pool a Ride to VESIT Campus for ₹40
                </h1>
                <p className="text-emerald-100 text-xs sm:text-sm mb-5">
                  Skip the crowded local train and auto queues. Travel comfortably in a student carpool and get 10% off with your college ID!
                </p>

                {/* 3 Clickable Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchSource('');
                      setSearchDest('');
                      fetchRides();
                      showToast('Showing all carpools at standard ₹40 rent', 'info');
                    }}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition cursor-pointer active:scale-95"
                  >
                    <div className="font-extrabold text-xs text-white">💰 ₹40 Fixed Rent</div>
                    <div className="text-[10px] text-emerald-200">Affordable seat sharing</div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      showToast('💡 10% Subsidy Arithmetic: Seats × ₹40 - 10% Off = Final Payable!', 'info');
                    }}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition cursor-pointer active:scale-95"
                  >
                    <div className="font-extrabold text-xs text-white">🎓 10% Student Subsidy</div>
                    <div className="text-[10px] text-emerald-200">Automatic arithmetic discount</div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      sourceInputRef.current?.focus();
                      showToast('Enter your pickup area below (e.g. Chembur, Dadar, Thane)', 'info');
                    }}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition cursor-pointer active:scale-95"
                  >
                    <div className="font-extrabold text-xs text-white">📍 Point A to Point B</div>
                    <div className="text-[10px] text-emerald-200">Direct rides to campus gate</div>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">Pick-up Location</label>
                    <input
                      ref={sourceInputRef}
                      type="text"
                      placeholder="e.g. Chembur, Dadar, Thane, Vashi..."
                      value={searchSource}
                      onChange={(e) => setSearchSource(e.target.value)}
                      className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">Drop Location</label>
                    <input
                      type="text"
                      placeholder="VESIT Campus"
                      value={searchDest}
                      onChange={(e) => setSearchDest(e.target.value)}
                      className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        fetchRides();
                        showToast(`🔍 Searching for carpools from "${searchSource || 'anywhere'}"...`, 'info');
                      }}
                      className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition shadow cursor-pointer active:scale-95"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                    {(searchSource || searchDest) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSource('');
                          setSearchDest('');
                          fetchRides();
                        }}
                        className="py-2 px-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Clear filters"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Cards List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Available Student Rides</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {rides.length} active
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={fetchRides}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  ↻ Refresh list
                </button>
              </div>

              {rides.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No carpools currently available</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Be the first to offer a carpool ride for your college route!</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('offer')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    + Offer a Carpool Ride Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rides.map((ride) => (
                    <div 
                      key={ride.ride_id} 
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Route Title */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                            <span>{ride.source}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{ride.destination}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ride.available_seats > 1 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ride.available_seats} {ride.available_seats === 1 ? 'seat left' : 'seats left'}
                          </span>
                        </div>

                        {/* Driver & Car Details */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Driver:</span>
                            <span className="font-semibold text-slate-800 flex items-center space-x-1">
                              <span>{ride.driver_name}</span>
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded font-bold">VESIT</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Vehicle:</span>
                            <span className="text-slate-700 font-medium">{ride.vehicle_model} ({ride.vehicle_number})</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Departure:</span>
                            <span className="font-semibold text-slate-700 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{ride.departure_time}</span>
                            </span>
                          </div>
                        </div>

                        {/* Pricing and Discount */}
                        <div className="flex items-baseline justify-between mb-4">
                          <div>
                            <span className="text-lg font-black text-slate-900">₹{ride.cost_per_seat}</span>
                            <span className="text-xs text-slate-500"> / seat</span>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Tag className="w-3 h-3" />
                              <span>₹{(Number(ride.cost_per_seat) * 0.9).toFixed(0)} with Student ID</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clickable Book Button OR Driver Own-Ride Indicator */}
                      {currentUser && ride.driver_name?.toLowerCase() === currentUser.username.toLowerCase() ? (
                        <div className="w-full py-2.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Your Carpool Ride (You are Driver)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenBookingModal(ride)}
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer active:scale-95"
                        >
                          <span>Apply for Seat</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: OFFER A RIDE (DRIVER) */}
        {/* ========================================================================= */}
        {activeTab === 'offer' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Offer Carpool Seats</h2>
                  <p className="text-xs text-slate-500">
                    Share your empty seats, help batchmates, and save fuel!
                  </p>
                </div>
              </div>

              <form onSubmit={handleOfferRide} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tanmay / Antara"
                    required
                    value={newRideForm.driver_name}
                    onChange={(e) => setNewRideForm({ ...newRideForm, driver_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Car Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai i20 / Swift"
                      required
                      value={newRideForm.vehicle_model}
                      onChange={(e) => setNewRideForm({ ...newRideForm, vehicle_model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Number Plate *</label>
                    <input
                      type="text"
                      placeholder="e.g. MH-01-AB-1234"
                      maxLength={14}
                      required
                      value={newRideForm.vehicle_number}
                      onChange={handleVehicleNumberChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider font-semibold placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pickup (Point A) *</label>
                    <input
                      type="text"
                      placeholder="e.g. Chembur Naka / Dadar Circle"
                      required
                      value={newRideForm.source}
                      onChange={(e) => setNewRideForm({ ...newRideForm, source: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Drop Location (Point B) *</label>
                    <input
                      type="text"
                      required
                      value={newRideForm.destination}
                      onChange={(e) => setNewRideForm({ ...newRideForm, destination: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Departure Time (24-hr) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:30 or 14:15"
                      maxLength={5}
                      required
                      value={newRideForm.departure_time}
                      onChange={handleDepartureTimeChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-semibold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Seats Available (Min: 1) *</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      required
                      placeholder="1 - 6"
                      value={newRideForm.available_seats}
                      onChange={handleSeatsChange}
                      onFocus={handleSeatsFocus}
                      onBlur={handleSeatsBlur}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rent / Seat (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="0"
                      value={newRideForm.cost_per_seat}
                      onChange={handleRentChange}
                      onFocus={handleRentFocus}
                      onBlur={handleRentBlur}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Car className="w-4 h-4" />
                  <span>Publish Ride to Database for ₹{newRideForm.cost_per_seat === '' ? 0 : newRideForm.cost_per_seat} / Seat</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY RIDES & APPROVALS (CLEAN CARD-BASED DESIGN) */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            {/* Clean Sub-tab Navigation */}
            {(() => {
              const currentName = (currentUser?.username || '').toLowerCase();
              const myBookingsCount = currentUser
                ? bookings.filter(b => (b.passenger_name || '').toLowerCase() === currentName).length
                : 0;
              const myPendingDriverRequestsCount = currentUser
                ? bookings.filter(b => (b.driver_name || '').toLowerCase() === currentName && b.booking_status === 'PENDING').length
                : 0;

              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMyRidesSubTab('passenger')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        myRidesSubTab === 'passenger'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🎒 Trips I Booked</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                        {myBookingsCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyRidesSubTab('driver')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        myRidesSubTab === 'driver'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🚗 Requests for My Car</span>
                      {myPendingDriverRequestsCount > 0 && (
                        <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          {myPendingDriverRequestsCount} new
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleClearAllBookings}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                      title="Clear all test bookings from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Bookings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fetchBookings();
                        showToast('Updated rides list from database', 'info');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition"
                    >
                      ↻ Refresh Status
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 1. PASSENGER VIEW (TRIPS I BOOKED - SPLIT INTO PENDING & CONFIRMED) */}
            {myRidesSubTab === 'passenger' && (() => {
              const currentName = (currentUser?.username || '').toLowerCase();
              if (!currentUser) {
                return (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Please login to view your booked rides</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Log in to view pending and confirmed carpool seats.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      Login Now
                    </button>
                  </div>
                );
              }

              // Filter to current user's booked trips safely
              const userTrips = bookings.filter(b => (b.passenger_name || '').toLowerCase() === currentName);

              const pendingTrips = userTrips.filter(b => b.booking_status === 'PENDING');
              const confirmedTrips = userTrips.filter(b => b.booking_status === 'ACCEPTED');
              const declinedTrips = userTrips.filter(b => b.booking_status === 'REJECTED');

              return (
                <div className="space-y-6">
                  {userTrips.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                      <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">You haven't booked any rides yet</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Find a carpool to campus and rent a seat for ₹40!</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('find')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        Browse Available Carpools
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* SECTION 1: APPROVAL PENDING */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Approval Pending ({pendingTrips.length})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            — Waiting for driver confirmation
                          </span>
                        </div>

                        {pendingTrips.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs text-center">
                            No pending ride requests.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingTrips.map((b) => (
                              <div key={b.booking_id} className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
                                <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                                  <div>
                                    <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                                      <span>{b.source}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>{b.destination}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>Departure: {b.departure_time}</span>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    ⏳ Pending Approval
                                  </span>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Driver:</span>
                                    <span className="font-semibold text-slate-800">{b.driver_name || 'Student Driver'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Seats Applied:</span>
                                    <span className="font-bold text-slate-900">{b.seats_requested} seat(s)</span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-slate-400">Estimated Fare:</span>
                                    <span className="font-black text-slate-900 text-sm">₹{b.discounted_fare}</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-amber-700 font-medium">
                                  ⏳ Your request is with the driver. Once approved, your seat will be reserved!
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION 2: BOOKED & CONFIRMED */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Booked & Confirmed ({confirmedTrips.length})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            — Seat reserved! Pay upon boarding
                          </span>
                        </div>

                        {confirmedTrips.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs text-center">
                            No confirmed trips yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {confirmedTrips.map((b) => (
                              <div key={b.booking_id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs">
                                <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                                  <div>
                                    <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                                      <span>{b.source}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>{b.destination}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>Departure: {b.departure_time}</span>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    ✅ Confirmed
                                  </span>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Driver:</span>
                                    <span className="font-semibold text-slate-800">{b.driver_name || 'Student Driver'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Seats Confirmed:</span>
                                    <span className="font-bold text-slate-900">{b.seats_requested} seat(s)</span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-slate-400">Total Payable:</span>
                                    <span className="font-black text-emerald-700 text-sm">₹{b.discounted_fare}</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg">
                                  🎉 Your seat is reserved! Pay ₹{b.discounted_fare} directly to {b.driver_name || 'driver'} via UPI or cash upon boarding.
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION 3: DECLINED (IF ANY) */}
                      {declinedTrips.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-2">
                            Declined Requests ({declinedTrips.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {declinedTrips.map((b) => (
                              <div key={b.booking_id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs opacity-75">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-slate-800">{b.source} ➔ {b.destination}</span>
                                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">Declined</span>
                                </div>
                                <p className="text-[11px] text-slate-400">Carpool was full or cancelled by driver.</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* 2. DRIVER VIEW (ONLY REQUESTS FOR MY CAR) */}
            {myRidesSubTab === 'driver' && (() => {
              const currentName = (currentUser?.username || '').toLowerCase();
              // Filter requests to rides where current user is the driver
              const myCarRequests = currentUser
                ? bookings.filter(b => (b.driver_name || '').toLowerCase() === currentName)
                : [];

              const hasOfferedRides = currentUser
                ? rides.some(r => (r.driver_name || '').toLowerCase() === currentName)
                : false;

              return (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950 mb-0.5">
                        Driver Inbox: Requests for Your Car
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        {currentUser 
                          ? `Showing booking requests sent by classmates specifically for ${currentUser.username}'s car.`
                          : 'Please login to see requests for your carpool.'}
                      </p>
                    </div>
                    {myCarRequests.filter(b => b.booking_status === 'PENDING').length > 0 && (
                      <span className="text-xs font-extrabold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full shrink-0">
                        {myCarRequests.filter(b => b.booking_status === 'PENDING').length} Pending Requests
                      </span>
                    )}
                  </div>

                  {!currentUser ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                      <Lock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Login to manage requests for your car</p>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                      >
                        Login as Driver
                      </button>
                    </div>
                  ) : !hasOfferedRides ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                      <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">You haven't offered any carpool rides yet</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        When you post an offer ride, only then will student requests for your car appear here!
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('offer')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        + Offer a Carpool Ride Now
                      </button>
                    </div>
                  ) : myCarRequests.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No incoming passenger requests for your car yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Your ride is live! When classmates apply to rent seats, they will appear right here for your approval.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myCarRequests.map((b) => (
                        <div 
                          key={b.booking_id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                                  <User className="w-4 h-4 text-emerald-600" />
                                  <span>{b.passenger_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{b.passenger_phone}</span>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.booking_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                                b.booking_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {b.booking_status === 'ACCEPTED' ? 'Confirmed' :
                                 b.booking_status === 'PENDING' ? 'Pending Your Approval' : 'Declined'}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-4">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Route Requested:</span>
                                <span className="font-semibold text-slate-800">{b.source} ➔ {b.destination}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Seats Requested:</span>
                                <span className="font-bold text-slate-900">{b.seats_requested} seat(s)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Fare to Collect:</span>
                                <span className="font-black text-emerald-700 text-sm">₹{b.discounted_fare}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {b.booking_status === 'PENDING' ? (
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptRequest(b.booking_id)}
                                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95 flex items-center justify-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept Request</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectRequest(b.booking_id)}
                                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer active:scale-95"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <div className="text-center py-1 text-xs text-slate-500 font-medium">
                                {b.booking_status === 'ACCEPTED' ? '✅ You confirmed this booking' : '❌ You declined this request'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: BOOKING MODAL (OPENS FOR ANYONE CLICKING "APPLY FOR SEAT") */}
      {/* ========================================================================= */}
      {selectedRide && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Book Carpool Seat
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRide.source} ➔ {selectedRide.destination}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedRide(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="font-semibold text-slate-800">{selectedRide.driver_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Car & Plate:</span>
                <span className="text-slate-700">{selectedRide.vehicle_model} ({selectedRide.vehicle_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departure:</span>
                <span className="font-semibold text-slate-700">{selectedRide.departure_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seats Left:</span>
                <span className="font-bold text-emerald-600">{selectedRide.available_seats} remaining</span>
              </div>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={passengerNameInput}
                  onChange={(e) => setPassengerNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seats to Rent</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={num > selectedRide.available_seats}
                      onClick={() => setRequestedSeats(num)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition cursor-pointer ${
                        requestedSeats === num 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : num > selectedRide.available_seats
                          ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {num} {num === 1 ? 'Seat' : 'Seats'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Subsidy Discount Toggle */}
              <div 
                onClick={() => setApplyStudentDiscount(!applyStudentDiscount)}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer select-none transition hover:bg-emerald-50"
              >
                <div className="flex items-center space-x-2">
                  {applyStudentDiscount ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <span className="font-bold text-emerald-950 text-xs">Apply VESIT Student Subsidy</span>
                    <p className="text-[10px] text-emerald-700">10% discount with College ID</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  -10% OFF
                </span>
              </div>
            </div>

            {/* Arithmetic Breakdown Card */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1.5 mb-4">
              <div className="flex justify-between text-slate-300">
                <span>Base Rent:</span>
                <span>{requestedSeats} seat(s) × ₹{unitPrice} = ₹{baseFare.toFixed(2)}</span>
              </div>
              {applyStudentDiscount && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Student Discount (10%):</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-1.5 flex justify-between items-baseline font-bold text-sm">
                <span>Total Payable:</span>
                <span className="text-emerald-400 font-black text-base">₹{finalFare.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setSelectedRide(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AUTH MODAL (LOGIN / SIGN UP) */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {authMode === 'login' ? 'Login to CampusPool' : 'Create Student Account'}
                </h3>
                <p className="text-xs text-slate-500">Only username and password required</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
              >
                {authLoading ? 'Connecting...' : authMode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>CampusPool — VESIT College Carpool Matching System</span>
          <span>Point A to Point B • ₹40 / Seat • 10% Student Subsidy</span>
        </div>
      </footer>
    </div>
  );
}

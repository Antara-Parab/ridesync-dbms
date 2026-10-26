'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, MapPin, Clock, Users, CheckCircle, 
  AlertCircle, Search, PlusCircle, Check, X, 
  ArrowRight, ShieldCheck, Tag, Sparkles, Phone,
  TrendingDown, CheckSquare, Square
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

export default function CampusPoolApp() {
  const [activeTab, setActiveTab] = useState<'find' | 'offer' | 'bookings'>('find');
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Search state
  const [searchSource, setSearchSource] = useState('');
  const [searchDest, setSearchDest] = useState('');

  // Booking Modal state
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [passengerName, setPassengerName] = useState('Ananya Iyer');
  const [passengerPhone, setPassengerPhone] = useState('9820445566');
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [applyStudentDiscount, setApplyStudentDiscount] = useState(true);

  // Offer Ride Form state
  const [newRideForm, setNewRideForm] = useState({
    driver_name: '',
    driver_phone: '',
    vehicle_model: '',
    vehicle_number: '',
    source: '',
    destination: 'VESIT Campus',
    departure_time: '08:15 AM',
    available_seats: 3,
    cost_per_seat: 40,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
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
    } finally {
      setLoading(false);
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

  // Student Books a Seat
  const handleConfirmBooking = async () => {
    if (!selectedRide) return;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: selectedRide.ride_id,
          passenger_name: passengerName,
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
    if (!newRideForm.driver_name || !newRideForm.source || !newRideForm.destination) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRideForm),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Your carpool ride has been posted! Students can now book seats.', 'success');
        setNewRideForm({
          driver_name: '',
          driver_phone: '',
          vehicle_model: '',
          vehicle_number: '',
          source: '',
          destination: 'VESIT Campus',
          departure_time: '08:15 AM',
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

      {/* Modern Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CampusPool</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  VESIT
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Student Carpool & Seat Sharing</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('find')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'find' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Ride</span>
            </button>
            <button
              onClick={() => setActiveTab('offer')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'offer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Offer Ride</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'bookings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>My Rides</span>
              {bookings.filter(b => b.booking_status === 'PENDING').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: FIND A RIDE (STUDENT PASSENGER) */}
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
                <p className="text-emerald-100 text-xs sm:text-sm mb-6">
                  Skip the crowded local train and auto queues. Travel comfortably in a student carpool and get 10% off with your college ID!
                </p>

                {/* Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">Pick-up Location</label>
                    <input
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
                  <div className="flex items-end">
                    <button
                      onClick={fetchRides}
                      className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center space-x-1.5 transition shadow"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Rides</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Available Student Rides</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {rides.length} active
                  </span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">Standard Fare: ₹40 / seat</span>
              </div>

              {rides.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No active carpools right now</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to offer a ride from the "Offer Ride" tab!</p>
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
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">VESIT</span>
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
                              <span>₹{(ride.cost_per_seat * 0.9).toFixed(0)} with Student ID</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Book Button */}
                      <button
                        onClick={() => {
                          setSelectedRide(ride);
                          setRequestedSeats(1);
                        }}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <span>Apply for Seat</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: OFFER A RIDE (STUDENT DRIVER) */}
        {/* ========================================================================= */}
        {activeTab === 'offer' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Offer Carpool Seats</h2>
                  <p className="text-xs text-slate-500">
                    Traveling to VESIT by car? Share your empty seats, help classmates, and share fuel costs!
                  </p>
                </div>
              </div>

              <form onSubmit={handleOfferRide} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      required
                      value={newRideForm.driver_name}
                      onChange={(e) => setNewRideForm({ ...newRideForm, driver_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Phone *</label>
                    <input
                      type="text"
                      placeholder="e.g. 9820112233"
                      required
                      value={newRideForm.driver_phone}
                      onChange={(e) => setNewRideForm({ ...newRideForm, driver_phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Car Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai i20 / Maruti Swift"
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
                      required
                      value={newRideForm.vehicle_number}
                      onChange={(e) => setNewRideForm({ ...newRideForm, vehicle_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pickup Location (Point A) *</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">Departure Time *</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:15 AM"
                      required
                      value={newRideForm.departure_time}
                      onChange={(e) => setNewRideForm({ ...newRideForm, departure_time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Seats Available *</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      required
                      value={newRideForm.available_seats}
                      onChange={(e) => setNewRideForm({ ...newRideForm, available_seats: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rent / Seat (₹) *</label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      required
                      value={newRideForm.cost_per_seat}
                      onChange={(e) => setNewRideForm({ ...newRideForm, cost_per_seat: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2"
                  >
                    <Car className="w-4 h-4" />
                    <span>Publish Carpool for ₹{newRideForm.cost_per_seat}/Seat</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY RIDES & DRIVER REQUESTS */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Driver Requests Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Incoming Student Ride Requests</h3>
                  <p className="text-xs text-slate-500">Review and accept booking requests from classmates</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {bookings.filter(b => b.booking_status === 'PENDING').length} pending
                </span>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No booking requests yet. When students apply for seats, they appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Passenger</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3">Seats</th>
                        <th className="py-2.5 px-3">Fare Breakdown</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bookings.map((b) => (
                        <tr key={b.booking_id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{b.passenger_name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{b.passenger_phone}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{b.source} ➔ {b.destination}</div>
                            <div className="text-[10px] text-slate-400">{b.departure_time}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900">{b.seats_requested}</span> seat(s)
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">₹{b.discounted_fare}</div>
                            {b.has_student_discount && (
                              <div className="text-[10px] text-emerald-600 flex items-center space-x-1 font-semibold">
                                <TrendingDown className="w-2.5 h-2.5" />
                                <span>10% Student Subsidy</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.booking_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                              b.booking_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {b.booking_status === 'ACCEPTED' ? 'Confirmed' :
                               b.booking_status === 'PENDING' ? 'Pending Approval' : 'Declined'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            {b.booking_status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleAcceptRequest(b.booking_id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold transition shadow-xs"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(b.booking_id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOOKING MODAL WITH CLEAR ARITHMETIC CALCULATOR */}
      {/* ========================================================================= */}
      {selectedRide && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Apply for Carpool Seat
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRide.source} ➔ {selectedRide.destination}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRide(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ride Details Summary */}
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
                <span className="text-slate-400">Seats Available:</span>
                <span className="font-bold text-emerald-600">{selectedRide.available_seats} remaining</span>
              </div>
            </div>

            {/* Input Controls */}
            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Mobile / WhatsApp</label>
                <input
                  type="text"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800"
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
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition ${
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

              {/* Student Subsidy Discount Checkbox */}
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
              <p className="text-[10px] text-slate-400 italic">
                * Arithmetic operation: Base Rent ({requestedSeats} × ₹{unitPrice}) - 10% student subsidy.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedRide(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                Confirm Booking
              </button>
            </div>
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

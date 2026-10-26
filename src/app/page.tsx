'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, MapPin, Calendar, Clock, Users, Shield, CheckCircle, 
  XCircle, AlertTriangle, RefreshCw, Database, Award, 
  ArrowRight, Search, PlusCircle, Check, X, FileText, Activity
} from 'lucide-react';

interface Ride {
  ride_id: number;
  driver_id: number;
  driver_name: string;
  driver_phone: string;
  vehicle_model: string;
  vehicle_number: string;
  source: string;
  destination: string;
  ride_date: string;
  departure_time: string;
  available_seats: number;
  cost_per_seat: number;
  status: string;
  confirmed_passengers?: number;
}

interface Booking {
  booking_id: number;
  ride_id: number;
  passenger_id: number;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  driver_id: number;
  driver_name: string;
  source: string;
  destination: string;
  departure_time: string;
  cost_per_seat: number;
  seats_requested: number;
  total_fare: number;
  discounted_student_fare: number;
  booking_status: string;
  booked_at: string;
}

interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  vehicle_count: number;
  rides_offered_count: number;
}

interface Vehicle {
  vehicle_id: number;
  owner_id: number;
  vehicle_number: string;
  model: string;
  capacity: number;
}

interface AuditLog {
  log_id: number;
  ride_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
  source: string;
  destination: string;
  driver_name: string;
}

interface DriverAnalytics {
  driver_id: number;
  driver_name: string;
  total_rides_offered: number;
  avg_seat_cost: number;
  completed_rides: number;
  active_rides: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'passenger' | 'driver' | 'viva'>('passenger');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message?: string; counts?: any }>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Users & Active Persona
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data lists
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<DriverAnalytics[]>([]);

  // Search filters
  const [searchSource, setSearchSource] = useState('');
  const [searchDest, setSearchDest] = useState('');

  // Modals
  const [bookingModalRide, setBookingModalRide] = useState<Ride | null>(null);
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [showOfferRideModal, setShowOfferRideModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [manifestData, setManifestData] = useState<any[]>([]);

  // Form states
  const [newRide, setNewRide] = useState({
    vehicle_id: '',
    source: 'Chembur',
    destination: 'VESIT Campus',
    ride_date: '2026-10-26',
    departure_time: '08:30:00',
    available_seats: 3,
    cost_per_seat: 45.00
  });

  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    model: '',
    capacity: 4
  });

  // Fetch initial health and data
  useEffect(() => {
    checkHealth();
    fetchUsers();
    fetchRides();
    fetchBookings();
    fetchAuditLogs();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchVehicles(currentUser.user_id);
    }
  }, [currentUser]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus({
        connected: data.connected,
        message: data.connected ? `Connected to ${data.database}` : data.error,
        counts: data.counts
      });
    } catch {
      setDbStatus({ connected: false, message: 'Could not connect to database' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && data.users.length > 0) {
        setUsers(data.users);
        if (!currentUser) {
          const defaultUser = data.users.find((u: User) => u.user_id === 4) || data.users[0];
          setCurrentUser(defaultUser);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRides = async () => {
    try {
      let url = '/api/rides?status=ACTIVE';
      if (searchSource) url += `&source=${encodeURIComponent(searchSource)}`;
      if (searchDest) url += `&destination=${encodeURIComponent(searchDest)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setRides(data.rides);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehicles = async (userId: number) => {
    try {
      const res = await fetch(`/api/vehicles?owner_id=${userId}`);
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success) setAuditLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  // Passenger: Book Ride
  const handleBookRide = async () => {
    if (!bookingModalRide || !currentUser) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: bookingModalRide.ride_id,
          passenger_id: currentUser.user_id,
          seats_requested: requestedSeats
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setBookingModalRide(null);
        fetchBookings();
      } else {
        if (data.trigger_violation) {
          showToast('error', `🚫 Trigger Violation Blocked: ${data.error}`);
        } else {
          showToast('error', data.error);
        }
      }
    } catch {
      showToast('error', 'Booking request failed');
    }
  };

  // Driver: Accept booking
  const handleAcceptBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', `✅ Stored Procedure: ${data.message}`);
        fetchBookings();
        fetchRides();
        fetchAuditLogs();
        fetchAnalytics();
      } else {
        if (data.overbooking_blocked) {
          showToast('error', `🛑 ACID Rollback: ${data.error}`);
        } else {
          showToast('error', data.error);
        }
      }
    } catch {
      showToast('error', 'Failed to process acceptance');
    }
  };

  // Driver: Reject booking
  const handleRejectBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Booking request rejected');
        fetchBookings();
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'Failed to reject booking');
    }
  };

  // Driver: Create Ride
  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: currentUser.user_id,
          vehicle_id: Number(newRide.vehicle_id),
          source: newRide.source,
          destination: newRide.destination,
          ride_date: newRide.ride_date,
          departure_time: newRide.departure_time,
          available_seats: Number(newRide.available_seats),
          cost_per_seat: Number(newRide.cost_per_seat)
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'New ride offered successfully!');
        setShowOfferRideModal(false);
        fetchRides();
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'Failed to offer ride');
    }
  };

  // Driver: Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: currentUser.user_id,
          vehicle_number: newVehicle.vehicle_number,
          model: newVehicle.model,
          capacity: Number(newVehicle.capacity)
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Vehicle registered successfully!');
        setShowAddVehicleModal(false);
        fetchVehicles(currentUser.user_id);
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'Failed to register vehicle');
    }
  };

  // Driver Manifest (Stored Procedure with Cursor)
  const handleViewManifest = async (driverId: number) => {
    try {
      const res = await fetch(`/api/driver/manifest?driver_id=${driverId}`);
      const data = await res.json();
      if (data.success) {
        setManifestData(data.manifest);
        setShowManifestModal(true);
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'Failed to fetch manifest report');
    }
  };

  // Viva: Database Reset
  const handleResetDatabase = async () => {
    if (!confirm('Run Step 0 Demo Reset to restore initial seats, bookings, and statuses?')) return;
    try {
      const res = await fetch('/api/viva/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        fetchRides();
        fetchBookings();
        fetchAuditLogs();
        fetchAnalytics();
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'Reset failed');
    }
  };

  // Viva: Cloud Database Schema Initialization
  const handleInitCloudDb = async () => {
    if (!confirm('Initialize tables, views, and seed data on current MySQL database?')) return;
    try {
      const res = await fetch('/api/viva/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Cloud DB successfully initialized with full schema & seed data!');
        checkHealth();
        fetchUsers();
        fetchRides();
        fetchBookings();
      } else {
        showToast('error', data.error);
      }
    } catch {
      showToast('error', 'Initialization failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">RideSync</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  VESIT DBMS
                </span>
              </div>
              <p className="text-xs text-slate-500">College Carpool Matching System</p>
            </div>
          </div>

          {/* Database & Persona Switcher */}
          <div className="flex items-center flex-wrap gap-3">
            {/* DB Health Pill */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              dbStatus.connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{dbStatus.connected ? 'MySQL 8.4 Connected' : 'DB Disconnected'}</span>
            </div>

            {/* Persona Switcher */}
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500 hidden sm:inline">Active User:</span>
              <select 
                value={currentUser?.user_id || ''} 
                onChange={(e) => {
                  const sel = users.find(u => u.user_id === Number(e.target.value));
                  if (sel) setCurrentUser(sel);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name} ({u.rides_offered_count > 0 ? 'Driver' : 'Student'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <nav className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab('passenger')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'passenger' 
                  ? 'border-emerald-600 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Find & Book Rides</span>
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'driver' 
                  ? 'border-emerald-600 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Driver Portal</span>
            </button>
            <button
              onClick={() => setActiveTab('viva')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'viva' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Viva & Examiner Demo</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-short">
          <div className={`p-4 rounded-xl shadow-xl border flex items-start space-x-3 ${
            notification.type === 'success' ? 'bg-emerald-900 text-emerald-50 border-emerald-700' :
            notification.type === 'error' ? 'bg-rose-900 text-rose-50 border-rose-700' :
            'bg-slate-900 text-slate-50 border-slate-700'
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {notification.type === 'info' && <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
            <div className="text-xs font-medium leading-relaxed">{notification.message}</div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* DB Offline Alert */}
        {!dbStatus.connected && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">MySQL Database Not Detected</p>
                <p className="text-xs text-amber-700">
                  Make sure MySQL is running locally on port 3306 or configure Cloud MySQL credentials in your environment variables.
                </p>
              </div>
            </div>
            <button 
              onClick={handleInitCloudDb}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition"
            >
              Seed / Init Database
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: PASSENGER PORTAL */}
        {/* ========================================================================= */}
        {activeTab === 'passenger' && (
          <div className="space-y-6">
            {/* Search Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Find a Ride to Campus</h2>
              <p className="text-emerald-100 text-xs sm:text-sm mb-4">
                Pool with fellow VESIT students. Save fuel, avoid train rush, and enjoy 10% student subsidy discount!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl">
                <div>
                  <label className="block text-[11px] font-medium text-emerald-200 uppercase mb-1">Pick-up Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Chembur, Dadar, Thane..."
                    value={searchSource}
                    onChange={(e) => setSearchSource(e.target.value)}
                    className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-emerald-200 uppercase mb-1">Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. VESIT Campus"
                    value={searchDest}
                    onChange={(e) => setSearchDest(e.target.value)}
                    className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchRides}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition shadow-md"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Active Rides</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Rides Grid */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <span>Available Carpools</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {rides.length}
                  </span>
                </h3>
                <span className="text-xs text-slate-500">From View: <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">vw_AvailableActiveRides</code></span>
              </div>

              {rides.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No active carpools found matching criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the filters or check the Viva tab to reset demo data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rides.map((ride) => (
                    <div key={ride.ride_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        {/* Route Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{ride.source}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-sm">{ride.destination}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ride.available_seats > 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ride.available_seats} {ride.available_seats === 1 ? 'seat left' : 'seats left'}
                          </span>
                        </div>

                        {/* Driver & Vehicle info */}
                        <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Driver:</span>
                            <span className="font-semibold text-slate-800">{ride.driver_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Vehicle:</span>
                            <span className="text-slate-700">{ride.vehicle_model} ({ride.vehicle_number})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Departure:</span>
                            <span className="font-medium text-slate-700 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{ride.departure_time}</span>
                            </span>
                          </div>
                        </div>

                        {/* Pricing details */}
                        <div className="flex items-baseline justify-between mb-4">
                          <div>
                            <span className="text-lg font-extrabold text-slate-900">₹{Number(ride.cost_per_seat).toFixed(0)}</span>
                            <span className="text-xs text-slate-500"> / seat</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Student: ₹{(Number(ride.cost_per_seat) * 0.9).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setBookingModalRide(ride);
                          setRequestedSeats(1);
                        }}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                      >
                        <span>Request Ride</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Bookings Section */}
            <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <span>Recent Ride Bookings & Requests</span>
                <span className="text-[10px] text-slate-500 font-normal">({bookings.length} records)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Passenger</th>
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Seats</th>
                      <th className="py-2.5 px-3">Fare (10% Off)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.booking_id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-medium">#{b.booking_id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{b.passenger_name}</td>
                        <td className="py-2.5 px-3">{b.source} ➔ {b.destination}</td>
                        <td className="py-2.5 px-3">{b.seats_requested}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">₹{Number(b.discounted_student_fare).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 line-through ml-1.5">₹{Number(b.total_fare).toFixed(2)}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.booking_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                            b.booking_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{b.booked_at ? b.booked_at.split(' ')[0] : 'Today'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DRIVER PORTAL */}
        {/* ========================================================================= */}
        {activeTab === 'driver' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Driver Management Dashboard</h2>
                <p className="text-xs text-slate-500">
                  Managing rides and passenger approvals as: <strong className="text-slate-800">{currentUser?.full_name}</strong>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  + Add Vehicle
                </button>
                <button
                  onClick={() => handleViewManifest(currentUser?.user_id || 1)}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ride Manifest (Cursor)</span>
                </button>
                <button
                  onClick={() => setShowOfferRideModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Offer New Ride</span>
                </button>
              </div>
            </div>

            {/* Pending Requests for this Driver */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <span>Passenger Booking Requests</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Demonstrating ACID Stored Procedure: <code className="text-emerald-700 font-mono">sp_AcceptBooking</code>)
                </span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Passenger</th>
                      <th className="py-2.5 px-3">Ride Route</th>
                      <th className="py-2.5 px-3">Seats Req.</th>
                      <th className="py-2.5 px-3">Available Seats</th>
                      <th className="py-2.5 px-3">Current Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.booking_id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-medium">#{b.booking_id}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{b.passenger_name}</div>
                          <div className="text-[10px] text-slate-400">{b.passenger_phone}</div>
                        </td>
                        <td className="py-2.5 px-3">{b.source} ➔ {b.destination}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{b.seats_requested}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">
                          {rides.find(r => r.ride_id === b.ride_id)?.available_seats ?? '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.booking_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                            b.booking_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          {b.booking_status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleAcceptBooking(b.booking_id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition"
                                title="Executes stored procedure sp_AcceptBooking with row lock"
                              >
                                Accept (ACID)
                              </button>
                              <button
                                onClick={() => handleRejectBooking(b.booking_id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-medium transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicles Owned by User */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Registered Vehicles ({vehicles.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {vehicles.map(v => (
                  <div key={v.vehicle_id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="font-bold text-xs text-slate-900">{v.model}</p>
                    <p className="text-[11px] font-mono text-slate-500">{v.vehicle_number}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Capacity: {v.capacity} persons</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VIVA DEMO & EXAMINER PANEL */}
        {/* ========================================================================= */}
        {activeTab === 'viva' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <Award className="w-6 h-6 text-amber-400" />
                    <span>Viva Demonstration Master Dashboard</span>
                  </h2>
                  <p className="text-slate-300 text-xs mt-1">
                    Live verification of Constraints, Triggers, Views, Functions, Stored Procedures, and ACID Transactions.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetDatabase}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Step 0: Fresh Demo Reset</span>
                  </button>
                  <button
                    onClick={handleInitCloudDb}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Init Schema
                  </button>
                </div>
              </div>
            </div>

            {/* Test Cards for Examiner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Test 1: Self-Booking Trigger Test */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Trigger Test: Section 6.4
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">trg_prevent_self_booking</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">Driver Self-Booking Prevention</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Demonstrate MySQL trigger integrity rule: Aarav Sharma (Driver ID 1) attempts to book a seat on his own Ride #1.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/bookings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ride_id: 1, passenger_id: 1, seats_requested: 1 })
                    });
                    const data = await res.json();
                    if (!data.success && data.trigger_violation) {
                      showToast('error', `✅ TRIGGER FIRED AS EXPECTED: ${data.error}`);
                    } else {
                      showToast('info', data.message || 'Trigger test result');
                    }
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                >
                  ⚡ Trigger Self-Booking (Expect SQLSTATE 45000)
                </button>
              </div>

              {/* Test 2: ACID Overbooking Prevention Test */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      ACID Test: Test T07 & T08
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">sp_AcceptBooking FOR UPDATE</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">Overbooking Concurrency Rollback</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Booking #2 requests 2 seats on Ride #1 (which has only 1 seat left). Accepts and verifies automatic ROLLBACK.
                  </p>
                </div>
                <button
                  onClick={() => handleAcceptBooking(2)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition"
                >
                  ⚡ Attempt Overbooking #2 (Expect Rollback)
                </button>
              </div>
            </div>

            {/* Real-time Audit Trail (Ride_Logs) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Audit Trail: <code className="text-slate-900 font-mono text-xs">Ride_Logs</code> Table</span>
                </h3>
                <span className="text-xs text-slate-500">Trigger: <code className="text-indigo-600 font-mono">trg_ride_status_audit</code></span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Log ID</th>
                      <th className="py-2 px-3">Ride ID</th>
                      <th className="py-2 px-3">Route</th>
                      <th className="py-2 px-3">Old Status</th>
                      <th className="py-2 px-3">New Status</th>
                      <th className="py-2 px-3">Audit Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-slate-400">No logs captured yet</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold">#{log.log_id}</td>
                          <td className="py-2 px-3">Ride #{log.ride_id}</td>
                          <td className="py-2 px-3 font-sans">{log.source} ➔ {log.destination}</td>
                          <td className="py-2 px-3 text-slate-500">{log.old_status}</td>
                          <td className="py-2 px-3 font-bold text-emerald-600">{log.new_status}</td>
                          <td className="py-2 px-3 text-slate-400 font-sans">{log.changed_at}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics View (vw_DriverAnalytics) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <span>Driver Analytics SQL View: <code className="text-slate-900 font-mono text-xs">vw_DriverAnalytics</code></span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {analytics.map(a => (
                  <div key={a.driver_id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-xs text-slate-900">{a.driver_name}</p>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Offered:</span>
                        <span className="font-semibold">{a.total_rides_offered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Seat Cost:</span>
                        <span className="font-semibold text-emerald-700">₹{Number(a.avg_seat_cost).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-semibold">{a.completed_rides}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: BOOK RIDE MODAL */}
      {/* ========================================================================= */}
      {bookingModalRide && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Ride Request</h3>
                <p className="text-xs text-slate-500">{bookingModalRide.source} ➔ {bookingModalRide.destination}</p>
              </div>
              <button 
                onClick={() => setBookingModalRide(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver:</span>
                  <span className="font-semibold">{bookingModalRide.driver_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure:</span>
                  <span className="font-semibold">{bookingModalRide.departure_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Seats:</span>
                  <span className="font-bold text-emerald-600">{bookingModalRide.available_seats}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seats to Book</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={requestedSeats}
                  onChange={(e) => setRequestedSeats(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Stored Function Display */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs">
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Regular Fare:</span>
                  <span>₹{(requestedSeats * bookingModalRide.cost_per_seat).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 text-sm">
                  <span>VESIT Student Fare (10% Subsidy):</span>
                  <span>₹{(requestedSeats * bookingModalRide.cost_per_seat * 0.9).toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-emerald-700 mt-1 italic">
                  * Calculated with stored function fn_CalculateFareWithDiscount()
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setBookingModalRide(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookRide}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md"
                >
                  Submit Booking Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OFFER RIDE MODAL */}
      {/* ========================================================================= */}
      {showOfferRideModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Offer a New Carpool Ride</h3>
                <p className="text-xs text-slate-500">Insert into Rides table</p>
              </div>
              <button onClick={() => setShowOfferRideModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRide} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Registered Vehicle</label>
                <select
                  required
                  value={newRide.vehicle_id}
                  onChange={(e) => setNewRide({ ...newRide, vehicle_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.model} ({v.vehicle_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origin / Pickup</label>
                  <input
                    type="text"
                    required
                    value={newRide.source}
                    onChange={(e) => setNewRide({ ...newRide, source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={newRide.destination}
                    onChange={(e) => setNewRide({ ...newRide, destination: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ride Date</label>
                  <input
                    type="date"
                    required
                    value={newRide.ride_date}
                    onChange={(e) => setNewRide({ ...newRide, ride_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={newRide.departure_time}
                    onChange={(e) => setNewRide({ ...newRide, departure_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Available Seats</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={newRide.available_seats}
                    onChange={(e) => setNewRide({ ...newRide, available_seats: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fare Per Seat (₹)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    required
                    value={newRide.cost_per_seat}
                    onChange={(e) => setNewRide({ ...newRide, cost_per_seat: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOfferRideModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Publish Ride
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD VEHICLE MODAL */}
      {/* ========================================================================= */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register Vehicle</h3>
                <p className="text-xs text-slate-500">Insert into Vehicles table</p>
              </div>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH-01-XX-1234"
                  required
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Make & Model</label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Swift / Hyundai i20"
                  required
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Passenger Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  required
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DRIVER MANIFEST MODAL (CURSOR DEMO) */}
      {/* ========================================================================= */}
      {showManifestModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Driver Ride Manifest</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">Procedure: sp_DriverRideReport (Cursor demo)</p>
              </div>
              <button onClick={() => setShowManifestModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Ride ID</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Seats Left</th>
                    <th className="py-2 px-3">Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {manifestData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-400">No rides offered by this driver</td>
                    </tr>
                  ) : (
                    manifestData.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold">#{m.ride_id}</td>
                        <td className="py-2 px-3">{m.route}</td>
                        <td className="py-2 px-3">{m.seats_left}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-700">₹{Number(m.seat_fare).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowManifestModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Close Manifest
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>RideSync — VESIT College Carpool Matching System (DBMS 2026-27)</span>
          <span className="font-mono text-[11px]">MySQL 8.4 • Next.js • Vercel Ready</span>
        </div>
      </footer>
    </div>
  );
}

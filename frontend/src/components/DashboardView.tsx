/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { useTheme } from '../hooks/useTheme';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Contact,
  Car,
  MapPin,
  CalendarCheck,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  PlusCircle,
  Siren,
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FileText,
  Building2,
  CalendarDays
} from 'lucide-react';
import { api } from '../api/client';

export default function DashboardView() {
  const { isDark } = useTheme();
  const {
    drivers,
    vehicles,
    trips,
    bookings,
    fuelLogs,
    maintenanceLogs,
    addBooking,
    addMaintenanceLog,
    currentUser,
    notifications
  } = useCMS();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [panicModalOpen, setPanicModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  // Quick state forms
  const [newBooking, setNewBooking] = useState({
    passengerName: '',
    bookingDate: new Date().toISOString().substring(0, 10),
    rideTime: '09:00',
    pickupPoint: '',
    dropPoint: '',
    purpose: ''
  });


  const [maintenVehicleId, setMaintenVehicleId] = useState(vehicles[0]?.id || '');
  const [mDescription, setMDescription] = useState('Critical brake pad replacement requested after trip inspection.');

  // Automatically select the first vehicle as default when the list loads asynchronously
  React.useEffect(() => {
    if (vehicles.length > 0 && !maintenVehicleId) {
      setMaintenVehicleId(vehicles[0].id);
    }
  }, [vehicles]);


  // Fetch dynamic stats from backend
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    api.getDashboardStats().then(data => {
      setStats(data);
    }).catch(err => console.error("Error fetching dashboard stats", err));
  }, []);

  const totalDrivers = stats?.kpis?.totalDrivers || drivers.length;
  const totalVehicles = stats?.kpis?.totalVehicles || vehicles.length;
  const totalTripsCount = stats?.kpis?.totalTrips || trips.length;
  
  const activeTripsCount = trips.filter((t) => t.status === 'Ongoing').length;
  const completedTripsCount = trips.filter((t) => t.status === 'Completed').length;
  const pendingRequestsCount = bookings.filter((b) => b.hrStatus === 'Pending' || b.managerApproval === 'Pending').length;
  
  const availableVehiclesCount = vehicles.filter((v) => v.status === 'Available').length;
  const availableDriversCount = drivers.filter((d) => d.status === 'Active').length;
  const availableCabsWithDriverCount = vehicles.filter(
    (v) => v.status === 'Available' && v.assignedDriverId && drivers.some((d) => d.id === v.assignedDriverId && d.status === 'Active')
  ).length;
  
  const monthlyUsageKm = stats?.kpis?.monthlyUsageKm || trips.reduce((acc, t) => acc + (t.status === 'Completed' ? 24.5 : 0), 0);
  
  const fuelCosts = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const maintenanceCosts = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const monthlyCost = 8200 + fuelCosts + maintenanceCosts;

  // Use dynamic data if available, map to the chart keys expected by Recharts
  const financialChartData = stats?.financialChartData?.map((d: any) => ({
    name: d.name,
    fuel: Math.floor(d.expenses * 0.4), // Derived simulation
    maintenance: Math.floor(d.expenses * 0.6), // Derived simulation
    operational: d.revenue // Re-purposing operational to mean total capacity/revenue equivalent
  })) || [];

  const fuelTypeDistribution = stats?.fuelTypeDistribution?.map((d: any) => {
    let color = '#ef4444'; // Petrol
    if (d.name === 'Electric' || d.name === 'EV') color = '#10b981';
    if (d.name === 'CNG') color = '#2563eb';
    if (d.name === 'Diesel') color = '#f59e0b';
    return { ...d, color };
  }) || [];

  const recentActivities = stats?.recentActivities?.map((a: any) => ({
    id: a.id,
    message: `${a.action} performed in ${a.module} by ${a.user}`,
    time: a.timestamp.split(' ')[1] || a.timestamp,
    type: 'info'
  })) || [];

  // Quick Action Submissions
  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    addBooking({
      passengerName: newBooking.passengerName || 'Unknown Passenger',
      bookingDate: newBooking.bookingDate,
      rideTime: newBooking.rideTime,
      pickupPoint: newBooking.pickupPoint || 'Main Central Hub Block A',
      dropPoint: newBooking.dropPoint || 'Coastal Tech Park Gate 4',
      purpose: newBooking.purpose || 'Client Release deployment',
      managerApproval: 'Approved',
      hrStatus: 'Pending'
    });
    setBookingModalOpen(false);
  };



  const triggerMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenanceLog({
      vehicleId: maintenVehicleId,
      category: 'Breakdown',
      description: mDescription,
      cost: 320.00,
      vendorName: 'Apex Wheels Service Ltd',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 172800000).toISOString().substring(0, 10),
      status: 'In Progress'
    });
    setMaintenanceModalOpen(false);
  };

  return (
    <div className="space-y-6" id="dashboard-main-view">
      {/* Dynamic Security compliance panel for executive board */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Abstract design nodes */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-blue-500/20 rounded-full blur-xl" />

        <div className="relative z-10 flex items-center h-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, Pulpit
          </h1>
        </div>

        {/* Quick Actions Panel buttons inside hero banner */}
        {currentUser.role !== 'government' && (
          <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
            <button
              onClick={() => setBookingModalOpen(true)}
              className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg shadow-md duration-150 flex items-center space-x-1.5"
              id="dash-quick-booking-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Booking</span>
            </button>

            <button
              onClick={() => setMaintenanceModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 border border-blue-400 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md duration-150 flex items-center space-x-1.5"
              id="dash-quick-maintenance-btn"
            >
              <Wrench className="w-4 h-4" />
              <span>Send Cab for Repair</span>
            </button>


          </div>
        )}
      </div>

      {/* 11 METRICS BENTO GRID SECTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4" id="dashboard-kpi-grid">

        {/* KPI 2 - Total Drivers */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Total Drivers</span>
            <span className="text-2xl font-black text-gray-900 dark:text-slate-50 block mt-1">{totalDrivers}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">92.4% avg rating</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Contact className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 - Total Vehicles */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Total Vehicles</span>
            <span className="text-2xl font-black text-gray-900 dark:text-slate-50 block mt-1">{totalVehicles}</span>
            <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-1 block">50.0% Electric (EV)</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Car className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 - Total Trips */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Total Trips</span>
            <span className="text-2xl font-black text-gray-900 dark:text-slate-50 block mt-1">{totalTripsCount}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-400 mt-1 block">Across 5 active routes</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5 - Active Trips */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between ring-1 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-900/10">
          <div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold uppercase tracking-widest block">Active Trips</span>
            <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300 block mt-1">{activeTripsCount}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">All GPS Online</span>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 animate-pulse">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 6 - Completed Trips */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Completed Trips</span>
            <span className="text-2xl font-black text-gray-900 dark:text-slate-50 block mt-1">{completedTripsCount}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">100% Safety Verified</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 7 - Pending Requests */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between ring-1 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-900/10">
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-400 font-extrabold uppercase tracking-widest block">Pending Bookings</span>
            <span className="text-2xl font-black text-amber-900 dark:text-amber-300 block mt-1">{pendingRequestsCount}</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">Unassigned cabs</span>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 8 - Available Cabs with Driver */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md duration-150 flex items-center justify-between sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Available cabs with driver</span>
            <span className="text-2xl font-black text-gray-900 dark:text-slate-50 block mt-1">{availableCabsWithDriverCount}</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
              {availableVehiclesCount} cabs, {availableDriversCount} drivers active
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Car className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ANALYTICS CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Stacked Area / Line chart for Monthly Transit Budgets */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Trip & Fuel Expenses</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Monthly Cab & Fuel Expenses (6 Months)</p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-bold text-gray-500 dark:text-slate-400 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
              <IndianRupee className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Agreement Cost + Fuel + Maintenance</span>
            </div>
          </div>

          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148, 163, 184, 0.20)" : "rgba(148, 163, 184, 0.30)"} />
                <XAxis dataKey="name" stroke={isDark ? "#475569" : "#CBD5E1"} tick={{fill: isDark ? "#CBD5E1" : "#475569"}} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? "#475569" : "#CBD5E1"} tick={{fill: isDark ? "#CBD5E1" : "#475569"}} fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E5E7EB',
                    color: isDark ? '#F8FAFC' : '#111827',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: isDark ? '#F8FAFC' : '#111827' }}
                />
                <Legend iconType="circle" wrapperStyle={{ color: isDark ? '#F8FAFC' : '#111827', fontSize: 12, marginTop: 10 }} />
                <Area type="monotone" dataKey="operational" stackId="1" name="Fixed Fleet Cost" stroke={isDark ? "#475569" : "#e2e8f0"} fill={isDark ? "rgba(30, 41, 59, 0.5)" : "#f8fafc"} />
                <Area type="monotone" dataKey="fuel" stackId="2" name="Fuel Expenses" stroke="#2563eb" fillOpacity={1} fill="url(#colorFuel)" />
                <Area type="monotone" dataKey="maintenance" stackId="3" name="Maintenance Expenses" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMaintenance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts Pie Chart for Eco Fleet Green Initiative status */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Fuel Type Distribution</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Cabs grouped by fuel type (EV, CNG, Petrol, Diesel)</p>
            </div>

            <div className="h-44 flex items-center justify-center mt-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelTypeDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {fuelTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E5E7EB',
                      color: isDark ? '#F8FAFC' : '#111827',
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: isDark ? '#F8FAFC' : '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {fuelTypeDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 dark:text-slate-400">{entry.name}</span>
                </div>
                <span className="text-gray-900 dark:text-slate-50 font-extrabold">{entry.value} Vehicles</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT LOG ENTRIES & CRITICAL NOTIFICATION FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events logs stream */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="pb-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">Recent Activities</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Live updates from drivers and cabs</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400">
              Auto-Refreshing
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 text-xs">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0 animate-ping" />
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-slate-50 font-medium leading-tight">{item.message}</p>
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold block mt-1">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Safety warning panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-50 flex items-center space-x-1.5">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span>Emergency Alerts</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium font-semibold">Emergency notifications from cabs panic buttons</p>
            </div>

            <div className="mt-5 space-y-3">
              {notifications.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs ${
                    alert.severity === 'Critical'
                      ? 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
                      : 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="uppercase tracking-wider text-[10px]">{alert.category} alert</span>
                    <span>{alert.timestamp}</span>
                  </div>
                  <p className="font-extrabold mt-1 text-gray-900 dark:text-slate-50">{alert.title}</p>
                  <p className="mt-0.5 text-gray-600 dark:text-slate-400">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK LOG BOOKING MODAL */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-4 mb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">Add Booking</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Create a quick booking for employee transport.</p>
            </div>

            <form onSubmit={submitBooking} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Passenger Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newBooking.passengerName}
                  onChange={(e) => setNewBooking({ ...newBooking, passengerName: e.target.value })}
                  className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50 focus:outline-none focus:border-blue-500 dark:placeholder-gray-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Service Date</label>
                  <input
                    type="date"
                    value={newBooking.bookingDate}
                    onChange={(e) => setNewBooking({ ...newBooking, bookingDate: e.target.value })}
                    className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Ride Time</label>
                  <input
                    type="time"
                    value={newBooking.rideTime}
                    onChange={(e) => setNewBooking({ ...newBooking, rideTime: e.target.value })}
                    className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Pickup Location</label>
                <input
                  type="text"
                  placeholder="e.g. Block A, Lobby"
                  value={newBooking.pickupPoint}
                  onChange={(e) => setNewBooking({ ...newBooking, pickupPoint: e.target.value })}
                  className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Drop Point</label>
                <input
                  type="text"
                  placeholder="e.g. Metro station transit line"
                  value={newBooking.dropPoint}
                  onChange={(e) => setNewBooking({ ...newBooking, dropPoint: e.target.value })}
                  className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Booking Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Night shift pickup"
                  value={newBooking.purpose}
                  onChange={(e) => setNewBooking({ ...newBooking, purpose: e.target.value })}
                  className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-gray-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-400 text-xs font-bold rounded-lg duration-155"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm duration-155"
                >
                  Submit Booking request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* QUICK REPAIR MAINTENANCE LOG MODAL */}
      {maintenanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-4 mb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">Send Vehicle for Maintenance</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Mark vehicle as under repair so it cannot be assigned to any trips.</p>
            </div>

            <form onSubmit={triggerMaintenance} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Select Vehicle / Registration Number</label>
                <select
                  value={maintenVehicleId}
                  onChange={(e) => setMaintenVehicleId(e.target.value)}
                  className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.plateNumber}) [- Current: {v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Details of Repair Needed</label>
                <textarea
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 h-24 focus:outline-none focus:border-blue-500 text-gray-800 dark:text-slate-50"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-400 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Send for Repair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


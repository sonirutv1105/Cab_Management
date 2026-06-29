/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { Booking } from '../types';
import { api } from '../api/client';
import {
  Search,
  Filter,
  Download,
  Check,
  X,
  Truck,
  Ticket,
  Calendar,
  Clock,
  ArrowUpDown
} from 'lucide-react';

export default function BookingManagementView() {
  const {
    bookings,
    trips,
    drivers,
    vehicles,
    approveBooking,
    allocateBookingToTrip,
    deleteBooking,
    currentUser
  } = useCMS();

  // Search/Filters/Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [managerFilter, setManagerFilter] = useState('ALL');
  const [hrFilter, setHrFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<keyof Booking>('bookingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Allocation modal
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [targetTripId, setTargetTripId] = useState('');

  const isReadOnly = currentUser.role === 'government';
  const isHR = currentUser.role === 'company_hr' || currentUser.role === 'super_admin';

  const handleSort = (field: keyof Booking) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportMenuOpen(false);
    
    const payload = {
      title: "Booking Management Data",
      headers: ["Booking ID", "Employee Name", "Date", "Time", "Pickup", "Dropoff", "Purpose", "Manager Approval", "HR Review", "Assigned Trip"],
      rows: processedBookings.map((b) => [
        b.id,
        b.passengerName,
        b.bookingDate,
        b.rideTime,
        b.pickupPoint,
        b.dropPoint,
        b.purpose,
        b.managerApproval,
        b.hrStatus,
        b.tripId || ''
      ])
    };

    try {
      let blob;
      let filename = `Booking_Requests_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      if (format === 'pdf') {
        blob = await api.exportToPdf(payload);
      } else {
        blob = await api.exportToExcel(payload);
      }
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export data.");
    }
  };

  const triggerAllocationModal = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    // Find first active scheduled trip to pre-populate
    const availableTrips = trips.filter((t) => t.status === 'Scheduled' || t.status === 'Ongoing');
    setTargetTripId(availableTrips[0]?.id || '');
    setAllocateModalOpen(true);
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookingId && targetTripId) {
      allocateBookingToTrip(selectedBookingId, targetTripId);
    }
    setAllocateModalOpen(false);
    setSelectedBookingId(null);
  };

  const processedBookings = bookings
    .filter((b) => {
      const matchesSearch =
        (b.passengerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.pickupPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.dropPoint.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesManager = managerFilter === 'ALL' || b.managerApproval === managerFilter;
      const matchesHR = hrFilter === 'ALL' || b.hrStatus === hrFilter;

      return matchesSearch && matchesManager && matchesHR;
    })
    .sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-6" id="booking-management-panel">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Ticket className="w-5.5 h-5.5 text-blue-600" />
            <span>Booking Requests</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Verify booking requests, approve requests, and assign employees to trips.</p>
        </div>

        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-2 shadow-sm self-start"
          >
            <Download className="w-4 h-4" />
            <span>Export Bookings</span>
          </button>
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Export PDF
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Export Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTERS COLUMN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by employee name, pickup..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
            id="bookings-search-input"
          />
        </div>

        {/* Manager Approval Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300"
            id="bookings-manager-filter"
          >
            <option value="ALL">All Approvals</option>
            <option value="Approved">Approved Only</option>
            <option value="Pending">Pending Approvals</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* HR Review Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <select
            value={hrFilter}
            onChange={(e) => setHrFilter(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300"
            id="bookings-hr-filter"
          >
            <option value="ALL">All HR Assignment States</option>
            <option value="Pending">Pending Assignment</option>
            <option value="Approved">Approved (No Ride Assigned)</option>
            <option value="Allocated">Cab Assigned</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* DATA VIEW TABLE */}
      <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <th className="p-3.5">Booking ID</th>
              <th className="p-3.5">Employee Name</th>
              <th className="p-3.5">Date & Time</th>
              <th className="p-3.5">Route (Pickup ➔ Drop)</th>
              <th className="p-3.5">Purpose of Travel</th>
              <th className="p-3.5 text-center">Manager Status</th>
              <th className="p-3.5 text-center">HR Assignment</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-700 dark:text-gray-300">
            {processedBookings.map((b) => {
              const linkedTrip = b.tripId ? trips.find((t) => t.id === b.tripId) : null;

              return (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/60 duration-150">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-gray-950 uppercase tracking-tight">{b.id}</span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-gray-950">{b.passengerName}</div>
                  </td>
                  <td className="p-3.5 leading-normal">
                    <div className="flex items-center space-x-1 font-bold text-gray-800 dark:text-gray-200">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <span>{b.bookingDate}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 font-semibold text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{b.rideTime} hrs</span>
                    </div>
                  </td>
                  <td className="p-3.5 space-y-0.5">
                    <div className="text-gray-900 dark:text-gray-100 font-semibold">Pickup: {b.pickupPoint}</div>
                    <div className="text-gray-500 dark:text-gray-400">Drop: {b.dropPoint}</div>
                  </td>
                  <td className="p-3.5 max-w-xs truncate italic text-gray-500 dark:text-gray-400" title={b.purpose}>
                    {b.purpose}
                  </td>
                  <td className="p-3.5 text-center">
                    {b.managerApproval === 'Approved' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400">
                        Approved
                      </span>
                    ) : b.managerApproval === 'Rejected' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400">
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 animate-pulse">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center leading-normal">
                    {b.hrStatus === 'Allocated' ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Cab Assigned
                        </span>
                        <div className="text-[10px] font-mono text-blue-600 font-bold">Trip: {b.tripId}</div>
                      </div>
                    ) : b.hrStatus === 'Approved' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        Approved (Unassigned)
                      </span>
                    ) : b.hrStatus === 'Rejected' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400">
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 animate-pulse">
                        Pending HR
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {/* HR Review approvals control buttons */}
                    {!isReadOnly && (
                      <div className="flex items-center justify-end space-x-1.5" id={`actions-${b.id}`}>
                        {/* If HR, show approve / reject buttons */}
                        {isHR && b.hrStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => approveBooking(b.id, 'hr', 'Approved')}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/40 rounded duration-150"
                              title="Approve request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => approveBooking(b.id, 'hr', 'Rejected')}
                              className="p-1 text-red-600 hover:bg-red-100 dark:bg-red-900/40 rounded duration-150"
                              title="Reject request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Allocate seat trigger */}
                        {isHR && b.hrStatus === 'Approved' && (
                          <button
                            onClick={() => triggerAllocationModal(b.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg flex items-center space-x-1 duration-150"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Assign Cab</span>
                          </button>
                        )}

                        {/* Cancel request */}
                        <button
                          onClick={() => {
                            if (confirm(`Cancel and erase booking request ${b.id}?`)) {
                              deleteBooking(b.id);
                            }
                          }}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 rounded hover:bg-gray-50 dark:bg-gray-700"
                          title="Purge billing"
                        >
                          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {processedBookings.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  No booking requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* HR ALLOCATE SEAT DIALOG */}
      {allocateModalOpen && selectedBookingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Assign Employee to a Trip</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Select an ongoing or scheduled trip to assign this booking.</p>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Select Live or Scheduled Trip</label>
                <select
                  value={targetTripId}
                  onChange={(e) => setTargetTripId(e.target.value)}
                  className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  required
                >
                  <option value="">-- Select a Trip --</option>
                  {trips
                    .filter((t) => t.status === 'Scheduled' || t.status === 'Ongoing')
                    .map((t) => {
                      const driver = drivers.find((d) => d.id === t.driverId);
                      const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                      return (
                        <option key={t.id} value={t.id}>
                          Trip {t.id} (Driver: {driver?.name || 'Unknown'}) (Vehicle: {vehicle?.plateNumber || 'EV'})
                        </option>
                      );
                    })}
                </select>
              </div>

              {trips.filter((t) => t.status === 'Scheduled' || t.status === 'Ongoing').length === 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 text-red-800 dark:text-red-400 rounded-lg text-xs leading-normal">
                  ⚠️ No active scheduled or ongoing trips found. Please schedule a trip in the "Trip Management" tab first.
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setAllocateModalOpen(false);
                    setSelectedBookingId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  disabled={!targetTripId}
                >
                  Assign to Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { Trip } from '../types';
import { api } from '../api/client';
import {
  Search,
  Filter,
  Download,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CalendarDays,
  ArrowUpDown,
  History,
  Trash2
} from 'lucide-react';

export default function TripManagementView() {
  const {
    trips,
    drivers,
    vehicles,
    vendors,
    addTrip,
    updateTrip,
    deleteTrip,
    currentUser
  } = useCMS();

  // Search/Filters/Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<keyof Trip>('startTime');
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

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formState, setFormState] = useState<Omit<Trip, 'id'>>({
    driverId: drivers.length > 0 ? drivers[0].id : undefined,
    vehicleId: vehicles.length > 0 ? vehicles[0].id : undefined,
    startTime: new Date().toISOString().substring(0, 16),
    status: 'Scheduled',
    safetyVerified: true,
    vendorId: vendors[0]?.id || 'vnd_1'
  });

  const isReadOnly = currentUser.role === 'government';

  const handleSort = (field: keyof Trip) => {
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
      title: "Trip Management Data",
      headers: ["Trip ID", "Driver", "Vehicle Plate", "Start Time", "End Time", "Status", "Safety Verified"],
      rows: processedTrips.map(t => {
        const driver = drivers.find((d) => d.id === t.driverId);
        const vehicle = vehicles.find((v) => v.id === t.vehicleId);
        return [
          t.id,
          driver?.name || 'Generic',
          vehicle?.plateNumber || 'EV',
          t.startTime,
          t.endTime || '',
          t.status,
          t.safetyVerified ? "Yes" : "No"
        ];
      })
    };

    try {
      let blob;
      let filename = `Trip_Logsheets_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    addTrip(formState);
    setModalOpen(false);
    // Reset passenger selections
    setFormState({
      ...formState,
      startTime: new Date().toISOString().substring(0, 16)
    });
  };

  const handleStatusChange = (trip: Trip, newStatus: Trip['status']) => {
    if (isReadOnly) return;
    updateTrip({
      ...trip,
      status: newStatus,
      endTime: newStatus === 'Completed' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined
    });
  };

  const processedTrips = trips
    .filter((t) => {
      const driver = drivers.find((d) => d.id === t.driverId);

      const matchesSearch =
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-6" id="trip-management-panel">
      {/* Header sections */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <History className="w-5.5 h-5.5 text-blue-600" />
            <span>Trips List</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Schedule trips, start trips, track status, and verify safety protocols</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Trips</span>
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

          {!isReadOnly && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold duration-150 flex items-center space-x-1.5 shadow-sm"
              id="add-trip-trigger-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Trip</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROL BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by trip code, driver name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
            id="trip-search-input"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300 focus:outline-none"
            id="trip-status-filter"
          >
            <option value="ALL">All Trip Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

      </div>

      {/* TRIP LOGS DATA TABLE */}
      <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700" onClick={() => handleSort('id')}>
                <div className="flex items-center space-x-1">
                  <span>Trip Code</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="p-3.5">Driver</th>
              <th className="p-3.5">Vehicle & Vendor</th>
              <th className="p-3.5">Trip Timings</th>
              <th className="p-3.5 text-center">Safety Verification</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-700 dark:text-gray-300">
            {processedTrips.map((t) => {
              const driver = drivers.find((d) => d.id === t.driverId);
              const vehicle = vehicles.find((v) => v.id === t.vehicleId);
              return (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/60 duration-150">
                  <td className="p-3.5 font-mono font-bold text-gray-900 dark:text-gray-100">{t.id}</td>
                  <td className="p-3.5 text-gray-950 font-bold">{driver?.name || 'Unknown'}</td>
                  <td className="p-3.5 leading-tight">
                    <div className="font-mono text-gray-900 dark:text-gray-100 font-bold">{vehicle?.plateNumber}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{vehicle?.make} {vehicle?.model}</div>
                  </td>
                  <td className="p-3.5 leading-tight">
                    <div>Start: <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                    {t.endTime && <div className="text-[10px] text-gray-400 dark:text-gray-500">End: {t.endTime}</div>}
                  </td>
                  <td className="p-3.5 text-center">
                    {t.safetyVerified ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 dark:bg-green-900/30 text-green-700 border border-green-100">
                        GPS Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 border border-yellow-100">
                        Unchecked
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {t.status === 'Scheduled' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 font-bold">
                        Scheduled
                      </span>
                    ) : t.status === 'Ongoing' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 font-bold animate-pulse">
                        Ongoing
                      </span>
                    ) : t.status === 'Completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 font-bold">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold">
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {!isReadOnly && (
                      <div className="flex items-center justify-end space-x-1">
                        {t.status === 'Scheduled' && (
                          <button
                            onClick={() => handleStatusChange(t, 'Ongoing')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg flex items-center space-x-1 duration-150 shadow-sm"
                            title="Start Trip"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start Trip</span>
                          </button>
                        )}
                        {t.status === 'Ongoing' && (
                          <button
                            onClick={() => handleStatusChange(t, 'Completed')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg flex items-center space-x-1 duration-150 shadow-sm"
                            title="End Trip"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>End Trip</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Cancel Trip ID: ${t.id} ?`)) {
                              deleteTrip(t.id);
                            }
                          }}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:bg-gray-700 rounded"
                          title="Erase log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {processedTrips.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  No scheduled trips found matching filter parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TRIP CREATION DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Schedule New Trip</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Assign driver, cab, shift, and vendor details to a new trip.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Assign Driver</label>
                  <select
                    value={formState.driverId}
                    onChange={(e) => setFormState({ ...formState, driverId: e.target.value })}
                    className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    required
                  >
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} (License: {drv.licenseNumber}) [- {drv.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Assign Cab / Vehicle</label>
                  <select
                    value={formState.vehicleId}
                    onChange={(e) => setFormState({ ...formState, vehicleId: e.target.value })}
                    className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    required
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} ({v.make} {v.model}) [- {v.status}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Vendor</label>
                  <select
                    value={formState.vendorId}
                    onChange={(e) => setFormState({ ...formState, vendorId: e.target.value })}
                    className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    required
                  >
                    {vendors.map((vnd) => (
                      <option key={vnd.id} value={vnd.id}>
                        {vnd.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formState.startTime}
                    onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                    className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    required
                  />
                </div>
              </div>



              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm duration-150"
                  id="trip-form-submit-btn"
                >
                  Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

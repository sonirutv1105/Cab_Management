/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCMS } from '../context/CMSContext';
import { FuelLog, MaintenanceLog } from '../types';
import {
  Search,
  Filter,
  Download,
  Plus,
  Wrench,
  Fuel,
  Zap,
  CheckCircle,
  Clock,
  ArrowUpDown
} from 'lucide-react';

interface FinanceProps {
  subModule: 'fuel' | 'maintenance';
}

export default function FinanceOperationsView({ subModule }: FinanceProps) {
  const {
    fuelLogs,
    maintenanceLogs,
    vehicles,
    addFuelLog,
    addMaintenanceLog,
    updateMaintenanceLog,
    currentUser
  } = useCMS();

  const isReadOnly = currentUser.role === 'government';

  // Filters / Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // Fuel log (EV vs Fuel) / Maintenance (status)

  // Forms modals
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [maintModalOpen, setMaintModalOpen] = useState(false);

  // Form states
  const [fuelForm, setFuelForm] = useState({
    vehicleId: vehicles[0]?.id || '',
    quantity: 45.0,
    cost: 15.5,
    odometerReading: 12500,
    energyType: 'Electric' as 'Electric' | 'Fuel'
  });

  const [maintForm, setMaintForm] = useState({
    vehicleId: vehicles[0]?.id || '',
    category: 'Scheduled' as MaintenanceLog['category'],
    description: '',
    cost: 180.00,
    vendorName: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    status: 'In Progress' as MaintenanceLog['status']
  });

  // Automatically select the first vehicle as default when the list loads asynchronously
  React.useEffect(() => {
    if (vehicles.length > 0) {
      if (!fuelForm.vehicleId) {
        setFuelForm(prev => ({ ...prev, vehicleId: vehicles[0].id }));
      }
      if (!maintForm.vehicleId) {
        setMaintForm(prev => ({ ...prev, vehicleId: vehicles[0].id }));
      }
    }
  }, [vehicles]);


  // EXPORTS
  const exportFuel = () => {
    const headers = 'Log ID,Vehicle Plate,Date,Quantity (L/kWh),Cost (₹),Odometer Reading,Energy Type\n';
    const rows = fuelLogs
      .map((log) => {
        const v = vehicles.find((item) => item.id === log.vehicleId);
        return `"${log.id}","${v?.plateNumber || 'EV'}","${log.date}",${log.quantity},${log.cost},${log.odometerReading},"${log.energyType}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'CMS_FuelEnergyLogs.csv');
    a.click();
  };

  const exportMaintenance = () => {
    const headers = 'Log ID,Vehicle,Category,Description,Cost (₹),Vendor,Start,End,Status\n';
    const rows = maintenanceLogs
      .map((log) => {
        const v = vehicles.find((item) => item.id === log.vehicleId);
        return `"${log.id}","${v?.plateNumber || 'Plate'}","${log.category}","${log.description}",${log.cost},"${log.vendorName}","${log.startDate}","${log.endDate}","${log.status}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'CMS_FleetMaintenanceLogs.csv');
    a.click();
  };

  const submitFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    addFuelLog({
      ...fuelForm,
      date: new Date().toISOString().substring(0, 10)
    });
    setFuelModalOpen(false);
  };

  const submitMaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    addMaintenanceLog(maintForm);
    setMaintModalOpen(false);
  };

  // Process Logs
  const processedFuel = fuelLogs.filter((log) => {
    const v = vehicles.find((item) => item.id === log.vehicleId);
    const matchesSearch = v?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = typeFilter === 'ALL' || log.energyType === typeFilter;
    return matchesSearch && matchesType;
  });

  const processedMaint = maintenanceLogs.filter((log) => {
    const v = vehicles.find((item) => item.id === log.vehicleId);
    const matchesSearch =
      v?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    const matchesType = typeFilter === 'ALL' || log.status === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6" id="finance-ops-panel">
      {subModule === 'fuel' ? (
        /* FUEL MANAGEMENT SUB-MODULE VIEWPORT */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="fuel-management-view">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Fuel className="w-5.5 h-5.5 text-blue-600" />
                <span>Fuel & EV Charging Logs</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-semibold">Track energy replenishment, EV charging kWh, fuel quantities, odometer readings, and costs</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={exportFuel}
                className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Logs</span>
              </button>

              {!isReadOnly && (
                <button
                  onClick={() => setFuelModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
                  id="add-fuel-trigger-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Fuel / Charging</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            <input
              type="text"
              placeholder="Search by registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-700 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              id="fuel-search-input"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300"
              id="fuel-type-filter"
            >
              <option value="ALL">All Power Sources</option>
              <option value="Electric">Electric EV</option>
              <option value="Fuel">Petrol / Diesel refills</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Log ID</th>
                  <th className="p-3.5">Registration No.</th>
                  <th className="p-3.5">Fill Date</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Total Cost</th>
                  <th className="p-3.5">Odometer Reading</th>
                  <th className="p-3.5">Fuel / Energy Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-700 dark:text-gray-300">
                {processedFuel.map((log) => {
                  const v = vehicles.find((item) => item.id === log.vehicleId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 duration-150">
                      <td className="p-3.5 font-bold font-mono text-gray-400 dark:text-gray-500">{log.id}</td>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-gray-100 font-mono tracking-wider">{v?.plateNumber || 'EV-99'}</td>
                      <td className="p-3.5">{log.date}</td>
                      <td className="p-3.5 font-bold text-gray-800 dark:text-gray-200">
                        {log.quantity} {log.energyType === 'Electric' ? 'kWh' : 'Liters'}
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-700">₹{log.cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="p-3.5 font-mono font-bold text-gray-600 dark:text-gray-400">{log.odometerReading.toLocaleString()} Km</td>
                      <td className="p-3.5">
                        {log.energyType === 'Electric' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 font-bold border border-emerald-100">
                            <Zap className="w-3.5 h-3.5 text-emerald-500 mr-1 fill-emerald-500" /> EV Charging
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 font-bold border border-amber-100">
                            Fuel Refill
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MAINTENANCE MANAGEMENT SUB-MODULE VIEWPORT */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="maint-management-view">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Wrench className="w-5.5 h-5.5 text-blue-600" />
                <span>Maintenance & Repairs</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage vehicle servicing, inspections, repairs, tire changes, and alignments</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={exportMaintenance}
                className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold duration-150 flex items-center space-x-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Maintenance Log</span>
              </button>

              {!isReadOnly && (
                <button
                  onClick={() => setMaintModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
                  id="add-maint-trigger-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Repair / Service</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            <input
              type="text"
              placeholder="Search by vehicle card or issue diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-700 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              id="maint-search-input"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-700 dark:text-gray-300"
              id="maint-status-filter"
            >
              <option value="ALL">All Repair Stages</option>
              <option value="Upcoming">Upcoming</option>
              <option value="In Progress">Under Repair</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Service ID</th>
                  <th className="p-3.5">Registration No.</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Cost</th>
                  <th className="p-3.5">Service Center / Workshop</th>
                  <th className="p-3.5">Timelines</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-700 dark:text-gray-300">
                {processedMaint.map((log) => {
                  const v = vehicles.find((item) => item.id === log.vehicleId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 duration-150">
                      <td className="p-3.5 font-bold font-mono text-gray-400 dark:text-gray-500">{log.id}</td>
                      <td className="p-3.5 font-bold text-gray-950 font-mono tracking-wider">{v?.plateNumber || 'Plates'}</td>
                      <td className="p-3.5">
                        <span className="p-1 px-1.5 font-bold rounded bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200 text-[10px]">
                          {log.category}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-gray-600 dark:text-gray-400" title={log.description}>{log.description}</td>
                      <td className="p-3.5 font-black text-rose-700">₹{log.cost}</td>
                      <td className="p-3.5 font-semibold text-blue-600">{log.vendorName}</td>
                      <td className="p-3.5 text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-normal">
                        <div>Start: {log.startDate}</div>
                        <div>End: {log.endDate}</div>
                      </td>
                      <td className="p-3.5">
                        {log.status === 'Completed' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400">
                            Completed
                          </span>
                        ) : log.status === 'In Progress' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 animate-pulse">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            Upcoming
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!isReadOnly && log.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              updateMaintenanceLog({ ...log, status: 'Completed' });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] py-1 px-2 rounded duration-150 shadow-sm"
                          >
                            Mark Finished
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPLENISHMENT MODAL */}
      {fuelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border max-w-md w-full animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 border-b pb-3 mb-4">Log Fuel / EV Charge</h3>
            <form onSubmit={submitFuel} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Select Cab / Vehicle</label>
                <select
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.make} {v.model}) [- {v.fuelType}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Fuel / Energy Type</label>
                  <select
                    value={fuelForm.energyType}
                    onChange={(e) => setFuelForm({ ...fuelForm, energyType: e.target.value as any })}
                    className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 font-bold"
                  >
                    <option value="Electric">Electric EV (kWh)</option>
                    <option value="Fuel">Petrol/Diesel Refill (L)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Current Odometer (Km)</label>
                  <input
                    type="number"
                    value={fuelForm.odometerReading}
                    onChange={(e) => setFuelForm({ ...fuelForm, odometerReading: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Quantity (Liters / kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fuelForm.quantity}
                    onChange={(e) => setFuelForm({ ...fuelForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setFuelModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  Log Fuel / Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAIR LOG MODAL */}
      {maintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border max-w-md w-full animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 border-b pb-3 mb-4">Log Maintenance / Service Details</h3>
            <form onSubmit={submitMaint} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Select Cab / Vehicle</label>
                <select
                  value={maintForm.vehicleId}
                  onChange={(e) => setMaintForm({ ...maintForm, vehicleId: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.make} {v.model}) [- {v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Service Category</label>
                  <select
                    value={maintForm.category}
                    onChange={(e) => setMaintForm({ ...maintForm, category: e.target.value as any })}
                    className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 font-bold font-semibold"
                  >
                    <option value="Scheduled">Scheduled Servicing</option>
                    <option value="Breakdown">Breakdown / Emergency Repair</option>
                    <option value="Compliance Fix">Compliance Correction</option>
                    <option value="Tire Change">Tire Change / Alignment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    value={maintForm.cost}
                    onChange={(e) => setMaintForm({ ...maintForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={maintForm.startDate}
                    onChange={(e) => setMaintForm({ ...maintForm, startDate: e.target.value })}
                    className="w-full text-xs border rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Estimated End Date</label>
                  <input
                    type="date"
                    value={maintForm.endDate}
                    onChange={(e) => setMaintForm({ ...maintForm, endDate: e.target.value })}
                    className="w-full text-xs border rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Service Station / Workshop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Service Station"
                  value={maintForm.vendorName}
                  onChange={(e) => setMaintForm({ ...maintForm, vendorName: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Work Description / Remarks</label>
                <textarea
                  placeholder="Describe the issues or work done..."
                  value={maintForm.description}
                  onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 h-20"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setMaintModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  Add Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

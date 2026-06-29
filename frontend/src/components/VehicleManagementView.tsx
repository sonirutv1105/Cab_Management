/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { Vehicle } from '../types';
import { api } from '../api/client';
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Key,
  MoreHorizontal,
  ArrowUpDown,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  SlidersHorizontal,
  X
} from 'lucide-react';

type TabKey = 'all' | 'available' | 'ontrip' | 'maintenance' | 'expiring' | 'inactive' | 'history';

export default function VehicleManagementView() {
  const {
    vehicles,
    drivers,
    vendors,
    complianceDocs,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    currentUser
  } = useCMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [insuranceFilter, setInsuranceFilter] = useState('ALL');
  const [contractFilter, setContractFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof Vehicle>('plateNumber');
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

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVh, setEditingVh] = useState<Vehicle | null>(null);

  // Form
  const [formState, setFormState] = useState<Omit<Vehicle, 'id'>>({
    plateNumber: '',
    model: '',
    make: '',
    seatingCapacity: 5,
    fuelType: 'Petrol',
    status: 'Available',
    vendorId: vendors[0]?.id || 'vnd_1',
    insuranceExpiry: '',
    lastServiceDate: '',
    year: new Date().getFullYear(),
    color: '',
    vehicleType: 'Sedan',
    contract: '',
    assignedDriverId: ''
  });

  const isReadOnly = currentUser.role === 'government';
  const today = new Date();

  // ── Insurance status helpers ──
  const getInsuranceStatus = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    if (expiry < today) return 'Expired';
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return 'Expiring';
    return 'Valid';
  };

  const formatInsuranceDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const getInsuranceDaysLeft = (dateStr: string) => {
    const expiry = new Date(dateStr);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ── Computed counts ──
  const counts = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.status === 'Available').length;
    const onTrip = vehicles.filter((v) => v.status === 'On Trip').length;
    const maintenance = vehicles.filter((v) => v.status === 'Under Maintenance').length;
    const inactive = vehicles.filter((v) => v.status === 'Inactive').length;

    const expiredInsurance = vehicles.filter((v) => getInsuranceStatus(v.insuranceExpiry) === 'Expired').length;
    const expiringDocs = vehicles.filter((v) => {
      const insStatus = getInsuranceStatus(v.insuranceExpiry);
      return insStatus === 'Expiring' || insStatus === 'Expired';
    }).length;

    // Also check compliance docs
    const expiringCompDocs = complianceDocs.filter(
      (d) => d.entityType === 'Vehicle' && (d.status === 'Expiring' || d.status === 'Expired')
    ).length;

    return { total, available, onTrip, maintenance, inactive, expiredInsurance, expiringDocs: expiringDocs + expiringCompDocs };
  }, [vehicles, complianceDocs]);

  // ── Unique contracts list for filter ──
  const uniqueContracts = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => { if (v.contract) set.add(v.contract); });
    return Array.from(set);
  }, [vehicles]);

  // ── Tab-filtered + search-filtered + dropdown-filtered list ──
  const processedVehicles = useMemo(() => {
    let list = [...vehicles];

    // Tab filter
    switch (activeTab) {
      case 'available': list = list.filter((v) => v.status === 'Available'); break;
      case 'ontrip': list = list.filter((v) => v.status === 'On Trip'); break;
      case 'maintenance': list = list.filter((v) => v.status === 'Under Maintenance'); break;
      case 'inactive': list = list.filter((v) => v.status === 'Inactive'); break;
      case 'expiring': list = list.filter((v) => {
        const ins = getInsuranceStatus(v.insuranceExpiry);
        return ins === 'Expiring' || ins === 'Expired';
      }); break;
      default: break;
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((v) => {
        const driver = drivers.find((d) => d.id === v.assignedDriverId);
        return (
          v.plateNumber.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          (driver?.name.toLowerCase().includes(q) ?? false) ||
          (v.vehicleType?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    // Dropdown filters
    if (typeFilter !== 'ALL') list = list.filter((v) => v.vehicleType === typeFilter);
    if (statusFilter !== 'ALL') list = list.filter((v) => v.status === statusFilter);
    if (insuranceFilter !== 'ALL') list = list.filter((v) => getInsuranceStatus(v.insuranceExpiry) === insuranceFilter);
    if (contractFilter !== 'ALL') list = list.filter((v) => v.contract === contractFilter);

    // Sort
    list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [vehicles, activeTab, searchTerm, typeFilter, statusFilter, insuranceFilter, contractFilter, sortBy, sortOrder, drivers]);

  // ── Handlers ──
  const handleSort = (field: keyof Vehicle) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedVehicles.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(processedVehicles.map((v) => v.id)));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} selected vehicles?`)) {
      selectedIds.forEach((id) => deleteVehicle(id));
      setSelectedIds(new Set());
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportMenuOpen(false);
    const recordsToExport = selectedIds.size > 0 
      ? processedVehicles.filter(v => selectedIds.has(v.id))
      : processedVehicles;

    const payload = {
      title: "Vehicle Management Data",
      headers: ["Plate Number", "Make", "Model", "Type", "Year", "Color", "Status", "Contract", "Insurance Expiry"],
      rows: recordsToExport.map(v => [
        v.plateNumber,
        v.make,
        v.model,
        v.vehicleType || '',
        v.year || '',
        v.color || '',
        v.status,
        v.contract || '',
        v.insuranceExpiry
      ])
    };

    try {
      let blob;
      let filename = `Vehicle_Management_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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
    
    if (formState.year && String(formState.year).length !== 4) {
      alert("Year must contain exactly 4 digits.");
      return;
    }

    if (editingVh) updateVehicle({ ...formState, id: editingVh.id });
    else addVehicle(formState);
    closeAndReset();
  };

  const closeAndReset = () => {
    setModalOpen(false);
    setEditingVh(null);
    setFormState({
      plateNumber: '', model: '', make: '', seatingCapacity: 5, fuelType: 'Petrol', status: 'Available',
      vendorId: vendors[0]?.id || 'vnd_1', insuranceExpiry: '', lastServiceDate: '',
      year: new Date().getFullYear(), color: '', vehicleType: 'Sedan', contract: '', assignedDriverId: ''
    });
  };

  const openEdit = (v: Vehicle) => {
    setEditingVh(v);
    setFormState({
      plateNumber: v.plateNumber, model: v.model, make: v.make, seatingCapacity: v.seatingCapacity,
      fuelType: v.fuelType, status: v.status, vendorId: v.vendorId, insuranceExpiry: v.insuranceExpiry,
      lastServiceDate: v.lastServiceDate, year: v.year, color: v.color, vehicleType: v.vehicleType,
      contract: v.contract, assignedDriverId: v.assignedDriverId
    });
    setModalOpen(true);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setInsuranceFilter('ALL');
    setContractFilter('ALL');
  };

  // ── Driver initials avatar helper ──
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-50 dark:bg-blue-900/300', 'bg-indigo-50 dark:bg-indigo-900/300', 'bg-purple-50 dark:bg-purple-900/300', 'bg-pink-500',
      'bg-rose-500', 'bg-orange-50 dark:bg-orange-900/300', 'bg-amber-50 dark:bg-amber-900/300', 'bg-emerald-50 dark:bg-emerald-900/300', 'bg-teal-50 dark:bg-teal-900/300', 'bg-cyan-50 dark:bg-cyan-900/300'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // ── Vehicle type badge color helper ──
  const getTypeBadgeStyle = (type?: string) => {
    switch (type) {
      case 'Sedan': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700';
      case 'SUV': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700';
      case 'Hatchback': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All Vehicles', count: counts.total },
    { key: 'available', label: 'Available', count: counts.available },
    { key: 'ontrip', label: 'On Trip', count: counts.onTrip },
    { key: 'maintenance', label: 'Under Maintenance', count: counts.maintenance },
    { key: 'expiring', label: 'Expiring Documents', count: counts.expiringDocs },
    { key: 'inactive', label: 'Inactive', count: counts.inactive },
    { key: 'history', label: 'History', count: 0 }
  ];

  return (
    <div className="space-y-5" id="vehicle-management-panel">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Vehicle Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage fleet cabs, verification documents, driver assignments, and repairs.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
              <Download className="w-4 h-4" /> Export
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
          <button className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
            <BarChart3 className="w-4 h-4" /> Reports
          </button>
          {!isReadOnly && (
            <button onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors" id="add-vehicle-trigger-btn">
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ METRICS BAR ═══════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'TOTAL CABS', value: counts.total, sub: 'All registered cabs', dot: '' },
          { label: 'AVAILABLE', value: counts.available, sub: 'Ready to assign', dot: 'bg-emerald-50 dark:bg-emerald-900/300' },
          { label: 'ON TRIP', value: counts.onTrip, sub: 'Currently active', dot: 'bg-emerald-50 dark:bg-emerald-900/300' },
          { label: 'UNDER MAINTENANCE', value: counts.maintenance, sub: 'In service bay', dot: 'bg-amber-50 dark:bg-amber-900/300' },
          { label: 'DOCS EXPIRING', value: counts.expiringDocs, sub: 'Within 30 days', dot: 'bg-red-50 dark:bg-red-900/300' },
          { label: 'INACTIVE', value: counts.inactive, sub: 'Not in service', dot: 'bg-gray-400' }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-1">{card.label}</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">{card.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {card.dot && <span className={`w-2 h-2 rounded-full ${card.dot}`} />}
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════ ALERT BANNERS ═══════════════ */}
      {counts.expiredInsurance > 0 && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 bg-red-50 dark:bg-red-900/300 rounded-full">
              <AlertCircle className="w-4 h-4 text-white" />
            </span>
            <p className="text-sm text-red-900 dark:text-red-300 font-medium">
              <span className="font-bold">{counts.expiredInsurance} vehicles</span> have expired insurance. Immediate renewal required.
            </p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold flex items-center gap-1 shrink-0">
            View all <span>→</span>
          </button>
        </div>
      )}

      {counts.expiringDocs > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 bg-amber-400 rounded-full">
              <AlertTriangle className="w-4 h-4 text-white" />
            </span>
            <p className="text-sm text-amber-900 dark:text-amber-300 font-medium">
              <span className="font-bold">{counts.expiringDocs} vehicles</span> have PUC or Fitness Certificates expiring within 15 days.
            </p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold flex items-center gap-1 shrink-0">
            View expiring <span>→</span>
          </button>
        </div>
      )}

      {/* ═══════════════ TABS ═══════════════ */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════ SEARCH & FILTERS ═══════════════ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vehicle number, make, model, driver, RC"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-white dark:bg-gray-800 pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            id="vehicle-search-input"
          />
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="ALL">All Categories</option>
          <option value="Sedan">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="Hatchback">Hatchback</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="ALL">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select value={insuranceFilter} onChange={(e) => setInsuranceFilter(e.target.value)}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="ALL">Insurance: All</option>
          <option value="Valid">Valid</option>
          <option value="Expiring">Expiring</option>
          <option value="Expired">Expired</option>
        </select>

        <select value={contractFilter} onChange={(e) => setContractFilter(e.target.value)}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="ALL">All Contracts</option>
          {uniqueContracts.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 font-semibold flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <SlidersHorizontal className="w-4 h-4" /> More Filters
        </button>
        <button onClick={clearAllFilters} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 font-medium transition-colors">
          Clear all
        </button>
      </div>

      {/* ═══════════════ BULK ACTION BAR ═══════════════ */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-slate-800 rounded-xl px-5 py-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-900/300 rounded text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span className="text-white text-sm font-semibold">{selectedIds.size} vehicles selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
              Assign Driver
            </button>
            <button className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
              Change Status
            </button>
            <button className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
              Export Selected
            </button>
            <button onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-50 dark:bg-red-900/300 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ DATA TABLE ═══════════════ */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="pl-4 pr-2 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === processedVehicles.length && processedVehicles.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('plateNumber')}>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registration No. <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-3 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('vehicleType')}>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type / Brand <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-3 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Driver</th>
                <th className="px-3 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agreement</th>
                <th className="px-3 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('insuranceExpiry')}>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Insurance <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-3 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-3 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {processedVehicles.map((v) => {
                const driver = drivers.find((d) => d.id === v.assignedDriverId);
                const insStatus = getInsuranceStatus(v.insuranceExpiry);
                const daysLeft = getInsuranceDaysLeft(v.insuranceExpiry);

                return (
                  <tr key={v.id} className={`hover:bg-blue-50/40 transition-colors ${selectedIds.has(v.id) ? 'bg-blue-50/60' : ''}`}>
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={() => toggleSelect(v.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Vehicle No */}
                    <td className="px-3 py-3.5">
                      <div className="font-bold text-blue-700 text-sm">{v.plateNumber}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{v.year || ''} · {v.color || ''}</div>
                    </td>

                    {/* Type / Brand */}
                    <td className="px-3 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeStyle(v.vehicleType)}`}>
                        {v.vehicleType || 'Unknown'}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{v.make} {v.model}</div>
                    </td>

                    {/* Assigned Driver */}
                    <td className="px-3 py-3.5">
                      {driver ? (
                        <div className="flex items-center gap-2.5">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${getAvatarColor(driver.name)}`}>
                            {getInitials(driver.name)}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{driver.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{driver.phone}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 dark:text-gray-400 text-xs font-bold">—</span>
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                        </div>
                      )}
                    </td>

                    {/* Contract */}
                    <td className="px-3 py-3.5">
                      {v.contract ? (
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 border border-indigo-200">
                          {v.contract}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>

                    {/* Insurance */}
                    <td className="px-3 py-3.5">
                      {insStatus === 'Valid' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200 dark:border-emerald-800">
                          Valid · {formatInsuranceDate(v.insuranceExpiry)}
                        </span>
                      ) : insStatus === 'Expiring' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-700 border border-orange-200">
                          Expiring · {daysLeft} days
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 border border-red-200 dark:border-red-800">
                          Expired
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      {v.status === 'Available' ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-50 dark:bg-emerald-900/300" /> Available
                        </span>
                      ) : v.status === 'On Trip' ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-50 dark:bg-green-900/300 animate-pulse" /> On Trip
                        </span>
                      ) : v.status === 'Under Maintenance' ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                          <span className="w-2 h-2 rounded-full bg-amber-50 dark:bg-amber-900/300" /> Maintenance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          <span className="w-2 h-2 rounded-full bg-gray-400" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(v)} disabled={isReadOnly}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-30" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors" title="Documents">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors" title="Assign Key">
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete vehicle ${v.plateNumber}?`)) deleteVehicle(v.id); }}
                          disabled={isReadOnly}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="More">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {processedVehicles.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="text-sm font-medium">No vehicles match the selected filters.</p>
                      <button onClick={clearAllFilters} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold">
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════ ADD / EDIT MODAL ═══════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editingVh ? `Edit Vehicle: ${editingVh.plateNumber}` : 'Add New Vehicle'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Enter cab details, driver assignment, and certificate details.</p>
              </div>
              <button onClick={closeAndReset} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Plate & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Vehicle Registration Number *</label>
                  <input type="text" value={formState.plateNumber} onChange={(e) => setFormState({ ...formState, plateNumber: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. DL 1C A 1234" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Status *</label>
                  <select value={formState.status} onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500">
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Make & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Company / Make *</label>
                  <input type="text" value={formState.make} onChange={(e) => setFormState({ ...formState, make: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. Maruti Suzuki" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Model *</label>
                  <input type="text" value={formState.model} onChange={(e) => setFormState({ ...formState, model: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. Dzire" required />
                </div>
              </div>

              {/* Row 3: Type, Year, Color */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Vehicle Type</label>
                  <select value={formState.vehicleType || ''} onChange={(e) => setFormState({ ...formState, vehicleType: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500">
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Year</label>
                  <input type="text" maxLength={4} value={formState.year || ''} onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormState({ ...formState, year: val ? parseInt(val) : undefined });
                  }}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 2023" />
                  {formState.year && String(formState.year).length !== 4 && <span className="text-red-500 text-[10px]">Year must contain exactly 4 digits.</span>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Color</label>
                  <input type="text" value={formState.color || ''} onChange={(e) => setFormState({ ...formState, color: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. White" />
                </div>
              </div>

              {/* Row 4: Fuel Type & Seating */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Fuel Type *</label>
                  <select value={formState.fuelType} onChange={(e) => setFormState({ ...formState, fuelType: e.target.value as any })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500">
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Seating Capacity *</label>
                  <input type="number" value={formState.seatingCapacity}
                    onChange={(e) => setFormState({ ...formState, seatingCapacity: parseInt(e.target.value) || 5 })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    min="1" required />
                </div>
              </div>

              {/* Row 5: Contract & Vendor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Agreement</label>
                  <input type="text" value={formState.contract || ''} onChange={(e) => setFormState({ ...formState, contract: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. TCS Agreement" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Cab Vendor / Owner</label>
                  <select value={formState.vendorId} onChange={(e) => setFormState({ ...formState, vendorId: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500">
                    {vendors.map((vnd) => <option key={vnd.id} value={vnd.id}>{vnd.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 6: Driver */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Assigned Driver</label>
                  <select value={formState.assignedDriverId || ''} onChange={(e) => setFormState({ ...formState, assignedDriverId: e.target.value || undefined })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500">
                    <option value="">Unassigned</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 7: Insurance & Last Service */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Insurance Expiry *</label>
                  <input type="date" value={formState.insuranceExpiry} onChange={(e) => setFormState({ ...formState, insuranceExpiry: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">Last Service Date *</label>
                  <input type="date" value={formState.lastServiceDate} onChange={(e) => setFormState({ ...formState, lastServiceDate: e.target.value })}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required />
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={closeAndReset}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors" id="vehicle-submit-form-btn">
                  {editingVh ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

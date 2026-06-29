import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useContracts } from '../../context/ContractContext';
import { api } from '../../api/client';
import { Contract } from '../../types';
import { 
  Search, Filter, Plus, MoreVertical, FileDown, 
  Trash2, Edit, Eye, Copy, RefreshCw, ChevronLeft, ChevronRight,
  DownloadCloud, AlertCircle, XCircle
} from 'lucide-react';

interface ContractListProps {
  onView: (id: string) => void;
  onCreate: (id?: string) => void;
  viewMode?: 'list' | 'drafts';
}

export default function ContractList({ onView, onCreate, viewMode = 'list' }: ContractListProps) {
  const { contracts, drafts, deleteContract, deleteDraft, changeContractStatus, isLoading, error, fetchContracts, duplicateContract } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchContracts({
        search: searchTerm,
        status: statusFilter,
        type: typeFilter,
        department: departmentFilter
      });
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, typeFilter, departmentFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SECTION_TITLES: Record<string, string> = {
    'A': 'Contract Information',
    'B': 'Organisation & Buyer Details',
    'C': 'Client Information',
    'D': 'Financial & Payment',
    'E': 'Consignee Details',
    'F': 'Vehicle Requirements',
    'G': 'SLA & Compliance',
    'H': 'Renewal & Termination',
    'I': 'Documents & Attachments'
  };

  // Formatting utilities
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 border-emerald-200 dark:border-emerald-800';
      case 'Draft': return 'bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-400 border-gray-200 dark:border-slate-700';
      case 'Pending Approval': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 border-amber-200 dark:border-amber-800';
      case 'Renewal Pending': return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 border-indigo-200';
      case 'Expired': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  // Filtering & Sorting
  const filteredContracts = useMemo(() => {
    return contracts;
  }, [contracts]);

  const draftContracts = useMemo(() => {
    return [...drafts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [drafts]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedContracts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} agreements?`)) {
      Array.from(selectedIds).forEach(id => deleteContract(id));
      setSelectedIds(new Set());
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportMenuOpen(false);
    
    // Determine which records to export (Selected > Filtered > All)
    const recordsToExport = selectedIds.size > 0 
      ? filteredContracts.filter(c => selectedIds.has(c.id))
      : filteredContracts;

    const payload = {
      title: "Contract Management Data",
      headers: ["Contract Number", "Title", "Type", "Client", "Department", "Start Date", "End Date", "Value", "Status"],
      rows: recordsToExport.map(c => [
        c.contractNumber,
        c.title,
        c.type,
        c.clientName,
        c.department,
        formatDate(c.startDate),
        formatDate(c.endDate),
        c.value,
        c.status
      ])
    };

    try {
      let blob;
      let filename = `Contracts_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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

  const handleDownloadSingle = async (contract: Contract) => {
    const payload = {
      title: contract.title,
      headers: ["Field", "Value"],
      rows: [
        ["Contract Number", contract.contractNumber],
        ["Type", contract.type],
        ["Status", contract.status],
        ["Start Date", contract.startDate],
        ["End Date", contract.endDate],
      ]
    };
    try {
      const blob = await api.exportToPdf(payload);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `${contract.contractNumber}.pdf`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Download failed');
    }
  };

  const handleExportSingle = async (contract: Contract) => {
    const payload = {
      title: contract.title,
      headers: ["Field", "Value"],
      rows: [
        ["Contract Number", contract.contractNumber],
        ["Type", contract.type],
        ["Status", contract.status],
        ["Start Date", contract.startDate],
        ["End Date", contract.endDate],
      ]
    };
    try {
      const blob = await api.exportToExcel(payload);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `${contract.contractNumber}.xlsx`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 relative">
      {/* Top Bar Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-gray-200 dark:border-slate-700 gap-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agreements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 text-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border ${showFilters ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            title="Advanced Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-2 mr-4 animate-in fade-in zoom-in duration-200">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-100 px-3 py-1 rounded-full">
                {selectedIds.size} selected
              </span>
              <button 
                onClick={handleDeleteSelected}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:border-slate-700"
                title="Export Selected"
              >
                <DownloadCloud className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Export</span>
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
          
          <button 
            onClick={() => onCreate()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-400 mb-1">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Renewal Pending">Renewal Pending</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-400 mb-1">Agreement Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-sm border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border"
            >
              <option>All Types</option>
              <option>Service Agreement</option>
              <option>Vehicle Lease</option>
              <option>Vendor Agreement</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-400 mb-1">Department</label>
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full text-sm border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border"
            >
              <option>All Departments</option>
              <option>Logistics</option>
              <option>HR</option>
              <option>IT</option>
              <option>Operations</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('All'); setTypeFilter('All Types'); setDepartmentFilter('All Departments'); }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Render Drafts Mode */}
      {viewMode === 'drafts' && (
        <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-slate-900/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-gray-600 dark:text-slate-400 font-medium">Loading drafts...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-500 dark:text-slate-400">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <p className="text-lg font-medium text-gray-900 dark:text-slate-50">Failed to load drafts</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : draftContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-500 dark:text-slate-400">
              <span className="text-4xl mb-4">📝</span>
              <p className="text-lg font-medium text-gray-900 dark:text-slate-50 mb-1">No Draft Contracts</p>
              <p className="text-sm">Saved drafts will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {draftContracts.map(draft => {
                const progress = draft.completionPercentage || 0;
                const currentSectionTitle = draft.activeSection ? SECTION_TITLES[draft.activeSection] : 'Contract Information';
                const buttonText = progress === 0 ? 'Start Draft' : 'Resume';

                return (
                  <div key={draft.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-slate-50 truncate pr-4" title={draft.title || 'Untitled Contract'}>{draft.title || 'Untitled Contract'}</h4>
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-md whitespace-nowrap">Draft</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                      Last updated {formatDate(draft.updatedAt)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-3 truncate">
                      Current Section: <span className="font-medium text-gray-700 dark:text-slate-300">{currentSectionTitle}</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-slate-400">Completion</span>
                        <span className="font-medium text-gray-700 dark:text-slate-300">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-700 pt-3">
                      <button 
                        onClick={() => {
                          if (window.confirm('Delete this draft?')) deleteDraft(draft.id);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium flex items-center px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </button>
                      <button 
                        onClick={() => onCreate(draft.id)}
                        className="text-xs text-white bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 font-medium px-3 py-1.5 rounded-lg flex items-center transition-colors"
                      >
                        <Edit className="w-3 h-3 mr-1" /> {buttonText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Render Contracts List Mode */}
      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table Container */}
          <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <tr>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  checked={selectedIds.size === paginatedContracts.length && paginatedContracts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Number & Title</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Client & Dept</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-gray-600 dark:text-slate-400 font-medium">Loading contracts...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
                    <p className="text-lg font-medium text-gray-900 dark:text-slate-50">Failed to load contracts</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
                  </div>
                </td>
              </tr>
            ) : paginatedContracts.length > 0 ? (
              paginatedContracts.map((contract) => (
                <tr 
                  key={contract.id} 
                  className={`hover:bg-blue-50/50 transition-colors group ${selectedIds.has(contract.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.has(contract.id)}
                      onChange={() => handleSelectOne(contract.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => onView(contract.id)}>
                        {contract.contractNumber}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-slate-50 font-medium truncate max-w-xs" title={contract.title}>
                        {contract.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{contract.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-slate-50 font-medium">{contract.clientName}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{contract.department}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-slate-50">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{contract.durationMonths} Months</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-50">{formatCurrency(contract.value)}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{contract.billingFrequency}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(contract.status)}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1.5 transition-opacity">
                      <button 
                        onClick={() => onView(contract.id)}
                        className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded-md transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onCreate(contract.id)}
                        className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-900/30 rounded-md transition-colors"
                        title="Edit Agreement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete"
                        onClick={() => {
                          if (window.confirm('Delete this agreement?')) deleteContract(contract.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <FileDown className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900 dark:text-slate-50">No agreements found</p>
                    <p className="text-sm">Adjust your filters or create a new agreement.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
        <div className="text-sm text-gray-500 dark:text-slate-400">
          Showing <span className="font-medium text-gray-900 dark:text-slate-50">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900 dark:text-slate-50">{Math.min(currentPage * itemsPerPage, filteredContracts.length)}</span> of <span className="font-medium text-gray-900 dark:text-slate-50">{filteredContracts.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-400 px-2">Page {currentPage} of {Math.max(1, totalPages)}</span>
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}


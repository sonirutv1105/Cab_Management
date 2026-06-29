import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  CreditCard,
  Key,
  Trash2,
  AlertTriangle,
  PlayCircle,
  X,
  Lock,
  Save,
  Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import SuperAdminAddCompany from './SuperAdminAddCompany';

const DEFAULT_SUMMARY = [
  { label: 'Total Companies', value: '0', trend: '0%', isUp: true, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { label: 'Active Companies', value: '0', trend: '0%', isUp: true, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { label: 'Trial Companies', value: '0', trend: '0%', isUp: false, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { label: 'Deactivated Companies', value: '0', trend: '0%', isUp: false, icon: Ban, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
];

export default function SuperAdminCompanies() {
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [summaryCards, setSummaryCards] = useState(DEFAULT_SUMMARY);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyData, setSelectedCompanyData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExportOpen(false);
      }
    };
    
    if (isExportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExportOpen]);
  
  const openModal = async (type: string, company: any) => {
    setSelectedCompanyId(company.id);
    setSelectedCompanyData({
      company: {
        id: company.id,
        name: company.name,
        head_name: company.headName,
        head_email: company.email,
        head_phone: company.phone,
        status: company.status,
        created_at: company.created
      },
      subscription: {
        plan_name: company.plan,
        end_date: company.expiry
      }
    }); // optimistic basic data
    setActiveModal(type);
    setPasswordInput('');
    
    if (['view', 'edit', 'subscription'].includes(type)) {
      try {
        const token = localStorage.getItem('super_admin_auth');
        const res = await fetch(`http://localhost:8000/api/super-admin/companies/${company.id}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedCompanyData(data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch company details");
      }
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedCompanyId(null);
    setSelectedCompanyData(null);
    setIsSubmitting(false);
    setPasswordInput('');
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('super_admin_auth');
      const [compRes, statsRes] = await Promise.all([
        fetch('http://localhost:8000/api/super-admin/companies', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8000/api/super-admin/dashboard-stats', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (compRes.ok) setCompaniesData(await compRes.json());
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.kpis) {
           const updatedSummary = [...DEFAULT_SUMMARY];
           updatedSummary[0].value = statsData.kpis[0]?.value || '0';
           updatedSummary[1].value = statsData.kpis[1]?.value || '0';
           updatedSummary[2].value = statsData.kpis[2]?.value || '0';
           updatedSummary[3].value = statsData.kpis[6]?.value || '0';
           setSummaryCards(updatedSummary);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch(`http://localhost:8000/api/super-admin/companies/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Company ${status.toLowerCase()} successfully`);
        setCompaniesData(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        fetchCompanies();
        closeModal();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch(`http://localhost:8000/api/super-admin/companies/${selectedCompanyId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedCompanyData.company)
      });
      if (res.ok) {
        toast.success("Company details updated successfully");
        fetchCompanies();
        closeModal();
      } else {
        toast.error("Failed to update company");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch(`http://localhost:8000/api/super-admin/companies/${selectedCompanyId}/subscription`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedCompanyData.subscription)
      });
      if (res.ok) {
        toast.success("Subscription updated successfully");
        fetchCompanies();
        closeModal();
      } else {
        toast.error("Failed to update subscription");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch(`http://localhost:8000/api/super-admin/companies/${selectedCompanyId}/reset-password`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        toast.success("Password reset successfully");
        closeModal();
      } else {
        toast.error("Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setIsSubmitting(true);
    const toastId = toast.loading("Uploading and parsing file...");
    
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch('http://localhost:8000/api/super-admin/companies/import/preview', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setImportPreviewData(data.rows || []);
        setActiveModal('import_preview');
        toast.success("File parsed successfully", { id: toastId });
      } else {
        toast.error(data.detail || "Failed to parse file", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during upload", { id: toastId });
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    const validRows = importPreviewData.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading(`Importing ${validRows.length} companies...`);
    
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch('http://localhost:8000/api/super-admin/companies/import/confirm', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validRows)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Import successful", { id: toastId });
        fetchCompanies();
        closeModal();
      } else {
        toast.error(data.detail || "Import failed", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during import", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsSubmitting(true);
    const toastId = toast.loading(`Exporting companies as ${format.toUpperCase()}...`);
    
    try {
      const token = localStorage.getItem('super_admin_auth');
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter) queryParams.append('status_filter', statusFilter);
      
      const res = await fetch(`http://localhost:8000/api/super-admin/companies/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `companies_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Export successful", { id: toastId });
      } else {
        toast.error("Export failed", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during export", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompaniesData = companiesData.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.id?.toString().includes(searchTerm);
    const matchesStatus = !statusFilter || statusFilter === 'All' || company.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20 relative">
      <Toaster position="top-right" />
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage SaaS tenants, subscriptions, and platform access.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            Import
          </button>
          
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export
            </button>
            <div className={`absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all z-10 ${isExportOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="p-1 flex flex-col">
                <button onClick={() => { handleExport('csv'); setIsExportOpen(false); }} className="text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">As CSV</button>
                <button onClick={() => { handleExport('xlsx'); setIsExportOpen(false); }} className="text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">As Excel</button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { window.history.pushState({}, '', '/super-admin/companies/add'); window.dispatchEvent(new Event('popstate')); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Company
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className={`text-[11px] font-bold px-2 py-1 rounded-full ${kpi.isUp ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' : 'text-rose-700 bg-rose-50 dark:bg-rose-900/30'}`}>
                  {kpi.trend}
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{kpi.value}</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company by name, ID, or email..." 
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all"
          />
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <div className="relative min-w-[140px]">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Trial">Trial</option>
              <option value="Deactivated">Deactivated</option>
              <option value="Expired">Expired</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[150px]">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
              <option value="">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[130px]">
            <select className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-visible relative">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Status & Dates</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {filteredCompaniesData.map((company) => (
                <tr key={company.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/80 transition-colors">
                  
                  {/* Company Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm border border-blue-200 dark:border-blue-800">
                        {company.logo}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{company.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ID: {company.id}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Contact Info */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{company.headName}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 space-y-0.5">
                      <p>{company.email}</p>
                      <p>{company.phone}</p>
                    </div>
                  </td>

                  {/* Subscription Tier */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{company.plan}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Exp: {company.expiry}
                    </p>
                  </td>

                  {/* Status & Dates */}
                  <td className="px-6 py-4">
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        company.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                        company.status === 'Trial' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        company.status === 'Deactivated' || company.status === 'Inactive' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' :
                        'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                      }`}>
                        {company.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
                      <p>Created: <span className="font-medium text-gray-700 dark:text-gray-300">{company.created}</span></p>
                      <p>Last Login: <span className="font-medium text-gray-700 dark:text-gray-300">{company.lastLogin}</span></p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2.5">
                      <button onClick={() => openModal('view', company)} title="View Company" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400 rounded-lg transition-colors focus:outline-none">
                        <Eye className="w-[18px] h-[18px]" />
                      </button>
                      <button onClick={() => openModal('edit', company)} title="Edit Details" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400 rounded-lg transition-colors focus:outline-none">
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                      <button onClick={() => openModal('subscription', company)} title="Manage Subscription" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400 rounded-lg transition-colors focus:outline-none">
                        <CreditCard className="w-[18px] h-[18px]" />
                      </button>
                      <button onClick={() => openModal('reset-password', company)} title="Reset Password" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400 rounded-lg transition-colors focus:outline-none">
                        <Key className="w-[18px] h-[18px]" />
                      </button>
                      
                      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                      
                      {company.status === 'Active' ? (
                        <button onClick={() => openModal('deactivate', company)} title="Deactivate Company" className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 dark:hover:text-red-400 rounded-lg transition-colors focus:outline-none">
                          <Ban className="w-[18px] h-[18px]" />
                        </button>
                      ) : (
                        <button onClick={() => openModal('activate', company)} title="Activate Company" className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-700 dark:hover:text-emerald-400 rounded-lg transition-colors focus:outline-none">
                          <CheckCircle2 className="w-[18px] h-[18px]" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          
          {/* VIEW COMPANY MODAL */}
          {activeModal === 'view' && selectedCompanyData?.company && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" /> View Company Details
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCompanyData.company.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company Code</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCompanyData.company.code}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Head Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCompanyData.company.head_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Head Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCompanyData.company.head_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCompanyData.company.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Created At</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCompanyData.company.created_at}</p>
                  </div>
                </div>
                
                {selectedCompanyData.subscription && (
                  <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Subscription Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><span className="font-semibold">Plan:</span> {selectedCompanyData.subscription.plan_name}</p>
                      <p><span className="font-semibold">Expiry:</span> {selectedCompanyData.subscription.end_date}</p>
                      <p><span className="font-semibold">Status:</span> {selectedCompanyData.subscription.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EDIT COMPANY MODAL */}
          {activeModal === 'edit' && selectedCompanyData?.company && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-500" /> Edit Company
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                    <input type="text" value={selectedCompanyData.company.name || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, company: {...selectedCompanyData.company, name: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Type</label>
                    <select value={selectedCompanyData.company.company_type || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, company: {...selectedCompanyData.company, company_type: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required>
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Industry</label>
                    <input type="text" value={selectedCompanyData.company.industry || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, company: {...selectedCompanyData.company, industry: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">GST Number</label>
                    <input type="text" value={selectedCompanyData.company.gst_number || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, company: {...selectedCompanyData.company, gst_number: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Head Name</label>
                    <input type="text" value={selectedCompanyData.company.head_name || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, company: {...selectedCompanyData.company, head_name: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Head Email</label>
                    <input type="email" value={selectedCompanyData.company.head_email || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, company: {...selectedCompanyData.company, head_email: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBSCRIPTION MODAL */}
          {activeModal === 'subscription' && selectedCompanyData?.subscription && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" /> Manage Subscription
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubscriptionSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Plan Name</label>
                  <select value={selectedCompanyData.subscription.plan_name || 'Basic'} onChange={e => setSelectedCompanyData({...selectedCompanyData, subscription: {...selectedCompanyData.subscription, plan_name: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required>
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select value={selectedCompanyData.subscription.status || 'Active'} onChange={e => setSelectedCompanyData({...selectedCompanyData, subscription: {...selectedCompanyData.subscription, status: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">End Date (Expiry)</label>
                  <input type="date" value={selectedCompanyData.subscription.end_date || ''} onChange={e => setSelectedCompanyData({...selectedCompanyData, subscription: {...selectedCompanyData.subscription, end_date: e.target.value}})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm [color-scheme:light] dark:[color-scheme:dark]" required />
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Update Subscription'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RESET PASSWORD MODAL */}
          {activeModal === 'reset-password' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-500" /> Reset Password
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Set a new password for the company head account.</p>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <input type="text" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Minimum 6 characters" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" required minLength={6} />
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting || passwordInput.length < 6} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                    <Check className="w-4 h-4" /> {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STATUS MODAL (Deactivate/Activate) */}
          {(activeModal === 'deactivate' || activeModal === 'activate') && selectedCompanyId && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${activeModal === 'deactivate' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {activeModal === 'deactivate' ? <Ban className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                {activeModal === 'deactivate' ? 'Deactivate Company' : 'Activate Company'}
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-left whitespace-pre-wrap">
                {activeModal === 'deactivate' 
                  ? "Are you sure you want to deactivate this company?\n\n• Company cannot log in.\n• Company users cannot access the platform.\n• Company data remains intact.\n• Company can be reactivated anytime."
                  : "Are you sure you want to activate this company?"}
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button onClick={() => handleStatusUpdate(selectedCompanyId, activeModal === 'deactivate' ? 'Inactive' : 'Active')} disabled={isSubmitting} className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-colors ${activeModal === 'deactivate' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isSubmitting ? 'Processing...' : (activeModal === 'deactivate' ? 'Deactivate' : 'Activate')}
                </button>
              </div>
            </div>
          )}

          {/* IMPORT PREVIEW MODAL */}
          {activeModal === 'import_preview' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Import Preview</h3>
                  <p className="text-xs text-gray-500">Review the extracted data before confirming.</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Company Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Head Name</th>
                        <th className="px-4 py-3">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {importPreviewData.map((row, idx) => (
                        <tr key={idx} className={row.isValid ? '' : 'bg-red-50/50 dark:bg-red-900/10'}>
                          <td className="px-4 py-3">
                            {row.isValid ? 
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Valid</span> : 
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">Invalid</span>
                            }
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.data['Company Name'] || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.data['Company Email'] || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.data['Company Head Name'] || '-'}</td>
                          <td className="px-4 py-3 text-red-600 text-xs font-medium">
                            {row.errors.map((err: string, eIdx: number) => (
                              <div key={eIdx}>• {err}</div>
                            ))}
                          </td>
                        </tr>
                      ))}
                      {importPreviewData.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No data found in the uploaded file.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">Cancel</button>
                <button 
                  onClick={handleImportConfirm} 
                  disabled={isSubmitting || !importPreviewData.some(r => r.isValid)} 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Importing...' : `Import Valid Rows (${importPreviewData.filter(r => r.isValid).length})`}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

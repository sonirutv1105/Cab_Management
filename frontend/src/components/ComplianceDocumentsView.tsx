import React, { useState, useRef, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { Vendor, ComplianceDoc } from '../types';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import VendorForm from './vendors/VendorForm';

interface Props {
  activeSection: 'vendors' | 'compliance';
}

export default function ComplianceDocumentsView({ activeSection }: Props) {
  const {
    vendors,
    complianceDocs,
    addVendor,
    updateVendor,
    deleteVendor,
    addComplianceDoc,
    deleteComplianceDoc,
    currentUser
  } = useCMS();

  const isReadOnly = currentUser.role === 'government';

  // State configurations
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Simple modal open close
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null);

  // Vendor Fleet Management View State
  const [managingFleetVendor, setManagingFleetVendor] = useState<Vendor | null>(null);
  const [vendorVehicles, setVendorVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const handleViewFleet = async (vendor: Vendor) => {
    setManagingFleetVendor(vendor);
    setLoadingVehicles(true);
    try {
      const data = await api.getVendorVehicles(vendor.id);
      setVendorVehicles(data);
    } catch (err) {
      toast.error('Failed to fetch vehicles for vendor');
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Form parameters
  const [vendorForm, setVendorForm] = useState<Omit<Vendor, 'id'>>({
    name: '', contactName: '', phone: '', altPhone: '', email: '', 
    address: '', city: '', state: '', country: '', pinCode: '', 
    website: '', gstNumber: '',
    fleetSize: '' as any, rating: 5.0, slaCompliance: 100.0, status: 'Active'
  });
  const [complianceForm, setComplianceForm] = useState<Omit<ComplianceDoc, 'id'>>({
    entityId: '', entityType: 'Vehicle', documentType: 'PUC', documentNumber: '', expiryDate: '', status: 'Valid'
  });

  // Handle forms submits
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSection === 'compliance') {
      const newC: Partial<ComplianceDoc> = {
        ...complianceForm,
        entityId: complianceForm.entityId as number
      };
      if (editingVendorId) {
        toast.success("Compliance Document updated successfully!");
      } else {
        await addComplianceDoc(newC);
        toast.success("Compliance Document added successfully!");
      }
      setModalOpen(false);
      setEditingVendorId(null);
    }
  };

  const handleVendorSubmit = async (payload: any) => {
    if (editingVendorId) {
      await updateVendor(editingVendorId, payload);
      toast.success("Vendor updated successfully!");
    } else {
      await addVendor(payload);
      toast.success("Vendor added successfully!");
    }
    setModalOpen(false);
    setEditingVendorId(null);
  };

  // Export functionality
  const handleExportCSV = () => {
    try {
      let csv = '';
      if (activeSection === 'vendors') {
        const headers = ['Vendor Name', 'Contact Person', 'Email', 'Phone', 'Fleet Size', 'SLA', 'Rating', 'Status'];
        csv += headers.join(',') + '\n';
        vendors.forEach(v => {
          csv += `"${v.name}","${v.contactName}","${v.email || ''}","${v.phone || ''}","${v.fleetSize}","${v.slaCompliance}%","${v.rating}","${v.status}"\n`;
        });
      } else {
        const headers = ['Doc ID', 'Entity Type', 'Entity ID', 'Doc Type', 'Doc Number', 'Expiry Date', 'Status'];
        csv += headers.join(',') + '\n';
        complianceDocs.forEach(c => {
          csv += `"${c.id}","${c.entityType}","${c.entityId}","${c.documentType}","${c.documentNumber}","${c.expiryDate}","${c.status}"\n`;
        });
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeSection}_export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export data.");
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="compliance-documents-panel">
      {/* HEADER SECTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          {activeSection === 'vendors' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Briefcase className="w-5.5 h-5.5 text-blue-600" />
                <span>Vendor Management</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage vendor profiles, contact information, fleet details, SLA compliance, ratings, and performance.</p>
            </>
          )}
          {activeSection === 'compliance' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                <span>Compliance & Documents</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Track vehicle PUC, insurances, driver licenses, and background check renewals.</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-1">
                  <button onClick={() => { handleExportCSV(); setExportMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Export CSV</button>
                  <button onClick={() => { setExportMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Export PDF</button>
                </div>
              </div>
            )}
          </div>
          {!isReadOnly && (
            <button
              onClick={() => {
                if (activeSection === 'vendors') {
                  setVendorForm({
                    name: '', contactName: '', phone: '', altPhone: '', email: '', 
                    address: '', city: '', state: '', country: '', pinCode: '', 
                    website: '', gstNumber: '',
                    fleetSize: '' as any, rating: 5.0, slaCompliance: 100.0, status: 'Active'
                  });
                  setEditingVendorId(null);
                  setModalOpen(true);
                } else {
                  setComplianceForm({
                    entityId: '', entityType: 'Vehicle', documentType: 'PUC', documentNumber: '', expiryDate: '', status: 'Valid'
                  });
                  setEditingVendorId(null);
                  setModalOpen(true);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {activeSection === 'vendors' ? 'Add Vendor' : 'Add Document'}
            </button>
          )}
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeSection === 'vendors' ? "Search vendors by name, contact, phone..." : "Search documents by ID, number, entity..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none font-medium text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">All Statuses</option>
            {activeSection === 'vendors' ? (
              <>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </>
            ) : (
              <>
                <option value="Valid">Valid</option>
                <option value="Expiring">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* DATA TABLES SECTION */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        
        {/* VENDORS VIEW */}
        {activeSection === 'vendors' && (
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-700 border-b text-gray-500 dark:text-gray-400 font-bold uppercase">
                <th className="p-3.5">Vendor Agency</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Fleet Size</th>
                <th className="p-3.5">SLA Compliance</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700 dark:text-gray-300">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 duration-150">
                  <td className="p-3.5 font-bold text-gray-900 dark:text-gray-100">{v.name}</td>
                  <td className="p-3.5 text-gray-800 dark:text-gray-200">{v.contactName}</td>
                  <td className="p-3.5 leading-normal text-slate-500 dark:text-gray-400">
                    {(!v.email && !v.phone) ? (
                      <span className="inline-flex px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded text-[10px] font-bold">Not Available</span>
                    ) : (
                      <>
                        {v.email && <div>Email: <span className="font-medium text-gray-800 dark:text-gray-200">{v.email}</span></div>}
                        {v.phone && <div className="font-mono text-[10px] mt-0.5">Phone: <span className="font-medium text-gray-800 dark:text-gray-200">{v.phone}</span></div>}
                      </>
                    )}
                  </td>
                  <td className="p-3.5">
                    <button 
                      onClick={() => handleViewFleet(v)}
                      className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      {v.fleetSize} {v.fleetSize === 1 ? 'Cab' : 'Cabs'}
                    </button>
                  </td>
                  <td className="p-3.5 text-emerald-700 font-black">{v.slaCompliance}% compliant</td>
                  <td className="p-3.5">★ {v.rating.toFixed(1)} / 5.0</td>
                  <td className="p-3.5 text-right font-semibold">
                    <button
                      onClick={() => handleViewFleet(v)}
                      disabled={isReadOnly}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-emerald-600 rounded mr-2"
                      title="View Vendor Fleet"
                    >
                      <Briefcase className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingVendorId(v.id); setVendorForm(v); setModalOpen(true); }}
                      disabled={isReadOnly}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 rounded mr-2"
                      title="Edit Vendor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteVendor(v.id)}
                      disabled={isReadOnly}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* COMPLIANCE VIEW */}
        {activeSection === 'compliance' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-700 border-b text-gray-500 dark:text-gray-400 font-bold uppercase">
                <th className="p-3.5">Doc ID</th>
                <th className="p-3.5">Assigned Cab / Driver</th>
                <th className="p-3.5">Document Type</th>
                <th className="p-3.5">Document Number</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700 dark:text-gray-300">
              {complianceDocs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 duration-150">
                  <td className="p-3.5 font-bold font-mono text-gray-400 dark:text-gray-500 uppercase">{c.id}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{c.entityType}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">ID: {c.entityId}</div>
                  </td>
                  <td className="p-3.5 text-blue-600 font-bold">{c.documentType}</td>
                  <td className="p-3.5 font-mono text-gray-800 dark:text-gray-200">{c.documentNumber}</td>
                  <td className="p-3.5 text-yellow-700 font-bold">{c.expiryDate}</td>
                  <td className="p-3.5 text-center">
                    {c.status === 'Valid' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 dark:bg-green-900/30 text-green-700 border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Valid
                      </span>
                    ) : c.status === 'Expiring' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 border border-yellow-200">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 dark:bg-red-900/30 text-red-700 border border-red-200 dark:border-red-800 animate-pulse">
                        <XCircle className="w-3 h-3 mr-1" /> Expired
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-semibold">
                    <button
                      onClick={() => deleteComplianceDoc(c.id)}
                      disabled={isReadOnly}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* NEW/EDIT MODALS */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                {activeSection === 'vendors' ? (
                  <><Briefcase className="w-5 h-5 text-blue-600" /><span>{editingVendorId ? 'Edit Vendor Profile' : 'Add New Vendor'}</span></>
                ) : (
                  <><ShieldCheck className="w-5 h-5 text-blue-600" /><span>{editingVendorId ? 'Edit Compliance Document' : 'Add Compliance Document'}</span></>
                )}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50">
              {activeSection === 'vendors' ? (
                <VendorForm 
                  initialData={vendorForm} 
                  onSuccess={handleVendorSubmit} 
                  onBack={() => setModalOpen(false)} 
                />
              ) : (
                <form onSubmit={handleAddSubmit} className="p-8 max-w-3xl mx-auto space-y-6">
                  {/* ... compliance form (keep simple for now) */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 uppercase tracking-wider">Entity Type</label>
                      <select 
                        value={complianceForm.entityType} 
                        onChange={e => setComplianceForm({...complianceForm, entityType: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Vehicle">Vehicle</option>
                        <option value="Driver">Driver</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 uppercase tracking-wider">Entity ID / Registration</label>
                      <input 
                        type="text" 
                        value={complianceForm.entityId} 
                        onChange={e => setComplianceForm({...complianceForm, entityId: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 uppercase tracking-wider">Document Type</label>
                      <select 
                        value={complianceForm.documentType} 
                        onChange={e => setComplianceForm({...complianceForm, documentType: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PUC">PUC (Pollution)</option>
                        <option value="Insurance">Insurance</option>
                        <option value="License">Driving License</option>
                        <option value="Registration">RC Book</option>
                        <option value="Permit">State Permit</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 uppercase tracking-wider">Document Number</label>
                      <input 
                        type="text" 
                        value={complianceForm.documentNumber} 
                        onChange={e => setComplianceForm({...complianceForm, documentNumber: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 uppercase tracking-wider">Expiry Date</label>
                      <input 
                        type="date" 
                        value={complianceForm.expiryDate} 
                        onChange={e => setComplianceForm({...complianceForm, expiryDate: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 uppercase tracking-wider">Status</label>
                      <select 
                        value={complianceForm.status} 
                        onChange={e => setComplianceForm({...complianceForm, status: e.target.value as 'Valid'|'Expired'|'Expiring'})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Valid">Valid</option>
                        <option value="Expiring">Expiring Soon</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancel</button>
                    <button type="submit" className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">Save Document</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VENDOR FLEET MODAL */}
      {managingFleetVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span>{managingFleetVendor.name} - Assigned Vehicles</span>
              </h3>
              <button 
                onClick={() => setManagingFleetVendor(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 p-6">
              {loadingVehicles ? (
                <div className="text-center py-10 text-gray-500 font-bold">Loading vehicles...</div>
              ) : vendorVehicles.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-bold">No vehicles assigned to this vendor.</div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-gray-700 border-b text-gray-500 dark:text-gray-400 font-bold uppercase">
                        <th className="p-3">Vehicle Number</th>
                        <th className="p-3">Name/Model</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Driver Name</th>
                        <th className="p-3">Capacity</th>
                        <th className="p-3">Fuel</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Insurance Exp</th>
                        <th className="p-3">RC Exp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-gray-700 dark:text-gray-300">
                      {vendorVehicles.map(vh => (
                        <tr key={vh.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 duration-150">
                          <td className="p-3 font-bold text-gray-900 dark:text-gray-100">{vh.plateNumber}</td>
                          <td className="p-3">{vh.model}</td>
                          <td className="p-3">{vh.make}</td>
                          <td className="p-3">{vh.vehicleType}</td>
                          <td className="p-3">{vh.driver_name || 'Unassigned'}</td>
                          <td className="p-3 text-center">{vh.seatingCapacity}</td>
                          <td className="p-3">{vh.fuelType}</td>
                          <td className="p-3">{vh.status}</td>
                          <td className="p-3 text-red-600">{vh.insuranceExpiry || 'N/A'}</td>
                          <td className="p-3 text-red-600">N/A</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { Vendor, ComplianceDoc } from '../types';
import { api } from '../api/client';
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

  // Form parameters
  const [vendorForm, setVendorForm] = useState<Omit<Vendor, 'id'>>({
    name: '', contactName: '', phone: '', email: '', fleetSize: '' as any, rating: 5.0, slaCompliance: 100.0, status: 'Active'
  });

  const [complianceForm, setComplianceForm] = useState<Omit<ComplianceDoc, 'id'>>({
    entityId: '', entityType: 'Vehicle', documentType: 'PUC', documentNumber: '', expiryDate: '', status: 'Valid'
  });

  // Handle forms submits
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (activeSection === 'vendors') {
      if (Number(vendorForm.fleetSize) <= 0) {
        alert("Fleet Size must be greater than 0.");
        return;
      }
      if (editingVendorId) {
        updateVendor({ ...vendorForm, id: editingVendorId } as Vendor);
      } else {
        addVendor(vendorForm as any);
      }
      setEditingVendorId(null);
      setVendorForm({ name: '', contactName: '', phone: '', email: '', fleetSize: '' as any, rating: 5.0, slaCompliance: 100.0, status: 'Active' });
    } else if (activeSection === 'compliance') {
      addComplianceDoc(complianceForm);
    }
    setModalOpen(false);
  };

  // Filter processed data
  const processedVendors = vendors.filter((v) => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
  const processedCompliance = complianceDocs.filter((c) => c.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || c.documentType.toLowerCase().includes(searchTerm.toLowerCase()));

  // CSV exports handlers
  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportMenuOpen(false);
    
    let payload;
    let filename = '';

    if (activeSection === 'vendors') {
      payload = {
        title: "Vendors Data",
        headers: ['Vendor ID', 'Company Name', 'Contact', 'Phone', 'Email', 'Fleet count', 'SLA compliance (%)', 'Status'],
        rows: processedVendors.map((v) => [v.id, v.name, v.contactName, v.phone, v.email, v.fleetSize, v.slaCompliance, v.status])
      };
      filename = `CMS_Vendors_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    } else if (activeSection === 'compliance') {
      payload = {
        title: "Compliance Docs",
        headers: ['Compliance ID', 'Type', 'Document Type', 'Document Code', 'Expiry', 'Status'],
        rows: processedCompliance.map((c) => [c.id, c.entityType, c.documentType, c.documentNumber, c.expiryDate, c.status])
      };
      filename = `CMS_ComplianceDocs_Export.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    }

    try {
      let blob;
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6" id="compliance-documents-panel">
      {/* HEADER SECTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          {activeSection === 'vendors' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Briefcase className="w-5.5 h-5.5 text-blue-600" />
                <span>Logistics Vendors</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage vendors, rating metrics, fleet sizes, and contract details</p>
            </>
          )}
          {activeSection === 'compliance' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                <span>Compliance Documents</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Track cab documents (PUC, RC, Fitness Certificate) and driver verifications</p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
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

          {!isReadOnly && (
            <button
              onClick={() => {
                setEditingVendorId(null);
                setVendorForm({ name: '', contactName: '', phone: '', email: '', fleetSize: '' as any, rating: 5.0, slaCompliance: 100.0, status: 'Active' });
                setModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              id="compliance-docs-add-trigger"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          )}
        </div>
      </div>

      <div className="pb-2">
        <div className="relative max-w-sm">
          <Search className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-gray-700 pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none"
            id="compliance-module-search"
          />
        </div>
      </div>

      {/* DYNAMIC SUBMODULE DATA TABLES */}
      <div className="overflow-x-auto border rounded-xl border-gray-100 dark:border-gray-700">

        {activeSection === 'vendors' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-700 border-b text-gray-500 dark:text-gray-400 font-bold uppercase">
                <th className="p-3.5">Vendor Agency</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Fleet Size</th>
                <th className="p-3.5">SLA Compliance</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700 dark:text-gray-300">
              {processedVendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 duration-150">
                  <td className="p-3.5 font-bold text-gray-900 dark:text-gray-100">{v.name}</td>
                  <td className="p-3.5 text-gray-800 dark:text-gray-200">{v.contactName}</td>
                  <td className="p-3.5 leading-normal text-slate-500 dark:text-gray-400">
                    <div>{v.email}</div>
                    <div className="font-mono text-[10px] mt-0.5">{v.phone}</div>
                  </td>
                  <td className="p-3.5 font-extrabold text-blue-600">{v.fleetSize} {v.fleetSize === 1 ? 'Cab' : 'Cabs'}</td>
                  <td className="p-3.5 text-emerald-700 font-black">{v.slaCompliance}% compliant</td>
                  <td className="p-3.5">★ {v.rating.toFixed(1)} / 5.0</td>
                  <td className="p-3.5 text-right font-semibold">
                    <button
                      onClick={() => { setEditingVendorId(v.id); setVendorForm(v); setModalOpen(true); }}
                      disabled={isReadOnly}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 rounded mr-2"
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
              {processedCompliance.map((c) => (
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

      {/* COMPREHENSIVE SUB-MODULE CREATION DIALOGS */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border max-w-md w-full animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 border-b pb-3 mb-4">{editingVendorId ? 'Edit Vendor' : 'Add New Entry'}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">

              {activeSection === 'vendors' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Vendor Name</label>
                    <input
                      type="text"
                      className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700"
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Fleet Size *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full text-xs border p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700"
                        value={vendorForm.fleetSize}
                        onChange={(e) => setVendorForm({ ...vendorForm, fleetSize: parseInt(e.target.value) || ('' as any) })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Contact Person Name</label>
                      <input
                        type="text"
                        className="w-full text-xs border p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700"
                        value={vendorForm.contactName}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">SLA Compliance Target (%)</label>
                      <input
                        type="number"
                        className="w-full text-xs border p-2.5"
                        value={vendorForm.slaCompliance}
                        onChange={(e) => setVendorForm({ ...vendorForm, slaCompliance: parseFloat(e.target.value) || 100 })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'compliance' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Document Type</label>
                    <select
                      className="w-full text-xs border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700"
                      value={complianceForm.documentType}
                      onChange={(e) => setComplianceForm({ ...complianceForm, documentType: e.target.value as any })}
                    >
                      <option value="PUC">PUC Certificate</option>
                      <option value="Commercial Permit">Commercial Permit</option>
                      <option value="Fitness Certificate">Fitness Certificate</option>
                      <option value="Police Verification">Police Verification Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Document Number</label>
                    <input
                      type="text"
                      className="w-full text-xs border rounded-lg p-2.5"
                      value={complianceForm.documentNumber}
                      onChange={(e) => setComplianceForm({ ...complianceForm, documentNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full text-xs border p-2"
                        value={complianceForm.expiryDate}
                        onChange={(e) => setComplianceForm({ ...complianceForm, expiryDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Status</label>
                      <select
                        className="w-full text-xs border p-2"
                        value={complianceForm.status}
                        onChange={(e) => setComplianceForm({ ...complianceForm, status: e.target.value as any })}
                      >
                        <option value="Valid">Valid / Confirmed</option>
                        <option value="Expiring">Expiring</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingVendorId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  {editingVendorId ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

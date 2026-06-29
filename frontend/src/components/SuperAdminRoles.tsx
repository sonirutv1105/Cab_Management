import React, { useState, useEffect } from 'react';
import { Save, ShieldAlert, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

export default function SuperAdminRoles() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const actions = ['view', 'create', 'update', 'delete', 'import', 'export'];
  const actionLabels: Record<string, string> = {
    view: 'View',
    create: 'Create',
    update: 'Edit',
    delete: 'Delete',
    import: 'Import',
    export: 'Export'
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId && selectedRole) {
      fetchPermissions();
    } else {
      setPermissions([]);
    }
  }, [selectedCompanyId, selectedRole]);

  const fetchCompanies = async () => {
    try {
      const data = await api.getSuperAdminCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to fetch companies');
    }
  };

  const fetchPermissions = async () => {
    if (!selectedCompanyId || !selectedRole) return;
    try {
      setLoading(true);
      const perms = await api.getMatrixPermissions(Number(selectedCompanyId), selectedRole);
      setPermissions(perms);
    } catch (error) {
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (module: string, action: string) => {
    setPermissions(prev => prev.map(p => 
      (p.module === module && p.action === action) ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleSavePermissions = async () => {
    if (isSaving) return;
    if (!selectedCompanyId || !selectedRole) {
      toast.error("Please select a company and role first.");
      return;
    }

    try {
      setIsSaving(true);
      const updatedPerms = await api.updateMatrixPermissions(Number(selectedCompanyId), selectedRole, permissions);
      setPermissions(updatedPerms);
      toast.success('Permissions saved successfully');
    } catch (error) {
      toast.error('Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamically extract modules from the backend's fully-populated response
  const dynamicModules = Array.from(new Set(permissions.map(p => p.module))).map(id => {
    let name = String(id).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (id === 'reports_analytics') name = 'Reports & Analytics';
    if (id === 'user_roles') name = 'User Management';
    return { id: String(id), name };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Permission Matrix Management</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Select a company and a predefined role below to configure exactly which modules and actions are available. Changes take effect immediately.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Select Company --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Predefined Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Select Role --</option>
              <option value="company_head">Company Head</option>
              <option value="company_hr">Company HR</option>
            </select>
          </div>
        </div>
      </div>

      {(!selectedCompanyId || !selectedRole) ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500">
          Please select a Company and a Role to view and edit permissions.
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500">
          Loading matrix...
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 dark:border-gray-700 gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Permissions for {selectedRole === 'company_head' ? 'Company Head' : 'Company HR'}</h3>
            <button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Permissions'}</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">Module</th>
                  {actions.map(action => (
                    <th key={action} className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 text-center">
                      {actionLabels[action]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dynamicModules.map(module => (
                  <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {module.name}
                    </td>
                    {actions.map(action => {
                      const perm = permissions.find(p => p.module === module.id && p.action === action);
                      return (
                        <td key={`${module.id}-${action}`} className="px-6 py-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600"
                              checked={perm?.enabled || false}
                              onChange={() => togglePermission(module.id, action)}
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

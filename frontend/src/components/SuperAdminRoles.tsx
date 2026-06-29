import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Key, Check, X, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

export default function SuperAdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });

  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');

  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);

  const defaultModules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'driver_management', name: 'Driver Management' },
    { id: 'vehicle_management', name: 'Vehicle Management' },
    { id: 'trip_management', name: 'Trip Management' },
    { id: 'vendor_management', name: 'Vendor Management' },
    { id: 'booking_management', name: 'Booking Management' },
    { id: 'live_tracking', name: 'Live Tracking' },
    { id: 'fuel_management', name: 'Fuel Management' },
    { id: 'maintenance_management', name: 'Maintenance Management' },
    { id: 'compliance_management', name: 'Compliance Management' },
    { id: 'contract_management', name: 'Contract Management' },
    { id: 'reports_analytics', name: 'Reports & Analytics' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'support_tickets', name: 'Support Tickets' },
    { id: 'audit_logs', name: 'Audit Logs' },
    { id: 'company_settings', name: 'Company Settings' },
    { id: 'user_roles', name: 'User & Roles' }
  ];

  const actions = ['view', 'create', 'update', 'delete', 'export', 'import', 'approve'];

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const data = await api.getSuperAdminCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to fetch companies');
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api.getSuperAdminRoles(selectedCompanyId || undefined);
      setRoles(data);
    } catch (error) {
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.updateSuperAdminRole(editingRole.id, roleFormData);
        toast.success('Role updated');
      } else {
        await api.createSuperAdminRole({ ...roleFormData, company_id: selectedCompanyId || undefined });
        toast.success('Role created');
      }
      setIsRoleModalOpen(false);
      fetchRoles();
    } catch (error) {
      toast.error('Failed to save role');
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.deleteSuperAdminRole(id);
        toast.success('Role deleted');
        fetchRoles();
      } catch (error) {
        toast.error('Failed to delete role');
      }
    }
  };

  const openPermissions = async (role: any) => {
    setSelectedRole(role);
    setIsPermsModalOpen(true);
    try {
      const perms = await api.getSuperAdminRolePermissions(role.id);
      
      // Map existing permissions into our UI state
      const mappedPerms = defaultModules.flatMap(m => 
        actions.map(a => {
          const exists = perms.find((p: any) => p.module === m.id && p.action === a);
          return {
            module: m.id,
            action: a,
            enabled: !!exists
          };
        })
      );
      setPermissions(mappedPerms);
    } catch (error) {
      toast.error('Failed to load permissions');
    }
  };

  const togglePermission = (module: string, action: string) => {
    setPermissions(prev => prev.map(p => 
      (p.module === module && p.action === action) ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await api.updateSuperAdminRolePermissions(selectedRole.id, permissions);
      toast.success('Permissions saved successfully');
      setIsPermsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save permissions');
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
        <button
          onClick={() => { setEditingRole(null); setRoleFormData({name:'', description:''}); setIsRoleModalOpen(true); }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Role</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {loading ? (
             <div className="col-span-full text-center text-gray-500 py-8">Loading roles...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">No roles found.</div>
          ) : (
            filteredRoles.map(role => (
              <div key={role.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center">
                      <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingRole(role); setRoleFormData({name: role.name, description: role.description}); setIsRoleModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRole(role.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{role.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 h-10">
                    {role.description || 'No description provided'}
                  </p>
                  <button 
                    onClick={() => openPermissions(role)}
                    className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Manage Permissions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
                <input type="text" required value={roleFormData.name} onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={3} value={roleFormData.description} onChange={e => setRoleFormData({...roleFormData, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermsModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2 text-blue-600" />
                  Permissions Matrix: {selectedRole.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Configure granular access across modules</p>
              </div>
              <button onClick={() => setIsPermsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 bg-gray-50 dark:bg-gray-900/50">
              <table className="w-full text-left bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Module</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">View</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">Create</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">Update</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {defaultModules.map(module => (
                    <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{module.name}</td>
                      {actions.map(action => {
                        const isEnabled = permissions.find(p => p.module === module.id && p.action === action)?.enabled;
                        return (
                          <td key={action} className="px-6 py-4 text-center">
                            <button
                              onClick={() => togglePermission(module.id, action)}
                              className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${
                                isEnabled 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-transparent hover:border-blue-400'
                              }`}
                            >
                              <Check className={`w-4 h-4 ${isEnabled ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 shrink-0 flex justify-end space-x-3 bg-white dark:bg-gray-800">
              <button onClick={() => setIsPermsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">Cancel</button>
              <button onClick={handleSavePermissions} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700">Save Permissions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

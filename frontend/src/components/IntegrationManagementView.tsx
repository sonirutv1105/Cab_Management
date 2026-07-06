import React, { useState, useEffect } from 'react';
import { useCMS } from '../context/CMSContext';
import { PlusCircle, Key, Trash2, Power, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

const apiCall = async (url: string, options: any = {}) => {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body) : undefined;
  // Make sure url doesn't double /api/api if baseURL is /api
  const finalUrl = url.startsWith('/api') ? url.replace('/api', '') : url;
  const res = await apiClient.request({ url: finalUrl, method, data });
  return res.data;
};

export default function IntegrationManagementView() {
  const { hasPermission, currentUser } = useCMS();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'integrations' | 'logs'>('integrations');
  const [apiLogs, setApiLogs] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'integrations') fetchIntegrations();
    else fetchApiLogs();
  }, [activeTab]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/api/v1/integrations', { method: 'GET' });
      setIntegrations(res);
    } catch (error: any) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchApiLogs = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/api/v1/integrations/logs', { method: 'GET' });
      setApiLogs(res);
    } catch (error: any) {
      toast.error('Failed to load API logs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newIntegrationName.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await apiCall('/api/v1/integrations', {
        method: 'POST',
        body: JSON.stringify({ name: newIntegrationName }),
      });
      toast.success('Integration created successfully');
      setShowCreateModal(false);
      setNewIntegrationName('');
      fetchIntegrations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create integration');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await apiCall(`/api/v1/integrations/${id}/status`, { method: 'PUT' });
      toast.success(res.message || 'Status updated');
      fetchIntegrations();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleRegenerateKeys = async (id: number) => {
    if (!window.confirm('Are you sure you want to regenerate keys? This will break existing integrations.')) {
      return;
    }
    try {
      await apiCall(`/api/v1/integrations/${id}/regenerate`, { method: 'POST' });
      toast.success('Keys regenerated successfully');
      fetchIntegrations();
    } catch (error: any) {
      toast.error('Failed to regenerate keys');
    }
  };

  const toggleShowSecret = (id: number) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!hasPermission('company_settings', 'view') || currentUser?.role !== 'company_admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500 font-medium">You do not have permission to access integrations.</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your API keys and external booking integrations.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
        >
          <PlusCircle size={20} />
          <span>New Integration</span>
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'integrations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          API Integrations
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          API Audit Logs
        </button>
      </div>

      {activeTab === 'integrations' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading integrations...</div>
        ) : integrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No integrations found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">API Key</th>
                  <th className="p-4 font-semibold">API Secret</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="p-4 font-medium">{integration.name}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          integration.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{integration.api_key}</td>
                    <td className="p-4 font-mono text-sm flex items-center space-x-2">
                      <span>{showSecrets[integration.id] ? integration.api_secret : '••••••••••••••••••••••••••••••••'}</span>
                      <button onClick={() => toggleShowSecret(integration.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showSecrets[integration.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleRegenerateKeys(integration.id)}
                          className="text-amber-500 hover:text-amber-600 transition"
                          title="Regenerate Keys"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(integration.id)}
                          className={`${integration.is_active ? 'text-red-500' : 'text-green-500'} hover:opacity-80 transition`}
                          title={integration.is_active ? 'Disable' : 'Enable'}
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading API logs...</div>
          ) : apiLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No API logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-4 font-semibold">Timestamp</th>
                    <th className="p-4 font-semibold">Integration</th>
                    <th className="p-4 font-semibold">Endpoint</th>
                    <th className="p-4 font-semibold">Method</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Response</th>
                    <th className="p-4 font-semibold">Speed</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {apiLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {new Date(log.created_at + 'Z').toLocaleString()}
                      </td>
                      <td className="p-4 font-medium">{log.integration_id || 'Unknown'}</td>
                      <td className="p-4 font-mono text-xs">{log.endpoint}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold">{log.method}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          log.status_code >= 200 && log.status_code < 300 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="p-4 text-xs max-w-xs truncate" title={log.response}>{log.response}</td>
                      <td className="p-4 text-xs text-gray-500">{(log.processing_time * 1000).toFixed(1)}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create Integration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Integration Name</label>
                <input
                  type="text"
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  placeholder="e.g. ABC Cab Website"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

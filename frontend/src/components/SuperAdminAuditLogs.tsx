import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { History, Download } from 'lucide-react';

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getSuperAdminAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAudit = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,User Name,Email,Role,Company Name,Event Type,IP Address,Device/Browser,Status\n"
      + logs.map(l => 
          `"${l.timestamp}","${l.userName}","${l.email}","${l.role}","${l.companyName}","${l.eventType}","${l.ipAddress}","${l.device}","${l.status}"`
        ).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SuperAdmin_Audit_Logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>Audit Logs</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor user authentication and platform access
          </p>
        </div>

        <button
          onClick={exportAudit}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
              <th className="p-4">Timestamp</th>
              <th className="p-4">User Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Company Name</th>
              <th className="p-4">Event Type</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">Device / Browser</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  No authentication logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{log.timestamp}</td>
                  <td className="p-4 font-medium">{log.userName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{log.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{log.companyName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      log.eventType.includes('Failed') 
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{log.ipAddress}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={log.device}>{log.device}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      log.status === 'Success'
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

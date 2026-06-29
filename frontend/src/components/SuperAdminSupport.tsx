import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Send, Paperclip, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import api from '../api/client';

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  attachments?: any[];
}

interface SupportTicket {
  id: number;
  ticket_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  messages?: TicketMessage[];
}

export default function SuperAdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Reply State
  const [replyMessage, setReplyMessage] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/support/tickets');
      setTickets(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    
    try {
      const res = await api.post(`/super-admin/support/tickets/${selectedTicket.id}/reply`, { message: replyMessage });
      
      const updatedTicket = { ...selectedTicket };
      updatedTicket.messages = [...(updatedTicket.messages || []), res.data];
      updatedTicket.status = "Waiting for Customer";
      setSelectedTicket(updatedTicket);
      
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setReplyMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send reply');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/super-admin/support/tickets/${selectedTicket.id}`, { status });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? res.data : t));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/super-admin/support/tickets/${selectedTicket.id}`, { priority });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? res.data : t));
    } catch (err) {
      console.error(err);
      alert('Failed to update priority');
    }
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/super-admin/support/tickets/${ticket.id}`);
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => t.id === ticket.id ? res.data : t));
    } catch (err) {
      console.error("Error fetching ticket details", err);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(ticket.company_id).includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'In Progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Waiting for Customer': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Waiting for Support': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800';
      case 'High': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
      case 'Medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'Low': return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Support Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and resolve support tickets across all companies.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, Company ID, or Subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Support">Waiting for Support</option>
            <option value="Waiting for Customer">Waiting for Customer</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p>No support tickets found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => openTicket(ticket)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">{ticket.ticket_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 dark:text-gray-400">#{ticket.company_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-300 font-medium truncate block max-w-xs">{ticket.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail & Conversation Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{selectedTicket.ticket_id}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-500">Company ID: <strong className="text-gray-700 dark:text-gray-300">{selectedTicket.company_id}</strong></span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{selectedTicket.subject}</h2>
                
                {/* Admin Controls */}
                <div className="flex flex-wrap items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <select 
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:border-blue-500 text-gray-700 dark:text-gray-300"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Waiting for Support</option>
                      <option>Waiting for Customer</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <select 
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value)}
                      className="text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:border-blue-500 text-gray-700 dark:text-gray-300"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
              {selectedTicket.messages?.map((msg, idx) => {
                const isSuperAdmin = msg.sender_role === 'Super Admin';
                return (
                  <div key={idx} className={`flex gap-4 ${isSuperAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSuperAdmin ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                      <span className="font-bold text-sm">
                        {msg.sender_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className={`flex-1 max-w-[80%] ${isSuperAdmin ? 'text-right' : ''}`}>
                      <div className="flex items-baseline gap-2 mb-1 justify-between">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {msg.sender_name} <span className="text-gray-500 text-xs font-normal">({msg.sender_role})</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap text-left ${
                        isSuperAdmin 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`mt-2 flex gap-2 flex-wrap ${isSuperAdmin ? 'justify-end' : ''}`}>
                          {msg.attachments.map(att => (
                            <a href={`/${att.file_path}`} target="_blank" rel="noreferrer" key={att.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                              <Paperclip className="w-3 h-3" />
                              {att.file_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
              <form onSubmit={handleReply} className="flex gap-3">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply to the customer..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!replyMessage.trim()}
                  className="flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 shadow-sm shadow-indigo-600/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

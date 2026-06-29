import React, { useState, useEffect } from 'react';
import { Megaphone, Search, Plus, Edit2, Trash2, Calendar, Users, X, Send, Eye } from 'lucide-react';
import { api } from '../api/client';

export default function SuperAdminAnnouncements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'Normal',
    audience_type: 'All Companies',
    recipient_type: 'Both',
    scheduled_at: '',
    expires_at: '',
    status: 'Draft',
    selected_companies: [] as number[]
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await api.getSuperAdminCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent, publishNow: boolean = false) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      return setError('Title is required.');
    }
    if (!formData.message.trim()) {
      return setError('Message is required.');
    }
    if (!formData.priority) {
      return setError('Priority is required.');
    }
    if (!formData.recipient_type) {
      return setError('Recipient Type is required.');
    }
    if (!formData.audience_type) {
      return setError('Audience is required.');
    }
    if (formData.audience_type === 'Selected Companies' && formData.selected_companies.length === 0) {
      return setError('Please select at least one company.');
    }
    
    try {
      const payload = {
        ...formData,
        status: publishNow ? 'Published' : 'Draft'
      };
      await api.createAnnouncement(payload);
      setIsModalOpen(false);
      setFormData({
        title: '', message: '', priority: 'Normal', audience_type: 'All Companies', 
        recipient_type: 'Both', scheduled_at: '', expires_at: '', status: 'Draft', selected_companies: []
      });
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to save announcement');
    }
  };

  const handlePublish = async (id: number) => {
    if (!window.confirm('Publish this announcement now?')) return;
    try {
      await api.publishAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert('Failed to publish');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompanySelection = (companyId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_companies: prev.selected_companies.includes(companyId) 
        ? prev.selected_companies.filter(id => id !== companyId)
        : [...prev.selected_companies, companyId]
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and publish system-wide announcements to all tenant companies.</p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>


      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search announcements..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all"
          />
        </div>
      </div>


      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium">No announcements found</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${
                    announcement.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30' : 
                    announcement.priority === 'Important' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30' : 
                    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{announcement.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        announcement.status === 'Published' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {announcement.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{announcement.message}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{announcement.created_at?.split('T')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{announcement.audience_type} ({announcement.recipient_type})</span>
                      </div>
                      {announcement.stats && (
                        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                          <span title="Total Recipients">Total: {announcement.stats.total}</span>
                          <span title="Read" className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {announcement.stats.read}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 shrink-0 md:ml-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-gray-700">
                  {announcement.status !== 'Published' && (
                    <button onClick={() => handlePublish(announcement.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Send className="w-4 h-4" /> Publish
                    </button>
                  )}
                  <button onClick={() => handleDelete(announcement.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Announcement</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="p-6 space-y-5" onSubmit={(e) => handleSubmit(e, false)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input 
                  type="text" required
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea 
                  required rows={4}
                  value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select 
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Type</label>
                  <select 
                    value={formData.recipient_type} onChange={e => setFormData({...formData, recipient_type: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  >
                    <option value="Both">Both (Head & HR)</option>
                    <option value="Company Head">Company Head Only</option>
                    <option value="Company HR">Company HR Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                    <input 
                      type="radio" 
                      checked={formData.audience_type === 'All Companies'} 
                      onChange={() => setFormData({...formData, audience_type: 'All Companies'})} 
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    All Companies
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                    <input 
                      type="radio" 
                      checked={formData.audience_type === 'Selected Companies'} 
                      onChange={() => setFormData({...formData, audience_type: 'Selected Companies'})} 
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    Selected Companies
                  </label>
                </div>
              </div>

              {formData.audience_type === 'Selected Companies' && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Companies</label>
                  <div className="space-y-2">
                    {companies.map(c => (
                      <label key={c.id} className="flex items-center gap-3 text-sm cursor-pointer dark:text-gray-300">
                        <input 
                          type="checkbox"
                          checked={formData.selected_companies.includes(c.id)}
                          onChange={() => toggleCompanySelection(c.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
                  Save Draft
                </button>
                <button type="button" onClick={(e) => handleSubmit(e, true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

}
import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Search, Plus, Edit2, Trash2, X, FileText, Calendar, Building, IndianRupee
} from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

export default function SuperAdminTenders() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'Open',
    tender_number: '',
    client_name: '',
    department: '',
    tender_value: '',
    publish_date: '',
    opening_date: '',
    closing_date: '',
    deadline: '',
    assigned_manager: '',
    remarks: '',
    documents: ''
  });

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const data = await api.getTenders();
      setTenders(data);
    } catch (err) {
      toast.error('Failed to fetch tenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const openModal = (tender?: any) => {
    if (tender) {
      setEditingTender(tender);
      setFormData({
        title: tender.title || '',
        description: tender.description || '',
        category: tender.category || '',
        status: tender.status || 'Open',
        tender_number: tender.tender_number || '',
        client_name: tender.client_name || '',
        department: tender.department || '',
        tender_value: tender.tender_value || '',
        publish_date: tender.publish_date || '',
        opening_date: tender.opening_date || '',
        closing_date: tender.closing_date || '',
        deadline: tender.deadline || '',
        assigned_manager: tender.assigned_manager || '',
        remarks: tender.remarks || '',
        documents: tender.documents || ''
      });
    } else {
      setEditingTender(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        status: 'Open',
        tender_number: '',
        client_name: '',
        department: '',
        tender_value: '',
        publish_date: '',
        opening_date: '',
        closing_date: '',
        deadline: '',
        assigned_manager: '',
        remarks: '',
        documents: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, tender_value: formData.tender_value ? parseFloat(formData.tender_value) : null };
      if (editingTender) {
        await api.updateTender(editingTender.id, payload);
        toast.success('Tender updated successfully');
      } else {
        await api.createTender(payload);
        toast.success('Tender created successfully');
      }
      setIsModalOpen(false);
      fetchTenders();
    } catch (error) {
      toast.error('Failed to save tender');
    }
  };

  const handleDeleteTender = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tender?")) return;
    try {
      await api.deleteTender(id);
      toast.success('Tender deleted');
      fetchTenders();
    } catch (err) {
      toast.error('Failed to delete tender');
    }
  };

  const filteredTenders = tenders.filter(tender => {
    const matchSearch = tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        tender.tender_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || tender.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'awarded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tender Information</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View, track, and manage all system-wide tenders.</p>
        </div>
        
        <button onClick={() => openModal()} className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Add Tender</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tenders by ID or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm cursor-pointer"
          >
            <option>All Status</option>
            <option>Open</option>
            <option>Under Review</option>
            <option>Awarded</option>
            <option>Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">Loading tenders...</div>
        ) : filteredTenders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">No tenders found matching your criteria.</div>
        ) : (
          filteredTenders.map((tender) => (
            <div key={tender.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tender.status)}`}>
                  {tender.status || 'Open'}
                </span>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openModal(tender)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDeleteTender(tender.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 pr-8">{tender.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-4">{tender.tender_number || 'N/A'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Building className="w-4 h-4 mr-2 text-gray-400" />
                  {tender.client_name || 'No Client'}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <IndianRupee className="w-4 h-4 mr-2 text-gray-400" />
                  {tender.tender_value ? `₹${tender.tender_value.toLocaleString('en-IN')}` : 'Value unassigned'}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Close: {tender.closing_date || '-'}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" />
                  {tender.documents ? 'Docs attached' : 'No docs'}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                <div className="text-gray-500 dark:text-gray-400">
                  Manager: <span className="font-medium text-gray-900 dark:text-white">{tender.assigned_manager || '-'}</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Category: <span className="font-medium text-gray-900 dark:text-white">{tender.category || '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tender Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-gray-700 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTender ? 'Edit Tender' : 'Add New Tender'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="tender-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tender Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tender Number</label>
                    <input type="text" value={formData.tender_number} onChange={e => setFormData({...formData, tender_number: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
                    <input type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent">
                      <option value="Open">Open</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Awarded">Awarded</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tender Value (₹)</label>
                    <input type="number" step="0.01" value={formData.tender_value} onChange={e => setFormData({...formData, tender_value: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Manager</label>
                    <input type="text" value={formData.assigned_manager} onChange={e => setFormData({...formData, assigned_manager: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Date</label>
                    <input type="date" value={formData.publish_date} onChange={e => setFormData({...formData, publish_date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Date</label>
                    <input type="date" value={formData.closing_date} onChange={e => setFormData({...formData, closing_date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documents / Links</label>
                    <input type="text" placeholder="https://..." value={formData.documents} onChange={e => setFormData({...formData, documents: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">Cancel</button>
              <button type="submit" form="tender-form" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700">{editingTender ? 'Save Changes' : 'Add Tender'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

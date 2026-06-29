import React, { useState } from 'react';
import { API_URL } from '../api/client';
import { 
  Building2, 
  User, 
  MapPin, 
  CreditCard, 
  Settings, 
  ClipboardCheck, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Save,
  Check,
  X,
  Copy,
  Printer,
  ArrowLeft,
  FileText,
  Lock
} from 'lucide-react';

const STEPS = [
  { id: 'company', title: 'Company Information', icon: Building2, desc: 'Please fill in the required details below.' },
  { id: 'head', title: 'Company Head', icon: User, desc: 'Primary administrator contact details.' },
  { id: 'address', title: 'Company Address', icon: MapPin, desc: 'Primary headquarters location.' },
  { id: 'subscription', title: 'Subscription Details', icon: CreditCard, desc: 'SaaS plan and billing configuration.' },
  { id: 'settings', title: 'Company Settings', icon: Settings, desc: 'Localization and tenant features.' },
  { id: 'review', title: 'Review & Create', icon: ClipboardCheck, desc: 'Verify all details before creation.' }
];

type StepStatus = 'not-started' | 'in-progress' | 'completed' | 'draft';

export default function SuperAdminAddCompany({ onBack }: { onBack?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({
    company: 'in-progress',
    head: 'not-started',
    address: 'not-started',
    subscription: 'not-started',
    settings: 'not-started',
    review: 'not-started'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    company_type: 'Private',
    industry: '',
    gst_number: '',
    registration_number: '',
    head_name: '',
    head_email: '',
    head_phone: '',
    
    // Address
    address_line1: '',
    address_line2: '',
    country: 'United States',
    state: '',
    city: '',
    pincode: '',

    // Subscription
    plan: 'Basic',
    billing_cycle: 'Monthly',
    subscription_status: 'Active',
    start_date: '',
    end_date: '',
    
    // Settings
    company_status: 'Active',
    currency: 'INR (₹)',
    timezone: '(UTC+05:30) India Standard Time',
    language: 'English',
    is_active: true,
    allow_login: true,
    email_notifications: true
  });

  const [showToast, setShowToast] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  const handleNext = () => {
    setStatuses(prev => ({
      ...prev,
      [STEPS[currentStep].id]: 'completed',
      [STEPS[Math.min(currentStep + 1, STEPS.length - 1)].id]: prev[STEPS[Math.min(currentStep + 1, STEPS.length - 1)].id] === 'not-started' ? 'in-progress' : prev[STEPS[Math.min(currentStep + 1, STEPS.length - 1)].id]
    }));
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleSaveDraft = () => {
    setStatuses(prev => ({ ...prev, [STEPS[currentStep].id]: 'draft' }));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('super_admin_auth');
      const res = await fetch(`${API_URL}/super-admin/companies`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedData(data);
        setShowSuccessModal(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to create company: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating company");
    }
  };

  const handleCopyCredentials = () => {
    if (generatedData?.credentials) {
      const text = `Email: ${generatedData.credentials.email}\nPassword: ${generatedData.credentials.password}`;
      navigator.clipboard.writeText(text);
      alert('Credentials copied to clipboard!');
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    switch(status) {
      case 'completed': return <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1"><CheckCircle2 className="w-3.5 h-3.5 text-gray-400" /> Completed</span>;
      case 'in-progress': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-md uppercase tracking-wider mt-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Pending</span>;
      case 'draft': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 rounded-md uppercase tracking-wider mt-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Draft</span>;
      default: return <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1"><div className="w-3 h-3 rounded-full border-2 border-gray-300"></div> Not Started</span>;
    }
  };

  const activeStepObj = STEPS[currentStep];
  const StepIcon = activeStepObj.icon;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden font-sans">
      
      {/* TOP HEADER */}
      <header className="h-[60px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
            <span>Companies Management</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-gray-100">Add New Company</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight">Add New Company</h1>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies List
        </button>
      </header>

      {/* MAIN SPLIT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR */}
        <div className="w-[280px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto shrink-0 py-6 px-4">
          <h2 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2">Form Sections</h2>
          <div className="space-y-1">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const status = statuses[step.id];
              const isLocked = idx > currentStep && statuses[step.id] === 'not-started';
              
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (!isLocked || isActive) setCurrentStep(idx);
                  }}
                  disabled={isLocked && !isActive}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3 ${
                    isActive 
                      ? 'bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm' 
                      : 'border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } ${isLocked && !isActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`mt-0.5 shrink-0 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {isLocked && !isActive ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-bold ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                      {step.title}
                    </h3>
                    {getStatusBadge(status)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-[#f8fafc] dark:bg-gray-900/50">
          
          {/* FORM SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 pb-32 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
              
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-indigo-300 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-1 rounded shadow-sm" />
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{activeStepObj.title}</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">{activeStepObj.desc}</p>
              
              {/* STEP 1: COMPANY INFORMATION */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in duration-300">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Acme Corp" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Type <span className="text-red-500">*</span></label>
                    <select value={formData.company_type} onChange={e => setFormData({...formData, company_type: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                      <option>Government</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Industry</label>
                    <input type="text" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="e.g. IT Services, Logistics" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">GST Number</label>
                    <input type="text" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} placeholder="Enter GST number" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Registration Number</label>
                    <input type="text" value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} placeholder="Enter company registration number" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                </div>
              )}

              {/* STEP 2: COMPANY HEAD INFORMATION */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <span className="font-bold">Important:</span> Company Head login credentials will be automatically generated after company creation and displayed on the success screen.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.head_name} onChange={e => setFormData({...formData, head_name: e.target.value})} placeholder="Enter head's full name" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" value={formData.head_email} onChange={e => setFormData({...formData, head_email: e.target.value})} placeholder="admin@company.com" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Designation</label>
                      <input type="text" defaultValue="Company Head" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                      <input type="tel" value={formData.head_phone} onChange={e => setFormData({...formData, head_phone: e.target.value})} placeholder="+1 (555) 000-0000" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alternate Mobile</label>
                      <input type="tel" placeholder="+1 (555) 000-0000" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ADDRESS */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in duration-300">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.address_line1} onChange={e => setFormData({...formData, address_line1: e.target.value})} placeholder="Street address, building, company" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Address Line 2</label>
                    <input type="text" value={formData.address_line2} onChange={e => setFormData({...formData, address_line2: e.target.value})} placeholder="Apartment, suite, unit, etc." className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Country <span className="text-red-500">*</span></label>
                    <select value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>India</option>
                      <option>Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">State <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="State/Province" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">City <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pincode / Zip <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="Postal Code" className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm" />
                  </div>
                </div>
              )}

              {/* STEP 4: SUBSCRIPTION */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subscription Plan <span className="text-red-500">*</span></label>
                    <select value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                      <option>Basic</option>
                      <option>Professional</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subscription Status <span className="text-red-500">*</span></label>
                    <select value={formData.subscription_status} onChange={e => setFormData({...formData, subscription_status: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                      <option>Active</option>
                      <option>Trial</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Billing Cycle <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex-1 bg-white dark:bg-gray-900 shadow-sm hover:border-blue-300 transition-colors">
                        <input type="radio" name="billing" checked={formData.billing_cycle === 'Monthly'} onChange={() => setFormData({...formData, billing_cycle: 'Monthly'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Monthly</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex-1 bg-white dark:bg-gray-900 shadow-sm hover:border-blue-300 transition-colors">
                        <input type="radio" name="billing" checked={formData.billing_cycle === 'Annually'} onChange={() => setFormData({...formData, billing_cycle: 'Annually'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Annually (-10%)</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Start Date <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">End Date <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all shadow-sm [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              )}

              {/* STEP 5: SETTINGS */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Status</label>
                      <select value={formData.company_status} onChange={e => setFormData({...formData, company_status: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                        <option>Active</option>
                        <option>Deactivated</option>
                        <option>Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                      <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                        <option>INR (₹)</option>
                        <option>EUR (€)</option>
                        <option>USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
                      <select value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                        <option>(UTC-05:00) Eastern Time</option>
                        <option>(UTC+00:00) London</option>
                        <option>(UTC+05:30) India Standard Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Language</label>
                      <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Feature Toggles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm cursor-pointer hover:border-gray-300 transition-all">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">Active</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Company is fully active</p>
                        </div>
                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm cursor-pointer hover:border-gray-300 transition-all">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">Allow Login</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Users can log into tenant app</p>
                        </div>
                        <input type="checkbox" checked={formData.allow_login} onChange={e => setFormData({...formData, allow_login: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm cursor-pointer hover:border-gray-300 transition-all">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">Email Notifications</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Send system emails to company</p>
                        </div>
                        <input type="checkbox" checked={formData.email_notifications} onChange={e => setFormData({...formData, email_notifications: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: REVIEW & CREATE */}
              {currentStep === 5 && (
                <div className="animate-in fade-in duration-300 space-y-6">
                  
                  {/* Review Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Company Information */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Company Information</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Company Name</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.name || 'Not Provided'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Company Type</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.company_type}</dd>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Industry</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.industry || 'Not Provided'}</dd>
                        </div>
                        {formData.registration_number && (
                          <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                            <dt className="text-gray-500 dark:text-gray-400 font-medium">Company Code</dt>
                            <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.registration_number}</dd>
                          </div>
                        )}
                        {formData.gst_number && (
                          <div className="flex justify-between pb-1">
                            <dt className="text-gray-500 dark:text-gray-400 font-medium">GST Number</dt>
                            <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.gst_number}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Company Head */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Company Head</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Full Name</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.head_name || 'Not Provided'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Email Address</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.head_email || 'Not Provided'}</dd>
                        </div>
                        <div className="flex justify-between pb-1">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Mobile</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.head_phone || 'Not Provided'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Company Address */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Company Address</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Address Line 1</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100 text-right max-w-[200px] truncate">{formData.address_line1 || 'Not Provided'}</dd>
                        </div>
                        {formData.address_line2 && (
                          <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                            <dt className="text-gray-500 dark:text-gray-400 font-medium">Address Line 2</dt>
                            <dd className="font-bold text-gray-900 dark:text-gray-100 text-right max-w-[200px] truncate">{formData.address_line2}</dd>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">City, State</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.city || 'City'}, {formData.state || 'State'}</dd>
                        </div>
                        <div className="flex justify-between pb-1">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Country, Zip</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.country}, {formData.pincode || 'Zip'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Company Settings */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Company Settings</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Time Zone</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100 text-right truncate max-w-[150px]">{formData.timezone}</dd>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Currency</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.currency}</dd>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Language</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.language}</dd>
                        </div>
                        <div className="flex justify-between pb-1">
                          <dt className="text-gray-500 dark:text-gray-400 font-medium">Notifications</dt>
                          <dd className="font-bold text-gray-900 dark:text-gray-100">{formData.email_notifications ? 'Enabled' : 'Disabled'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Subscription Details */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm md:col-span-2">
                      <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Subscription Details</h4>
                      <div className="flex flex-col sm:flex-row gap-6 mb-4">
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                          <p className="font-black text-blue-600 dark:text-blue-400 text-lg">{formData.plan}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Billing Cycle</p>
                          <p className="font-black text-gray-900 dark:text-white text-lg">{formData.billing_cycle}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</p>
                          <p className={`font-black text-lg ${formData.subscription_status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{formData.subscription_status}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{formData.start_date || 'Not Provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{formData.end_date || 'Not Provided'}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <span className="font-bold">Ready to Launch:</span> Please review all the details carefully. Once created, login credentials will be generated and an automated welcome email will be dispatched to the Company Head if email notifications are enabled.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
          
          {/* FIXED BOTTOM ACTION BAR */}
          <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-2.5 font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all text-sm"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md shadow-blue-600/20 text-sm"
                >
                  Save & Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-8 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md shadow-blue-600/20 text-sm"
                >
                  <Check className="w-4 h-4" /> Create Company
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-24 right-8 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span className="font-semibold text-sm">Draft saved successfully.</span>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center border-b border-gray-100 dark:border-gray-700 relative">
              <button 
                onClick={() => { setShowSuccessModal(false); onBack?.(); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Company Created!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                The company and initial head user have been successfully registered.
              </p>
            </div>
            
            <div className="p-8 bg-gray-50 dark:bg-gray-900/50">
              <div className="space-y-4 text-sm bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Company ID</span>
                  <span className="font-bold text-gray-900 dark:text-white">{generatedData?.company?.code || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Company Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{generatedData?.company?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Head Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{generatedData?.company?.head_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Username</span>
                  <span className="font-bold text-gray-900 dark:text-white">{generatedData?.credentials?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">Password</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    {generatedData?.credentials?.password || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 flex items-start gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">The Company Head must change this temporary password after their first login.</p>
              </div>
            </div>
            
            <div className="p-6 flex gap-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <button 
                type="button"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button 
                type="button"
                onClick={handleCopyCredentials}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
              >
                <Copy className="w-4 h-4" /> Copy Credentials
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

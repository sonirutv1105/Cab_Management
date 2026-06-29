import React, { useState } from 'react';
import { useCMS } from '../context/CMSContext';

export default function LoginPage() {
  const { login } = useCMS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(async () => {
      // Check if trying to log in as Super Admin
      if (email === 'admin@superadmin.com' || email.includes('superadmin')) {
        try {
          const res = await fetch('http://localhost:8000/api/super-admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('super_admin_auth', data.access_token);
            window.location.href = '/super-admin/dashboard';
            return;
          } else {
            setError('Invalid Super Admin credentials.');
            setLoading(false);
            return;
          }
        } catch (err) {
          setError('Failed to connect to the server.');
          setLoading(false);
          return;
        }
      }

      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] dark:bg-gray-900 font-poppins relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-[1040px] h-[640px] flex rounded-3xl overflow-hidden shadow-2xl bg-white m-6 relative z-10">

        {/* Left Side - Visual */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-95 z-10" />
          <img
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2000"
            alt="Modern Transport Fleet"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          />
          <div className="relative z-20 flex flex-col p-12 h-full text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
              </div>
              <span className="font-extrabold text-xl tracking-wider">Pulpit Cab</span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">Empower your <br />fleet operations.</h1>
              <p className="text-base text-blue-100 font-medium max-w-sm leading-relaxed">
                Streamline your fleet tracking, automate compliance documentation, and optimize global logistics flawlessly.
              </p>
            </div>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse z-10" />
          <div className="absolute bottom-[20%] right-[-20%] w-96 h-96 bg-purple-50 dark:bg-purple-900/300 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse z-10" />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[55%] flex flex-col p-8 md:p-12 lg:px-20 justify-center bg-white dark:bg-gray-800 relative">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all duration-200 hover:bg-white focus:bg-white"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all duration-200 hover:bg-white focus:bg-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>
            </form>

            <div className="mt-10 text-center border-t border-gray-100 dark:border-gray-700 pt-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                Secure login managed by <span className="text-gray-600 dark:text-gray-400">CMS Enterprise SSO</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

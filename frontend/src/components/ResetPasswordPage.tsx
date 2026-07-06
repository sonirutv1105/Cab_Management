import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      window.location.href = '/forgot-password';
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing session token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
    if (!strongRegex.test(newPassword)) {
      setError('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.resetPassword(token, newPassword);
      setSuccess(response.message || 'Password has been reset successfully.');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to reset password. The session may be invalid or expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Prevent rendering if redirecting
  }

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
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Set New Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Please enter your new password to complete the reset process.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 p-3.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 text-sm font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                {success}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">New Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all duration-200 hover:bg-white focus:bg-white"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Confirm Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all duration-200 hover:bg-white focus:bg-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-600/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="text-center mt-6">
              <a href="/" className="text-sm font-bold text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                Back to Login
              </a>
            </div>

            <div className="mt-10 text-center border-t border-gray-100 dark:border-gray-700 pt-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                Secure password reset managed by <span className="text-gray-600 dark:text-gray-400">CMS Enterprise SSO</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

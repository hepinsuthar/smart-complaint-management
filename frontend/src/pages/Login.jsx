import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hash, Mail, Lock, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePwdPrn, setChangePwdPrn] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const identifier = formData.get('identifier')?.trim();
    const password = formData.get('password')?.trim();

    if (!identifier || !password) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    try {
      let endpoint, body;

      if (isAdminMode) {
        endpoint = 'http://localhost:5000/api/auth/admin-login';
        body = { email: identifier.toLowerCase(), password };
      } else {
        endpoint = 'http://localhost:5000/api/auth/student-login';
        body = { prn: identifier.trim(), password };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Save login data
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }

    } catch (err) {
      console.error('Login fetch error:', err);
      setError('Cannot connect to server. Make sure backend is running on port 5000.');
      setLoading(false);
    }
    
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    if (!changePwdPrn || !currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All fields are required');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setPasswordLoading(false);
      return;
    }

    try {
      // First, login temporarily to get token
      const loginRes = await fetch('http://localhost:5000/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prn: changePwdPrn.trim(), password: currentPassword })
      });

      if (!loginRes.ok) {
        setPasswordError('Invalid PRN or current password');
        setPasswordLoading(false);
        return;
      }

      const loginData = await loginRes.json();

      // Now change password
      const changeRes = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const changeData = await changeRes.json();

      if (!changeRes.ok) {
        setPasswordError(changeData.error || 'Failed to change password');
        setPasswordLoading(false);
        return;
      }

      setPasswordSuccess(changeData.message);

      setTimeout(() => {
        setShowChangePassword(false);
        setChangePwdPrn('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordSuccess('');
        setPasswordLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError('Cannot connect to server');
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151c28] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#1a2335]/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl shadow-[#06B6D4]/20 border border-[#06B6D4]/10">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1760D7] to-[#06B6D4] flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Login to your Smart Complaint account
          </p>

          {/* Toggle Admin / Student */}
          <div className="flex justify-center mb-6 gap-4">
            <button
              type="button"
              onClick={() => setIsAdminMode(false)}
              className={`px-6 py-2 rounded-lg font-medium transition ${!isAdminMode ? 'bg-gradient-to-r from-[#1760D7] to-[#06B6D4] text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setIsAdminMode(true)}
              className={`px-6 py-2 rounded-lg font-medium transition ${isAdminMode ? 'bg-gradient-to-r from-[#1760D7] to-[#06B6D4] text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {isAdminMode ? 'Email' : 'PRN '}
              </label>
              <div className="relative">
                {isAdminMode ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                ) : (
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                )}
                <input
                  type={isAdminMode ? "email" : "text"}
                  name="identifier"
                  className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none transition"
                  placeholder={isAdminMode ? "Enter Your Email" : "Enter your PRN"}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full pl-12 pr-12 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none transition"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#1760D7] to-[#06B6D4] text-white font-semibold rounded-xl shadow-lg hover:shadow-[#06B6D4]/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-70"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            {isAdminMode ? (
              <>Login as student? <button type="button" onClick={() => setIsAdminMode(false)} className="text-[#06B6D4] font-medium hover:underline">Click here</button></>
            ) : (
              <>Admin login? <button type="button" onClick={() => setIsAdminMode(true)} className="text-[#06B6D4] font-medium hover:underline">Click here</button></>
            )}
          </p>

          {!isAdminMode && (
            <>
              <p className="mt-8 text-center text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#06B6D4] font-medium hover:underline">
                  Sign Up
                </Link>
              </p>

              <p className="mt-4 text-center text-slate-400 text-sm">
                Need to change password?{' '}
                <button 
                  type="button"
                  onClick={() => setShowChangePassword(true)} 
                  className="text-[#06B6D4] font-medium hover:underline"
                >
                  Click here
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center pb-5">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-[#06B6D4] transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-[#1a2335]/90 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-[#06B6D4]/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
              <button 
                type="button"
                onClick={() => setShowChangePassword(false)} 
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {passwordError && (
              <p className="text-red-400 mb-4 text-sm bg-red-500/10 py-3 px-3 rounded-lg">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-400 mb-4 text-sm bg-green-500/10 py-3 px-3 rounded-lg">{passwordSuccess}</p>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">PRN</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={changePwdPrn}
                      onChange={(e) => setChangePwdPrn(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none transition text-sm"
                      placeholder="Enter your PRN"
                      required
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none transition text-sm"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none transition text-sm"
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#06B6D4] focus:outline-none transition text-sm"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2 bg-gradient-to-r from-[#1760D7] to-[#06B6D4] text-white font-semibold rounded-lg shadow hover:shadow-[#06B6D4]/30 transition text-sm disabled:opacity-70"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { io as socketIO } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Bell, LogOut, Search, Menu, X,
  AlertCircle, Clock, CheckCircle2, PlusCircle, Loader2, Trash2, CheckCircle, 
  User as UserIcon, Key, History, Funnel, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusChangeToast, setStatusChangeToast] = useState(null);
  const previousComplaintsRef = React.useRef(null);
  const isInitialLoadRef = React.useRef(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [priority, setPriority] = useState('Low');
  const [selectedHistory, setSelectedHistory] = useState(null);
  
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const studentName = user?.name || 'Student';
  const studentInitial = studentName.charAt(0).toUpperCase();
  
  useEffect(() => {
    if (!token || user.role !== 'student') {
      navigate('/login');
      return;
    }

    const fetchComplaints = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/complaints', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch complaints');

        const data = await res.json();

        const newComplaints = data.map((c) => ({
          id: c.complaintId || `CMP-${c._id.toString().slice(-8).toUpperCase()}`,
          title: c.title,
          category: c.category,
          description: c.description,
          priority: c.priority || 'Low',
          status: c.status,
          
          adminComment: c.adminComment || '',
          history: c.history || [],

          date: new Date(c.createdAt).toLocaleDateString(),
          files: c.files || [],
          _id: c._id
        }));

        // Detect status changes only after initial load (not on first fetch)
        if (!isInitialLoadRef.current && previousComplaintsRef.current) {
          newComplaints.forEach(newComplaint => {
            const oldComplaint = previousComplaintsRef.current.find(c => c._id === newComplaint._id);
            if (oldComplaint && oldComplaint.status !== newComplaint.status) {
              // Show notification only for this specific student's complaints
              setStatusChangeToast({
                complaintId: newComplaint.id,
                title: newComplaint.title,
                oldStatus: oldComplaint.status,
                newStatus: newComplaint.status
              });
              setTimeout(() => setStatusChangeToast(null), 5000);
            }
          });
        }

        // Store current complaints for next comparison
        previousComplaintsRef.current = newComplaints;
        isInitialLoadRef.current = false;
        setMyComplaints(newComplaints);
      } catch (err) {
        setErrorMessage('Error loading complaints: ' + err.message);
      } finally {
        setLoadingComplaints(false);
      }
    };
    
    fetchComplaints();

    // Poll for updates every 10 seconds for real-time status changes
    const pollInterval = setInterval(fetchComplaints, 10000);

    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        // Filter to only this student's notifications by userId
        const studentNotifications = data.filter(n => !n.userId || n.userId === user._id);
        setNotifications(studentNotifications);
      } catch (err) {
        console.error("Notification error:", err);
      }
    };

    // initial load + realtime socket subscription
    let socket;

if (token && user?._id) {
  fetchNotifications();

  socket = socketIO("http://localhost:5000", {
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    socket.emit("join", user._id); // join after connect
  });

 socket.on("notification", (data) => {
   setNotifications(prev => {
    const exists = prev.some(n => n._id === data._id);
    if (exists) return prev;
    return [data, ...prev];
  });
});

  socket.on("statusUpdate", (updatedComplaint) => {
    setMyComplaints(prev =>
      prev.map(c =>
        c._id === updatedComplaint._id
          ? { ...c, status: updatedComplaint.status, adminComment: updatedComplaint.adminComment }
          : c
      )
    );
  });
}

    return () => {
      clearInterval(pollInterval);
      if (socket) socket.disconnect();
    };
  }, [navigate, token, user.role, user._id]);

  const stats = [
    { label: 'Total Complaints', value: myComplaints.length, change: `+${myComplaints.length}`, color: 'cyan' },
    { label: 'Pending', value: myComplaints.filter(c => c.status === 'Pending').length, change: '+0', color: 'yellow' },
    { label: 'In Progress', value: myComplaints.filter(c => c.status === 'In Progress').length, change: '+0', color: 'blue' },
    { label: 'Resolved', value: myComplaints.filter(c => c.status === 'Resolved').length, change: '+0', color: 'green' },
    { label: 'Rejected', value: myComplaints.filter(c => c.status === 'Rejected').length, change: '+0', color: 'red' }
  ];

  const categoryCounts = myComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Hostel', value: categoryCounts['Hostel'] || 0 },
    { name: 'Academics', value: categoryCounts['Academics'] || 0 },
    { name: 'Mess', value: categoryCounts['Mess'] || 0 },
    // { name: 'Wi-Fi', value: categoryCounts['Wi-Fi'] || 0 },
    { name: 'IT/Technical', value: categoryCounts['IT'] || 0 },
    { name: 'Library', value: categoryCounts['Library'] || 0 },
    { name: 'Transport', value: categoryCounts['Transport'] || 0 },
    { name: 'Other', value: categoryCounts['Other'] || 0 },
  ];

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));
  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim() || !category || !description.trim()) {
      setErrorMessage('Please fill title, category, and description');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('priority', priority);
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit complaint');
      }

      setSuccessMessage('Complaint submitted successfully!');

      // Reset form
      setTitle('');
      setCategory('');
      setDescription('');
      setPriority('Low');
      setFiles([]); 

      // Refetch complaints to show new one
      const fetchRes = await fetch('http://localhost:5000/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const newData = await fetchRes.json();
      setMyComplaints(newData.map((c) => ({
        id: c.complaintId || `CMP-${c._id.toString().slice(-8).toUpperCase()}`,
        title: c.title,
        category: c.category,
        description: c.description,
        priority: c.priority || 'Low',
        status: c.status,
        adminComment: c.adminComment || '',
        history: c.history || [],
        date: new Date(c.createdAt).toLocaleDateString(),
        files: c.files || [],
        _id: c._id
      })));

      setTimeout(() => {
        setSuccessMessage('');
        setIsNewComplaintOpen(false);
      }, 3000);

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openFile = (path) => window.open(`http://localhost:5000${path}`, '_blank');

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
  e.preventDefault();
  setPasswordError('');
  setPasswordSuccess('');

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    setPasswordError('All fields are required');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    setPasswordError('New passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    setPasswordError('Password must be at least 6 characters');
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed");

    setPasswordSuccess(data.message);

    setTimeout(() => {
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccess('');
    }, 2000);

  } catch (err) {
    setPasswordError(err.message);
  }
  };

  const filteredComplaints = myComplaints.filter((c) => {
  const q = searchQuery.toLowerCase();
  const matchesSearch = (
    c.title.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q)
  );
  const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
  return matchesSearch && matchesStatus;
  });

  return (
    
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-[#111827] border-b border-gray-800 z-30 flex items-center px-3 sm:px-4">
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-semibold hidden sm:block">Student Dashboard</span>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-[180px] xs:max-w-[220px] sm:max-w-xs lg:max-w-md">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() !== '') {
                      setActiveSection('complaints');
                    }
                  }}
                className="w-full pl-8 sm:pl-10 pr-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative cursor-pointer">
              <button
                onClick={() => setActiveSection('notifications')}
                className="relative text-gray-400 hover:text-white transition"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
            </div>

            {/* Profile Circle with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm hover:ring-4 hover:ring-cyan-500/30 transition"
              >
                {studentInitial}
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#111827] border border-gray-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition"
                  >
                    <UserIcon className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition"
                  >
                    <Key className="w-4 h-4" /> Change Password
                  </button>
                  <hr className="border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-red-900/20 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </header>
              
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#111827] border-r border-gray-800 z-20 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-18 px-4 space-y-2">
          <button
            onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'overview' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button
            onClick={() => { setActiveSection('complaints'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'complaints' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <FileText className="w-5 h-5" /> My Complaints
          </button>
          <button
            onClick={() => { setActiveSection('notifications'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'notifications'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400'
                : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button
            onClick={() => { setActiveSection('history'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === 'history'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400'
                : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
          <History />Complaint History
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-16 lg:ml-60 bg-[#0b111e] p-4 sm:p-6 lg:p-7">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            {errorMessage}
          </div>
        )}

        {statusChangeToast && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 flex items-center gap-3 animate-pulse">
            <Clock className="w-6 h-6" />
            <span>
              <strong>problem: {statusChangeToast.title}</strong> status changed from <strong>{statusChangeToast.oldStatus}</strong> to <strong>{statusChangeToast.newStatus}</strong>
            </span>
          </div>
        )}

        {activeSection === 'overview' && (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">
              Welcome back
              {studentName && (
                <span className="text-cyan-400">, {studentName}</span>
              )}!
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow hover:border-cyan-500/50 transition">
                  <div className="flex justify-between items-center mb-3">
                    <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                      {stat.label === 'Total Complaints' && <FileText className="w-5 h-5 text-cyan-400" />}
                      {stat.label === 'Pending' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                      {stat.label === 'In Progress' && <Clock className="w-5 h-5 text-blue-400" />}
                      {stat.label === 'Resolved' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      {stat.label === 'Rejected' && <X className="w-5 h-5 text-red-400" />}
                    </div>
                    {/* <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.change}</span> */}
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setIsNewComplaintOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow hover:shadow-cyan-500/30 transition mb-8">
              <PlusCircle className="w-5 h-5" /> New Complaint
            </button>
            {myComplaints.length > 0 && (
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow">
                <h3 className="text-xl font-semibold mb-4">Complaints by Category</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={70} />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', color: 'white' }} />
                      <Bar dataKey="value" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {activeSection === 'complaints' && (
          <>
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold">My Complaints</h2>

                <div className="flex items-center gap-3">
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                  >
                    <Funnel className="w-4 h-4" />
                    Filter
                  </button>

                  {/* New Button */}
                  <button
                    onClick={() => setIsNewComplaintOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow hover:shadow-cyan-500/30 transition"
                  >
                    <PlusCircle className="w-5 h-5" /> New
                  </button>
                </div>
                
              </div>
              {showFilter && (
                <div className="absolute mb-4 right-14 top-40">
                  <div className="bg-[#111827] border border-gray-700 rounded-lg p-3 shadow-lg w-48">
                    {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilter(false);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded text-sm ${
                          statusFilter === status
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {loadingComplaints ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : errorMessage ? (
              <p className="text-red-400 text-center py-12">{errorMessage}</p>
            ) : myComplaints.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No complaints submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="pb-4 px-4">ID</th>
                      <th className="pb-4 px-4">Problem</th>
                      <th className="pb-4 px-4 hidden sm:table-cell">Category</th>
                      <th className="pb-4 px-4">Description</th>
                      <th className="pb-4 px-4">Priority</th>
                      <th className="pb-4 px-4">Status</th>
                      <th className="pb-4 px-4">Admin Comment</th>
                      <th className="pb-4 px-4 hidden md:table-cell">Date</th>
                      <th className="pb-4 px-4">Files</th>
                    </tr>
                  </thead>
                  <tbody className='text-sm'>
                    {filteredComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-800/50">
                        <td className="py-4 px-4 text-cyan-400">{c.id}</td>
                        <td className="py-4 px-4">{c.title}</td>
                        <td className="py-4 px-4 hidden sm:table-cell">{c.category}</td>
                        <td className="py-4 px-4 "><p className="line-clamp-4 text-gray-300">{c.description}</p></td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              c.priority === "High"
                                ? "bg-red-500/20 text-red-400"
                                : c.priority === "Medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            c.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                            c.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                              c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>{c.status}</span>
                        </td>
                        <td className="py-4 px-4 max-w-sm">
                          {c.adminComment ? (
                            <span className="text-xs px-2 py-1 rounded">
                              <p className='line-clamp-4 '>
                              {c.adminComment}
                              </p>
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">No comment</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-400 hidden md:table-cell">{c.date}</td>
                        <td className="py-4 px-4">
                          {c.files.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {c.files.map((f, i) => (
                                <button key={i} onClick={() => openFile(f)} className="px-3 py-1 bg-gray-800 rounded text-xs text-cyan-300 hover:text-white">
                                  File {i + 1}
                                </button>
                              ))}
                            </div>
                          ) : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </>
        )}
        
        {activeSection === 'history' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Complaint History</h2>

            {myComplaints.length === 0 ? (
              <p className="text-gray-400">No complaints found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myComplaints.map((c) => (
                  <div key={c._id} className="bg-[#111827] p-4 rounded-lg border border-gray-700">
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-cyan-400 font-semibold">{c.id}</p>
                        <p className="text-white">Problem : {c.title}</p>
                      </div>

                      <button
                        onClick={() => setSelectedHistory(c)}
                        className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded text-xs"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'notifications' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>

            {notifications.length === 0 ? (
              <p className="text-gray-400">No notifications</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`bg-[#0f1b2d] p-5 rounded-xl border border-gray-700 border-l-4 
                    hover:bg-[#122038] hover:scale-[1.01] transition-all duration-200
                    ${
                      n.message.includes("Resolved") ? "border-l-green-500" :
                      n.message.includes("In Progress") ? "border-l-blue-500" :
                      n.message.includes("Rejected") ? "border-l-red-500" :
                      "border-l-yellow-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="text-white font-semibold text-[15px]">
                          {n.message}
                        </p>

                        <p className="text-gray-400 text-sm mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New Complaint Modal */}
      {isNewComplaintOpen && (  
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl p-5 w-full max-w-sm border border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">New Complaint</h3>
              <button onClick={() => setIsNewComplaintOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Problem *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs"
                  placeholder="Brief Problem"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs"
                  required
                >
                  <option value="">Select</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Academics">Academics</option>
                  <option value="Mess">Mess</option>
                  {/* <option value="Wi-Fi">Wi-Fi</option> */}
                  <option value="IT">IT / Technical</option>
                  <option value="Library">Library</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other</option>

                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs"
                  placeholder="Describe your issue..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Files (optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs file:bg-gray-800 file:text-white file:text-xs"
                />
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-full text-xs text-gray-300">
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNewComplaintOpen(false)}
                  className="px-4 py-1.5 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded shadow hover:shadow-cyan-500/30 transition disabled:opacity-50 flex items-center gap-2 text-xs"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">My Profile</h3>
              <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-lg font-medium">{user.name || 'Not available'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">PRN</p>
                <p className="text-lg font-medium">{user.prn || 'Not available'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-lg font-medium">{user.email || 'Not available'}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProfile(false)}
                className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            {passwordError && (
              <p className="text-red-400 mb-3 text-center bg-red-500/10 py-2 rounded">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-400 mb-3 text-center bg-green-500/10 py-2 rounded">{passwordSuccess}</p>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded shadow hover:shadow-cyan-500/30" > Change Password </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedHistory && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-[#111827] p-6 rounded-xl w-full max-w-md border border-gray-700">

            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">Timeline</h3>
              <button onClick={() => setSelectedHistory(null)}><X /></button>
            </div>

            <p className="text-cyan-400 mb-4">{selectedHistory.id}</p>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {selectedHistory.history && selectedHistory.history.length > 0 ? (
                selectedHistory.history.map((h, i) => (
                  <div key={i} className="border-l-2 border-cyan-500 pl-4">
                    <p className="font-semibold text-cyan-400">{h.status}</p>
                    <p className="text-sm text-gray-300">{h.comment}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(h.date).toLocaleString()}
                    </p>
                    {/* <p>{h.comment}</p>
                    <p>{new Date(h.date).toLocaleString()}</p> */}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No history available</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
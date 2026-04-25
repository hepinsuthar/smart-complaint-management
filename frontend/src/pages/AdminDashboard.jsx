import React, { useState, useEffect } from 'react';
import { io as socketIO } from 'socket.io-client';
import { 
  LayoutDashboard, FileText, Bell, LogOut, Search, Menu, X, 
  Users, ChevronRight, AlertCircle, Clock, CheckCircle, Loader2, Funnel
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import config from '../config/config';

const COLORS = ['#06B6D4', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState('overview');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = sessionStorage.getItem('token');
  const [search, setSearch] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${config.BASE_URL}/api/complaints`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });

        if (!res.ok) throw new Error('Failed to fetch complaints');

        const complaints = await res.json();
        const studentMap = {};

        complaints.forEach(c => {
          const s = c.studentId;
          if (!s) return;

          if (!studentMap[s._id]) {
            studentMap[s._id] = {
              id: s._id,
              studentId: s._id,
              name: s.name,
              prn: s.prn,
              email: s.email,
              complaints: []
            };
          }
          studentMap[s._id].complaints.push({
            id: c._id,
            displayId: c.complaintId || `CMP-${c._id.toString().slice(-8).toUpperCase()}`,
            title: c.title || c.complaintTitle || 'No title',
            category: c.category || 'N/A',
            description: c.description || c.desc || 'No description',
            priority: c.priority || 'Low',
            status: c.status || 'Pending',
            adminComment: c.adminComment || '',
            date: c.createdAt
              ? new Date(c.createdAt).toLocaleDateString()
              : 'N/A',
            files: (c.files || []).map(f => {
              const path = typeof f === 'string' ? f : f.url;
              return path?.replace(/\\/g, '/'); // Windows → web path
            })
          });
        });

        setStudentsData(Object.values(studentMap));
      } catch (err) {
        setError(err.message || 'Server error loading complaints');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${config.BASE_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("Notification error:", err);
      }
    };

    // initial load + realtime socket subscription
    let socket;
    if (token) {
      fetchNotifications();
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      socket = socketIO(`${config.BASE_URL.replace('/api', '')}`, { transports: ["websocket"] });
      socket.emit("join", user._id);
      socket.on("notification", (n) => {
        // prepend new notification
        setNotifications(prev => [n, ...prev]);
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [token]);

  const allComplaints = studentsData.flatMap(s => s.complaints);
  const filteredStudents = studentsData
  .map(student => ({
    ...student,
    complaints: student.complaints.filter(c =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    )
  }))
  .filter(student => student.complaints.length > 0 || 
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Complaints', value: allComplaints.length, change: `+${allComplaints.length}`, color: 'cyan' },
    { label: 'Pending', value: allComplaints.filter(c => c.status === 'Pending').length, color: 'yellow' },
    { label: 'In Progress', value: allComplaints.filter(c => c.status === 'In Progress').length, color: 'blue' },
    { label: 'Resolved', value: allComplaints.filter(c => c.status === 'Resolved').length, color: 'green' },
    {label: 'Rejected', value: allComplaints.filter(c => c.status === 'Rejected').length, color: 'red' }
  ];

  const categoryCounts = allComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  const statusChartData = stats.slice(1).map(stat => ({
    name: stat.label,
    value: stat.value
  }));

  const updateStatus = async () => {
  try {
    const res = await fetch(`${config.BASE_URL}/api/complaints/${selectedComplaint.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        status: newStatus,
        adminComment: adminComment
      }),
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to update');

    setStudentsData(prev =>
      prev.map(student => ({
        ...student,
        complaints: student.complaints.map(c =>
          c.id === selectedComplaint.id
            ? { ...c, status: newStatus, adminComment }
            : c
        )
      }))
    );

    setSuccessMsg('Updated successfully');
    setTimeout(() => setSuccessMsg(''), 2000);

    setShowModal(false);
    setAdminComment('');
  } catch (err) {
    setSuccessMsg('❌ Failed to update');
  }
};

  const toggleStudentDetails = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col">
      {/* Fixed Responsive Header */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-[#111827] border-b border-gray-800 z-30 flex items-center px-3 sm:px-4">
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-semibold hidden sm:block">Admin Panel</span>
            </div>
          </div>

          {/* Center: Small & centered search */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-[180px] xs:max-w-[220px] sm:max-w-xs lg:max-w-md">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students or complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm"
              />

            </div>
          </div>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button
                  onClick={() => { setView('notifications'); setSidebarOpen(false); }}
                  className="relative text-gray-400 hover:text-white transition"
                  aria-label="Open notifications"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-[10px] px-1 rounded-full font-semibold">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#111827] border-r border-gray-800 z-20 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-18 px-4 space-y-2">
          <button
            onClick={() => { setView('overview'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              view === 'overview' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button
            onClick={() => { setView('students'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              view === 'students' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <Users className="w-5 h-5" /> Manage Students
          </button>
          <button
            onClick={() => { setView('notifications'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              view === 'notifications' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <Bell className="w-5 h-5" /> Notifications
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto mt-14 sm:mt-16 lg:ml-64 bg-[#0b111e] p-4 sm:p-6 lg:p-8">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            {successMsg}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
          </div>
        ) : error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : view === 'overview' ? (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4  mb-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:border-[#06B6D4]/50 transition-all"
                >
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div className={`p-2 sm:p-3 rounded-lg bg-${stat.color}-500/10`}>
                      {stat.label === 'Total Complaints' && <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />}
                      {stat.label === 'Pending' && <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />}
                      {stat.label === 'In Progress' && <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />}
                      {stat.label === 'Resolved' && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />}
                      {stat.label === 'Rejected' && <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />}
                    </div>
                    {/* <span className={`text-xs sm:text-sm ${stat.change?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change || '+0'}
                    </span> */}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 sm:p-6 shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Complaints by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 sm:p-6 shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Complaints by Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
                      <Bar dataKey="value" fill="#06B6D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <p className="mt-8 text-gray-400 text-center text-sm">
              Click "Manage Students" in the sidebar to view individual student complaints
            </p>
          </div>
        ) : view === 'students' ? (
          <div className='mb-6 relative'>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Manage Students</h2>
              <div className="absolute right-0 top-0">
                <button
                  onClick={() => setShowFilter(prev => !prev)}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <Funnel className="w-5 h-5 text-gray-300" />
                </button>

                {showFilter && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#111827] border border-gray-700 rounded-lg shadow-lg z-50">
                    {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilter(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${
                          statusFilter === status ? 'text-cyan-400' : 'text-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            {/* Status Filter */}
            {filteredStudents.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No students found.</p>
            ) : (
              <div className="space-y-6">
                {filteredStudents.map(student => (
                  <div key={student.id} className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                    {/* Student Header */}
                    <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-900/50">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{student.name}</h3>
                        <p className="text-sm text-cyan-400 mt-1">PRN: {student.prn}</p>
                        <p className="text-sm text-gray-400">{student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-cyan-400 font-medium">
                          {student.complaints.length} Complaint{student.complaints.length !== 1 ? 's' : ''}
                        </p>
                        <button
                          onClick={() => toggleStudentDetails(student.id)}
                          className="mt-2 text-gray-400 hover:text-white text-sm flex items-center gap-1"
                        >
                          {expandedStudents[student.id] ? 'Hide Details' : 'View Details'}
                          <ChevronRight className={`w-4 h-4 transition-transform ${expandedStudents[student.id] ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Always show full complaint details when expanded */}
                    {expandedStudents[student.id] && (
                      <div className="p-5">
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
                                <th className="pb-4 px-4 hidden md:table-cell">Date</th>
                                <th className="pb-4 px-4">Files</th>
                              </tr>
                            </thead>

                            <tbody className='text-sm'>
                              {student.complaints.filter(c => 
                                statusFilter === 'All' || c.status === statusFilter
                              ).map((c) => (
                                <tr key={c.id} className="hover:bg-gray-800/50">
                                  
                                  {/* ID */}
                                  <td className="py-4 px-4 text-cyan-400 ">
                                    {c.displayId}
                                  </td>

                                  {/* Title */}
                                  <td className="py-4 px-4">
                                    {c.title}
                                  </td>

                                  {/* Category (hidden on mobile) */}
                                  <td className="py-4 px-4 hidden sm:table-cell">
                                    {c.category}
                                  </td>

                                  {/* Description */}
                                  <td className="py-4 px-4 ">
                                    <p className="line-clamp-4 text-gray-300">
                                      {c.description}
                                    </p>
                                  </td>
                                  {/* Priority */}
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
                                  {/* Status dropdown */}
                                  <td className="py-4 px-4">
                                    <select
                                      value={c.status}
                                      onChange={(e) => {
                                        setSelectedComplaint(c);
                                        setNewStatus(e.target.value);
                                        setShowModal(true);
                                      }}
                                      className="bg-gray-800 border border-gray-600 px-2 py-1 rounded text-white text-xs sm:text-sm"
                                    >
                                      <option>Pending</option>
                                      <option>In Progress</option>
                                      <option>Resolved</option>
                                      <option>Rejected</option>
                                    </select>
                                  </td>

                                  {/* Date hidden on small */}
                                  <td className="py-4 px-4 text-gray-400 hidden md:table-cell">
                                    {c.date}
                                  </td>

                                  {/* Files */}
                                  <td className="py-4 px-4">
                                    {c.files?.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {c.files.map((file, i) => (
                                          <a
                                            key={i}
                                            href={`${config.BASE_URL}/${file.replace(/^\/+/, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1 bg-gray-800 rounded text-xs text-cyan-300 hover:text-white"
                                          >
                                            File {i + 1}
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 text-xs">None</span>
                                    )}
                                  </td>

                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        ) : view === 'notifications' ? (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Notifications</h2>

            {notifications.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No notifications.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n._id || n.message} className={`bg-[#111827] border border-gray-800 rounded-xl p-4 flex justify-between items-start`}> 
                    <div className="flex-1">
                      <p className="text-sm text-gray-200 font-medium">{n.message}</p>
                      {n.studentName && <p className="text-xs text-gray-400 mt-1">Student: {n.studentName} ({n.studentEmail})</p>}
                      {n.complaintId && <p className="text-xs text-gray-400 mt-1">Complaint: {n.complaintId}</p>}
                      <p className="text-xs text-gray-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs rounded ${n.read ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
                        {n.read ? 'Read' : 'New'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#111827] p-6 rounded-xl w-full max-w-md border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Update Complaint</h3>

              <p className="text-sm text-gray-400 mb-2">
                New Status: <span className="text-cyan-400">{newStatus}</span>
              </p>

              <textarea
                placeholder="Add comment (optional)"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded mb-4"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setAdminComment('');
                  }}
                  className="px-4 py-2 bg-gray-600 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={updateStatus}
                  className="px-4 py-2 bg-cyan-600 rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
    </div>
  
);
} 
import React, { useState, useEffect } from "react";
import { io as socketIO } from "socket.io-client";
import {
  LayoutDashboard,
  FileText,
  Bell,
  LogOut,
  Search,
  Menu,
  X,
  Users,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  Funnel,
  Eye,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import config from "../config/config";
import logoUrl from "../assets/images/logo.png";

const COLORS = ["#06B6D4", "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [view, setView] = useState("overview");
  // const [expandedStudents, setExpandedStudents] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("token");
  const [search, setSearch] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentComplaints, setStudentComplaints] = useState([]);
  const [showStudentComplaints, setShowStudentComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [page, setPage] = useState("students"); 
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    priority: "Low",
  });

  const fetchComplaintsData = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/complaints/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();

      const grouped = {};
      data.forEach((complaint) => {
        const student = complaint.studentId;
        if (!grouped[student._id]) {
          grouped[student._id] = {
            id: student._id,
            name: student.name,
            email: student.email,
            prn: student.prn,
            complaints: [],
          };
        }
        grouped[student._id].complaints.push({
          id: complaint._id,
          displayId: complaint.complaintId,
          title: complaint.title,
          category: complaint.category,
          description: complaint.description,
          priority: complaint.priority,
          status: complaint.status,
          date: new Date(complaint.createdAt).toLocaleDateString(),
          files: complaint.files || complaint.attachments || [],
          history: complaint.history || [],
          adminComment: complaint.adminComment || "",
          facultyName: complaint.facultyName || "",
        });
      });

      setStudentsData(Object.values(grouped));
      setError("");
    } catch (err) {
      setError(err.message || "Server error loading complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchComplaintsData();

    const fetchFacultyUsers = async () => {
      try {
        const res = await fetch(`${config.BASE_URL}/api/users/faculties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load faculties");
        const data = await res.json();
        setFacultyUsers(data);
      } catch (err) {
        console.error(err);
      }
    };

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
      fetchFacultyUsers();
      fetchNotifications();
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      socket = socketIO(`${config.BASE_URL.replace("/api", "")}`, {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        socket.emit("join", user._id || user.id);
      });

      socket.on("notification", (n) => {
        setNotifications((prev) => {
          const exists = prev.some((item) => (item._id || item.id) === (n._id || n.id));
          if (exists) return prev;
          return [n, ...prev];
        });
      });

      socket.on("complaintChanged", ({ action, complaint, student }) => {
        if (!complaint) return;

        const complaintCard = {
          id: complaint._id,
          displayId: complaint.complaintId,
          title: complaint.title,
          category: complaint.category,
          description: complaint.description,
          priority: complaint.priority,
          status: complaint.status,
          date: complaint.createdAt
            ? new Date(complaint.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          files: complaint.files || complaint.attachments || [],
          history: complaint.history || [],
          adminComment: complaint.adminComment || "",
        };

        const studentId = complaint.studentId && typeof complaint.studentId === "object"
          ? complaint.studentId._id || complaint.studentId.id
          : complaint.studentId;

        if (action === "deleted") {
          setStudentsData((prev) =>
            prev
              .map((studentItem) =>
                studentItem.id === studentId
                  ? {
                      ...studentItem,
                      complaints: studentItem.complaints.filter(
                        (c) => (c.id || c._id) !== (complaint._id || complaint.id),
                      ),
                    }
                  : studentItem,
              )
              .filter((studentItem) => studentItem.complaints.length > 0),
          );
          return;
        }

        setStudentsData((prev) => {
          const existingStudent = prev.find((studentItem) => studentItem.id === studentId);

          if (!existingStudent) {
            return [
              ...prev,
              {
                id: studentId,
                name: student?.name || "Unknown Student",
                email: student?.email || "",
                prn: student?.prn || "",
                complaints: [complaintCard],
              },
            ];
          }

          if (action === "created") {
            const exists = existingStudent.complaints.some(
              (c) => (c.id || c._id) === complaintCard.id,
            );
            if (exists) return prev;
            return prev.map((studentItem) =>
              studentItem.id === studentId
                ? { ...studentItem, complaints: [complaintCard, ...studentItem.complaints] }
                : studentItem,
            );
          }

          return prev.map((studentItem) =>
            studentItem.id === studentId
              ? {
                  ...studentItem,
                  complaints: studentItem.complaints.map((c) =>
                    (c.id || c._id) === complaintCard.id ? complaintCard : c,
                  ),
                }
              : studentItem,
          );
        });
      });
    }

    const interval = setInterval(fetchComplaintsData, 10000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(interval);
    };
  }, [token]);

  const allComplaints = studentsData.flatMap((s) => s.complaints || []);
  const filteredStudents = studentsData
    .map((student) => ({
      ...student,
      complaints: (student.complaints || []).filter(
        (c) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter(
      (student) =>
        student.complaints.length > 0 ||
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()),
    );

  const stats = [
    {
      label: "Total Complaints",
      value: allComplaints.length,
      change: `+${allComplaints.length}`,
      color: "cyan",
    },
    {
      label: "Pending",
      value: allComplaints.filter((c) => c.status === "Pending").length,
      color: "yellow",
    },
    {
      label: "In Progress",
      value: allComplaints.filter((c) => c.status === "In Progress").length,
      color: "blue",
    },
    {
      label: "Resolved",
      value: allComplaints.filter((c) => c.status === "Resolved").length,
      color: "green",
    },
    {
      label: "Rejected",
      value: allComplaints.filter((c) => c.status === "Rejected").length,
      color: "red",
    },
  ];

  const categoryCounts = allComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const statusChartData = stats.slice(1).map((stat) => ({
    name: stat.label,
    value: stat.value,
  }));

  const getStatusClasses = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "Rejected":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "Assigned":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm("Delete this complaint?")) return;

    try {
      const res = await fetch(`${config.BASE_URL}/api/complaints/${complaintId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete complaint");

      setStudentsData((prev) =>
        prev.map((student) => ({
          ...student,
          complaints: student.complaints.filter((c) => c.id !== complaintId),
        })),
      );
      fetchComplaintsData();
      setSuccessMsg("Complaint deleted successfully");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setSuccessMsg("❌ Failed to delete complaint");
    }
  };

  const openEditComplaint = (complaint) => {
    setEditingComplaint(complaint);
    setEditForm({
      title: complaint.title || "",
      category: complaint.category || "",
      description: complaint.description || "",
      priority: complaint.priority || "Low",
    });
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!editingComplaint) return;

    try {
      const res = await fetch(`${config.BASE_URL}/api/complaints/${editingComplaint.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update complaint");

      setStudentsData((prev) =>
        prev.map((student) => ({
          ...student,
          complaints: student.complaints.map((c) =>
            c.id === editingComplaint.id ? { ...c, ...editForm } : c,
          ),
        })),
      );

      if (selectedComplaint && selectedComplaint.id === editingComplaint.id) {
        setSelectedComplaint((prev) => prev ? { ...prev, ...editForm } : prev);
      }

      setEditingComplaint(null);
      setSuccessMsg("Complaint updated successfully");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setSuccessMsg("❌ Failed to update complaint");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== notificationId));
    } catch (err) {
      setSuccessMsg("❌ Failed to delete notification");
    }
  };

  const handleAssignToFaculty = async () => {
  

  try {
    const res = await fetch(
      `${config.BASE_URL}/api/complaints/${selectedComplaint.id}/assign`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId: selectedFacultyId,
        }),
      }
    );

    console.log("Status =", res.status);

    const data = await res.json();
    console.log(data);

    if (!res.ok) throw new Error(data.error);

  } catch (err) {
    console.log(err);
  }
};

  const updateStatus = async () => {
    try {
      const res = await fetch(
        `${config.BASE_URL}/api/complaints/${selectedComplaint.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            adminComment: adminComment,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to update");

      setStudentsData((prev) =>
        prev.map((student) => ({
          ...student,
          complaints: student.complaints.map((c) =>
            c.id === selectedComplaint.id
              ? { ...c, status: newStatus, adminComment }
              : c,
          ),
        })),
      );

      setSuccessMsg("Updated successfully");
      setTimeout(() => setSuccessMsg(""), 2000);

      setShowModal(false);
      setAdminComment("");
    } catch (err) {
      setSuccessMsg("❌ Failed to update");
    }
  };

  // const toggleStudentDetails = (studentId) => {
  //   setExpandedStudents(prev => ({
  //     ...prev,
  //     [studentId]: !prev[studentId]
  //   }));
  // };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col">
      {/* Fixed Responsive Header */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-[#111827] border-b border-gray-800 z-30 flex items-center px-3 sm:px-4">
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              {/* <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div> */}
              <img
                src={logoUrl}
                alt="Logo"
                className="w-9 h-9  object-contain"
              />
              <span className="text-base sm:text-lg font-semibold hidden sm:block">
                Admin Panel
              </span>
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
                onClick={() => {
                  setView("notifications");
                  setSidebarOpen(false);
                }}
                className="relative text-gray-400 hover:text-white transition"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-[10px] px-1 rounded-full font-semibold">
                    {notifications.filter((n) => !n.read).length}
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
      <aside
        className={`
        fixed top-0 left-0 h-full
        bg-[#111827]
        border-r border-gray-800
        z-20
        transition-all duration-300
        ${sidebarCollapsed ? "w-20" : "w-64"}
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className=" 
          hidden lg:flex
          absolute -right-4 top-18
          w-8 h-8
          rounded-full
          bg-cyan-500
          flex items-center justify-center
          shadow-lg
          hover:scale-110
          transition
          z-50
        "
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white" />
          )}
        </button>

        <div className="pt-18 px-3 space-y-2">
          <button
            onClick={() => {
              setView("overview");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-lg transition ${view === "overview"
              ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
              : "text-gray-400 hover:bg-gray-800/50"
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>
          <button
            onClick={() => {
              setView("students");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-lg transition ${view === "students"
              ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
              : "text-gray-400 hover:bg-gray-800/50"
              }`}
          >
            <Users className="w-5 h-5" />
            {!sidebarCollapsed && <span>Manage Students</span>}
          </button>
          <button
            onClick={() => {
              setView("notifications");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-lg transition ${view === "notifications"
              ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
              : "text-gray-400 hover:bg-gray-800/50"
              }`}
          >
            <Bell className="w-5 h-5" />
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Scrollable Main Content */}
      <main
        className={`flex-1 overflow-y-auto mt-14 sm:mt-16 bg-[#0b111e] p-4 sm:p-6 lg:p-8 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
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
        ) : view === "overview" ? (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:border-[#06B6D4]/50 transition-all"
                >
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div
                      className={`p-2 sm:p-3 rounded-lg bg-${stat.color}-500/10`}
                    >
                      {stat.label === "Total Complaints" && (
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                      )}
                      {stat.label === "Pending" && (
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                      )}
                      {stat.label === "In Progress" && (
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      )}
                      {stat.label === "Resolved" && (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                      )}
                      {stat.label === "Rejected" && (
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                      )}
                    </div>
                    {/* <span className={`text-xs sm:text-sm ${stat.change?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change || '+0'}
                    </span> */}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 sm:p-6 shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Complaints by Category
                </h3>
                <div className="h-64 min-h-64">
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
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "none",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 sm:p-6 shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Complaints by Status
                </h3>
                <div className="h-64 min-h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                        }}
                      />
                      <Bar dataKey="value" fill="#06B6D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <p className="mt-8 text-gray-400 text-center text-sm">
              Click "Manage Students" in the sidebar to view individual student
              complaints
            </p>
          </div>
        ) : view === "students" ? (
          <div className="mb-6 relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Manage Students
            </h2>
            <div className="absolute right-0 top-0">
              <button
                onClick={() => setShowFilter((prev) => !prev)}
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                <Funnel className="w-5 h-5 text-gray-300" />
              </button>

              {showFilter && (
                <div className="absolute right-0 mt-2 w-44 bg-[#111827] border border-gray-700 rounded-lg shadow-lg z-50">
                  {[
                    "All",
                    "Pending",
                    "In Progress",
                    "Assigned",
                    "Resolved",
                    "Rejected",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${statusFilter === status
                        ? "text-cyan-400"
                        : "text-gray-300"
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Status Filter */}
            {page === "students" && (
              filteredStudents.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  No students found.
                </p>
              ) : (
                <div className="space-y-6">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="bg-[#111827] border border-gray-800 rounded-xl p-6 flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-xl font-semibold">
                          {student.name}
                        </h3>

                        <p className="text-cyan-400">PRN : {student.prn}</p>

                        <p className="text-gray-400">{student.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentComplaints(student.complaints);
                          setPage("complaints");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {page === "complaints" && (
              <>
                <div className="flex items-center mb-6 bg-[#111827] border border-gray-800 rounded-lg p-3">
                  <div className="flex-1"> 
                    <h2 className="text-xl font-bold">Name: {selectedStudent.name}</h2>
                    <p className="text-cyan-400 text-base">PRN: {selectedStudent.prn}</p>
                  </div>
                    <button
                      onClick={() => setPage("students")}
                      className="mr-4 flex items-center gap-2 px-4 py-2"
                    >
                      <ArrowLeft />
                      back
                    </button>
                </div>

                <div className="bg-[#111827] border border-gray-800 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
                  <table className="min-w-full divide-y mt-3 divide-gray-800">
                    <thead className="bg-[#111827]">
                      <tr className="text-left text-gray-400 text-sm">
                        <th className="pb-4 px-4">ID</th>
                        <th className="pb-4 px-4">Problem</th>
                        <th className="pb-4 px-4">Category</th>
                        <th className="pb-4 px-4">Priority</th>
                        <th className="pb-4 px-4">Status</th>
                        <th className="pb-4 px-4 hidden md:table-cell">Date</th>
                        <th className="pb-4 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {studentComplaints.map((c) => (
                        <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/60 transition-colors duration-200">
                          <td className="px-4 py-4 text-cyan-400 font-medium">
                            {c.displayId}
                          </td>
                          <td className="px-4 py-4 text-white max-w-[260px]">
                            <div>
                              <p className="font-semibold line-clamp-1">{c.title}</p>
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                {c.description || "No description provided."}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/20">
                              {c.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs ${
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
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs ${getStatusClasses(c.status)}`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-400 hidden md:table-cell">
                            {c.date}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setSelectedFacultyId(c.facultyId || "");
                                  setPage("details");
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-full hover:bg-gray-700"
                              >
                                <Eye size={16} />
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteComplaint(c.id)}
                                className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                title="Delete complaint"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {page === "details" && selectedComplaint && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">Complaint Details</h2>
                  <button
                    onClick={() => setPage("complaints")}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <ArrowLeft />
                    Back
                  </button>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl shadow-lg shadow-cyan-500/10 p-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">
                        Tracking Number
                      </p>
                      <p className="text-xl font-semibold text-cyan-400 mb-5">
                        {selectedComplaint.displayId}
                      </p>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="rounded-xl bg-[#0b1321] p-3 border border-gray-700">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-2">
                            Date Submitted
                          </p>
                          <p className="text-sm text-gray-200">
                            {selectedComplaint.date}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#0b1321] p-4 border border-gray-700">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-2">
                            Category
                          </p>
                          <span className="inline-flex px-5 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                            {selectedComplaint.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-2">
                            Priority
                          </p>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              selectedComplaint.priority === "High"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : selectedComplaint.priority === "Medium"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}
                          >
                            {selectedComplaint.priority}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-2">
                            Status
                          </p>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(newStatus || selectedComplaint.status)}`}
                          >
                            {newStatus || selectedComplaint.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-2">
                          Assign Faculty
                        </p>
                        <select
                          value={selectedFacultyId}
                          onChange={(e) => setSelectedFacultyId(e.target.value)}
                          className="w-full bg-[#0b1321] rounded-xl p-2 text-[14px] border border-gray-700 text-white"
                        >
                          <option>Select faculty</option>
                          {facultyUsers.map((faculty) => (
                            <option  key={faculty._id} value={faculty._id}>
                              {faculty.name} ({faculty.department || "Department"})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignToFaculty}
                          className="mt-3 w-full rounded-xl bg-cyan-600 px-3 py-2 mb-1 text-sm font-medium text-white"
                        >
                          Assign to Faculty
                        </button>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 m-1">
                          Change Status
                        </p>
                        <select
                          value={newStatus || selectedComplaint.status}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full bg-[#0b1321] rounded-xl p-2 border border-gray-700 text-white"
                        >
                          <option>Pending</option>
                          <option>Assigned</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                          <option>Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-3">
                      <div className="rounded-xl bg-[#0b1321] p-3 border border-gray-700">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">
                          Title
                        </p>
                        <h3 className="text-[16px] font-semibold text-white mb-4">
                          {selectedComplaint.title}
                        </h3>
                      </div>
                      <div className="rounded-xl bg-[#0b1321] mt-2 p-3 border border-gray-700">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">
                          Description
                        </p>
                        <p className="text-gray-300 leading-7">
                          {selectedComplaint.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-[#111827] border border-gray-800 rounded-xl p-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">
                          Admin Comment
                        </p>
                        <textarea
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          className="w-full min-h-[100px] bg-[#0b1321] rounded-xl p-2 border border-gray-700 text-gray-200"
                          placeholder="Add a comment for the student"
                        />
                      </div>

                      <button
                        onClick={updateStatus}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-[1.01] transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                      <div className="relative border-l-2 border-cyan-500 pl-6">
                        {selectedComplaint.history?.length > 0 ? (
                          selectedComplaint.history.map((item, index) => (
                            <div key={index} className="relative mb-6 last:mb-0">
                              <span className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-cyan-400 border-4 border-[#0f172a]" />
                              <p className="text-sm font-semibold text-white">
                                {item.status}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(item.date).toLocaleString()}
                              </p>
                              {item.comment && (
                                <p className="mt-2 text-gray-300">
                                  {item.comment}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No timeline available</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                      {selectedComplaint.files?.length > 0 ? (
                        <div className="space-y-3">
                          {selectedComplaint.files.map((file, index) => (
                            <button
                              key={index}
                              onClick={() => window.open(file, "_blank")}
                              className="w-full text-left px-2 py-3 rounded-xl bg-[#0b1321] border border-gray-700 text-gray-200 hover:border-cyan-500 transition"
                            >
                              Attachment {index + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No attachments</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* end page render switch */}
          </div>
        ) : view === "notifications" ? (
          <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">
                Notifications
              </h2>

              {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  No notifications.
                </p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((n) => (
                    <div
                      key={n._id || n.message}
                      className={`bg-[#111827] border border-gray-800 rounded-xl p-4 flex justify-between items-start`}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 font-medium">
                          {n.message}
                        </p>
                        {n.studentName && (
                          <p className="text-xs text-gray-400 mt-1">
                            Student: {n.studentName} ({n.studentEmail})
                          </p>
                        )}
                        {n.complaintId && (
                          <p className="text-xs text-gray-400 mt-1">
                            Complaint: {n.complaintId}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteNotification(n._id || n.id)}
                          className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          title="Delete notification"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span
                          className={`px-2 py-1 text-xs rounded ${n.read ? "bg-gray-700 text-gray-300" : "bg-blue-600 text-white"}`}
                        >
                          {n.read ? "Read" : "New"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        ) : null}

        {editingComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-[#111827] p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Edit Complaint</h3>
                <button onClick={() => setEditingComplaint(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateComplaint} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-2 text-white"
                      required
                    >
                      <option value="">Select category</option>
                      <option>Hostel</option>
                      <option>Academics</option>
                      <option>Mess</option>
                      <option>IT</option>
                      <option>Library</option>
                      <option>Transport</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-2 text-white"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="min-h-32 w-full rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingComplaint(null)} className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </main>
    </div>
  );
}

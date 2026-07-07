import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import {
    ClipboardList,
    Clock3,
    LoaderCircle,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    LayoutDashboard,
    FileText,
    Bell,
    LogOut,
    Search,
    Menu,
    X,
    AlertCircle,
    Clock,
    Loader2,
    Eye,
    Pencil,
    UserCircle2,
    BarChart3,
    User,
    ShieldCheck,
    FileBarChart,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import config from "../config/config";

export default function FacultyDashboard() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState("overview");
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState("In Progress");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const faculty = JSON.parse(sessionStorage.getItem("user"));


    useEffect(() => {
        if (!token || user.role !== "faculty") {
            navigate("/login");
            return;
        }

        const fetchComplaints = async () => {
            try {
                const res = await fetch(`${config.BASE_URL}/api/complaints/faculty`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to load complaints");
                setComplaints(data);
            } catch (err) {
                setMessage(err.message || "Could not load complaints");
            } finally {
                setLoading(false);
            }
        };

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${config.BASE_URL}/api/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) setNotifications(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchComplaints();
        fetchNotifications();

        const socket = socketIO(`${config.BASE_URL.replace("/api", "")}`, { transports: ["websocket"] });
        socket.on("connect", () => socket.emit("join", user._id));
        socket.on("notification", (n) => setNotifications((prev) => [n, ...prev]));
        socket.on("complaintChanged", (payload) => {
            const complaint = payload?.complaint || payload;
            if (!complaint) return;
            const updatedComplaint = payload?.student
                ? { ...complaint, studentId: payload.student }
                : complaint;
            setComplaints((prev) => {
                if (payload.action === "deleted") {
                    return prev.filter((item) => item._id !== updatedComplaint._id);
                }
                const exists = prev.some((item) => item._id === updatedComplaint._id);
                if (!exists) return [updatedComplaint, ...prev];
                return prev.map((item) => (item._id === updatedComplaint._id ? updatedComplaint : item));
            });
        });
        socket.on("complaintAssigned", (payload) => {
            const complaint = payload?.complaint || payload;
            if (!complaint) return;
            const updatedComplaint = payload?.student
                ? { ...complaint, studentId: payload.student }
                : complaint;
            setComplaints((prev) => {
                const exists = prev.some((item) => item._id === updatedComplaint._id);
                if (exists) return prev.map((item) => (item._id === updatedComplaint._id ? updatedComplaint : item));
                return [updatedComplaint, ...prev];
            });
        });

        return () => socket.disconnect();
    }, [navigate, token, user._id, user.role]);

    const filteredComplaints = useMemo(() => {
        const q = search.toLowerCase();
        return complaints.filter((complaint) => {
            const studentName = complaint.studentId?.name || "";
            return (
                complaint.complaintId?.toLowerCase().includes(q) ||
                studentName.toLowerCase().includes(q) ||
                complaint.category?.toLowerCase().includes(q) ||
                complaint.title?.toLowerCase().includes(q)
            );
        });
    }, [complaints, search]);

    const stats = [
        {
            label: "Assigned",
            value: complaints.length,
            color: "cyan",
            icon: ClipboardList,
        },
        {
            label: "Pending",
            value: complaints.filter((c) => c.status === "Pending").length,
            color: "yellow",
            icon: AlertCircle,
        },
        {
            label: "In Progress",
            value: complaints.filter((c) => c.status === "In Progress").length,
            color: "blue",
            icon: Clock,
        },
        {
            label: "Resolved",
            value: complaints.filter((c) => c.status === "Resolved").length,
            color: "green",
            icon: CheckCircle2,
        },
        {
            label: "Rejected",
            value: complaints.filter((c) => c.status === "Rejected").length,
            color: "red",
            icon: X,
        },
    ];

    const chartData = [
        { name: "Assigned", value: complaints.length },
        { name: "Pending", value: complaints.filter((c) => c.status === "Pending").length },
        { name: "In Progress", value: complaints.filter((c) => c.status === "In Progress").length },
        { name: "Resolved", value: complaints.filter((c) => c.status === "Resolved").length },
        { name: "Rejected", value: complaints.filter((c) => c.status === "Rejected").length },
    ];

    const openComplaint = (complaint) => {
        setSelectedComplaint(complaint);
        setComment(complaint.facultyComment || "");
        setStatus(complaint.status || "In Progress");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        setSaving(true);
        setMessage("");

        try {
            const res = await fetch(`${config.BASE_URL}/api/complaints/${selectedComplaint._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status, facultyComment: comment }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update complaint");
            setMessage("Complaint updated successfully");
            setComplaints((prev) => prev.map((item) => (item._id === selectedComplaint._id ? { ...item, status, facultyComment: comment } : item)));
            setSelectedComplaint((prev) => prev ? { ...prev, status, facultyComment: comment } : prev);
        } catch (err) {
            setMessage(err.message || "Could not update complaint");
        } finally {
            setSaving(false);
        }
    };

    const sidebarItems = [
        { key: "overview", label: "Dashboard", icon: LayoutDashboard },
        { key: "assigned", label: "Assigned Complaints", icon: FileText },
        { key: "history", label: "Complaint History", icon: FileBarChart },
        { key: "reports", label: "Reports", icon: BarChart3 },
        { key: "notifications", label: "Notifications", icon: Bell },
        { key: "profile", label: "Profile", icon: User },
    ];
    const startWork = async (id) => {
        try {

            const res = await fetch(
                `${config.BASE_URL}/api/complaints/${id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: "In Progress",
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            fetchComplaints();

        } catch (err) {
            alert(err.message);
        }
    };
    // Faculty Performance 
    const assignedCount = complaints.length;

    const resolvedCount = complaints.filter(
        (c) => c.status === "Resolved"
    ).length;

    const pendingCount = complaints.filter(
        (c) => c.status === "Pending"
    ).length;

    const progressCount = complaints.filter(
        (c) => c.status === "In Progress"
    ).length;

    //  Priority Report 
    const highPriority = complaints.filter(
        (c) => c.priority === "High"
    ).length;

    const mediumPriority = complaints.filter(
        (c) => c.priority === "Medium"
    ).length;

    const lowPriority = complaints.filter(
        (c) => c.priority === "Low"
    ).length;

    //Average Resolution Time
    const resolvedComplaints = complaints.filter(
        (c) =>
            c.status === "Resolved" &&
            c.createdAt &&
            c.resolvedAt
    );

    const averageDays =
        resolvedComplaints.length > 0
            ? (
                resolvedComplaints.reduce((sum, complaint) => {
                    const created = new Date(complaint.createdAt);
                    const resolved = new Date(complaint.resolvedAt);

                    return (
                        sum +
                        (resolved - created) /
                        (1000 * 60 * 60 * 24)
                    );
                }, 0) / resolvedComplaints.length
            ).toFixed(1)
            : 0;

    // Fastest Resolution 
    const fastestHours =
        resolvedComplaints.length > 0
            ? Math.min(
                ...resolvedComplaints.map((complaint) => {
                    const created = new Date(complaint.createdAt);
                    const resolved = new Date(complaint.resolvedAt);

                    return (
                        (resolved - created) /
                        (1000 * 60 * 60)
                    );
                })
            ).toFixed(1)
            : 0;
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="flex">
                <aside
                    className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                    {/* Desktop Arrow */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex absolute -right-5 top-15 w-8 h-8 rounded-full bg-cyan-500 items-center justify-center shadow-lg hover:scale-110transition z-50 "
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-5 h-5 text-white" />
                        ) : (
                            <ChevronLeft className="w-5 h-5 text-white" />
                        )}
                    </button>

                    <div className="p-4">

                        <div className="flex justify-between items-center mb-8">

                            {!sidebarCollapsed && (
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Faculty Panel
                                    </h2>

                                    <p className="text-sm text-slate-400">
                                        Assigned Complaints
                                    </p>
                                </div>
                            )}

                            <button
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="space-y-2">

                            {sidebarItems.map(({ key, label, icon: Icon }) => (

                                <button
                                    key={key}
                                    onClick={() => {
                                        setActiveSection(key);
                                        setSidebarOpen(false);
                                        setSelectedComplaint(null);
                                    }}
                                    className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-3 rounded-xl transition ${activeSection === key ? "bg-cyan-600/20 text-cyan-300" : "hover:bg-slate-800 text-slate-300"}`}>
                                    <Icon size={20} />
                                    {!sidebarCollapsed && <span>{label}</span>}

                                </button>

                            ))}

                            <button
                                onClick={() => {
                                    sessionStorage.clear();
                                    navigate("/login");
                                }}
                                className="w-full flex items-center mt-6 px-3 py-3 rounded-xl hover:bg-slate-800 text-slate-300 transition justify-center lg:justify-start">

                                <LogOut size={20} />

                                {!sidebarCollapsed && (
                                    <span className="ml-3">
                                        Logout
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                </aside>
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <main
                    className={`flex-1 overflow-x-hidden p-4 lg:p-8 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold">
                                    Welcome Back, {faculty.name}
                                </h2>
                                <p className="text-gray-500 text-sm sm:text-base">
                                    {faculty.department}
                                </p>
                                <p className="text-sm text-slate-400">Manage your assigned complaints and updates.</p>
                            </div>
                        </div>
                    </div>

                    {message ? <div className="mb-4 rounded-lg border border-cyan-700 bg-cyan-900/30 px-4 py-3 text-sm text-cyan-200">{message}</div> : null}

                    {activeSection === "overview" && (
                        <>
                            <div className="grid grid-cols-3 sm:grid-cols-5  gap-4 mb-8">
                                {stats.map((stat, i) => {
                                    const Icon = stat.icon;

                                    return (
                                        <div
                                            key={i}
                                            className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-4 shadow hover:border-cyan-500/50 transition"
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div
                                                    className={`p-2 rounded-lg bg-${stat.color}-500/10`}
                                                >
                                                    <Icon
                                                        className={`w-5 h-5 text-${stat.color}-400`}
                                                    />
                                                </div>
                                            </div>

                                            <h2 className="text-2xl font-bold text-white">
                                                {stat.value}
                                            </h2>

                                            <p className="text-sm text-gray-400 mt-1">
                                                {stat.label}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <h2 className="mb-4 text-lg font-semibold">Complaint Status Overview</h2>
                                <div className="h-60 sm:h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#06B6D4" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {activeSection === "assigned" && (
                        <>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center mb-4">
                                    <h2 className="text-lg font-semibold">Assigned Complaints</h2>
                                    <div className="relative w-full lg:w-80">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search complaints" className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-sm text-white" />
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading complaints...</div>
                                ) : filteredComplaints.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No assigned complaints found.</div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl">
                                        <table className="min-w-full text-sm whitespace-nowrap">
                                            <thead className="text-left text-slate-400">
                                                <tr>
                                                    <th className="px-3 py-2">ID</th>
                                                    <th className="px-3 py-2">Student</th>
                                                    <th className="px-3 py-2">Category</th>
                                                    <th className="px-3 py-2">Priority</th>
                                                    <th className="px-3 py-2">Status</th>
                                                    <th className="px-3 py-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredComplaints.map((complaint) => (
                                                    <tr key={complaint._id} className="border-t border-slate-800">
                                                        <td className="px-3 py-3">{complaint.complaintId}</td>
                                                        <td className="px-3 py-3">{complaint.studentId?.name || "Student"}</td>
                                                        <td className="px-3 py-3 bg-">{complaint.category}</td>
                                                        <td className="px-3 py-3">{complaint.priority}</td>
                                                        <td className="px-3 py-3">{complaint.status}</td>
                                                        <td className="px-3 py-3"><button onClick={() => openComplaint(complaint)} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm">View</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            {selectedComplaint && (
                                <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-400">Complaint Details</p>
                                                <h3 className="text-xl font-semibold">{selectedComplaint.title}</h3>
                                            </div>
                                            <button onClick={() => {
                                                setSelectedComplaint(null);
                                                setComment("");
                                                setStatus("In Progress");
                                            }} className="text-slate-400">Close</button>
                                        </div>
                                        <div className="mt-4 grid gap-3 text-sm text-slate-300">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">Complaint ID</span><span>{selectedComplaint.complaintId}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">Student Name</span><span>{selectedComplaint.studentId?.name || "Student"}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">PRN</span><span>{selectedComplaint.studentId?.prn || "-"}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">Category</span><span>{selectedComplaint.category}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">Priority</span><span>{selectedComplaint.priority}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">Status</span><span>{selectedComplaint.status}</span></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><span className="text-slate-500">Description</span><span>{selectedComplaint.description}</span></div>
                                        </div>
                                        {selectedComplaint.files?.length ? (
                                            <div className="mt-4">
                                                <p className="text-sm text-slate-400">Uploaded Files</p>
                                                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                                    {selectedComplaint.files.map((file) => (
                                                        <a key={file} href={`${config.BASE_URL}${file}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-cyan-300">View File</a>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                                        <div className="flex items-center gap-2 text-cyan-300"><Clock size={16} /> Update Status</div>
                                        <form onSubmit={handleSave} className="mt-4 space-y-4">
                                            <div>
                                                <label className="mb-2 block text-sm text-slate-400">Status</label>
                                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white">
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm text-slate-400">Faculty Comment</label>
                                                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="5" className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Add remarks or resolution notes" />
                                            </div>
                                            <button disabled={saving} className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium">{saving ? "Saving..." : "Save Changes"}</button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeSection === "history" && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                            <h2 className="mb-4 text-lg font-semibold">Resolved Complaints History</h2>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-sm">
                                        Total Resolved
                                    </p>

                                    <h2 className="text-3xl font-bold text-green-400 mt-2">
                                        {resolvedCount}
                                    </h2>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-sm">
                                        Average Resolution
                                    </p>

                                    <h2 className="text-3xl font-bold text-cyan-400 mt-2">
                                        {averageDays} Days
                                    </h2>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                    <p className="text-slate-400 text-sm">
                                        Fastest Resolution
                                    </p>

                                    <h2 className="text-3xl font-bold text-yellow-400 mt-2">
                                        {fastestHours} Hours
                                    </h2>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left text-slate-400">
                                        <tr>
                                            <th className="px-3 py-2">Complaint ID</th>
                                            <th className="px-3 py-2">Student</th>
                                            <th className="px-3 py-2">Category</th>
                                            <th className="px-3 py-2">Completed Date</th>
                                            <th className="px-3 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {complaints.filter((c) => c.status === "Resolved").length === 0 ? (
                                            <tr><td colSpan="5" className="px-3 py-6 text-center text-slate-400">No resolved complaints yet.</td></tr>
                                        ) : complaints.filter((c) => c.status === "Resolved").map((complaint) => (
                                            <tr key={complaint._id} className="border-t border-slate-800">
                                                <td className="px-3 py-3">{complaint.complaintId}</td>
                                                <td className="px-3 py-3">{complaint.studentId?.name || "Student"}</td>
                                                <td className="px-3 py-3">{complaint.category}</td>
                                                <td className="px-3 py-3">{complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString() : "-"}</td>
                                                <td className="px-3 py-3">Resolved</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === "reports" && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <h2 className="mb-4 text-lg font-semibold">Resolution Summary</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <h2 className="mb-4 text-lg font-semibold">Category Distribution</h2>
                                <div className="space-y-3">
                                    {Object.entries(complaints.reduce((acc, complaint) => { acc[complaint.category] = (acc[complaint.category] || 0) + 1; return acc; }, {})).map(([category, count]) => (
                                        <div key={category} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                                            <div className="mb-1 flex items-center justify-between text-sm"><span>{category}</span><span className="text-cyan-300">{count}</span></div>
                                            <div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.min((count / Math.max(complaints.length, 1)) * 100, 100)}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mt-6">

                                {/* Faculty Performance */}

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                                    <h2 className="text-lg font-semibold mb-5">
                                        Faculty Performance
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                            <p className="text-slate-400 text-sm">
                                                Assigned
                                            </p>
                                            <h2 className="text-3xl font-bold text-cyan-400">
                                                {assignedCount}
                                            </h2>
                                        </div>

                                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                            <p className="text-slate-400 text-sm">
                                                Resolved
                                            </p>

                                            <h2 className="text-3xl font-bold text-green-400">
                                                {resolvedCount}
                                            </h2>
                                        </div>

                                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                            <p className="text-slate-400 text-sm">
                                                Pending
                                            </p>

                                            <h2 className="text-3xl font-bold text-yellow-400">
                                                {pendingCount}
                                            </h2>
                                        </div>

                                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                            <p className="text-slate-400 text-sm">
                                                In Progress
                                            </p>

                                            <h2 className="text-3xl font-bold text-blue-400">
                                                {progressCount}
                                            </h2>
                                        </div>

                                    </div>

                                </div>

                                {/* Priority Report */}

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">

                                    <h2 className="text-lg font-semibold mb-5">
                                        Priority Handling
                                    </h2>

                                    <div className="space-y-4">

                                        <div className="flex justify-between border-b border-slate-800 pb-3">
                                            <span>High Priority</span>
                                            <span className="text-red-400 font-bold">
                                                {highPriority}
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-b border-slate-800 pb-3">
                                            <span>Medium Priority</span>
                                            <span className="text-yellow-400 font-bold">
                                                {mediumPriority}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>Low Priority</span>
                                            <span className="text-green-400 font-bold">
                                                {lowPriority}
                                            </span>
                                        </div>

                                    </div>

                                </div>

                            </div>
                        </div>
                    )}

                    {activeSection === "notifications" && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                            <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
                            <div className="space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">No notifications yet.</div>
                                ) : notifications.map((item) => (
                                    <div key={item._id || item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                                        <p>{item.message}</p>
                                        <p className="mt-1 text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === "profile" && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                            <h2 className="mb-4 text-lg font-semibold">Faculty Profile</h2>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-600/20 text-2xl font-semibold text-cyan-300">{(user.name || "F").charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{user.name || "Faculty"}</h3>
                                        <p className="text-sm text-slate-400">{user.department || "Computer Department"}</p>
                                        <p className="text-sm text-slate-400">{user.designation || "Professor"}</p>
                                    </div>
                                </div>
                                <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><span className="block text-slate-500">Email</span>{user.email || "-"}</div>
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><span className="block text-slate-500">Employee ID</span>{user.employeeId || "-"}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
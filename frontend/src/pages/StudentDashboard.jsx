import React, { useState, useEffect } from "react";
import { io as socketIO } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Bell,
  LogOut,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  PlusCircle,
  Loader2,
  Trash2,
  Pencil,
  CheckCircle,
  User as UserIcon,
  Key,
  History,
  Funnel,
  Eye,
  UserCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import config from "../config/config";
import logoUrl from "../assets/images/logo.png";
import { Download } from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusChangeToast, setStatusChangeToast] = useState(null);
  const previousComplaintsRef = React.useRef(null);
  const isInitialLoadRef = React.useRef(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [priority, setPriority] = useState("Low");
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    priority: "Low",
  });
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintDetails, setShowComplaintDetails] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileTab, setProfileTab] = useState("personal");
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [profile, setProfile] = useState({
    fullName: user.fullName || user.name || "",
    prn: user.prn || "",
    college: user.college || "",
    degree: user.degree || "",
    branch: user.branch || "",
    semester: user.semester || "",
    batch: user.batch || "",
    rollNumber: user.rollNumber || "",
    dob: user.dob || "",
    gender: user.gender || "",
    bloodGroup: user.bloodGroup || "",
    studentMobile: user.studentMobile || "",
    email: user.email || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    pincode: user.pincode || "",
    fatherName: user.fatherName || "",
    fatherMobile: user.fatherMobile || "",
    motherName: user.motherName || "",
    motherMobile: user.motherMobile || "",
    profileImage: user.profileImage || "",
  });
  const studentName = user?.name || "Student";
  const studentInitial = studentName.charAt(0).toUpperCase();

  const getProfileCompletionStatus = (currentProfile = profile) => {
    const hasRequiredValue = (value) => {
      if (typeof value === "string") return value.trim() !== "";
      return Boolean(value);
    };

    return Boolean(
      hasRequiredValue(currentProfile.fullName) &&
      hasRequiredValue(currentProfile.dob) &&
      hasRequiredValue(currentProfile.college) &&
      hasRequiredValue(currentProfile.degree) &&
      hasRequiredValue(currentProfile.branch) &&
      hasRequiredValue(currentProfile.semester) &&
      hasRequiredValue(currentProfile.batch) &&
      hasRequiredValue(currentProfile.rollNumber) &&
      hasRequiredValue(currentProfile.studentMobile) &&
      hasRequiredValue(currentProfile.address) &&
      hasRequiredValue(currentProfile.fatherName) &&
      hasRequiredValue(currentProfile.fatherMobile) &&
      hasRequiredValue(currentProfile.motherName) &&
      hasRequiredValue(currentProfile.motherMobile) &&
      (hasRequiredValue(currentProfile.profileImage) ||
        hasRequiredValue(profileImage)),
    );
  };

  useEffect(() => {
    if (!token || user.role !== "student") {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${config.BASE_URL}/api/users/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        const profileData = data.profile || data.user || data;

        setProfile({
          fullName: profileData.fullName || "",
          prn: profileData.prn || "",
          college: profileData.college || "",
          degree: profileData.degree || "",
          branch: profileData.branch || "",
          semester: profileData.semester || "",
          batch: profileData.batch || "",
          rollNumber: profileData.rollNumber || "",
          dob: profileData.dob || "",
          gender: profileData.gender || "",
          bloodGroup: profileData.bloodGroup || "",
          studentMobile: profileData.studentMobile || "",
          email: profileData.email || "",
          address: profileData.address || "",
          city: profileData.city || "",
          state: profileData.state || "",
          pincode: profileData.pincode || "",
          fatherName: profileData.fatherName || "",
          fatherMobile: profileData.fatherMobile || "",
          motherName: profileData.motherName || "",
          motherMobile: profileData.motherMobile || "",
          profileImage: profileData.profileImage || "",
        });

        setProfileCompleted(getProfileCompletionStatus(profileData));
      } catch (err) {
        console.error(err);
      }
    };

    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${config.BASE_URL}/api/complaints`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            errorText.includes("No token") ||
              errorText.includes("Invalid token")
              ? "Please log in again to view complaints."
              : "Failed to fetch complaints",
          );
        }

        const data = await res.json();

        const newComplaints = data.map((c) => ({
          id:
            c.complaintId || `CMP-${c._id.toString().slice(-8).toUpperCase()}`,
          title: c.title,
          category: c.category,
          description: c.description,
          priority: c.priority || "Low",
          status: c.status,

          adminComment: c.adminComment || "",
          history: c.history || [],

          date: new Date(c.createdAt).toLocaleDateString(),
          files: c.files || [],
          _id: c._id,
        }));

        // Detect status changes only after initial load (not on first fetch)
        if (!isInitialLoadRef.current && previousComplaintsRef.current) {
          newComplaints.forEach((newComplaint) => {
            const oldComplaint = previousComplaintsRef.current.find(
              (c) => c._id === newComplaint._id,
            );
            if (oldComplaint && oldComplaint.status !== newComplaint.status) {
              // Show notification only for this specific student's complaints
              setStatusChangeToast({
                complaintId: newComplaint.id,
                title: newComplaint.title,
                oldStatus: oldComplaint.status,
                newStatus: newComplaint.status,
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
        setErrorMessage("Error loading complaints: " + err.message);
        setMyComplaints([]);
      } finally {
        setLoadingComplaints(false);
      }
    };

    fetchProfile();
    fetchComplaints();

    // Poll for updates every 10 seconds for real-time status changes
    const pollInterval = setInterval(fetchComplaints, 10000);

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${config.BASE_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        // Filter to only this student's notifications by userId
        const studentNotifications = data.filter(
          (n) => !n.userId || n.userId === user._id,
        );
        setNotifications(studentNotifications);
      } catch (err) {
        console.error("Notification error:", err);
      }
    };

    // initial load + realtime socket subscription
    let socket;

    if (token && user?._id) {
      fetchNotifications();

      socket = socketIO(`${config.BASE_URL.replace("/api", "")}`, {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        socket.emit("join", user._id); // join after connect
      });

      socket.on("notification", (data) => {
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === data._id);
          if (exists) return prev;
          return [data, ...prev];
        });
      });

      socket.on("statusUpdate", (updatedComplaint) => {
        setMyComplaints((prev) =>
          prev.map((c) =>
            c._id === updatedComplaint._id
              ? {
                  ...c,
                  status: updatedComplaint.status,
                  adminComment: updatedComplaint.adminComment,
                }
              : c,
          ),
        );
      });

      socket.on("complaintChanged", ({ action, complaint }) => {
        if (!complaint) return;

        const normalizedComplaint = {
          id: complaint.complaintId || `CMP-${complaint._id?.toString().slice(-8).toUpperCase()}`,
          title: complaint.title,
          category: complaint.category,
          description: complaint.description,
          priority: complaint.priority || "Low",
          status: complaint.status,
          adminComment: complaint.adminComment || "",
          history: complaint.history || [],
          date: complaint.createdAt
            ? new Date(complaint.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          files: complaint.files || [],
          _id: complaint._id,
        };

        if (action === "deleted") {
          setMyComplaints((prev) =>
            prev.filter((c) => (c._id || c.id) !== (complaint._id || complaint.id)),
          );
          return;
        }

        setMyComplaints((prev) => {
          const exists = prev.some((c) => (c._id || c.id) === (complaint._id || complaint.id));

          if (action === "created" && !exists) {
            return [normalizedComplaint, ...prev];
          }

          return prev.map((c) =>
            (c._id || c.id) === (complaint._id || complaint.id)
              ? normalizedComplaint
              : c,
          );
        });

        if (selectedComplaint && (selectedComplaint._id || selectedComplaint.id) === (complaint._id || complaint.id)) {
          setSelectedComplaint(normalizedComplaint);
        }
      });
    }

    return () => {
      clearInterval(pollInterval);
      if (socket) socket.disconnect();
    };
  }, [navigate, token, user.role, user._id]);

  const resolutionRate =
    myComplaints.length > 0
      ? Math.round(
          (myComplaints.filter((c) => c.status === "Resolved").length /
            myComplaints.length) *
            100,
        )
      : 0;

  const stats = [
    {
      label: "Total Complaints",
      value: myComplaints.length,
      change: `+${myComplaints.length}`,
      color: "cyan",
    },
    {
      label: "Pending",
      value: myComplaints.filter((c) => c.status === "Pending").length,
      change: "+0",
      color: "yellow",
    },
    {
      label: "In Progress",
      value: myComplaints.filter((c) => c.status === "In Progress").length,
      change: "+0",
      color: "blue",
    },
    {
      label: "Resolved",
      value: myComplaints.filter((c) => c.status === "Resolved").length,
      change: "+0",
      color: "green",
    },
    {
      label: "Rejected",
      value: myComplaints.filter((c) => c.status === "Rejected").length,
      change: "+0",
      color: "red",
    },
    { label: "Resolution Rate", value: `${resolutionRate}%`, color: "green" },
  ];

  const categoryCounts = myComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: "Hostel", value: categoryCounts["Hostel"] || 0 },
    { name: "Academics", value: categoryCounts["Academics"] || 0 },
    { name: "Mess", value: categoryCounts["Mess"] || 0 },
    // { name: 'Wi-Fi', value: categoryCounts['Wi-Fi'] || 0 },
    { name: "IT/Technical", value: categoryCounts["IT"] || 0 },
    { name: "Library", value: categoryCounts["Library"] || 0 },
    { name: "Transport", value: categoryCounts["Transport"] || 0 },
    { name: "Other", value: categoryCounts["Other"] || 0 },
  ];

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));
  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!profileCompleted) {
      setErrorMessage("Complete your profile before submitting complaints.");
      setSubmitting(false);
      return;
    }

    if (!title.trim() || !category || !description.trim()) {
      setErrorMessage("Please fill title, category, and description");
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("priority", priority);
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${config.BASE_URL}/api/complaints`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit complaint");
      }

      setSuccessMessage("Complaint submitted successfully!");

      // Reset form
      setTitle("");
      setCategory("");
      setDescription("");
      setPriority("Low");
      setFiles([]);

      // Refetch complaints to show new one
      const fetchRes = await fetch(`${config.BASE_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newData = await fetchRes.json();
      setMyComplaints(
        newData.map((c) => ({
          id:
            c.complaintId || `CMP-${c._id.toString().slice(-8).toUpperCase()}`,
          title: c.title,
          category: c.category,
          description: c.description,
          priority: c.priority || "Low",
          status: c.status,
          adminComment: c.adminComment || "",
          history: c.history || [],
          date: new Date(c.createdAt).toLocaleDateString(),
          files: c.files || [],
          _id: c._id,
        })),
      );

      setTimeout(() => {
        setSuccessMessage("");
        setIsNewComplaintOpen(false);
      }, 3000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openFile = (file) => {
    if (!file) return;

    const filePath = typeof file === "string" ? file : file.url;
    if (!filePath) return;

    const fullUrl = filePath.startsWith("http")
      ? filePath
      : `${config.BASE_URL}${filePath}`;

    window.open(fullUrl, "_blank");
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm("Delete this complaint?")) return;

    try {
      const res = await fetch(`${config.BASE_URL}/api/complaints/${complaintId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete complaint");

      setMyComplaints((prev) => prev.filter((c) => c._id !== complaintId && c.id !== complaintId));
      setSuccessMessage("Complaint deleted successfully");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      setErrorMessage(err.message || "Could not delete complaint");
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
      const res = await fetch(`${config.BASE_URL}/api/complaints/${editingComplaint._id || editingComplaint.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update complaint");

      setMyComplaints((prev) =>
        prev.map((c) =>
          (c._id || c.id) === (editingComplaint._id || editingComplaint.id)
            ? { ...c, ...editForm }
            : c,
        ),
      );

      if (selectedComplaint && (selectedComplaint._id || selectedComplaint.id) === (editingComplaint._id || editingComplaint.id)) {
        setSelectedComplaint((prev) => prev ? { ...prev, ...editForm } : prev);
      }

      setEditingComplaint(null);
      setSuccessMessage("Complaint updated successfully");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      setErrorMessage(err.message || "Could not update complaint");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      setErrorMessage(err.message || "Could not delete notification");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const handleOpenNewComplaint = () => {
    if (!profileCompleted) {
      alert("Complete your profile first.");
      return;
    }
    setIsNewComplaintOpen(true);
  };

  const saveProfile = async () => {
    try {
      const formData = new FormData();

      Object.keys(profile).forEach((key) => {
        if (key !== "profileImage") {
          formData.append(key, profile[key] || "");
        }
      });

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const res = await fetch(`${config.BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      const updatedProfile = data.user || { ...profile, ...data.profile };
      const completionStatus = getProfileCompletionStatus(updatedProfile);

      setProfile(updatedProfile);
      setProfileCompleted(completionStatus);

      sessionStorage.setItem(
        "user",
        JSON.stringify({ ...updatedProfile, profileCompleted: completionStatus }),
      );

      setEditProfile(false);

      setSuccessMessage("Profile updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    }
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch(`${config.BASE_URL}/api/auth/change-password`, {
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
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordSuccess("");
      }, 2000);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const filteredComplaints = myComplaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /* ---------- Styles ---------- */
  const pdfStyles = StyleSheet.create({
    page: {
      padding: 28,
      backgroundColor: "#eff6ff",
      fontSize: 10,
      color: "#0f172a",
      fontFamily: "Helvetica",
    },

    /* Top hero */
    hero: {
      alignItems: "center",
      marginBottom: 18,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#0ea5e9",
      textAlign: "center",
      letterSpacing: 0.3,
    },
    heroSubtitle: {
      fontSize: 10,
      color: "#475569",
      marginTop: 6,
    },
    downloadPill: {
      alignSelf: "flex-end",
      backgroundColor: "#2563eb",
      color: "#fff",
      fontSize: 9,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      marginTop: 8,
      marginBottom: 10,
    },

    /* White card wrapper */
    card: {
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: 22,
      border: "1px solid #e2e8f0",
    },

    /* Header inside card */
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: 12,
      borderBottom: "1px solid #e5e7eb",
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#0f172a",
    },
    cardId: {
      fontSize: 9,
      color: "#64748b",
      marginTop: 4,
    },
    cardIdValue: { color: "#2563eb", fontWeight: "bold" },
    logoBox: {
      width: 50,
      height: 50,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "transparent",
    },
    logoImage: {
      width: 40,
      height: 40,
      objectFit: "contain",
    },
    logoText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

    /* Info strip */
    infoStrip: {
      flexDirection: "row",
      backgroundColor: "#ecfeff",
      borderRadius: 8,
      padding: 14,
      marginBottom: 18,
    },
    infoCell: { flex: 1 },
    infoLabel: { fontSize: 8, color: "#64748b", marginBottom: 4 },
    infoValue: { fontSize: 11, fontWeight: "bold", color: "#0f172a" },
    infoValueAccent: { fontSize: 11, fontWeight: "bold", color: "#0ea5e9" },

    /* Complaint title + meta */
    complaintTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    metaLabel: { fontSize: 9, color: "#475569", marginRight: 6 },
    badgeStatus: {
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      fontSize: 9,
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderRadius: 10,
      marginRight: 14,
      fontWeight: "bold",
    },
    badgePriority: {
      backgroundColor: "#fed7aa",
      color: "#c2410c",
      fontSize: 9,
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderRadius: 10,
      fontWeight: "bold",
    },

    /* Generic section */
    section: {
      backgroundColor: "#f8fafc",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      padding: 14,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: 8,
    },
    bodyText: { fontSize: 10, color: "#334155", lineHeight: 1.6 },
    metaLine: { fontSize: 10, color: "#475569", marginTop: 4 },

    /* Admin comment (blue left border) */
    adminBox: {
      backgroundColor: "#eff6ff",
      borderLeft: "4px solid #2563eb",
      borderRadius: 6,
      padding: 14,
      marginBottom: 16,
    },

    /* Timeline */
    timelineWrap: { marginBottom: 16 },
    timelineHeader: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: 10,
    },
    timelineItem: { flexDirection: "row", marginBottom: 12 },
    timelineLeft: { width: 16, alignItems: "center" },
    timelineDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#2563eb",
      marginTop: 2,
    },
    timelineLine: {
      width: 2,
      flexGrow: 1,
      backgroundColor: "#bfdbfe",
      marginTop: 2,
    },
    timelineBody: { flex: 1, paddingLeft: 8 },
    timelineStatus: { fontSize: 10, fontWeight: "bold", color: "#0f172a" },
    timelineDate: { fontSize: 9, color: "#64748b", marginTop: 2 },
    timelineComment: { fontSize: 9, color: "#475569", marginTop: 3 },

    /* Attachments */
    attachBox: {
      backgroundColor: "#fefce8",
      border: "1px solid #fde68a",
      borderRadius: 8,
      padding: 14,
    },
    attachItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    attachDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#f97316",
      marginRight: 8,
    },
    attachText: { fontSize: 10, color: "#c2410c" },

    footer: {
      marginTop: 14,
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 8,
    },
  });

  /* ---------- Component ---------- */
  const ComplaintPDF = ({ complaint, user }) => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Hero */}
        <View style={pdfStyles.hero}>
          <Text style={pdfStyles.heroTitle}>
            Smart Complaint Management System
          </Text>
          <Text style={pdfStyles.heroSubtitle}>
            Advanced complaint tracking with PDF download capabilities
          </Text>
        </View>

        {/* <Text style={pdfStyles.downloadPill}>↓ Download as PDF</Text> */}

        {/* Main Card */}
        <View style={pdfStyles.card}>
          {/* Card header */}
          <View style={pdfStyles.cardHeader}>
            <View>
              <Text style={pdfStyles.cardTitle}>Complaint Details</Text>
              <Text style={pdfStyles.cardId}>
                ID: <Text style={pdfStyles.cardIdValue}>{complaint.id}</Text>
              </Text>
            </View>
            <View style={pdfStyles.logoBox}>
              <Image style={pdfStyles.logoImage} src={logoUrl} />
            </View>
          </View>

          {/* Info strip */}
          <View style={pdfStyles.infoStrip}>
            <View style={pdfStyles.infoCell}>
              <Text style={pdfStyles.infoLabel}>Student Name</Text>
              <Text style={pdfStyles.infoValue}>{user.name}</Text>
            </View>
            <View style={pdfStyles.infoCell}>
              <Text style={pdfStyles.infoLabel}>PRN</Text>
              <Text style={pdfStyles.infoValue}>{user.prn || "N/A"}</Text>
            </View>
            <View style={pdfStyles.infoCell}>
              <Text style={pdfStyles.infoLabel}>Category</Text>
              <Text style={pdfStyles.infoValueAccent}>
                {complaint.category}
              </Text>
            </View>
            <View style={pdfStyles.infoCell}>
              <Text style={pdfStyles.infoLabel}>Generated On</Text>
              <Text style={pdfStyles.infoValue}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Complaint title + meta */}
          <Text style={pdfStyles.complaintTitle}>
            Problem: {complaint.title}
          </Text>
          <View style={pdfStyles.metaRow}>
            <Text style={pdfStyles.metaLabel}>Status:</Text>
            <Text style={pdfStyles.badgeStatus}>{complaint.status}</Text>
            <Text style={pdfStyles.metaLabel}>Priority:</Text>
            <Text style={pdfStyles.badgePriority}>{complaint.priority}</Text>
          </View>

          {/* Description */}
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Description</Text>
            <Text style={pdfStyles.bodyText}>{complaint.description}</Text>
            {complaint.affectedArea && (
              <Text style={pdfStyles.metaLine}>
                Affected Area: {complaint.affectedArea}
              </Text>
            )}
            {complaint.deviceType && (
              <Text style={pdfStyles.metaLine}>
                Device Type: {complaint.deviceType}
              </Text>
            )}
            {complaint.firstReported && (
              <Text style={pdfStyles.metaLine}>
                First Reported: {complaint.firstReported}
              </Text>
            )}
          </View>

          {/* Admin Comment */}
          <View style={pdfStyles.adminBox}>
            <Text style={pdfStyles.sectionTitle}>Admin Comment</Text>
            <Text style={pdfStyles.bodyText}>
              {complaint.adminComment || "No admin comment available"}
            </Text>
          </View>

          {/* Timeline */}
          <View style={pdfStyles.timelineWrap}>
            <Text style={pdfStyles.timelineHeader}>Complaint Timeline</Text>
            {complaint.history?.length > 0 ? (
              complaint.history.map((item, index) => {
                const isLast = index === complaint.history.length - 1;
                return (
                  <View key={index} style={pdfStyles.timelineItem}>
                    <View style={pdfStyles.timelineLeft}>
                      <View style={pdfStyles.timelineDot} />
                      {!isLast && <View style={pdfStyles.timelineLine} />}
                    </View>
                    <View style={pdfStyles.timelineBody}>
                      <Text style={pdfStyles.timelineStatus}>
                        {item.status}
                      </Text>
                      <Text style={pdfStyles.timelineDate}>
                        {new Date(item.date).toLocaleString()}
                      </Text>
                      {item.comment && (
                        <Text style={pdfStyles.timelineComment}>
                          {item.comment}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={pdfStyles.bodyText}>No history available</Text>
            )}
          </View>

          {/* Attachments */}
          <View style={pdfStyles.attachBox}>
            <Text style={pdfStyles.sectionTitle}>Attachments</Text>
            {complaint.files?.length > 0 ? (
              complaint.files.map((file, index) => (
                <View key={index} style={pdfStyles.attachItem}>
                  <View style={pdfStyles.attachDot} />
                  <Text style={pdfStyles.attachText}>
                    {file.name || `Attachment ${index + 1}`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={pdfStyles.bodyText}>No Attachments</Text>
            )}
          </View>
        </View>

        <Text style={pdfStyles.footer}>
          Generated by Smart Complaint Management System
        </Text>
      </Page>
    </Document>
  );

  /* ---------- Download helper ---------- */
  const downloadComplaintPDF = async (complaint) => {
    try {
      const blob = await pdf(
        <ComplaintPDF complaint={complaint} user={user} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${complaint.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Unable to generate PDF");
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setShowComplaintDetails(true);
  };

  const closeComplaintDetails = () => {
    setSelectedComplaint(null);
    setShowComplaintDetails(false);
  };

  const changeSection = (section) => {
    setSelectedComplaint(null);
    setShowComplaintDetails(false);
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const previewAvatar = profileImage
    ? URL.createObjectURL(profileImage)
    : typeof profile.profileImage === "string" && profile.profileImage
      ? profile.profileImage
      : "/default-avatar.png";

  return (
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-[#111827] border-b border-gray-800 z-30 flex items-center px-3 sm:px-4">
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
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
                Student Dashboard
              </span>
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
                  if (e.target.value.trim() !== "") {
                    setActiveSection("complaints");
                  }
                }}
                className="w-full pl-8 sm:pl-10 pr-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative cursor-pointer">
              <button
                onClick={() => changeSection("notifications")}
                className="relative text-gray-400 hover:text-white transition"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 rounded-full">
                    {notifications.filter((n) => !n.read).length}
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

      <aside
        className={`
          fixed top-0 left-0 h-full
          bg-[#111827]
          border-r border-gray-800
          z-20
          transition-all duration-300
          ${sidebarCollapsed ? "w-20" : "w-60"}
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

        <div className="pt-26 px-3 space-y-2">
          {/* Overview */}
          <button
            onClick={() => {
              changeSection("overview");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } px-4 py-3 rounded-lg transition ${
              activeSection === "overview"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
                : "text-gray-400 hover:bg-gray-800/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>

          {/* Complaints */}
          <button
            onClick={() => {
              changeSection("complaints");
            }}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } px-4 py-3 rounded-lg transition ${
              activeSection === "complaints"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
                : "text-gray-400 hover:bg-gray-800/50"
            }`}
          >
            <FileText className="w-5 h-5" />
            {!sidebarCollapsed && <span>My Complaints</span>}
          </button>

          {/* Notifications */}
          <button
            onClick={() => {
              changeSection("notifications");
            }}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } px-4 py-3 rounded-lg transition ${
              activeSection === "notifications"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
                : "text-gray-400 hover:bg-gray-800/50"
            }`}
          >
            <Bell className="w-5 h-5" />
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>

          {/* Profile */}
          <button
            onClick={() => {
              setActiveSection("profile");
              setSidebarOpen(false);
              setSelectedComplaint(null);
            }}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } px-4 py-3 rounded-lg transition ${
              activeSection === "profile"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
                : "text-gray-400 hover:bg-gray-800/50"
            }`}
          >
            <UserCircle2 className="w-5 h-5" />
            {!sidebarCollapsed && <span>My Profile</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto mt-16 bg-[#0b111e] p-4 sm:p-6 lg:p-7 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-60"
        }`}
      >
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
              <strong>problem: {statusChangeToast.title}</strong> status changed
              from <strong>{statusChangeToast.oldStatus}</strong> to{" "}
              <strong>{statusChangeToast.newStatus}</strong>
            </span>
          </div>
        )}

        {showComplaintDetails && selectedComplaint ? (
          <div className="flex-1 overflow-y-auto bg-[#0b1120] p-8">
            <div className="max-w-5xl mx-auto bg-[#121826] rounded-2xl border border-gray-800 shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Complaint Details
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Complete complaint information
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeComplaintDetails}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X size={28} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 space-y-8">
                {/* Top Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">
                      Tracking Number
                    </p>
                    <p className="mt-2 text-cyan-400 text-xl font-bold">
                      {selectedComplaint.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">
                      Date Submitted
                    </p>
                    <p className="mt-2 text-white font-semibold">
                      {selectedComplaint.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">
                      Category
                    </p>
                    <span className="mt-2 inline-flex px-4 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-sm">
                      {selectedComplaint.category}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500">
                      Priority
                    </p>
                    <span
                      className={`mt-2 inline-flex px-4 py-1 rounded-full text-sm font-medium
                        ${
                          selectedComplaint.priority === "High"
                            ? "bg-red-500/20 text-red-400"
                            : selectedComplaint.priority === "Medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                        }
                        `}
                    >
                      {selectedComplaint.priority}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 mb-2">
                    Title
                  </p>
                  <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
                    <h2 className="text-1xl font-bold text-white leading-snug">
                      {selectedComplaint.title}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 mb-2">
                    Description
                  </p>
                  <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
                    <p className="text-gray-300 leading-8">
                      {selectedComplaint.description}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase text-gray-500 mb-3">
                      Status
                    </p>
                    <span
                      className={`inline-flex px-4 py-1 rounded-full text-sm font-medium
                        ${
                          selectedComplaint.status === "Resolved"
                            ? "bg-green-500/20 text-green-400"
                            : selectedComplaint.status === "Rejected"
                              ? "bg-red-500/20 text-red-400"
                              : selectedComplaint.status === "In Progress"
                                ? "bg-blue-500/20 text-blue-400"
                                : selectedComplaint.status === "Assigned"
                                ? "bg-purple-500/20 text-purple-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                        }
                        `}
                    >
                      {selectedComplaint.status}
                    </span>
                  </div>

                  <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase text-gray-500 mb-3">
                      Admin Comment
                    </p>
                    <p className="text-gray-300">
                      {selectedComplaint.adminComment ||
                        "No comment available."}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-xl font-semibold mb-6">Timeline</h3>
                  <div className="relative border-l-2 border-cyan-500 ml-3">
                    {selectedComplaint.history?.length > 0 ? (
                      selectedComplaint.history.map((item, index) => (
                        <div key={index} className="relative pl-8 pb-8">
                          <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-cyan-400 border-4 border-[#121826]" />
                          <p className="font-semibold text-white">
                            {item.status
                              ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                              : "Updated"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {item.date ? new Date(item.date).toLocaleString() : "—"}
                          </p>
                          {item.comment && (
                            <p className="mt-2 text-gray-300">{item.comment}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="pl-6 text-gray-500">
                        No timeline available
                      </p>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-xl font-semibold mb-5">Attachments</h3>
                  {selectedComplaint.files?.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {selectedComplaint.files.map((file, index) => {
                        const fileName =
                          typeof file === "string"
                            ? `Attachment ${index + 1}`
                            : file.name || `Attachment ${index + 1}`;

                        return (
                          <button
                            key={index}
                            onClick={() => openFile(file)}
                            className="px-5 py-3 rounded-xl bg-[#0f172a] border border-gray-700 hover:border-cyan-400 hover:bg-[#152033] transition"
                          >
                            {fileName}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No attachments</p>
                  )}
                </div>

                {/* Download */}
                <div className="pt-8 border-t border-gray-800">
                  <button
                    onClick={() => downloadComplaintPDF(selectedComplaint)}
                    className="w-full mt-8 bg-cyan-900/40 hover:bg-cyan-800 transition rounded-xl py-4 text-cyan-300 flex items-center justify-center gap-3"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeSection === "overview" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold mb-6">
                  Welcome back
                  {studentName && (
                    <span className="text-cyan-400">, {studentName}</span>
                  )}
                  !
                </h1>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-8">
                  {stats.map((stat, i) => (
                    <div
                      key={i}
                      className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow hover:border-cyan-500/50 transition"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div
                          className={`p-2 rounded-lg bg-${stat.color}-500/10`}
                        >
                          {stat.label === "Total Complaints" && (
                            <FileText className="w-5 h-5 text-cyan-400" />
                          )}
                          {stat.label === "Pending" && (
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                          )}
                          {stat.label === "In Progress" && (
                            <Clock className="w-5 h-5 text-blue-400" />
                          )}
                          {stat.label === "Resolved" && (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          )}
                          {stat.label === "Rejected" && (
                            <X className="w-5 h-5 text-red-400" />
                          )}
                          {stat.label === "Resolution Rate" && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                        {/* <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.change}</span> */}
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {!profileCompleted && (
                  <div className="mb-5 bg-yellow-500/10 border border-yellow-500 rounded-xl p-4">
                    <p className="text-yellow-300">
                      ⚠ Complete your profile before submitting complaints.
                    </p>
                  </div>
                )}
                <button
                  disabled={!profileCompleted}
                  onClick={handleOpenNewComplaint}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl shadow transition mb-8 ${
                    profileCompleted
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/30 hover:scale-105"
                      : "bg-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  <PlusCircle className="w-5 h-5" /> New Complaint
                </button>
                {myComplaints.length > 0 && (
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow">
                    <h3 className="text-xl font-semibold mb-4">
                      Complaints by Category
                    </h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "none",
                              color: "white",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#06B6D4"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeSection === "complaints" && !showComplaintDetails && (
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
                        onClick={handleOpenNewComplaint}
                        disabled={!profileCompleted}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition ${
                          profileCompleted
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/30"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <PlusCircle className="w-5 h-5" /> New
                      </button>

                      {/* <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition">
                    <Download className="w-5 h-5" /> Download complaints
                  </button> */}
                    </div>
                  </div>
                  {showFilter && (
                    <div className="absolute mb-4 right-14 top-40">
                      <div className="bg-[#111827] border border-gray-700 rounded-lg p-3 shadow-lg w-48">
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
                            className={`block w-full text-left px-3 py-2 rounded text-sm ${
                              statusFilter === status
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "text-gray-300 hover:bg-gray-800"
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
                    <p className="text-red-400 text-center py-12">
                      {errorMessage}
                    </p>
                  ) : myComplaints.length === 0 ? (
                    <p className="text-gray-400 text-center py-12">
                      No complaints submitted yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-800">
                        <thead>
                          <tr className="text-left text-gray-400 text-sm">
                            <th className="pb-4 px-4">ID</th>
                            <th className="pb-4 px-4">Problem</th>
                            <th className="pb-4 px-4 hidden sm:table-cell">
                              Category
                            </th>
                            {/* <th className="pb-4 px-4">Description</th> */}
                            <th className="pb-4 px-4">Priority</th>
                            <th className="pb-4 px-4">Status</th>
                            {/* <th className="pb-4 px-4">Admin Comment</th> */}
                            <th className="pb-4 px-4 hidden md:table-cell">
                              Date
                            </th>
                            {/* <th className="pb-4 px-4">Files</th> */}
                            {/* <th className="pb-4 px-4">Download</th> */}
                            <th className="pb-4 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {filteredComplaints.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-800/50">
                              {/* Tracking ID */}
                              <td className="py-4 px-4 text-cyan-400">
                                {c.id}
                              </td>

                              {/* Title + Description */}
                              <td className="py-4 px-4">
                                <div>
                                  <p>{c.title}</p>

                                  <p className="line-clamp-1 text-gray-400 mt-1">
                                    {c.description}
                                  </p>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-4 px-4">
                                <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                                  {c.category}
                                </span>
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

                              {/* Status */}
                              <td className="py-4 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    c.status === "Resolved"
                                      ? "bg-green-500/20 text-green-400"
                                      : c.status === "In Progress"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : c.status === "Rejected"
                                          ? "bg-red-500/20 text-red-400"
                                          : c.status === "Assigned"
                                          ? "bg-purple-500/20 text-purple-400"
                                          : "bg-yellow-500/20 text-yellow-400"
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>

                              {/* Date */}
                              <td className="py-4 px-4 text-gray-400">
                                {c.date}
                              </td>

                              {/* Action */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewComplaint(c)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-full hover:bg-gray-700"
                                  >
                                    <Eye size={16} />
                                    View
                                  </button>
                                  <button
                                    onClick={() => openEditComplaint(c)}
                                    className="p-2 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                                    title="Edit complaint"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComplaint(c._id || c.id)}
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
                  )}
                </div>
              </>
            )}

            {activeSection === "history" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Complaint History</h2>

                {myComplaints.length === 0 ? (
                  <p className="text-gray-400">No complaints found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myComplaints.map((c) => (
                      <div
                        key={c._id}
                        className="bg-[#111827] p-4 rounded-lg border border-gray-700"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-cyan-400 font-semibold">
                              {c.id}
                            </p>
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

            {activeSection === "notifications" && (
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
                      n.message.includes("Resolved")
                        ? "border-l-green-500"
                        : n.message.includes("In Progress")
                          ? "border-l-blue-500"
                          : n.message.includes("Rejected")
                            ? "border-l-red-500"
                            : "border-l-yellow-500"
                    }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold text-[15px]">
                              {n.message}
                            </p>

                            <p className="text-gray-400 text-sm mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNotification(n._id)}
                            className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            title="Delete notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "profile" && (
              <div className="space-y-6">
                {!profileCompleted && (
                  <div className="bg-red-500/10 border border-red-500 rounded-xl p-5 flex justify-between items-center">
                    <div>
                      <h2 className="text-red-400 font-bold text-lg">
                        Your profile is incomplete
                      </h2>
                      <p className="text-gray-400 mt-1">
                        Complete your profile before submitting complaints.
                      </p>
                    </div>
                    <button
                      onClick={() => setEditProfile(true)}
                      className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg"
                    >
                      Complete Profile
                    </button>
                  </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="bg-[#111827] border border-gray-700 rounded-2xl overflow-hidden">
                      <div className="h-28 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600"></div>

                      <div className="-mt-14 flex flex-col items-center px-6 pb-8">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setProfileImage(file);
                              setProfile({ ...profile, profileImage: file });
                            }}
                            className="hidden"
                            id="profilePic"
                          />
                          <label htmlFor="profilePic">
                            <img
                              src={
                                profile.profileImage
                                  ? `${config.BASE_URL.replace("/api", "")}${profile.profileImage}`
                                  : "/default-profile.png"
                              }
                              alt="Profile"
                              className="w-32 h-32 rounded-full object-cover"
                            />
                          </label>
                        </div>

                        <h2 className="text-2xl font-bold mt-5">
                          {profile.fullName || "Student Name"}
                        </h2>

                        <p className="text-gray-400 text-center">
                          {profile.college || "College Name"} •{" "}
                          {profile.degree || "Degree"} •{" "}
                          {profile.branch || "Branch"}
                        </p>

                        <div className="w-full mt-8 space-y-4">
                          <div className="flex justify-between border-b border-gray-700 pb-3">
                            <span className="text-gray-400">PRN</span>
                            <span>{profile.prn || "--"}</span>
                          </div>

                          <div className="flex justify-between border-b border-gray-700 pb-3">
                            <span className="text-gray-400">Semester</span>
                            <span>{profile.semester || "--"}</span>
                          </div>

                          <div className="flex justify-between border-b border-gray-700 pb-3">
                            <span className="text-gray-400">Batch</span>
                            <span>{profile.batch || "--"}</span>
                          </div>

                          <div className="flex justify-between border-b border-gray-700 pb-3">
                            <span className="text-gray-400">Roll No.</span>
                            <span>{profile.rollNumber || "--"}</span>
                          </div>

                          <div className="flex justify-between border-b border-gray-700 pb-3">
                            <span className="text-gray-400">DOB</span>
                            <span>{profile.dob || "--"}</span>
                          </div>

                          <div className="flex justify-between border-b border-gray-700 pb-3">
                            <span className="text-gray-400">
                              Student Mobile
                            </span>
                            <span>{profile.studentMobile || "--"}</span>
                          </div>

                          <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 mb-1">Father</p>
                            <p>{profile.fatherName || "--"}</p>
                            <p className="text-sm text-gray-400">
                              {profile.fatherMobile || "--"}
                            </p>
                          </div>

                          <div className="border-b border-gray-700 pb-3">
                            <p className="text-gray-400 mb-1">Mother</p>
                            <p>{profile.motherName || "--"}</p>
                            <p className="text-sm text-gray-400">
                              {profile.motherMobile || "--"}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-400 mb-1">Email</p>
                            <p className="break-all">{profile.email || "--"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-[#111827] border border-gray-700 rounded-2xl overflow-hidden">
                      <div className="border-b border-gray-700 p-6">
                        <h2 className="text-2xl font-bold">Student Profile</h2>
                        <p className="text-gray-400 mt-1">
                          Manage your personal information
                        </p>
                      </div>

                      <div className="flex border-b border-gray-700">
                        <button
                          onClick={() => setProfileTab("personal")}
                          className={`flex-1 py-4 font-medium transition ${
                            profileTab === "personal"
                              ? "text-cyan-400 border-b-2 border-cyan-400"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          👤 Personal
                        </button>
                        <button
                          onClick={() => setProfileTab("contact")}
                          className={`flex-1 py-4 font-medium transition ${
                            profileTab === "contact"
                              ? "text-cyan-400 border-b-2 border-cyan-400"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          📞 Contact
                        </button>
                        <button
                          onClick={() => setProfileTab("parents")}
                          className={`flex-1 py-4 font-medium transition ${
                            profileTab === "parents"
                              ? "text-cyan-400 border-b-2 border-cyan-400"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          👨‍👩‍👧 Parents
                        </button>
                      </div>

                      <div className="p-8">
                        {profileTab === "personal" && (
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Full Name
                              </label>
                              <input
                                value={profile.fullName}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    fullName: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Date of Birth
                              </label>
                              <input
                                type="date"
                                value={profile.dob}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    dob: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                College
                              </label>
                              <input
                                value={profile.college}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    college: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Degree
                              </label>
                              <input
                                value={profile.degree}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    degree: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Branch
                              </label>
                              <input
                                value={profile.branch}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    branch: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Semester
                              </label>
                              <select
                                value={profile.semester}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    semester: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              >
                                <option>I</option>
                                <option>II</option>
                                <option>III</option>
                                <option>IV</option>
                                <option>V</option>
                                <option>VI</option>
                                <option>VII</option>
                                <option>VIII</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Batch
                              </label>
                              <input
                                value={profile.batch}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    batch: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Roll Number
                              </label>
                              <input
                                value={profile.rollNumber}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    rollNumber: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                          </div>
                        )}

                        {profileTab === "contact" && (
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Email
                              </label>
                              <input
                                value={profile.email}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Student Mobile
                              </label>
                              <input
                                value={profile.studentMobile}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    studentMobile: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-gray-400 mb-2">
                                Address
                              </label>
                              <textarea
                                rows={4}
                                value={profile.address}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    address: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                          </div>
                        )}

                        {profileTab === "parents" && (
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Father Name
                              </label>
                              <input
                                value={profile.fatherName}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    fatherName: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Father Mobile
                              </label>
                              <input
                                value={profile.fatherMobile}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    fatherMobile: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Mother Name
                              </label>
                              <input
                                value={profile.motherName}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    motherName: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">
                                Mother Mobile
                              </label>
                              <input
                                value={profile.motherMobile}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    motherMobile: e.target.value,
                                  })
                                }
                                className="w-full bg-[#1a2235] border border-gray-700 rounded-lg p-3"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end mt-10">
                          <button
                            onClick={saveProfile}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105 transition font-semibold"
                          >
                            Save Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* New Complaint Modal */}
      {isNewComplaintOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl p-5 w-full max-w-sm border border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">New Complaint</h3>
              <button
                onClick={() => setIsNewComplaintOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Problem *
                </label>
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
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Category *
                </label>
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
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Priority *
                </label>
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
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Description *
                </label>
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
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Files (optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs file:bg-gray-800 file:text-white file:text-xs"
                />
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-full text-xs text-gray-300"
                      >
                        <span className="truncate max-w-[100px]">
                          {file.name}
                        </span>
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
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Change Password</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {passwordError && (
              <p className="text-red-400 mb-3 text-center bg-red-500/10 py-2 rounded">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-green-400 mb-3 text-center bg-green-500/10 py-2 rounded">
                {passwordSuccess}
              </p>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Confirm New Password
                </label>
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
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded shadow hover:shadow-cyan-500/30"
                >
                  {" "}
                  Change Password{" "}
                </button>
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
              <button onClick={() => setSelectedHistory(null)}>
                <X />
              </button>
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

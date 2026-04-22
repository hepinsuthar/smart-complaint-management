const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../utils/socket");
const { sendStatusUpdateEmail } = require("../utils/emailService");

exports.createComplaint = async (req, res) => {
  try {
    const { title, category, description, priority } = req.body;
    
    if (!title || !category || !description) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Find the student's last complaint to generate a per-student sequence
    const lastComplaint = await Complaint.findOne({ studentId: req.user._id })
      .sort({ createdAt: -1 });
    
    let nextNumber = 1001;
    if (lastComplaint && lastComplaint.complaintId) {
      const match = lastComplaint.complaintId.match(/CMP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const files = req.files
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];

    const complaint = await Complaint.create({
      complaintId: `CMP-${nextNumber}`,
      studentId: req.user._id,
      title,
      category,
      description,
      priority: priority || "Low",
      files,
      history : [{
        status: "pending",
        comment: "Complaint submitted",
        date: new Date()
      }]
    });
    // Find all admin users and create notifications for them (and emit realtime)
    const admins = await User.find({ role: "admin" });
    const student = await User.findById(req.user._id).select('name email');
    for (const admin of admins) {
      const notif = await Notification.create({
        userId: admin._id,
        role: "admin",
        message: `New complaint submitted: ${complaint.complaintId}`,
        complaintId: complaint.complaintId,
        studentId: req.user._id,
        studentName: student?.name,
        studentEmail: student?.email,
      });
      try {
        const io = getIO();
        io.to(`user_${admin._id}`).emit("notification", notif);
      } catch (e) {
        // socket not initialized or other error — ignore so API still succeeds
      }
    }
    
    res.status(201).json({
      success: true,
      complaint
    });

  } catch (err) {
    console.error("🔥 Create complaint error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while submitting complaint"
    });
  }
};

exports.getStudentComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      studentId: req.user._id
    }).sort({ createdAt: 1 });

    res.json(complaints);
  } catch (error) {
    console.error("❌ Get student complaints error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllComplaints = async (req, res) => {
  const complaints = await Complaint.find()
    .populate("studentId", "name prn email")
    .sort({ createdAt: 1 });
  res.json(complaints);
};

// Update status + comment
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Update fields
    if (status) complaint.status = status;
    if (adminComment !== undefined) {
      complaint.adminComment = adminComment;
    }

    // complaint.history.push({
    //   status: status,
    //   comment: adminComment || `status changed to ${status}`,
    //   date: new Date()
    // });

    const last = complaint.history[complaint.history.length - 1];

if (
  !last ||
  last.status !== status ||
  last.comment !== (adminComment || `status changed to ${status}`)
) {
  complaint.history.push({
    status: status,
    comment: adminComment || `status changed to ${status}`,
    date: new Date()
  });
}
    await complaint.save();
    // get student details
    const student = await User.findById(complaint.studentId).select("name email");

    // send status update email
    if (student?.email) {
      await sendStatusUpdateEmail(
        student.name,
        student.email,
        complaint.complaintId,
        complaint.title,
        status,
        adminComment
      );
    }
    // 🔥 ADD THIS BLOCK (notification + realtime)
    const io = getIO();

    const notif = await Notification.create({
      userId: complaint.studentId,
      role: "student",
      message: `Your "${complaint.title}" complaint is now ${status}`,
      complaintId: complaint.complaintId
    });

    // send realtime notification
    io.to(`user_${complaint.studentId}`).emit("notification", notif);

    // send realtime complaint update
    io.to(`user_${complaint.studentId}`).emit("statusUpdate", complaint);

    res.json({
      message: "Updated successfully",
      complaint
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating" });
  }
};

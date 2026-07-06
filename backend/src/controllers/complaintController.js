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
      history: [{
        status: "pending",
        comment: "Complaint submitted",
        date: new Date()
      }]
    });
    // Find all admin users and create notifications for them (and emit realtime)
    const admins = await User.find({ role: "admin" });
    const student = await User.findById(req.user._id).select("name email prn");
    const complaintPayload = {
      action: "created",
      complaint: complaint.toObject ? complaint.toObject() : complaint,
      student: student
        ? { _id: student._id, name: student.name, email: student.email, prn: student.prn }
        : null,
    };

    try {
      const io = getIO();
      io.to(`user_${req.user._id}`).emit("complaintChanged", complaintPayload);

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
        io.to(`user_${admin._id}`).emit("notification", notif);
        io.to(`user_${admin._id}`).emit("complaintChanged", complaintPayload);
      }
    } catch (e) {
      // socket not initialized or other error — ignore so API still succeeds
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

exports.getFacultyComplaints = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const complaints = await Complaint.find({ facultyId: req.user._id })
      .populate("studentId", "name prn email department semester")
      .sort({ createdAt: 1 });

    res.json(complaints);
  } catch (error) {
    console.error("❌ Get faculty complaints error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignComplaintToFaculty = async (req, res) => {

  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Only admin can assign complaints"
      });
    }

    const { facultyId } = req.body;

    if (!facultyId) {
      return res.status(400).json({
        error: "Faculty Id missing"
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    console.log("Complaint =", complaint);
    if (!complaint) {
      return res.status(404).json({
        error: "Complaint not found"
      });
    }

    const faculty = await User.findOne({
      _id: facultyId,
      role: "faculty"
    });
    if (!faculty) {
      return res.status(404).json({
        error: "Faculty not found"
      });
    }

    complaint.facultyId = faculty._id;
    complaint.facultyName = faculty.name;
    complaint.assignedAt = new Date();
    complaint.status = "Assigned";

    complaint.history.push({

      status: "",

      comment: `Complaint Assigned to ${faculty.name}`,

      date: new Date()

    });

    await complaint.save();

    const notification = await Notification.create({

      userId: faculty._id,

      role: "faculty",

      message: `New Complaint Assigned (${complaint.complaintId})`

    });

    const io = getIO();

    io.to(`user_${faculty._id}`).emit("notification", notification);

    io.to(`user_${faculty._id}`).emit("complaintAssigned", complaint);

    res.json({

      success: true,

      message: "Faculty assigned successfully",

      complaint

    });

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,

      error: err.message

    });

  }

};
// Update status + comment
exports.updateComplaint = async (req, res) => {
  try {
    const { title, category, description, priority } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (req.user.role !== "student" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.user.role === "student" && complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (title !== undefined) complaint.title = title;
    if (category !== undefined) complaint.category = category;
    if (description !== undefined) complaint.description = description;
    if (priority !== undefined) complaint.priority = priority;

    await complaint.save();

    const student = await User.findById(complaint.studentId).select("name email prn");
    const complaintPayload = {
      action: "updated",
      complaint: complaint.toObject ? complaint.toObject() : complaint,
      student: student
        ? { _id: student._id, name: student.name, email: student.email, prn: student.prn }
        : null,
    };

    try {
      const io = getIO();

      if (req.user.role === "student") {
        const admins = await User.find({ role: "admin" });
        const updater = await User.findById(req.user._id).select("name email");

        for (const admin of admins) {
          const notif = await Notification.create({
            userId: admin._id,
            role: "admin",
            message: `Complaint updated by student: ${complaint.complaintId}`,
            complaintId: complaint.complaintId,
            studentId: req.user._id,
            studentName: updater?.name,
            studentEmail: updater?.email,
          });

          io.to(`user_${admin._id}`).emit("notification", notif);
          io.to(`user_${admin._id}`).emit("complaintChanged", complaintPayload);
        }
      } else if (req.user.role === "admin") {
        io.to(`user_${complaint.studentId}`).emit("complaintChanged", complaintPayload);
      }
    } catch (e) {
      // socket not initialized or other error — ignore so API still succeeds
    }

    res.json({ message: "Updated successfully", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating complaint" });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (req.user.role === "student" && complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ complaintId: complaint.complaintId });

    const complaintPayload = {
      action: "deleted",
      complaint: {
        _id: complaint._id,
        complaintId: complaint.complaintId,
        studentId: complaint.studentId,
      },
    };

    try {
      const io = getIO();
      const admins = await User.find({ role: "admin" });
      io.to(`user_${complaint.studentId}`).emit("complaintChanged", complaintPayload);
      for (const admin of admins) {
        io.to(`user_${admin._id}`).emit("complaintChanged", complaintPayload);
      }
    } catch (e) {
      // socket not initialized or other error — ignore so API still succeeds
    }

    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while deleting complaint" });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminComment, facultyComment } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Update fields
    if (status) complaint.status = status;
    if (adminComment !== undefined) {
      complaint.adminComment = adminComment;
    }
    if (facultyComment !== undefined) {
      complaint.facultyComment = facultyComment;
    }

    if (req.user.role === "faculty" && complaint.facultyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.user.role === "faculty") {
      const faculty = await User.findById(req.user._id).select("name department designation");
      complaint.facultyName = faculty?.name || complaint.facultyName;
      complaint.facultyId = req.user._id;
      if (status === "Resolved") {
        complaint.resolvedAt = new Date();
      }
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
      message: `Your "${complaint.title}" complaint is now ${status}${facultyComment ? ` - ${facultyComment}` : ""}`,
      complaintId: complaint.complaintId
    });

    const complaintPayload = {
      action: "updated",
      complaint: complaint.toObject ? complaint.toObject() : complaint,
      student: student
        ? { _id: student._id, name: student.name, email: student.email, prn: student.prn }
        : null,
    };

    // send realtime notification
    io.to(`user_${complaint.studentId}`).emit("notification", notif);
    io.to(`user_${complaint.studentId}`).emit("statusUpdate", complaint);
    io.to(`user_${complaint.studentId}`).emit("complaintChanged", complaintPayload);

    res.json({
      message: "Updated successfully",
      complaint
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating" });
  }
};

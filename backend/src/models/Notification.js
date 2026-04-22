const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      required: true,
    },
    message: String,
    // Optional metadata about the originator (useful for admin notifications)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    studentName: String,
    studentEmail: String,
    complaintId: String,
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

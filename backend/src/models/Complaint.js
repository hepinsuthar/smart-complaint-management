const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  history: [
    {
      status: String,
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  adminComment: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  files: [String],
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved", "Rejected"],
    default: "Pending"
  },
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);

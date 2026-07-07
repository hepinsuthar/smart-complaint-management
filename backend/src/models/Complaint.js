const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"], // Added Critical
      default: "Low",
    },

    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    files: [String],

    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },

    history: [
      {
        status: String,
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    adminComment: {
      type: String,
      default: "",
    },

    facultyComment: {
      type: String,
      default: "",
    },

    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    facultyName: {
      type: String,
      default: "",
    },

    assignedAt: Date,

    resolvedAt: Date,

    // ==========================
    // AI Fields
    // ==========================

    aiAssigned: {
      type: Boolean,
      default: true,
    },

    aiCategory: {
      type: String,
      default: "",
    },

    aiPriority: {
      type: String,
      default: "",
    },

    aiDepartment: {
      type: String,
      default: "",
    },

    estimatedResolutionDays: {
      type: Number,
      default: 7,
    },

    escalationDate: {
      type: Date,
    },

    escalated: {
      type: Boolean,
      default: false,
    },

    escalatedTo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
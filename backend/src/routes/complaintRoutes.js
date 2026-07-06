const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const auth = require("../middleware/authMiddleware");
const { 
    createComplaint, 
    getStudentComplaints, 
    getAllComplaints,
    getFacultyComplaints,
    updateComplaint,
    deleteComplaint,
    assignComplaintToFaculty,
    updateComplaintStatus 
} = require("../controllers/complaintController");

// Create complaint
router.post("/", auth, upload.array("files"), createComplaint);

// Get own complaints
router.get("/", auth, getStudentComplaints);

//  Admin Get All Complaints
router.get("/all", auth, getAllComplaints);

// Faculty Get Assigned Complaints
router.get("/faculty", auth, getFacultyComplaints);

// Update complaint details
router.put("/:id", auth, updateComplaint);

// Delete complaint
router.delete("/:id", auth, deleteComplaint);

// ---- Admin Assign Complaint to Faculty ----
router.post("/:id/assign", auth, assignComplaintToFaculty);

// ---- Admin Update Complaint Status ----
router.patch("/:id", auth, updateComplaintStatus);

module.exports = router;
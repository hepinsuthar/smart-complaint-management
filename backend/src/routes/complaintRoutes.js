const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const auth = require("../middleware/authMiddleware");
const { 
    createComplaint, 
    getStudentComplaints, 
    getAllComplaints, 
    updateComplaintStatus 
} = require("../controllers/complaintController");

// Create complaint
router.post("/", auth, upload.array("files"), createComplaint);

// Get own complaints
router.get("/", auth, getStudentComplaints);

//  Admin Get All Complaints
router.get("/all", auth, getAllComplaints);

// ---- Admin Update Complaint Status ----
router.patch("/:id", auth, updateComplaintStatus);

module.exports = router;
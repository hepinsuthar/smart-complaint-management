const express = require("express");
const router = express.Router();

const {
    signup,
    studentLogin,
    adminLogin,
    changePassword,
} = require("../controllers/authController.js");
const auth = require("../middleware/authMiddleware.js");

router.post("/signup", signup);
router.post("/student-login", studentLogin);
router.post("/admin-login", adminLogin);
router.post("/change-password", auth, changePassword);
module.exports = router;

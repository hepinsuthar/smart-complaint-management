const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const hasRequiredValue = (value) => {
  if (typeof value === "string") return value.trim() !== "";
  return Boolean(value);
};

const isProfileComplete = (user) => {
  return Boolean(
    hasRequiredValue(user.fullName) &&
    hasRequiredValue(user.college) &&
    hasRequiredValue(user.degree) &&
    hasRequiredValue(user.branch) &&
    hasRequiredValue(user.semester) &&
    hasRequiredValue(user.batch) &&
    hasRequiredValue(user.rollNumber) &&
    hasRequiredValue(user.dob) &&
    hasRequiredValue(user.studentMobile) &&
    hasRequiredValue(user.address) &&
    hasRequiredValue(user.fatherName) &&
    hasRequiredValue(user.fatherMobile) &&
    hasRequiredValue(user.motherName) &&
    hasRequiredValue(user.motherMobile) &&
    hasRequiredValue(user.profileImage)
  );
};

const handleProfileUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) {
    return upload.single("profileImage")(req, res, next);
  }

  return next();
};

  //  GET PROFILE

router.get("/faculties", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const faculties = await User.find({ role: "faculty" }).select("_id name email department designation").sort({ name: 1 });
    res.json(faculties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(user);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server Error"
    });

  }
});

  //  UPDATE PROFILE

router.put(
  "/profile",
  auth,
  handleProfileUpload,
  async (req, res) => {

    try {

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          error: "User not found"
        });
      }

      const {

        fullName,
        college,
        degree,
        branch,
        semester,
        batch,
        rollNumber,
        dob,
        gender,
        bloodGroup,
        studentMobile,
        address,
        city,
        state,
        pincode,
        fatherName,
        fatherMobile,
        motherName,
        motherMobile

      } = req.body;

      user.fullName = fullName || "";
      user.college = college || "";
      user.degree = degree || "";
      user.branch = branch || "";
      user.semester = semester || "";
      user.batch = batch || "";
      user.rollNumber = rollNumber || "";
      user.dob = dob || "";
      user.gender = gender || "";
      user.bloodGroup = bloodGroup || "";
      user.studentMobile = studentMobile || "";
      user.address = address || "";
      user.city = city || "";
      user.state = state || "";
      user.pincode = pincode || "";
      user.fatherName = fatherName || "";
      user.fatherMobile = fatherMobile || "";
      user.motherName = motherName || "";
      user.motherMobile = motherMobile || "";

      if (req.file) {

        user.profileImage = `/uploads/${req.file.filename}`;

      }

      // PROFILE COMPLETION CHECK

      user.profileCompleted = isProfileComplete(user);

      await user.save();

      res.json({

        message: "Profile Updated Successfully",

        profileCompleted: user.profileCompleted,

        user

      });

    }

    catch (err) {

      console.error(err);

      res.status(500).json({

        error: "Server Error"

      });

    }

  }
);

router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
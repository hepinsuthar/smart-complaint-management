const User = require("../models/User");

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

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      profile: user,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// UPDATE PROFILE

exports.updateProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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

    user.fullName = fullName;
    user.college = college;
    user.degree = degree;
    user.branch = branch;
    user.semester = semester;
    user.batch = batch;
    user.rollNumber = rollNumber;
    user.dob = dob;
    user.gender = gender;
    user.bloodGroup = bloodGroup;
    user.studentMobile = studentMobile;
    user.address = address;
    user.city = city;
    user.state = state;
    user.pincode = pincode;
    user.fatherName = fatherName;
    user.fatherMobile = fatherMobile;
    user.motherName = motherName;
    user.motherMobile = motherMobile;

    // Upload Profile Image
    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    // Check Profile Completion
    user.profileCompleted = isProfileComplete(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: user,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};
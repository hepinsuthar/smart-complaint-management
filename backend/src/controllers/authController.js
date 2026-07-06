const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../utils/emailService");

const signup = async (req, res) => {
  try {
    const { name, prn, email, password } = req.body;

    if (!name || !prn || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { prn }] });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      prn,
      email,
      password,
      role: "student",
    });

    // Send welcome email
    const emailResult = await sendWelcomeEmail(name, email, prn);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      emailSent: emailResult.success,
    });

  } catch (error) {
    console.error("🔥 Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ------------------ Student Login ------------------
const studentLogin = async (req, res) => {
  try {
    const { prn, password } = req.body;

    const user = await User.findOne({ 
      prn: prn.trim(), 
      role: "student" 
    });
    if (!user) return res.status(400).json({ error: "Student not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ------------------ Faculty Login ------------------
const facultyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "faculty" });
    if (!user) return res.status(400).json({ error: "Faculty not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ------------------ Admin Login ------------------
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "admin" });
    if (!user) return res.status(400).json({ error: "Admin not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ------------------ Auto Create Admin ------------------
const createDefaultAdmin = async () => {
  try {
    const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (!exists) {
      await User.create({
        name: "Admin",
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: "admin",
      });

      console.log("✅ Default admin created");
    }
  } catch (err) {
    console.log("Admin creation error:", err);
  }
};

const createDefaultFaculty = async () => {
  try {
    const faculties = [
      {
        name: process.env.HOSTEL_FACULTY_NAME,
        email: process.env.HOSTEL_FACULTY_EMAIL,
        password: process.env.HOSTEL_FACULTY_PASSWORD,
        department: process.env.HOSTEL_FACULTY_DEPARTMENT,
        designation: process.env.HOSTEL_FACULTY_DESIGNATION,
        employeeId: process.env.HOSTEL_FACULTY_EMPLOYEE_ID,
      },
      {
        name: process.env.ACADEMIC_FACULTY_NAME,
        email: process.env.ACADEMIC_FACULTY_EMAIL,
        password: process.env.ACADEMIC_FACULTY_PASSWORD,
        department: process.env.ACADEMIC_FACULTY_DEPARTMENT,
        designation: process.env.ACADEMIC_FACULTY_DESIGNATION,
        employeeId: process.env.ACADEMIC_FACULTY_EMPLOYEE_ID,
      },
      {
        name: process.env.IT_FACULTY_NAME,
        email: process.env.IT_FACULTY_EMAIL,
        password: process.env.IT_FACULTY_PASSWORD,
        department: process.env.IT_FACULTY_DEPARTMENT,
        designation: process.env.IT_FACULTY_DESIGNATION,
        employeeId: process.env.IT_FACULTY_EMPLOYEE_ID,
      },
      {
        name: process.env.LIBRARY_FACULTY_NAME,
        email: process.env.LIBRARY_FACULTY_EMAIL,
        password: process.env.LIBRARY_FACULTY_PASSWORD,
        department: process.env.LIBRARY_FACULTY_DEPARTMENT,
        designation: process.env.LIBRARY_FACULTY_DESIGNATION,
        employeeId: process.env.LIBRARY_FACULTY_EMPLOYEE_ID,
      },
      {
        name: process.env.TRANSPORT_FACULTY_NAME,
        email: process.env.TRANSPORT_FACULTY_EMAIL,
        password: process.env.TRANSPORT_FACULTY_PASSWORD,
        department: process.env.TRANSPORT_FACULTY_DEPARTMENT,
        designation: process.env.TRANSPORT_FACULTY_DESIGNATION,
        employeeId: process.env.TRANSPORT_FACULTY_EMPLOYEE_ID,
      },
      {
        name: process.env.MESS_FACULTY_NAME,
        email: process.env.MESS_FACULTY_EMAIL,
        password: process.env.MESS_FACULTY_PASSWORD,
        department: process.env.MESS_FACULTY_DEPARTMENT,
        designation: process.env.MESS_FACULTY_DESIGNATION,
        employeeId: process.env.MESS_FACULTY_EMPLOYEE_ID,
      },
      {
        name: process.env.OTHER_FACULTY_NAME,
        email: process.env.OTHER_FACULTY_EMAIL,
        password: process.env.OTHER_FACULTY_PASSWORD,
        department: process.env.OTHER_FACULTY_DEPARTMENT,
        designation: process.env.OTHER_FACULTY_DESIGNATION,
        employeeId: process.env.OTHER_FACULTY_EMPLOYEE_ID,
      },
    ];

    for (const faculty of faculties) {
      const exists = await User.findOne({
        email: faculty.email,
      });

      if (!exists) {
        await User.create({
          name: faculty.name,
          email: faculty.email,
          password: faculty.password,
          role: "faculty",
          department: faculty.department,
          designation: faculty.designation,
          employeeId: faculty.employeeId,
        });

        console.log(`✅ Faculty Created : ${faculty.name}`);
      }
    }
  } catch (err) {
    console.log(err);
  }
};
// ------------------ Change Password ------------------
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ------------------ Exports ------------------
module.exports = {
  signup,
  studentLogin,
  facultyLogin,
  adminLogin,
  createDefaultAdmin,
  createDefaultFaculty,
  changePassword,
};

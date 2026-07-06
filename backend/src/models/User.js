const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: function () {
        return this.role === "admin";
      },
      lowercase: true,
      trim: true,
    },

    prn: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      unique: true,
      sparse: true,
      trim: true,
    },

    college: { type: String, default: "" },
    degree: { type: String, default: "" },
    branch: { type: String, default: "" },
    semester: { type: String, default: "" },
    batch: { type: String, default: "" },
    rollNumber: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    studentMobile: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    fatherMobile: { type: String, default: "" },
    motherName: { type: String, default: "" },
    motherMobile: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student",
    },
    department: { type: String, default: "" },
    designation: { type: String, default: "" },
    employeeId: { type: String, default: "" },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);

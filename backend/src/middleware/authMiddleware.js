const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select("role");

    req.user = {
      _id: decoded.id || decoded._id,
      id: decoded.id || decoded._id,
      role: decoded.role || user?.role || "student",
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

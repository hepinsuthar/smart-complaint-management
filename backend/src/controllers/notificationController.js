const mongoose = require("mongoose");
const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.error("Notification fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.id;

    const notification = await Notification.findOne({
      _id: targetId,
      userId: mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Notification.findByIdAndDelete(targetId);

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Notification delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
